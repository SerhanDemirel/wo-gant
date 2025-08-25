import { useMemo } from 'react'
import type { Operation } from '../types'
import Lane from './Lane'
import NowLine from './NowLine'

type Props = {
  machines: string[]
  operations: Operation[]
  selectedWorkOrderId: string | null
  onSelectWorkOrder: (id: string | null) => void
}

function floorToMinutes(d: Date, step: number) {
  const ms = d.getTime()
  const stepMs = step * 60_000
  return new Date(Math.floor(ms / stepMs) * stepMs)
}
function ceilToMinutes(d: Date, step: number) {
  const ms = d.getTime()
  const stepMs = step * 60_000
  return new Date(Math.ceil(ms / stepMs) * stepMs)
}

export default function Timeline({ machines, operations, selectedWorkOrderId, onSelectWorkOrder }: Props) {
  const allStarts = operations.map(o => new Date(o.start))
  const allEnds = operations.map(o => new Date(o.end))
  const minStart = new Date(Math.min(...allStarts.map(d => d.getTime())))
  const maxEnd = new Date(Math.max(...allEnds.map(d => d.getTime())))

  const padMin = 20
  const startPad = new Date(minStart.getTime() - padMin * 60_000)
  const endPad = new Date(maxEnd.getTime() + padMin * 60_000)

  const scaleStart = floorToMinutes(startPad, 10)
  const scaleEnd = ceilToMinutes(endPad, 10)

  const minutesTotal = (scaleEnd.getTime() - scaleStart.getTime()) / 60000
  const pxPerMinute = 2
  const contentWidth = minutesTotal * pxPerMinute

  const ticks = useMemo(() => {
    const arr: {left: number, label: string}[] = []
    for (let t = new Date(scaleStart); t <= scaleEnd; t = new Date(t.getTime() + 30*60_000)) {
      const minutesFromStart = (t.getTime() - scaleStart.getTime()) / 60000
      const left = minutesFromStart * pxPerMinute
      const hh = String(t.getUTCHours()).padStart(2,'0')
      const mm = String(t.getUTCMinutes()).padStart(2,'0')
      arr.push({ left, label: `${hh}:${mm}Z` })
    }
    return arr
  }, [scaleStart, scaleEnd])

  return (
    <div
      className="timeline-root"
      onClick={(e) => { if (e.currentTarget === e.target) onSelectWorkOrder(null) }}
    >
      <div className="timeline-header" style={{minWidth: contentWidth + 120}}>
        <div className="header-scale" style={{marginLeft: 120, width: contentWidth, position:'relative'}}>
          {ticks.map((tk, i) => (
            <div key={i} className="scale-tick" style={{left: tk.left}}>{tk.label}</div>
          ))}
        </div>
      </div>

      <div className="lanes" style={{minWidth: contentWidth + 120, position:'relative'}}>
        {machines.map(m => (
          <Lane
            key={m}
            machineId={m}
            operations={operations.filter(o => o.machineId === m)}
            selectedWorkOrderId={selectedWorkOrderId}
            onSelectWorkOrder={onSelectWorkOrder}
            scaleStart={scaleStart}
            pxPerMinute={pxPerMinute}
          />
        ))}

        <NowLine scaleStart={scaleStart} pxPerMinute={pxPerMinute} contentWidth={contentWidth} />
      </div>
    </div>
  )
}

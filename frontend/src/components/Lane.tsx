import type { Operation } from '../types'

type Props = {
  machineId: string
  operations: Operation[]
  selectedWorkOrderId: string | null
  onSelectWorkOrder: (id: string | null) => void
  scaleStart: Date
  pxPerMinute: number
}

export default function Lane({ machineId, operations, selectedWorkOrderId, onSelectWorkOrder, scaleStart, pxPerMinute }: Props) {
  const bars = operations.map(op => {
    const start = new Date(op.start)
    const end = new Date(op.end)
    const left = ((start.getTime() - scaleStart.getTime()) / 60000) * pxPerMinute
    const width = ((end.getTime() - start.getTime()) / 60000) * pxPerMinute
    const label = `${op.workOrderId} · ${op.name}`
    const isHL = selectedWorkOrderId === op.workOrderId
    return (
      <div
        key={op.id}
        className={"bar" + (isHL ? " highlight" : "")}
        style={{ left, width }}
        title={`${label}\n${op.start} — ${op.end} (UTC)`}
        onClick={(e) => { e.stopPropagation(); onSelectWorkOrder(op.workOrderId) }}
      >
        {label}
      </div>
    )
  })

  return (
    <div className="lane-row">
      <div className="lane-label">{machineId}</div>
      <div className="lane-track">
        {bars}
      </div>
    </div>
  )
}

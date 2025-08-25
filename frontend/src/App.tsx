import { useEffect, useMemo, useState } from 'react'
import { fetchWorkOrders } from './api'
import type { WorkOrder, Operation } from './types'
import Timeline from './components/Timeline'

export default function App() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [selectedWO, setSelectedWO] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        setLoading(true)
        const data = await fetchWorkOrders()
        setWorkOrders(data)
      } catch (e: any) {
        setError(e.message || 'Yükleme hatası')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const operations: Operation[] = useMemo(
    () => workOrders.flatMap(w => w.operations),
    [workOrders]
  )
  const machines = useMemo(
    () => Array.from(new Set(operations.map(o => o.machineId))).sort(),
    [operations]
  )

  return (
    <div className="container" style={{padding: 16, fontFamily: 'system-ui, sans-serif'}}>
      <div className="toolbar" style={{display:'flex', gap:8, alignItems:'center', marginBottom:12}}>
        <h2 style={{margin: 0}}>WO Gantt (UTC)</h2>
        {selectedWO && <button onClick={() => setSelectedWO(null)}>Clear highlight</button>}
        {error && <span style={{color:'crimson'}}>{error}</span>}
      </div>

      {loading ? <p>Loading…</p> : (
        <Timeline
          machines={machines}
          operations={operations}
          selectedWorkOrderId={selectedWO}
          onSelectWorkOrder={setSelectedWO}
        />
      )}
    </div>
  )
}

import type { WorkOrder } from './types'
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export async function fetchWorkOrders(): Promise<WorkOrder[]> {
  const res = await fetch(`${API_URL}/work-orders`)
  if (!res.ok) throw new Error('Work orders alınamadı')
  return res.json()
}

export async function updateOperation(opId: string, startISO: string, endISO: string) {
  const res = await fetch(`${API_URL}/operations/${opId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ start: startISO, end: endISO })
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.detail || 'Güncelleme başarısız')
  return data
}

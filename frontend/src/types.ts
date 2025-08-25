export type Operation = {
  id: string
  workOrderId: string
  index: number
  machineId: string
  name: string
  start: string  // ISO UTC
  end: string    // ISO UTC
}

export type WorkOrder = {
  id: string
  product: string
  qty: number
  operations: Operation[]
}

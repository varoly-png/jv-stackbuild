export function calcLineItemTotal(item) {
  const qty = Number(item.quantity) || 0
  const mat = Number(item.material_unit_cost) || 0
  const lab = Number(item.labor_unit_cost) || 0
  const sub = Number(item.subcontractor_cost) || 0
  return qty * (mat + lab) + sub
}

export function calcSubtotal(lineItems = []) {
  return lineItems.reduce((sum, item) => sum + calcLineItemTotal(item), 0)
}

export function calcEstimateTotal(lineItems = [], overheadPct = 0, profitPct = 0) {
  const subtotal = calcSubtotal(lineItems)
  const overhead = subtotal * (Number(overheadPct) / 100)
  const profit = (subtotal + overhead) * (Number(profitPct) / 100)
  return { subtotal, overhead, profit, total: subtotal + overhead + profit }
}

export function calcMaterialCost(item) {
  return (Number(item.quantity) || 0) * (Number(item.material_unit_cost) || 0)
}

export function calcLaborCost(item) {
  return (Number(item.quantity) || 0) * (Number(item.labor_unit_cost) || 0)
}

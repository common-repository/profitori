'Evaluation'.datatype()
'evaluationNumber'.field({key: true, caption: "Value Adjustment Number"})
'date'.field({date: true})
'product'.field({refersTo: 'products'})
'quantityOnHand'.field({numeric: true})
'inventoryValue'.field({numeric: true, decimals: 2})
'avgUnitCost'.field({numeric: true, minDecimals: 2, maxDecimals: 6})
'avgUnitCostExclTax'.field({numeric: true, minDecimals: 2, maxDecimals: 6})
'notes'.field({multiLine: true})
'inventoryValueExclTax'.field({numeric: true, decimals: 2})

'avgUnitCostExclTax'.afterUserChange(async (oldInputValue, newInputValue, evaluation) => {
  let exTax = evaluation.avgUnitCostExclTax
  if ( exTax === global.unknownNumber() ) return
  let product = await evaluation.referee('product'); if ( ! product ) return
  let taxPct = await product.toTaxPct()
  evaluation.avgUnitCost = global.roundToXDecimals(exTax * ( 1 + (taxPct / 100) ), 6)
})

'avgUnitCostExclTax'.calculateWhen(async evaluation => {
  let configuration = 'Configuration'.bringSingleFast(); if ( ! configuration ) return true
  return configuration.enterPurchasePricesInclusiveOfTax === 'Yes'
})

'avgUnitCostExclTax'.calculate(async evaluation => {
  let incTax = evaluation.avgUnitCost
  if ( incTax === global.unknownNumber() )
    return global.unknownNumber()
  let product = await evaluation.referee('product')
  if ( ! product ) return incTax
  let taxPct = await product.toTaxPct()
  let res = incTax / ( 1 + (taxPct / 100) )
  return res
})

'Evaluation'.method('ensureProdRefComplete', async function() {
  if ( ! this.product ) return
  if ( this.product.id ) return
  let product = await 'products'.bringFirst({uniqueName: this.product.keyval})
  if ( ! product ) 
    throw(new Error('Invalid product ' + this.product.keyval))
  this.product.id = product.id
})

'Evaluation'.beforeSaving(async function () {
  await this.ensureProdRefComplete()
  let inv = await 'Inventory'.bringOrCreate({product: this.product});
  let qty = inv.quantityOnHand
  if ( qty === 0 ) {
    inv.avgUnitCost = this.avgUnitCost
    return
  }
  let tran = await 'Transaction'.create()
  tran.product = this.product
  tran.date = this.date
  tran.quantity = - qty
  tran.source = 'Value Adjustment'
  tran.reference = this.evaluationNumber
  tran.unitCost = inv.avgUnitCost
  tran.notes = this.notes
  tran = await 'Transaction'.create()
  tran.product = this.product
  tran.date = this.date
  tran.quantity = qty
  tran.source = 'Value Adjustment'
  tran.reference = this.evaluationNumber
  tran.unitCost = this.avgUnitCost
  tran.notes = this.notes
})

'quantityOnHand'.calculate(async (evaluation) => {
  let inv = await 'Inventory'.bringSingle({product: evaluation.product}); if ( ! inv ) return 0
  let res = inv.quantityOnHand
  return res
})

'inventoryValue'.calculate(async (evaluation) => {
  return evaluation.quantityOnHand * evaluation.avgUnitCost
})

'inventoryValueExclTax'.calculate(async (evaluation) => {
  return evaluation.quantityOnHand * evaluation.avgUnitCostExclTax
})


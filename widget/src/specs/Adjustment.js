'Adjustment'.datatype()
'adjustmentNumber'.field({key: true})
'date'.field({date: true})
'product'.field({refersTo: 'products', allowEmpty: false})
'quantity'.field({numeric: true})
'quantityOnHand'.field({numeric: true})
'taxPct'.field({numeric: true, decimals: 2, caption: "Tax %"})
'unitCostIncTax'.field({numeric: true, minDecimals: 2, maxDecimals: 6, caption: "Unit Price (Inc Tax)"})
'lineCostIncTax'.field({numeric: true, minDecimals: 2, maxDecimals: 6, caption: "Line Total (Inc Tax)"})
'lineTax'.field({numeric: true, decimals: 2})
'location'.field({refersTo: 'Location', allowEmpty: false})
'hasLots'.field({yesOrNo: true})
'lotsAreSerials'.field({yesOrNo: true})
'notes'.field()
'reason'.field()

'reason'.options(['Lost', 'Damaged', 'Purchased outside of Profitori', 
  'Sold outside of Profitori', 'Exchanged for warranty', 'Theft', 'Shipped to wrong location', 'Supercession'])

'Adjustment'.method('createTransactionForAllotment', async function(a) {
  let chg = a.quantity - a.getOld().quantity
  if ( chg === 0 )
    return
  let newExtCost = a.quantity * this.unitCostIncTax
  let oldExtCost = a.getOld().quantity * this.getOld().unitCostIncTax
  let extCostChg = newExtCost - oldExtCost
  let tran = await 'Transaction'.create()
  tran.product = this.product
  tran.date = this.date
  tran.quantity = chg
  tran.source = 'Adjustment'
  tran.reference = this.adjustmentNumber
  tran.unitCost = (chg === 0) ? 0 : extCostChg / chg
  tran.location = global.copyObj(this.location)
  tran.lot = global.copyObj(a.lot)
  tran.notes = this.notes
  tran.taxPct = this.taxPct
})

'Adjustment'.method('checkSerialNotDuplicated', async function(allotment) {
  if ( this.lotsAreSerials !== 'Yes' ) return
  let lot = await allotment.toLot(); if ( ! lot ) return
  if ( lot.lotNumber === 'Unspecified' )
    return
  let otherAllotments = await 'Allotment'.bringChildrenOf(this)
  for ( var i = 0; i < otherAllotments.length; i++ ) {
    let oa = otherAllotments[i]
    if ( oa.id === allotment.id ) continue
    if ( oa.quantity <= 0 ) continue
    let oln = await oa.toLotNumber()
    if ( oln !== lot.lotNumber ) continue
    throw(new Error('You cannot specify the same serial number twice on the same adjustment'))
  }
})

'Adjustment'.method('toLocation', async function() {
  return await this.referee('location')
})

'Adjustment'.method('toCluster', async function() {
  let inv = await this.toInventory(); if ( ! inv ) return null
  let res = await inv.locationRefToCluster(this.location)
  return res
})

'quantity'.afterUserChange(async (oldInputValue, newInputValue, adj, maint) => {
  await adj.refreshUnspecifiedLot()
})

'Adjustment'.method('toMainQuantity', async function() {
  return this.quantity
})

'Adjustment'.method('refreshUnspecifiedLot', async function() {
  if ( this.hasLots !== 'Yes' ) return
  let c = await 'Configuration'.bringFirst(); if ( ! c ) return
  await c.balanceAllotments(this)
})

'product'.afterUserChange(async (oldInputValue, newInputValue, adj, maint) => {
  await adj.refreshUnspecifiedLot()
})

'Adjustment'.method('toInventory', async function() {
  let product = await this.toProduct(); if ( ! product ) return null
  return await product.toInventory()
})

'Adjustment'.method('toProduct', async function() {
  return await this.referee('product')
})

'hasLots'.calculate(async adj => {
  let inv = await adj.toInventory(); if ( ! inv ) return 'No'
  let bres = inv.lotTracking && (inv.lotTracking !== 'None')
  let res = bres ? 'Yes' : 'No'
  return res
})

'lotsAreSerials'.calculate(async adj => {
  let inv = await adj.toInventory(); if ( ! inv ) return 'No'
  let bres = inv.lotTracking === 'Serial'
  let res = bres ? 'Yes' : 'No'
  return res
})

'location'.inception(async adjustment => {
  let res = await 'Location'.bringSingle({locationName: 'General'})
  return res.reference()
})

'quantityOnHand'.calculate(async (adjustment) => {
  let inv = await 'Inventory'.bringSingle({product: adjustment.product}); if ( ! inv ) return 0
  let res = inv.quantityOnHand
  return res
})

'Adjustment'.beforeSaving(async function () {
  if ( this.hasLots === 'Yes' ) return
  let chg = this.quantity - this.getOld().quantity; if ( chg === 0 ) return
  let newExtCost = this.quantity * this.unitCostIncTax
  let oldExtCost = this.getOld().quantity * this.getOld().unitCostIncTax
  let extCostChg = newExtCost - oldExtCost
  let tran = await 'Transaction'.create()
  tran.product = this.product
  tran.date = this.date
  tran.quantity = chg
  tran.source = 'Adjustment'
  tran.reference = this.adjustmentNumber
  tran.unitCost = (chg === 0) ? 0 : extCostChg / chg
  tran.notes = this.notes
  tran.location = this.location
  tran.taxPct = this.taxPct
})

'Adjustment'.method("getLineTaxUnrounded",
  function() {
    let rate = this.taxPct / 100
    let factor = rate / (1 + rate)
    let res = this.lineCostIncTax * factor
    return res
  }
)

'lineCostIncTax'.calculate(async (adjustment) => {
  let res = global.roundTo2Decimals(adjustment.unitCostIncTax * adjustment.quantity)
  return res
})

'lineTax'.calculate(async (adjustment) => {
  let res = adjustment.getLineTaxUnrounded()
  res = global.roundTo2Decimals(res)
  return res
})

'taxPct'.inception(async adjustment => {
  let config = await 'Configuration'.bringSingle(); if ( ! config ) return 0
  return config.taxPct
})


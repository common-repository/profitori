'Transfer'.datatype()
'transferNumber'.field({key: true})
'date'.field({date: true})
'product'.field({refersTo: 'products'})
'quantity'.field({numeric: true, caption: "Quantity to Transfer", allowEmpty: false})
'fromLocation'.field({refersTo: 'Location', allowEmpty: false})
'toLocation'.field({refersTo: 'Location', allowEmpty: false})
'notes'.field()
'hasLots'.field({yesOrNo: true})
'lotsAreSerials'.field({yesOrNo: true})
'fromLocationQuantityOnHand'.field({numeric: true})

'fromLocationQuantityOnHand'.calculate(async tfr => {
  let product = await tfr.toProduct(); if ( ! product ) return 0
  let loc = await tfr.toFromLocation(); if ( ! loc ) return 0
  return await product.locationToQuantityOnHand(loc)
})

'Transfer'.method('toFromLocation', async function() {
  return await this.referee('fromLocation')
})

'quantity'.afterUserChange(async (oldInputValue, newInputValue, tfr, maint) => {
  await tfr.refreshUnspecifiedLot()
})

'product'.afterUserChange(async (oldInputValue, newInputValue, tfr, maint) => {
  await tfr.refreshUnspecifiedLot()
})

'fromLocation'.afterUserChange(async (oldInputValue, newInputValue, tfr, maint) => {
  await tfr.refreshUnspecifiedLot()
})

'toLocation'.afterUserChange(async (oldInputValue, newInputValue, tfr, maint) => {
  await tfr.refreshUnspecifiedLot()
})

'Transfer'.method('refreshUnspecifiedLot', async function() {
  if ( this.hasLots !== 'Yes' ) return
  let c = await 'Configuration'.bringFirst(); if ( ! c ) return
  await c.balanceAllotments(this)
})

'Transfer'.method('getLocation', async function() {
  return await this.referee('toLocation')
})

'Transfer'.method('toCluster', async function() {
  let inv = await this.toInventory(); if ( ! inv ) return null
  let res = await inv.locationRefToCluster(this.toLocation)
  return res
})

'Transfer'.method('toMainQuantity', async function() {
  return this.quantity
})

'hasLots'.calculate(async tfr => {
  let inv = await tfr.toInventory(); if ( ! inv ) return 'No'
  let bres = inv.lotTracking && (inv.lotTracking !== 'None')
  let res = bres ? 'Yes' : 'No'
  return res
})

'lotsAreSerials'.calculate(async tfr => {
  let inv = await tfr.toInventory(); if ( ! inv ) return 'No'
  let bres = inv.lotTracking === 'Serial'
  let res = bres ? 'Yes' : 'No'
  return res
})

'Transfer'.method('createTransactionForAllotment', async function(a) {
  let chg = a.quantity - a.getOld().quantity
  if ( chg === 0 )
    return
  let inv = await this.toInventory()
  let avgUnitCost = inv ? inv.avgUnitCost : global.unknownNumber()
  let fromTran = await 'Transaction'.create()
  fromTran.product = this.product
  fromTran.date = this.date
  fromTran.quantity = - chg
  fromTran.source = 'Transfer'
  fromTran.reference = this.transferNumber
  fromTran.unitCost = avgUnitCost
  fromTran.notes = this.notes
  fromTran.location = this.fromLocation
  fromTran.lot = a.lot
  let toTran = await 'Transaction'.create()
  toTran.product = this.product
  toTran.date = this.date
  toTran.quantity = chg
  toTran.source = 'Transfer'
  toTran.reference = this.transferNumber
  toTran.unitCost = avgUnitCost
  toTran.notes = this.notes
  toTran.location = this.toLocation
  toTran.lot = a.lot
})

'Transfer'.method('checkSerialNotDuplicated', async function(allotment) {
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
    throw(new Error('You cannot specify the same serial number twice on the same transfer'))
  }
})

'Transfer'.beforeSaving(async function () {
  let fromLocName = this.fromLocation && this.fromLocation.keyval
  let toLocName = this.toLocation && this.toLocation.keyval
  if ( fromLocName === toLocName ) 
    throw(new Error("The locations must be different"))
  if ( this.hasLots === 'Yes' ) return
  let chg = this.quantity - this.getOld().quantity; if ( chg === 0 ) return
  let inv = await this.toInventory()
  let avgUnitCost = inv ? inv.avgUnitCost : global.unknownNumber()
  let fromTran = await 'Transaction'.create()
  fromTran.product = this.product
  fromTran.date = this.date
  fromTran.quantity = - chg
  fromTran.source = 'Transfer'
  fromTran.reference = this.transferNumber
  fromTran.unitCost = avgUnitCost
  fromTran.notes = this.notes
  fromTran.location = this.fromLocation
  let toTran = await 'Transaction'.create()
  toTran.product = this.product
  toTran.date = this.date
  toTran.quantity = chg
  toTran.source = 'Transfer'
  toTran.reference = this.transferNumber
  toTran.unitCost = avgUnitCost
  toTran.notes = this.notes
  toTran.location = this.toLocation
})

'Transfer'.method('toInventory', async function () {
  let product = await this.toProduct(); if ( ! product ) return null
  return await product.toInventory()
})

'Transfer'.method('toProduct', async function() {
  return await this.referee('product')
})

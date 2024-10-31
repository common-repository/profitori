'SOLine'.datatype({caption: 'Sales Order Line', alwaysDoAfterRetrieve: true})
'salesOrder'.field({refersToParent: 'SO', parentIsHeader: true})
'order_item_id'.field({numeric: true, indexed: true})
'descriptionAndSKU'.field({caption: 'Description'})
'shipToStateAndCountry'.field()
'shipFromLocation'.field({refersTo: 'Location'})
'packable'.field()
'fulfillStage'.field()
'priority'.field()
'notes'.field({multiLine: true, caption: 'Our Notes'})
'quantityOrdered'.field({numeric: true})
'quantityRemainingToShip'.field({numeric: true})
'quantityPickable'.field({numeric: true})
'quantityPackable'.field({numeric: true})
'quantityToPick'.field({numeric: true})
'quantityToPack'.field({numeric: true})
'quantityShipped'.field({numeric: true})
'quantityToPickEntered'.field({yesOrNo: true})
'quantityAllocated'.field({numeric: true, caption: 'Quantity Allocated for Picking'})
'product'.field({refersTo: 'products'})
'sequence'.field({caption: 'Line No'})
'parentSOLine'.field({refersTo: 'SOLine'})
'quantityMakeable'.field({numeric: true})
'quantityToMake'.field({numeric: true})
'quantityToMakeEntered'.field({yesOrNo: true})
'quantityAllocatedForMaking'.field({numeric: true})
'productIsBundle'.field({yesOrNo: true})
'hasLots'.field({yesOrNo: true})
'lotsAreSerials'.field({yesOrNo: true})
'quantityShippedIncremental'.field({numeric: true, caption: 'This Shipment Qty'})

'SOLine'.method('isActive', async function() {
  let so = await this.toSO(); if ( ! so ) return false
  return await so.isActive()
})

'SOLine'.method('isActiveFast', async function() {
  let so = this.toSOFast()
  if ( (! so) || (so === 'na') )
    return 'na'
  return so.isActiveFast()
})

/* eslint-disable eqeqeq */

'SOLine'.method('toUnitPriceExclTax', async function() {
  let order_item = await this.toOrderItem(); if ( ! order_item ) return 0
  if ( ! order_item._qty ) return 0
  return order_item._line_total / order_item._qty
})

'quantityShippedIncremental'.afterUserChange(async (oldInputValue, newInputValue, line) => {
  line.quantityShipped = (await line.toQtyShippedOnOtherShipments()) + line.quantityShippedIncremental
  await line.processQuantityShippedChange()
})

'SOLine'.afterRetrieving(async function() {
  this.quantityShippedIncremental = this.quantityShipped - (await this.toQtyShippedOnOtherShipments())
})

'SOLine'.afterRetrievingFast(function() {
  let so = this.toSOFast()
  if ( (! so) || (so === 'na') )
    return false
  if ( so.retired === 'Yes' )
    return true
  return false
})

'SOLine'.method('toQtyShippedOnOtherShipments',  async function() {
  return 0
})

'SOLine'.method('adjustLotQuantities', async function() {

  let createTran = async (qty, lot) => {
    let product = await this.toProduct(); if ( ! product ) return
    let so = await this.toSO()
    let loc = await this.toShipFromLocation()
    let tran = await 'Transaction'.create()
    tran.product = product.reference()
    tran.date = so.orderDate
    tran.quantity = qty
    tran.source = 'Serial/Lot Sale'
    tran.reference = so.order.id
    tran.notes = 'Lot adjustment on order completion'
    tran.location = loc.reference()
    if ( lot )
      tran.lot = lot.reference()
  }

  if ( this.hasLots !== 'Yes' ) return
  let allotments = await 'Allotment'.bringChildrenOf(this)
  for ( var i = 0; i < allotments.length; i++ ) {
    let a = allotments[i]
    let lot = await a.toLot()
    if ( lot.lotNumber === 'Unspecified' ) continue
    await createTran(- a.quantity, lot)
    await createTran(a.quantity, null)
  }
})

'SOLine'.method('toLocation', async function() {
  return await this.toShipFromLocation()
})

'SOLine'.method('toLocationFast', function() {
  return this.toShipFromLocationFast()
})

'SOLine'.method('toMainQuantity', async function() {
  return this.quantityShipped
})

'SOLine'.method('refreshUnspecifiedLot', async function() {
  if ( this.hasLots !== 'Yes' ) return
  let c = await 'Configuration'.bringFirst(); if ( ! c ) return
  await c.balanceAllotments(this)
})

'SOLine'.method('checkSerialNotDuplicated', async function(allotment) {
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
    throw(new Error('You cannot specify the same serial number twice on the same Sales Order Line'))
  }
})

'hasLots'.calculate(async soLine => {
  let inv = await soLine.toInventory(); if ( ! inv ) return 'No'
  let bres = inv.lotTracking && (inv.lotTracking !== 'None')
  let res = bres ? 'Yes' : 'No'
  return res
})

'lotsAreSerials'.calculate(async soLine => {
  let inv = await soLine.toInventory(); if ( ! inv ) return 'No'
  let bres = inv.lotTracking === 'Serial'
  let res = bres ? 'Yes' : 'No'
  return res
})

'SOLine'.method('processQuantityShippedChange', async function() {
  await this.refreshUnspecifiedLot()
  let so = await this.toSO(); if ( ! so ) return
  await so.maybeAutoSetWCStatus()
})

'quantityShipped'.afterUserChange(async (oldInputValue, newInputValue, line) => {
  await line.processQuantityShippedChange()
})

'shipFromLocation'.afterUserChange(async (oldInputValue, newInputValue, line) => {
  await line.refreshUnspecifiedLot()
  let c = await 'Configuration'.bringFirst()
  await c.refreshPackables()
})

'quantityPackable'.calculate(line => {
  return line.quantityPickable + line.quantityMakeable
})

'quantityToPack'.calculate(line => {
  let res = line.quantityToPick + line.quantityToMake
  return res
})

'quantityToPick'.afterUserChange(async (oldInputValue, newInputValue, line) => {
  if ( (! oldInputValue) && (! newInputValue) ) return
  if ( oldInputValue == newInputValue ) return
  line.quantityToPickEntered = (newInputValue !== '') ? 'Yes' : 'No'
  if ( line.quantityAllocated > line.quantityToPick ) {
    line.quantityAllocated = line.quantityToPick
    let c = await line.toCluster()
    await c.refreshQuantityAllocated()
  }
})

'quantityToMake'.afterUserChange(async (oldInputValue, newInputValue, line) => {
  if ( (! oldInputValue) && (! newInputValue) ) return
  if ( oldInputValue == newInputValue ) return
  line.quantityToMakeEntered = (newInputValue !== '') ? 'Yes' : 'No'
  if ( line.quantityAllocatedForMaking > line.quantityToMake ) {
    line.quantityAllocatedForMaking = line.quantityToMake
    let c = await line.toCluster()
    await c.refreshQuantityAllocated()
  }
  await line.refreshPackable()
})

'SOLine'.method('toTopParentSOLine', async function() {
  let parent = await this.referee('parentSOLine'); 
  if ( ! parent )
    return this
  return await parent.toTopParentSOLine()
})

'SOLine'.method('toProductUniqueName', async function() {
  let p = await this.toProduct(); if ( ! p ) return null
  return p.uniqueName
})

'SOLine'.method('toShipFromLocation', async function() {
  return await this.referee('shipFromLocation')
})

'SOLine'.method('toShipFromLocationFast', function() {
  return this.refereeFast('shipFromLocation')
})

'descriptionAndSKU'.calculate(async (soLine) => {
  let res = await soLine.toProductUniqueName()
  return res
})

'SOLine'.method('toProduct', async function() {
  return await this.referee('product')
})

'SOLine'.method('toOrderItemFast', function () {
  let mold = global.foreman.doNameToMold('order_items')
  if ( ! this.order_item_id )
    return null
  let res = mold.fastRetrieveSingle({id: this.order_item_id});
  if ( res === 'na' ) return null
  return res
})

'SOLine'.method('toOrderItem', async function () {
  if ( ! this.order_item_id ) return null
  return await 'order_items.RecentOrActive'.bringSingle({id: this.order_item_id})
})

'quantityRemainingToShip'.calculate(line => {
  let res = line.quantityOrdered - line.quantityShipped
  if ( res < 0 )
    res = 0
  return res
})

'shipToStateAndCountry'.calculate(async line => {
  let so = await line.toSO(); if ( ! so ) return ''
  return so.shipToStateAndCountry
})

'SOLine'.method('toSO', async function() {
  return await this.referee('salesOrder')
})

'SOLine'.method('toSOFast', function() {
  return this.refereeFast('salesOrder')
})

'packable'.options(['Yes', 'Partially', 'No'])

'fulfillStage'.options(['Waiting', 'Waiting – Partially Shipped', 'Picking', 'Packing', 'Packed', 'Shipped'])

'fulfillStage'.inception('Waiting')

'priority'.options(['', '1', '2', '3', '4', '5', '6', '7', '8', '9'])

'SOLine'.method('refreshPackable', async function(opt) {
  let unallocate = opt && opt.unallocate
  if ( this.parentSOLine ) return
  await this.removeSublines()
  await this.refreshCalculations({force: true})
  this.packable = 'No'
  this.quantityAllocated = 0
  this.quantityAllocatedForMaking = 0
  this.quantityPickable = 0
  this.quantityMakeable = 0
  let cluster = await this.toCluster(); if ( ! cluster ) return
  await cluster.refreshQuantityAllocated()
  if ( ! unallocate ) {
    this.quantityPickable = cluster.quantityPickable - cluster.quantityAllocatedForPicking
    this.quantityMakeable = cluster.quantityMakeable - cluster.quantityAllocatedForMaking
  }
  await this.refreshCalculations({force: true})
  if ( this.quantityRemainingToShip <= 0 )
    this.packable = 'No'
  else if ( this.quantityPackable >= this.quantityRemainingToShip )
    this.packable = 'Yes'
  else if ( this.quantityPackable > 0 )
    this.packable = 'Partially'
  else
    this.packable = 'No'
  if ( (this.quantityToPickEntered !== 'Yes') || (this.quantityRemainingToShip < this.quantityToPick) || (this.quantityToPick > this.quantityPickable) ) {
    this.quantityToPick = Math.min(this.quantityPickable, this.quantityRemainingToShip)
    if ( this.quantityPickable < 0 ) 
      this.quantityToPick = 0
  }
  this.quantityAllocated = this.quantityToPick
  let rem = this.quantityRemainingToShip - this.quantityToPick
  if ( (this.quantityToMakeEntered !== 'Yes') || (rem < this.quantityToMake) || (this.quantityToMake > this.quantityMakeable) ) {
    this.quantityToMake = Math.min(this.quantityMakeable, rem)
    if ( this.quantityMakeable < 0 ) 
      this.quantityToMake = 0
  }
  this.quantityAllocatedForMaking = this.quantityToMake
  await this.addSublines()
  await this.refreshCalculations({force: true})
  await cluster.refreshQuantityAllocated()
  let inv = await this.toInventory()
  await inv.refreshQuantityAllocated() // just sums the clusters
})

'SOLine'.method('removeSublines', async function() {
  let so = await this.toSO(); if ( ! so ) return
  let lines = await 'SOLine'.bring({parentId: so.id})
  for ( var i = 0; i < lines.length; i++ ) {
    let line = lines[i]
    if ( ! line.parentSOLine ) continue
    let parent = await line.referee('parentSOLine'); if ( ! parent ) continue
    if ( (parent === this) || (parent.id === this.id) ) {
      await line.removeSublines()
      await line.trash()
    }
  }
})

'SOLine'.method('addSublines', async function() {
  let line = this
  line.productIsBundle = 'No'
  let bundle = await this.toBundle(); if ( ! bundle ) return
  line.productIsBundle = 'Yes'
  let location = await this.toShipFromLocation()
  let components = await bundle.toComponents()
  let so = await this.toSO();
  for ( var i = 0; i < components.length; i++ ) {
    let component = components[i]
    let product = await component.toProduct(); if ( ! product ) continue
    let subline = await 'SOLine'.create(null, {salesOrder: so})
    subline.parentSOLine = line.reference()
    subline.shipFromLocation = location.reference()
    subline.sequence = line.sequence + '.' + global.padWithZeroes(i + 1, 3)
    subline.order_item_id = line.order_item_id
    subline.product = product.reference()
    subline.packable = 'Yes'
    subline.fulfillStage = line.fulfillStage
    subline.priority = line.priority
    let quantityNeeded = line.quantityToMake * component.quantity
    subline.quantityOrdered = quantityNeeded
    let cluster = await subline.toCluster(); if ( ! cluster ) continue
    subline.quantityPickable = cluster.quantityPickable - cluster.quantityAllocatedForPicking
    subline.quantityToPick = Math.min(quantityNeeded, subline.quantityPickable)
    subline.quantityAllocated = subline.quantityToPick
    subline.quantityMakeable = cluster.quantityMakeable - cluster.quantityAllocatedForMaking
    subline.quantityToMake = quantityNeeded - subline.quantityToPick
    subline.quantityAllocatedForMaking = subline.quantityToMake
    await subline.addSublines()
  }
})

'SOLine'.method('toBundle', async function() {
  let product = await this.toProduct(); if ( ! product ) return null
  let res = await product.toBundle()
  return res
})

'shipFromLocation'.inception(async soLine => {
  let location = await 'Location'.bringOrCreate({locationName: 'General'})
  return location.reference()
})

'SOLine'.method('toInventory', async function() {
  let p = await this.toProduct(); if ( ! p ) return null
  let res = await p.toInventory()
  return res
})

'SOLine'.method('toCluster', async function() {
  let inv = await this.toInventory(); if ( ! inv ) return null
  let res = await inv.locationRefToCluster(this.shipFromLocation)
  return res
})

'descriptionAndSKU'.destination(async (soLine, productRef) => {
  return await soLine.toProduct()
})

'SOLine'.method('toOrder', async function() {
  let oi = await this.toOrderItem(); if ( ! oi ) return null
  return await oi.toOrder()
})

'SOLine'.method('toOrderId', async function() {
  let order = await this.toOrder(); if ( ! order ) return null
  return order.id
})

'SOLine'.method('toOrderDate', async function() {
  let order = await this.toOrder(); if ( ! order ) return global.emptyYMD()
  return order.order_date
})

'SOLine'.method('toSaleValue', async function() {
  let oi = await this.toOrderItem(); if ( ! oi ) return 0
  return oi.valueIncTax
})

'SOLine'.beforeFirstSave(async function() {
  global._deferRefreshAllocated = true
  global._inventoriesToRefresh = {}
})

'SOLine'.afterLastSave(async function() {
  global._deferRefreshAllocated = false
  let keys = Object.keys(global._inventoriesToRefresh)
  for ( var i = 0; i < keys.length; i++ ) {
    let key = keys[i]
    let inv = global._inventoriesToRefresh[key]
    await inv.refreshQuantityAllocated({refreshClusters: true})
  }
  global._inventoriesToRefresh = {}
})

'SOLine'.beforeSaving(async function() {

  let getOldShipFromLocationId = async () => {
    let ref = this.getOld().shipFromLocation; if ( ! ref ) return null
    return ref.id
  }

  let maybeMoveInventory = async () => {
    if ( this.parentSOLine ) return
    let loc = await this.toShipFromLocation(); if ( ! loc ) return
    let oldLocId = await getOldShipFromLocationId(); if ( ! oldLocId ) return
    let oldLoc = await 'Location'.bringSingle({id: oldLocId}); if ( ! oldLoc ) return
    if ( loc === oldLoc )
      return
    let product = await this.toProduct(); if ( ! product ) return
    let order = await this.toOrder(); if ( ! order ) return
    let nextNo = await 'NextNumber'.bringOrCreate({forDatatype: 'Transfer'})
    let tfrNo
    let tfr
    while ( true ) {
      nextNo.number = nextNo.number + 1
      let noStr = nextNo.number + ""
      tfrNo = "TF" + noStr.padStart(5, '0')
      tfr = await 'Transfer'.bringFirst({transferNumber: tfrNo})
      if ( ! tfr )
        break
    }
    tfr = await 'Transfer'.create(null, {transferNumber: tfrNo})
    tfr.date = global.todayYMD()
    tfr.fromLocation = loc.reference()
    tfr.toLocation = oldLoc.reference() // old location quantity increases, as the order is no longer coming from there
    tfr.product = product.reference()
    tfr.quantity = this.quantityOrdered
    tfr.notes = 'SO ' + order.id + ' Ship From Location change'
    if ( this.hasLots === 'Yes' ) {
      let config = await 'Configuration'.bringSingle(); if ( ! config ) return
      await config.balanceAllotments(tfr)
    }
  }

  let inv = await this.toInventory()
  if ( inv ) {
    await inv.refreshQuantityReservedForCustomerOrders({refreshClusters: true})
    await inv.refreshQuantityAllocated({refreshClusters: true})
  }
  //if ( this.quantityToPick > this.quantityRemainingToShip )
    //throw(new Error("Quantity to Pick cannot be more than Quantity Remaining To Ship"))
  if ( ! this._markedForDeletion )
    await maybeMoveInventory()
  //await updateJournalEntries()
})

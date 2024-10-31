'SO'.datatype({caption: 'Sales Order'})
'order'.field({refersTo: "orders.RecentOrActive", key: true})
'shipToStateAndCountry'.field()
'shipToPostalCode'.field()
'shipFromLocation'.field({refersTo: 'Location'})
'shippingNameAndCompany'.field()
'shippingAddress'.field()
'shippingEmailAndPhone'.field()
'packable'.field()
'fulfillStage'.field()
'priority'.field()
'notes'.field({multiLine: true, caption: 'Our Notes'})
'orderDate'.field({date: true})
'wcNiceStatus'.field({translateOnDisplay: true, caption: 'WC Status'})
'retired'.field({yesOrNo: true})

/* eslint-disable no-cond-assign */

'SO'.method('toValue', async function() {
  let order = await this.toOrder(); if ( ! order ) return
  return order._order_total
})

'SO'.method('toCustomer', async function() {
  let order = await this.toOrder(); if ( ! order ) return null
  return await order.toCustomer()
}) 

'SO'.method('hasBundles', async function() {
  let lines = await this.getLines()
  for ( var i = 0; i < lines.length; i++ ) {
    let line = lines[i]
    if ( line.parentSOLine )
      return true
  }
  return false
})

'SO'.method('zeroQuantitiesAllocated', async function() {
  let lines = await this.getLines()
  for ( var i = 0; i < lines.length; i++ ) {
    let line = lines[i]
    line.quantityAllocated = 0
    line.quantityAllocatedForMaking = 0
  }
})

'SO'.method('toOrderId', async function() {
  let order = await this.toOrder(); if ( ! order ) return null
  return order.id
})

'SO'.method('toSOLines', async function() {
  return await this.getLines()
})

'SO'.method('getLines', async function() {
  let res = await 'SOLine'.bringChildrenOf(this)
  return res
})

'shippingNameAndCompany'.calculate(async so => {
  let order = so.toOrderFast()
  if ( ! order )
    order = await so.toOrder() 
  if ( ! order ) return ''
  return order.shippingNameAndCompany
})

'shippingAddress'.calculate(async so => {
  let order = so.toOrderFast()
  if ( ! order )
    order = await so.toOrder() 
  if ( ! order ) return ''
  return order.shippingAddress
})

'shippingEmailAndPhone'.calculate(async so => {
  let order = so.toOrderFast()
  if ( ! order )
    order = await so.toOrder() 
  if ( ! order ) return ''
  return order.shippingEmailAndPhone
})

'fulfillStage'.afterUserChange(async (oldInputValue, newInputValue, so) => {

  let shiftPackingQtysToShipped = async () => {
    let lines = await so.getLines()
    for ( var i = 0; i < lines.length; i++ ) {
      let line = lines[i]
      if ( line.quantityToPack <= 0 ) continue
      if ( line.quantityShipped > 0 ) continue
      line.quantityShipped = line.quantityToPack
      line.quantityToPack = 0
    }
  }

  let lines = await so.getLines()
  for ( var i = 0; i < lines.length; i++ ) {
    let line = lines[i]
    line.fulfillStage = so.fulfillStage
  }
  if ( newInputValue === 'Shipped' )
    await shiftPackingQtysToShipped()
  await so.refreshPackable()
})

'priority'.afterUserChange(async (oldInputValue, newInputValue, so) => {
  let lines = await so.getLines()
  for ( var i = 0; i < lines.length; i++ ) {
    let line = lines[i]
    line.priority = so.priority
  }
})

'shipFromLocation'.afterUserChange(async (oldInputValue, newInputValue, so) => {

  let alterLineLocations = async () => {
    let lines = await so.getLines()
    for ( var i = 0; i < lines.length; i++ ) {
      let line = lines[i]
      line.shipFromLocation = so.shipFromLocation
    }
  }

  let refreshAffected = async () => {
    let lines = await so.getLines()
    for ( var i = 0; i < lines.length; i++ ) {
      let line = lines[i]
      let inv = await line.toInventory(); if ( ! inv ) continue
      await inv.refreshQuantityReservedForCustomerOrders({refreshClusters: true})
      await inv.refreshQuantityAllocated({refreshClusters: true}) // also does pickable and makeable
    }
  }

  await alterLineLocations()
  await global.foreman.doSave({msgOnException: true}) // important as this adjusts quantities on hand in the clusters
  await refreshAffected()
  let c = await 'Configuration'.bringFirst()
  await c.refreshPackables()
})

'SO'.method('isActive', async function() {
  let order = await this.toOrder(); if ( ! order ) return false
  return await order.isActive()
})

'SO'.method('isActiveFast', async function() {
  let order = await this.toOrderFast() 
  if ( (! order) || (order === 'na') )  
    return 'na'
  return order.isActiveFast()
})

'SO'.method('syncToOrder', async function(opt) {

  let existingLines
  let skipFulfillmentRefreshes = opt && opt.skipFulfillmentRefreshes

  let orderItemToSOLine = async (oi, soLines) => {
    for ( var i = 0; i < soLines.length; i++ ) {
      let line = soLines[i]
      if ( line.parentSOLine ) continue
      if ( line.order_item_id === oi.id )
        return line
    }
    return null
  }

  let markExistingLinesAsUntouched = async () => {
    for ( var i = 0; i < existingLines.length; i++ ) {
      let el = existingLines[i]
      el._touched = false
    }
  }

  let removeUntouchedLines = async () => {
    for ( var i = 0; i < existingLines.length; i++ ) {
      let el = existingLines[i]
      if ( el._touched ) continue
      await el.trash()
    }
  }

  let numberSimpleLines = async () => {
    let lines = await 'SOLine'.bring({parentId: this.id})
    for ( var i = 0; i < lines.length; i++ ) {
      let line = lines[i]
      line.sequence = global.padWithZeroes(i + 1, 3)
    }
  }

  let order = await this.toOrder(); if ( ! order ) return
  this.wcNiceStatus = order.niceStatus
  existingLines = await 'SOLine'.bring({parentId: this.id})
  await markExistingLinesAsUntouched()
  let ois = await 'order_items.RecentOrActive'.bring({theOrder: this.order})
  for ( var i = 0; i < ois.length; i++ ) {
    let oi = ois[i]
    let isActive = await oi.isActive()
    let line = await orderItemToSOLine(oi, existingLines)
    if ( line )
      line._touched = true
    if ( ! isActive ) continue
    if ( ! line ) 
      line = await 'SOLine'.create(null, {salesOrder: this})
    let product = await oi.toProduct(); if ( ! product ) continue
    line.order_item_id = oi.id
    line.product = product.reference()
    line.quantityOrdered = await oi.toQtyNetOfRefunds()
    await line.refreshCalculations()
    this.retired = 'No'
  }
  await removeUntouchedLines()
  await numberSimpleLines()
  if ( ! skipFulfillmentRefreshes )
    await this.refreshPackable()
})

'SO'.method('retire', async function() {
  let linesToInvs = async lines => {
    let res = {}
    for ( var i = 0; i < lines.length; i++ ) {
      let line = lines[i]
      let inv = await line.toInventory(); if ( ! inv ) continue
      res[inv.id] = inv
    }
    return res
  }

  let lines = await 'SOLine'.bring({parentId: this.id})
  let invs = await linesToInvs(lines)
  for ( let invId in invs ) {
    let inv = invs[invId]; if ( ! inv ) continue
    await inv.refreshQuantityReservedForCustomerOrders({refreshClusters: true})
  }
  await this.refreshPackable({unallocate: true})
  for ( let invId in invs ) {
    let inv = invs[invId]; if ( ! inv ) continue
    await inv.refreshQuantityReservedForCustomerOrders({refreshClusters: true})
  }
  this.retired = 'Yes'
})

'SO'.method('refreshPackable', async function(opt) {
  let lines = await 'SOLine'.bring({parentId: this.id})
  let fullyCount = 0
  let partialCount = 0
  let doneCount = 0
  for ( var i = 0; i < lines.length; i++ ) {
    let line = lines[i]
    await line.refreshPackable(opt)
    if ( line.packable === 'Yes' )
      fullyCount++
    else if ( line.packable === 'Partially' )
      partialCount++
    else if ( line.quantityRemainingToShip <= 0 )
      doneCount++
  }
  if ( (fullyCount > 0) && ((fullyCount + doneCount) === lines.length) )
    this.packable = 'Yes'
  else if ( (partialCount > 0) || (fullyCount > 0) )
    this.packable = 'Partially'
  else
    this.packable = 'No'
})

'shipFromLocation'.inception(async soLine => {
  let location = await 'Location'.bringOrCreate({locationName: 'General'})
  return location.reference()
})

'shipToStateAndCountry'.calculate(async so => {
  let order = so.toOrderFast()
  if ( ! order )
    order = await so.toOrder() 
  if ( ! order ) return ''
  let state = order._shipping_state
  let country = global.codeToCountry(order._shipping_country)
  let res = country
  if ( res && state )
    res += ' ' + state
  return res
})

'shipToPostalCode'.calculate(async so => {
  let order = so.toOrderFast()
  if ( ! order )
    order = await so.toOrder() 
  if ( ! order ) return ''
  return order._shipping_postcode
})

'SO'.method('toOrder', async function() {
  if ( ! this.order ) 
    return null
  let res = await 'orders.RecentOrActive'.bringSingle({id: this.order.id})
  return res
})

'SO'.method('toOrderFast', function () {
  if ( ! this.order )
    return null
  let mold = global.foreman.doNameToMold('orders')
  //let res = mold.fastRetrieveSingle({id: this.order.keyval});
  let res = mold.fastRetrieveSingle({id: this.order.id});
  if ( res === 'na' ) return null
  return res
})

'packable'.options(['Yes', 'Partially', 'No'])

'fulfillStage'.options(['Waiting', 'Waiting – Partially Shipped', 'Picking', 'Packing', 'Packed', 'Shipped'])

'fulfillStage'.inception('Waiting')

'priority'.options(['', '1', '2', '3', '4', '5', '6', '7', '8', '9'])

'SO'.method('refreshWCOrderStatus', async function() {
  let order = await this.toOrder() ; if ( ! order ) return
  order.status = 'wc-' + this.wcNiceStatus.toLowerCase()
  let items = await 'order_items.RecentOrActive'.bring({parentId: order.id})
  for ( var i = 0; i < items.length; i++ ) {
    let item = items[i]
    item.order_status = order.status
  }
})

'wcNiceStatus'.afterUserChange(async (oldInputValue, newInputValue, so) => {
  await so.refreshWCOrderStatus()
})

'SO'.beforeSaving(async function() {
  if ( this._markedForDeletion ) {
    await this.refreshQuantitiesReservedForCustomerOrders()
    return
  }
  if ( this.getOld().wcNiceStatus && (this.wcNiceStatus !== this.getOld().wcNiceStatus) ) {
    if ( this.wcNiceStatus === 'Completed' ) {
      if ( (! global.harmonizing) && (! global.refreshingPackables) ) {
        let ok = await this.doQuantitiesShippedMatchOrdered()
        if ( ! ok )
          throw(new Error('Quantity Shipped must equal Quantity Ordered before you can set the order to Completed'.translate()))
      }
      await this.adjustForDifferencesToPreempts()
      await this.adjustLotQuantities()
    }
    await this.refreshQuantitiesReservedForCustomerOrders()
  }
  await this.maybeAnnotateWCOrder()
})

'SO'.method('maybeAnnotateWCOrder', async function() {
  if ( global.confVal('annotatePartiallyDeliveredWCOrders') !== 'Yes' ) return
  let order = await this.toOrder(); if ( ! order ) return
  if ( await this.isFullyShipped() )
    order.partiallyDelivered = ''
  else if ( await this.hasPartiallyOrFullyShippedLines() ) {
    order.partiallyDelivered = 'Yes'
  } else
    order.partiallyDelivered = ''
})

'SO'.method('toShipFromLocation', async function() {
  return await this.referee('shipFromLocation')
})

'SO'.method('adjustLotQuantities', async function() {
  let lines = await this.getLines()
  for ( var i = 0; i < lines.length; i++ ) {
    let line = lines[i]
    await line.adjustLotQuantities()
  }
})

'SO'.method('refreshQuantitiesReservedForCustomerOrders', async function() {
  let lines = await this.getLines()
  for ( var i = 0; i < lines.length; i++ ) {
    let line = lines[i]
    let inv = await line.toInventory(); if ( ! inv ) continue
    await inv.refreshQuantityReservedForCustomerOrders({refreshClusters: true})
  }
})

'SO'.method('adjustForDifferencesToPreempts', async function() {

  let adjustStock = async (qty, line, pickOrMake) => {
    let loc = await line.toShipFromLocation()
    let product = await line.toProduct()
    let tran = await 'Transaction'.create()
    tran.product = product.reference()
    tran.date = global.todayYMD()
    tran.location = loc.reference()
    tran.quantity = qty
    tran.source = 'SO'
    tran.notes = pickOrMake.translate() + ' ' + 'adjustment on order completion'.translate()
    tran.reference = await this.toOrderId()
  }

  let lineToPreempted = async (line) => {
    let resObj = {made: 0, consumed: 0}
    if ( ! line.product ) return
    let preempts = await 'Preempt'.bring({order_item_id: line.order_item_id})
    for ( var i = 0; i < preempts.length; i++ ) {
      let preempt = preempts[i]
      if ( preempt.product_id !== line.product.id ) continue
      if ( preempt.finalised === 'Yes' ) continue
      if ( preempt.madeOrConsumed === 'consumed' )
        resObj.consumed -= preempt.quantity
      else
        resObj.made += preempt.quantity
      preempt.finalised = 'Yes'
    }
    return resObj
  }

  let lines = await this.getLines()
  for ( var i = 0; i < lines.length; i++ ) {
    let line = lines[i]
    let preempted = await lineToPreempted(line); if ( ! preempted ) continue
    if ( preempted.made !== line.quantityToMake )
      await adjustStock(line.quantityToMake - preempted.made, line, 'Make')
    if ( line.parentSOLine && (preempted.consumed !== line.quantityToPick) )
      await adjustStock(preempted.consumed - line.quantityToPick, line, 'Pick')
  }
})

'SO'.method('doQuantitiesShippedMatchPacked', async function() {
  let lines = await this.getLines()
  for ( var i = 0; i < lines.length; i++ ) {
    let line = lines[i]
    if ( line.quantityShipped !== line.quantityToPack ) {
      return false
    }
  }
  return true
})

'SO'.method('doQuantitiesShippedMatchOrdered', async function() {
  let lines = await this.getLines()
  for ( var i = 0; i < lines.length; i++ ) {
    let line = lines[i]
    if ( line.quantityShipped !== line.quantityOrdered ) {
      return false
    }
  }
  return true
})

'SO'.method('hasPartiallyOrFullyShippedLines', async function() {
  let lines = await this.getLines()
  for ( var i = 0; i < lines.length; i++ ) {
    let line = lines[i]
    if ( line.quantityShipped ) {
      return true
    }
  }
  return false
})

'SO'.method('isFullyShipped', async function() {
  let lines = await this.getLines()
  for ( var i = 0; i < lines.length; i++ ) {
    let line = lines[i]
    if ( line.quantityShipped < line.quantityOrdered ) {
      return false
    }
  }
  return true
})

'SO'.method('maybeAutoSetWCStatus', async function() {
  if ( ! await this.doQuantitiesShippedMatchOrdered() ) return
  if ( global.confVal('autoCompleteWCOrders') !== 'Yes' ) return
  this.wcNiceStatus = 'Completed'
  await this.refreshWCOrderStatus()
  let mold = global.foreman.doNameToMold('SO')
  mold.version++
})

'orderDate'.calculate(async so => {
  let order = so.toOrderFast()
  if ( ! order )
    order = await so.toOrder() 
  if ( ! order ) return null
  return order.order_date
})

'SO'.method('toFeesValueIncTax', async function() {
  let order = await this.toOrder(); if ( ! order ) return 0
  return order.feesIncTax
})

'SO'.method('toShippingValueIncTax', async function() {
  let order = await this.toOrder(); if ( ! order ) return 0
  return order.shippingIncTax
})

'SO'.method('toTaxValue', async function() {
  let order = await this.toOrder(); if ( ! order ) return 0
  return order._order_tax + order._order_shipping_tax
})


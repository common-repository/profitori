'Cluster'.datatype({exportable: true})
'inventory'.field({refersToParent: 'Inventory', key: true, nonUnique: true})
'location'.field({refersTo: 'Location'})
'uniqueName'.field({caption: 'Product'})
'product_id'.field()
'quantityOnHand'.field({numeric: true})
'quantityPackable'.field({numeric: true})
'quantityPackable2'.field({numeric: true})
'quantityOnPurchaseOrders'.field({numeric: true})
'avgUnitCost'.field({numeric: true, minDecimals: 2, maxDecimals: 6})
'inventoryValue2'.field({numeric: true, decimals: 2, caption: "Inventory Value"})
'productName'.field({caption: 'Product'})
'sku'.field({caption: 'SKU'})
'quantityPickable'.field({numeric: true})
'quantityAllocatedForPicking'.field({numeric: true})
'quantityMakeable'.field({numeric: true})
'quantityAllocatedForMaking'.field({numeric: true})
'quantityReservedForCustomerOrders'.field({numeric: true})
'nextExpectedDeliveryDate'.field({date: true, allowEmpty: true})

/* eslint-disable no-cond-assign */

'Cluster'.cruxFields(['inventory', 'location'])

'Cluster'.method('refreshNextExpectedDeliveryDate', async function() {
  let product = await this.toProduct(); if ( ! product ) return global.emptyYMD()
  let locName = await this.toLocationName()
  let lines = await 'POLine'.bring({product: product})
  this.nextExpectedDeliveryDate = global.emptyYMD()
  for ( var i = 0; i < lines.length; i++ ) {
    let line = lines[i]
    let lineLocName = await line.toLocationName(); if ( ! lineLocName ) continue
    if ( lineLocName !== locName ) continue
    let outstanding = (line.quantity - line.receivedQuantity - line.cancelledQuantity)
    if ( outstanding <= 0 ) continue
    let expectedDeliveryDate = await line.toExpectedDeliveryDate()
    if ( expectedDeliveryDate.isEmptyYMD() ) continue
    if ( this.nextExpectedDeliveryDate !== global.emptyYMD() ) {
      if ( expectedDeliveryDate >= this.nextExpectedDeliveryDate ) continue
    }
    this.nextExpectedDeliveryDate = expectedDeliveryDate
  }
  this.needsRecalc()
})

'Cluster'.method('toClumps', async function() {
  return await 'Clump'.bring({cluster: this})
})

'Cluster'.method('balanceClumps', async function() {

  let getSpecQty = async () => {
    let clumps = await this.toClumps()
    let res = 0
    for ( var i = 0; i < clumps.length; i++ ) {
      let clump = clumps[i]
      if ( await clump.isUnspecified() )
        continue
      res += clump.quantityOnHand
    }
    return res
  }

  let specQty = await getSpecQty()
  let unspecQty = this.quantityOnHand - specQty
  if ( unspecQty === 0 ) return
  let unspecClump = await this.lotNumberToClump('Unspecified')
  unspecClump.quantityOnHand = unspecQty
})

'Cluster'.method('lotNumberToClump', async function (aLotNumber, aOptions) {
  let product = await this.toProduct()
  let lot = await 'Lot'.bringOrCreate({lotNumber: aLotNumber, product: product}); if ( ! lot ) return
  let clumps = await 'Clump'.bring({cluster: this})
  let res = null
  await clumps.forAllAsync(async c => {
    if ( ! c.lot ) return 'continue'
    if ( c.lot.id !== lot.id ) {
      return 'continue'
    }
    res = c
    return 'break'
  })
  if ( (! res) && aOptions && aOptions.preventCreate )
    return null
  if ( ! res ) {
    let inv = this.toInventoryFast()
    if ( ! inv )
      inv = await this.toInventory()
    res = await 'Clump'.create(null, {cluster: this, lot: lot.reference(), inv: inv.reference()})
  }
  return res
})

'Cluster'.method('toBundle', async function() {
  let p = await this.toProduct(); if ( ! p ) return
  let res = await p.toBundle()
  return res
})

'Cluster'.beforeSaving(async function() {
  if ( this.quantityOnHand !== this.getOld().quantityOnHand ) {
    await this.refreshQuantityPickable()
  }
})

'Cluster'.method('refreshQuantityMakeable', async function (opt) {
  this.quantityMakeable = 0
  let bundle = await this.toBundle()
  if ( bundle ) {
    let location = await this.toLocation(); if ( ! location ) return 0
    let components = await bundle.toComponents()
    let maxMakeable = 99999
    for ( var i = 0; i < components.length; i++ ) {
      let component = components[i]
      if ( component.quantity <= 0 ) continue
      let compProduct = await component.toProduct(); if ( ! compProduct ) continue
      let compCluster = await compProduct.locationToCluster(location); if ( ! compCluster ) continue
      let compPickable = compCluster.quantityPickable - compCluster.quantityAllocatedForPicking
      if ( compPickable < 0 ) 
        compPickable = 0
      let compMakeable = compCluster.quantityMakeable - compCluster.quantityAllocatedForMaking
      if ( compMakeable < 0 ) 
        compMakeable = 0
      let compQty = compMakeable + compPickable
      let qtyPerBundle = component.quantity
      let makeableQty = qtyPerBundle === 0 ? 99999 : Math.floor(compQty / qtyPerBundle)
      if ( makeableQty < maxMakeable )
        maxMakeable = makeableQty
    }
    if ( maxMakeable === 99999 )
      maxMakeable = 0
    this.quantityMakeable = maxMakeable
  }
  let skipInventory = opt && opt.skipInventory
  if ( ! skipInventory ) {
    let inv = this.toInventoryFast()
    if ( ! inv )
      inv = await this.toInventory()
    if ( inv ) 
      await inv.refreshQuantityMakeable()
  }
  let componentMold = global.foreman.doNameToMold('Component')
  let componentMoldEmpty = componentMold.holdingAllCasts && (! componentMold.stale()) && componentMold.casts.length === 0
  if ( ! componentMoldEmpty )
    await this.refreshParentQuantitiesMakeable()
})

'Cluster'.method('refreshParentQuantitiesMakeable', async function (opt) {
  let inv = this.toInventoryFast()
  if ( ! inv ) 
    inv = await this.toInventory()
  if ( ! inv.product ) return
  let components = await 'Component'.bring({componentProductId: inv.product.id})
  for ( var i = 0; i < components.length; i++ ) {
    let component = components[i]
    let parentInventory = await component.toParentInventory(); if ( ! parentInventory ) continue
    let parentCluster = await parentInventory.locationRefToCluster(this.location); if ( ! parentCluster ) continue
    await parentCluster.refreshQuantityMakeable()
  }
})

'Cluster'.method('refreshQuantityReservedForCustomerOrders', async function (opt) {
  let cluster = this
  if ( ! cluster.location ) return
  this.quantityReservedForCustomerOrders = 0
  let ois = await 'order_items.RecentOrActive'.bring({_product_id: cluster.product_id}, {useIndexedField: '_product_id'})
  let varOis = await 'order_items.RecentOrActive'.bring({_variation_id: cluster.product_id}, {useIndexedField: '_variation_id'})
  ois.appendArray(varOis)
  for ( let i = 0; i < ois.length; i++ ) {
    let oi = ois[i]
    let isActive = oi.isActiveFast(); if ( ! isActive ) continue
    if ( oi.order_status === 'wc-pending' ) continue // these haven't been deducted from WC stock level
    let loc = oi.toShipFromLocationFast();
    if ( ! loc ) 
      loc = await oi.toShipFromLocation() 
    if ( ! loc ) continue
    if ( ! cluster.location ) continue
    if ( loc.id !== cluster.location.id ) continue
    this.quantityReservedForCustomerOrders += oi._qty
  }
  await this.refreshQuantityPickable()
  let skipInventory = opt && opt.skipInventory
  if ( ! skipInventory ) {
    let inv = this.toInventoryFast()
    if ( ! inv ) 
      inv = await this.toInventory()
    if ( inv ) 
      await inv.refreshQuantityReservedForCustomerOrders()
  }
  this.needsRecalc()
})

'Cluster'.method('refreshQuantityAllocated', async function (opt) {
  this.quantityAllocatedForPicking = 0
  this.quantityAllocatedForMaking = 0
  let cluster = this
  if ( ! cluster.location ) return 0
  let ois = await 'order_items.RecentOrActive'.bring({_product_id: cluster.product_id}, {useIndexedField: '_product_id'})
  let varOis = await 'order_items.RecentOrActive'.bring({_variation_id: cluster.product_id}, {useIndexedField: '_variation_id'})
  ois.appendArray(varOis)
  for ( let i = 0; i < ois.length; i++ ) {
    let oi = ois[i]
    let isActive = oi.isActiveFast(); if ( ! isActive ) continue
    if ( oi.order_status === 'wc-pending' ) continue // these haven't been deducted from WC stock level
    let loc = oi.toShipFromLocationFast();
    if ( ! loc ) {
      loc = await oi.toShipFromLocation() 
    }
    if ( ! loc ) continue
    if ( loc.id !== cluster.location.id ) continue
    let soLine = oi.toSOLineFast({returnNA: true})
    if ( soLine === 'na' ) {
      soLine = await oi.toSOLine()
    }
    if ( soLine ) {
      this.quantityAllocatedForPicking += soLine.quantityAllocated
      this.quantityAllocatedForMaking += soLine.quantityAllocatedForMaking
    }
  }
  await this.refreshQuantityPickable()
  await this.refreshQuantityMakeable()
  let skipInventory = opt && opt.skipInventory
  if ( ! skipInventory ) {
    let inv = this.toInventoryFast()
    if ( ! inv )
      inv = await this.toInventory()
    if ( inv ) 
      await inv.refreshQuantityAllocated()
  }
})

'Cluster'.method('refreshQuantityPackable', async function () {
  await this.refreshQuantityPickable()
  await this.refreshQuantityMakeable()
})

'Cluster'.method('refreshQuantityPickable', async function (opt) {
  this.quantityPickable = this.quantityOnHand + this.quantityReservedForCustomerOrders
  let preemptMold = global.foreman.doNameToMold('Preempt')
  let preemptEmpty = preemptMold.holdingAllCasts && (! preemptMold.stale()) && preemptMold.casts.length === 0
  if ( ! preemptEmpty ) {
    let preempts = await 'Preempt'.bring({product_id: this.product_id})
    for ( let j = 0; j < preempts.length; j++ ) {
      let preempt = preempts[j]
      let oi = await preempt.toOrderItem(); if ( ! oi ) continue
      let isActive = oi.isActiveFast(); if ( ! isActive ) continue
      let loc = oi.toShipFromLocationFast()
      if ( ! loc ) 
        loc = await oi.toShipFromLocation(); 
      if ( ! loc ) continue
      if ( ! this.location ) continue
      if ( loc.id !== this.location.id ) continue
      this.quantityPickable -= preempt.quantity
    }
  }
  let skipInventory = opt && opt.skipInventory
  if ( ! skipInventory ) {
    let inv = this.toInventoryFast()
    if ( ! inv )
      inv = await this.toInventory()
    if ( inv ) {
      let refRes = inv.refreshQuantityPickableFast()
      if ( refRes === 'na' )
        await inv.refreshQuantityPickable()
    }
  }
  let componentMold = global.foreman.doNameToMold('Component')
  let componentMoldEmpty = componentMold.holdingAllCasts && (! componentMold.stale()) && componentMold.casts.length === 0
  if ( ! componentMoldEmpty )
    await this.refreshParentQuantitiesMakeable()
})

'quantityPackable'.calculate(cluster => {
  let res = cluster.quantityPickable + cluster.quantityMakeable
  return res
})

'quantityPackable2'.calculate(cluster => {
  let res = cluster.quantityPickable - cluster.quantityAllocatedForPicking + cluster.quantityMakeable - cluster.quantityAllocatedForMaking
  return res
})

'Cluster'.method('isForGeneralLocation', async function() {
  let loc = await this.toLocation(); if ( ! loc ) return true
  return loc.locationName === 'General'
})

'sku'.calculate(cluster => {

  let slow = async () => {
    let p = await cluster.toProduct(); if ( ! p ) return null
    return p._sku
  }

  let p = cluster.toProductFast()
  if ( global.fastFail(p) )
    return slow()
  return p._sku
})

'productName'.calculate(cluster => {

  let slow = async () => {
    let p = await cluster.toProduct(); if ( ! p ) return null
    return p.uniqueName.stripAfterLast(" (")
  }

  let p = cluster.toProductFast()
  if ( global.fastFail(p) )
    return slow()
  return p.uniqueName.stripAfterLast(" (")
})

'uniqueName'.calculate(cluster => {

  let slow = async () => {
    let p = await cluster.toProduct(); if ( ! p ) return null
    return p.uniqueName
  }

  let p = cluster.toProductFast()
  if ( global.fastFail(p) )
    return slow()
  return p.uniqueName
})

'product_id'.calculate(cluster => {

  let slow = async () => {
    let p = await cluster.toProduct(); if ( ! p ) return null
    return p.id
  }

  let p = cluster.toProductFast()
  if ( global.fastFail(p) )
    return slow()
  return p.id
})

'Cluster'.method('toInventoryFast', function() {
  return this.refereeFast('inventory')
})

'Cluster'.method('toInventory', async function() {
  return await this.referee('inventory')
})

'Cluster'.method('toProductUniqueName', async function() {
  let product = await this.toProduct(); if ( ! product ) return null
  return product.uniqueName
})

'Cluster'.method('toProduct', async function() {
  let inventory = this.toInventoryFast()
  if ( ! inventory )
    inventory = await this.toInventory()
  return await inventory.toProduct()
})

'Cluster'.method('toProductFast', function() {
  let inventory = this.toInventoryFast()
  if ( ! inventory )
    return 'na'
  return inventory.toProductFast()
})

'Cluster'.method('toLocation', async function() {
  let res = await this.referee('location')
  return res
})

'Cluster'.method('toLocationFast', function() {
  let res = this.refereeFast('location')
  return res
})

'Cluster'.method('toLocationName', async function() {
  let loc = await this.toLocation(); if ( ! loc ) return 'General'
  let res = loc.locationName
  return res
})

'avgUnitCost'.calculate(cluster => {

  let slow = async () => {
    let inv = await cluster.toInventory(); if ( ! inv ) return 0
    return inv.avgUnitCost
  }

  let inv = cluster.toInventoryFast()
  if ( global.fastFail(inv) )
    return slow()
  return inv.avgUnitCost
})

'inventoryValue2'.calculate(cluster => {
  if ( cluster.quantityOnHand === 0 ) 
    return 0
  if ( cluster.avgUnitCost === global.unknownNumber() )
    return global.unknownNumber()
  return cluster.quantityOnHand * cluster.avgUnitCost
})

'Cluster'.method('refreshQuantityOnPurchaseOrders', async function() {
  let cluster = this
  let locName = await cluster.toLocationName()
  let product = await cluster.toProduct()
  let lines = await 'POLine'.bring({product: product})
  lines = lines.filter(line => (! line.lineType) || (line.lineType === "Product"))
  let qty = 0
  await lines.forAllAsync(async poLine => {
    let po = await poLine.toPO(); if ( ! po ) return 'continue'
    let lineLocName = await poLine.toLocationName(); if ( ! lineLocName ) return 'continue'
    if ( lineLocName !== locName ) return 'continue'
    let outstanding = (poLine.quantity - poLine.receivedQuantity - poLine.cancelledQuantity)
    if ( (outstanding < 0) && (poLine.quantity > 0) )
      outstanding = 0
    else if ( (outstanding > 0) && (poLine.quantity < 0) )
      outstanding = 0
    if ( outstanding > 0 ) {
      if ( po.stage === 'Draft' )
        outstanding = 0
    }
    qty += outstanding
  })
  cluster.quantityOnPurchaseOrders = qty
  this.needsRecalc()
})

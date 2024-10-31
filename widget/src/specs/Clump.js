'Clump'.datatype({exportable: true})
'cluster'.field({refersToParent: 'Cluster', key: true, nonUnique: true})
'lot'.field({refersTo: 'Lot'})
'inventory'.field({refersTo: 'Inventory'})
'location'.field({refersTo: 'Location'})
'uniqueName'.field({caption: 'Product'})
'product_id'.field()
'quantityOnHand'.field({numeric: true})
'quantityPackable'.field({numeric: true})
'quantityPackable2'.field({numeric: true})
'quantityOnPurchaseOrders'.field({numeric: true})
'productName'.field({caption: 'Product'})
'sku'.field({caption: 'SKU'})
'quantityPickable'.field({numeric: true})
'quantityAllocatedForPicking'.field({numeric: true})
'quantityReservedForCustomerOrders'.field({numeric: true})
'expiryDate'.field({date: true})

'Clump'.cruxFields(['cluster', 'lot'])

'expiryDate'.calculate(async clump => {
  let lot = await clump.toLot(); if ( ! lot ) return null
  return lot.expiryDate
})

'Clump'.method('isUnspecified', async function() {
  let lot = await this.toLot(); if ( ! lot ) return
  return lot.lotNumber === 'Unspecified'
})

'Clump'.method('toLot', async function() {
  let res = await this.referee('lot')
  return res
})

'Clump'.method('toLotNumber', async function() {
  let lot = await this.toLot(); if ( ! lot ) return null
  return lot.lotNumber
})

'inventory'.inception(async clump => {
  let cluster = await clump.toCluster(); if ( ! cluster ) return null
  let inv = await cluster.toInventory(); if ( ! inv ) return null
  return inv.reference()
})

'location'.calculate(async function(clump) {
  let cluster = await clump.toCluster(); if ( ! cluster ) return null
  return cluster.location
})

'sku'.calculate(async function(clump) {
  let inventory = await clump.toInventory(); if ( ! inventory ) return null
  let product = await inventory.referee('product'); if ( ! product ) return null
  return product._sku
})

'productName'.calculate(async function(clump) {
  let inventory = await clump.toInventory(); if ( ! inventory ) return null
  let product = await inventory.referee('product'); if ( ! product ) return null
  let res = product.uniqueName.stripAfterLast(" (")
  return res
})

'uniqueName'.calculate(async function(clump) {
  let inventory = await clump.toInventory(); if ( ! inventory ) return null
  let product = await inventory.referee('product'); if ( ! product ) return null
  let res = product.uniqueName
  return res
})

'product_id'.calculate(async function(clump) {
  let inventory = await clump.toInventory(); if ( ! inventory ) return null
  let product = await inventory.referee('product'); if ( ! product ) return null
  return product.id
})

'Clump'.method('toCluster', async function() {
  let res = await this.referee('cluster')
  return res
})

'Clump'.method('toInventory', async function() {
  let res = await this.referee('inventory')
  return res
})

'Clump'.method('toProductUniqueName', async function() {
  let product = await this.toProduct(); if ( ! product ) return null
  return product.uniqueName
})

'Clump'.method('toProduct', async function() {
  let inventory = await this.toInventory()
  let res = await inventory.toProduct()
  return res
})

'Clump'.method('toLocation', async function() {
  let cluster = await this.toCluster(); if ( ! cluster ) return null
  let res = await cluster.toLocation()
  return res
})

'Clump'.method('toLocationName', async function() {
  let loc = await this.toLocation(); if ( ! loc ) return 'General'
  let res = loc.locationName
  return res
})

'Clump'.method('toAllotments', async function() {
  let product = await this.toProduct()
  let location = await this.toLocation()
  let allotments = await 'Allotment'.bring({product: product, lot: this.lot})
  let res = []
  for ( var i = 0; i < allotments.length; i++ ) {
    let a = allotments[i]
    let aloc = await a.toLocation()
    if ( aloc.id !== location.id ) continue
    res.push(a)
  }
  return res
})

'Clump'.method('refreshQuantityOnPurchaseOrders', async function() {
  let allotments = await this.toAllotments()
  let qty = 0
  for ( var i = 0; i < allotments.length; i++ ) {
    let a = allotments[i]
    let parent = await a.parent(); if ( ! parent ) continue
    let status
    if ( parent.datatype() === 'POLine' ) {
      status = await parent.toStatus()
      if ( status !== 'Received' )
        qty += a.quantity
    } else if ( parent.datatype() === 'POReceiptLine' ) {
      status = await parent.toPOStatus()
      if ( status !== 'Received' )
        qty -= a.quantity
    }
  }
  this.quantityOnPurchaseOrders = qty
})

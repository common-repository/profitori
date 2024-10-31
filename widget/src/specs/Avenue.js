'Avenue'.datatype()
'inventory'.field({refersToParent: 'Inventory'})
'supplier'.field({refersTo: 'Supplier'})
'productName'.field({caption: "Supplier Product Name"})
'sku'.field({caption: "Supplier SKU", indexed: true})
'minimumOrderQuantity'.field({numeric: true})
'isMain'.field({yesOrNo: true, caption: "Is Main Supplier of Product"})
'barcode'.field({caption: "Barcode"})
'externalQuantityOnHand'.field({numeric: true})
'externalPrice'.field({numeric: true, decimals: 2})
'externalPriceFX'.field({numeric: true, decimals: 2})

'Avenue'.beforeSaving(async function() {
  let inv = await this.referee('inventory'); if ( ! inv ) return null
  let avs = await 'Avenue'.bringChildrenOf(inv)
  let thisSupp = await this.toSupplier()
  let thisSuppId = thisSupp ? thisSupp.id : null
  for ( var i = 0; i < avs.length; i++ ) {
    let av = avs[i]
    if ( av.id === this.id ) continue
    let otherSupp = await av.toSupplier()
    let otherSuppId = otherSupp ? otherSupp.id : null
    if ( (this.isNew() || this.propChanged('supplier')) && (thisSuppId === otherSuppId) ) {
      throw(new Error("This supplier is already a supplier of this product"))
    }
    if ( this.isMain === "Yes" )
      av.isMain = 'No'
  }
})

'Avenue'.method('toInventory', async function() {
  return await this.referee('inventory')
})

'Avenue'.method('toProduct', async function() {
  let inv = await this.toInventory()
  return await inv.toProduct()
})

'Avenue'.method('toProductUniqueName', async function() {
  let p = await this.toProduct(); if ( ! p ) return ''
  return p.uniqueName
})

'Avenue'.method('toSupplier', async function() {
  return await this.referee('supplier')
})

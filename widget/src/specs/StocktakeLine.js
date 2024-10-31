'StocktakeLine'.datatype()
'stocktakeNumber'.field({refersToParent: "Stocktake", parentIsHeader: true, hidden: true})
'product'.field({refersTo: "products"})
'sku'.field({caption: 'SKU'})
'wooCommerceRegularPrice'.field({numeric: true, decimals: 2, caption: 'WC Regular Price'})
'systemQuantity'.field({numeric: true})
'countedQuantity'.field({numeric: true})
'discrepancy'.field({numeric: true})
'supplier'.field({refersTo: 'Supplier'})
'supplierSku'.field({caption: 'Supplier SKU'})
'shelf'.field()
'scan'.field({caption: 'Scan Next SKU/Barcode', ephemeral: true})

'supplier'.calculate(async stl => {
  let p = await stl.toProduct(); if ( ! p ) return ''
  let supplier = await p.toMainSupplier(); if ( ! supplier ) return null
  return supplier.reference()
})

'supplierSku'.calculate(async stl => {
  let inv = await stl.toInventory(); if ( ! inv ) return null
  return await inv.supplierRefToSKU(stl.supplier)
})

'discrepancy'.calculate(async stl => {
  let res = stl.countedQuantity - stl.systemQuantity
  return res
})

'wooCommerceRegularPrice'.calculate(async stl => {
  let p = await stl.toProduct(); if ( ! p ) return 0
  return p._regular_price
})

'countedQuantity'.afterUserChange((oldInputValue, newInputValue, stocktakeLine) => {
  stocktakeLine.countEntered = (newInputValue !== '')
})

'sku'.calculate(async stl => {
  let p = await stl.toProduct(); if ( ! p ) return ''
  return p._sku
})

'StocktakeLine'.method('toProduct', async function() {
  return await this.referee('product')
})

'StocktakeLine'.method('toInventory', async function() {
  let product = await this.toProduct(); if ( ! product ) return null
  return await product.toInventory({allowCreate: true})
})




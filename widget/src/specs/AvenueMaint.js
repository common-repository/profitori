'AvenueMaint'.maint()
'Add Product Supplier'.title({when: 'adding'})
'Edit Product Supplier'.title({when: 'editing'})
'Back'.action({act: 'cancel'})
'OK'.action({act: 'ok'})
'Save'.action({act: 'save'})
'Add another supplier'.action({act: 'add'})
'Avenue'.datatype()
'inventory'.field({caption: 'Product', readOnly: true})
'supplier'.field({allowEmpty: false})
'productName'.field()
'sku'.field()
'barcode'.field()
'minimumOrderQuantity'.field({numeric: true})
'recommendedRetailPriceIncTax'.field({numeric: true, decimals: 2, caption: "Recommended Retail Price (inc Tax)"})
'recommendedRetailPriceExclTax'.field({numeric: true, decimals: 2, caption: "Recommended Retail Price (ex Tax)"})
'isMain'.field()
'externalQuantityOnHand'.field({readOnly: true})
'externalPrice'.field({readOnly: true})
'externalPriceFX'.field({readOnly: true, caption: 'External Foreign Currency Price'})

'productName'.default(async (maint, avenue) => {
  let inv = await avenue.referee('inventory'); if ( ! inv ) return null
  return inv.productName
})

'sku'.default(async (maint, avenue) => {
  let inv = await avenue.referee('inventory'); if ( ! inv ) return null
  return inv.sku
})

'isMain'.default(async (maint, avenue) => {
  let inv = await avenue.referee('inventory'); if ( ! inv ) return null
  let res = 'Yes'
  let avs = await 'Avenue'.bringChildrenOf(inv)
  avs.forEach(av => {
    if ( av.id === avenue.id ) return 'continue'
    if ( av.isMain === 'Yes' )
      res = 'No'
  })
  return res
})

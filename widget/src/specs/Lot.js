'Lot'.datatype({exportable: true})
'product'.field({refersTo: 'products', indexed: true})
'lotNumber'.field({key: true, nonUnique: true})
'expiryDate'.field({date: true, allowEmpty: true})

'Lot'.cruxFields(['product', 'lotNumber'])

'Lot'.beforeSaving(async function() {
  let product = await this.referee('product'); if ( ! product ) return
  await product.refreshLotsString()
})

'expiryDate'.default(global.emptyYMD())


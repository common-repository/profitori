'atumPOLine'.datatype({source: 'WC'})
'order_id'.field({numeric: true})
'_product_id'.field({numeric: true})
'_variation_id'.field({numeric: true})
'_qty'.field({numeric: true})
'_line_total'.field({numeric: true})
'_line_tax'.field({numeric: true})
'order_item_name'.field()
'_cost'.field({numeric: true})
'_total_tax'.field({numeric: true})

'atumPOLine'.method('toProductOrVariationId', async function () {
  return this._product_id ? this._product_id : this._variation_id
})


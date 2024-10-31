'ViewPOLines'.list()
'Purchase Order Lines'.title()
'Back'.action({act: 'cancel'})
'Download to Excel'.action({act: 'excel'})

'POLine'.datatype()
'purchaseOrder'.field({showAsLink: true})
'product'.field({showAsLink: true})
'quantity'.field({caption: "Ordered Quantity"})
'lineCostIncTax'.field()
'receivedQuantity'.field()
'lineExpectedDeliveryDate'.field()
'PO'.datatype()
'location'.field({showAsLink: true})
'supplier'.field({showAsLink: true})
'orderDate'.field()
'status'.field()

'ViewPOLines'.criteria(async function () {
  let c = this.callerCast(); if ( ! c ) return null
  let product
  if ( c.datatype() === "Inventory" )
    product = await c.toProduct()
  else if ( c.datatype() === "products" )
    product = c
  if ( ! product )
    return {id: -9999999}
  let res = {product: product}
  return res
})


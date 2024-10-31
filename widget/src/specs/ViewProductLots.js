'ViewProductLots'.list({withHeader: true})
'View Product Lots'.title()
'product'.field({readOnly: true})
'Back'.action({act: 'cancel'})
'Download to Excel'.action({act: 'excel'})

'Lots'.manifest()
'Clump'.datatype()
'lot'.field({caption: 'Lot Number', showAsLink: true})
'location'.field({showAsLink: true})
'quantityOnPurchaseOrders'.field({caption: 'Quantity on POs', showTotal: true})
'quantityOnHand'.field({showTotal: true})
'expiryDate'.field()

'lot'.dynamicCaption(list => {
  let inv = list.callerCast(); if ( ! inv ) return null
  if ( inv.lotTracking === 'Serial' )
    return 'Serial Number'
  else
    return 'Lot Number'
})

'ViewProductLots'.dynamicTitle(function() {
  let inv = this.callerCast(); if ( ! inv ) return
  if ( inv.lotTracking === 'Serial' )
    return 'View Product Serial Numbers'
  else
    return 'View Product Lots'
})

'Lots'.defaultSort({field: "lot"})

'Lots'.criteria(async function () {
  let inv = this.callerCast()
  if ( inv.datatype() === 'products' )
    inv = await inv.toInventory()
  let res = {inventory: inv}; if ( ! inv ) return null
  return res
})

'product'.default(list => {
  let inv = list.callerCast(); if ( ! inv ) return null
  return inv.productName
})

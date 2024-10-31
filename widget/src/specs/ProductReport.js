'ProductReport'.list({withHeader: true})
'Supplier Products Report'.title()
'Back'.action({act: 'cancel'})
'Download to Excel'.action({act: 'excel'})
'supplier'.field({refersTo: 'Supplier'})

'Lines'.manifest()
'Go'.action({place: 'header', spinner: true})
'Inventory'.datatype()
'product'.field({showAsLink: true})
'sku'.field()
'quantityOnHand'.field({showTotal: true})
'quantityOnPurchaseOrders'.field({showTotal: true})
'avgUnitCost'.field()

'ProductReport'.beforeLoading(async list => {
  let cast = list.callerCast(); if ( ! cast ) return
  if ( cast.datatype() === 'Supplier' )
    list.setFieldValue('supplier', cast.reference())
})

'Go'.act(async (list) => {
  list.refresh()
})

'Lines'.filter(async (inv, list) => {
  let suppRef = list.getFieldValue('supplier')
  if ( ! suppRef ) return true
  let supp = await 'Supplier'.bringFirst({id: suppRef.id}); if ( ! supp ) return false
  let res = await inv.hasSupplier(supp)
  return res
})


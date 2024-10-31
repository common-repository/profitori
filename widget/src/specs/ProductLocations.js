'ProductLocations'.list({withHeader: true})
'Product Inventory by Location'.title()
'Back'.action({act: 'cancel'})
'Refresh'.action({act: "refresh"})
'Download to Excel'.action({act: 'excel'})

'product'.field({refersTo: 'products'})

'Lines'.manifest()
'Cluster'.datatype()
'location'.field()
'quantityPickable'.field({showTotal: true, caption: "Pickable"})
'quantityReservedForCustomerOrders'.field({showTotal: true, caption: "Reserved for Customer Orders"})
'quantityOnHand'.field({showTotal: true, caption: "On Hand"})
'quantityMakeable'.field({showTotal: true, caption: "Makeable"})
'quantityOnPurchaseOrders'.field({caption: "On Purchase Orders", showTotal: true})
'avgUnitCost'.field()
'inventoryValue2'.field({showTotal: true})
'Transfer'.action({place: 'row', act: 'add', spec: 'TransferMaint.js'})

'product'.default(async list => {
  let c = list.callerCast()
  if ( c.datatype() === "Inventory" )
    return c.product
  let product = list.callerCast(); if ( ! product ) return null
  return product.reference()
})

'product'.afterUserChange(async (oldInputValue, newInputValue, headerCast, list) => {
  list.refresh()
})

'Lines'.criteria(async function (list) {
  let prodRef = list.getFieldValue('product'); if ( ! prodRef ) return {parentId: -9999999}
  let product = await 'products'.bringSingle({uniqueName: prodRef.keyval}); if ( ! product ) return {parentId: -9999999}
  let inventory = await product.toInventory(); if ( ! inventory ) return {parentId: -9999999}
  let res = {parentId: inventory.id}
  return res
})

'Lines'.defaultSort({field: 'location'})


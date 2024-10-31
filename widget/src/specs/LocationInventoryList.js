'LocationInventoryList'.list({withHeader: true})
'Location Inventory'.title()
'Back'.action({act: 'cancel'})
'Refresh'.action({act: "refresh"})
'Download to Excel'.action({act: 'excel'})

'location'.field({refersTo: 'Location'})

'Lines'.manifest()
'Cluster'.datatype()
'uniqueName'.field({showAsLink: true})
'sku'.field()
'quantityOnHand'.field({showTotal: true, caption: "On Hand"})
'quantityReservedForCustomerOrders'.field({caption: "Reserved for Customer Orders"})
'quantityPackable'.field({caption: "Packable"})
'quantityOnPurchaseOrders'.field({caption: "On Purchase Orders", showTotal: true})
'avgUnitCost'.field()
'inventoryValue2'.field({showTotal: true})
'Adjust Qty'.action({place: 'row', act: 'add', spec: 'AdjustmentMaint.js'})
'View History'.action({place: 'row', spec: 'LocationHistory.js'})

'location'.default(async list => {
  let loc
  let cc = list.callerCast()
  if ( cc && (cc.datatype() === "Location") )
    loc = cc
  else {
    loc = await 'Location'.bringFirst({locationName: "General"}); if ( ! loc ) return null
  }
  return loc.reference()
})

'LocationInventoryList'.beforeLoading(async list => {
  await list.harmonize()
})

'location'.afterUserChange(async (oldInputValue, newInputValue, headerCast, list) => {
  list.refresh()
})

'Lines'.filter(async (cluster, list) => {
  let locRef = list.getFieldValue('location'); if ( ! locRef ) return false
  let locName = locRef.keyval
  let clusterLocRef = cluster.location; if ( ! clusterLocRef ) return false
  let clusterLocName = clusterLocRef.keyval
  let res = clusterLocName === locName
  if ( cluster.inventory && (cluster.inventory.id === cluster.inventory.keyval.id) )
    res = false // leave out erroneously created ones (from bad import?)
  let product = await cluster.toProduct()
  if ( ! product )
    res = false
  return res
})

'Lines'.defaultSort({field: 'uniqueName'})

'uniqueName'.destination(async cluster => {
  let p = await cluster.toProduct()
  return p
})


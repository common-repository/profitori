'SOMaint'.maint({panelStyle: "titled", icon: 'Truck'})
'Sales Order Fulfillment'.title()
'Back'.action({act: 'cancel'})
'OK'.action({act: 'ok'})
'Save'.action({act: 'save'})

'SO'.datatype()

'Order Summary'.panel()
'order'.field({readOnly: true})
'orderDate'.field({readOnly: true})
'wcNiceStatus'.field({caption: 'WC Order Status'})
'shippingNameAndCompany'.field({caption: "Ship To", readOnly: true})
'shippingAddress'.field({caption: "Address", readOnly: true})
'shippingEmailAndPhone'.field({caption: "Contact", readOnly: true})

'Fulfillment Details'.panel()
'latestShipmentNumber'.field({caption: 'Shipment Number', readOnly: true})
'shipFromLocation'.field()
'packable'.field({readOnly: true, caption: 'Packable From This Location'})
'fulfillStage'.field()
'priority'.field()
'notes'.field()

'Lines'.manifest()
'SOLine'.datatype()
'sequence'.field()
'descriptionAndSKU'.field({caption: 'Product', showAsLink: true})
'shipFromLocation'.field({showAsLink: true})
'packable'.field()
'fulfillStage'.field()
'priority'.field()
'quantityOrdered'.field()
'quantityRemainingToShip'.field()
'quantityPickable'.field()
'quantityToPack'.field()
'quantityShipped'.field({readOnly: false})
'quantityShippedIncremental'.field({readOnly: false})
'Edit'.action({place: 'row', act: 'edit'})
'SOLineMaint.js'.maintSpecname()

'quantityShippedIncremental'.columnVisibleWhen((list, line) => {
  return global.confVal('enterIncrementalShipmentQuantity') === 'Yes'
})

'quantityShipped'.readOnlyWhen((maint, line) => {
  return global.confVal('enterIncrementalShipmentQuantity') === 'Yes'
})

'wcNiceStatus'.dynamicOptions(async maint => {
  let res = ['Pending', 'On-hold', 'Processing', 'Completed']
  let orders = await 'orders.RecentOrActive'.bring()
  for ( var i = 0; i < orders.length; i++ ) {
    let order = orders[i]
    let status = order.niceStatus
    if ( res.indexOf(status) >= 0 ) continue
    res.push(status)
  }
  return res
})

'Lines'.defaultSort({field: "sequence"})

'Lines'.filter(async (soLine, list) => {
  if ( ! soLine.parentSOLine ) return true
  let parentLine = await soLine.toTopParentSOLine(); if ( ! parentLine ) return false
  return parentLine.quantityToMake !== 0
})

'PackingListsPdf'.output()
'PACKING LIST'.title()
'PackingList'.datatype({transient: true})

'Header'.section({pageHeading: true})
'orderId'.field({caption: "Order Number"})
'orderDate'.field({date: true})
'customerReference'.field()
'shipFromLocationName'.field({caption: 'Ship From Location'})
'shippingNameAndCompany'.field({caption: "Ship To"})
'shippingAddress'.field({caption: "Address"})
'shippingEmailAndPhone'.field({caption: "Contact"})
'notes'.field()

'Lines'.manifest()
'PackingListLine'.datatype({transient: true})
'packingList'.field({refersToParent: 'PackingList', hidden: true})
'soLine'.field({refersTo: 'SOLine', hidden: true})
'descriptionAndSKU'.field({width: 59, caption: 'Product'})
'quantityOrdered'.field({caption: 'Ordered', numeric: true})
'quantityRemainingToShip'.field({width: 20, caption: 'Remaining to Ship', numeric: true})
'quantityToPick'.field({caption: 'Qty to Pack', numeric: true})
'quantityPicked'.field({caption: 'Qty Packed'})


'PackingListsPdf'.getCasts(async output => {
  let c = await 'Configuration'.bringFirst()
  return await c.getPackingListCasts(output)
})



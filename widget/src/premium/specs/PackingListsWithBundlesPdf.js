'PackingListsWithBundlesPdf'.output()
'PACKING LIST'.title()
'PackingList'.datatype({transient: true})

'Header'.section({pageHeading: true})
'orderId'.field({caption: "Order Number"})
'orderDate'.field({date: true})
'shipFromLocationName'.field({caption: 'Ship From Location'})
'shippingNameAndCompany'.field({caption: "Ship To"})
'shippingAddress'.field({caption: "Address"})
'shippingEmailAndPhone'.field({caption: "Contact"})
'notes'.field()

'Lines'.manifest()
'PackingListLine'.datatype({transient: true})
'packingList'.field({refersToParent: 'PackingList', hidden: true})
'soLine'.field({refersTo: 'SOLine', hidden: true})
'sequence'.field({width: 17})
'descriptionAndSKU'.field({width: 47, caption: 'Product'})
'quantityOrdered'.field({caption: 'Ordered', numeric: true, width: 12})
'quantityRemainingToShip'.field({width: 18, caption: 'Remaining to Ship', numeric: true})
'quantityToPick'.field({caption: 'Qty to Pick', numeric: true, width: 12})
'quantityPicked'.field({caption: 'Qty Picked', width: 12})
'quantityToMake'.field({caption: 'Qty to Make', numeric: true, width: 12})
'quantityMade'.field({caption: 'Qty Made', width: 12})

'PackingListsWithBundlesPdf'.getCasts(async output => {
  let c = await 'Configuration'.bringFirst()
  return await c.getPackingListCasts(output)
})



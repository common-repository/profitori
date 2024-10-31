'OutstandingPOStock'.list()
'Outstanding Purchase Order Stock'.title()
'Back'.action({act: 'cancel'})
'Download to Excel'.action({act: 'excel'})

'POLine'.datatype()
'purchaseOrder'.field({showAsLink: true})
'product'.field({showAsLink: true})
'outstandingQuantity'.field({showTotal: true})
'lineCostExclTax'.field({caption: 'Value (Ex Tax)', showTotal: true})
'lineCostIncTax'.field({caption: 'Value (Inc Tax)', showTotal: true})
'PO'.datatype()
'location'.field({showAsLink: true})
'supplier'.field({showAsLink: true})
'orderDate'.field()
'expectedDeliveryDate'.field()
'status'.field()

'OutstandingPOStock'.defaultSort({field: "expectedDeliveryDate"})

'OutstandingPOStock'.filter(async poLine => {
  let po = poLine.refereeFast('purchaseOrder')
  if ( (! po ) || (po === 'na') )
    po = await poLine.referee('purchaseOrder')
  if ( ! po )
    return false
  if ( poLine.outstandingQuantity <= 0 ) return false
  return true
})


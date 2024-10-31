'OverduePOStock'.list()
'Overdue Purchase Order Stock'.title()
'Back'.action({act: 'cancel'})
'Download to Excel'.action({act: 'excel'})

'POLine'.datatype()
'purchaseOrder'.field({showAsLink: true})
'product'.field({showAsLink: true})
'outstandingQuantity'.field({showTotal: true})
'PO'.datatype()
'location'.field({showAsLink: true})
'supplier'.field({showAsLink: true})
'orderDate'.field()
'expectedDeliveryDate'.field()
'overdueDays'.field({caption: "Days Overdue"})
'status'.field()

'OverduePOStock'.defaultSort({field: "overdueDays", descending: true})

'OverduePOStock'.filter(async poLine => {
  if ( poLine.outstandingQuantity <= 0 ) return false
  let po = await poLine.parent(); if ( ! po ) return false
  if ( po.overdueDays < 0 ) return false
  return true
})


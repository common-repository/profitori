'UnpaidPurchaseOrders'.list({suppressOnMoreMenu: true})
'Unpaid Purchase Orders'.title()
'Back'.action({act: 'cancel'})
'Download to Excel'.action({act: 'excel'})

'PO'.datatype()
'purchaseOrderNumber'.field({showAsLink: true})
'orderDate'.field({date: true})
'supplier'.field({showAsLink: true})
'supplierReference'.field()
'status'.field()
'stage'.field()
'receivedDate'.field()
'costIncTaxFXWithCurrency'.field({caption: 'Amount'})
'paymentStatus'.field()
'paymentDueDate'.field()
'daysUntilPaymentDue'.field()

'UnpaidPurchaseOrders'.defaultSort({field: 'paymentDueDate'})

'UnpaidPurchaseOrders'.filter(async po => {
  return po.paymentStatus !== 'Paid'
})

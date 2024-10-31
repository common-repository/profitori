'SupplierPaymentsReport'.list()
'Supplier Payments'.title()
'Back'.action({act: 'cancel'})
'Refresh'.action({act: "refresh"})
'Download to Excel'.action({act: 'excel'})

'Payment'.datatype()

'purchaseOrder'.field({showAsLink: true})
'paymentNumber'.field({showAsLink: true})
'paymentDate'.field({caption: 'Date'})
'status'.field()
'supplier'.field({showAsLink: true})
'supplierReference'.field()
'currency'.field({showAsLink: true})
'amountFX'.field({caption: 'Amount'})
'notes'.field()

'SupplierPaymentsReport'.defaultSort({field: "paymentDate"})

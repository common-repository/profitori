'SalesListAll'.list()
'Sales and Invoices'.title()
'Back'.action({act: 'cancel'})
'Refresh'.action({act: "refresh"})
'Download to Excel'.action({act: 'excel'})
'Unpaid Invoices'.action({spec: 'UnpaidInvoices.js'})

'order_items'.datatype()
'order_date'.field()
'theOrder'.field({showAsLink: true})
'billingName'.field({caption: "Customer"})
'productUniqueName'.field({caption: 'Product', showAsLink: true})
'_qty'.field()
'_line_total'.field({caption: "Amount Ex Tax"})
'_line_tax'.field()
'niceOrderStatus'.field({caption: "Status"})
'active'.field()
'_date_completed'.field()
'View Order'.action({spec: 'ViewSalesOrder.js', place: 'row', act: 'editParent'})

'SalesListAll'.defaultSort({field: 'order_date', descending: true})

'SalesListAll'.filter(async oi => {
  return oi._product_id ? true : false
})

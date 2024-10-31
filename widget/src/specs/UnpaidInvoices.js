'UnpaidInvoices'.list({expose: true, suppressOnMoreMenu: true, icon: 'HandHoldingUsd'})
'Unpaid Invoices'.title()
'Back'.action({act: 'cancel'})
'Download to Excel'.action({act: 'excel'})

'orders'.datatype()
'order_id'.field({showAsLink: true})
'billingNameAndCompany'.field({caption: 'Customer'})
'billingEmailAndPhone'.field({caption: 'Contact'})
'order_date'.field({caption: 'Date'})
'dueDate'.field()
'niceStatus'.field()
'_order_currency'.field({caption: "Currency"})
'_order_total'.field({caption: "Amount", showTotal: true})
//'View Order'.action({spec: 'ViewSalesOrder.js', place: 'row', act: 'edit'})

'UnpaidInvoices'.defaultSort({field: 'dueDate', descending: true})

'UnpaidInvoices'.filter(async order => {
  if ( ["wc-pending", "wc-failed", "wc-on-hold", "wc-partially-paid"].indexOf(order.status) < 0 ) return false
  if ( order._order_total === 0 ) return false
  return true
})

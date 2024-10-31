'Payments'.list({withHeader: true})
'Payments'.title()
'Back'.action({act: 'cancel'})
'Add'.action({act: 'add'})
'Refresh'.action({act: "refresh"})
'Download to Excel'.action({act: 'excel'})

'paymentStatus'.field({readOnly: true})
'amountOutstandingFX'.field({numeric: true, decimals: 2, readOnly: true, caption: 'Amount Outstanding'})
'paymentDueDate'.field({date: true, allowEmpty: true, readOnly: true})
'daysUntilPaymentDue'.field({numeric: true, readOnly: true})
'PaymentMaint.js'.maintSpecname()

'ThePayments'.manifest()
'Payment'.datatype()
'paymentNumber'.field({key: true})
'paymentDate'.field({caption: 'Date'})
'supplier'.field({showAsLink: true})
'supplierReference'.field()
'status'.field({translateOnDisplay: true})
'unpaidAmountFX'.field({numeric: true, decimals: 2, caption: 'Unpaid Amount', showTotal: true})
'paidAmountFX'.field({numeric: true, decimals: 2, caption: 'Paid Amount', showTotal: true})
'Edit'.action({place: 'row', act: 'edit'})
'Trash'.action({place: 'row', act: 'trash'})
'PaymentMaint.js'.maintSpecname()

'Payments'.beforeLoading(async list => {
  let po = list.callerCast(); if ( ! po ) return
  list.setFieldValue('paymentStatus', po.paymentStatus)
  list.setFieldValue('amountOutstandingFX', po.amountOutstandingFX)
  list.setFieldValue('paymentDueDate', po.paymentDueDate)
  list.setFieldValue('daysUntilPaymentDue', po.daysUntilPaymentDue)
})

'ThePayments'.defaultSort({field: "paymentDate"})

'Payments'.dynamicTitle(function() {
  let po = this.callerCast(); if ( ! po ) return
  if ( po.datatype() !== "PO" ) return 
  let res = "Payments for Purchase Order " + po.purchaseOrderNumber
  return res
})

'ThePayments'.criteria(async function () {
  let r = this.callerCast(); if ( ! r ) return null
  if ( r.datatype() !== "PO" ) return null
  let res = {purchaseOrder: r.reference()}
  return res
})

'unpaidAmountFX'.calculate(async payment => {
  return (payment.status === 'Unpaid') ? payment.amountFX : 0
})

'paidAmountFX'.calculate(async payment => {
  return (payment.status !== 'Unpaid') ? payment.amountFX : 0
})

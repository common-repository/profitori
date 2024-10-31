'OutstandingPaymentsReport'.list()
'Outstanding Payments'.title()
'Back'.action({act: 'cancel'})
'Refresh'.action({act: "refresh"})
'Download to Excel'.action({act: 'excel'})

'OutstandingPayment'.datatype({transient: true})

'purchaseOrder'.field({refersTo: 'PO', showAsLink: true})
'payment'.field({refersTo: 'Payment', showAsLink: true})
'paymentDate'.field({date: true, caption: 'Due Date', allowEmpty: true})
'daysUntilPaymentDue'.field({numeric: true})
'receivedDate'.field({date: true})
'stage'.field()
'supplier'.field({refersTo: 'Supplier', showAsLink: true})
'supplierReference'.field()
'currency'.field({refersTo: 'Currency', showAsLink: true})
'amountFX'.field({numeric: true, decimals: 2, caption: 'Outstanding Amount', showTotal: true})
'amountPaidFX'.field({numeric: true, decimals: 2, caption: 'Paid Amount'})
'notes'.field()

'OutstandingPaymentsReport'.defaultSort({field: "paymentDate"})

'OutstandingPaymentsReport'.beforeLoading(async list => {

  let processPayment = async payment => {
    let op = await 'OutstandingPayment'.create()
    op.purchaseOrder = payment.purchaseOrder
    op.payment = payment.reference()
    op.paymentDate = payment.paymentDate
    op.supplier = payment.supplier
    op.supplierReference = payment.supplierReference
    op.amountFX = payment.amountFX
    op.amountPaidFX = 0
    op.currency = payment.currency
    op.notes = payment.notes
    op.daysUntilPaymentDue = global.unknownNumber()
    if ( op.paymentDate && (op.paymentDate !== global.emptyYMD()) )
      op.daysUntilPaymentDue = - global.todayYMD().dateSubtract(op.paymentDate)
    let po = await payment.referee('purchaseOrder'); if ( ! po ) return
    op.receivedDate = po.receivedDate
    op.stage = po.stage
  }

  let addLineForPO = async (po, amount) => {
    let op = await 'OutstandingPayment'.create()
    await po.refreshCalculations({force: true})
    op.purchaseOrder = po.reference()
    op.paymentDate = po.paymentDueDate
    op.supplier = po.supplier
    op.supplierReference = po.supplierReference
    op.amountFX = amount
    op.amountPaidFX = po.costIncTaxFX - po.amountOutstandingFX
    op.currency = po.currency
    op.daysUntilPaymentDue = global.unknownNumber()
    if ( op.paymentDate && (op.paymentDate !== global.emptyYMD()) )
      op.daysUntilPaymentDue = - global.todayYMD().dateSubtract(op.paymentDate)
    op.receivedDate = po.receivedDate
    op.stage = po.stage
  }

  let processPO = async po => {
    let payments = await 'Payment'.bring({purchaseOrder: po.reference()})
    let totalUnpaidPayments = 0
    for ( var i = 0; i < payments.length; i++ ) {
      let payment = payments[i]
      if ( payment.status === 'Paid' ) continue
      await processPayment(payment)
      totalUnpaidPayments += payment.amountFX
    }
    let remainder = po.amountOutstandingFX - totalUnpaidPayments
    if ( remainder !== 0 )
      await addLineForPO(po, remainder)
  }
  
  await 'OutstandingPayment'.clear()

  let pos = await 'PO'.bring()
  for ( var i = 0; i < pos.length; i++ ) {
    let po = pos[i]
    if ( po.paymentStatus === 'Paid' ) continue
    await processPO(po)
  }

})


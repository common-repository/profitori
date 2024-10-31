'PaymentMaint'.maint({panelStyle: "titled"})
'Add Payment'.title({when: 'adding'})
'Edit Payment'.title({when: 'editing'})
'Back'.action({act: 'cancel'})
'OK'.action({act: 'ok'})
'Save'.action({act: 'save'})
'Attachments'.action({act: 'attachments'})
'Add another'.action({act: 'add'})

'Payment'.datatype()

'Payment Details'.panel()
'paymentNumber'.field({key: true})
'purchaseOrder'.field({refersTo: 'PO', readOnly: true, indexed: true})
'supplier'.field({refersTo: 'Supplier', showAsLink: true, readOnly: true})
'paymentDate'.field({date: true})
'supplierReference'.field({caption: 'Supplier\'s Invoice#/Reference'})
'status'.field({translateOnDisplay: true})
'currency'.field({refersTo: 'Currency', showAsLink: true, readOnly: true})
'amountFX'.field({numeric: true, decimals: 2, caption: 'Amount'})

'Notes'.panel()
'notes'.field({multiLine: true})

'currency'.visibleWhen((maint, payment) => {
  return payment.currency
})

'paymentDate'.dynamicCaption(maint => {
  let payment = maint.mainCast()
  if ( payment && (payment.status === 'Paid') )
    return 'Payment Date'
  else
    return 'Due Date'
})

'PaymentMaint'.makeDestinationFor('Payment')

'status'.options(['Unpaid', 'Paid'])

'status'.inception('Unpaid')

'Payment'.method('toLocation', async function() {
  let po = await this.referee('purchaseOrder'); if ( ! po ) return null
  return await po.toLocation()
})

'Payment'.beforeSaving(async function() {
  let po = await this.referee('purchaseOrder'); if ( ! po ) return
  await po.refreshAmountOutstanding()
})

'PaymentMaint'.whenAdding(async function(payment, maint) {

  let defaultPaymentNumber = async () => {
    let paymentToSuffix = (payment) => {
      let no = payment.paymentNumber
      let parts = no.split('-')
      if ( parts.length < 2 ) return "00"
      let res = parts[parts.length - 1]
      res = res.stripLeft('P')
      return res
    }
  
    let incSuffix = (aSuffix) => {
      let no = Number(aSuffix) + 1 + ""
      return no.padStart(2, '0')
    }

    let paymentsToOneWithMaxPaymentNumber = (aPayments) => {
      let res
      let max = ''
      aPayments.forAll(payment => {
        let no = payment.paymentNumber; if ( ! no ) return 'continue'
        if ( no <= max ) return 'continue'
        max = no
        res = payment
      })
      return res
    }
  
    let poNo = this.fieldNameToKeyValue('purchaseOrder')
    let po = this.getFieldValue('purchaseOrder')
    let payments = await 'Payment'.bring({purchaseOrder: po})
    let payment = paymentsToOneWithMaxPaymentNumber(payments)
    let suffix = "01"
    if ( payment ) {
      suffix = paymentToSuffix(payment)
      suffix = incSuffix(suffix)
    }
    let paymentNo = poNo + "-P" + suffix
    this.setFieldValue('paymentNumber', paymentNo)
  }

  let poToAmountOnUnpaidPayments = async po => {
    let res = 0
    let payments = await 'Payment'.bring({purchaseOrder: po.reference()})
    for ( var i = 0; i < payments.length; i++ ) {
      let payment = payments[i]
      if ( payment.status === 'Paid' ) continue
      res += payment.amountFX
    }
    return res
  }

  let defaultFromPO = async () => {
    await po.refreshCalculations({force: true})
    payment.supplier = po.supplier
    payment.supplierReference = po.supplierReference
    payment.status = 'Paid'
    payment.currency = po.currency
    let amountOnUnpaidPayments = await poToAmountOnUnpaidPayments(po)
    payment.amountFX = po.amountOutstandingFX - amountOnUnpaidPayments
  }

  let po = this.callerCast(); if ( ! po ) return
  if ( po.datatype() !== 'PO' ) return
  payment.purchaseOrder = po.reference()
  await defaultPaymentNumber()
  await defaultFromPO()
  await po.refreshAmountOutstanding()
})

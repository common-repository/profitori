'orders'.datatype({source: 'WC', lazyCalc: true, caption: 'Order'})
'order_id'.field({numeric: true, key: true, caption: 'Order Number'})
'order_date'.field({date: true, caption: 'Order Date'})
'status'.field()
'_billing_first_name'.field()
'_billing_last_name'.field()
'_billing_company'.field()
'_billing_address_1'.field()
'_billing_address_2'.field()
'_billing_city'.field()
'_billing_state'.field()
'_billing_postcode'.field()
'_billing_country'.field()
'_billing_email'.field()
'_billing_phone'.field()
'_shipping_first_name'.field()
'_shipping_last_name'.field()
'_shipping_company'.field()
'_shipping_address_1'.field()
'_shipping_address_2'.field()
'_shipping_city'.field()
'_shipping_state'.field()
'_shipping_postcode'.field()
'_shipping_country'.field()
'_order_currency'.field({caption: "Currency"})
'_cart_discount'.field({numeric: true, caption: "Discount Ex Tax", decimals: 2})
'_cart_discount_tax'.field({numeric: true, caption: "Discount Tax", decimals: 2})
'_order_shipping'.field({numeric: true, caption: "Shipping Ex Tax", decimals: 2})
'_order_shipping_tax'.field({numeric: true, caption: "Shipping Tax", decimals: 2})
'_order_tax'.field({numeric: true, caption: "Tax", decimals: 2})
'_order_total'.field({numeric: true, caption: "Total Amount", decimals: 2})
'_customer_user'.field({numeric: true, indexed: true})
'_wc_deposits_deposit_amount'.field({numeric: true, caption: "Deposit Amount", decimals: 2})
'_wc_deposits_deposit_paid'.field({caption: "Deposit Paid?"})
'_wc_deposits_second_payment'.field({numeric: true, caption: "Second Payment Amount", decimals: 2})
'_wc_deposits_second_payment_paid'.field({caption: "Second Payment Paid?"})
'_date_completed'.field({caption: "Date Completed", date: true, allowEmpty: true})
'_payment_method_title'.field({caption: 'Payment Method'})
'fees_total'.field({numeric: true, caption: "Fees Ex Tax", decimals: 2})
'fees_tax'.field({numeric: true, caption: "Fees Tax", decimals: 2})
'niceStatus'.field({caption: 'Status', translateOnDisplay: true})
'billingNameAndCompany'.field()
'billingAddress'.field()
'billingEmailAndPhone'.field()
'shippingNameAndCompany'.field()
'shippingAddress'.field()
'shippingEmailAndPhone'.field()
'discountIncTax'.field({numeric: true, decimals: 2})
'shippingIncTax'.field({numeric: true, decimals: 2})
'feesIncTax'.field({numeric: true, decimals: 2})
'orderTotalWithCurrency'.field({deferCalc: true})
'ourBusinessName'.field()
'ourTaxId'.field()
'ourCompanyRegistrationNumber'.field()
'ourIBAN'.field()
'ourFromAddress'.field()
'ourContactDetails'.field()
'paymentInstructions'.field()
'terms'.field()
'dueDate'.field({date: true})
'totalTax'.field({numeric: true, decimals: 2, deferCalc: true})
'unpaidExcludingThis'.field({deferCalc: true})
'paidAmount'.field({numeric: true, decimals: 2, deferCalc: true})
'billingName'.field()
'partiallyDelivered'.field({wcMeta: 'partiallyDelivered'})
'active'.field({yesOrNo: true})
'totalDueWithCurrency'.field({deferCalc: true})
'itemsTotalExTax'.field({numeric: true, deferCalc: true, decimals: 2}) // IMPORTANT: put calculated fields that need order items last (because the order item calc will need calculated
                                                        // fields from the order
'customerReference'.field({wcMeta: '_po_reference'})

'orders'.afterCreating(async function () {
  this.post_modified = global.todayYMD()
})

'orders'.method('toCustomerRef', async function() {
  let customer = await this.toCustomer(); if ( ! customer ) return null
  return customer.reference()
})

'active'.calculate(order => {
  let res = order.isActiveFast()
  return res ? 'Yes' : 'No'
})

'orders'.method('toCustomer', async function() {
  if ( ! this._customer_user )
    return null
  return await 'users'.bringSingle({id: this._customer_user})
})

'orders'.beforeSaving(async function() {
  if ( (! this.order_date) || (this.order_date === global.emptyYMD()) )
    throw(new Error('Cannot save order - has not been populated'))
  if ( this.status !== this.getOld().status ) {
    await this.refreshQuantitiesReservedForCustomerOrders({refreshClusters: true})
    if ( (this.niceStatus === 'Completed') && (! global.ymdIsSet(this._date_completed)) )
      this._date_completed = global.todayYMD()
  }
})

'orders'.method('refreshQuantitiesPackable', async function() {
  let items = await 'order_items.RecentOrActive'.bring({parentId: this.id})
  for ( var i = 0; i < items.length; i++ ) {
    let item = items[i]
    await item.refreshQuantityPackable()
  }
})

'orders'.method('refreshQuantitiesReservedForCustomerOrders', async function() {
  let items = await 'order_items.RecentOrActive'.bring({parentId: this.id})
  for ( var i = 0; i < items.length; i++ ) {
    let item = items[i]; if ( ! item ) return
    await item.refreshQuantityReservedForCustomerOrders()
  }
})

'orders.RecentOrActive'.subset(async () => {
  let config = await 'Configuration'.bringFirst()
  let weeks
  if ( config )
    weeks = config.salesRecentWeeks
  if ( ! weeks )
    weeks = 12
  let fromDate = global.todayYMD().incDays(- (weeks * 7))
  let res
  if ( config.treatOldIncompleteOrdersAsInactive === 'Yes' ) {
    res = {post_modified: {compare: '>=', value: fromDate}}
  } else {
    res = 
      {
         or: [
          {status: {compare: 'NOT IN', value: ['wc-failed', 'wc-cancelled', 'wc-refunded', 'trash', 'auto-draft', 'wc-completed']}},
          {post_modified: {compare: '>=', value: fromDate}}
        ]
      }
  }
  return res
})

'orders'.method('isActive', async function () {
  return this.isActiveFast()
})

'orders'.method('isActiveFast', function () {
  let lcStatus = this.status.toLowerCase()
  if ( lcStatus.indexOf('return') >= 0 ) return false
  if ( lcStatus.indexOf('refund') >= 0 ) return false
  let res = ['wc-failed', 'wc-cancelled', 'wc-refunded', 'trash', 'auto-draft', 'wc-completed'].indexOf(this.status) < 0
  if ( res ) {
    let treatOldAsInactive = global.confVal('treatOldIncompleteOrdersAsInactive')
    if ( treatOldAsInactive === 'Yes' ) {
      let weeks = global.confVal('salesRecentWeeks')
      let fromDate = global.todayYMD().incDays(- (weeks * 7))
      if ( this.post_modified < fromDate )
        res = false
    }
  }
  return res
})

'orders'.method('toSO', async function() {
  let res = await 'SO'.bringSingle({order: this})
  return res
})

'orders'.method('toSOFast', function() {
  let mold = global.foreman.doNameToMold('SO')
  let res = mold.fastRetrieveSingle({order: this}); if ( res === 'na' ) return null
  return res
})

'paidAmount'.calculate(order => {
  let outstanding = order.getOutstandingAmountFast()
  return - (order._order_total - outstanding)
})

'orders'.method('customerIdToOrders', async function(custId) {
  let dt = 'orders'
  if ( this.onlyHoldsSubset('RecentOrActive') )
    dt += '.RecentOrActive'
  let res = await dt.bring({_customer_user: custId}, {useIndexedField: '_customer_user'})
  return res
})

'orders'.method('customerIdToOrdersFast', function(custId) {
  let mold = this.mold()
  let ssn
  if ( this.onlyHoldsSubset('RecentOrActive') )
    ssn = 'RecentOrActive'
  return mold.fastRetrieve({_customer_user: custId}, {useIndexedField: '_customer_user', subsetName: ssn});
})

'totalDueWithCurrency'.calculate(async order => {
  let res = 0
  let custId = order._customer_user
  if ( custId ) {
    let allOrders = order.customerIdToOrdersFast(custId)
    if ( allOrders === 'na' )
      allOrders = await order.customerIdToOrders(custId)
    for ( var i = 0; i < allOrders.length; i++ ) {
      let theOrder = allOrders[i]
      let outstanding = theOrder.getOutstandingAmountFast()
      res += outstanding
    }
  } else
    res = order.getOutstandingAmountFast()
  res = order._order_currency + " " + global.numToStringWithXDecimals(res, 2)
  return res
})

'unpaidExcludingThis'.calculate(async order => {
  let custId = order._customer_user
  if ( ! custId ) return 0
  let otherOrders = order.customerIdToOrdersFast(custId)
  if ( otherOrders === 'na' )
    otherOrders = await order.customerIdToOrders(custId)
  let ids = ""
  let amt = 0
  for ( var i = 0; i < otherOrders.length; i++ ) {
    let otherOrder = otherOrders[i]
    if ( otherOrder.id === order.id ) continue
    let outstanding = otherOrder.getOutstandingAmountFast()
    if ( outstanding === 0 ) continue
    amt += outstanding
    ids = global.appendWithSep(ids, otherOrder.id + '', ', ')
  }
  ids = ids.substring(0, 20)
  let res = ids + "          " + global.numToStringWithXDecimals(amt, 2)
  return res
})

'ourBusinessName'.calculate(order => {
  let conf = 'Configuration'.bringSingleFast()
  return conf.salesInvoiceBusinessName
})

'ourTaxId'.calculate(order => {
  let conf = 'Configuration'.bringSingleFast()
  return conf.salesInvoiceTaxId
})

'ourCompanyRegistrationNumber'.calculate(order => {
  let conf = 'Configuration'.bringSingleFast()
  return conf.crn
})

'ourIBAN'.calculate(order => {
  let conf = 'Configuration'.bringSingleFast()
  return conf.ibn
})

'ourFromAddress'.calculate(order => {
  let conf = 'Configuration'.bringSingleFast()
  let res = conf.salesInvoiceAddress
  res = global.appendWithSep(res, conf.salesInvoiceCity, ", ")
  res = global.appendWithSep(res, conf.salesInvoiceState, ", ")
  res = global.appendWithSep(res, conf.salesInvoicePostcode, " ")
  res = global.appendWithSep(res, conf.salesInvoiceCountry, " ")
  return res
})

'ourContactDetails'.calculate(order => {
  let conf = 'Configuration'.bringSingleFast()
  let res = conf.salesInvoiceEmail
  res = global.appendWithSep(res, conf.salesInvoicePhoneNumber, " ")
  return res
})

'paymentInstructions'.calculate(order => {
  let conf = 'Configuration'.bringSingleFast()
  return conf.salesInvoicePaymentInstructions
})

'terms'.calculate(order => {
  let conf = 'Configuration'.bringSingleFast()
  return conf.salesInvoiceTerms
})

'dueDate'.calculate(order => {
  let conf = 'Configuration'.bringSingleFast()
  return order.order_date.incDays(conf.salesInvoiceDaysToPay)
})

'orderTotalWithCurrency'.calculate(order => {
  return order._order_currency + " " + order.fieldNameToDisplayValue("_order_total")
})

'discountIncTax'.calculate(order => {
  return order._cart_discount + order._cart_discount_tax
})

'shippingIncTax'.calculate(order => {
  return order._order_shipping + order._order_shipping_tax
})

'totalTax'.calculate(order => {
  return order._order_tax + order._order_shipping_tax
})

'itemsTotalExTax'.calculate(async order => {
  let dt = 'order_items'
  if ( order.onlyHoldsSubset('RecentOrActive') )
    dt += '.RecentOrActive'
  let items = await dt.bring({parentId: order.id})
  let res = 0
  for ( var i = 0; i < items.length; i++ ) {
    let item = items[i]
    res += global.roundToXDecimals(item._line_total, 2)
  }
  return res
})

'feesIncTax'.calculate(order => {
  return order.fees_total + order.fees_tax
})

'niceStatus'.calculate(order => {
  let res = order.status
  res = res.stripLeftChars(3).capitalizeFirstChar()
  return res
})

'billingAddress'.calculate(order => {
  let res = order._billing_address_1
  res = global.appendWithSep(res, order._billing_address_2, ", ")
  res = global.appendWithSep(res, order._billing_city, ", ")
  res = global.appendWithSep(res, order._billing_state, ", ")
  res = global.appendWithSep(res, order._billing_postcode, " ")
  res = global.appendWithSep(res, order._billing_country, " ")
  return res
})

'shippingAddress'.calculate(order => {
  let res = order._shipping_address_1
  res = global.appendWithSep(res, order._shipping_address_2, ", ")
  res = global.appendWithSep(res, order._shipping_city, ", ")
  res = global.appendWithSep(res, order._shipping_state, ", ")
  res = global.appendWithSep(res, order._shipping_postcode, " ")
  res = global.appendWithSep(res, order._shipping_country, " ")
  return res
})

'billingNameAndCompany'.calculate(order => {
  let res = order.getBillingNameAndCompany()
  return res
})

'billingName'.calculate(order => {
  let res = order.getBillingName()
  return res
})

'shippingNameAndCompany'.calculate(order => {
  let res = order._shipping_first_name
  res = global.appendWithSep(res, order._shipping_last_name, " ")
  res = global.appendWithSep(res, order._shipping_company, ", ")
  return res
})

'billingEmailAndPhone'.calculate(order => {
  let res = order._billing_email
  res = global.appendWithSep(res, order._billing_phone, " ")
  return res
})

'shippingEmailAndPhone'.calculate(order => {
  let res = order._billing_email
  res = global.appendWithSep(res, order._billing_phone, " ")
  return res
})

'orders'.method("getBillingNameAndCompany", function() {
  let res = this._billing_first_name
  res = global.appendWithSep(res, this._billing_last_name, " ")
  res = global.appendWithSep(res, this._billing_company, ", ")
  let custId = this._customer_user
  if ( custId && custId > 0 ) 
    res = global.appendWithSep(res, '(#' + custId + ')', " ")
  return res
})

'orders'.method("getBillingName", function() {
  if ( this._billing_company )
    return this._billing_company
  let res = this._billing_first_name
  res = global.appendWithSep(res, this._billing_last_name, " ")
  if ( ! res ) {
    let custId = this._customer_user
    if ( custId && custId > 0 ) 
      res = '(#' + custId + ')'
  }
  return res
})

'orders'.method("getOutstandingAmount",
  async function() {
    let paid = await this.getPaidAmount()
    let res = this._order_total - paid
    return res
  }
)

'orders'.method("getOutstandingAmountFast", function() {
  let paid = this.getPaidAmountFast()
  let res = this._order_total - paid
  return res
})

'orders'.method("getPaidAmount",
  async function() {
    let status = this.status
    if ( ["wc-pending", "wc-failed", "wc-on-hold"].indexOf(status) >= 0 ) 
      return 0
    if ( status === "wc-partially-paid" ) {
      let partial = await this.getPartialPaymentsAmount()
      return partial
    }
    return this._order_total
  }
)

'orders'.method("getPaidAmountFast", function() {
  let status = this.status
  if ( ["wc-pending", "wc-failed", "wc-on-hold"].indexOf(status) >= 0 ) 
    return 0
  if ( status === "wc-partially-paid" ) {
    let partial = this.getPartialPaymentsAmountFast()
    return partial
  }
  return this._order_total
})

'orders'.method("getPartialPaymentsAmountFast", function() {
  let deposit = this._wc_deposits_deposit_amount
  if ( this._wc_deposits_deposit_paid !== "yes" )
    deposit = 0
  let secondPayment = this._wc_deposits_second_payment
  if ( this._wc_deposits_second_payment_paid !== "yes" )
    secondPayment = 0
  let res = deposit + secondPayment
  return res
})

'orders'.method("getPartialPaymentsAmount",
  async function() {
    let deposit = this._wc_deposits_deposit_amount
    if ( this._wc_deposits_deposit_paid !== "yes" )
      deposit = 0
    let secondPayment = this._wc_deposits_second_payment
    if ( this._wc_deposits_second_payment_paid !== "yes" )
      secondPayment = 0
    let res = deposit + secondPayment
    return res
  }
)

'users'.datatype({source: 'WC', lazyCalc: true, exportable: true, caption: "Customer"})
'uniqueName'.field({essence: true, caption: 'Billing Name'})
'user_login'.field({caption: 'Login', key: true})
'user_nicename'.field({caption: 'Nice Name'})
'user_email'.field({caption: 'Email'})
'user_url'.field({caption: 'URL'})
'user_status'.field({caption: 'Status'})
'display_name'.field({caption: 'Name'})
'wp_capabilities'.field()
'billing_first_name'.field({caption: 'Billing First Name'})
'billing_last_name'.field({caption: 'Billing Last Name'})
'billing_company'.field({caption: 'Billing Company'})
'billing_address_1'.field({caption: 'Billing Address'})
'billing_address_2'.field({caption: 'Billing Address 2'})
'billing_city'.field({caption: 'Billing City'})
'billing_postcode'.field({caption: 'Billing Postal Code'})
'billing_country'.field({caption: 'Billing Country'})
'billing_state'.field({caption: 'Billing State'})
'billing_phone'.field({caption: 'Billing Phone'})
'billing_email'.field({caption: 'Billing Email'})
'shipping_first_name'.field({caption: 'Shipping First Name'})
'shipping_last_name'.field({caption: 'Shipping Last Name'})
'shipping_company'.field({caption: 'Shipping Company'})
'shipping_address_1'.field({caption: 'Shipping Address'})
'shipping_address_2'.field({caption: 'Shipping Address 2'})
'shipping_city'.field({caption: 'Shipping City'})
'shipping_postcode'.field({caption: 'Shipping Postal Code'})
'shipping_country'.field({caption: 'Shipping Country'})
'shipping_state'.field({caption: 'Shipping State'})
'first_name'.field({caption: 'First Name'})
'last_name'.field({caption: 'Last Name'})
'billingNameAndCompany'.field()
'user_id'.field({caption: 'ID', numeric: true})
'shippingAddress'.field()
'shippingNameAndCompany'.field()
'billingEmailAndPhone'.field()
'billingCountryName'.field({caption: 'Billing Country', wcMeta: '_prfi_billing_country_name'})
'shippingCountryName'.field({caption: 'Shipping Country', wcMeta: '_prfi_shipping_country_name'})
'user_pass'.field({caption: 'Password'})
'genre'.field({caption: 'Customer Type', refersTo: 'Genre', wcMeta: '_prfi_genre'})
'notes'.field({wcMeta: '_prfi_notes'})
'offlineOnly'.field({yesOrNo: true, wcMeta: '_prfi_offlineOnly'})

/* eslint-disable no-cond-assign */

'users'.method('toBillingAddress', async function() {
  let user = this
  let res = user.billing_address_1
  res = global.appendWithSep(res, user.billing_address_2, ", ")
  res = global.appendWithSep(res, user.billing_city, ", ")
  res = global.appendWithSep(res, user.billing_state, ", ")
  res = global.appendWithSep(res, user.billing_postcode, " ")
  res = global.appendWithSep(res, user.billing_country, " ")
  return res
})


'wp_capabilities'.inception('a:1:{s:8:"customer";b:1;}');

'offlineOnly'.afterUserChange(async (oldInputValue, newInputValue, user, maint) => {
  if ( ! user ) return
  if ( user.offlineOnly === 'No' ) {
    user.user_login = ''
    user.user_pass = ''
  }
  if ( user.offlineOnly === 'Yes' ) {
    user.user_login = global.foreman.uuid()
    user.user_pass = global.foreman.uuid()
    if ( ! user.user_nicename )
      user.user_nicename = user.display_name // prevent nice name defaulting to dummy user_login
  }
})

'users'.method('isCustomer', function() {
  return this.wp_capabilities && (this.wp_capabilities.indexOf('"customer"') >= 0)
})

'users'.method('toGroups', async function() {
  let groupee; let groupees = await 'Groupee'.bring({customer: this})
  let res = []
  while ( groupee = groupees.__() ) {
    let group = await groupee.toGroup(); if ( ! group ) continue
    res.push(group)
  }
  return res
})

'users'.method('productToDiscount', async function(product) {
  let discount; let discounts = await 'Discount'.bring({active: 'Yes'})
  while ( discount = discounts.__() ) {
    if ( ! await discount.appliesToCustomer(this) ) continue
    if ( ! await discount.appliesToProduct(product) ) continue
    return discount
  }
  return null
})

'users'.method('isInGroup', async function(group) {
  return await group.containsCustomer(this)
})

'users'.method('updateLead', async function() {
  let leadRef = this.__lead
  if ( ! leadRef ) return
  let leadId = leadRef.id
  if ( ! leadId ) return
  let lead = await 'Lead'.bringSingle({id: leadId}); if ( ! lead ) return
  lead.customer = this.reference()
})

'users'.beforeSaving(async function() {
  if ( this.__lead )
    await this.updateLead()
  if ( this.propChanged('shippingCountryName') )
    this.shipping_country = global.countryToCode(this.shippingCountryName)
  if ( this.propChanged('billingCountryName') )
    this.billing_country = global.countryToCode(this.billingCountryName)
})

'users'.method('maybeRefreshCountryNames', function() {
  if ( ! this.shippingCountryName )
    this.shippingCountryName = global.codeToCountry(this.shipping_country)
  if ( ! this.billingCountryName )
    this.billingCountryName = global.codeToCountry(this.billing_country)
})

'users'.afterRetrieving(async function() {
  this.maybeRefreshCountryNames()
})

'users'.afterRetrievingFast(function() {
  this.maybeRefreshCountryNames()
})

'billingEmailAndPhone'.calculate(user => {
  let res = user.billing_email
  res = global.appendWithSep(res, user.billing_phone, " ")
  return res
})

'shippingNameAndCompany'.calculate(user => {
  let res = user.shipping_first_name
  res = global.appendWithSep(res, user.shipping_last_name, " ")
  res = global.appendWithSep(res, user.shipping_company, ", ")
  return res
})

'shippingAddress'.calculate(user => {
  let res = user.shipping_address_1
  res = global.appendWithSep(res, user.shipping_address_2, ", ")
  res = global.appendWithSep(res, user.shipping_city, ", ")
  res = global.appendWithSep(res, user.shipping_state, ", ")
  res = global.appendWithSep(res, user.shipping_postcode, " ")
  res = global.appendWithSep(res, user.shipping_country, " ")
  return res
})

'users'.method('toUniqueName', function() {
  let user = this
  let res = user.billing_company
  if ( ! res ) {
    res = user.billing_first_name
    res = global.appendWithSep(res, user.billing_last_name, " ")
  }
  if ( ! res )
    res = user.display_name
  res = global.appendWithSep(res, '(' + user.user_login + ')', " ")
  return res
})

'uniqueName'.calculate(user => {
  return user.toUniqueName()
})

'user_id'.calculate(user => {
  return user.id
})

'billingNameAndCompany'.calculate(async user => {
  let res = user.billing_first_name
  res = global.appendWithSep(res, user.billing_last_name, " ")
  res = global.appendWithSep(res, user.billing_company, ", ")
  if ( ! res )
    res = user.display_name
  let custId = user.id
  if ( custId && custId > 0 ) 
    res = global.appendWithSep(res, '(#' + custId + ')', " ")
  return res
})

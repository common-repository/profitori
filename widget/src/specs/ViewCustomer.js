'ViewCustomer'.maint({panelStyle: "titled", icon: 'ShoppingBasket'})
'Add Customer'.title({when: 'adding'})
'Edit Customer'.title({when: 'editing'})
'Back'.action({act: 'cancel'})
'OK'.action({act: 'ok'})
'Save'.action({act: 'save'})
'Add another'.action({act: 'add'})
'View Sales'.action({spec: "SACustomerOrderItemList.js"})
'Attachments'.action({act: 'attachments'})
'users'.datatype()

'Customer Information'.panel()
'user_id'.field({caption: 'Customer ID', readOnly: true})
'offlineOnly'.field()
'user_login'.field({caption: 'Login'})
'user_pass'.field({allowEmpty: false})
'display_name'.field({caption: 'Name'})
'user_nicename'.field({caption: 'Nice Name'})
'user_email'.field({caption: 'Email'})
'user_url'.field({caption: 'URL'})
'genre'.field({caption: 'Customer Type'})
'user_status'.field({caption: 'Status', readOnly: true})
'notes'.field({multiLine: true})

''.panel()

'Billing'.panel()
'billing_first_name'.field({caption: 'First Name'})
'billing_last_name'.field({caption: 'Last Name'})
'billing_company'.field({caption: 'Company'})
'billing_address_1'.field({caption: 'Address'})
'billing_address_2'.field({caption: 'Address 2'})
'billing_city'.field({caption: 'City'})
'billing_state'.field({caption: 'State'})
'billing_postcode'.field({caption: 'Postal Code'})
'billingCountryName'.field({caption: 'Country'})
'billing_phone'.field({caption: 'Phone'})
'billing_email'.field({caption: 'Email'})

'Shipping'.panel()
'shipping_first_name'.field({caption: 'First Name'})
'shipping_last_name'.field({caption: 'Last Name'})
'shipping_company'.field({caption: 'Company'})
'shipping_address_1'.field({caption: 'Address'})
'shipping_address_2'.field({caption: 'Address 2'})
'shipping_city'.field({caption: 'City'})
'shipping_state'.field({caption: 'State'})
'shipping_postcode'.field({caption: 'Postal Code'})
'shippingCountryName'.field({caption: 'Country'})

'ViewCustomer'.makeDestinationFor('users')

'Agents'.manifest()
'Add Agent'.action({act: 'add'})
'Tie'.datatype()
'agent'.field()
'Trash'.action({place: 'row', act: 'trash'})
'TieMaint.js'.maintSpecname()

'offlineOnly'.readOnlyWhen((maint, user) => {
  return ! user.isNew()
})

'user_login'.visibleWhen((maint, user) => {
  return user.offlineOnly !== 'Yes'
})

'user_pass'.visibleWhen((maint, user) => {
  return user.offlineOnly !== 'Yes'
})

'ViewCustomer'.whenAdding(async function() {
  let lead = this.callerCast(); if ( ! lead ) return
  if ( lead.datatype() !== 'Lead' ) return
  await lead.refreshCalculations({force: true})
  let customer = this.cast; if ( ! customer ) return
  customer.__lead = lead.reference() // used in users.beforeSaving
  customer.display_name = lead.display_name
  customer.user_nicename = lead.display_name
  customer.billing_phone = lead.billing_phone
  customer.user_email = lead.user_email
  customer.user_url = lead.user_url
  customer.billing_first_name = lead.billing_first_name
  customer.billing_last_name = lead.billing_last_name
  customer.genre = lead.genre
  customer.notes = lead.notes
  customer.billing_company = lead.billing_company
  customer.billing_address_1 = lead.billing_address_1
  customer.billing_address_2 = lead.billing_address_2
  customer.billing_city = lead.billing_city
  customer.billing_state = lead.billing_state
  customer.billing_postcode = lead.billing_postcode
  customer.billing_country = lead.billing_country
  customer.billing_email = lead.user_email
  customer.shipping_first_name = lead.billing_first_name
  customer.shipping_last_name = lead.billing_last_name
  customer.shipping_company = lead.billing_company
  customer.shipping_address_1 = lead.billing_address_1
  customer.shipping_address_2 = lead.billing_address_2
  customer.shipping_city = lead.billing_city
  customer.shipping_state = lead.billing_state
  customer.shipping_postcode = lead.billing_postcode
  customer.shipping_country = lead.billing_country
  customer.maybeRefreshCountryNames()
})

'user_login'.readOnlyWhen((maint, user) => {
  return ! user.isNew()
})

'billingCountryName'.dynamicOptions(async () => {
  return global.getCountryNames()
})

'shippingCountryName'.dynamicOptions(async () => {
  return global.getCountryNames()
})

'user_pass'.modifyInputRenderValue((renderValue, user) => {
  return ''
})

'user_id'.visibleWhen((maint, user) => {
  return user.id > 0
})


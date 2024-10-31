'LeadMaint'.maint({panelStyle: "titled"})
'Add Lead'.title({when: 'adding'})
'Edit Lead'.title({when: 'editing'})
'Back'.action({act: 'cancel'})
'OK'.action({act: 'ok'})
'Save'.action({act: 'save'})
'Add another'.action({act: 'add'})
'Convert to Customer'.action()
'Attachments'.action({act: 'attachments'})
'Lead'.datatype()

'Lead Information'.panel()
'display_name'.field({key: true, caption: 'Name'})
'billing_phone'.field({caption: 'Phone'})
'user_email'.field({caption: 'Email'})
'user_url'.field({caption: 'URL'})
'billing_first_name'.field({caption: 'Contact First Name'})
'billing_last_name'.field({caption: 'Contact Last Name'})
'customer'.field({refersTo: 'users', hidden: true})

'Funnel'.panel()
'genre'.field({refersTo: 'Genre', caption: 'Customer Type'})
'magnitude'.field({refersTo: 'Magnitude', caption: 'Opportunity Size'})
'probability'.field({refersTo: 'Probability'})
'standing'.field({refersTo: 'Standing', caption: 'Status'})
'convertedToCustomer'.field({yesOrNo: true, readOnly: true})
'notes'.field({multiLine: true})

'Business Address'.panel()
'billing_company'.field({caption: 'Company'})
'billing_address_1'.field({caption: 'Address'})
'billing_address_2'.field({caption: 'Address 2'})
'billing_city'.field({caption: 'City'})
'billing_state'.field({caption: 'State'})
'billing_postcode'.field({caption: 'Postal Code'})
'billing_country'.field({hidden: true})
'billingCountryName'.field({caption: 'Country'})

'LeadMaint'.makeDestinationFor('Lead')

'customer'.excludeChoiceWhen( async (maint, user) => {
  return ! user.isCustomer()
})

'convertedToCustomer'.calculate(lead => {
  return lead.customer ? 'Yes' : 'No'
})

'Lead'.beforeSaving(async function() {
  if ( this.propChanged('billingCountryName') )
    this.billing_country = global.countryToCode(this.billingCountryName)
})

'Convert to Customer'.availableWhen(lead => {
  if ( ! lead )
    return false
  if ( lead.isNew() )
    return false
  if ( lead.customer )
    return false
  return true
})

'Convert to Customer'.act(async (maint, lead) => {
  await maint.segue('add', 'ViewCustomer.js')
})

'billingCountryName'.dynamicOptions(async () => {
  return global.getCountryNames()
})


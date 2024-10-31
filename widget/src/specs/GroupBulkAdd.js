'GroupBulkAdd'.list()
'Add Customers to Group'.title()
'Cancel'.action({act: 'cancel', icon: 'AngleLeft'})
'OK'.action({icon: 'CheckDouble'})
'Select All'.action() 
'Select None'.action() 

'BulkGroupee'.datatype({transient: true})
'include'.field({tickbox: true, allowInput: true})
'customer'.field({refersTo: 'users', readOnly: true, showAsLink: true})
'user_id'.field({caption: 'ID', readOnly: true})
'user_login'.field({caption: 'Login', readOnly: true})
'display_name'.field({caption: 'Name', readOnly: true})
'user_email'.field({caption: 'Email', readOnly: true})
'user_url'.field({caption: 'URL', readOnly: true})
'billing_company'.field({caption: 'Company', readOnly: true})
'billing_phone'.field({caption: 'Phone', readOnly: true})
'billing_email'.field({caption: 'Email', readOnly: true})

'Select All'.act(async (list, cast) => { 
  list.situation()._selectedAll = true 
  list.casts().forEach(bg => bg.include = 'Yes') 
  list.dataChanged() 
}) 

'Select All'.availableWhen((cast, list) => { 
  let s = list.situation() 
  return ! s._selectedAll 
}) 

'Select None'.act(async (list, cast) => { 
  list.situation()._selectedAll = false 
  list.casts().forEach(bg => bg.include = 'No') 
  list.dataChanged() 
}) 

'Select None'.availableWhen((cast, list) => { 
  let s = list.situation() 
  return s._selectedAll 
}) 

'OK'.act(async list => {

  let group = list.callerCast(); if ( ! group ) return
  let bulkGroupees = await 'BulkGroupee'.bring()
  for ( var i = 0; i < bulkGroupees.length; i++ ) {
    let bulkGroupee = bulkGroupees[i]
    if ( bulkGroupee.include !== 'Yes' ) continue
    let groupee = await 'Groupee'.bringOrCreate({group: group, customer: bulkGroupee.customer})
    await groupee.refreshCalculations({force: true, includeDefers: true})
  }

  list.ok()
})

'GroupBulkAdd'.beforeLoading(async list => {

  await 'BulkGroupee'.clear()
  let group = list.callerCast(); if ( ! group ) return
  let customers = await 'users'.bring()
  for ( var i = 0; i < customers.length; i++ ) {
    let customer = customers[i]
    if ( ! customer.wp_capabilities ) continue
    if ( customer.wp_capabilities.indexOf('"customer"') < 0 ) continue
    if ( await customer.isInGroup(group) ) continue
    let bg = await 'BulkGroupee'.create(null, {customer: customer}) 
    bg.user_id = customer.user_id
    bg.display_name = customer.display_name
    bg.user_login = customer.user_login
    bg.user_email = customer.user_email
    bg.user_url = customer.user_url
    bg.billing_company = customer.billing_company
    bg.billing_phone = customer.billing_phone
    bg.billing_email = customer.billing_email
  }
  list.startAlter({skipFieldCheck: true})
})


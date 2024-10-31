'LeadList'.list()
'Leads'.title()
'Back'.action({act: 'cancel'})
'Add'.action({act: 'add'})
'Refresh'.action({act: "refresh"})
'Customer Types'.action({spec: "GenreList.js"})
'Statuses'.action({spec: "StandingList.js"})
'Probabilities'.action({spec: "ProbabilityList.js"})
'Opportunity Sizes'.action({spec: "MagnitudeList.js"})
'Tasks'.action({spec: "TaskList.js"})
'Download to Excel'.action({act: 'excel'})
'Lead'.datatype()
'display_name'.field({caption: 'Name'})
'billing_phone'.field({caption: 'Phone'})
'user_email'.field({caption: 'Email'})
'user_url'.field({caption: 'URL'})
'contactName'.field()
'genre'.field({caption: 'Type'})
'magnitude'.field({caption: 'Size'})
'probability'.field()
'standing'.field({caption: 'Status'})
'convertedToCustomer'.field({caption: 'Is Customer'})
'attachmentIcon'.field({icon: true, caption: ''})
'Edit'.action({place: 'row'})
'Trash'.action({place: 'row', act: 'trash'})
'LeadMaint.js'.maintSpecname()

'genre'.calculateWhen(lead => {
  return lead.customer ? true : false
})

'genre'.calculate(async lead => {
  let customer = await lead.referee('customer')
  return customer.genre
})

'magnitude'.visibleWhen((list, lead) => {
  if ( ! lead ) return true
  return lead.customer ? false : true
})

'probability'.visibleWhen((list, lead) => {
  if ( ! lead ) return true
  return lead.customer ? false : true
})

'standing'.visibleWhen((list, lead) => {
  if ( ! lead ) return true
  return lead.customer ? false : true
})

'Edit'.act(async (list, lead) => {
  if ( ! lead.customer )
    await list.segue("edit", 'LeadMaint.js', lead)
  else {
    let customer = await lead.referee('customer'); if ( ! customer ) return
    await list.segue("edit", 'ViewCustomer.js', customer)
  }
})

'attachmentIcon'.calculate(async cast => {
  let attachment = await 'Attachment'.bringFirst({theParentId: cast.id})
  if ( attachment )
    return 'Paperclip'
})

'attachmentIcon'.destination(async cast => {
  return 'AttachmentsByParent.js'
})

'contactName'.calculate(lead => {
  let res = lead.billing_first_name
  res = global.appendWithSep(res, lead.billing_last_name, " ")
  return res
})

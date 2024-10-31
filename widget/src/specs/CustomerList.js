'CustomerList'.list({expose: true, icon: 'ShoppingBasket'})
'Customers'.title()
'Back'.action({act: 'cancel'})
'Add'.action({act: 'add'})
'Refresh'.action({act: "refresh"})
'Leads'.action({spec: "LeadList.js"})
'Tasks'.action({spec: "TaskList.js"})
'Discounts'.action({spec: "DiscountList.js"})
'Sales Agents'.action({spec: "AgentList.js"})
'Customer Types'.action({spec: "GenreList.js"})
'Download to Excel'.action({act: 'excel'})
'users'.datatype()
'user_id'.field()
'display_name'.field()
'user_email'.field()
'user_status'.field()
'billing_company'.field()
'billing_phone'.field()
'billing_email'.field()
'attachmentIcon'.field({icon: true, caption: ''})
'Edit'.action({place: 'row', spec: "ViewCustomer.js", act: 'edit'})
'Trash'.action({place: 'row', act: 'trash'})
'Sales'.action({place: 'row', spec: "SACustomerOrderItemList.js"})
'ViewCustomer.js'.maintSpecname()

'attachmentIcon'.calculate(async cast => {
  let attachment = await 'Attachment'.bringFirst({theParentId: cast.id})
  if ( attachment )
    return 'Paperclip'
})

'attachmentIcon'.destination(async cast => {
  return 'AttachmentsByParent.js'
})

'CustomerList'.beforeLoading(async list => {
  await list.harmonize()
})

'CustomerList'.filter(async (user, list) => {
  return user.wp_capabilities && (user.wp_capabilities.indexOf('"customer"') >= 0)
})

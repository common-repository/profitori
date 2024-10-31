'SupplierList'.list({expose: true, icon: 'UserFriends'})
'Suppliers'.title()
'Back'.action({act: 'cancel'})
'Add'.action({act: 'add'})
'Refresh'.action({act: "refresh"})
'Download to Excel'.action({act: 'excel'})
'Supplier'.datatype()
'name'.field()
'mainContactPerson'.field()
'phone'.field()
'mobile'.field()
'email'.field()
'notes'.field()
'attachmentIcon'.field({icon: true, caption: ''})
'Edit'.action({place: 'row', act: 'edit'})
'Trash'.action({place: 'row', act: 'trash'})
'View Orders'.action({place: 'row', spec: "POReport.js"})
'View Products'.action({place: 'row', spec: "ProductReport.js"})
'SupplierMaint.js'.maintSpecname()

'SupplierList'.beforeLoading(async list => {
  await list.harmonize()
})

'attachmentIcon'.calculate(async cast => {
  let attachment = await 'Attachment'.bringFirst({theParentId: cast.id})
  if ( attachment )
    return 'Paperclip'
})

'attachmentIcon'.destination(async cast => {
  return 'AttachmentsByParent.js'
})

'Supplier'.allowTrash(async function() {
  let po = await 'PO'.bringFirst({supplier: this.reference()})
  if ( po ) return "Supplier has been referenced on Purchase Order ".translate() + po.purchaseOrderNumber + " and so cannot be trashed".translate()
  let av = await 'Avenue'.bringFirst({supplier: this.reference()})
  if ( av ) {
    let name = await av.toProductUniqueName()
    return "Supplier is referenced on Product ".translate() + name + " and so cannot be trashed".translate()
  }
  return null
})

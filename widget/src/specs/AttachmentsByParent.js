'AttachmentsByParent'.list({icon: 'Paperclip'})
'Attachments'.title()
'Back'.action({act: 'cancel'})
'Add'.action({act: 'add'})

'Attachment'.datatype()
'attachmentType'.field()
'fileName'.field()
'description'.field()
'attachedDate'.field()
'contents'.field({caption: ''})
'Edit'.action({place: 'row', act: 'edit'})
'Trash'.action({place: 'row', act: 'trash'})
'AttachmentMaint.js'.maintSpecname()

'AttachmentsByParent'.dynamicTitle(function() {
  let res = 'Attachments'
  let cast = this.callerCast(); if ( ! cast ) return res
  let keyValue
  let key = cast.__mold.key
  if ( key ) {
    keyValue = cast[key]
    if ( global.isObj(keyValue) )
      keyValue = keyValue['keyval']
  }
  if ( keyValue )
    res += ' for ' + cast.datatypeCaption() + ' ' + keyValue
  return res
})

'AttachmentsByParent'.defaultSort({field: 'attachedDate'})

'AttachmentsByParent'.filter(async (attachment, list) => {
  let cast = list.callerCast(); if ( ! cast ) return false
  return attachment.theParentId === cast.id 
})

'AttachmentMaint'.maint({panelStyle: "titled", icon: 'Paperclip'})
'Add Attachment'.title({when: 'adding'})
'Edit Attachment'.title({when: 'editing'})
'Back'.action({act: 'cancel'})
'OK'.action({act: 'ok'})
'Save'.action({act: 'save'})
'Attachment'.datatype()

''.panel()
'documentType'.field({readOnly: true})
'datatype'.field({readOnly: true})
'theParentId'.field({hidden: true})
'parentReference'.field({readOnly: true, showAsLink: true})
'attachmentType'.field()
'description'.field()
'attachedDate'.field({date: true, readOnly: true})
'contents'.field()
'fileName'.field({readOnly: true})

'AttachmentMaint'.warning(async (maint, attachment) => {
  if ( attachment.attachmentType !== 'Serial Numbers' ) return
  let fileName = attachment.contents; if ( ! fileName ) return
  fileName = fileName.toLowerCase()
  if ( ! (fileName.endsWith('.csv') || fileName.endsWith('.txt')) )
    return "This attachment will not be searchable (Only CSV and TXT files are searchable)"
})

'parentReference'.destination(async attachment => {
  return await attachment.toParent()
})

'AttachmentMaint'.makeDestinationFor('Attachment')

'fileName'.visibleWhen((maint, attachment) => {
  return attachment.fileName ? true : false
})

'AttachmentMaint'.whenAdding(async function(attachment, maint) {
  let cast = maint.callerCast(); if ( ! cast ) return
  attachment.datatype = cast.datatype()
  attachment.theParentId = cast.id
  await attachment.refreshEntityName()
})

'contents'.afterChoosingFile(async (maint, files) => {
  if ( files.length === 0 )
    return
  let attachment = maint.mainCast(); if ( ! attachment ) return
  if ( files.length !== 1 ) {
    maint.app().showMessage('Please select a single file')
    return
  }
  let f = files[0]
  let reader = new FileReader()
  reader.onload = function(e) {
    attachment.contents = btoa(e.target.result)
    attachment.__fileName = f.name
    attachment.fileName = f.name
  }
  reader.readAsBinaryString(f);
})



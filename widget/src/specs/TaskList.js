'TaskList'.list()
'Tasks'.title()
'Back'.action({act: 'cancel'})
'Add'.action({act: 'add'})
'Refresh'.action({act: "refresh"})
'Agents'.action({spec: "AgentList.js"})
'Download to Excel'.action({act: 'excel'})
'Task'.datatype()
'taskNumber'.field({key: true})
'description'.field()
'agent'.field()
'lead'.field()
'customer'.field()
'priority'.field()
'status'.field()
'startDate'.field()
'expectedFinishDate'.field()
'attachmentIcon'.field({icon: true, caption: ''})
'Edit'.action({place: 'row', act: 'edit'})
'Trash'.action({place: 'row', act: 'trash'})
'TaskMaint.js'.maintSpecname()

'attachmentIcon'.calculate(async cast => {
  let attachment = await 'Attachment'.bringFirst({theParentId: cast.id})
  if ( attachment )
    return 'Paperclip'
})

'attachmentIcon'.destination(async cast => {
  return 'AttachmentsByParent.js'
})

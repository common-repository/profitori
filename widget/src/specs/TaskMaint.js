'TaskMaint'.maint({panelStyle: "titled"})
'Add Task'.title({when: 'adding'})
'Edit Task'.title({when: 'editing'})
'Back'.action({act: 'cancel'})
'OK'.action({act: 'ok'})
'Save'.action({act: 'save'})
'Attachments'.action({act: 'attachments'})
'Add another'.action({act: 'add'})
'Task'.datatype()

'Task Summary'.panel()
'taskNumber'.field({key: true})
'description'.field()
'notes'.field({multiLine: true})
'agent'.field({refersTo: 'Agent', allowEmpty: true})
'lead'.field({refersTo: 'Lead', allowEmpty: true})
'customer'.field({refersTo: 'users', allowEmpty: true})
'priority'.field()

'Progress'.panel()
'status'.field()
'createdDate'.field({date: true, readOnly: true})
'startDate'.field({date: true, allowEmpty: true})
'estimatedHours'.field({numeric: true})
'actualHours'.field({numeric: true})
'expectedFinishDate'.field({date: true, allowEmpty: true})
'actualFinishDate'.field({date: true, allowEmpty: true})

'priority'.options(['', '1', '2', '3', '4', '5', '6', '7', '8', '9'])

'status'.options(['', 'New', 'In Progress', 'Completed'])

'status'.inception('New')

'expectedFinishDate'.inception(global.emptyYMD())

'actualFinishDate'.inception(global.emptyYMD())

'customer'.excludeChoiceWhen( async (maint, user) => {
  return ! user.isCustomer()
})

'agent'.inception(async task => {
  let agent = await global.getLoggedInAgent(); if ( ! agent ) return null
  return agent.reference()
})

'status'.afterUserChange(async (oldInputValue, newInputValue, task, maint) => {
  if ( (task.status === 'Completed') && (task.actualFinishDate === global.emptyYMD()) )
    task.actualFinishDate = global.todayYMD()
})

'TaskMaint'.whenAdding(async function() {

  let defaultNumber = async () => {
    let res
    while ( true ) {
      let nextNo = await 'NextNumber'.bringOrCreate({forDatatype: 'Task'})
      nextNo.number = nextNo.number + 1
      let noStr = nextNo.number + ""
      res = "TA" + noStr.padStart(5, '0')
      let task = await 'Task'.bringFirst({taskNumber: res})
      if ( ! task )
        break
    }
    this.setFieldValue('taskNumber', res)
  }

  await defaultNumber()
})

'actualFinishDate'.visibleWhen((maint, task) => {
  return task.status === 'Completed'
})

'actualHours'.visibleWhen((maint, task) => {
  return task.status === 'Completed'
})


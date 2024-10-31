'GroupMaint'.maint({panelStyle: "titled"})
'Add Customer Group'.title({when: 'adding'})
'Edit Customer Group'.title({when: 'editing'})
'Back'.action({act: 'cancel'})
'OK'.action({act: 'ok'})
'Save'.action({act: 'save'})
'Add another'.action({act: 'add'})
'Group'.datatype()

'Group Details'.panel()
'groupName'.field({key: true})
'description'.field()

'Customers'.manifest()
'Add Customers'.action({noSave: true})
'Groupee'.datatype({exportable: true})
'group'.field({refersToParent: 'Group', hidden: true})
'customer'.field({refersTo: 'users', showAsLink: true, indexed: true})
'user_id'.field({hidden: true, numeric: true, storedCalc: true})
'groupName'.field({hidden: true, storedCalc: true})
'Remove'.action({place: 'row', act: 'trash'})

'Groupee'.cruxFields(['group', 'customer'])

'Add Customers'.act(async (maint, group) => {
  await maint.segue('view', 'GroupBulkAdd.js', group)
})

'Group'.method('containsCustomer', async function(customer) {
  let groupee = await 'Groupee'.bringFirst({group: this, customer: customer}, {useIndexedField: 'customer'})
  return groupee ? true : false
})

'Groupee'.method('toGroup', async function() {
  return await this.referee('group')
})

'groupName'.calculate(groupee => {
  if ( ! groupee.group ) return null
  return groupee.group.keyval
})

'user_id'.calculate(groupee => {
  if ( ! groupee.customer ) return null
  return groupee.customer.id
})
'user_id'.calculate(groupee => {
  if ( ! groupee.customer ) return null
  return groupee.customer.id
})

'AccountMaint'.maint({panelStyle: "titled"})
'Add Account'.title({when: 'adding'})
'Edit Account'.title({when: 'editing'})
'Back'.action({act: 'cancel'})
'OK'.action({act: 'ok'})
'Save'.action({act: 'save'})
'Add another'.action({act: 'add'})
'Attachments'.action({act: 'attachments'})
'Account'.datatype()

'Account Information'.panel()
'accountCode'.field()
'name'.field()
'type'.field()
'taxTreatment'.field()
'notes'.field({multiLine: true})
'ytdBalance'.field({readOnly: true})
'balance'.field({readOnly: true})

'AccountMaint'.makeDestinationFor('Account')

'type'.inception('Expenditure')

'taxTreatment'.inception('Taxed')

'ytdBalance'.visibleWhen((maint, account) => {
  return ( (account.type === 'Income') || (account.type === 'Expenditure') )
})

'balance'.visibleWhen((maint, account) => {
  return ( (account.type !== 'Income') && (account.type !== 'Expenditure') )
})

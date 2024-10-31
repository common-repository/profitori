'EntryLineMaint'.maint({panelStyle: "titled"})
'Add Journal Entry Line'.title({when: 'adding'})
'Edit Journal Entry Line'.title({when: 'editing'})
'Back'.action({act: 'cancel'})
'OK'.action({act: 'ok'})
'Save'.action({act: 'save'})
'Add another line'.action({act: 'add'})
'EntryLine'.datatype()

'Line Details'.panel()
'entry'.field({readOnly: true})
'account'.field()
'accountType'.field({readOnly: true})
'amount'.field()
'effectOnLedger'.field({readOnly: true})
'notes'.field()

'account'.afterUserChange(async (oldInputValue, newInputValue, line) => {
  if ( line.amount ) return
  let account = await line.referee('account'); if ( ! account ) return 0
  let entry = await line.parent()
  let res = - entry.balance
  if ( account.drcr === 'CR' )
    res = - res
  line.amount = res
})

'AccountList'.list({expose: true})
'General Ledger'.title()
'Back'.action({act: 'cancel'})
'Add Account'.action({act: 'add'})
'Journal Entries'.action({spec: 'EntryLineList.js'})
'Refresh'.action({act: "refresh"})
'Download to Excel'.action({act: 'excel'})
'Profit and Loss'.action({spec: 'StatementReport.js', parms: {statementName: 'Profit and Loss'}})
'Balance Sheet'.action({spec: 'StatementReport.js', parms: {statementName: 'Balance Sheet'}})
'Account'.datatype()
'accountCode'.field()
'name'.field()
'type'.field()
'ptdBalance'.field()
'ytdBalance'.field()
'balance'.field()
'drcr'.field()
'Edit'.action({place: 'row', act: 'edit'})
'Trash'.action({place: 'row', act: 'trash'})
'AccountMaint.js'.maintSpecname()

'AccountList'.beforeLoading(async list => {
  await list.harmonize()
})

'ptdBalance'.modifyRenderValue((val, account) => {
  if ( ! account.ptdBalance ) return ''
  if ( (account.type !== 'Income') && (account.type !== 'Expenditure') )
    return ''
  return val
})

'ytdBalance'.modifyRenderValue((val, account) => {
  if ( ! account.ytdBalance ) return ''
  if ( (account.type !== 'Income') && (account.type !== 'Expenditure') )
    return ''
  return val
})

'balance'.modifyRenderValue((val, account) => {
  if ( ! account.balance ) return ''
  if ( (account.type === 'Income') || (account.type === 'Expenditure') )
    return ''
  return val
})

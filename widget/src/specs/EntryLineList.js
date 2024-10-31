'EntryLineList'.list()
'Journal Entries'.title()
'Back'.action({act: 'cancel'})
'Add'.action({act: 'add'})
'Refresh'.action({act: "refresh"})
'Download to Excel'.action({act: 'excel'})
'EntryLine'.datatype()
'entryNumber'.field()
'effectiveDate'.field()
'account'.field()
'drAmount'.field()
'crAmount'.field()
'Edit'.action({place: 'row', act: 'edit'})
'Trash'.action({place: 'row', act: 'trash'})
'EntryMaint.js'.maintSpecname()

'drAmount'.modifyRenderValue((val, line) => {
  if ( line.drAmount ) return val
  return ''
})

'crAmount'.modifyRenderValue((val, line) => {
  if ( line.crAmount ) return val
  return ''
})


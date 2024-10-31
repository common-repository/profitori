'EntryMaint'.maint({panelStyle: "titled"})
'Add Journal Entry'.title({when: 'adding'})
'Edit Journal Entry'.title({when: 'editing'})
'Back'.action({act: 'cancel'})
'OK'.action({act: 'ok'})
'Save'.action({act: 'save'})
'Add another'.action({act: 'add'})
'Attachments'.action({act: 'attachments'})
'Entry'.datatype({caption: 'Journal Entry'})

'Entry Summary'.panel()
'entryNumber'.field({key: true})
'effectiveDate'.field()
'enteredDate'.field({readOnly: true})

'Details'.panel()
'notes'.field()
'balance'.field({readOnly: true})
'posted'.field({readOnly: true})

'Lines'.manifest()
'Add Line'.action({act: 'add'})
'EntryLine'.datatype()
'account'.field({showAsLink: true})
'drAmount'.field({showTotal: true})
'crAmount'.field({showTotal: true})
'notes'.field()
'Edit'.action({place: 'row', act: 'edit'})
'Trash'.action({place: 'row', act: 'trash'})
'EntryLineMaint.js'.maintSpecname()

'EntryMaint'.warning(async (maint, entry) => {
  if ( entry.posted === 'Yes' ) return
  return "Journal Entry is out of balance and has not been posted".translate()
})

'EntryMaint'.substituteCast(async (cast, maint) => {
  let res = cast
  if ( ! res )
    return res
  if ( res.datatype() === 'EntryLine' )
    res = await cast.parent()
  return res
})

'EntryMaint'.whenAdding(async function() {

  let defaultNumber = async () => {
    let nextNo = await 'NextNumber'.bringOrCreate({forDatatype: 'EN'})
    nextNo.number = nextNo.number + 1
    let noStr = nextNo.number + ""
    let adjNo = "JE" + noStr.padStart(5, '0')
    this.setFieldValue('entryNumber', adjNo)
  }

  await defaultNumber()

})

'drAmount'.modifyRenderValue((val, line) => {
  if ( line.drAmount ) return val
  return ''
})

'crAmount'.modifyRenderValue((val, line) => {
  if ( line.crAmount ) return val
  return ''
})


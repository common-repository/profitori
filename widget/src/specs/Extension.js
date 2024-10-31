'Extension'.datatype({plex: false})
'specname'.field({key: true, caption: 'Spec Name'})
'status'.field()
'errorMessage'.field({caption: 'Error'})
'blueprint'.field({caption: 'Javascript Code'})

'status'.inception('Valid')

'Extension'.beforeSaving(async function() {
  let bis = await 'BuiltInSpec'.bringFirst({name: this.specname})
  if ( bis )
    throw(new Error("This name conflicts with a built-in spec"))
})

/* eslint-disable no-eval */

'Extension'.afterSaving(async function() {
  await global.gApp.createMoldsAndMenus()
})

'Extension'.method("refreshStatus", async function () {

  let cookMsg = msg => {
    let orig = msg
    let remObj = {}
    msg = msg.stripAfterLast(' (', remObj)
    let coords = remObj.str
    let brackPos = coords.indexOf('(')
    if ( brackPos < 0 ) return orig
    let colonPos = coords.indexOf(':')
    if ( colonPos < 0 ) return orig
    let closeBrackPos = coords.indexOf(')')
    if ( closeBrackPos < 0 ) return orig
    let row = coords.substr(brackPos + 1, colonPos - brackPos - 1)
    let col = coords.substr(colonPos + 1, closeBrackPos - colonPos - 1)
    msg = "Error on line " + row + " (character " + col + "): " + msg
    return msg
  }

  let ext = this
  let code = ext.blueprint
  ext.errorMessage = ''
  if ( ! code ) {
    ext.status = 'Valid'
    return
  }
  try {
    code.jsParse()
  } catch (e) {
    let msg = cookMsg(e.message)
    ext.errorMessage = msg
  }
  if ( ext.errorMessage )
    ext.status = 'Invalid'
  else
    ext.status = 'Valid'
})

'blueprint'.afterUserChange(async (oldInputValue, newInputValue, ext) => {
  await ext.refreshStatus()
})

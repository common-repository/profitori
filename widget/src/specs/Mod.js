'Mod'.datatype({plex: false})
'builtInSpecname'.field({caption: 'Built-in Spec Name', key: true})
'status'.field()
'errorMessage'.field({caption: 'Error'})
'blueprint'.field({caption: 'Javascript Code'})

/* eslint-disable no-eval */

'Mod'.afterSaving(async function() {
  await global.gApp.createMoldsAndMenus()
})

'Mod'.method("refreshStatus", async function () {

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

  let mod = this
  let code = mod.blueprint
  mod.errorMessage = ''
  if ( ! code ) {
    mod.status = 'Valid'
    return
  }
  try {
    code.jsParse()
  } catch (e) {
    let msg = cookMsg(e.message)
    mod.errorMessage = msg
  }
  if ( ! mod.errorMessage ) {
    try {
      //global.currentSpecname = customSpec.name
      //eval(code)
    } catch(e) {
      mod.errorMessage = e.message
    }
  }
  if ( mod.errorMessage )
    mod.status = 'Invalid'
  else
    mod.status = 'Valid'
})

'blueprint'.afterUserChange(async (oldInputValue, newInputValue, mod) => {
  await mod.refreshStatus()
})

'CustomSpecMaint'.maint()
'Add Custom Spec'.title({when: 'adding'})
'Edit Custom Spec'.title({when: 'editing'})
'Back'.action({act: 'cancel'})
'OK'.action({act: 'ok'})
'Save'.action({act: 'save'})
'CustomSpec'.datatype()

'Main'.panel()
'configuration'.field({hidden: true})
'name'.field({caption: 'Custom Spec Name'})
'canon'.field()
'status'.field({readOnly: true})
'errorMessage'.field({readOnly: true, caption: 'Error'})

''.panel()

'Blueprint'.panel({fullWidth: true})
'blueprint'.field({caption: 'Javascript Code', jsEditor: true})

/* eslint-disable no-eval */

'canon'.afterUserChange(async (oldInputValue, newInputValue, customSpec) => {
  let canon = await customSpec.referee('canon'); if ( ! canon ) return
  customSpec.blueprint = canon.blueprint
  await customSpec.refreshStatus()
})

'CustomSpec'.method("refreshStatus", async function () {

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

  let customSpec = this
  let code = customSpec.blueprint
  customSpec.errorMessage = ''
  if ( ! code ) {
    customSpec.status = 'Invalid'
    customSpec.errorMessage = 'No javascript code has been entered'.translate()
    return
  }
  try {
    code.jsParse()
  } catch (e) {
    let msg = cookMsg(e.message)
    customSpec.errorMessage = msg
  }
  if ( ! customSpec.errorMessage ) {
    try {
      global.currentSpecname = customSpec.name
      eval(code)
    } catch(e) {
      customSpec.errorMessage = e.message
    }
  }
  if ( customSpec.errorMessage )
    customSpec.status = 'Invalid'
  else
    customSpec.status = 'Valid'
})

'blueprint'.afterUserChange(async (oldInputValue, newInputValue, customSpec) => {
  await customSpec.refreshStatus()
})

'name'.afterUserChange(async (oldInputValue, newInputValue, customSpec) => {
  await customSpec.refreshStatus()
})

'status'.visibleWhen((maint, customSpec) => {
  return customSpec.errorMessage ? false : true
})

'errorMessage'.visibleWhen((maint, customSpec) => {
  return customSpec.errorMessage ? true : false
})

'canon'.excludeChoiceWhen( async (maint, canon) => {
  let firstLine = canon.blueprint.indexToLineStr(0)
  return (firstLine.indexOf('.list(') < 0) && (firstLine.indexOf('.graph(') < 0)
})

'canon'.readOnlyWhen((maint, customSpec) => {
  return customSpec.blueprint && customSpec.canon && (customSpec.blueprint !== customSpec.canonBlueprint)
})

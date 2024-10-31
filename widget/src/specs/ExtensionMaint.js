'ExtensionMaint'.maint()
'Add Extension Spec'.title({when: 'adding'})
'Edit Extension Spec'.title({when: 'editing'})
'Back'.action({act: 'cancel'})
'OK'.action({act: 'ok'})
'Save'.action({act: 'save'})
'Extension'.datatype()

'Main'.panel()
'specname'.field()
'status'.field({readOnly: true})
'errorMessage'.field({readOnly: true})

''.panel()

'Blueprint'.panel({fullWidth: true})
'blueprint'.field({jsEditor: true})

'status'.visibleWhen((maint, ext) => {
  return ext.errorMessage ? false : true
})

'errorMessage'.visibleWhen((maint, ext) => {
  return ext.errorMessage ? true : false
})

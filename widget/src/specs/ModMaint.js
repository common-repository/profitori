'ModMaint'.maint()
'Back'.action({act: 'cancel'})
'OK'.action({act: 'ok'})
'Save'.action({act: 'save'})
'View Original Spec'.action({spec: "ViewCanon.js"})
'Mod'.datatype()

'Main'.panel()
'builtInSpecname'.field({readOnly: true})
'status'.field({readOnly: true})
'errorMessage'.field({readOnly: true})

''.panel()

'Blueprint'.panel({fullWidth: true})
'blueprint'.field({jsEditor: true})

'ModMaint'.dynamicTitle(function() {
  let cast = this.mainCast(); if ( ! cast ) return 
  if ( cast.datatype() === 'Mod' ) 
    return 'Modify ' + cast.builtInSpecname
  return 'Modify ' + cast.name
})

'ModMaint'.substituteCast(async cast => {
  if ( cast.datatype() === 'Mod' ) {
    await cast.refreshStatus()
    return cast
  }
  let builtInSpec = cast
  let mod = await 'Mod'.bringOrCreate({builtInSpecname: builtInSpec.name})
  await mod.refreshStatus()
  return mod
})

'status'.visibleWhen((maint, mod) => {
  return mod.errorMessage ? false : true
})

'errorMessage'.visibleWhen((maint, mod) => {
  return mod.errorMessage ? true : false
})

'ModMaint'.makeDestinationFor('Mod')

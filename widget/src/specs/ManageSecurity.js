'ManageSecurity'.maint({panelStyle: "titled", icon: 'Lock'})
'Security'.title()
'Back'.action({act: 'cancel'})
'OK'.action({act: 'ok'})
'Save'.action({act: 'save'})
'Configuration'.datatype()

''.panel()
'usersWithAccess'.field()
'controlAccessAtPageLevel'.field()

'Pages'.manifest()
'SpecConfig'.datatype({exportable: true, plex: true})
'configuration'.field({hidden: true, refersToParent: 'Configuration'})
'specName'.field()
'usersWithAccessToSpec'.field({readOnly: false, caption: 'Grant access to these users only (comma separated)'})

'Pages'.defaultSort({field: "specName"})

'ManageSecurity'.afterInitialising(async configuration => {
  await configuration.refreshSpecConfigs()
})

'controlAccessAtPageLevel'.afterUserChange(async (oldInputValue, newInputValue, configuration) => {
  await configuration.refreshSpecConfigs()
  global.foreman.doSave({msgOnException: true})
  global.gApp.controlAccessAtPageLevel = (configuration.controlAccessAtPageLevel === 'Yes')
})

'Configuration'.method('refreshSpecConfigs', async function() {
  if ( this.controlAccessAtPageLevel !== 'Yes' ) return
  let specNames = await this.getSpecNames()
  for ( var i = 0; i < specNames.length; i++ ) {
    let specName = specNames[i]
    await 'SpecConfig'.bringOrCreate({configuration: this.reference(), specName: specName})
  }
})

'Configuration'.method('getSpecNames', async function() {
  let res = []
  let builtInSpecs = await 'BuiltInSpec'.bring({isUISpec: 'Yes'})
  for ( var i = 0; i < builtInSpecs.length; i++ ) {
    let builtInSpec = builtInSpecs[i]
    res.push(builtInSpec.name)
  }
  let customSpecs = await 'CustomSpec'.bring()
  for ( i = 0; i < customSpecs.length; i++ ) {
    let customSpec = customSpecs[i]
    res.push(customSpec.name)
  }
  return res
})


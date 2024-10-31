'BuiltInSpec'.datatype({plex: true})
'name'.field({key: true})
'modified'.field({yesOrNo: true})
'isUISpec'.field({yesOrNo: true})

'BuiltInSpec'.data(async function() {
  let res = []
  let specs = global.prfiSpecIndex
  for ( var i = 0; i < specs.length; i++ ) {
    let isUISpec = global.prfiSpecIsUI[i] ? 'Yes' : 'No'
    res.push({name: specs[i].stripRight('.js'), isUISpec: isUISpec})
  }
  return res
})

'modified'.calculate(async bis => {
  let mod = await 'Mod'.bringFirst({builtInSpecname: bis.name})
  return (mod && mod.blueprint) ? 'Yes' : 'No'
})

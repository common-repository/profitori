'Genus'.datatype()
'genusName'.field({key: true})

'Genus'.data(async function() {
  let res = []
  let molds = global.foreman.molds
  for ( var i = 0; i < molds.length; i++ ) {
    let m = molds[i]
    if ( m._hasMaint || m.exportable )
      res.push({genusName: m.name})
  }
  return res
})

'ViewCanon'.maint({readOnly: true, panelStyle: 'titled'})
'View Original Spec'.title()
'Back'.action({act: 'cancel'})
'canon'.datatype()

'Original Spec Details'.panel({fullWidth: true})
'blueprint'.field({jsEditor: true, caption: 'Javascript Code'})
'path'.field()

'ViewCanon'.makeDestinationFor('canon')

'ViewCanon'.substituteCast(async (cast, maint) => {

  let modToCanon = async mod => {
    let canons = await 'canon'.bring()
    for ( var i = 0; i < canons.length; i++ ) {
      let canon = canons[i]
      if ( canon.path && canon.path.endsWith('/' + mod.builtInSpecname + '.js') )
        return canon
    }
    return null
  }

  let res = maint.callerCast()
  if ( ! res )
    return res
  if ( res.datatype() === 'Mod' )
    res = await modToCanon(res)
  return res
})


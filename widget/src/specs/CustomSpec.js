'CustomSpec'.datatype({plex: true})
'configuration'.field({refersToParent: 'Configuration'})
'name'.field({key: true})
'canon'.field({refersTo: 'canon', caption: 'Based On'})
'blueprint'.field()
'status'.field()
'errorMessage'.field()
'canonBlueprint'.field()

'CustomSpec'.afterCreating(async function () {
  let config = await 'Configuration'.bringFirst()
  this.configuration = config.reference()
  this.status = 'Invalid'
  this.errorMessage = 'No javascript code has been entered'.translate()
})

'canonBlueprint'.calculate(async customSpec => {
  if ( ! customSpec.canon ) return ''
  let canon = await customSpec.referee('canon'); if ( ! canon ) return ''
  return canon.blueprint
})

'CustomSpec'.beforeSaving(async function() {
  let canon = await 'canon'.bringFirst({path: 'specs/' + this.name + '.js'})
  if ( ! canon )
    canon = await 'canon'.bringFirst({path: 'premium/specs/' + this.name + '.js'})
  if ( canon )
    throw(new Error(this.name + ' already exists - please specify a different list name'.translate()))
})

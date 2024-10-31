'UserFilterLineMaint'.maint()
'Add Filter Line'.title({when: 'adding'})
'Edit Filter Line'.title({when: 'editing'})
'Back'.action({act: 'cancel'})
'OK'.action({act: 'okNoSave'})
'Add another line'.action({act: 'addNoSave'})
'UserFilterLine'.datatype({plex: true})

'Line Details'.panel()
'userFilter'.field({refersToParent: 'UserFilter', caption: 'Filter Name'})
'fieldName'.field()
'operator'.field({translateOnDisplay: true})
'expression'.field()
'sequence'.field({numeric: true})
'compareAsString'.field({yesOrNo: true, hidden: true})

'expression'.afterUserChange(async (oldInputValue, newInputValue, ufl, maint) => {
  let uf = await ufl.parent()
  uf.version++
})

'operator'.afterUserChange(async (oldInputValue, newInputValue, ufl, maint) => {
  let uf = await ufl.parent()
  uf.version++
  if ( ! ufl.operatorIsComparison() ) {
    ufl.fieldName = ''
    ufl.expression = ''
  }
})

'fieldName'.afterUserChange(async (oldInputValue, newInputValue, ufl, maint) => {
  let uf = await ufl.parent()
  uf.version++
  ufl.compareAsString = 'No'
  let list = maint.getFirstAncestorList({exclude: 'UserFilterList.js'}); if ( ! list ) return
  let fields = list.getGridFields()
  let theField
  for ( var i = 0; i < fields.length; i++ ) {
    let f = fields[i]
    if ( f.name !== newInputValue ) continue
    theField = f
  }
  if ( ! theField ) return
  if ( theField.numeric ) return
  ufl.compareAsString = 'Yes'
})

'fieldName'.dynamicOptions(async maint => {
  let res = []
  let list = maint.getFirstAncestorList({exclude: 'UserFilterList.js'}); if ( ! list ) return res
  let fields = list.getGridFields()
  for ( var i = 0; i < fields.length; i++ ) {
    let f = fields[i]
    res.push(f.name)
  }
  return res
})

'UserFilterLine'.beforeSaving(async function() {
  if ( this.operatorIsComparison() ) {
    if ( ! this.fieldName ) 
      throw(new Error('Field cannot be empty'))
  }
})

'UserFilterLine'.afterCreating(async function() {

  let uf = await this.parent()
  uf.version++

  let defaultSequence = async () => {
    let ufls = await 'UserFilterLine'.bringChildrenOf(uf)
    ufls.sort((f1, f2) => (f1.sequence > f2.sequence ? 1 : -1))
    let lastUfl = ufls.last()
    if ( ! lastUfl ) {
      this.sequence = 10
      return
    }
    let roundedSeq = lastUfl.sequence
    if ( (roundedSeq % 10) !== 0 )
      roundedSeq += 10 - (roundedSeq % 10)
    this.sequence = roundedSeq + 10
  }

  await defaultSequence()

})

'fieldName'.visibleWhen((maint, ufl) => {
  return ufl.operatorIsComparison()
})

'expression'.visibleWhen((maint, ufl) => {
  return ufl.operatorIsComparison()
})

'UserFilterLine'.method('operatorIsComparison', function () {
  return ['equals', 'contains', 'starts with', 'ends with', 'greater than', 'greater than or equal to', 'less than', 
    'less than or equal to', 'does not equal'].contains(this.operator)
})

'operator'.options([
  'equals', 
  'contains', 
  'starts with', 
  'ends with', 
  'greater than', 
  'greater than or equal to', 
  'less than', 
  'less than or equal to', 
  'does not equal',
  'not',
  'and',
  'or',
  '(',
  ')'
])

'operator'.inception('equals')

'UserFilterMaint'.maint()
'Add Filter'.title({when: 'adding'})
'Edit Filter'.title({when: 'editing'})
'Back'.action({act: 'cancel'})
'OK'.action({act: 'ok'})
'UserFilter'.datatype({caption: 'Filter', plex: true})

'Main'.panel()
'name'.field({key: true, caption: 'Filter Name'})
'version'.field({numeric: true, hidden: true})
'specname'.field({hidden: true})

'Lines'.manifest()
'Add Line'.action({act: 'addNoSave'})
'UserFilterLine'.datatype()
'fieldName'.field()
'operator'.field()
'expression'.field()
'sequence'.field({numeric: true})
'Edit'.action({place: 'row', act: 'edit'})
'Trash'.action({place: 'row', act: 'trash'})
'UserFilterLineMaint.js'.maintSpecname()

'UserFilter'.cruxFields(['name', 'specname'])

'UserFilterMaint'.whenAdding(async function(uf, maint) {
  let list = maint.getFirstAncestorList({exclude: 'UserFilterList.js'}); if ( ! list ) return
  uf.specname = list.specname()
})

'Lines'.defaultSort({field: "sequence"})

'UserFilterMaint'.onOK(async (maint, userFilter) => {
  if ( ! userFilter ) return
  let list = maint.getFirstAncestorList({exclude: 'UserFilterList.js'}); if ( ! list ) return
  list.berth().currentUserFilter = userFilter
})

'UserFilter'.beforeSaving(async function() {

  let validate = async () => {
    let obj = await this.convertToJS()
    if ( obj.err )
      throw(new Error(obj.err))
  }

  await validate()
})

'UserFilter'.method('convertToJS', async function(grid) {

  let res = {}
  let lines = await 'UserFilterLine'.bringChildrenOf(this)
  lines.sort((a, b) => a.sequence > b.sequence ? 1 : -1)
  
  let line
  let prevLine
  let operator
  let fcallText
  let js = ''
  let nestCount = 0

  let validateBinOp = () => {
    if ( ! line.fieldName )
      throw(new Error('Please specify a field'))
  }

  let addJs = snippet => {
    if ( js ) 
      js += ' '
    js += snippet
  }

  let maybeAddAutoAnd = () => {
    if ( ! prevLine ) return
    let prevOp = prevLine.operator
    if ( prevOp === ')' ) return
    if ( prevOp === '(' ) return
    if ( prevOp === 'and' ) return
    if ( prevOp === 'or' ) return
    if ( prevOp === 'not' ) return
    addJs('&&')
  }

  let cookedExpr = () => {
    let expr = line.expression
    if ( line.compareAsString !== 'Yes' )
      return expr
    if ( expr && expr.startsWith('global.') )
      return expr
    return "'" + expr + "'"
  }

  let processEquals = () => {
    validateBinOp()
    maybeAddAutoAnd()
    addJs('(' + fcallText + ' === ' + cookedExpr() + ')')
  }

  let processContains = () => {
    validateBinOp()
    maybeAddAutoAnd()
    addJs('(' + fcallText + '.indexOf(' + cookedExpr() + ') >= 0)')
  }

  let processStartsWith = () => {
    validateBinOp()
    maybeAddAutoAnd()
    addJs('(' + fcallText + '.startsWith(' + cookedExpr() + '))')
  }

  let processEndsWith = () => {
    validateBinOp()
    maybeAddAutoAnd()
    addJs('(' + fcallText + '.endsWith(' + cookedExpr() + '))')
  }

  let processGreaterThan = () => {
    validateBinOp()
    maybeAddAutoAnd()
    addJs('(' + fcallText + ' > ' + cookedExpr() + ')')
  }

  let processGreaterThanOrEqualTo = () => {
    validateBinOp()
    maybeAddAutoAnd()
    addJs('(' + fcallText + ' >= ' + cookedExpr() + ')')
  }

  let processLessThan = () => {
    validateBinOp()
    maybeAddAutoAnd()
    addJs('(' + fcallText + ' < ' + cookedExpr() + ')')
  }

  let processLessThanOrEqualTo = () => {
    validateBinOp()
    maybeAddAutoAnd()
    addJs('(' + fcallText + ' <= ' + cookedExpr() + ')')
  }

  let processDoesNotEqual = () => {
    validateBinOp()
    maybeAddAutoAnd()
    addJs('(' + fcallText + ' !== ' + cookedExpr() + ')')
  }

  let processNot = () => {
    maybeAddAutoAnd()
    addJs('!')
  }

  let processAnd = () => {
    addJs('&&')
  }

  let processOr = () => {
    addJs('||')
  }

  let processLeftBracket = () => {
    maybeAddAutoAnd()
    addJs('(')
    nestCount++
  }

  let processRightBracket = () => {
    addJs(')')
    nestCount--
  }

  let processLine = () => {
    operator = line.operator
    let fn = line.fieldName
    if ( grid ) {
      fcallText = 
        '(  ' +
        '  (cast.' + fn + ' === 0) ?  ' + 
        '    0 : ' + 
        '    ( ' + 
        '      (! cast.' + fn + ') ?  ' + 
        '        "" :  ' + 
        '        ( ' + 
        '          global.isObj(cast.' + fn + ') ?  ' + 
        '            grid.fieldNameToDisplayValue("' + fn + '", cast, {noLinks: true}) :  ' + 
        '            cast.' + fn + ' ' + 
        '        ) ' + 
        '    ) ' + 
        ') '
    } else 
      fcallText = 'cast.' + fn // for syntax check only
    if ( operator === 'equals' )
      processEquals()
    else if ( operator === 'contains' )
      processContains()
    else if ( operator === 'starts with' )
      processStartsWith()
    else if ( operator === 'ends with' )
      processEndsWith()
    else if ( operator === 'greater than' )
      processGreaterThan()
    else if ( operator === 'greater than or equal to' )
      processGreaterThanOrEqualTo()
    else if ( operator === 'less than' )
      processLessThan()
    else if ( operator === 'less than or equal to' )
      processLessThanOrEqualTo()
    else if ( operator === 'does not equal' )
      processDoesNotEqual()
    else if ( operator === 'not' )
      processNot()
    else if ( operator === 'and' )
      processAnd()
    else if ( operator === 'or' )
      processOr()
    else if ( operator === '(' )
      processLeftBracket()
    else if ( operator === ')' )
      processRightBracket()
  }

  try {
    for ( var i = 0; i < lines.length; i++ ) {
      line = lines[i]
      processLine()
      prevLine = line
    }
    if ( nestCount > 0 )
      throw(new Error('expected closing bracket'.translate()))
    else if ( nestCount < 0 )
      throw(new Error('too many closing brackets'.translate()))
  } catch(e) {
    res.err = 'Invalid filter'.translate() + ' - ' + e.message
    console.log(res.err)
    return res
  }
  res.js = js
  return res

})


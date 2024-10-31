'StatementReport'.list({withHeader: true})
'Financial Statement'.title()
'Back'.action({act: 'cancel'})
'Refresh'.action({act: "refresh"})
'Download to Excel'.action({act: 'excel'})
'statement'.field({refersTo: 'Statement'})
'periodName'.field({caption: 'To Period'})

'statement'.afterUserChange(async () => {
  'StatementReportLine'.clear()
})

'periodName'.afterUserChange(async () => {
  'StatementReportLine'.clear()
})

'Lines'.manifest({fixedOrder: true})
'Go'.action({place: 'header', spinner: true})
'StatementReportLine'.datatype({transient: true})
'sequence'.field({key: true, hidden: true})
'caption'.field({caption: ''})
'balance'.field({numeric: true, minDecimals: 2, maxDecimals: 2, caption: 'Balance'})
'ytdBalance0'.field({numeric: true, minDecimals: 2, maxDecimals: 2, caption: 'YTD'})
'ptdBalance0'.field({numeric: true, minDecimals: 2, maxDecimals: 2, caption: 'PTD'})
'ytdBalance1'.field({numeric: true, minDecimals: 2, maxDecimals: 2, caption: 'LY YTD'})
'ptdBalance1'.field({numeric: true, minDecimals: 2, maxDecimals: 2, caption: 'LY PTD'})
'ytdBalance2'.field({numeric: true, minDecimals: 2, maxDecimals: 2, caption: '2YA YTD'})
'ptdBalance2'.field({numeric: true, minDecimals: 2, maxDecimals: 2, caption: '2YA PTD'})
'bold'.field({yesOrNo: true, hidden: true})

'caption'.fontWeight( (list, srl) => {
  if ( srl.bold === 'Yes' )
    return '600'
})

'balance'.fontWeight( (list, srl) => {
  if ( srl.bold === 'Yes' )
    return '600'
})

'ptdBalance0'.fontWeight( (list, srl) => {
  if ( srl.bold === 'Yes' )
    return '600'
})

'ytdBalance0'.fontWeight( (list, srl) => {
  if ( srl.bold === 'Yes' )
    return '600'
})

'ptdBalance1'.fontWeight( (list, srl) => {
  if ( srl.bold === 'Yes' )
    return '600'
})

'ytdBalance1'.fontWeight( (list, srl) => {
  if ( srl.bold === 'Yes' )
    return '600'
})

'ptdBalance2'.fontWeight( (list, srl) => {
  if ( srl.bold === 'Yes' )
    return '600'
})

'ytdBalance2'.fontWeight( (list, srl) => {
  if ( srl.bold === 'Yes' )
    return '600'
})

'balance'.columnVisibleWhen((list, listCast) => {
  if ( ! listCast ) return false
  let statement = listCast.refereeFast('statement'); if ( ! statement ) return false
  return statement.showBalance === 'Yes'
})

'ytdBalance0'.columnVisibleWhen((list, listCast) => {
  if ( ! listCast ) return false
  let statement = listCast.refereeFast('statement'); if ( ! statement ) return false
  return statement.showYTDBalance0 === 'Yes'
})

'ptdBalance0'.columnVisibleWhen((list, listCast) => {
  if ( ! listCast ) return false
  let statement = listCast.refereeFast('statement'); if ( ! statement ) return false
  return statement.showPTDBalance0 === 'Yes'
})

'ytdBalance1'.columnVisibleWhen((list, listCast) => {
  if ( ! listCast ) return false
  let statement = listCast.refereeFast('statement'); if ( ! statement ) return false
  return statement.showYTDBalance1 === 'Yes'
})

'ptdBalance1'.columnVisibleWhen((list, listCast) => {
  if ( ! listCast ) return false
  let statement = listCast.refereeFast('statement'); if ( ! statement ) return false
  return statement.showPTDBalance1 === 'Yes'
})

'ytdBalance2'.columnVisibleWhen((list, listCast) => {
  if ( ! listCast ) return false
  let statement = listCast.refereeFast('statement'); if ( ! statement ) return false
  return statement.showYTDBalance2 === 'Yes'
})

'ptdBalance2'.columnVisibleWhen((list, listCast) => {
  if ( ! listCast ) return false
  let statement = listCast.refereeFast('statement'); if ( ! statement ) return false
  return statement.showPTDBalance2 === 'Yes'
})

'periodName'.dynamicOptions(async list => {
  let res = []
  let c = await 'Configuration'.bringOrCreate()
  let calendar = await c.getMainCalendar(); if ( ! calendar ) return res
  let periods = await calendar.toPeriods()
  for ( var i = 0; i < periods.length; i++ ) {
    let p = periods[i]
    res.push(p.name)
  }
  return res
})

'StatementReport'.beforeLoading(async list => {
  let parms = list.getActionParms()
  let statementName = parms && parms.statementName
  if ( ! statementName )
    return
  let statement = await 'Statement'.bringSingle({name: statementName})
  if ( ! statement )
    return
  list.setFieldValue('statement', statement.reference())
  let c = await 'Configuration'.bringOrCreate()
  let period = await c.getCurrentPeriod({incDays: -14})
  list.setFieldValue('periodName', period.name)
  'StatementReportLine'.clear()
})

'Go'.act(async (list) => {

  let c = await 'Configuration'.bringOrCreate()
  let calendar = await c.getMainCalendar(); if ( ! calendar ) return
  let periodName = list.getFieldValue('periodName'); if ( ! periodName ) return
  let period0 = await calendar.nameToPeriod(periodName); if ( ! period0 ) return
  let period1 = await period0.toSamePeriodXYearsAgo(1)
  let period2 = await period0.toSamePeriodXYearsAgo(2)
  let accounts = await 'Account'.bring()

  let populateSrlValuesFromSequenceRange = async (srl, from, to, sign) => {
    let fromNo = parseFloat(from.substr(1, 99), 10)
    let toNo = parseFloat(to.substr(1, 99), 10)
    let otherSrls = await 'StatementReportLine'.bring()
    for ( var i = 0; i < otherSrls.length; i++ ) {
      let otherSrl = otherSrls[i]
      if ( otherSrl.sequence < fromNo ) continue
      if ( otherSrl.sequence > toNo ) continue
      srl.balance += sign * (await otherSrl.balance)
      srl.ytdBalance0 += sign * (await otherSrl.ytdBalance0)
      srl.ptdBalance0 += sign * (await otherSrl.ptdBalance0)
      srl.ytdBalance1 += sign * (await otherSrl.ytdBalance1)
      srl.ptdBalance1 += sign * (await otherSrl.ptdBalance1)
      srl.ytdBalance2 += sign * (await otherSrl.ytdBalance2)
      srl.ptdBalance2 += sign * (await otherSrl.ptdBalance2)
    }
  }

  let populateSrlValuesFromAccountRange = async (srl, from, to, sign) => {
    if ( from.startsWith('#') ) {
      await populateSrlValuesFromSequenceRange(srl, from, to, sign)
      return
    }
    for ( var i = 0; i < accounts.length; i++ ) {
      let account = accounts[i]
      if ( account.accountCode < from ) continue
      if ( account.accountCode > to ) continue
      srl.balance += sign * (await account.periodToBalance(period0))
      srl.ytdBalance0 += sign * (await account.periodToYTDBalance(period0))
      srl.ptdBalance0 += sign * (await account.periodToPTDBalance(period0))
      srl.ytdBalance1 += sign * (await account.periodToYTDBalance(period1))
      srl.ptdBalance1 += sign * (await account.periodToPTDBalance(period1))
      srl.ytdBalance2 += sign * (await account.periodToYTDBalance(period2))
      srl.ptdBalance2 += sign * (await account.periodToPTDBalance(period2))
    }
  }

  let populateSrlValues = async (srl, statementLine) => {
    let rangesStr = statementLine.ranges
    let ranges = rangesStr.split(',')
    for ( var i = 0; i < ranges.length; i++ ) {
      let range = ranges[i]
      let sign = 1
      if ( range.startsWith('-') ) {
        sign = -1
        range = range.substr(1, 999)
      }
      let fromAndTo = range.split('-')
      if ( fromAndTo.length === 1 )
        fromAndTo.push(fromAndTo[0])
      await populateSrlValuesFromAccountRange(srl, fromAndTo[0], fromAndTo[1], sign)
    }
  }

  'StatementReportLine'.clear()
  let statementRef = list.getFieldValue('statement'); if ( ! statementRef ) return
  let statement = await 'Statement'.bringSingle({id: statementRef.id})
  let lines = await 'StatementLine'.bring({statement: statement})
  for ( var i = 0; i < lines.length; i++ ) {
    let line = lines[i]
    let srl = await 'StatementReportLine'.create()
    srl.sequence = line.sequence
    srl.caption = line.caption
    srl.bold = line.bold
    await populateSrlValues(srl, line)
  }
})


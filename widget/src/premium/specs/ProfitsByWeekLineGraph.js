'ProfitsByWeekLineGraph'.graph({style: "line", withHeader: true})
'Profits by Week'.title()
'Back'.action({act: 'cancel'})
'fromDate'.field({date: true})
'toDate'.field({date: true})

'LineGraph'.manifest()
'Go'.action({place: 'header', spinner: true})
'WeekProfit'.datatype({transient: true})
'weekEndDate'.field({date: true})
'grossProfitValue'.field({numeric: true, decimals: 2})
'weekEndDate'.xAxis()
'grossProfitValue'.yAxis()

'ProfitsByWeekLineGraph'.beforeLoading(async graph => {
  await graph.harmonize()
})

'fromDate'.default(async (graph) => {
  let c = await 'Configuration'.bringSingle(); if ( ! c ) return
  return c.viewFromDate
})

'toDate'.default(async (graph) => {
  let c = await 'Configuration'.bringSingle(); if ( ! c ) return
  return c.viewToDate
})

'Go'.act(async (graph) => {
  let saveSetting = async (fieldName, settingFieldName) => {
    let c = await 'Configuration'.bringOrCreate()
    let v = graph.getFieldValue(fieldName)
    c[settingFieldName] = v
  }

  let firstOrderDate = global.todayYMD()
  let orders = await 'orders'.bring()
  for ( var i = 0; i < orders.length; i++ ) {
    let order = orders[i]
    if ( order.order_date < firstOrderDate )
      firstOrderDate = order.order_date
  }

  await saveSetting('fromDate', 'viewFromDate')
  await saveSetting('toDate', 'viewToDate')
  let fromDate = graph.getFieldValue('fromDate')
  if ( (! fromDate) || fromDate.isEmptyYMD() ) fromDate = firstOrderDate
  let toDate = graph.getFieldValue('toDate')
  if ( (! toDate) || toDate.isEmptyYMD() ) toDate = global.todayYMD()

  let doWeekEnding = async weekEndDate => {
    'Profit'.clear()
    let weekStartDate = weekEndDate.incDays(-6)
    let weekProfit = await 'WeekProfit'.bringOrCreate({weekEndDate: weekEndDate})
    let products = await 'products'.bring()
    for ( var i = 0; i < products.length; i++ ) {
      let product = products[i]
      let profit = await product.createProfitCast(weekStartDate, weekEndDate)
      if ( profit.grossProfitValue === global.unknownNumber() ) continue
      weekProfit.grossProfitValue = global.sum(weekProfit.grossProfitValue, profit.grossProfitValue)
    }
    if ( weekProfit.grossProfitValue !== global.unknownNumber() )
      weekProfit.grossProfitValue = global.roundToXDecimals(weekProfit.grossProfitValue, 2)
  }

  let dateToFirstSundayOnOrAfter = date => {
    let dayNo = date.toDayNoOfWeek() // Sunday is zero
    let res = date
    if ( dayNo > 0 )
      res = res.incDays(7 - dayNo)
    return res
  }

  'WeekProfit'.clear()
  let weekEndDate = dateToFirstSundayOnOrAfter(fromDate)
  let weekNo = 0
  let weekCount = toDate.dateSubtract(fromDate) / 7
  global.startProgress({message: 'Generating chart'})
  try {
    while ( true ) {
      await doWeekEnding(weekEndDate)
      weekNo++
      await global.updateProgress(weekNo / weekCount)
      await global.wait(100)
      if ( weekEndDate > toDate )
        break
      weekEndDate = weekEndDate.incDays(7)
    }
  } finally {
    global.stopProgress()
  }

})


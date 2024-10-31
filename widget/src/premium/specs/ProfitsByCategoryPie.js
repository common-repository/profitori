'ProfitsByCategoryPie'.graph({style: "pie", withHeader: true})
'Profits by Category'.title()
'Back'.action({act: 'cancel'})
'fromDate'.field({date: true})
'toDate'.field({date: true})

'Pie'.manifest()
'Go'.action({place: 'header', spinner: true})
'CategoryProfit'.datatype({transient: true})
'category'.pieSegmentor({refersTo: 'category', key: true})
'grossProfitValue'.pieValue({numeric: true})

'ProfitsByCategoryPie'.beforeLoading(async graph => {
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

  await saveSetting('fromDate', 'viewFromDate')
  await saveSetting('toDate', 'viewToDate')
  let fromDate = graph.getFieldValue('fromDate')
  if ( (! fromDate) || fromDate.isEmptyYMD() ) fromDate = "0000-00-00"
  let toDate = graph.getFieldValue('toDate')
  if ( (! toDate) || toDate.isEmptyYMD() ) toDate = "9999-99-99"

  let addProduct = async (pprof) => {
    let product = await pprof.referee('product')
    let category = await product.toFirstCategory(); if ( ! category ) return
    let cprof = await 'CategoryProfit'.bringOrCreate({category: category})
    if ( pprof.grossProfitValue === global.unknownNumber() ) return
    cprof.grossProfitValue = global.sum(cprof.grossProfitValue, pprof.grossProfitValue)
  }

  'Profit'.clear()
  'CategoryProfit'.clear()
  let products = await 'products'.bring()
  for ( var i = 0; i < products.length; i++ ) {
    let product = products[i]
    let profit = await product.createProfitCast(fromDate, toDate)
    await addProduct(profit)
  }

})


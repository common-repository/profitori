'ProfitsByCategory'.list({withHeader: true})
'Profits by Category'.title()
'Back'.action({act: 'cancel'})
'Download to Excel'.action({act: 'excel'})
'fromDate'.field({date: true})
'toDate'.field({date: true})

'Lines'.manifest()
'Go'.action({place: 'header', spinner: true})
'CategoryProfit'.datatype({transient: true})
'category'.field({refersTo: 'category', key: true})
'salesQuantity'.field({numeric: true, showTotal: true})
'salesValue'.field({numeric: true, decimals: 2, showTotal: true})
'costOfGoodsSold'.field({numeric: true, decimals: 2, caption: "Cost of Goods Sold", showTotal: true})
'grossProfitValue'.field({numeric: true, decimals: 2, showTotal: true})
'grossProfitPercent'.field({numeric: true, decimals: 2, caption: "Gross Profit %", showTotal: true})
'taxValue'.field({numeric: true, decimals: 2, showTotal: true})

'ProfitsByCategory'.beforeLoading(async list => {
  await list.harmonize()
})

'grossProfitPercent'.calculateTotal(profits => {
  let grossProfitValue = 0
  let salesValue = 0
  profits.forAll(profit => {
    if ( profit.grossProfitValue === global.unknownNumber() ) return "continue"
    grossProfitValue += profit.grossProfitValue
    salesValue += profit.salesValue
  })
  let res = global.percent(grossProfitValue, salesValue)
  return res
})

'fromDate'.default(async (list) => {
  let c = await 'Configuration'.bringSingle(); if ( ! c ) return
  return c.viewFromDate
})

'toDate'.default(async (list) => {
  let c = await 'Configuration'.bringSingle(); if ( ! c ) return
  return c.viewToDate
})

'Go'.act(async (list) => {
  let saveSetting = async (fieldName, settingFieldName) => {
    let c = await 'Configuration'.bringOrCreate()
    let v = list.getFieldValue(fieldName)
    c[settingFieldName] = v
  }

  await saveSetting('fromDate', 'viewFromDate')
  await saveSetting('toDate', 'viewToDate')
  let fromDate = list.getFieldValue('fromDate')
  if ( (! fromDate) || fromDate.isEmptyYMD() ) fromDate = "0000-00-00"
  let toDate = list.getFieldValue('toDate')
  if ( (! toDate) || toDate.isEmptyYMD() ) toDate = "9999-99-99"

  let addProduct = async (pprof) => {
    let product = await pprof.referee('product')
    let category = await product.toFirstCategory(); if ( ! category ) return
    let cprof = await 'CategoryProfit'.bringOrCreate({category: category})
    cprof.salesQuantity += pprof.salesQuantity
    cprof.salesValue += pprof.salesValue
    if ( pprof.costOfGoodsSold === global.unknownNumber() || cprof.costOfGoodsSold === global.unknownNumber() )
      cprof.costOfGoodsSold = global.unknownNumber()
    else
      cprof.costOfGoodsSold += pprof.costOfGoodsSold
    if ( pprof.grossProfitValue === global.unknownNumber() || cprof.grossProfitValue === global.unknownNumber() )
      cprof.grossProfitValue = global.unknownNumber()
    else
      cprof.grossProfitValue += pprof.grossProfitValue
    cprof.taxValue += pprof.taxValue
    if ( cprof.grossProfitValue === global.unknownNumber() )
      cprof.grossProfitPercent = global.unknownNumber()
    else
      cprof.grossProfitPercent = global.percent(cprof.grossProfitValue, cprof.salesValue)
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


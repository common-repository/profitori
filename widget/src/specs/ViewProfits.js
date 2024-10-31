'ViewProfits'.list({expose: true, withHeader: true, icon: 'DollarSign'})
'View Profits'.title()
'Back'.action({act: 'cancel'})
'Download to Excel'.action({act: 'excel'})
'Profits by Supplier'.action({spec: 'ProfitsBySupplier.js'})
'Sales Analysis'.action({spec: 'SAProductList.js'})
'fromDate'.field({date: true})
'toDate'.field({date: true})
'includeTax'.field({yesOrNo: true})

'Lines'.manifest()
'Go'.action({place: 'header', spinner: true})
'Profit'.datatype({transient: true})
'product'.field({refersTo: 'products', key: true, showAsLink: true})
'salesQuantity'.field({numeric: true, showTotal: true})
'salesValue'.field({numeric: true, decimals: 2, showTotal: true})
'avgUnitPrice'.field({numeric: true, decimals: 2, caption: "Avg Unit Sale Price"})
'costOfGoodsSold'.field({numeric: true, decimals: 2, caption: "Cost of Goods Sold", showTotal: true})
'avgUnitCost'.field({numeric: true, decimals: 2})
'grossProfitValue'.field({numeric: true, decimals: 2, showTotal: true})
'grossProfitPercent'.field({numeric: true, decimals: 2, caption: "Gross Profit %", showTotal: true})
'taxValue'.field({numeric: true, decimals: 2, showTotal: true})

'includeTax'.default(async list => {
  let c = await 'Configuration'.bringSingle(); if ( ! c ) return 'No'
  return c.enterPurchasePricesInclusiveOfTax
})

'ViewProfits'.beforeLoading(async list => {
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
  await list.app().harmonize()
  let saveSetting = async (fieldName, settingFieldName) => {
    let c = await 'Configuration'.bringOrCreate()
    let v = list.getFieldValue(fieldName)
    c[settingFieldName] = v
  }

  await saveSetting('fromDate', 'viewFromDate')
  await saveSetting('toDate', 'viewToDate')
  await global.app.save()
  let fromDate = list.getFieldValue('fromDate')
  if ( (! fromDate) || fromDate.isEmptyYMD() ) fromDate = "0000-00-00"
  let toDate = list.getFieldValue('toDate')
  if ( (! toDate) || toDate.isEmptyYMD() ) toDate = "9999-99-99"
  let includeTax = list.getFieldValue('includeTax')

  let products = await 'products'.bring()
  'Profit'.clear()
  await products.forAllAsync(async product => {
    await product.createProfitCast(fromDate, toDate, (includeTax === 'Yes'))
  })

})

'product'.destination(async (profit, productRef) => {
  let id = productRef.id; if ( ! id ) return null
  let p = await 'products'.bringFirst({id: id})
  return p
})


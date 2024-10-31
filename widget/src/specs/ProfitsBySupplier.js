'ProfitsBySupplier'.list({withHeader: true})
'Profits by Supplier'.title()
'Back'.action({act: 'cancel'})
'Download to Excel'.action({act: 'excel'})
'fromDate'.field({date: true})
'toDate'.field({date: true})

'Lines'.manifest()
'Go'.action({place: 'header', spinner: true})
'SupplierProfit'.datatype({transient: true})
'supplier'.field({refersTo: 'Supplier', key: true, showAsLink: true})
'salesQuantity'.field({numeric: true, showTotal: true})
'salesValue'.field({numeric: true, decimals: 2, showTotal: true})
'costOfGoodsSold'.field({numeric: true, decimals: 2, caption: "Cost of Goods Sold", showTotal: true})
'grossProfitValue'.field({numeric: true, decimals: 2, showTotal: true})
'grossProfitPercent'.field({numeric: true, decimals: 2, caption: "Gross Profit %", showTotal: true})
'taxValue'.field({numeric: true, decimals: 2, showTotal: true})

'ProfitsBySupplier'.beforeLoading(async list => {
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

  let addProduct = async (sprof, pprof) => {
    sprof.salesQuantity += pprof.salesQuantity
    sprof.salesValue += pprof.salesValue
    sprof.costOfGoodsSold = global.sum(sprof.costOfGoodsSold, pprof.costOfGoodsSold)
    sprof.grossProfitValue = global.sum(sprof.grossProfitValue, pprof.grossProfitValue)
    sprof.taxValue += pprof.taxValue
    sprof.grossProfitPercent = global.percent(sprof.grossProfitValue, sprof.salesValue)
  }

  let suppliers = await 'Supplier'.bring()
  'Profit'.clear()
  'SupplierProfit'.clear()
  await suppliers.forAllAsync(async supplier => {
    let supplierProfit = await 'SupplierProfit'.bringOrCreate({supplier: supplier})
    let products = await supplier.toProducts()
    for ( var i = 0; i < products.length; i++ ) {
      let product = products[i]
      let profit = await product.createProfitCast(fromDate, toDate)
      await addProduct(supplierProfit, profit)
    }
  })

})


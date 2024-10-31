'TaxReport'.list({withHeader: true})
'Tax Report (Purchases)'.title()
'Back'.action({act: 'cancel'})
'Download to Excel'.action({act: 'excel'})
'fromDate'.field({date: true, caption: 'From Date (i.e. Orders Fully Received On or After)'})
'toDate'.field({date: true, caption: 'To Date (i.e. Orders Fully Received On or Before)'})

'Lines'.manifest()
'Go'.action({place: 'header', spinner: true})
'TaxReportLine'.datatype({transient: true})
'jointKey'.field({hidden: true, key: true})
'lineType'.field({caption: "PO Line Type"})
'taxClass'.field()
'taxPct'.field({numeric: true, decimals: 2, caption: "Tax %"})
'costIncTax'.field({numeric: true, decimals: 2, caption: "Purchase Value (inc Tax)"})
'tax'.field({numeric: true, decimals: 2, caption: "Tax Amount"})

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

  let getOrCreateReportLine = async poLine => {
    let lineType = poLine.lineType
    let taxClass = await poLine.toTaxClass()
    if ( ((! lineType) || (lineType === "Product")) && (! taxClass) )
      taxClass = 'standard'
    let taxPct = poLine.taxPct
    let jointKey = lineType + taxClass + taxPct
    let line = await 'TaxReportLine'.bringOrCreate({jointKey: jointKey})
    line.lineType = lineType
    line.taxClass = taxClass
    line.taxPct = taxPct
    return line
  }

  let processPOLine = async (poLine) => {
    let reportLine = await getOrCreateReportLine(poLine)
    reportLine.costIncTax += await poLine.toReceivedQuantityCostIncTax()
    reportLine.tax += await poLine.toReceivedQuantityTax()
  }

  let processPO = async (po) => {
    let poLines = await 'POLine'.bringChildrenOf(po)
    for ( var i = 0; i < poLines.length; i++ ) {
      let poLine = poLines[i]
      await processPOLine(poLine)
    }
  }

  let pos = await 'PO'.bring({status: 'Received'})
  'TaxReportLine'.clear()
  for ( var i = 0; i < pos.length; i++ ) {
    let po = pos[i]
    let recDate = await po.toDateLastItemReceived()
    if ( recDate < fromDate ) continue;
    if ( recDate > toDate ) continue;
    await processPO(po)
  }

})


'AdjustmentReport'.list({withHeader: true})
'Adjustment Report'.title()
'Back'.action({act: 'cancel'})
'Download to Excel'.action({act: 'excel'})
'fromDate'.field({date: true})
'toDate'.field({date: true})
'product'.field({refersTo: 'products'})

'Lines'.manifest()
'Go'.action({place: 'header', spinner: true})
'Adjustment'.datatype()
'adjustmentNumber'.field({showAsLink: true})
'date'.field()
'location'.field()
'product'.field({showAsLink: true})
'reason'.field()
'notes'.field()
'quantity'.field({caption: "Quantity", showPlusSign: true})
'unitCostIncTax'.field({caption: "Unit Cost (Inc Tax)"})
'lineCostIncTax'.field({caption: "Line Total (Inc Tax)"})

'AdjustmentReport'.beforeLoading(async list => {
  let cast = list.callerCast(); if ( ! cast ) return
  if ( cast.datatype() === 'products' )
    list.setFieldValue('product', cast.reference())
  else if ( cast.datatype() === 'Inventory' )
    list.setFieldValue('product', cast.product)
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

  list.refresh()
})

'Lines'.filter(async (adjustment, list) => {
  let fromDate = list.getFieldValue('fromDate')
  if ( (! fromDate) || fromDate.isEmptyYMD() ) fromDate = "0000-00-00"
  let toDate = list.getFieldValue('toDate')
  if ( (! toDate) || toDate.isEmptyYMD() ) toDate = "9999-99-99"
  let prodRef = list.getFieldValue('product')
  if ( adjustment.date < fromDate ) return false
  if ( adjustment.date > toDate ) return false
  if ( prodRef && adjustment.product && (adjustment.product.id !== prodRef.id) ) return false
  return true
})

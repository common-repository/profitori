'POReport'.list({withHeader: true})
'Purchase Orders Report'.title()
'Back'.action({act: 'cancel'})
'Download to Excel'.action({act: 'excel'})
'fromDate'.field({date: true})
'toDate'.field({date: true})
'supplier'.field({refersTo: 'Supplier'})
'product'.field({refersTo: 'products'})

'Lines'.manifest()
'Go'.action({place: 'header', spinner: true})
'POLine'.datatype()
'purchaseOrder'.field({showAsLink: true})
'product'.field({showAsLink: true})
'quantity'.field({caption: "Ordered Quantity"})
'lineCostIncTax'.field()
'receivedQuantity'.field()
'lineExpectedDeliveryDate'.field()
'PO'.datatype()
'location'.field({showAsLink: true})
'supplier'.field({showAsLink: true})
'orderDate'.field()
'status'.field()

'POReport'.beforeLoading(async list => {
  let cast = list.callerCast(); if ( ! cast ) return
  if ( cast.datatype() === 'Supplier' )
    list.setFieldValue('supplier', cast.reference())
  else if ( cast.datatype() === 'products' )
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

'Lines'.filter(async (poLine, list) => {
  if ( poLine.lineType && (poLine.lineType !== "Product") ) return false
  let fromDate = list.getFieldValue('fromDate')
  if ( (! fromDate) || fromDate.isEmptyYMD() ) fromDate = "0000-00-00"
  let toDate = list.getFieldValue('toDate')
  if ( (! toDate) || toDate.isEmptyYMD() ) toDate = "9999-99-99"
  let suppRef = list.getFieldValue('supplier')
  let prodRef = list.getFieldValue('product')
  let po = await poLine.parent(); if ( ! po ) return false
  if ( po.orderDate < fromDate ) return false
  if ( po.orderDate > toDate ) return false
  if ( suppRef && po.supplier && (po.supplier.id !== suppRef.id) ) return false
  if ( prodRef && poLine.product && (poLine.product.id !== prodRef.id) ) return false
  return true
})


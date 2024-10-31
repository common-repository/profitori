'GoodsReceived'.list({withHeader: true})
'Goods Received Report'.title()
'Back'.action({act: 'cancel'})
'Download to Excel'.action({act: 'excel'})
'fromDate'.field({date: true})
'toDate'.field({date: true})

'Lines'.manifest()
'Go'.action({place: 'header', spinner: true})
'POReceiptLine'.datatype()
'receiptNumber'.field({caption: 'Receipt#', showAsLink: true})
'supplierReference'.field({caption: 'Invoice#'})
'orderDate'.field({caption: 'Date of order'})
'receivedDate'.field({caption: 'Date received'})
'supplier'.field({caption: 'Supplier name', showAsLink: true})
'supplierCountry'.field({caption: 'Country'})
'descriptionAndSKU'.field({caption: 'Product name', showAsLink: true})
'receivedQuantity'.field({caption: 'QTY'})
'lineCostIncTaxFX'.field({caption: 'Total amount'})
'currency'.field({caption: 'Purchase currency'})
'lineCost'.field({caption: 'Total amount (local currency)'})
'intrastatHSCode'.field({caption: 'HS-code'})
'weight'.field()

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

'Lines'.filter(async (poReceiptLine, list) => {
  let poLine = await poReceiptLine.toPOLine(); if ( ! poLine ) return false
  if ( poLine.lineType && (poLine.lineType !== "Product") ) return false
  let fromDate = list.getFieldValue('fromDate')
  if ( (! fromDate) || fromDate.isEmptyYMD() ) fromDate = "0000-00-00"
  let toDate = list.getFieldValue('toDate')
  if ( (! toDate) || toDate.isEmptyYMD() ) toDate = "9999-99-99"
  let poReceipt = await poReceiptLine.parent()
  if ( poReceipt.receivedDate < fromDate ) return false
  if ( poReceipt.receivedDate > toDate ) return false
  return true
})


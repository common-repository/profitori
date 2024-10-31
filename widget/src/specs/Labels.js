'Labels'.page({readOnly: false})
'Labels'.title()
'Back'.action({act: 'cancel'})
'Layout'.action()
'Download Labels PDF'.action()
'Print Labels'.action()
'labelType'.field({readOnly: true})
'sourceType'.field({readOnly: true})
'sourceReference'.field({readOnly: true})
'purpose'.field()
'howMany'.field()
'enteredNumberOfLabels'.field({numeric: true, decimals: 0, readOnly: false, caption: "Number of Labels"})

'Layout'.act(async page => {
  let purpose = page.getFieldValue('purpose')
  if ( purpose === 'General Purpose' )
    purpose = ''
  let template = await 'Template'.bringOrCreate({specification: 'LabelsPdf.js', purpose: purpose})
  await page.segue('edit', 'TemplateMaint.js', template)
})

'purpose'.options(['General Purpose', 'Carton', 'Pallet'])

'Labels'.beforeLoading(async page => {
  let cast = page.callerCast()
  if ( cast ) {
    if ( cast.datatype() === 'POReceipt' ) {
      page.setFieldValue('labelType', 'Inventory')
      page.setFieldValue('sourceType', 'Purchase Order Receipt')
      page.setFieldValue('sourceReference', cast.receiptNumber)
      return
    } else if ( cast.datatype() === 'products' ) {
      page.setFieldValue('labelType', 'Inventory')
      page.setFieldValue('sourceType', 'Product')
      page.setFieldValue('sourceReference', cast.uniqueName)
      return
    } else if ( cast.datatype() === 'Inventory' ) {
      page.setFieldValue('labelType', 'Inventory')
      page.setFieldValue('sourceType', 'Product')
      page.setFieldValue('sourceReference', cast.productName)
      return
    }
  }
  page.setFieldValue('labelType', 'Inventory')
  page.setFieldValue('sourceType', 'Product')
  page.setFieldValue('sourceReference', 'Selected Products')
})

'Download Labels PDF'.act(async (page, cast) => {
  let numberOfLabels = (cast.howMany === 'Enter Number of Labels') ? cast.enteredNumberOfLabels : -1
  let purpose = page.getFieldValue('purpose')
  if ( purpose === 'General Purpose' )
    purpose = ''
  let prefix = ''
  if ( purpose )
    prefix = purpose.translate() + ' '
  page.downloadPDF({spec: "LabelsPdf.js", 
    docName: prefix + "Labels for " + cast.sourceReference + ".PDF", 
    cast: page.callerCast(), numberOfLabels: numberOfLabels, purpose: purpose})
})

'Print Labels'.act(async (page, cast) => {
  let numberOfLabels = (cast.howMany === 'Enter Number of Labels') ? cast.enteredNumberOfLabels : -1
  let purpose = page.getFieldValue('purpose')
  if ( purpose === 'General Purpose' )
    purpose = ''
  let prefix = ''
  if ( purpose )
    prefix = purpose.translate() + ' '
  page.downloadPDFandPrint({spec: "LabelsPdf.js", 
    docName: prefix + "Labels for " + cast.sourceReference + ".PDF", 
    cast: page.callerCast(), numberOfLabels: numberOfLabels, purpose: purpose})
})

'purpose'.default(page => {
  let res = 'General Purpose'
  let cast = page.callerCast()
  let dt = cast && cast.datatype()
  if ( dt === 'SOShipment' )
    res = 'Carton'
  return res
})

'howMany'.dynamicOptions(async page => {
  let cast = page.callerCast()
  if ( cast && (cast.datatype() === 'POReceipt') ) 
    return ['Use Quantity Received', 'Enter Number of Labels']
  else
    return ['Use Quantity On Hand', 'Enter Number of Labels']
})

'howMany'.default(page => {
  let cast = page.callerCast()
  if ( cast && (cast.datatype() === 'POReceipt') ) 
    return 'Use Quantity Received'
  return 'Use Quantity On Hand'
})

'enteredNumberOfLabels'.visibleWhen((page, cast) => {
  return cast.howMany === 'Enter Number of Labels'
})

'enteredNumberOfLabels'.inception(1)

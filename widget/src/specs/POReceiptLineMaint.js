'POReceiptLineMaint'.maint({panelStyle: "titled", icon: "Boxes"})
'Edit Receipt Line'.title()
'Back'.action({act: 'cancel'})
'OK'.action({act: 'ok'})
'Save'.action({act: 'save'})
'POReceiptLine'.datatype()

'Line Details'.panel()
'scanStatus'.field({ephemeral: true, readOnly: true})
'receiptNumber'.field({refersToParent: 'POReceipt'})
'product'.field({refersTo: 'products', readOnly: true})
'descriptionAndSKU'.field({readOnly: true})
'uom'.field({readOnly: true, caption: 'Purchasing Unit'})
'orderedQuantityPU'.field({numeric: true, readOnly: true})
'receivedQuantityPU'.field({numeric: true, caption: 'Received'})
'previouslyReceivedPU'.field({numeric: true, readOnly: true})
'cancelledQuantityPU'.field({numeric: true})
'outstandingQuantityPU'.field({numeric: true, readOnly: true})
'receivedQuantity'.field({caption: 'Received Stocking Units', readOnly: true})
'unitCostFX'.field()
'unitCostExclTaxFX'.field()
'currency'.field({readOnly: true, showAsLink: true})
'poLine'.field({refersTo: 'POLine'})
'newQuantityOnHand'.field({readOnly: true})
'image'.field()

'Retail Pricing'.panel()
'avgUnitCostIncludingThisOrder'.field({readOnly: true})
'recommendedRetailPriceIncTax'.field()
'wooCommerceRegularPrice'.field()
'marginPct'.field({readOnly: true})

'Lots'.manifest()
'Add Lot'.action({act: 'add'})
'Add Serial Number'.action({act: 'add'})
'Allotment'.datatype()
'lot'.field({showAsLink: true, caption: 'Number'})
'quantity'.field()
'expiryDate'.field()
'Edit'.action({place: 'row', act: 'edit'})
'Trash'.action({place: 'row', act: 'trash'})
'AllotmentMaint.js'.maintSpecname()

'POReceiptLineMaint'.afterInitialising(async line => {
  await line.refreshDependentFields()
})

'receivedQuantity'.visibleWhen((maint, poLine) => {
  let c = 'Configuration'.bringSingleFast(); if ( ! c ) return false
  return c.showUOMOnPOLines === 'Yes'
})

'uom'.visibleWhen((maint, poLine) => {
  let c = 'Configuration'.bringSingleFast(); if ( ! c ) return false
  return c.showUOMOnPOLines === 'Yes'
})

'Add Lot'.availableWhen(recLine => {
  return (recLine.hasLots === 'Yes') && (recLine.lotsAreSerials !== 'Yes')
})

'Add Serial Number'.availableWhen(recLine => {
  return (recLine.lotsAreSerials === 'Yes')
})

'Lots'.dynamicTitle(function() {
  let grid = this
  let recLine = grid.containerCast()
  if ( recLine.lotsAreSerials === 'Yes' )
    return 'Serial Numbers'
  else
    return 'Lots'
})

'Lots'.visibleWhen((maint, poLine) => {
  return poLine.hasLots === 'Yes'
})

'unitCostExclTaxFX'.visibleWhen((maint, line) => {
  return line.includeTaxOption === "No"
})

'unitCostFX'.visibleWhen((maint, line) => {
  return line.includeTaxOption !== "No"
})

'Retail Pricing'.visibleWhen((maint, line) => {
  return line.product ? true : false
})

'descriptionAndSKU'.visibleWhen((maint, line) => {
  return (! line.product) || (line.descriptionAndSKU !== line.product.keyval)
})

'currency'.visibleWhen((maint, line) => {
  return line.currency ? true : false
})

'POReceiptLineMaint'.makeDestinationFor('POReceiptLine')

'POReceiptLineMaint'.onScannerRead(async (maint, line, barcode) => {
  let poReceipt = await line.referee('receiptNumber')
  let scannedLine = await poReceipt.barcodeToLine(barcode)
  if ( ! scannedLine ) {
    line.scanStatus = 'Scanned code unrecognized: ' + barcode
    poReceipt.scanStatus = line.scanStatus
    return
  }
  scannedLine.receivedQuantityPU++
  await scannedLine.refreshReceivedQuantity()
  await scannedLine.refreshCalculations({force: true, includeDefers: true})
  let product = await scannedLine.toProduct()
  scannedLine.scanStatus = 'Received ' + scannedLine.receivedQuantityPU + ' of ' + product.uniqueName
  poReceipt.scanStatus = scannedLine.scanStatus
  maint.setCast(scannedLine)
})

'POReceiptLineMaint'.afterInitialising(async line => {
  let poReceipt = await line.referee('receiptNumber')
  line.scanStatus = poReceipt.scanStatus
  global.prfiInScanMode = (poReceipt.inScanMode === "Yes")
})

'scanStatus'.visibleWhen((maint, poReceipt) => {
  return global.prfiInScanMode
})

'receivedQuantityPU'.afterUserChange(async (oldInputValue, newInputValue, recLine, maint) => {
  await recLine.refreshReceivedQuantity()
  if ( recLine.hasLots === 'Yes' ) {
    let config = await 'Configuration'.bringSingle(); if ( ! config ) return
    await config.balanceAllotments(recLine)
  }
})

'cancelledQuantityPU'.afterUserChange(async (oldInputValue, newInputValue, recLine, maint) => {
  await recLine.refreshCancelledQuantity()
})

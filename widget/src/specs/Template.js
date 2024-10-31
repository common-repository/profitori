'Template'.datatype({plex: true})
'specification'.field({hidden: true, key: true, nonUnique: true})
'labelType'.field()
'columnCount'.field({numeric: true, decimals: 0, caption: 'Number of Labels Across Page'})
'rowsPerPage'.field({numeric: true, decimals: 0, caption: 'Number of Labels Down Page'})
'pageWidthMm'.field({numeric: true, caption: 'Page Width (mm)'})
'pageWidthInches'.field({numeric: true, caption: 'Page Width (in)'})
'pageHeightMm'.field({numeric: true, caption: 'Page Height (mm)'})
'pageHeightInches'.field({numeric: true, caption: 'Page Height (in)'})
'pageLeftMarginMm'.field({numeric: true, caption: 'Page Left Margin (mm)'})
'pageTopMarginMm'.field({numeric: true, caption: 'Page Top Margin (mm)'})
'labelWidthMm'.field({numeric: true, caption: 'Label Width (mm)'})
'labelHeightMm'.field({numeric: true, caption: 'Label Height (mm)'})
'labelHGapMm'.field({numeric: true, caption: 'Horizontal Gap Between Labels (mm)'})
'labelVGapMm'.field({numeric: true, caption: 'Vertical Gap Between Labels (mm)'})
'purpose'.field()
'purposeDisplay'.field()

'Template'.cruxFields(['specification', 'purpose'])

'Template'.method('refreshInches', async function () {

  let doIt = async fn => {
    this[fn + 'Inches'] = global.mmToInches(this[fn + 'Mm'])
  }

  doIt("pageWidth")
  doIt("pageHeight")
  doIt("pageLeftMargin")
  doIt("pageTopMargin")
  doIt("labelWidth")
  doIt("labelHeight")
  doIt("labelHGap")
  doIt("labelVGap")
})

'purposeDisplay'.calculate(t => {
  if ( ! t.purpose )
    return 'General Purpose'.translate()
  return t.purpose
})

'Template'.afterCreating(async function () {
  if ( this.specification === 'InventoryLevels.js' )
    await this.createDefaultInventoryLevelsFacets()
  else if ( this.specification === 'LabelsPdf.js' )
    await this.createLabelsPdfFacets()
})

'Template'.method('createLabelsPdfFacets', async function () {
  if ( ! this.purpose )
    await this.createLabelsPdfGeneralPurposeFacets()
  else if ( this.purpose === 'Carton' )
    await this.createLabelsPdfCartonFacets()
  else if ( this.purpose === 'Pallet' )
    await this.createLabelsPdfPalletFacets()
})

'Template'.method('createLabelsPdfPalletFacets', async function () {
  this.labelType = 'Inventory'
  this.columnCount = 1
  this.rowsPerPage = 1
  this.pageWidthMm = 203.2
  this.pageHeightMm = 152.4 
  this.pageLeftMarginMm = 0
  this.pageTopMarginMm = 0
  this.labelWidthMm = 203.2
  this.labelHeightMm = 152.4
  this.labelHGapMm = 0
  this.labelVGapMm = 0
  this.refreshInches()
})

'Template'.method('createLabelsPdfCartonFacets', async function () {
  this.labelType = 'Inventory'
  this.columnCount = 1
  this.rowsPerPage = 1
  this.pageWidthMm = 152.4
  this.pageHeightMm = 101.6 
  this.pageLeftMarginMm = 0
  this.pageTopMarginMm = 0
  this.labelWidthMm = 152.4
  this.labelHeightMm = 101.6
  this.labelHGapMm = 0
  this.labelVGapMm = 0
  this.refreshInches()
})

'Template'.method('createLabelsPdfGeneralPurposeFacets', async function () {
  this.labelType = 'Purchase Order Receipt'
  this.columnCount = 2
  this.rowsPerPage = 7
  this.pageWidthMm = 210
  this.pageHeightMm = 270
  this.pageLeftMarginMm = 0
  this.pageTopMarginMm = 0
  this.labelWidthMm = 105
  this.labelHeightMm = 38.57
  this.labelHGapMm = 0
  this.labelVGapMm = 0
  await this.createFacet({caption: 'SKU', source: 'Inventory.sku', sequence: 10, left: 5, top: 3, width: 50, fontSize: 14})
  await this.createFacet({caption: 'Product Name', source: 'Inventory.productName', sequence: 20, left: 5, top: 12, width: 90, fontSize: 8})
  this.refreshInches()
})

'Template'.method('createDefaultInventoryLevelsFacets', async function () {
  await this.createFacet({caption: 'Image', source: 'Inventory.thumbnailImage', sequence: 5, image: true})
  await this.createFacet({caption: 'Quantity On Hand', source: 'Inventory.quantityOnHand', sequence: 10, numeric: true, showTotal: true,
    maxDecimals: 0, minDecimals: 0})
  await this.createFacet({caption: 'On Purchase Orders', source: 'Inventory.quantityOnPurchaseOrders', sequence: 20, numeric: true, showTotal: true,
    maxDecimals: 0, minDecimals: 0})
  await this.createFacet({caption: 'Avg Unit Cost', source: 'Inventory.avgUnitCost', sequence: 30, numeric: true,
    maxDecimals: 6, minDecimals: 2})
  await this.createFacet({caption: 'Inventory Value', source: 'Inventory.inventoryValue2', sequence: 40, numeric: true, showTotal: true,
    maxDecimals: 0, minDecimals: 0})
})

'Template'.method('createFacet', async function (aParms) {
  let facet = await 'Facet'.create({parentCast: this})
  facet.englishCaption = aParms.caption
  facet.caption = aParms.caption.translate()
  let source = await 'Source'.bringSingle({description: aParms.source});
  if ( ! source )
    throw(new Error("Unable to find source " + aParms.source))
  facet.source = source.reference()
  facet.sequence = aParms.sequence
  let dispDesc = aParms.numeric ? "Number" : "Text"
  if ( aParms.image )
    dispDesc = 'Image'
  let disposition = await 'Disposition'.bringSingle({description: dispDesc})
  if ( ! disposition )
    throw(new Error("Unable to find disposition Text"))
  facet.disposition = disposition.reference()
  if ( aParms.numeric ) {
    facet.minimumDecimals = aParms.minDecimals
    facet.maximumDecimals = aParms.maxDecimals
    facet.decimalsChanged = true
  }
  facet.left = aParms.left
  facet.top = aParms.top
  facet.width = aParms.width
  facet.fontSize = aParms.fontSize
  facet.showTotal = aParms.showTotal ? "Yes" : "No"
})


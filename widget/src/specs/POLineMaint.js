'POLineMaint'.maint({panelStyle: "titled", icon: 'PeopleArrows'})
'Add Purchase Order Line'.title({when: 'adding'})
'Edit Purchase Order Line'.title({when: 'editing'})
'Back'.action({act: 'cancel'})
'OK'.action({act: 'ok'})
'Save'.action({act: 'save'})
'Add another line'.action({act: 'add'})
'POLine'.datatype()

'Line Details'.panel()
'purchaseOrder'.field({refersToParent: 'PO', showAsLink: true})
'lineType'.field()
'product'.field({refersTo: 'products'})
'description'.field({allowEmpty: false, showAsLink: true})

'Retail Pricing'.panel()
'avgUnitCostIncludingThisOrder'.field({readOnly: true})
'recommendedRetailPriceIncTax'.field()
'wooCommerceRegularPrice'.field()
'marginPct'.field({readOnly: true})

'Quantity and Cost'.panel()
'quantityPU'.field()
'uom'.field({caption: 'Purchasing Unit of Measure', readOnly: true})
'quantity'.field({numeric: true})
'priorWeeksSalesUnits'.field({readOnly: true})
'priorWeeksSalesValue'.field({readOnly: true})
'currency'.field({readOnly: true, showAsLink: true})
'unitCostExclTaxFX'.field({numeric: true})
'unitCostIncTaxFX'.field({numeric: true, caption: "Unit Price (Inc Tax)"})
'taxPct'.field({numeric: true, decimals: 2, caption: "Tax %"})
'lineCostIncTaxFX'.field({numeric: true, minDecimals: 2, maxDecimals: 6, caption: "Line Total (Inc Tax)", readOnly: true})
'lineTaxFX'.field({numeric: true, decimals: 2, readOnly: true})

'Product Image'.panel()
'image'.field({caption: ''})

'Delivery'.panel()
'separateDelivery'.field()
'lineExpectedDeliveryDate'.field()
'receivedQuantity'.field({numeric: true, readOnly: true})
'cancelledQuantity'.field({numeric: true, readOnly: true})

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

'lineExpectedDeliveryDate'.visibleWhen((maint, poLine) => {
  if ( poLine.lineType && (poLine.lineType !== 'Product') )
    return false
  let po = poLine.refereeFast('purchaseOrder')
  if ( (! po) || (po === 'na') )
    return false
  return po.hasSeparateDeliveryLines === 'Yes'
})

'lineExpectedDeliveryDate'.readOnlyWhen((maint, poLine) => {
  return poLine.separateDelivery !== 'Yes'
})

'separateDelivery'.visibleWhen((maint, poLine) => {
  if ( poLine.lineType && (poLine.lineType !== 'Product') )
    return false
  return global.confVal('allowDeliveryDatesOnPOLines') === 'Yes'
})

'POLine'.method('shouldShowSales', function() {
  let config = 'Configuration'.bringSingleFast(); if ( ! config ) return false
  if ( config.viewSalesHistoryInPurchasing !== 'Yes' )
    return false
  if ((this.lineType === 'Product') && this.product) 
    return true
  return false
})

'priorWeeksSalesUnits'.dynamicCaption(maint => {
  let config = 'Configuration'.bringSingleFast(); if ( ! config ) return null
  let priorWeekCount = config.salesProjectionPriorWeeks
  return "Last".translate() + " " + priorWeekCount + " " + "Weeks Sales Units".translate()
})

'priorWeeksSalesValue'.dynamicCaption(maint => {
  let config = 'Configuration'.bringSingleFast(); if ( ! config ) return null
  let priorWeekCount = config.salesProjectionPriorWeeks
  return "Last".translate() + " " + priorWeekCount + " " + "Weeks Sales Value".translate()
})

'priorWeeksSalesUnits'.visibleWhen((maint, poLine) => {
  return poLine.shouldShowSales()
})

'priorWeeksSalesValue'.visibleWhen((maint, poLine) => {
  return poLine.shouldShowSales()
})

'Product Image'.visibleWhen((maint, line) => {
  return ((line.lineType === 'Product') && line.product) ? true : false
})

'quantityPU'.visibleWhen((maint, poLine) => {
  return poLine.purchasingUOMDiffers()
})

'uom'.visibleWhen((maint, poLine) => {
  if ( ! poLine.product ) return false
  let c = 'Configuration'.bringSingleFast(); if ( ! c ) return false
  return c.showUOMOnPOLines === 'Yes'
})

'Add Lot'.availableWhen(poLine => {
  return (poLine.hasLots === 'Yes') && (poLine.lotsAreSerials !== 'Yes')
})

'Add Serial Number'.availableWhen(poLine => {
  return (poLine.lotsAreSerials === 'Yes')
})

'Lots'.dynamicTitle(function() {
  let grid = this
  let poLine = grid.containerCast()
  if ( poLine.lotsAreSerials === 'Yes' )
    return 'Serial Numbers'
  else
    return 'Lots'
})

'Lots'.visibleWhen((maint, poLine) => {
  return poLine.hasLots === 'Yes'
})

'POLineMaint'.makeDestinationFor('POLine')

'POLineMaint'.afterInitialising(async poLine => {
  if ( poLine.fieldValuePendingSave("recommendedRetailPriceIncTax") ) return
  if ( poLine.fieldValuePendingSave("wooCommerceRegularPrice") ) return
  poLine.recommendedRetailPriceIncTax = 0
  poLine.wooCommerceRegularPrice = 0
  let product = await poLine.toProduct(); if ( ! product ) return
  poLine.wooCommerceRegularPrice = product._regular_price
  let avenue = await poLine.toAvenue(); if ( ! avenue ) return
  poLine.recommendedRetailPriceIncTax = avenue.recommendedRetailPriceIncTax
})

'POLine'.datatype()

'unitCostExclTaxFX'.visibleWhen((maint, poLine) => {
  return poLine.includeTaxOption === "No"
})

'unitCostIncTaxFX'.visibleWhen((maint, poLine) => {
  return poLine.includeTaxOption !== "No"
})

'Retail Pricing'.visibleWhen((maint, poLine) => {
  return (! poLine.lineType) || (poLine.lineType === 'Product')
})

'Delivery'.visibleWhen((maint, poLine) => {
  return (! poLine.lineType) || (poLine.lineType === 'Product')
})

'currency'.visibleWhen((maint, poLine) => {
  return poLine.currency ? true : false
})

'POLineMaint'.warning(async (maint, poLine) => {

  let checkMin = async () => {
    let avenue = await poLine.toAvenue(); if ( ! avenue ) return
    let min = avenue.minimumOrderQuantity; if ( ! min ) return
    if ( poLine.quantity >= min ) return
    return "Supplier minimum order quantity for this product is ".translate() + min
  }

  let checkDiscontinued = async () => {
    let inventory = await poLine.toInventory(); if ( ! inventory ) return
    if ( inventory.situation && inventory.situation.startsWith('Discontinued') )
      return 'This product is discontinued'.translate()
  }

  let msg = await checkMin()
  if ( msg ) 
    return msg
  msg = await checkDiscontinued()
  return msg
})

'product'.afterUserChange(async (oldInputValue, newInputValue, poLine, maint) => {
  await poLine.refreshCalculations({force: true})
  let name = await poLine.toProductName()
  if ( name )
    maint.setFieldValue('description', name)
  let product = await 'products'.bringFirst({uniqueName: newInputValue}) 
  if ( product ) {
    maint.setFieldValue('wooCommerceRegularPrice', product._regular_price)
    let taxPct = await product.toTaxPct()
    maint.setFieldValue('taxPct', taxPct)
    let avenue = await poLine.toAvenue()
    if ( avenue ) {
      maint.setFieldValue('recommendedRetailPriceIncTax', avenue.recommendedRetailPriceIncTax)
    }
    let inv = await product.toInventory();
    if ( inv ) {
      let curr = await poLine.referee('currency')
      let costIncTax = await inv.getDefaultPurchaseUnitCostIncTax()
      let priceFXIncTax = await global.localAmountToForeign(costIncTax, curr)
      if ( priceFXIncTax )
        maint.setFieldValue('unitCostIncTaxFX', priceFXIncTax)
      let costExclTax = await inv.getDefaultPurchaseUnitCostExclTax()
      let priceFXExclTax = await global.localAmountToForeign(costExclTax, curr)
      if ( priceFXExclTax )
        maint.setFieldValue('unitCostExclTaxFX', global.roundTo2Decimals(priceFXExclTax))
    }
    let c = await 'Configuration'.bringFirst()
    let uom = await c.referee('defaultStockingUOM')
    if ( inv && inv.stockingUOM )
      uom = await inv.referee('stockingUOM')
    if ( inv && (inv.useDifferentUOMForPurchasing === 'Yes') && inv.purchasingUOM ) 
      uom = await inv.referee('purchasingUOM')
    if ( uom )
      poLine.uom = uom.reference()
/*
    let uomRef = inv ? inv.purchasingUOM : null
    if ( ! uomRef ) {
      let c = await 'Configuration'.bringFirst()
      uomRef = c ? c.defaultStockingUOM : null
    }
    poLine.uom = global.copyObj(uomRef)
*/
  }
  await poLine.refreshUnspecifiedLot()
  await poLine.maybeRefreshQuantity()
})

'lineType'.afterUserChange(async (oldInputValue, newInputValue, poLine, maint) => {
  let lineType = poLine.lineType
  if ( lineType === "Other" ) {
    maint.setFieldValue('description', '')
    maint.setFieldValue('quantity', 1)
  } else if ( lineType && (lineType !== "Product") ) {
    maint.setFieldValue('description', lineType)
    maint.setFieldValue('quantity', 1)
  }
  await poLine.refreshUnspecifiedLot()
})

'product'.visibleWhen((maint, poLine) => {
  let lineType = poLine.lineType
  return (! lineType) || (lineType === "Product")
})

'receivedQuantity'.visibleWhen((maint, poLine) => {
  let lineType = poLine.lineType
  return (! lineType) || (lineType === "Product")
})

'cancelledQuantity'.visibleWhen((maint, poLine) => {
  let lineType = poLine.lineType
  return (! lineType) || (lineType === "Product")
})

'taxPct'.inception(async (poLine) => {
  let config = await 'Configuration'.bringSingle(); if ( ! config ) return 0
  let res = config.taxPct
  return res
})

'POLine'.datatype()

'quantity'.afterUserChange(async (oldInputValue, newInputValue, poLine, maint) => {
  if ( poLine.hasLots === 'Yes' ) {
    let config = await 'Configuration'.bringSingle(); if ( ! config ) return
    await config.balanceAllotments(poLine)
  }
  await poLine.maybeRefreshQuantity()
})

'quantity'.readOnlyWhen((maint, poLine) => {
  return poLine.purchasingUOMDiffers()
})

'quantityPU'.afterUserChange(async (oldInputValue, newInputValue, poLine) => {
  await poLine.maybeRefreshQuantity()
})


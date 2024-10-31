'InventoryMaint'.maint({panelStyle: 'titled', icon: 'BoxOpen'})
'Edit Product'.title()
'Back'.action({act: 'cancel'})
'OK'.action({act: 'ok'})
'Save'.action({act: 'save'})
'Adjust Quantity On Hand'.action({act: 'add', icon: 'none', spec: 'AdjustmentMaint.js'})
'Adjust Value'.action({act: 'add', icon: 'none', spec: 'EvaluationMaint.js'})
'Recalc Avg Cost'.action()
'View History'.action({spec: 'InventoryHistory.js'})
'View Purchase Orders'.action({spec: 'POReport.js'})
'Transfer Between Locations'.action({act: 'add', spec: 'TransferMaint.js', icon: 'none'})
'Inventory by Location'.action({spec: 'ProductLocations.js'})
'View Lots'.action({spec: 'ViewProductLots.js'})
'Labels'.action({spec: 'Labels.js'})
'Attachments'.action({act: 'attachments'})
'Supercede'.action({spec: 'Supercede.js'})
'Inventory'.datatype()

'Product'.panel()
'productName'.field({readOnly: true, caption: 'Product Name'})
'sku'.field()
'notes'.field({multiLine: true})
'quantityOnHand'.field({readOnly: true, caption: 'Quantity On Hand (Available for Sale)'})
'quantityReservedForCustomerOrders'.field({readOnly: true, caption: 'Quantity Sold but not Fulfilled'})
'quantityPickable'.field({readOnly: true, caption: 'Quantity Available to Pick'})
'quantityOnPurchaseOrders'.field({readOnly: true})
'inventoryValue2'.field({readOnly: true})

'Image'.panel()
'image'.field({caption: ''})
//'bundle'.field()

'Pricing'.panel()
'lastPurchaseUnitCostIncTax'.field()
'avgUnitCost'.field({readOnly: true})
'avgUnitCostExclTax'.field({readOnly: true})
'useMarkupPricing'.field()
'baseMarkupOn'.field()
'markupPercentage'.field()
'currentMarkedUpPriceIncTax'.field({readOnly: true})
'currentMarkedUpPriceExclTax'.field({readOnly: true})
'wooCommerceRegularPrice'.field()
'wooCommerceRegularPriceIncTax'.field({readOnly: true})
'wooCommerceRegularPriceExclTax'.field({readOnly: true})
'marginPct'.field({readOnly: true})

'Settings'.panel()
'defaultLocation'.field({refersTo: 'Location', allowEmpty: true})
'shelf'.field()
'situation'.field()
'minQuantity'.field()
'maxQuantity'.field()
'estSalesUnitsPerDay'.field({numeric: true})
'consignment'.field({yesOrNo: true, caption: "Held on Consignment?"})
'avgAlg'.field()

'Traceability'.panel()
'lotTracking'.field({caption: 'Serial/Lot Tracking'})
'trackExpiryDates'.field()

'Units of Measure'.panel()
'stockingUOM'.field({caption: 'Stocking and Sales UOM'})
'useDifferentUOMForPurchasing'.field()
'purchasingUOM'.field()
'quantityPerPurchasingUOM'.field()

'Intrastat'.panel()
'intrastatHSCode'.field({caption: 'HS Code'})

'useMarkupPricing'.visibleWhen((maint, inventory) => (global.confVal('ump') === 'Yes'))

'currentMarkedUpPriceIncTax'.visibleWhen((maint, inventory) => (inventory.useMarkupPricing === 'Yes'))

'currentMarkedUpPriceExclTax'.visibleWhen((maint, inventory) => (inventory.useMarkupPricing === 'Yes'))

'markupPercentage'.visibleWhen((maint, inventory) => (inventory.useMarkupPricing === 'Yes'))

'baseMarkupOn'.visibleWhen((maint, inventory) => (inventory.useMarkupPricing === 'Yes'))

'defaultLocation'.inception(async inventory => {
  let location = await 'Location'.bringOrCreate({locationName: 'General'})
  return location.reference()
})

'Recalc Avg Cost'.act(async (maint, inventory) => {
  await inventory.reretrieve()
  inventory.avgAlg = 'Dynamic Refresh'
  await inventory.refreshAvgUnitCost()
  let mold = global.foreman.doNameToMold('Inventory')
  mold.version++
})

'useDifferentUOMForPurchasing'.afterUserChange(async (oldInputValue, newInputValue, inv, maint) => {

  let getStockingUOMRef = async () => {
    let c = await 'Configuration'.bringFirst(); if ( ! c ) return null
    return c.defaultStockingUOM
  }

  if ( oldInputValue === newInputValue ) return
  if ( newInputValue === 'Yes' ) {
    inv.purchasingUOM = await getStockingUOMRef()
  } else {
    inv.purchasingUOM = null
  }
})

'purchasingUOM'.visibleWhen((maint, inventory) => {
  return inventory.useDifferentUOMForPurchasing === 'Yes'
})

'quantityPerPurchasingUOM'.visibleWhen((maint, inventory) => {
  if ( inventory.useDifferentUOMForPurchasing !== 'Yes' ) return false
  let c = 'Configuration'.bringSingleFast(); if ( ! c ) return false
  let stockingUOMRef = c ? c.defaultStockingUOM : null
  let stockingUOMName = stockingUOMRef ? stockingUOMRef.keyval : null
  let purchasingUOMName = inventory.purchasingUOM ? inventory.purchasingUOM.keyval : null
  if ( stockingUOMName === purchasingUOMName )
    return false
  return true
})

'View Lots'.dynamicCaption(maint => {
  let inv = maint.mainCast(); if ( ! inv ) return 'View Lots'
  if ( inv.lotTracking === 'Serial' )
    return 'View Serial Numbers'
})

'View Lots'.availableWhen(inv => {
  return inv && inv.lotTracking && (inv.lotTracking !== 'None')
})

'Suppliers'.manifest()
'Add Supplier'.action({act: 'add'})
'Avenue'.datatype()
'supplier'.field({showAsLink: true})
'productName'.field()
'sku'.field()
'isMain'.field({yesOrNo: true, caption: "Main"})
'Edit'.action({place: 'row', act: 'edit'})
'Trash'.action({place: 'row', act: 'trash'})
'AvenueMaint.js'.maintSpecname()

'trackExpiryDates'.visibleWhen((maint, inv) => {
  return (inv.lotTracking && (inv.lotTracking !== 'None'))
})

'lotTracking'.inception('None')

'lotTracking'.options(['None', 'Lot', 'Serial'])

'InventoryMaint'.makeDestinationFor('products')

'InventoryMaint'.makeDestinationFor('Inventory')

'InventoryMaint'.substituteCast(async (cast) => {
  let res = cast; if ( ! res ) return
  if ( res.datatype() === 'products' ) {
    let prodRef = res.reference()
    res = await 'Inventory'.bringOrCreate({product: prodRef})
  }
  return res
})



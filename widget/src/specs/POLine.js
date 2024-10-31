'POLine'.datatype()
'purchaseOrder'.field({refersToParent: 'PO', parentIsHeader: true})
'lineType'.field()
'product'.field({refersTo: 'products', indexed: true})
'description'.field()
'quantity'.field({numeric: true})
'currency'.field({refersTo: 'Currency'})
'taxPct'.field({numeric: true, decimals: 2, caption: "Tax %"})
'unitCostIncTaxFX'.field({numeric: true, minDecimals: 2, maxDecimals: 6, caption: "Unit Price (Inc Tax)"})
'unitCostIncTax'.field({numeric: true, minDecimals: 2, maxDecimals: 6, caption: "Unit Price (Inc Tax)", storedCalc: true})
'unitCostExclTaxFX'.field({numeric: true, minDecimals: 2, maxDecimals: 6, caption: "Unit Price (Excl Tax)"})
'unitCostExclTax'.field({numeric: true, minDecimals: 2, maxDecimals: 6})
'lineCostIncTax'.field({numeric: true, minDecimals: 2, maxDecimals: 6, caption: "Line Total (Inc Tax)"})
'lineCostIncTaxFX'.field({numeric: true, minDecimals: 2, maxDecimals: 6, caption: "Line Total (Inc Tax)", readOnly: true})
'lineCostExclTaxFX'.field({numeric: true, minDecimals: 2, maxDecimals: 6, caption: "Line Total (Excl Tax)", readOnly: true})
'lineTax'.field({numeric: true, decimals: 2})
'lineTaxFX'.field({numeric: true, decimals: 2, caption: "Line Tax", readOnly: true})
'receivedQuantity'.field({numeric: true, readOnly: true})
'cancelledQuantity'.field({numeric: true})
'outstandingQuantity'.field({numeric: true})
'sku'.field({caption: 'SKU'})
'supplierProductNameAndSKU'.field({caption: 'Product'})
'descriptionCalc'.field()
'descriptionAndSupplierSKU'.field({caption: 'Description', deferCalc: true})
'descriptionAndSKU'.field({caption: 'Description'})
'avgUnitCostIncludingThisOrder'.field({numeric: true, decimals: 2, caption: "Avg Unit Cost (including this Order)", deferCalc: true})
'avgUnitCostIncThisOrderExTax'.field({numeric: true, decimals: 2, caption: "Avg Unit Cost Excl Tax (including this Order)", deferCalc: true})
'recommendedRetailPriceIncTax'.field({numeric: true, decimals: 2, caption: "Recommended Retail Price (inc Tax)"})
'wooCommerceRegularPrice'.field({numeric: true, decimals: 2, caption: "WooCommerce Regular Price"})
'wooCommerceRegularPriceExclTax'.field({numeric: true, decimals: 2, caption: "WooCommerce Regular Price (Excl Tax)"})
'marginPct'.field({numeric: true, decimals: 2, caption: "Margin %"})
'supplierSku'.field({caption: 'Supplier SKU'})
'includeTaxOption'.field({yesOrNo: true})
'unitCostIncTaxFXRounded'.field({numeric: true, decimals: 2, caption: "Unit Price (Inc Tax)"})
'hasLots'.field({yesOrNo: true, deferCalc: true})
'lotsAreSerials'.field({yesOrNo: true})
'uomDisplay'.field({caption: 'Unit of Measure'})
'uom'.field({refersTo: 'UOM', caption: 'Unit of Measure'})
'quantityPUWithUOM'.field({caption: 'Quantity'})
'productPurchasingUOM'.field({refersTo: 'UOM'})
'quantityPU'.field({numeric: true, caption: 'Purchasing Unit Quantity'})
'image'.field({postImage: true, postImageType: 'full', postIdField: 'product'})
'thumbnailImage'.field({postImage: true, postImageType: 'thumbnail', postIdField: 'product', caption: 'Image'})
'lineCostExclTax'.field({numeric: true, minDecimals: 2, maxDecimals: 6, caption: "Line Total (Excl Tax)"})
'priorWeeksSalesUnits'.field({numeric: true, decimals: 0})
'priorWeeksSalesValue'.field({numeric: true, decimals: 2})
'separateDelivery'.field({yesOrNo: true})
'lineExpectedDeliveryDate'.field({date: true, caption: 'Expected Delivery Date', allowEmpty: true})
'soLine'.field({refersTo: 'SOLine', indexed: true})

'POLine'.method('toSupplierCode', async function() {
  let supp = await this.toSupplier(); if ( ! supp ) return ''
  return supp.code
})

'POLine'.method('toSupplier', async function() {
  let po = await this.toPO(); if ( ! po ) return null
  return await po.toSupplier()
})

'wooCommerceRegularPriceExclTax'.calculate(async line => {
  let res = line.wooCommerceRegularPrice;
  let sess = await 'session'.bringSingle(); if ( ! sess ) return res
  if ( sess.wcPricesIncludeTax !== 'yes' ) return res
  let inv = await line.toInventory(); if ( ! inv ) return res
  let taxPct = await inv.toRetailTaxPct(); if ( ! taxPct ) return res
  res = res / (1 + 1/(taxPct / 100))
  return res
})

'POLine'.method('refreshReceived', async function() {
  let recLines = await this.toPOReceiptLines()
  this.receivedQuantity = 0
  this.cancelledQuantity = 0
  for ( var i = 0; i < recLines.length; i++ ) {
    let recLine = recLines[i]
    this.receivedQuantity += recLine.receivedQuantity
    this.cancelledQuantity += recLine.cancelledQuantity
  }
})

'priorWeeksSalesUnits'.calculate(async poLine => {
  let inventory = poLine.toInventoryFast()
  if ( (! inventory) || (inventory === 'na') )
    inventory = await poLine.toInventory()
  return inventory && inventory.priorWeeksSalesUnits
})

'priorWeeksSalesValue'.calculate(async poLine => {
  let inventory = poLine.toInventoryFast()
  if ( (! inventory) || (inventory === 'na') )
    inventory = await poLine.toInventory()
  let res = inventory && inventory.priorWeeksSalesValue
  let configuration = 'Configuration'.bringSingleFast()
  if ( ! configuration )
    return res
  if ( configuration.enterPurchasePricesInclusiveOfTax === 'Yes' )
    res = inventory && inventory.priorWeeksSalesValueExclTax
  return res
})

'POLine'.method('toExpectedDeliveryDate', async function() {
  if ( this.separateDelivery === 'Yes' ) 
    return this.lineExpectedDeliveryDate
  let po = await this.toPO(); if ( ! po ) return global.emptyYMD()
  return po.expectedDeliveryDate
})

'POLine'.method('maybeRefreshQuantity', async function() {
  let poLine = this
  if ( ! poLine.purchasingUOMDiffers() ) {
    poLine.quantityPU = poLine.quantity
    return
  }
  let inv = await poLine.toInventory(); if ( ! inv ) return
  let mult = inv.quantityPerPurchasingUOM; if ( ! mult ) return
  poLine.quantity = poLine.quantityPU * mult
})

'POLine'.method('purchasingUOMDiffers', function() {
  let poLine = this
  if ( ! poLine.product ) return false
  let c = 'Configuration'.bringSingleFast(); if ( ! c ) return false
  if ( c.showUOMOnPOLines !== 'Yes' ) return false
  if ( ! poLine.productPurchasingUOM ) return false
  if ( ! c.defaultStockingUOM ) return true
  return poLine.productPurchasingUOM.keyval !== c.defaultStockingUOM.keyval
})

/*
'quantity'.calculate(async poLine => {
  let res = poLine.quantityPU
  let inv = await poLine.toInventory(); if ( ! inv ) return res
  let mult = inv.quantityPerPurchasingUOM; if ( ! mult ) return res
  return res * mult
})
*/

'quantityPU'.inception('1')

'productPurchasingUOM'.calculate(async poLine => {
  let inv = poLine.toInventoryFast()
  if ( (! inv) || (inv === 'na') ) {
    inv = await poLine.toInventory(); if ( ! inv ) return null
  }
  return inv.purchasingUOM
})

'quantityPUWithUOM'.calculate(async poLine => {
  let res = poLine.quantity + ''
  let c = 'Configuration'.bringSingleFast(); if ( ! c ) return res
  if ( c.showUOMOnPOLines !== 'Yes' ) return res
  res = poLine.quantityPU + ''
  let uom = poLine.uomDisplay
  if ( uom )
    res += ' [' + uom + ']'
  return res
})

'uomDisplay'.calculate(async poLine => {
  if ( poLine.uom ) {
    return poLine.uom.keyval
  }
  let c = 'Configuration'.bringSingleFast(); if ( ! c ) return ''
  let uom = await c.toDefaultStockingUOM(); if ( ! uom ) return ''
  return uom.uomName
})

'POLine'.method('refreshClumps', async function(allotment) {
  if ( this.hasLots !== 'Yes' ) return
  let allotments = await this.toAllotments()
  for ( var i = 0; i < allotments.length; i++ ) {
    let a = allotments[i]
    let clump = await a.toClump(); if ( ! clump ) continue
    await clump.refreshQuantityOnPurchaseOrders()
  }
})

'POLine'.method('checkSerialNotDuplicated', async function(allotment) {
  if ( this.lotsAreSerials !== 'Yes' ) return
  let lot = await allotment.toLot(); if ( ! lot ) return
  if ( lot.lotNumber === 'Unspecified' )
    return
  let otherAllotments = await 'Allotment'.bring({lot: lot})
  for ( var j = 0; j < otherAllotments.length; j++ ) {
    let oa = otherAllotments[j]
    if ( oa.id === allotment.id ) continue
    if ( oa.quantity <= 0 ) continue
    let parent = await oa.parent(); if ( ! parent ) continue
    if ( oa.quantity <= 0 ) continue
    if ( parent.datatype() !== 'POLine' ) continue
    throw(new Error('This serial number is already on order'))
  }
})

'POLine'.method('toAllotments', async function() {
  return await 'Allotment'.bringChildrenOf(this)
})

'POLine'.method('allotmentToOutstandingQuantity', async function(allotment) {
  let qty = allotment.quantity
  let lotNumber = await allotment.toLotNumber()
  let receivedAllotments = await this.toReceivedAllotments()
  for ( let i = 0; i < receivedAllotments.length; i++ ) {
    let ra = receivedAllotments[i]
    let rln = await ra.toLotNumber()
    if ( rln !== lotNumber ) continue
    qty -= ra.quantity
  }
  return qty
})

'POLine'.method('toReceivedAllotments', async function() {
  let res = []
  let rls = await this.toPOReceiptLines()
  for ( var i = 0; i < rls.length; i++ ) {
    let rl = rls[i]
    let as = await rl.toAllotments()
    res.appendArray(as)
  }
  return res
})

'POLine'.method('toPOReceiptLines', async function() {
  let res = await 'POReceiptLine'.bring({poLine: this})
  return res
})

'POLine'.method('toStatus', async function() {
  let po = await this.toPO(); if ( ! po ) return null
  return po.status
})

'POLine'.method('toMainQuantity', async function() {
  return this.quantity
})

'POLine'.method('refreshUnspecifiedLot', async function() {
  let c = await 'Configuration'.bringFirst(); if ( ! c ) return
  await c.balanceAllotments(this)
})

'hasLots'.calculate(async poLine => {
  let inv = await poLine.toInventory(); if ( ! inv ) return 'No'
  let bres = inv.lotTracking && (inv.lotTracking !== 'None')
  let res = bres ? 'Yes' : 'No'
  return res
})

'lotsAreSerials'.calculate(async poLine => {
  let inv = await poLine.toInventory(); if ( ! inv ) return 'No'
  let bres = inv.lotTracking === 'Serial'
  let res = bres ? 'Yes' : 'No'
  return res
})

'quantity'.inception(1)

'POLine'.afterCreating(async function () {
  let c = await 'Configuration'.bringFirst(); if ( ! c ) return
  this.includeTaxOption = c.enterPurchasePricesInclusiveOfTax
})

'currency'.calculate(async poLine => {
  let po = poLine.refereeFast('purchaseOrder', {noCalc: true})
  if ( (! po) || (po === 'na') )
    po = await poLine.toPO()
  return po && po.currency
})

'unitCostExclTaxFX'.calculateWhen(async (poLine) => {
  return await poLine.enteredInclusiveOfTax()
})

'unitCostExclTaxFX'.calculate(async (poLine) => {
  let res = global.roundToXDecimals(poLine.unitCostIncTaxFX / ( 1 + (poLine.taxPct / 100)), 6)
  return res
})

'unitCostIncTaxFX'.calculateWhen(async (poLine) => {
  return await poLine.enteredExclusiveOfTax()
})

'unitCostIncTaxFX'.calculate(async (poLine) => {
  let res = global.roundToXDecimals(poLine.unitCostExclTaxFX * ( 1 + (poLine.taxPct / 100)), 6)
  return res
})

'unitCostIncTaxFXRounded'.calculate(async (poLine) => {
  return poLine.unitCostIncTaxFX
})

'unitCostIncTax'.calculate(async poLine => {
  let exchangeRate = await poLine.toExchangeRate()
  if ( ! exchangeRate )
    exchangeRate = 1
  let res = poLine.unitCostIncTaxFX / exchangeRate
  return res
})

'unitCostExclTax'.calculate(async (poLine) => {
  let res = poLine.unitCostIncTax / ( 1 + (poLine.taxPct / 100))
  return res
})

'avgUnitCostIncludingThisOrder'.calculate(async poLine => {
  let inv = await poLine.toInventory()
  let prodQty = inv ? inv.quantityOnHand : 0
  let prodAvg = inv ? inv.avgUnitCost : 0
  if ( (prodAvg === global.unknownNumber()) && (prodQty !== 0) )
    return global.unknownNumber()
  let totalQty = prodQty + poLine.outstandingQuantity
  if ( ! totalQty ) return 0
  let res = ((prodAvg * prodQty) + (poLine.unitCostIncTax * poLine.outstandingQuantity)) / totalQty
  return res
})

'avgUnitCostIncThisOrderExTax'.calculate(async poLine => {
  let inv = await poLine.toInventory()
  let prodQty = inv ? inv.quantityOnHand : 0
  let prodAvg = inv ? inv.avgUnitCostExclTax : 0
  if ( (prodAvg === global.unknownNumber()) && (prodQty !== 0) )
    return global.unknownNumber()
  let totalQty = prodQty + poLine.outstandingQuantity
  if ( ! totalQty ) return 0
  let res = ((prodAvg * prodQty) + (poLine.unitCostExclTax * poLine.outstandingQuantity)) / totalQty
  return res
})

'marginPct'.calculate(async poLine => {
  let inv = await poLine.toInventory(); if ( ! inv ) return 0
  let avgUnitCost = poLine.avgUnitCostIncThisOrderExTax; if ( avgUnitCost === global.unknownNumber() ) return 0
  let regularPrice = poLine.wooCommerceRegularPriceExclTax; if ( ! regularPrice ) return 0
  let marginValue = regularPrice - avgUnitCost
  let res = (marginValue / regularPrice) * 100
  return res
})

'descriptionCalc'.calculate(async (poLine) => {
  let res = poLine.description
  if ( ! res )
    res = await poLine.toProductUniqueName()
  return res
})

'sku'.calculate(async (poLine) => {
  let p = poLine.toProductFast() 
  if ( (! p) || (p === 'na') ) {
    p = await poLine.toProduct(); if ( ! p ) return null
  }
  return p._sku
})

'lineType'.options(['Product', 'Shipping', 'Fee', 'Tax', 'Other'])

'lineType'.inception('Product')

'POLine'.method('toExchangeRate', async function() {
  let res = 1
  let po = this.refereeFast('purchaseOrder', {noCalc: true})
  if ( (! po) || (po === 'na') )
    po = await this.toPO()
  if ( ! po ) return res
  res = po.exchangeRate
  if ( ! res )
    res = 1
  return res
})

'POLine'.method('toProductUniqueName', async function() {
  let p = await this.toProduct(); if ( ! p ) return null
  return p.uniqueName
})

'POLine'.method('toAvenue', async function() {
  let inv = await this.toInventory(); if ( ! inv ) return null
  let suppRef = await this.toSupplierRef(); if ( ! suppRef ) return null
  return await inv.supplierRefToAvenue(suppRef)
})

'POLine'.method('toAvenueFast', function() {
  let inv = this.toInventoryFast(); 
  if ( (! inv) || (inv === 'na') ) return inv
  let suppRef = this.toSupplierRefFast()
  if ( (! suppRef) || (suppRef === 'na') ) return suppRef
  return inv.supplierRefToAvenueFast(suppRef)
})

'POLine'.method('toInventoryFast', function() {
  let product = this.toProductFast(); 
  if ( (! product) || (product === 'na') ) return product
  return product.toInventoryFast()
})

'descriptionAndSupplierSKU'.calculate(async (poLine) => {
  let res = poLine.descriptionCalc
  let sku = await poLine.toSupplierSku(); if ( ! sku ) return res
  res += " (" + sku + ")"
  return res
})

'descriptionAndSKU'.calculate(async (poLine) => {
  let res = poLine.descriptionCalc
  let sku = poLine.sku
  if ( sku )
    res += " (" + sku + ")"
  return res
})

'POLine'.method('toSupplierSku', async function () {
  let inv = this.toInventoryFast() 
  if ( (! inv) || (inv === 'na') ) {
    inv = await this.toInventory(); if ( ! inv ) return null
  }
  let suppRef = await this.toSupplierRef(); if ( ! suppRef ) return null
  return await inv.supplierRefToSKU(suppRef)
})

'supplierSku'.calculate(async (poLine) => {
  let res
  let inv = poLine.toInventoryFast() 
  if ( (! inv) || (inv === 'na')  ) {
    inv = await poLine.toInventory(); if ( ! inv ) return res
  }
  let suppRef = poLine.toSupplierRefFast() 
  if ( ! suppRef ) {
    suppRef = await poLine.toSupplierRef(); if ( ! suppRef ) return res
  }
  return await inv.supplierRefToSKU(suppRef)
})

'supplierProductNameAndSKU'.calculate(async (poLine) => {
  let res
  if ( ! poLine.product ) 
    return res
  let product = poLine.toProductFast() 
  if ( ! product ) {
    product = await poLine.toProduct(); if ( ! product ) return res
  }
  res = product.uniqueName
  let inv = poLine.toInventoryFast() 
  if ( ! inv ) {
    inv = await poLine.toInventory(); if ( ! inv ) return res
  }
  let suppRef = poLine.toSupplierRefFast() 
  if ( ! suppRef ) {
    suppRef = await poLine.toSupplierRef(); if ( ! suppRef ) return res
  }
  return await inv.supplierRefToProductNameAndSKU(suppRef)
})

'POLine'.method('toInventory', async function() {
  let product = await this.toProduct(); if ( ! product ) return null
  return await product.toInventory()
})

'POLine'.method('toPO', async function() {
  return await this.referee('purchaseOrder', {includeMarkedForDeletion: true})
})

'POLine'.method('toProduct', async function() {
  if ( ! this.product ) return null
  return await this.referee('product')
})

'POLine'.method('toProductFast', function() {
  if ( ! this.product ) return null
  return this.refereeFast('product')
})

'POLine'.method('toProductName', async function() {
  let p = await this.toProduct(); if ( ! p ) return null
  let res = await p.toName()
  return res
})

'POLine'.method('toSupplierRef', async function() {
  let po = this.refereeFast('purchaseOrder', {noCalc: true})
  if ( (! po) || (po === 'na') )
    po = await this.toPO()
  return po && po.supplier
})

'POLine'.method('toSupplierRefFast', function() {
  let po = this.refereeFast('purchaseOrder', {noCalc: true})
  if ( (! po) || (po === 'na') ) return po
  return po.supplier
})

'POLine'.method('maybeInitFXFields', async function() {
  let thisIsFromOldVersion = this.unitCostIncTax && (! this.unitCostIncTaxFX)
  if ( thisIsFromOldVersion ) {
    this.unitCostIncTaxFX = this.unitCostIncTax
  }
})

'POLine'.afterRetrieving(async function() {
  this.maybeInitFXFields()
})

'POLine'.afterRetrievingFast(function() {
  this.maybeInitFXFields()
  return true
})

'description'.fallback(async poLine => {
  let name = await poLine.toProductName()
  if ( name )
    return name
  return poLine.lineType
})

'POLine'.method('ensureProdRefComplete', async function() {
  if ( ! this.product ) return
  if ( this.product.id ) return
  let product = await 'products'.bringFirst({uniqueName: this.product.keyval})
  if ( ! product ) 
    return 
    //throw(new Error('Invalid product ' + this.product.keyval))
  this.product.id = product.id
})

'POLine'.method('ensureOldProdRefComplete', async function() {
  let old = this.getOld(); if ( ! old ) return
  if ( ! old.product ) return
  if ( old.product.id ) return
  let product = await 'products'.bringFirst({uniqueName: old.product.keyval})
  if ( ! product ) 
    return 
  old.product.id = product.id
})

'POLine'.beforeSaving(async function() {
  let po
  let inv
  if ( (! this.isNew()) && (this.lineType !== this.getOld().lineType) )
    throw(new Error("You cannot change the line type of an existing PO Line"))
  if ( this.lineType && (this.lineType !== "Product") ) {
    po = await this.toPO(); if ( ! po ) return
    await po.refreshStatus()
    return
  }
  if ( this.lineType && (this.lineType !== "Product") ) return
  if ( ! this.product )
    throw(new Error("Please choose a product"))
  await this.ensureProdRefComplete()
  await this.ensureOldProdRefComplete()
  if ( ! this.product.id )
    return // was giving error in fx upgrade process

  let refreshAvenue = async () => {
    let supplier = await po.toSupplier(); if ( ! supplier ) return
    let suppRef = supplier.reference()
    if ( ! inv ) return
    let avenue = await inv.supplierRefToAvenue(suppRef)
    if ( ! avenue ) {
      avenue = await 'Avenue'.create(null, {inventory: inv.reference()})
      avenue.supplier = suppRef
      avenue.productName = inv.productName
      avenue.isMain = 'No'
      //avenue.sku = inv.sku
    }
    if ( ! this._markedForDeletion ) {
      avenue.recommendedRetailPriceIncTax = this.recommendedRetailPriceIncTax
    }
  }

  let checkSerialNotOnOtherOrder = async () => {
    if ( this.lotsAreSerials !== 'Yes' ) return
    let allotments = await this.toAllotments()
    for ( var i = 0; i < allotments.length; i++ ) {
      let a = allotments[i]
      let lot = await a.toLot(); if ( ! lot ) continue
      if ( lot.lotNumber === 'Unspecified' )
        continue
      let otherAllotments = await 'Allotment'.bring({lot: lot})
      for ( var j = 0; j < otherAllotments.length; j++ ) {
        let oa = otherAllotments[j]
        if ( oa.id === a.id ) continue
        if ( oa.quantity <= 0 ) continue
        let parent = await oa.parent(); if ( ! parent ) continue
        if ( parent.datatype() !== 'POLine' ) continue
        throw(new Error('This serial number is already on order'))
      }
    }
  }

  await checkSerialNotOnOtherOrder()
  let oldProductRef = this.getOld().product
  let oldProductKeyval = oldProductRef ? oldProductRef.keyval : null
  let newProductKeyval = this.product ? this.product.keyval : null
  if ( (! this.isNew()) && (newProductKeyval !== oldProductKeyval) && ((this.receivedQuantity > 0) || (this.cancelledQuantity > 0)) ) 
    throw(new Error("You cannot change the product on a line that has been received or partially received"))
  po = await this.toPO(); if ( ! po ) return
  await po.refreshStatus()
  let oldInv
  let cluster
  let oldCluster
  let outstanding = this.quantity - this.receivedQuantity - this.cancelledQuantity
  if ( this.quantity >= 0 ) {
    if ( outstanding < 0 ) outstanding = 0
  } else {
    if ( outstanding > 0 ) outstanding = 0
  }
  let oldOutstanding = this.getOld().quantity - this.getOld().receivedQuantity - this.getOld().cancelledQuantity
  if ( this.getOld().quantity >= 0 ) {
    if ( oldOutstanding < 0 ) oldOutstanding = 0
  } else {
    if ( oldOutstanding > 0 ) oldOutstanding = 0
  }
  if ( this.product ) {
    inv = await 'Inventory'.bringOrCreate({product: this.product})
    cluster = await inv.locationRefToCluster(po.location)
  }
  if ( this.getOld().product ) {
    oldInv = await 'Inventory'.bringFirst({product: this.getOld().product})
    if ( oldInv ) {
      oldCluster = await oldInv.locationRefToCluster(po.getOld().location)
    }
  }
  if ( oldInv ) {
    await oldInv.refreshQuantityOnPurchaseOrders()
    await oldInv.refreshNextExpectedDeliveryDate()
  }
  if ( oldCluster ) {
    await oldCluster.refreshQuantityOnPurchaseOrders()
    await oldCluster.refreshNextExpectedDeliveryDate()
  }
  if ( inv ) {
    await inv.refreshQuantityOnPurchaseOrders()
    await inv.refreshLastPurchase()
    await inv.refreshNextExpectedDeliveryDate()
  }
  if ( cluster ) {
    await cluster.refreshQuantityOnPurchaseOrders()
    await cluster.refreshNextExpectedDeliveryDate()
  }
  await refreshAvenue()
  if ( (! this._markedForDeletion) && (this.wooCommerceRegularPrice !== this.getOld().wooCommerceRegularPrice) && (this.wooCommerceRegularPrice !== 0) ) {
    inv.wooCommerceRegularPrice = this.wooCommerceRegularPrice
  }
})

'POLine'.method("toOrderDate", async function() {
  let po = this.refereeFast('purchaseOrder', {noCalc: true})
  if ( (! po) || (po === 'na') )
    po = await this.toPO()
  return po && po.orderDate
})

'POLine'.method("getLineTaxUnrounded", async function() {
  let rate = this.taxPct / 100
  let factor = rate / (1 + rate)
  let lineCostIncTax = await this.calcLineCostIncTax()
  let res = lineCostIncTax * factor
  return res
})

'POLine'.method("getLineTaxFXUnrounded", async function() {
  let rate = this.taxPct / 100
  let factor = rate / (1 + rate)
  let lineCostIncTax = await this.calcLineCostIncTaxFX()
  let res = lineCostIncTax * factor
  return res
})

'POLine'.method('calcLineCostIncTaxFX', async function () {
  let res = global.roundTo2Decimals(this.unitCostIncTaxFX * this.quantity)
  return res
})

'POLine'.method('calcLineCostIncTax', async function () {
  let res = global.roundTo2Decimals(this.unitCostIncTax * this.quantity)
  return res
})

'POLine'.method('calcLineCostExclTax', async function () {
  let res = global.roundTo2Decimals(this.unitCostExclTax * this.quantity)
  return res
})

'POLine'.method('calcLineCostExclTaxFX', async function () {
  let res = global.roundTo2Decimals(this.unitCostExclTaxFX * this.quantity)
  return res
})

'POLine'.method('toTaxClass', async function () {
  let p = await this.toProduct(); if ( ! p ) return null
  return p._tax_class
})

'POLine'.method('toReceivedQuantityCostIncTax', async function () {
  return this.receivedQuantity * this.unitCostIncTax
})

'POLine'.method('toReceivedQuantityTax', async function () {
  return this.receivedQuantity * (await this.toUnitTax())
})

'POLine'.method('toUnitTax', async function () {
  return this.unitCostIncTax - this.unitCostExclTax
})

'outstandingQuantity'.calculate(async (poLine) => {
  if ( poLine.lineType && (poLine.lineType !== "Product") ) 
    return 0
  let res = poLine.quantity - poLine.receivedQuantity - poLine.cancelledQuantity
  return res
})

'lineCostIncTax'.calculate(async (poLine) => {
  let res = await poLine.calcLineCostIncTax()
  return res
})

'lineCostIncTaxFX'.calculate(async (poLine) => {
  let res = await poLine.calcLineCostIncTaxFX()
  return res
})

'lineCostExclTaxFX'.calculate(async (poLine) => {
  let res = await poLine.calcLineCostExclTaxFX()
  return res
})

'lineCostExclTax'.calculate(async (poLine) => {
  let res = await poLine.calcLineCostExclTax()
  return res
})

'lineTaxFX'.calculate(async (poLine) => {
  let res = await poLine.getLineTaxFXUnrounded()
  res = global.roundTo2Decimals(res)
  return res
})

'lineTax'.calculate(async (poLine) => {
  let res = await poLine.getLineTaxUnrounded()
  res = global.roundTo2Decimals(res)
  return res
})

'POLine'.method('enteredExclusiveOfTax', async function () {
  return this.includeTaxOption === "No"
})

'POLine'.method('enteredInclusiveOfTax', async function () {
  return this.includeTaxOption !== "No"
})

'POLine'.method('toLocationName', async function() {
  let po = await this.toPO(); if ( ! po ) return 'General'
  let res = await po.toLocationName()
  return res
})

'POLine'.method('refreshLotQuantities', async function() {
  let inv = await this.toInventory(); if ( ! inv ) return
  await inv.refreshQuantityOnPurchaseOrdersForLots()
})

'POLine'.method('toCluster', async function() {
  let inv = await this.toInventory(); if ( ! inv ) return null
  let locRef = await this.toLocationRef(); if ( ! locRef ) return null
  let res = await inv.locationRefToCluster(locRef)
  return res
})

'POLine'.method('toLocationRef', async function() {
  let po = this.refereeFast('purchaseOrder', {noCalc: true})
  if ( (! po) || (po === 'na') )
    po = await this.toPO()
  let res = po && po.location
  return res
})

'POLine'.method('toLocation', async function() {
  let po = await this.toPO(); if ( ! po ) return null
  let res = await po.toLocation()
  return res
})


'POReceiptLine'.datatype()
'receiptNumber'.field({refersToParent: 'POReceipt', parentIsHeader: true})
'product'.field({refersTo: 'products', showAsLink: true})
'descriptionAndSKU'.field({caption: 'Description', deferCalc: true})
'orderedQuantity'.field({numeric: true})
'receivedQuantity'.field({numeric: true})
'previouslyReceived'.field({numeric: true})
'cancelledQuantity'.field({numeric: true, caption: 'Cancelled Quantity'})
'outstandingQuantity'.field({numeric: true})
'poLine'.field({refersTo: 'POLine', caption: "PO Line", indexed: true})
'supplierName'.field()
'unitCostFX'.field({numeric: true, minDecimals: 2, maxDecimals: 6, caption: "Unit Price (Inc Tax)"})
'unitCostExclTaxFX'.field({numeric: true, minDecimals: 2, maxDecimals: 6, caption: "Unit Price (Excl Tax)"})
'unitCost'.field({numeric: true, minDecimals: 2, maxDecimals: 6, caption: "Unit Price (Inc Tax)", storedCalc: true})
'unitCostExclTax'.field({numeric: true, minDecimals: 2, maxDecimals: 6, caption: "Unit Price (Excl Tax)"})
'currency'.field({refersTo: 'Currency'})
'avgUnitCostIncludingThisOrder'.field({numeric: true, decimals: 2, caption: "Avg Unit Cost (including this Order)"})
'avgUnitCostIncThisOrderExTax'.field({numeric: true, decimals: 2, caption: "Avg Unit Cost Ex Tax (including this Order)"})
'recommendedRetailPriceIncTax'.field({numeric: true, decimals: 2, caption: "Recommended Retail Price (inc Tax)"})
'recommendedRetailPriceExclTax'.field({numeric: true, decimals: 2})
'wooCommerceRegularPrice'.field({numeric: true, decimals: 2, caption: "WooCommerce Regular Price"})
'wooCommerceRegularPriceExclTax'.field({numeric: true, decimals: 2, caption: "WooCommerce Regular Price Excl Tax"})
'marginPct'.field({numeric: true, decimals: 2, caption: "Margin %"})
'barcode'.field({deferCalc: true})
'includeTaxOption'.field({yesOrNo: true})
'supplierSku'.field({caption: 'Supplier SKU'})
'taxPct'.field({caption: "Tax %", deferCalc: true})
'unitCostIncTaxFXRounded'.field({numeric: true, decimals: 2, caption: "Unit Price (Inc Tax)"})
'lineCostIncTaxFX'.field({numeric: true, minDecimals: 2, maxDecimals: 6, caption: "Line Total (Inc Tax)"})
'sku'.field({caption: 'SKU'})
'hasLots'.field({yesOrNo: true, deferCalc: true})
'lotsAreSerials'.field({yesOrNo: true})
'orderedQuantityPU'.field({numeric: true, caption: 'Ordered Quantity', maxDecimals: 6})
'receivedQuantityPU'.field({numeric: true, caption: 'Received Quantity', maxDecimals: 6})
'previouslyReceivedPU'.field({numeric: true, caption: 'Previously Received', maxDecimals: 6, deferCalc: true})
'cancelledQuantityPU'.field({numeric: true, caption: 'Cancelled Quantity', maxDecimals: 6})
'outstandingQuantityPU'.field({numeric: true, caption: 'Outstanding Quantity', maxDecimals: 6})
'uomDisplay'.field({caption: 'Unit of Measure'})
'uom'.field({refersTo: 'UOM', caption: 'Unit of Measure'})
'newQuantityOnHand'.field({numeric: true, caption: 'New QOH'})
'image'.field({postImage: true, postImageType: 'full', postIdField: 'product'})
'thumbnailImage'.field({postImage: true, postImageType: 'thumbnail', postIdField: 'product', caption: 'Image'})
'supplierReference'.field({caption: 'Supplier\'s Invoice#/Reference'})
'receivedDate'.field({date: true})
'orderDate'.field({date: true})
'supplier'.field({refersTo: 'Supplier'})
'supplierCountry'.field()
'lineCost'.field({numeric: true, minDecimals: 2, maxDecimals: 2})
'intrastatHSCode'.field()
'weight'.field({numeric: true})
'lineType'.field()

'lineType'.calculate(async line => {
  let poLine = await line.toPOLine(); if ( ! poLine ) return null
  return poLine.lineType
})

'POReceiptLine'.method('calcLineCostIncTax', async function () {
  let res = global.roundTo2Decimals(this.unitCost * this.receivedQuantity)
  return res
})

'POReceiptLine'.method("getLineTaxUnrounded", async function() {
  let rate = this.taxPct / 100
  let factor = rate / (1 + rate)
  let lineCostIncTax = await this.calcLineCostIncTax()
  let res = lineCostIncTax * factor
  return res
})

'POReceiptLine'.method('toSupplierCode', async function() {
  let s = await this.toSupplier(); if ( ! s ) return ''
  return s.code
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

'lineExpectedDeliveryDate'.field({date: true, caption: 'Expected Delivery Date'})

'lineExpectedDeliveryDate'.calculate(async poReceiptLine => {
  let poLine = await poReceiptLine.toPOLine(); if ( ! poLine ) return global.emptyYMD()
  return poLine.lineExpectedDeliveryDate
})

'wooCommerceRegularPrice'.afterUserChange(async (oldInputValue, newInputValue, recLine) => {
  let inv = await recLine.toInventory({allowCreate: true})
  inv.wooCommerceRegularPrice = recLine.wooCommerceRegularPrice
})

'weight'.calculate(async line => {
  let product = await line.toProduct(); if ( ! product ) return 0
  return product._weight
})

'intrastatHSCode'.calculate(async line => {
  let inv = await line.toInventory(); if ( ! inv ) return null
  return inv.intrastatHSCode
})

'supplierReference'.calculate(async line => {
  let po = line.toPOFast({noCalc: true}) 
  if ( (! po) || (po === 'na') ) {
    po = await line.toPO({noCalc: true}); if ( ! po ) return null
  }
  return po.supplierReference
})

'receivedDate'.calculate(async line => {
  let rec = await line.toPOReceipt({noCalc: true}); if ( ! rec ) return null
  return rec.receivedDate
})

'orderDate'.calculate(async line => {
  let po = await line.toPO({noCalc: true}); if ( ! po ) return null
  return po.orderDate
})

'supplier'.calculate(async line => {
  let po = await line.toPO({noCalc: true})
  return po && po.supplier
})

'supplierCountry'.calculate(async line => {
  let supplier = line.toSupplierFast({noCalc: true}) 
  if ( (! supplier) || (supplier === 'na') ) {
    supplier = await line.toSupplier(); if ( ! supplier ) return null
  }
  return supplier.country
})

'lineCost'.calculate(line => {
  return line.unitCost * line.receivedQuantity
})

'newQuantityOnHand'.calculate(async line => {
  let inv = await line.toInventory()
  let res = inv ? inv.quantityOnHand : 0
  res += line.receivedQuantity - line.getOld().receivedQuantity
  return res
})

'uomDisplay'.calculate(async line => {
  if ( line.uom ) {
    return line.uom.keyval
  }
  let c = 'Configuration'.bringSingleFast(); if ( ! c ) return ''
  let uom = await c.toDefaultStockingUOM(); if ( ! uom ) return ''
  return uom.uomName
})

'POReceiptLine'.method('refreshCancelledQuantity', async function() {
  let mult = await this.toQuantityPerPurchasingUOM()
  if ( ! mult ) mult = 1
  this.cancelledQuantity = this.cancelledQuantityPU * mult
})

'POReceiptLine'.method('refreshReceivedQuantityPU', async function() {
  this.receivedQuantityPU = await this.numberToPU(this.receivedQuantity)
})

'POReceiptLine'.method('refreshReceivedQuantity', async function() {
  let mult = await this.toQuantityPerPurchasingUOM()
  if ( ! mult ) mult = 1
  this.receivedQuantity = this.receivedQuantityPU * mult
})

'lotsAreSerials'.calculate(async recLine => {
  let inv = await recLine.toInventory(); if ( ! inv ) return 'No'
  let bres = inv.lotTracking === 'Serial'
  let res = bres ? 'Yes' : 'No'
  return res
})

'POReceiptLine'.method('toAllotments', async function() {
  return await 'Allotment'.bringChildrenOf(this)
})

'POReceiptLine'.method('toPOStatus', async function() {
  let po = await this.toPO(); if ( ! po ) return null
  return po.status
})

'POReceiptLine'.method('toCluster', async function() {
  let inv = await this.toInventory(); if ( ! inv ) return null
  let locRef = await this.toLocationRef(); if ( ! locRef ) return null
  let res = await inv.locationRefToCluster(locRef)
  return res
})

'POReceiptLine'.method('toLocationRef', async function() {
  let po = await this.toPO({noCalc: true}); if ( ! po ) return null
  let res = po.location
  return res
})

'POReceiptLine'.method('toLocation', async function() {
  let po = await this.toPO({noCalc: true}); if ( ! po ) return null
  let res = await po.toLocation()
  return res
})

'POReceiptLine'.method('toMainQuantity', async function() {
  return this.receivedQuantity
})

'POReceiptLine'.method('createAllotments', async function() {
  let poLine = await this.toPOLine(); if ( ! poLine ) return
  let allotments = await 'Allotment'.bringChildrenOf(poLine)
  for ( var i = 0; i < allotments.length; i++ ) {
    let poAllotment = allotments[i]
    let quantity = await poLine.allotmentToOutstandingQuantity(poAllotment)
    if ( quantity <= 0 )
      continue
    let thisRef = this.reference()
    let a = await 'Allotment'.create({parentCast: this}, {allotmentParent: thisRef})
    let lot = await poAllotment.toLot(); if ( ! lot ) continue
    a.lot = lot.reference()
    a.quantity = quantity
  }
})

'hasLots'.calculate(async recLine => {
  let inv = await recLine.toInventory(); if ( ! inv ) return 'No'
  let bres = inv.lotTracking && (inv.lotTracking !== 'None')
  let res = bres ? 'Yes' : 'No'
  return res
})

'POReceiptLine'.method('toSupplierRef', async function() {
  let rec = await this.toPOReceipt({noCalc: true})
  return rec && rec.supplier
})

'POReceiptLine'.method('toSupplierRefFast', function() {
  let rec = this.refereeFast('receiptNumber', {noCalc: true})
  if ( (! rec) || (rec === 'na') ) return rec
  return rec.supplier
})

'POReceiptLine'.method('toReceivedDate', async function() {
  let rec = await this.toPOReceipt({noCalc: true})
  return rec && rec.receivedDate
})

'sku'.calculate(async (recLine) => {
  let p = await recLine.toProduct(); if ( ! p ) return
  return p._sku
})

'supplierSku'.calculate(async (recLine) => {
  let res
  let inv = recLine.toInventoryFast() 
  if ( (! inv) || (inv === 'na') ) {
    inv = await recLine.toInventory(); if ( ! inv ) return res
  }
  let suppRef = recLine.toSupplierRefFast() 
  if ( (! suppRef) || (suppRef === 'na') ) {
    suppRef = await recLine.toSupplierRef(); if ( ! suppRef ) return res
  }
  res = inv.supplierRefToSKUFast(suppRef)
  if ( res === 'na' ) {
    res = await inv.supplierRefToSKU(suppRef)
  }
  return res
})

'taxPct'.calculate(async (recLine) => {
  let poLine = await recLine.toPOLine()
  return poLine && poLine.taxPct
})

'POReceiptLine'.afterCreating(async function () {
  let c = await 'Configuration'.bringFirst(); if ( ! c ) return
  this.includeTaxOption = c.enterPurchasePricesInclusiveOfTax
})

'barcode'.calculate(async line => {
  let av = line.toAvenueFast({noCalc: true}) 
  if ( (! av) || (av === 'na') ) {
    av = await line.toAvenue({noCalc: true}); if ( ! av ) return null
  }
  return av.barcode
})

'unitCostExclTaxFX'.calculateWhen(async (line) => {
  return await line.enteredInclusiveOfTax()
})

'unitCostExclTaxFX'.calculate(async (line) => {
  let poLine = await line.toPOLine(); if ( ! poLine ) return 0
  let res = global.roundToXDecimals(line.unitCostFX / ( 1 + (poLine.taxPct / 100)), 6)
  return res
})

'unitCostFX'.calculateWhen(async (line) => {
  return await line.enteredExclusiveOfTax()
})

'unitCostFX'.calculate(async (line) => {
  let poLine = line.toPOLineFast() 
  if ( (! poLine) || (poLine === 'na') ) {
    poLine = await line.toPOLine(); if ( ! poLine ) return 0
  }
  let res = global.roundToXDecimals(line.unitCostExclTaxFX * (1 + (poLine.taxPct / 100)), 6)
  return res
})

'unitCost'.calculate(async line => {
  let exchangeRate = await line.toExchangeRate()
  if ( ! exchangeRate )
    exchangeRate = 1
  let res = line.unitCostFX / exchangeRate
  return res
})

'unitCostExclTax'.calculate(async line => {
  let exchangeRate = await line.toExchangeRate()
  if ( ! exchangeRate )
    exchangeRate = 1
  let res = line.unitCostExclTaxFX / exchangeRate
  return res
})

'POReceiptLine'.method('toPOLine', async function() {
  return await this.referee('poLine')
})

'POReceiptLine'.method('toPOLineFast', function(options) {
  return this.refereeFast('poLine', options)
})

'POReceiptLine'.method('toExchangeRate', async function() {
  let res = 1
  let rec = await this.toPOReceipt({noCalc: true}); if ( ! rec ) return res
  res = rec.exchangeRate
  if ( ! res )
    res = 1
  return res
})

'POReceiptLine'.method('toPOReceipt', async function(options) {
  return await this.referee('receiptNumber', options)
})

'currency'.calculate(async line => {
  let po = line.toPOFast({noCalc: true}) 
  if ( (! po) || (po === 'na') ) {
    po = await line.toPO({noCalc: true}); if ( ! po ) return null
  }
  return po.currency
})

'avgUnitCostIncludingThisOrder'.calculate(async line => {
  let inv = await line.toInventory()
  let prodQty = inv ? inv.quantityOnHand : 0
  let prodAvg = inv ? inv.avgUnitCost : 0
  if ( (prodAvg === global.unknownNumber()) && (prodQty !== 0) )
    return global.unknownNumber()
  let prodTotalValue = prodQty * prodAvg
  prodQty -= line.getOld().receivedQuantity
  prodTotalValue -= (line.getOld().receivedQuantity * line.getOld().unitCost)
  if ( prodQty !== 0 )
    prodAvg = prodTotalValue / prodQty
  let remainingQuantity = line.orderedQuantity - line.cancelledQuantity
  let totalQty = prodQty + remainingQuantity
  if ( ! totalQty ) return 0
  let res = ((prodAvg * prodQty) + (line.unitCost * remainingQuantity)) / totalQty
  return res
})

'avgUnitCostIncThisOrderExTax'.calculate(async line => {
  let inv = await line.toInventory()
  let prodQty = inv ? inv.quantityOnHand : 0
  let prodAvg = inv ? inv.avgUnitCostExclTax : 0
  if ( (prodAvg === global.unknownNumber()) && (prodQty !== 0) )
    return global.unknownNumber()
  let prodTotalValue = prodQty * prodAvg
  prodQty -= line.getOld().receivedQuantity
  prodTotalValue -= (line.getOld().receivedQuantity * line.getOld().unitCostExclTax)
  if ( prodQty !== 0 )
    prodAvg = prodTotalValue / prodQty
  let remainingQuantity = line.orderedQuantity - line.cancelledQuantity
  let totalQty = prodQty + remainingQuantity
  if ( ! totalQty ) return 0
  let res = ((prodAvg * prodQty) + (line.unitCostExclTax * remainingQuantity)) / totalQty
  return res
})

'marginPct'.calculate(async line => {
  let inv = await line.toInventory(); if ( ! inv ) return 0
  let avgUnitCost = line.avgUnitCostIncThisOrderExTax; if ( avgUnitCost === global.unknownNumber() ) return 0
  let regularPrice = line.wooCommerceRegularPriceExclTax; if ( ! regularPrice ) return 0
  let marginValue = regularPrice - avgUnitCost
  let res = (marginValue / regularPrice) * 100
  return res
})

'supplierName'.calculate(async receiptLine => {
  let supplier = receiptLine.toSupplierFast({noCalc: true}) 
  if ( (! supplier) || (supplier === 'na') ) {
    supplier = await receiptLine.toSupplier(); if ( ! supplier ) return null
  }
  return supplier.name
})

'recommendedRetailPriceExclTax'.calculate(async receiptLine => {
  let avenue = receiptLine.toAvenueFast() 
  if ( (! avenue) || (avenue === 'na') ) {
    avenue = await receiptLine.toAvenue(); if ( ! avenue ) return null
  }
  return avenue.recommendedRetailPriceExclTax
})

'descriptionAndSKU'.calculate(async receiptLine => {
  let poLine = await receiptLine.referee('poLine'); if ( ! poLine ) return null
  return poLine.descriptionAndSKU
})

'orderedQuantity'.calculate(async (recLine) => {
  let poLine = await recLine.referee('poLine'); if ( ! poLine ) return 0
  return poLine.quantity
})

'previouslyReceived'.calculate(async (recLine) => {
  let res = 0
  let otherRecLines = await 'POReceiptLine'.bring({poLine: recLine.poLine}, {useIndexedField: 'poLine', forceFast: true})
  if ( otherRecLines === 'na' )
    otherRecLines = await 'POReceiptLine'.bring({poLine: recLine.poLine}, {useIndexedField: 'poLine'})
  for ( var i = 0; i < otherRecLines.length; i++ ) {
    let rl = otherRecLines[i]
    if ( rl.id === recLine.id ) continue
    res = res + rl.receivedQuantity
  }
  return res
})

'outstandingQuantity'.calculate(async (recLine) => {
  let res = recLine.orderedQuantity - recLine.previouslyReceived - recLine.receivedQuantity - recLine.cancelledQuantity
  if ( res < 0 )
    res = 0
  return res
})

'POReceiptLine'.method('toQuantityPerPurchasingUOM', async function(num) {
  let inv = this.toInventoryFast() 
  if ( (! inv) || (inv === 'na') ) {
    inv = await this.toInventory(); if ( ! inv ) return 1
  }
  return inv.quantityPerPurchasingUOM
})

'POReceiptLine'.method('numberToPU', async function(num) {
  let div = await this.toQuantityPerPurchasingUOM()
  if ( ! div ) return num
  return num / div
})

'orderedQuantityPU'.calculate(async (recLine) => {
  return await recLine.numberToPU(recLine.orderedQuantity)
})

'previouslyReceivedPU'.calculate(async (recLine) => {
  return await recLine.numberToPU(recLine.previouslyReceived)
})

'outstandingQuantityPU'.calculate(async (recLine) => {
  return await recLine.numberToPU(recLine.outstandingQuantity)
})

'POReceiptLine'.method('toPO', async function(options) {
  let res = this.__po
  if ( res )
    return res
  let poLine = this.refereeFast('poLine', options)
  if ( (! poLine) || (poLine === 'na') )
    poLine = await this.referee('poLine') 
  if ( ! poLine ) return null
  let po = poLine.refereeFast('purchaseOrder', options)
  if ( (! po) || (po === 'na') ) 
    po = await poLine.referee('purchaseOrder')
  this.__po = po
  return po
})

'POReceiptLine'.method('toPOFast', function(options) {
  let res = this.__po
  if ( res )
    return res
  let poLine = this.refereeFast('poLine', options)
  if ( (! poLine) || (poLine === 'na') )
    return poLine
  let po = poLine.refereeFast('purchaseOrder', options)
  this.__po = po
  return po
})

'POReceiptLine'.method('toSupplier', async function() {
  let res = this.__supplier
  if ( res )
    return res
  let po = await this.toPO({noCalc: true}); if ( ! po ) return null
  res = await po.toSupplier()
  this.__supplier = res
  return res
})

'POReceiptLine'.method('toSupplierFast', function(options) {
  let res = this.__supplier
  if ( res )
    return res
  let poLine = this.refereeFast('poLine', options)
  if ( (! poLine) || (poLine === 'na') )
    return poLine
  let po = poLine.refereeFast('purchaseOrder', options)
  if ( (! po) || (po === 'na') )
    return po
  res =  po.refereeFast('supplier')
  this.__supplier = res
  return res
})

'POReceiptLine'.method('toAvenue', async function(options) {
  let res = this.__avenue
  if ( res )
    return res
  let poLine = this.toPOLineFast(options); 
  if ( (! poLine) || (poLine === 'na') ) {
    poLine = await this.toPOLine(); if ( ! poLine ) return null
  }
  res = poLine.toAvenueFast()
  if ( (! res) || (res === 'na') )
    res = await poLine.toAvenue()
  this.__avenue = res
  return res
})

'POReceiptLine'.method('toAvenueFast', function(options) {
  let res = this.__avenue
  if ( res )
    return res
  let poLine = this.toPOLineFast(options); 
  if ( (! poLine) || (poLine === 'na') ) return poLine
  res = poLine.toAvenueFast(options)
  this.__avenue = res
  return res
})

'POReceiptLine'.method('checkLotQuantities', async function() {
  let qty = 0
  let allotments = await 'Allotment'.bringChildrenOf(this)
  for ( var i = 0; i < allotments.length; i++ ) {
    let a = allotments[i]
    qty += a.quantity
  }
  if ( qty !== this.receivedQuantity ) {
    let msg
    if ( this.lotsAreSerials === 'Yes' )
      msg = 'Quantity of Serial Numbers'.translate() + ' (' + qty + ') ' + 'does not match the quantity received'.translate() + ' (' + this.receivedQuantity + ')'
    else
      msg = 'Lot quantity total'.translate() + ' (' + qty + ') ' + 'does not match the quantity received'.translate() + ' (' + this.receivedQuantity + ')'
    throw(new Error(msg))
  }
})

'POReceiptLine'.method('createTransaction', async function(chg) {
  let c = await 'Configuration'.bringOrCreate();
  if ( c.suppressPOQuantityOnHandUpdates === 'Yes' )
    return
  let po = await this.getPO(); if ( ! po ) return
  let tran = await 'Transaction'.create()
  let newExtCost = this.receivedQuantity * this.unitCost
  let oldExtCost = this.getOld().receivedQuantity * this.getOld().unitCost
  let extCostChg = newExtCost - oldExtCost
  let receipt = await this.parent()
  tran.product = this.product
  tran.date = receipt.receivedDate
  tran.quantity = chg
  tran.unitCost = (chg === 0) ? 0 : extCostChg / chg
  tran.source = 'PO Receipt'
  tran.reference = po.purchaseOrderNumber
  tran.location = global.copyObj(po.location)
  tran.taxPct = this.taxPct
  let supplier = await this.toSupplier()
  if ( supplier )
    tran.supplier = supplier.reference()
})

'POReceiptLine'.method('createTransactionForAllotment', async function(a) {
  let c = await 'Configuration'.bringOrCreate();
  if ( c.suppressPOQuantityOnHandUpdates === 'Yes' )
    return
  let po = await this.getPO(); if ( ! po ) return
  let chg = a.quantity - a.getOld().quantity
  if ( chg === 0 )
    return
  let tran = await 'Transaction'.create()
  let newExtCost = a.quantity * this.unitCost
  let oldExtCost = a.getOld().quantity * this.getOld().unitCost
  let extCostChg = newExtCost - oldExtCost
  let receipt = await this.parent()
  tran.product = this.product
  tran.date = receipt.receivedDate
  tran.quantity = chg
  tran.unitCost = (chg === 0) ? 0 : extCostChg / chg
  tran.source = 'PO Receipt'
  tran.reference = po.purchaseOrderNumber
  tran.location = global.copyObj(po.location)
  tran.lot = global.copyObj(a.lot)
  tran.taxPct = this.taxPct
  let supplier = await this.toSupplier()
  if ( supplier )
    tran.supplier = supplier.reference()
})

'POReceiptLine'.beforeSaving(async function() {
  if ( this.hasLots === 'Yes' ) 
    await this.checkLotQuantities()
  await this.refreshReceivedQuantity()
  let unreceived = this.orderedQuantity - this.previouslyReceived - this.receivedQuantity
  if ( this.propChanged('cancelledQuantity') ) {
    if ( this.orderedQuantity >= 0 ) {
      if ( unreceived < 0 ) unreceived = 0
      if ( this.cancelledQuantity > unreceived ) throw(new Error('You cannot cancel more than the quantity left on order (' + this.descriptionAndSKU + ')'))
    } else {
      if ( unreceived > 0 ) unreceived = 0
      if ( this.cancelledQuantity < unreceived ) throw(new Error('You cannot cancel more than the quantity left on order' + this.descriptionAndSKU + ')'))
    }
  }
  let poLine = await this.getPOLine()
  if ( poLine )
    await poLine.refreshReceived()
  let chg = this.receivedQuantity - this.getOld().receivedQuantity
  let po = await this.getPO(); if ( ! po ) return
  await po.refreshStatus()
  if ( this.hasLots !== 'Yes' ) { // otherwise created in beforeSaving of Allotment
    if ( (chg !== 0) && ((! poLine.lineType) || (poLine.lineType === "Product")) )
      await this.createTransaction(chg)
  }
  if ( poLine && (! this._markedForDeletion) ) {
    poLine.unitCostIncTaxFX = this.unitCostFX
    poLine.unitCostExclTaxFX = this.unitCostExclTaxFX
    poLine.recommendedRetailPriceIncTax = this.recommendedRetailPriceIncTax
    poLine.wooCommerceRegularPrice = this.wooCommerceRegularPrice
/*
    if ( this.receivedQuantity > 0 ) {
      let inv = await this.toInventory()
      if ( inv ) {
        let receivedDate = await this.toReceivedDate()
        if ( (receivedDate >= inv.lastReceivedDate) || (! inv.lastReceivedDate) ) {
          inv.lastReceivedDate = receivedDate
        }
      }
    }
*/
  }
  let inv = await this.toInventory()
  if ( inv ) {
    await inv.refreshLastReceivedDate()
  }
})

'POReceiptLine'.method('getPO',
  async function () {
    let receipt = await this.parent(); if ( ! receipt ) return null
    let res = await receipt.referee('purchaseOrder')
    return res
  }
)

'POReceiptLine'.method('getPOLine',
  async function () {
    let res = await this.referee('poLine')
    return res
  }
)

'POReceiptLine'.method('toProduct', async function() {
  return await this.referee('product')
})

'POReceiptLine'.method('toProductFast', function() {
  if ( ! this.product ) return null
  return this.refereeFast('product')
})

'POReceiptLine'.method('toInventory', async function() {
  let product = this.toProductFast() 
  if ( (! product) || (product === 'na') ) {
    product = await this.toProduct(); if ( ! product ) return null
  }
  return await product.toInventory()
})

'POReceiptLine'.method('toInventoryFast', function() {
  let product = this.toProductFast() 
  if ( (! product) || (product === 'na') ) return product
  return product.toInventoryFast()
})

'POReceiptLine'.method('maybeInitFXFields', async function() {
  let thisIsFromOldVersion = this.unitCost && (! this.unitCostFX)
  if ( thisIsFromOldVersion )
    this.unitCostFX = this.unitCost
})

/*
'POReceiptLine'.afterRetrieving(async function(options) {
  await this.refreshDependentFields()
})
*/

'POReceiptLine'.method('refreshDependentFields', async function() {
  await this.maybeInitFXFields()
  this.recommendedRetailPriceIncTax = 0
  this.wooCommerceRegularPrice = 0
  this.unitCostFX = 0
  this.unitCostExclTaxFX = 0
  let poLine = await this.getPOLine(); if ( ! poLine ) return
  this.unitCostFX = poLine.unitCostIncTaxFX
  this.unitCostExclTaxFX = poLine.unitCostExclTaxFX
  let product = await this.toProduct(); if ( ! product ) return
  this.wooCommerceRegularPrice = product._regular_price
  let avenue = await this.toAvenue(); if ( ! avenue ) return
  this.recommendedRetailPriceIncTax = avenue.recommendedRetailPriceIncTax
})

'POReceiptLine'.method('enteredExclusiveOfTax', async function () {
  return this.includeTaxOption === "No"
})

'POReceiptLine'.method('enteredInclusiveOfTax', async function () {
  return this.includeTaxOption !== "No"
})

'POReceiptLine'.method('calcLineCostIncTaxFX', async function () {
  let res = global.roundTo2Decimals(this.unitCostFX * this.receivedQuantity)
  return res
})

'POReceiptLine'.method('calcLineCostExclTaxFX', async function () {
  let res = global.roundTo2Decimals(this.unitCostExclTaxFX * this.receivedQuantity)
  return res
})

'lineCostIncTaxFX'.calculate(async (recLine) => {
  let res = await recLine.calcLineCostIncTaxFX()
  return res
})

'unitCostIncTaxFXRounded'.calculate(async (recLine) => {
  return recLine.unitCostFX
})


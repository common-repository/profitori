'Inventory'.datatype()
'product'.field({refersTo: 'products', key: true})
'quantityOnHand'.field({numeric: true})
'quantityOnPurchaseOrders'.field({numeric: true, caption: "On Purchase Orders"})
'avgUnitCost'.field({numeric: true, minDecimals: 2, maxDecimals: 6})
'avgUnitCostExclTax'.field({numeric: true, minDecimals: 2, maxDecimals: 6, deferCalc: true})
'inventoryValue'.field({numeric: true, decimals: 2})
'inventoryValue2'.field({numeric: true, decimals: 2, caption: "Inventory Value"}) // Makes unknown = 0 if qty = 0
'inventoryValueExclConsignment'.field({numeric: true, decimals: 2, caption: "Inventory Value Excl Consignment"})
'inventoryValueExclTax'.field({numeric: true, decimals: 2, caption: "Inventory Value Excl Tax", deferCalc: true})
'inventoryValueExclConsignmentExclTax'.field({numeric: true, decimals: 2, caption: "Inventory Value Excl Consignment Excl Tax"})
'product_id'.field()
'lastPurchaseUnitCostIncTax'.field({numeric: true, decimals: 2, caption: 'Last Purchase Unit Cost (Inc Tax)'})
'lastPurchaseUnitCostExclTax'.field({numeric: true, decimals: 2, caption: 'Last Purchase Unit Cost (Excl Tax)'})
'productName'.field({caption: 'Name'})
'quantityOnHand'.field({caption: 'Quantity On Hand', numeric: true})
'minQuantity'.field({caption: 'Low Stock Threshold', numeric: true})
'maxQuantity'.field({caption: 'Maximum Quantity to Replenish To', numeric: true})
'sku'.field({storedCalc: true, caption: 'SKU'})
'estSalesUnitsPerDay'.field({numeric: true})
'wooCommerceRegularPrice'.field({numeric: true, decimals: 2, caption: 'WooCommerce Regular Price'})
'wooCommerceRegularPriceIncTax'.field({numeric: true, decimals: 2, caption: 'WC Regular Price Inc Tax'})
'wooCommerceRegularPriceExclTax'.field({numeric: true, decimals: 2, caption: 'WC Regular Price Excl Tax'})
'marginPct'.field({numeric: true, decimals: 2, caption: 'Margin %'})
'recommendedRetailPriceIncTax'.field({numeric: true, decimals: 2, caption: "Recommended Retail Price (inc Tax)"})
'supplierSku'.field({caption: 'Supplier SKU'})
'inventoryValueRetail'.field({numeric: true, decimals: 2})
'barcode'.field()
'mainSupplier'.field({refersTo: 'Supplier'})
'priorWeeksSalesUnits'.field({numeric: true, decimals: 0})
'priorWeeksSalesValue'.field({numeric: true, decimals: 2})
'priorWeeksSalesValueExclTax'.field({numeric: true, decimals: 2})
'priorWeeksSASalesUnits'.field({numeric: true, decimals: 0})
'priorWeeksSASalesValue'.field({numeric: true, decimals: 2})
'priorWeeksSASalesValueExclTax'.field({numeric: true, decimals: 2})
'totalSalesUnits'.field({numeric: true, decimals: 0})
'lastSaleDate'.field({date: true, allowEmpty: true})
'lastPurchaseDate'.field({date: true, allowEmpty: true})
'lastReceivedDate'.field({date: true, allowEmpty: true})
'situation'.field()
'quantityPackable'.field({numeric: true, decimals: 0})
'quantityPackable2'.field({numeric: true, decimals: 0})
'quantityPickable'.field({numeric: true})
'quantityAllocatedForPicking'.field({numeric: true})
'quantityMakeable'.field({numeric: true})
'quantityAllocatedForMaking'.field({numeric: true})
'quantityReservedForCustomerOrders'.field({numeric: true})
'lotTracking'.field()
'trackExpiryDates'.field({yesOrNo: true})
'notes'.field()
'useDifferentUOMForPurchasing'.field({yesOrNo: true, caption: 'Use Different Unit of Measure for Purchasing'})
'purchasingUOM'.field({refersTo: 'UOM', caption: 'Purchasing Unit of Measure'})
'quantityPerPurchasingUOM'.field({numeric: true, caption: 'Stocking Quantity per Purchasing Unit'})
//'bundle'.field({refersTo: 'Bundle'})
'image'.field({postImage: true, postImageType: 'full', postIdField: 'product'})
'thumbnailImage'.field({postImage: true, postImageType: 'thumbnail', postIdField: 'product', caption: 'Image'})
'intrastatHSCode'.field()
'shelf'.field()
'nextExpectedDeliveryDate'.field({date: true, allowEmpty: true})
'deepestCategoryName'.field()
'externalQuantityOnHand'.field({numeric: true})
'externalPrice'.field({numeric: true, decimals: 2})
'externalPriceFX'.field({numeric: true, decimals: 2})
'avgAlg'.field({caption: 'Average Costing Algorithm'})
'stockingUOM'.field({refersTo: 'UOM'})
'useMarkupPricing'.field({yesOrNo: true})
'baseMarkupOn'.field()
'markupPercentage'.field({numeric: true, decimals: 2, caption: 'Markup %'})
'retailTaxPct'.field({numeric: true, decimals: 2})
'currentMarkedUpPriceIncTax'.field({numeric: true, decimals: 2, storedCalc: true})
'currentMarkedUpPriceExclTax'.field({numeric: true, decimals: 2, storedCalc: true})

'retailTaxPct'.calculate(inv => {
  
  let slow = async () => {
    return await inv.toRetailTaxPct()
  }

  let res = inv.toRetailTaxPctFast()
  if ( global.fastFail(res) )
    return slow()
  return res
})

'lastPurchaseUnitCostExclTax'.calculate(inv => {

  let getRes = taxPct => {
    let incTax = inv.lastPurchaseUnitCostIncTax
    if ( incTax === global.unknownNumber() )
      return global.unknownNumber()
    return incTax / ( 1 + (taxPct / 100) )
  }

  let slow = async () => {
    let product = await inv.toProduct()
    if ( ! product )
      return getRes(0)
    let taxPct = await product.toTaxPct()
    let res = getRes(taxPct)
    return res
  }

  let product = inv.toProductFast()
  if ( global.fastFail(product) )
    return slow()
  let taxPct = product.toTaxPctFast()
  if ( global.fastFail(taxPct) )
    return slow()
  let res = getRes(taxPct)
  return res
})

'currentMarkedUpPriceExclTax'.calculate(inventory => {
  return inventory.getCurrentMarkedUpPrice({incTax: false})
})

'currentMarkedUpPriceIncTax'.calculate(inventory => {
  let res = inventory.getCurrentMarkedUpPrice({incTax: true})
  return res
})

'Inventory'.method('toLastUnitCostExclTax', function() {
  let res = this.lastPurchaseUnitCostExclTax
  return res
})

'Inventory'.method('getCurrentMarkedUpPrice', function(options) {
  let incTax = options.incTax
  let inventory = this
  let regularPrice = incTax ? inventory.wooCommerceRegularPriceIncTax : inventory.wooCommerceRegularPriceExclTax
  if ( this.useMarkupPricing !== 'Yes' )
    return regularPrice
  let cost = inventory.avgUnitCostExclTax
  if ( inventory.baseMarkupOn === 'Last Cost' ) 
    cost = inventory.toLastUnitCostExclTax()
  if ( cost === global.unknownNumber() )
    cost = 0
  let priceExclTax = cost * (1 + (inventory.markupPercentage / 100))
  let priceIncTax = priceExclTax * (1 + (inventory.retailTaxPct / 100))
  let res = incTax ? priceIncTax : priceExclTax
  let wcRegularPriceIncludesTax = (inventory.wooCommerceRegularPriceIncTax === inventory.wooCommerceRegularPrice)
  if ( incTax === wcRegularPriceIncludesTax )
    res = global.roundToNearest(res, 0.05)
  if ( (! res) || (res < regularPrice) )
    res = regularPrice
  return res
})

'baseMarkupOn'.options(['Average Cost', 'Last Cost'])

'baseMarkupOn'.inception('Last Cost')

'markupPercentage'.inception(0)

'Inventory'.method('locationToQuantityOnHand', async function(loc) {
  let cluster = await this.locationNameToCluster(loc.locationName); if ( ! cluster ) return 0
  return cluster.quantityOnHand
})

'Inventory'.method('getDefaultLocationRef', async function() {
  if ( this.defaultLocation )
    return global.copyObj(this.defaultLocation)
  let location = await 'Location'.bringSingle({locationName: 'General'}); if ( ! location ) return
  return location.reference()
})

'avgAlg'.options(['Dynamic Refresh', 'Simple Weighted'])

'avgAlg'.inception(async () => {
  let avgAlg = global.confVal('avgAlg')
  if ( ! avgAlg )
    avgAlg = 'Simple Weighted'
  return avgAlg
})

'Inventory'.method('refreshAvgUnitCost', async function() {

  let avgCost
  let qtyWithKnownCost
  let valueWithKnownCost

  let transactionAffectsAvgCost = (transaction) => {
    if (! ["PO Receipt", "Adjustment", "Value Adjustment", "Made"].contains(transaction.source) ) return false
    if ( transaction.unitCost === global.unknownNumber() ) return false
    if ( (transaction.unitCost === 0) && (transaction.quantity < 0) && (transaction.unitCost === 0) ) return false // workaround for data bug
    return true
  }

  let getStartAvgCost = () => {
    let res = global.unknownNumber()
    transactions.forAll(transaction => {
      if ( ! transactionAffectsAvgCost(transaction) ) return 'continue'
      if ( transaction.unitCost === global.unknownNumber() ) return 'continue'
      res = transaction.unitCost
      return 'break'
    })
    if ( (res === global.unknownNumber()) && (this.lastPurchaseUnitCostIncTax !== 0) )
      res = this.lastPurchaseUnitCostIncTax
    return res
  }

  let sortTransactionsByDate = () => {
    transactions.sort((t1, t2) => {
      let id1 = t1.id
      if ( id1 < 0 )
        id1 = 9999999999999 - id1
      let id2 = t2.id
      if ( id2 < 0 )
        id2 = 9999999999999 - id2
      let t1Str = t1.date + global.padWithZeroes(id1, 20)
      let t2Str = t2.date + global.padWithZeroes(id2, 20)
      return global.sortCompare(t1Str, t2Str)
    })
  }

  let updateAvgCostWithTransaction = transaction => {
    let value = transaction.quantity * transaction.unitCost
    if ( transaction.source === 'Value Adjustment' ) {
      if ( transaction.__ineffectual ) return // ignore the first part of the value adjustment
      // For value adjustments the two quantities cancel each other out, so we keep qtyWithKnownCost
      //qtyWithKnownCost = transaction.quantity 
      if ( qtyWithKnownCost < 0 )
        qtyWithKnownCost = 0
      valueWithKnownCost = qtyWithKnownCost * transaction.unitCost
      avgCost = transaction.unitCost
      return
    }
    if ( ! transactionAffectsAvgCost(transaction) ) {
      if ( avgCost !== global.unknownNumber() )
        value = transaction.quantity * avgCost
    }
    if ( value === global.unknownNumber() )
      return
    qtyWithKnownCost += transaction.quantity
    if ( qtyWithKnownCost === 0 ) {
      valueWithKnownCost = 0
      return
    }
    valueWithKnownCost += value
    avgCost = valueWithKnownCost / qtyWithKnownCost
  }

  let normalizeTransactionOrder = () => {

    let bringNextPositiveTransactionForward = () => {
      let posIdx = -1
      for ( var i = idx + 1; i < transactions.length; i++ ) {
        let tran = transactions[i]
        if ( tran.source === 'Value Adjustment' ) break // Don't bring anything forward in front of a value adjustment
        if ( tran.quantity < 0 ) continue
        posIdx = i
        break
      }
      if ( posIdx < 0 )
        return false
      global.moveArrayElement(transactions, posIdx, idx)
      return true
    }

    let qoh = 0
    let idx = 0
    while ( true ) {
      if ( idx >= transactions.length )
        break
      let transaction = transactions[idx]
      if ( transaction.source === 'Value Adjustment' ) {
        if ( ! transaction.__ineffectual ) {
          if ( qoh < 0 )
            qoh = 0 // Mirror behaviour of updateAvgCostWithTransaction
        }
        idx++
        continue
      }
      qoh += transaction.quantity
      if ( (transaction.quantity < 0) && (qoh < 0) && (transaction.source !== 'Value Adjustment') ) {
        let broughtPosFwd = bringNextPositiveTransactionForward()
        if ( broughtPosFwd ) {
          qoh -= transaction.quantity
          continue
        }
      }
      idx++
    }
  }

  let tagIneffectualVAs = () => {
    let vaRefs = {}
    for ( var i = 0; i < transactions.length; i++ ) {
      let transaction = transactions[i]
      transaction.__ineffectual = false
      if ( transaction.source !== 'Value Adjustment' ) continue
      if ( ! vaRefs[transaction.reference] ) {
        transaction.__ineffectual = true
        vaRefs[transaction.reference] = true
      }
    }
  }

  let initKnownCost = () => {
    qtyWithKnownCost = 0
    valueWithKnownCost = 0
    if ( avgCost === global.unknownNumber() ) return
    let tranQty = 0
    for ( var i = 0; i < transactions.length; i++ ) {
      let transaction = transactions[i]
      tranQty += transaction.quantity
    }
    if ( this.quantityOnHand === tranQty ) return
    qtyWithKnownCost = this.quantityOnHand - tranQty
    valueWithKnownCost = qtyWithKnownCost * avgCost
  }

  let thisRef = {id: this.id, datatype: 'Inventory'}
  let transactions = await 'Transaction'.bring({inventory: thisRef}, {caching: 'subset'})
  if ( transactions.length === 0 )
    return false
  sortTransactionsByDate()
  tagIneffectualVAs()
  normalizeTransactionOrder()
  avgCost = getStartAvgCost()
  if ( avgCost === global.unknownNumber() ) {
    this.avgUnitCost = avgCost
    return
  }
  initKnownCost()
  let updCostHist = (global.confVal('updCostHist') === 'Yes')
  
  transactions.forAll(transaction => {
    updateAvgCostWithTransaction(transaction)
    if ( updCostHist && ! ["PO Receipt", "Adjustment", "Value Adjustment", "Made"].contains(transaction.source) )
      transaction.unitCost = avgCost
  })
  this.needsRecalc()
  if ( avgCost === global.unknownNumber() )
    return false
  this.avgUnitCost = avgCost
  return true
})



'Inventory'.method('refreshExternals', async function() {
  this.externalQuantityOnHand = 0
  this.externalPrice = 0
  this.externalPriceFX = 0
  let firstAvenue
  let mainAvenue
  let avenues = await 'Avenue'.bringChildrenOf(this)
  for ( var i = 0; i < avenues.length; i++ ) {
    let avenue = avenues[i]
    this.externalQuantityOnHand += avenue.externalQuantityOnHand
    if ( i === 0 )
      firstAvenue = avenue
    if ( avenue.isMain === 'Yes' ) 
      mainAvenue = avenue
  }
  if ( ! mainAvenue )
    mainAvenue = firstAvenue
  if ( mainAvenue ) {
    this.externalPrice = mainAvenue.externalPrice
    this.externalPriceFX = mainAvenue.externalPriceFX
  }
})

'deepestCategoryName'.calculate(async inventory => {

  let clean = str => {
    return (str + '').replace('&amp;', '&')
  }

  let slow = async () => {
    let product = await inventory.toProduct(); if ( ! product ) return ''
    let category = await product.toDeepestCategory(); if ( ! category ) return ''
    return clean(category.categoryName)
  }

  let product = inventory.toProductFast()
  if ( global.fastFail(product) )
    return slow()
  let category = product.toDeepestCategoryFast()
  if ( global.fastFail(category) )
    return slow()
  return clean(category.categoryName)
})

'wooCommerceRegularPriceIncTax'.calculate(inv => {
  let getRes = (sess, taxPct)  => {
    let res = inv.wooCommerceRegularPrice;
    if ( ! sess ) return res
    if ( sess.wcPricesIncludeTax === 'yes' ) return res
    res = res * (1 + (taxPct / 100))
    return res
  }

  let slow = async () => {
    let sess = await 'session'.bringSingle() 
    let taxPct = await inv.toRetailTaxPct()
    return getRes(sess, taxPct)
  }

  let sess = 'session'.bringSingleFast() 
  if ( global.fastFail(sess) ) 
    return slow()
  let taxPct = inv.toRetailTaxPctFast()
  if ( taxPct === 'na' )
    return slow()
  return getRes(sess, taxPct)
})

'wooCommerceRegularPriceExclTax'.calculate(inv => {
  let getRes = (sess, taxPct)  => {
    let res = inv.wooCommerceRegularPrice;
    if ( ! sess ) return res
    if ( sess.wcPricesIncludeTax !== 'yes' ) return res
    res = res / (1 + (taxPct / 100))
    return res
  }

  let slow = async () => {
    let sess = await 'session'.bringSingle()
    let taxPct = await inv.toRetailTaxPct()
    return getRes(sess, taxPct)
  }

  let sess = 'session'.bringSingleFast()
  if ( global.fastFail(sess) )
    return slow()
  let taxPct = inv.toRetailTaxPctFast()
  if ( taxPct === 'na' )
    return slow()
  return getRes(sess, taxPct)
})

'Inventory'.method('toRetailTaxPct', async function() {
  let product = this.toProductFast()
  if ( ! product )
    product = await this.toProduct();  
  if ( ! product ) return 0
  return await product.toRetailTaxPct()
})

'Inventory'.method('toRetailTaxPctFast', function() {
  let product = this.toProductFast()
  if ( global.fastFail(product) ) 
    return 'na'
  return product.toRetailTaxPctFast()
})


/*
'wooCommerceRegularPriceIncTax'.calculate(async inv => {
  let product = inv.toProductFast()
  if ( ! product )
    product = await inv.toProduct();
  if ( ! product ) return 0
  let res = await product.toRegularPriceIncTax()
  return res
})

'wooCommerceRegularPriceExclTax'.calculate(async inv => {
  let product = inv.toProductFast()
  if ( ! product )
    product = await inv.toProduct();
  if ( ! product ) return 0
  return await product.toRegularPriceExclTax()
})
*/

'Inventory'.method('refreshLastPurchase', async function() {
  let product = await this.toProduct(); if ( ! product ) return 
  let lines = await 'POLine'.bring({product: product})
  this.lastPurchaseUnitCostIncTax = 0
  this.lastPurchaseDate = global.emptyYMD()
  for ( var i = 0; i < lines.length; i++ ) {
    let line = lines[i]
    let orderDate = await line.toOrderDate()
    if ( orderDate < this.lastPurchaseDate ) continue
    this.lastPurchaseUnitCostIncTax = line.unitCostIncTax
    this.lastPurchaseDate = orderDate
  }
})

'Inventory'.method('refreshNextExpectedDeliveryDate', async function() {
  let product = await this.toProduct(); if ( ! product ) return global.emptyYMD()
  let lines = await 'POLine'.bring({product: product})
  this.nextExpectedDeliveryDate = global.emptyYMD()
  for ( var i = 0; i < lines.length; i++ ) {
    let line = lines[i]
    let outstanding = (line.quantity - line.receivedQuantity - line.cancelledQuantity)
    if ( outstanding <= 0 ) continue
    let expectedDeliveryDate = await line.toExpectedDeliveryDate()
    if ( expectedDeliveryDate.isEmptyYMD() ) continue
    if ( this.nextExpectedDeliveryDate !== global.emptyYMD() ) {
      if ( expectedDeliveryDate >= this.nextExpectedDeliveryDate ) continue
    }
    this.nextExpectedDeliveryDate = expectedDeliveryDate
  }
})

'Inventory'.method('refreshLastReceivedDate', async function() {
  let product = await this.toProduct()
  let lines = await 'POReceiptLine'.bring({product: product})
  this.lastReceivedDate = global.emptyYMD()
  for ( var i = 0; i < lines.length; i++ ) {
    let line = lines[i]
    if ( line.receivedQuantity <= 0 ) continue
    let receivedDate = await line.toReceivedDate()
    if ( receivedDate <= this.lastReceivedDate ) continue
    this.lastReceivedDate = receivedDate
  }
})

'Inventory'.method('hasSupplier', async function(supplier) {
  if ( ! supplier ) return true
  let avenues = this.toAvenuesFast()
  if ( ! avenues )
    avenues = await 'Avenue'.bringChildrenOf(this)
  for ( var i = 0; i < avenues.length; i++ ) {
    let avenue = avenues[i]
    let avSuppRef = avenue.supplier; if ( ! avSuppRef ) continue
    if ( avSuppRef.id === supplier.id ) 
      return true
  }
  return false
})

'quantityPerPurchasingUOM'.inception(1)

'Inventory'.method('lotNumberToQuantityOnHand', async function(lotNumber) {
  let clumps = await 'Clump'.bring({inventory: this})
  let res = 0
  for ( var i = 0; i < clumps.length; i++ ) {
    let clump = clumps[i]
    let clumpLotNumber = await clump.toLotNumber()
    if ( clumpLotNumber !== lotNumber ) continue
    res += clump.quantityOnHand
  }
  return res
})

'Inventory'.method('removeDuplicateClusters', async function() {
  let clusters = await this.toClusters()
  let clustersToTrash = []
  for ( var i = 0; i < clusters.length; i++ ) {
    let cluster = clusters[i]
    if ( ! cluster.location ) {
      clustersToTrash.push(cluster)
      continue
    }
    for ( var j = 0; j < clusters.length; j++ ) {
      let cluster2 = clusters[j]
      if ( cluster2 === cluster ) continue
      if ( ! cluster2.location ) {
        clustersToTrash.push(cluster2)
        continue
      }
      if ( cluster2.location.id === cluster.location.id ) {
        clustersToTrash.push(cluster2)
        continue
      }
    }
  }
  for ( var k = 0; k < clustersToTrash.length; k++ ) {
    let clusterToTrash = clustersToTrash[k]
    await clusterToTrash.trash()
  }
})

'quantityPackable'.calculate(inv => {
  let res = inv.quantityPickable + inv.quantityMakeable
  return res
})

'quantityPackable2'.calculate(inv => {
  let res = inv.quantityPickable - inv.quantityAllocatedForPicking + inv.quantityMakeable - inv.quantityAllocatedForMaking
  return res
})

'Inventory'.method('toClusters', async function() {
  
  let slow = async () => {
    let res = await 'Cluster'.bring({inventory: this})
    return res
  }

  let res = 'Cluster'.bringFast({inventory: this})
  if ( global.fastFail(res) )
    return slow()
  return res
})

'Inventory'.method('toClustersFast', function() {
  return 'Cluster'.bringFast({inventory: this})
})

'Inventory'.method('refreshQuantityReservedForCustomerOrders', async function(opt) {
  let refreshClusters = opt && opt.refreshClusters
  let clusters = await this.toClusters()
  this.quantityReservedForCustomerOrders = 0
  for ( var i = 0; i < clusters.length; i++ ) {
    let cluster = clusters[i]; if ( ! cluster ) continue
    if ( refreshClusters ) {
      if ( ! opt )
        opt = {}
      opt.skipInventory = true
      await cluster.refreshQuantityReservedForCustomerOrders(opt)
    }
    this.quantityReservedForCustomerOrders += cluster.quantityReservedForCustomerOrders
  }
  this.needsRecalc()
})

'Inventory'.method('refreshQuantityAllocated', async function(opt) {
  if ( global._deferRefreshAllocated ) {
    global._inventoriesToRefresh[this.id] = this
    return
  }
  let refreshClusters = opt && opt.refreshClusters
  let clusters = this.toClustersFast()
  if ( global.fastFail(clusters) )
    clusters = await this.toClusters()
  this.quantityAllocatedForPicking = 0
  this.quantityAllocatedForMaking = 0
  for ( var i = 0; i < clusters.length; i++ ) {
    let cluster = clusters[i]
    if ( refreshClusters ) {
      if ( ! opt )
        opt = {}
      opt.skipInventory = true
      await cluster.refreshQuantityAllocated(opt)
    }
    this.quantityAllocatedForPicking += cluster.quantityAllocatedForPicking
    this.quantityAllocatedForMaking += cluster.quantityAllocatedForMaking
  }
  this.needsRecalc()
})

'Inventory'.method('toClustersFast', function() {
  let mold = global.foreman.doNameToMold('Cluster')
  if ( ! mold.canAlwaysDoFastRetrieve() )
    return null
  return mold.fastRetrieve({parentId: this.id});
})

'Inventory'.method('refreshQuantityPickableFast', function() {
  let clusters = this.toClustersFast(); if ( ! clusters ) return 'na'
  this.quantityPickable = 0
  for ( var i = 0; i < clusters.length; i++ ) {
    let cluster = clusters[i]
    this.quantityPickable += cluster.quantityPickable
  }
})

'Inventory'.method('refreshQuantityPickable', async function(opt) {
  let refreshClusters = opt && opt.refreshClusters
  let clusters = await this.toClusters()
  this.quantityPickable = 0
  for ( var i = 0; i < clusters.length; i++ ) {
    let cluster = clusters[i]
    if ( refreshClusters ) {
      await cluster.refreshQuantityPickable({skipInventory: true})
    }
    this.quantityPickable += cluster.quantityPickable
  }
  this.needsRecalc()
})

'Inventory'.method('refreshQuantityMakeable', async function(opt) {
  let refreshClusters = opt && opt.refreshClusters
  let clusters = await this.toClusters()
  this.quantityMakeable = 0
  for ( var i = 0; i < clusters.length; i++ ) {
    let cluster = clusters[i]
    if ( refreshClusters )
      await cluster.refreshQuantityMakeable({skipInventory: true})
    this.quantityMakeable += cluster.quantityMakeable
  }
})

'Inventory'.method('getDefaultPurchaseUnitCostIncTax', async function() {
  let res = this.lastPurchaseUnitCostIncTax
  if ( (res !== 0) && (res !== global.unknownNumber()) )
    return res
  res = this.avgUnitCost
  if ( res === global.unknownNumber() )
    return 0
  return res
})

'Inventory'.method('getDefaultPurchaseUnitCostExclTax', async function() {
  let incTax = await this.getDefaultPurchaseUnitCostIncTax()
  let product = this.toProductFast()
  if ( ! product )
    product = await this.toProduct();  
  if ( ! product ) return 0
  let taxPct = await product.toTaxPct()
  let res = incTax / ( 1 + (taxPct / 100) )
  return res
})

'situation'.options(['Active', 'Discontinued by Us', 'Discontinued by Supplier'])

'situation'.inception('Active')

'Inventory'.method('refreshSalesUnits', async function() {
  let config = await 'Configuration'.bringFirst();
  let priorWeekCount = await config.getSalesProjectionPriorWeeks()
  let priorWeekSACount = await config.getSalesAnalysisPriorWeeks()
  //let semiRecentPriorWeekCount = Math.floor(priorWeekCount / 2)
  //let recentPriorWeekCount = Math.floor(semiRecentPriorWeekCount / 2)
  let orderItems = await 'order_items.RecentOrActive'.bring({_product_id: this.product_id}, {useIndexedField: '_product_id'})
  let varOrderItems = await 'order_items.RecentOrActive'.bring({_variation_id: this.product_id}, {useIndexedField: '_variation_id'})
  orderItems.appendArray(varOrderItems)
  let salesFromDate = global.todayYMD().incDays((- priorWeekCount) * 7)
  let salesSAFromDate = global.todayYMD().incDays((- priorWeekSACount) * 7)
  //let semiRecentSalesFromDate = global.todayYMD().incDays((- semiRecentPriorWeekCount) * 7)
  //let recentSalesFromDate = global.todayYMD().incDays((- recentPriorWeekCount) * 7)
  this.priorWeeksSalesUnits = 0
  this.priorWeeksSalesValue = 0
  this.priorWeeksSASalesUnits = 0
  this.priorWeeksSASalesValue = 0
  //this.priorSemiRecentWeeksSalesUnits = 0
  //this.priorRecentWeeksSalesUnits = 0
  this.totalSalesUnits = 0
  this.lastSaleDate = global.emptyYMD()
  if ( ! this.product_id ) return
  for ( var i = 0; i < orderItems.length; i++ ) {
    let orderItem = orderItems[i]
    let productId = orderItem.get_resolved_product_id(); if ( ! productId ) continue
    if ( productId !== this.product_id ) continue // workaround for sporadic bug where all orderItems are somehow included for some products
    let status = orderItem.order_status
    if ( (status === "wc-cancelled") || (status === "wc-refunded") )
      continue
    let orderDate = orderItem.order_date
    let orderQty = orderItem._qty
    if ( orderDate > this.lastSaleDate )
      this.lastSaleDate = orderDate
    this.totalSalesUnits += orderQty
    if ( orderDate >= salesFromDate ) {
      this.priorWeeksSalesUnits += orderQty
      this.priorWeeksSalesValue += orderItem.valueIncTax
    }
    if ( orderDate >= salesSAFromDate ) {
      this.priorWeeksSASalesUnits += orderQty
      this.priorWeeksSASalesValue += orderItem.valueIncTax
    }
    //if ( orderDate >= semiRecentSalesFromDate ) 
      //this.priorSemiRecentWeeksSalesUnits += orderQty
    //if ( orderDate >= recentSalesFromDate ) 
      //this.priorRecentWeeksSalesUnits += orderQty
  }
})


'mainSupplier'.calculate(async inv => {
  let avenue = inv.toMainAvenueFast()
  if ( avenue === "na" )
    avenue = await inv.toMainAvenue()
  if ( ! avenue ) return null
  return avenue.supplier
})

'barcode'.calculate(async inv => {
  let avenue = inv.toMainAvenueFast()
  if ( avenue === "na" )
    avenue = await inv.toMainAvenue()
  if ( ! avenue ) return null
  return avenue.barcode
})

'Inventory'.method('toPOReceiptLine', async function() {
  let lines = await 'POReceiptLine'.bring({product: this.product})
  return lines.last()
})

'Inventory'.method('matchesBarcode', async function(barcode) {
  let barcodeUC = barcode.toUpperCase()
  if ( this.sku && (this.sku.toUpperCase() === barcodeUC) )
    return true
  let avenues = this.toAvenuesFast()
  if ( ! avenues )
    avenues = await 'Avenue'.bringChildrenOf(this)
  for ( var i = 0; i < avenues.length; i++ ) {
    let avenue = avenues[i]
    if ( avenue.barcode && (avenue.barcode.toUpperCase() === barcodeUC) )
      return true
    if ( avenue.sku && (avenue.sku.toUpperCase() === barcodeUC) )
      return true
  }
  return false
})

'Inventory'.method('setBarcode', async function(barcode) {
  let av = await this.toMainAvenue(); if ( ! av ) return
  av.barcode = barcode
})

'supplierSku'.afterUserChange(async (oldInputValue, newInputValue, inv) => {
  let avenue = await inv.toMainAvenue()
  if ( avenue ) {
    avenue.sku = newInputValue
  }
})

'supplierSku'.calculateWhen(async inv => {
  let slow = async () => {
    let avenue = await inv.toMainAvenue()
    return avenue ? true : false
  }

  let avenue = inv.toMainAvenueFast()
  if ( avenue === "na" )
    return slow()
  return avenue ? true : false
})

'supplierSku'.calculate(inv => {
  let slow = async () => {
    let avenue = await inv.toMainAvenue()
    return avenue ? avenue.sku : ''
  }

  let avenue = inv.toMainAvenueFast()
  if ( avenue === "na" )
    return slow()
  return avenue ? avenue.sku : ''
})

'recommendedRetailPriceIncTax'.calculate(inv => {

  let slow = async () => {
    let avenue = await inv.toMainAvenue()
    return avenue ? avenue.recommendedRetailPriceIncTax : 0
  }

  let avenue = inv.toMainAvenueFast()
  if ( avenue === "na" )
    return slow()
  return avenue ? avenue.recommendedRetailPriceIncTax : 0
})

'Inventory'.method('toDeliveryLeadDays', async function() {
  let supp = await this.toMainSupplier(); if ( ! supp ) return 0
  return supp.deliveryLeadDays
})

'Inventory'.method('toMainSupplier', async function() {
  let suppRef = await this.toMainSupplierRef(); if ( ! suppRef ) return 0
  let supp = await 'Supplier'.bringSingle({id: suppRef.id})
  return supp
})

'Inventory'.method('toMainAvenueFast', function() {
  let avenues = this.toAvenuesFast()
  if ( ! avenues )
    return "na"
  let avenue = avenues.filterSingle(a => a.isMain === 'Yes');
  return avenue
})

'Inventory'.method('toMainAvenue', async function() {
  let avenues = this.toAvenuesFast()
  if ( ! avenues )
    avenues = await 'Avenue'.bringChildrenOf(this)
  let avenue = avenues.filterSingle(a => a.isMain === 'Yes');
  return avenue
})

'Inventory'.method('toMainSupplierRef', async function() {
  let avenues = this.toAvenuesFast()
  if ( ! avenues )
    avenues = await 'Avenue'.bringChildrenOf(this)
  let avenue = avenues.filterSingle(a => a.isMain === 'Yes'); if ( ! avenue ) return null
  return avenue.supplier
})

'Inventory'.method('supplierRefToSKU', async function(aSuppRef) {
  let sku = '' //this.sku
  let avenue = await this.supplierRefToAvenue(aSuppRef)
  if ( avenue ) 
    sku = avenue.sku ? avenue.sku : sku
  return sku
})

'Inventory'.method('supplierRefToSKUFast', function(aSuppRef) {
  let sku = ''
  let avenue = this.supplierRefToAvenueFast(aSuppRef)
  if ( avenue === 'na' )
    return 'na'
  if ( avenue ) 
    sku = avenue.sku ? avenue.sku : sku
  return sku
})

'Inventory'.method('supplierRefToProductNameAndSKU', async function(aSuppRef) {
  let name = this.productName
  let sku = this.sku
  let avenue = await this.supplierRefToAvenue(aSuppRef)
  if ( avenue ) {
    name = avenue.productName ? avenue.productName : name
    sku = avenue.sku ? avenue.sku : sku
  }
  let res = name
  if ( sku )
    res += " (" + sku + ")"
  return res
})

'Inventory'.method('supplierRefToAvenue', async function(aSuppRef) {
  if ( ! aSuppRef ) return null

  let avenues = this.toAvenuesFast()
  if ( (! avenues) || (avenues === 'na') ) {
    avenues = await 'Avenue'.bringChildrenOf(this)
  }
  let res = avenues.filterSingle(a => a.supplier && (a.supplier.id === aSuppRef.id))
  return res
})

'Inventory'.method('supplierRefToAvenueFast', function(aSuppRef) {
  if ( ! aSuppRef ) return null

  let avenues = this.toAvenuesFast()
  if ( ! avenues ) return null
  let res = avenues.filterSingle(a => a.supplier && (a.supplier.id === aSuppRef.id))
  return res
})

'Inventory'.method('toAvenue', async function(aSupplier) {
  if ( ! aSupplier ) return null
  let avenues = this.toAvenuesFast()
  if ( ! avenues )
    avenues = await 'Avenue'.bringChildrenOf(this)
  let res = avenues.filterSingle(a => a.supplier.id === aSupplier.id)
  return res
})

'Inventory'.method('getOrCreateAvenue', async function(aSupplier) {
  if ( ! aSupplier ) return null
  let avenues = this.toAvenuesFast()
  if ( ! avenues )
    avenues = await 'Avenue'.bringChildrenOf(this)
  let res = avenues.filterSingle(a => a.supplier.id === aSupplier.id)
  if ( res )
    return res
  res = await 'Avenue'.create(null, {inventory: this.reference()})
  res.supplier = aSupplier.reference()
  res.productName = this.productName
  res.sku = this.sku
  return res
})

'Inventory'.method('toAvenuesFast', function () {
  let mold = global.foreman.doNameToMold('Avenue')
  if ( ! mold.canAlwaysDoFastRetrieve() )
    return null
  return mold.fastRetrieve({parentId: this.id});
})

'Inventory'.method('toProductFast', function () {
  let mold = global.foreman.doNameToMold('products')
  if ( ! mold.canAlwaysDoFastRetrieve() )
    return null
  let ps
  if ( ! this.product )
    return null
  if ( this.product.id )
    ps = mold.fastRetrieve({id: this.product.id});
  else
    ps = mold.fastRetrieve({uniqueName: this.product.keyval});
  return ps.first()
})

'Inventory'.afterRetrievingFast(function() {
  if ( this.fieldValuePendingSave("wooCommerceRegularPrice") ) return
  let product = this.toProductFast()
  if ( ! product ) 
    return false
  this.wooCommerceRegularPrice = product._regular_price
  return true
})

'Inventory'.afterRetrieving(async function() {
  if ( this.fieldValuePendingSave("wooCommerceRegularPrice") ) return
  this.wooCommerceRegularPrice = 0
  let product = this.toProductFast()
  if ( ! product ) {
    product = await this.toProduct() 
  }
  if ( ! product ) return
  this.wooCommerceRegularPrice = product._regular_price
})

'Inventory'.afterCreating(async function () {
  this.avgUnitCost = global.unknownNumber()
  let product = this.toProductFast()
  if ( ! product )
    product = await this.toProduct() 
  if ( ! product ) return
  this.minQuantity = product._low_stock_amount
  this.wooCommerceRegularPrice = product._regular_price
})

'Inventory'.beforeSaving(async function() {

  let generateEvaluationNumber = async () => {
    let res
    while ( true ) {
      let nextNo = await 'NextNumber'.bringOrCreate({forDatatype: 'Evaluation'})
      nextNo.number = nextNo.number + 1
      let noStr = nextNo.number + ""
      res = "VA" + noStr.padStart(5, '0')
      let ev = await 'Evaluation'.bringFirst({evaluationNumber: res})
      if ( ! ev )
        break
    }
    return res
  }

  let createEvaluation = async (aNewCost) => {
    let no = await generateEvaluationNumber()
    let ev = await 'Evaluation'.bringOrCreate({evaluationNumber: no})
    ev.date = global.todayYMD()
    ev.product = product.reference()
    ev.avgUnitCost = aNewCost
  }

  let maybeUpdateProductMarkedUpPrice = async product => {
    let sess = await 'session'.bringSingle(); if ( ! sess ) return
    let incTax = sess.wcPricesIncludeTax === 'yes'
    let prop = incTax ? 'currentMarkedUpPriceIncTax' : 'currentMarkedUpPriceExclTax'
    if ( ! this.propChanged(prop) )
      return
    product.marked_up_price = this[prop]
  }

  if ( this._markedForDeletion )
    return
  if ( (this.useDifferentUOMForPurchasing === 'Yes') && (! this.quantityPerPurchasingUOM) )
    throw(new Error('Quantity per purchasing unit cannot be zero'))
  let product = this.toProductFast()
  if ( ! product )
    product = await this.toProduct() 
  if ( ! product ) return
  await maybeUpdateProductMarkedUpPrice(product)
  if ( this.minQuantity !== this.getOld().minQuantity ) {
    if ( ! product.isVariation() )
      product._low_stock_amount = this.minQuantity
  }
  if ( (this.wooCommerceRegularPrice !== this.getOld().wooCommerceRegularPrice) && (this.wooCommerceRegularPrice !== 0) ) {
    product._regular_price = this.wooCommerceRegularPrice
  }
  if ( (this.avgUnitCost === 0) || (this.avgUnitCost === global.unknownNumber()) ) {
    if ( (this.lastPurchaseUnitCostIncTax !== 0) && (this.lastPurchaseUnitCostIncTax !== global.unknownNumber()) ) {
      if ( (this.avgAlg !== 'Dynamic Refresh') || (this.avgUnitCost === global.unknownNumber()) )
        this.avgUnitCost = this.lastPurchaseUnitCostIncTax
    }
  }
  if ( (! this.lotTracking) || (this.lotTracking === 'None') ) {
    if ( await this.hasLots() )
      throw(new Error('This product has lot/serial numbers - cannot turn off lot tracking'))
  }
  if ( (this.avgUnitCost !== global.unknownNumber()) &&
    (this.avgAlg === 'Dynamic Refresh') && this.propChanged('avgUnitCost') ) { // may have been changed directly
    let newAvg = this.avgUnitCost
    await this.refreshAvgUnitCost()
    if ( newAvg !== this.avgUnitCost ) {
      await createEvaluation(newAvg)
    }
  }
})


'Inventory'.method('hasLots', async function() {
  let product = await this.toProduct(); if ( ! product ) return false
  let lots = await 'Lot'.bring({product: product})
  return lots.length > 0
})

'sku'.calculate(inventory => {
  let slow = async () => {
    product = await inventory.toProduct() 
    if ( ! product ) return inventory.sku
    return product._sku
  }

  let product = inventory.toProductFast()
  if ( global.fastFail(product) )
    return slow()
  return product._sku
})

'sku'.afterUserChange(async (oldInputValue, newInputValue, inv) => {
  let product = await inv.toProduct(); if ( ! product ) return
  product._sku = newInputValue
})

'marginPct'.calculate(function(inventory) {
  let avgUnitCost = inventory.avgUnitCostExclTax; if ( avgUnitCost === global.unknownNumber() ) return 0
  let regularPrice = inventory.wooCommerceRegularPriceExclTax; 
  if ( ! regularPrice ) return 0
  let marginValue = regularPrice - avgUnitCost
  let res = (marginValue / regularPrice) * 100
  return res
})

'productName'.calculate(inventory => {
  let slow = async () => {
    product = await inventory.toProduct() 
    if ( ! product ) return
    return product.uniqueName.stripAfterLast(" (")
  }

  let product = inventory.toProductFast()
  if ( global.fastFail(product) )
    return slow()
  return product.uniqueName.stripAfterLast(" (")
})

'product_id'.calculate(inventory => {
  let slow = async () => {
    product = await inventory.toProduct() 
    if ( ! product ) return
    return product.id
  }

  let product = inventory.toProductFast()
  if ( global.fastFail(product) )
    return slow()
  return product.id
})

'inventoryValueRetail'.calculate(function(inventory) {
  if ( inventory.quantityOnHand === 0 )
    return 0
  return inventory.quantityOnHand * inventory.wooCommerceRegularPrice
})

'Inventory'.method('toProduct', async function() {
  if ( ! this.product )
    return null
  let product = this.toProductFast()
  if ( product )
    return product
  if ( this.product.id ) {
    product = await 'products'.bringSingle({id: this.product.id});
  } else {
    product = await 'products'.bringSingle({uniqueName: this.product.keyval});
  }
  return product
})

'Inventory'.method('syncToProduct', async function (aMorsel) {

  let product
  let allCluster

  let getNonGeneralQty = async () => {
    let res = 0
    let clusters = await 'Cluster'.bring({inventory: this})
    for ( var i = 0; i < clusters.length; i++ ) {
      let c = clusters[i]
      let locName = await c.toLocationName() 
      if ( locName === 'General' ) continue
      res += c.quantityOnHand
    }
    return res
  }

  let ensureGeneralClusterCorrect = async () => {
    let nonGeneralQty = await getNonGeneralQty()
    allCluster.quantityOnHand = this.quantityOnHand - nonGeneralQty
  }
  
  if ( global.inventorySyncOff ) return
  product = await this.toProduct(); if ( ! product ) return
  if ( (! product.isVariation()) || (! this.minQuantity) )
    this.minQuantity = product._low_stock_amount
  let chg = product._stock - this.quantityOnHand
  await this.removeDuplicateClusters()
  if ( chg === 0 ) {
    allCluster = await this.locationNameToCluster('General')
    await ensureGeneralClusterCorrect()
    await this.refreshQuantityPickable()
    return
  }
  let tran = await 'Transaction'.create()
  tran.product = this.product
  tran.date = global.todayYMD()
  tran.quantity = chg
  tran.unitCost = this.quantityOnHand > 0 ? this.avgUnitCost : global.unknownNumber()
  tran.source = 'Sync to WC'
  tran.inventory = this.reference()
  let morselId = aMorsel ? aMorsel.id : ''
  tran.auditInfo = morselId + ', ' + global.foreman.uuid() + ', ' + (new Date()).toLocaleTimeString()
  allCluster = await this.locationNameToCluster('General')
  let sess = await 'session'.bringSingle()
  tran.userLogin = sess.user
  if ( aMorsel ) {
    tran.userLogin = aMorsel.user_login
    tran.createdDate = aMorsel.toDate()
    tran.createdTime = aMorsel.toHMS()
  }
  this.quantityOnHand += chg
  await global.app.stockClue({point: 8, cast: this, fieldName: 'quantityOnHand', reference: morselId})
  if ( allCluster ) {
    tran.cluster = allCluster.reference()
    tran.location = allCluster.location
    allCluster.quantityOnHand += chg
  }
  if ( aMorsel ) {
    tran.notes = 'Manual adjustment'
    tran.userLogin = aMorsel.user_login
  }
  await ensureGeneralClusterCorrect()
  await this.refreshQuantityPickable()
})

'Inventory'.method('toGeneralCluster', async function() {
  return await this.locationNameToCluster('General')
})

'Inventory'.method('locationNameToCluster', async function(aLocName, aOptions) {
  let location = await 'Location'.bringOrCreate({locationName: aLocName}); if ( ! location ) return
  let clusters = await 'Cluster'.bring({inventory: this})
  let res = null
  await clusters.forAllAsync(async c => {
    if ( ! c.location ) return 'continue'
    if ( c.location.id !== location.id ) return 'continue'
    res = c
    return 'break'
  })
  if ( (! res) && aOptions && aOptions.preventCreate )
    return null
  if ( ! res ) {
    res = await 'Cluster'.create(null, {inventory: this, location: location.reference()})
    //res.location = location.reference()
  }
  return res
})

'Inventory'.method('locationNameToClusterFast', function(aLocName, aOptions) {
  let location = 'Location'.bringSingleFast({locationName: aLocName})
  if ( (! location) || (location === 'na') ) 
    return location
  let clusters = 'Cluster'.retrieveFast({inventory: this.reference()})
  if ( (! clusters) || (clusters === 'na') ) 
    return clusters
  let res = null
  for ( var i = 0; i < clusters.length; i++ ) {
    let c = clusters[i]
    if ( ! c.location ) continue
    if ( c.location.id !== location.id ) continue
    res = c
    break
  }
  return res
})

'Inventory'.method('locationRefToCluster', async function(aLocRef, aOptions) {
  let name = 'General'
  if ( aLocRef )
    name = aLocRef.keyval
  return await this.locationNameToCluster(name, aOptions)
})

'Inventory'.method('locationRefToClusterFast', async function(aLocRef, aOptions) {
  let name = 'General'
  if ( aLocRef )
    name = aLocRef.keyval
  return this.locationNameToClusterFast(name, aOptions)
})

'Inventory'.method('locationAndLotRefsToClump', async function(aLocRef, aLotRef, aOptions) {
  let cluster = await this.locationRefToCluster(aLocRef, aOptions); if ( ! cluster ) return null
  let number = 'Unspecified'
  if ( aLotRef && aLotRef.keyval )
    number = aLotRef.keyval
  return await cluster.lotNumberToClump(number, aOptions)
})

'inventoryValue'.calculate(inventory => {
  if ( inventory.avgUnitCost === global.unknownNumber() )
    return global.unknownNumber()
  return inventory.quantityOnHand * inventory.avgUnitCost
})

'inventoryValue2'.calculate(function(inventory) {
  if ( inventory.quantityOnHand === 0 )
    return 0
  return inventory.inventoryValue
})

'inventoryValueExclTax'.calculate(inv => {

  let getRes = taxPct => {
    let incTax = inv.inventoryValue2
    if ( incTax === global.unknownNumber() )
      return global.unknownNumber()
    return incTax / ( 1 + (taxPct / 100) )
  }

  let slow = async () => {
    let product = await inv.toProduct()
    if ( ! product )
      return getRes(0)
    let taxPct = await product.toTaxPct()
    let res = getRes(taxPct)
    return res
  }

  let product = inv.toProductFast()
  if ( global.fastFail(product) )
    return slow()
  let taxPct = product.toTaxPctFast()
  if ( global.fastFail(taxPct) )
    return slow()
  let res = getRes(taxPct)
  return res
})

'priorWeeksSalesValueExclTax'.calculate(inventory => {
  let getRes = taxPct => {
    let incTax = inventory.priorWeeksSalesValue
    if ( incTax === global.unknownNumber() )
      return global.unknownNumber()
    let res = incTax / ( 1 + (taxPct / 100) )
    return res
  }

  let slow = async () => {
    let product = await inventory.toProduct();  
    if ( ! product ) 
      return getRes(0)
    let taxPct = await product.toTaxPct()
    return getRes(taxPct)
  }
  
  let product = inventory.toProductFast()
  if ( global.fastFail(product) )
    return slow()
  let taxPct = product.toTaxPctFast()
  if ( taxPct === 'na' )
    return slow()
  return getRes(taxPct)
})

'priorWeeksSASalesValueExclTax'.calculate(inventory => {
  let getRes = taxPct => {
    let incTax = inventory.priorWeeksSASalesValue
    if ( incTax === global.unknownNumber() )
      return global.unknownNumber()
    let res = incTax / ( 1 + (taxPct / 100) )
    return res
  }

  let slow = async () => {
    let product = await inventory.toProduct();
    if ( ! product )
      return getRes(0)
    let taxPct = await product.toTaxPct()
    return getRes(taxPct)
  }

  let product = inventory.toProductFast()
  if ( global.fastFail(product) )
    return slow()
  let taxPct = product.toTaxPctFast()
  if ( taxPct === 'na' )
    return slow()
  return getRes(taxPct)
})

'avgUnitCostExclTax'.calculate(inv => {

  let getRes = taxPct => {
    let incTax = inv.avgUnitCost
    if ( incTax === global.unknownNumber() )
      return global.unknownNumber()
    return incTax / ( 1 + (taxPct / 100) )
  }

  let slow = async () => {
    let product = await inv.toProduct()
    if ( ! product )
      return getRes(0)
    let taxPct = await product.toTaxPct()
    let res = getRes(taxPct)
    return res
  }

  if ( global.tc ) global.tc('avgUnitCostExclTax 1')
  let product = inv.toProductFast()
  if ( global.fastFail(product) )
    return slow()
  if ( global.tc ) global.tc('avgUnitCostExclTax 2')
  let taxPct = product.toTaxPctFast()
  if ( global.tc ) global.tc('avgUnitCostExclTax 3')
  if ( global.fastFail(taxPct) )
    return slow()
  if ( global.tc ) global.tc('avgUnitCostExclTax 4')
  let res = getRes(taxPct)
  if ( global.tc ) global.tc('avgUnitCostExclTax 5')
  return res
})

'avgUnitCostExclTax'.afterUserChange(async (oldInputValue, newInputValue, inv) => {
  let exTax = inv.avgUnitCostExclTax
  if ( exTax === global.unknownNumber() ) return
  let product = inv.toProductFast()
  if ( ! product )
    product = await inv.toProduct();  
  if ( ! product ) return
  let taxPct = await product.toTaxPct()
  inv.avgUnitCost = global.roundToXDecimals(exTax * ( 1 + (taxPct / 100) ), 6)
})

'inventoryValueExclConsignment'.calculate(function(inventory) {
  if ( inventory.consignment === "Yes" )
    return 0
  return inventory.inventoryValue2
})

'inventoryValueExclConsignmentExclTax'.calculate(function(inventory) {
  if ( inventory.consignment === "Yes" )
    return 0
  return inventory.inventoryValueExclTax
})

'Inventory'.method('refreshQuantityOnPurchaseOrders', async function() {
  let inv = this
  let product = inv.product
  let lines = await 'POLine'.bring({product: product})
  lines = lines.filter(line => (! line.lineType) || (line.lineType === "Product"))
  let qty = 0
  await lines.forAllAsync(async poLine => {
    let po = await poLine.toPO(); if ( ! po ) return 'continue'
    let outstanding = (poLine.quantity - poLine.receivedQuantity - poLine.cancelledQuantity)
    if ( (outstanding < 0) && (poLine.quantity > 0) )
      outstanding = 0
    else if ( (outstanding > 0) && (poLine.quantity < 0) )
      outstanding = 0
    if ( outstanding > 0 ) {
      if ( po.stage === 'Draft' )
        outstanding = 0
    }
    qty += outstanding
  })
  inv.quantityOnPurchaseOrders = qty
  this.needsRecalc()
})

'Inventory'.method('setMainSupplier', async function(supplier) {
  let avenue = await this.supplierRefToAvenue(supplier.reference())
  if ( ! avenue ) {
    avenue = await 'Avenue'.create(null, {inventory: this.reference()})
    avenue.supplier = supplier.reference()
    avenue.productName = this.productName
  }
  avenue.isMain = 'Yes' // Note: other isMains are set to No in Avenue.beforeSaving
})

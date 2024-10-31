'products'.datatype({source: 'WC', exportable: true, caption: 'Product'})
'uniqueName'.field({key: true})
'_stock'.field({numeric: true})
'_sku'.field({caption: 'SKU', indexed: true})
'_low_stock_amount'.field({numeric: true, caption: 'Threshold'})
'_tax_status'.field()
'_tax_class'.field()
'_regular_price'.field({numeric: true})
'weight'.field({numeric: true, wcMeta: '_weight'})
'lotsString'.field({wcMeta: '_prfi_lots_string'})
'marked_up_price'.field({numeric: true, decimals: 2, wcMeta: '_prfi_marked_up_price'})

/* DO NOT add calculated fields or afterRetrieving - this will slow down the Inventory page dramatically (see fastRetrieve for why) */

'products'.method('isInDiscount', async function(discount) {
  return await discount.containsProduct(this)
})

'products'.method('toAvgUnitCost', async function() {
  let inv = await this.toInventory(); if ( ! inv ) return global.unknownNumber()
  return inv.avgUnitCost
})

'products'.method('hasStock', async function() {
  return (await this.getQuantityOnHand()) > 0
})

'products'.method('getQuantityOnHand', async function() {
  let inv = await this.toInventory(); if ( ! inv ) return 0
  return inv.quantityOnHand
})

'products'.modifyFields(async function() {

/*
  let processImpost = async impost => {
    let classifiers = await 'Classifier'.bring({impost: impost})
    for ( var i = 0; i < classifiers.length; i++ ) {
      let classifier = classifiers[i]
      let name = classifier.productMetaFieldName
      let f = mold.fields.filterSingle(f => f.name === name)
      if ( ! f ) {
        f = mold.createField(name)
        f.wcMeta = name
        if ( ! mold.realms )
          mold.realms = {}
        f.realm = 'WC Product'
        mold.realms[f.name] = {name: f.realm, wcFieldName: f.wcMeta}
        fieldsAdded = true
      }
    }
  }
*/

  let addLabelFields = async purpose => {
    let template = await 'Template'.bringOrCreate({specification: "LabelsPdf.js", purpose: purpose});
    let facets = await 'Facet'.bring({parentId: template.id})
    await facets.forAllAsync(async (facet) => {
      let source = await facet.referee('source'); if ( ! source ) return "continue"
      let parts = source.description.split(".")
      let realm = parts[0]
      let name = parts[1]
      if ( ! realm.startsWith("WC Product") ) return "continue"
      let f = mold.fields.filterSingle(f => f.name === name)
      if ( ! f ) {
        f = mold.createField(name)
        fieldsAdded = true
      }
      f.englishCaption = facet.englishCaption ? facet.englishCaption : facet.caption
      f.caption = facet.caption //.translate()
      f.realm = realm
      let disposition = await facet.referee('disposition'); if ( ! disposition ) return "continue"
      f.numeric = (disposition.description === "Number")
      f.date = (disposition.description === "Date")
      f.minDecimals = facet.minimumDecimals
      f.maxDecimals = facet.maximumDecimals
    })
  }

  let mold = this
  //let imposts = await 'Impost'.bring()
  let fieldsAdded = false
/*
  for ( var i = 0; i < imposts.length; i++ ) {
    let impost = imposts[i]
    await processImpost(impost)
  }
*/
  await addLabelFields('')
  await addLabelFields('Carton')
  await addLabelFields('Pallet')
  return fieldsAdded
})


'products'.method('refreshLotsString', async function() {
  let lots = await 'Lot'.bring({product: this.reference()})
  this.lotsString = ''
  for ( var i = 0; i < lots.length; i++ ) {
    let lot = lots[i]
    if ( lot.lotNumber === 'Unspecified' ) continue
    this.lotsString = global.appendWithSep(this.lotsString, lot.lotNumber, ',')
  }
})

'products'.method('toRetailPriceExclTax', async function() {
  let inventory = await this.toInventory()
  if ( inventory && (inventory.useMarkupPricing === 'Yes') )
    return inventory.currentMarkedUpPriceExclTax
  return await this.toRegularPriceExclTax()
})

'products'.method('toRetailPriceIncTax', async function() {
  let inventory = await this.toInventory()
  if ( inventory && (inventory.useMarkupPricing === 'Yes') )
    return inventory.currentMarkedUpPriceIncTax
  return await this.toRegularPriceIncTax()
})

'products'.method('toRegularPriceIncTax', async function() {
  let res = this._regular_price;
  let sess = await 'session'.bringSingle(); if ( ! sess ) return res
  if ( sess.wcPricesIncludeTax === 'yes' ) return res
  let taxPct = await this.toRetailTaxPct(); if ( ! taxPct ) return res
  res = res * (1 + 1/(taxPct / 100))
  return res
})

'products'.method('toRegularPriceExclTax', async function() {
  let res = this._regular_price;
  let sess = await 'session'.bringSingle(); if ( ! sess ) return res
  if ( sess.wcPricesIncludeTax !== 'yes' ) return res
  let taxPct = await this.toRetailTaxPct(); if ( ! taxPct ) return res
  res = res / (1 + 1/(taxPct / 100))
  return res
})

'products'.method('toRegularPriceIncTax', async function() {
  let res = this._regular_price;
  let sess = await 'session'.bringSingle(); if ( ! sess ) return res
  if ( sess.wcPricesIncludeTax === 'yes' ) return res
  let taxPct = await this.toRetailTaxPct(); if ( ! taxPct ) return res
  res = res * (1 + 1/(taxPct / 100))
  return res
})

'products'.method('toRetailTaxPct', async function(options) {
  let res = 0
  let countryCode = options && options.countryCode
  let rates = await 'tax_rates'.bring({'tax_rate_class': this._tax_class})
  for ( var i = 0; i < rates.length; i++ ) {
    let rate = rates[i]
    if ( countryCode && (rate.tax_rate_country !== '*') && (countryCode !== rate.tax_rate_country) )
      continue
    if ( countryCode || (rate.tax_rate !== 0) ) {
      res = rate.tax_rate
      break
    }
  }
  return res
})

'products'.method('toRetailTaxPctFast', function(options) {
  let res = 0
  let countryCode = options && options.countryCode
  let rates = 'tax_rates'.bringFast({'tax_rate_class': this._tax_class})
  if ( global.fastFail(rates) ) 
    return 'na'
  for ( var i = 0; i < rates.length; i++ ) {
    let rate = rates[i]
    if ( countryCode && (rate.tax_rate_country !== '*') && (countryCode !== rate.tax_rate_country) )
      continue
    if ( countryCode || (rate.tax_rate !== 0) ) {
      res = rate.tax_rate
      break
    }
  }
  return res
})

'products'.method('toMainSupplier', async function() {
  let inv = await this.toInventory(); if ( ! inv ) return null
  let res = await inv.toMainSupplier()
  return res
})

'products'.method('toBundleTotalCost', async function() {
  let bundle = await this.toBundle(); if ( ! bundle ) return 0
  await bundle.refreshCalculations({force: true, includeDefers: true})
  return bundle.totalCost
})

'products'.method('isContainedWithin', async function(containerProduct) {
  let components = await 'Component'.bring({product: this})
  for ( var i = 0; i < components.length; i++ ) {
    let component = components[i]
    let bundleProduct = await component.toBundleProduct(); if ( ! bundleProduct ) continue
    if ( bundleProduct.id === containerProduct.id )
      return true
    if ( await bundleProduct.isContainedWithin(containerProduct) )
      return true
  }
  return false
})

'products'.method('locationToCluster', async function(location) {
  let inv = await this.toInventory(); if ( ! inv ) return null
  let res = await inv.locationNameToCluster(location.locationName, {preventCreate: true})
  return res
})

'products'.method('locationToQuantityOnHand', async function(location) {
  let cluster = await this.locationToCluster(location); if ( ! cluster ) return 0
  return cluster.quantityOnHand
})

'products'.method('toBundle', async function() {
  let res = await 'Bundle'.bringFirst({product: this})
  return res
})

'products'.method('toTaxPct', async function() {
  if (this._tax_status !== 'taxable' ) 
    return 0
  let zeroTax = await this.hasZeroTaxClass()
  if ( zeroTax )
    return 0
  let config = 'Configuration'.bringSingleFast(); if ( ! config ) return 0
  return config.taxPct
})

'products'.method('toTaxPctFast', function() {
  if (this._tax_status !== 'taxable' ) 
    return 0
  let zeroTax = this.hasZeroTaxClassFast()
  if ( zeroTax === 'na' )
    return 'na'
  let config = 'Configuration'.bringSingleFast(); if ( ! config ) return 0
  return config.taxPct
})

'products'.method('toMainAvenue', async function() {
  let inv = await this.toInventory(); if ( ! inv ) return null
  return inv.toMainAvenue()
})

'products'.method('toPOReceiptLine', async function() {
  let inv = await this.toInventory(); if ( ! inv ) return null
  return await inv.toPOReceiptLine()
})

'products'.method('toFirstCategory', async function() {
  let cats = await this.toCategories()
  if ( cats.length === 0 ) {
    let res = await 'category'.bringFirst({categoryName: "Uncategorised"})
    return res
  }
  return cats[0]
})

'products'.method('toDeepestCategory', async function() {
  let cats = await this.toCategories()
  if ( cats.length === 0 ) {
    let res = await 'category'.bringFirst({categoryName: "Uncategorised"})
    return res
  }
  return cats.last()
})

'products'.method('toDeepestCategoryFast', function() {
  let cats = this.toCategoriesFast()
  if ( global.fastFail(cats) )
    return 'na'
  if ( cats.length === 0 ) {
    let res = 'category'.bringSingleFast({categoryName: "Uncategorised"})
    if ( global.fastFail(res) )
      return 'na'
    return res
  }
  return cats.last()
})

'products'.method('toCategories', async function() {
  let res = []
  let id = this.id
  if ( this.isVariation() )
    id = this.parentId
  let pcs = await 'productCategory'.bring({productId: id})
  for ( var i = 0; i < pcs.length; i++ ) {
    let pc = pcs[i]
    let category = await pc.toCategory()
    res.push(category)
  }
  return res
})

'products'.method('toCategoriesFast', function() {
  let res = []
  let id = this.id
  if ( this.isVariation() )
    id = this.parentId
  let pcs = 'productCategory'.bringFast({productId: id})
  if ( global.fastFail(pcs) )
    return 'na'
  for ( var i = 0; i < pcs.length; i++ ) {
    let pc = pcs[i]
    let category = pc.toCategoryFast()
    if ( global.fastFail(category) )
      return 'na'
    res.push(category)
  }
  return res
})

'products'.method('toName', async function() {
  let res = this.uniqueName.stripAfterLast(" (")
  return res
})

'products'.method('toNameFast', function() {
  let res = this.uniqueName.stripAfterLast(" (")
  return res
})

'products'.method('toInventoryFast', function() {
  return 'Inventory'.bringSingleFast({product: this})
})

'products'.method('toInventory', async function(aOptions) {
  let res
  res = 'Inventory'.bringSingleFast({product: this})
  if ( res && (res !== 'na') )
    return res
  if ( aOptions && aOptions.allowCreate )
    res = await 'Inventory'.bringOrCreate({product: this})
  else {
    res = await 'Inventory'.bringSingle({product: this})
  }
  return res
})

'products'.method('supplierRefToAvenue', async function(aSuppRef) {
  let inv = await this.toInventory(); if ( ! inv ) return null
  return await inv.supplierRefToAvenue(aSuppRef)
})

'products'.method('isVariation', function() {
  return this.parentId ? true : false
})

'products'.method('hasZeroTaxClass', async function() {
  let rates = await 'tax_rates'.bring({'tax_rate_class': this._tax_class}, {forceFast: true})
  if ( rates === 'na' )
    rates = await 'tax_rates'.bring({'tax_rate_class': this._tax_class})
  if ( rates.length === 0 )
    return false
  let res = true
  for ( var i = 0; i < rates.length; i++ ) {
    let rate = rates[i]
    if ( rate.tax_rate !== 0 ) {
      res = false
      break
    }
  }
  return res
})

'products'.method('hasZeroTaxClassFast', async function() {
  let rates = 'tax_rates'.bringFast({'tax_rate_class': this._tax_class})
  if ( rates === 'na' )
    return 'na'
  if ( rates.length === 0 )
    return false
  let res = true
  for ( var i = 0; i < rates.length; i++ ) {
    let rate = rates[i]
    if ( rate.tax_rate !== 0 ) {
      res = false
      break
    }
  }
  return res
})

'products'.method('getEstSalesUnitsPerDay', async function() {
  let inv = await this.toInventory(); if ( ! inv ) return 0
  return inv.estSalesUnitsPerDay
})

'products'.method('createProfitCast', async function(fromDate, toDate, incTax) {
  let prHistCost = (global.confVal('prHistCost') === 'Yes')
  let product = this
  let sales
  let transactions
  let transactionIdx
  let profit
  let avgCost
  let qtyWithKnownCost
  let valueWithKnownCost
  let taxPct = await this.toTaxPct()

  let cookCost = cost => {
    let res = cost
    if ( res === global.unknownNumber() )
      return res
    if ( incTax )
      return res
    if ( taxPct === 0 )
      return res
    res = res / ( 1 + (taxPct / 100) )
    return res
  }

  let transactionAffectsAvgCost = (transaction) => {
    if (! ["PO Receipt", "Adjustment", "Value Adjustment", "Made", "WO Receipt"].contains(transaction.source) ) return false
    if ( transaction.unitCost === global.unknownNumber() ) return false
    return true
  }

  let getSaleDate = (sale) => {
    let res = sale._date_completed
    if ( global.useOrderDateForProfitReporting() ) {
      res = sale.order_date
    } else if ( (! res) || (res === global.emptyYMD()) ) {
      res = sale.order_date
    }
    return res
  }

  let sortSalesByCompletedDate = () => {
    sales.sort((sale1, sale2) => {
      let dt1 = getSaleDate(sale1)
      let dt2 = getSaleDate(sale2)
      return global.sortCompare(dt1, dt2)
    })
  }

  let sortTransactionsByDate = () => {
    transactions.sort((t1, t2) => {
      let t1Str = t1.date + global.padWithZeroes(t1.id, 10)
      let t2Str = t2.date + global.padWithZeroes(t2.id, 10)
      return global.sortCompare(t1Str, t2Str)
    })
  }

  let getStartAvgCost = async () => {
    let res = global.unknownNumber()
    let inv = await this.toInventory()
    if ( inv )
      res = cookCost(inv.avgUnitCost)
    transactions.forAll(transaction => {
      if ( ! transactionAffectsAvgCost(transaction) ) return 'continue'
      if ( transaction.unitCost === global.unknownNumber() ) return 'continue'
      res = cookCost(transaction.unitCost)
      return 'break'
    })
    return res
  }

  let doSale = (sale) => {
    let saleDate
    if ( sale ) {
      if ( (sale.status === "wc-cancelled") || (sale.status === "wc-refunded") ) return
      saleDate = getSaleDate(sale)
    } else {
      saleDate = '2099-01-01'
    }

    let getNextSetOfTransactions = () => {
      let res = []
      while ( true ) {
        if ( transactionIdx >= transactions.length ) break
        let transaction = transactions[transactionIdx]
        if ( transaction.source === "Sale" ) {
          transactionIdx++
          continue
        }
        if ( transaction.date > saleDate ) break
        res.push(transaction)
        transactionIdx++
      }
      return res
    }

    let updateAvgCostWithTransaction = transaction => {
      if ( transaction.value === global.unknownNumber() )
        return
      qtyWithKnownCost += transaction.quantity
      if ( qtyWithKnownCost === 0 ) {
        valueWithKnownCost = 0
        return
      }
      valueWithKnownCost += cookCost(transaction.value)
      avgCost = valueWithKnownCost / qtyWithKnownCost
    }
    
    let saleToTransaction = sale => {
      let orderId = sale.toOrderId() + ''; if ( ! orderId ) return null
      let transactions = 'Transaction'.bringFast({reference: orderId}, {force: true})
      for ( var i = 0; i < transactions.length; i++ ) {
        let transaction = transactions[i]
        if ( transaction.source !== 'Sale' ) continue
        if ( (transaction.product.id !== sale._product_id) && (transaction.product.id !== sale._variation_id) ) continue
        return transaction
      }
      return null
    }

    let updateAvgCostFromHist = () => {
      let transaction = saleToTransaction(sale); if ( ! transaction ) return false
      avgCost = cookCost(transaction.unitCost)
      return true
    }
    
    let updateAvgCost = () => {
      let setOfTransactions = getNextSetOfTransactions()
      setOfTransactions.forAll(transaction => {
        updateAvgCostWithTransaction(transaction)
      })
      if ( prHistCost && sale ) {
        let done = updateAvgCostFromHist()
        if ( ! done ) {
          let transaction = setOfTransactions.last()
          if ( transaction ) {
            avgCost = cookCost(transaction.unitCost)
          }
        }
      }
      if ( sale )
        qtyWithKnownCost -= sale._qty
      if ( avgCost === global.unknownNumber() ) {
        //valueWithKnownCost = global.unknownNumber()
        qtyWithKnownCost = 0
        valueWithKnownCost = 0
        return
      }
      if ( sale )
        valueWithKnownCost -= (sale._qty * avgCost)
    }

    updateAvgCost()
    if ( sale && ((saleDate >= fromDate) && (! (saleDate > toDate))) ) {
      profit.salesValue += sale._line_total
      if ( incTax )
        profit.salesValue += sale._line_tax
      profit.taxValue += sale._line_tax
      profit.salesQuantity += sale._qty
      if ( avgCost === global.unknownNumber() ) {
        profit.costOfGoodsSold = global.unknownNumber()
        profit.grossProfitValue = global.unknownNumber()
        profit.grossProfitPercent = global.unknownNumber()
        return
      }
      if ( profit.costOfGoodsSold === global.unknownNumber() )
        return
      if ( profit.salesValue === global.unknownNumber() )
        return
      if ( profit.grossProfitValue === global.unknownNumber() )
        return
      profit.costOfGoodsSold += (sale._qty * avgCost)
      profit.grossProfitValue = global.roundToXDecimals(profit.salesValue - profit.costOfGoodsSold, 6)
      profit.grossProfitPercent = global.percent(profit.grossProfitValue, profit.salesValue)
    }
  }

  let productIdToSales = async (id) => {
    let res = []
    let inv = product.toInventoryFast()
    if ( ! inv )
      inv = await product.toInventory()
    if ( ! inv ) return res
    let sales = await 'order_items'.bring({_product_id: id}, {useIndexedField: '_product_id'})
    let varSales = await 'order_items'.bring({_variation_id: id}, {useIndexedField: '_variation_id'})
    sales.appendArray(varSales)

    return sales
  }

  sales = await productIdToSales(product.id)
  await sortSalesByCompletedDate()
  transactions = await 'Transaction.Recent'.bring({product: product.reference()})
  await sortTransactionsByDate()
  transactionIdx = 0
  profit = await 'Profit'.create()
  profit.product = product.reference()
  profit.sku = product._sku
  profit.refreshFieldIndexes()
  avgCost = await getStartAvgCost()
  qtyWithKnownCost = 0 // await getStartQuantityOnHand()
  valueWithKnownCost = 0
  sales.forAll(sale => doSale(sale))
  doSale(null)
  if ( profit.salesQuantity ) {
    profit.avgUnitPrice = profit.salesValue / profit.salesQuantity
    let cogs = profit.costOfGoodsSold
    let avg = global.unknownNumber()
    if ( cogs !== global.unknownNumber() )
      avg = cogs / profit.salesQuantity
    profit.avgUnitCost = avg
  }
  profit.finalAvgUnitCost = avgCost
  return profit
})


'ForwardCoverReport'.list()
'Forward Cover Report'.title()
'Back'.action({act: 'cancel'})
'Refresh'.action({act: "refresh"})
'Download to Excel'.action({act: 'excel'})

'ForwardCover'.datatype({transient: true})
'product'.field({refersTo: 'products', key: true, showAsLink: true})
'priorWeeksSales'.field({numeric: true, caption: "Last X Weeks Sales"})
'salesPerDay'.field({numeric: true, decimals: 2})
'bufferDays'.field({numeric: true, decimals: 1})
'targetBufferDays'.field({numeric: true, decimals: 1})
'bufferPctOfTarget'.field({numeric: true, decimals: 0, caption: "Buffer % of Target"})
'available'.field({numeric: true, hidden: true})
'onHand'.field({numeric: true})
'onPurchaseOrders'.field({numeric: true})
'inTransit'.field({numeric: true})
'onSalesOrders'.field({numeric: true})
'supplier'.field({refersTo: 'Supplier', caption: 'Main Supplier', showAsLink: true})
//'deliveryLeadDays'.field({numeric: true, decimals: 0})

'bufferPctOfTarget'.color( (list, forwardCover) => {
  let pct = forwardCover.bufferPctOfTarget
  if ( pct === 99999 ) return null
  if ( pct <= 0 )
    return {bg: 'black', fg: 'white'}
  if ( pct < 33 )
    return {bg: 'red', fg: 'white'}
  if ( pct < 66 )
    return {bg: 'yellow', fg: 'black'}
  if ( pct < 100 )
    return {bg: 'green', fg: 'white'}
  return {bg: 'aqua', fg: 'black'}
})

'priorWeeksSales'.caption(async (list) => {
  let config = await 'Configuration'.bringFirst()
  let priorWeekCount = await config.getSalesProjectionPriorWeeks()
  return "Last".translate() + " " + priorWeekCount + " " + "Weeks Sales".translate()
})

'ForwardCoverReport'.defaultSort({field: "bufferPctOfTarget"})

'ForwardCoverReport'.beforeLoading(async list => {
  
  let config = await 'Configuration'.bringFirst()
  let priorWeekCount = await config.getSalesProjectionPriorWeeks()
  let priorWeeksStartDate = global.todayYMD().incDays(- priorWeekCount * 7)
  let firstSaleDates = {}

  let createData = async () => {

    let updatePurchases = async () => {
      let poLines = await 'POLine'.bring()
      for ( var i = 0; i < poLines.length; i++ ) {
        let poLine = poLines[i]
        let po = await poLine.toPO(); if ( ! po ) continue
        let outstanding = (poLine.quantity - poLine.receivedQuantity - poLine.cancelledQuantity)
        if ( (outstanding < 0) && (poLine.quantity > 0) )
          outstanding = 0
        else if ( (outstanding > 0) && (poLine.quantity < 0) )
          outstanding = 0
        if ( outstanding > 0 ) {
          if ( po.stage === 'Draft' )
            outstanding = 0
        }
        let qty = outstanding
        if ( qty === 0 )
          continue
        let product = await poLine.toProduct()
        let fc = await 'ForwardCover'.bringSingle({product: product}); if ( ! fc ) continue
        let stage = po.stage
        if ( (! stage) || (stage === "Entered") || (stage === "Sent to Supplier") ) {
          fc.onPurchaseOrders += qty
        } else
          fc.inTransit += qty
      }
    }

    let updateSales = async () => {
      let orderItems = await 'order_items.RecentOrActive'.bring()
      let salesFromDate = global.todayYMD().incDays((- priorWeekCount) * 7)
      for ( var i = 0; i < orderItems.length; i++ ) {
        let orderItem = orderItems[i]
        let varId = orderItem._variation_id
        let productId = varId ? varId : orderItem._product_id
        let orderDate = orderItem.order_date
        let firstSaleDate = firstSaleDates[productId]
        if ( (! firstSaleDate) || (orderDate < firstSaleDate) )
          firstSaleDates[productId] = orderDate
        if ( orderDate < salesFromDate ) continue
        let product = await 'products'.bringSingle({id: productId}); if ( ! product ) continue
        let fc = await 'ForwardCover'.bringSingle({product: product}); if ( ! fc ) continue
        let status = orderItem.order_status
        if ( (status === "wc-pending") || (status === "wc-failed") || (status === "wc-partially-paid") )
          fc.onSalesOrders += orderItem._qty
        if ( (status !== "wc-cancelled") && (status !== "wc-refunded") )
          fc.priorWeeksSales += orderItem._qty
      }
    }

    let fcToFirstSaleDate = async (fc) => {
      let productId = fc.product.id
      let res = firstSaleDates[productId]
      return res
    }

    let calcSalesPerDay = async (fc) => {
      let firstSaleDate = await fcToFirstSaleDate(fc)
      let priorDayCount = priorWeekCount * 7
      let deadDays = firstSaleDate ? firstSaleDate.dateSubtract(priorWeeksStartDate) : priorDayCount
      if ( deadDays < 0 )
        deadDays = 0
      let liveDays = priorDayCount - deadDays
      let product = await fc.referee('product')
      let estSalesPerDeadDay = await product.getEstSalesUnitsPerDay()
      let salesPerLiveDay = liveDays ? fc.priorWeeksSales / liveDays : 0
      let res = ((estSalesPerDeadDay * deadDays) + (salesPerLiveDay * liveDays)) / priorDayCount
      return res
    }

    let fcToAvenue = async (fc) => {
      let inv = await 'Inventory'.bringSingle({product: fc.product}); if ( ! inv ) return null
      let res = await inv.supplierRefToAvenue(fc.supplier)
      return res
    }

    let updateStats = async () => {
      let fcs = await 'ForwardCover'.bring()
      for ( var i = 0; i < fcs.length; i++ ) {
        let fc = fcs[i]
        fc.available = fc.onHand + fc.onPurchaseOrders + fc.inTransit - fc.onSalesOrders
        fc.salesPerDay = await calcSalesPerDay(fc)
        fc.bufferDays = global.unknownNumber()
        fc.targetBufferDays = global.unknownNumber()
        fc.bufferPctOfTarget = 99999
        if ( fc.salesPerDay <= 0 )
          continue
        fc.bufferDays = fc.available / fc.salesPerDay 
        let supplier = await fc.referee('supplier')
        if ( ! supplier )
          continue
        let avenue = await fcToAvenue(fc)
        let minimumOrderQuantity = avenue ? avenue.minimumOrderQuantity : 0
        fc.targetBufferDays = supplier.maximumDaysBetweenDeliveries + (minimumOrderQuantity / fc.salesPerDay) 
        if ( ! fc.targetBufferDays ) 
          continue
        fc.bufferPctOfTarget = (fc.bufferDays / fc.targetBufferDays) * 100
      }
    }
  
    let createForwardCover = async product => {
      let fc = await 'ForwardCover'.bringOrCreate({product: product})
      let inventory = await 'Inventory'.bringSingle({product: product}); if ( ! inventory ) return
      //fc.onPurchaseOrders = inventory.quantityOnPurchaseOrders
      fc.onHand = inventory.quantityOnHand
      fc.supplier = await inventory.toMainSupplierRef()
      //fc.deliveryLeadDays = await inventory.toDeliveryLeadDays()
    }
  
    let products = await 'products'.bring()
    'ForwardCover'.clear()
    await products.forAllAsync(async product => {
      await createForwardCover(product)
    })
    await updatePurchases()
    await updateSales()
    await updateStats()
  
  }

  await list.harmonize()
  await createData()

})

'product'.destination(async forwardCover => {
  let pref = forwardCover.product; if ( ! pref ) return null
  if ( ! pref.id ) return null
  let p = await 'products'.bringFirst({id: pref.id})
  return p
})


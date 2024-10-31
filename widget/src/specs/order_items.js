'order_items'.datatype({source: 'WC', exportable: true})
'theOrder'.field({refersToParent: 'orders', parentIsHeader: true, caption: "Order Number"})
'_product_id'.field({numeric: true, indexed: true})
'_variation_id'.field({numeric: true, indexed: true})
'_qty'.field({numeric: true, caption: "Quantity"})
'_line_total'.field({numeric: true, caption: "Sale Value Ex Tax", decimals: 2})
'_line_tax'.field({numeric: true, caption: "Tax", decimals: 2})
'order_date'.field({date: true, caption: "Order Date"})
'_date_completed'.field({caption: "Date Completed", date: true, allowEmpty: true})
'_reduced_stock'.field()
'order_status'.field()
'productUniqueName'.field()
'productSku'.field()
'niceOrderStatus'.field({caption: "Status", translateOnDisplay: true})
'unitPriceExTax'.field({numeric: true, decimals: 2})
'valueIncTax'.field({numeric: true, decimals: 2})
'billingNameAndCompany'.field()
'treated_as_made'.field({numeric: true})
'_refunded_item_id'.field({numeric: true, indexed: true})
'shippedDate'.field({date: true})
'billingName'.field()
'active'.field({yesOrNo: true})
'unitPriceBDExTax'.field({numeric: true, decimals: 2})
'_line_subtotal'.field({numeric: true, caption: "Sale Value Before Discount Ex Tax", decimals: 2})

'order_items'.afterCreating(async function () {
  this.post_modified = global.todayYMD()
})

'order_items'.method('toTaxPct', function() {
  if ( ! this._line_total ) return 0
  return (this._line_tax / this._line_total) * 100
})

'order_items'.method('toOrderId', function() {
  if ( ! this.theOrder ) return null
  return this.theOrder.id
})

'active'.calculate(orderItem => {
  let order = orderItem.toOrderFast();
  if ( (! order) || (order === 'na') )
    return null
  return order.active
})

'order_items'.method('toCustomer', async function() {
  let order = await this.toOrder(); if ( ! order ) return null
  return await order.toCustomer()
})

'shippedDate'.calculate(async orderItem => {
  return orderItem._date_completed
})

'order_items'.method('toUnitPrice', function() {
  if ( this._qty === 0 ) return 0
  let valueIncTax = this._line_total + this._line_tax
  return valueIncTax / this._qty
}) 

'order_items'.method('toUnitPriceExclTax', function() {
  if ( this._qty === 0 ) return 0
  let value = this._line_total
  return value / this._qty
}) 

'order_items'.method('toAvgUnitCost', async function() {
  let order = await this.toOrder(); if ( ! order ) return 0
  let transactions = await 'Transaction.Recent'.bring({reference: order.id})
  let res
  for ( var i = 0; i < transactions.length; i++ ) {
    let transaction = transactions[i]
    if ( transaction.source === 'Sale' ) {
      res = transaction.unitCost
      break;
    } 
  }
  if ( ! res ) {
    let inventory = await this.toInventory(); if ( ! inventory ) return 0
    res = inventory.avgUnitCost
  }
  return res
})

'order_items'.method('toQtyNetOfRefunds', async function() {
  let res = this._qty
  let refunds = await 'order_items.RecentOrActive'.bring({_refunded_item_id: this.id})
  for ( var i = 0; i < refunds.length; i++ ) {
    let refund = refunds[i]
    res += refund._qty
  }
  return res
})

'order_items'.beforeSaving(async function() {
  let old = this.getOld()
  let qtyChanged = (this._qty !== old._qty)
  if ( qtyChanged )
    await this.refreshQuantityReservedForCustomerOrders({refreshClusters: true})
})

'order_items'.method('refreshQuantityPackable', async function() {
  let c = await this.toCluster(); if ( ! c ) return
  await c.refreshQuantityPackable()
})

'order_items'.method('refreshQuantityReservedForCustomerOrders', async function() {
  let c = await this.toCluster(); if ( ! c ) return
  await c.refreshQuantityReservedForCustomerOrders({refreshClusters: true})
})

'order_items'.method('toCluster', async function() {
  let inv = await this.toInventory(); if ( ! inv ) return null
  let loc = await this.toShipFromLocation()
  let res = await inv.locationRefToCluster(loc.reference())
  return res
}) 

'order_items.RecentOrActive'.subset(async () => {
  let config = await 'Configuration'.bringFirst()
  let weeks
  if ( config )
    weeks = config.salesRecentWeeks
  if ( ! weeks )
    weeks = 12
  let res
  if ( config.treatOldIncompleteOrdersAsInactive === 'Yes' ) {
    res = 
      {post_modified: {compare: '>=', value: global.todayYMD().incDays(- (weeks * 7))}}
  } else {
    res = 
      {
        or: [
          {order_status: {compare: 'NOT IN', value: ['wc-failed', 'wc-cancelled', 'wc-refunded', 'trash', 'auto-draft', 'wc-completed']}},
          {post_modified: {compare: '>=', value: global.todayYMD().incDays(- (weeks * 7))}}
        ]
      }
  }
  return res
})

'order_items'.method('isActive', async function () {
  return this.isActiveFast()
})

'order_items'.method('isActiveFast', function () {
  let lcStatus = this.order_status.toLowerCase()
  if ( lcStatus.indexOf('return') >= 0 ) return false
  if ( lcStatus.indexOf('refund') >= 0 ) return false
  let res = ['wc-failed', 'wc-cancelled', 'wc-refunded', 'trash', 'auto-draft', 'wc-completed'].indexOf(this.order_status) < 0
  if ( res ) {
    let treatOldAsInactive = global.confVal('treatOldIncompleteOrdersAsInactive')
    if ( treatOldAsInactive === 'Yes' ) {
      let weeks = global.confVal('salesRecentWeeks')
      let fromDate = global.todayYMD().incDays(- (weeks * 7))
      if ( this.post_modified < fromDate )
        res = false
    }
  }
  return res
})

'order_items'.method('toShipFromLocation', async function () {
  let line = await this.toSOLine();
  let res
  if ( ! line ) {
    res = await 'Location'.bringSingle({locationName: 'General'})
    return res
  }
  res = await line.toShipFromLocation()
  return res
})

'order_items'.method('toShipFromLocationFast', function () {
  let mold = global.foreman.doNameToMold('SOLine')
  let line = mold.fastRetrieveSingle({order_item_id: this.id}, {useIndexedField: 'order_item_id'}); 
  if ( line === 'na' )
    return null
  let res
  if ( ! line ) {
    res = 'Location'.bringSingleFast({locationName: 'General'})
    return res
  }
  res = line.toShipFromLocationFast()
  return res
})

'order_items'.method('toSOLine', async function () {
  let lines = await 'SOLine'.bring({order_item_id: this.id}, {useIndexedField: 'order_item_id'})
  for ( var i = 0; i < lines.length; i++ ) {
    let line = lines[i]
    if ( line.parentSOLine ) continue
    return line
  }
  return null
})

'order_items'.method('toSOLineFast', function (options) {
  let mold = global.foreman.doNameToMold('SOLine')
  let res = mold.fastRetrieveSingle({order_item_id: this.id}, {useIndexedField: 'order_item_id'}); 
  let returnNA = options && options.returnNA
  if ( (res === 'na') && (! returnNA) ) return null
  return res
})

'order_items'.method('toOrder', async function () {
  //let order = await this.referee('theOrder')
  let dt = 'orders'
  if ( this.onlyHoldsSubset('RecentOrActive') )
    dt += '.RecentOrActive'
  let order = dt.bringSingleFast({id: this.theOrder.id})
  if ( ! order )
    order = await dt.bringSingle({id: this.theOrder.id})
  return order
})

'order_items'.method('toOrderFast', function () {
  let dt = 'orders'
  if ( this.onlyHoldsSubset('RecentOrActive') )
    dt += '.RecentOrActive'
  return dt.bringSingleFast({id: this.theOrder.id})
})

'valueIncTax'.calculate(orderItem => {
  return orderItem._line_total + orderItem._line_tax
})

'unitPriceBDExTax'.calculate(orderItem => {
  let res = 0
  if ( orderItem.order_item_type !== 'line_item' )
    res = orderItem._line_subtotal
  else if ( orderItem._qty !== 0 )
    res = orderItem._line_subtotal / orderItem._qty
  return res
})

'unitPriceExTax'.calculate(orderItem => {
  let res = 0
  if ( orderItem._qty !== 0 )
    res = orderItem._line_total / orderItem._qty
  return res
})

'order_items'.method('toProduct', async function() {
  let productId = this.get_resolved_product_id(); if ( ! productId ) return null
  let product = 'products'.bringSingleFast({id: productId})
  if ( ! product )
    product = await 'products'.bringSingle({id: productId})
  return product
})

'order_items'.method('toInventory', async function() {
  let product = await this.toProduct(); if ( ! product ) return null
  let res = await product.toInventory()
  return res
})

'productUniqueName'.calculate(orderItem => {
  let productId = orderItem.get_resolved_product_id(); if ( ! productId ) return null
  let product = 'products'.bringSingleFast({id: productId}) 
  if ( ! product ) {
    //product = await 'products'.bringSingle({id: productId})
    return orderItem.toProductUniqueNameAsync()
  }
  return product.uniqueName
})

'order_items'.method('toProductUniqueNameAsync', async function() {
  let orderItem = this
  let productId = orderItem.get_resolved_product_id(); if ( ! productId ) return null
  let product = await 'products'.bringSingle({id: productId}); if ( ! product ) return null
  return product.uniqueName
})

'productSku'.calculate(orderItem => {
  let productId = orderItem.get_resolved_product_id(); if ( ! productId ) return null
  let product = 'products'.bringSingleFast({id: productId}) 
  if ( ! product )
    return orderItem.toProductSkuAsync()
    //product = await 'products'.bringSingle({id: productId})
  return product._sku
})

'order_items'.method('toProductSkuAsync', async function() {
  let orderItem = this
  let productId = orderItem.get_resolved_product_id(); if ( ! productId ) return null
  let product = await 'products'.bringSingle({id: productId}); if ( ! product ) return null
  return product._sku
})

'niceOrderStatus'.calculate(orderItem => {
  let res = orderItem.order_status
  res = res.stripLeftChars(3).capitalizeFirstChar()
  return res
})

'order_items'.method('ordersDatatype', function() {
  let res = 'orders'
  if ( this.onlyHoldsSubset('RecentOrActive') )
    res += '.RecentOrActive'
  return res
})

'billingNameAndCompany'.calculate(orderItem => {
  let dt = orderItem.ordersDatatype()
  let order = dt.bringSingleFast({id: orderItem.theOrder.id})
  if ( ! order )
    return orderItem.toBillingNameAndCompanyAsync()
    //order = await orderItem.ordersDatatype().bringSingle({id: orderItem.theOrder.id}) 
  if ( ! order ) return null
  let res = order.billingNameAndCompany
  return res
})

'billingName'.calculate(orderItem => {
  let dt = orderItem.ordersDatatype()
  let order = dt.bringSingleFast({id: orderItem.theOrder.id})
  if ( ! order )
    return orderItem.toBillingNameAsync()
  if ( ! order ) return null
  let res = order.billingName
  return res
})

'order_items'.method('toBillingNameAndCompanyAsync', async function() {
  let orderItem = this
  let order = await orderItem.ordersDatatype().bringSingle({id: orderItem.theOrder.id}); if ( ! order ) return null
  return order.billingNameAndCompany
})

'order_items'.method('toBillingNameAsync', async function() {
  let orderItem = this
  let order = await orderItem.ordersDatatype().bringSingle({id: orderItem.theOrder.id}); 
  if ( ! order ) 
    return null
  return order.billingName
})

'order_items'.method('get_resolved_product_id', function() {
  if ( ! this._variation_id ) 
    return this._product_id
  return this._variation_id
})

'productUniqueName'.destination(async (orderItem, productUniqueName) => {
  let p = await 'products'.bringFirst({uniqueName: productUniqueName})
  return p
})

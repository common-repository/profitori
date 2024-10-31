'SAProductCustomerList'.list({withHeader: true})
'Product Sales History'.title()
'Back'.action({act: 'cancel'})
'Download to Excel'.action({act: 'excel'})
'product'.field({readOnly: true, showAsLink: true})

'product'.destination(async cast => {
  if ( ! cast.product ) return
  return await 'products'.bringSingle({id: cast.product.id})
})

'Lines'.manifest()
'SACustomer'.datatype({transient: true})
'_customer_user'.field({key: true, hidden: true})
'billingName'.field({caption: 'Customer', showAsLink: true})
'lastOrderDate'.field({date: true, allowEmpty: true})
'lastOrderQuantity'.field({numeric: true})
'priorWeeksSalesUnits'.field({numeric: true, caption: 'Quantity'})
'priorWeeksSalesValue'.field({numeric: true, hidden: true})
'priorWeeksSalesValueExclTax'.field({numeric: true, hidden: true})
'averageUnitPrice'.field({numeric: true, decimals: 2})
'averageUnitPriceExclTax'.field({numeric: true, decimals: 2})

'billingName'.destination(async customer => {
  return 'SACustomerOrderItemList.js'
})

'SAProductCustomerList'.beforeLoading(async list => {
  await 'SACustomer'.clear()
  let inventory = list.callerCast(); if ( ! inventory ) return
  if ( inventory.datatype() !== 'Inventory' ) return
  let product = await inventory.toProduct(); if ( ! product ) return
  list.setFieldValue('product', product.reference())
  let config = await 'Configuration'.bringFirst()
  let priorWeekCount = await config.getSalesAnalysisPriorWeeks()
  let orderItems = await 'order_items.RecentOrActive'.bring({_product_id: product.id})
  let varOrderItems = await 'order_items.RecentOrActive'.bring({_variation_id: product.id})
  orderItems.appendArray(varOrderItems)
  let salesFromDate = global.todayYMD().incDays((- priorWeekCount) * 7)
  for ( var i = 0; i < orderItems.length; i++ ) {
    let orderItem = orderItems[i]
    let productId = orderItem.get_resolved_product_id(); if ( ! productId ) continue
    if ( productId !== product.id ) continue // workaround for sporadic bug where all orderItems are somehow included for some products
    let status = orderItem.order_status
    if ( (status === "wc-cancelled") || (status === "wc-refunded") )
      continue
    let orderDate = orderItem.order_date
    if ( orderDate < salesFromDate )
      continue
    let orderQty = orderItem._qty
    let order = orderItem.toOrderFast()
    if ( (! order) || (order === 'na') )
      order = await orderItem.toOrder()
    let customer = await 'SACustomer'.bringOrCreate({_customer_user: order._customer_user})
    if ( order.order_date > customer.lastOrderDate ) {
      customer.lastOrderDate = order.order_date
      customer.lastOrderQuantity = orderQty
    }
    customer.priorWeeksSalesUnits += orderQty
    customer.priorWeeksSalesValue += orderItem.valueIncTax
    customer.priorWeeksSalesValueExclTax += orderItem._line_total
    if ( customer.priorWeeksSalesUnits !== 0 ) {
      customer.averageUnitPrice = customer.priorWeeksSalesValue / customer.priorWeeksSalesUnits
      customer.averageUnitPriceExclTax = customer.priorWeeksSalesValueExclTax / customer.priorWeeksSalesUnits
    }
    if ( order._customer_user ) {
      customer.billingName = order.billingName
      customer.billingNameAndCompany = await order.billingNameAndCompany
    }
    if ( ! customer.billingName )
      customer.billingName = 'Anonymous'
  }
})

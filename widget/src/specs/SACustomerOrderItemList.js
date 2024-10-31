'SACustomerOrderItemList'.list({withHeader: true})
'Customer Sales History'.title()
'Back'.action({act: 'cancel'})
'Download to Excel'.action({act: 'excel'})
'billingNameAndCompany'.field({caption: 'Customer', readOnly: true})

'Lines'.manifest()
'SAOrderItem'.datatype({transient: true})
'order'.field({refersTo: 'orders', showAsLink: true})
'product'.field({refersTo: 'products'})
'sku'.field({caption: 'SKU'})
'orderDate'.field({date: true, allowEmpty: true})
'unitPrice'.field({numeric: true, decimals: 2})
'unitPriceExclTax'.field({numeric: true, decimals: 2})
'qty'.field({numeric: true})

'Lines'.defaultSort({field: 'orderDate'})

'SACustomerOrderItemList'.beforeLoading(async list => {

  let processOrder = async order => {
    let orderItems = await 'order_items.RecentOrActive'.bring({theOrder: order.reference()})
    for ( var i = 0; i < orderItems.length; i++ ) {
      let orderItem = orderItems[i]
      let status = orderItem.order_status
      if ( (status === "wc-cancelled") || (status === "wc-refunded") )
        continue
      let product = await orderItem.toProduct()
      let line = await 'SAOrderItem'.create()
      line.order = order.reference()
      line.product = product ? product.reference() : 'Non-stock product: ' + orderItem._product_id
      line.sku = product ? product._sku : ''
      line.orderDate = order.order_date
      line.unitPrice = orderItem.toUnitPrice()
      line.unitPriceExclTax = orderItem.unitPriceExTax
      line.qty = orderItem._qty
    }
  }

  await 'SAOrderItem'.clear()
  let callerCast = list.callerCast(); if ( ! callerCast ) return
  let _customer_user = callerCast._customer_user
  if ( ! _customer_user ) {
    if ( callerCast.datatype() === 'users' )
      _customer_user = callerCast.id
  }
  list.setFieldValue('billingNameAndCompany', callerCast.billingNameAndCompany)
  let orders = await 'orders.RecentOrActive'.bring({_customer_user: _customer_user})
  for ( var i =  0; i < orders.length; i++ ) {
    let order = orders[i]
    await processOrder(order)
  }

})

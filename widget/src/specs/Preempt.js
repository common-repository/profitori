'Preempt'.datatype()
'product_id'.field({numeric: true})
'order_item_id'.field({numeric: true, key: true, nonUnique: true})
'quantity'.field({numeric: true})
'madeOrConsumed'.field()
'finalised'.field({yesOrNo: true})
'transactionCreated'.field({yesOrNo: true})

'Preempt'.method('toOrderItem', async function() {
  let res = await 'order_items'.bringSingle({id: this.order_item_id})
  return res
})

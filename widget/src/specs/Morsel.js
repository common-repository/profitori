'Morsel'.datatype({exportable: true, plex: true})
'morsel_type'.field()
'order_item_id'.field()
'product_id'.field()
'quantity'.field({numeric: true})
'amount'.field({numeric: true})
'morsel_date'.field() // NOTE: includes time
'user_login'.field()
'order_id'.field()
'the_id'.field({numeric: true})

'Morsel'.method('toDate', function() {
  if ( ! this.morsel_date ) return null
  let arr = this.morsel_date.split(' ')
  return arr[0]
})

'Morsel'.method('toHMS', function() {
  if ( ! this.morsel_date ) return null
  let arr = this.morsel_date.split(' ')
  if ( arr.length <= 1 ) return ''
  return arr[1]
})

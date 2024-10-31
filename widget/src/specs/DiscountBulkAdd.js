'DiscountBulkAdd'.list()
'Add Products to Discount Rule'.title()
'Cancel'.action({act: 'cancel', icon: 'AngleLeft'})
'OK'.action({icon: 'CheckDouble'})
'Select All'.action() 
'Select None'.action() 

'BulkDiscountLine'.datatype({transient: true})
'include'.field({tickbox: true, allowInput: true})
'product'.field({refersTo: 'products', readOnly: true, showAsLink: true})
'uniqueName'.field({caption: 'Name', readOnly: true})

'Select All'.act(async (list, cast) => { 
  list.situation()._selectedAll = true 
  list.casts().forEach(bg => bg.include = 'Yes') 
  list.dataChanged() 
}) 

'Select All'.availableWhen((cast, list) => { 
  let s = list.situation() 
  return ! s._selectedAll 
}) 

'Select None'.act(async (list, cast) => { 
  list.situation()._selectedAll = false 
  list.casts().forEach(bg => bg.include = 'No') 
  list.dataChanged() 
}) 

'Select None'.availableWhen((cast, list) => { 
  let s = list.situation() 
  return s._selectedAll 
}) 

'OK'.act(async list => {

  let discount = list.callerCast(); if ( ! discount ) return
  let bulkDiscountLines = await 'BulkDiscountLine'.bring()
  for ( var i = 0; i < bulkDiscountLines.length; i++ ) {
    let bulkDiscountLine = bulkDiscountLines[i]
    if ( bulkDiscountLine.include !== 'Yes' ) continue
    let discountLine = await 'DiscountLine'.bringOrCreate({discount: discount, product: bulkDiscountLine.product})
    await discountLine.refreshCalculations({force: true, includeDefers: true})
  }
  await discount.refreshCalculations({force: true, includeDefers: true})

  list.ok()
})

'DiscountBulkAdd'.beforeLoading(async list => {

  await 'BulkDiscountLine'.clear()
  let discount = list.callerCast(); if ( ! discount ) return
  let products = await 'products'.bring()
  for ( var i = 0; i < products.length; i++ ) {
    let product = products[i]
    if ( await product.isInDiscount(discount) ) continue
    let bg = await 'BulkDiscountLine'.create(null, {product: product}) 
    bg.uniqueName = product.uniqueName
  }
  list.startAlter({skipFieldCheck: true})
})


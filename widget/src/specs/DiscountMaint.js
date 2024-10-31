'DiscountMaint'.maint({panelStyle: "titled"})
'Add Discount Rule'.title({when: 'adding'})
'Edit Discount Rule'.title({when: 'editing'})
'Back'.action({act: 'cancel'})
'OK'.action({act: 'ok'})
'Save'.action({act: 'save'})
'Add another'.action({act: 'add'})
'Attachments'.action({act: 'attachments'})
'Discount'.datatype()

'Rule Details'.panel()
'description'.field({key: true})
'categories'.field({caption: 'Product Categories (comma separated, leave blank for all)'})
'groups'.field({caption: 'Customer Groups (comma separated, leave blank for all)'})
'discountType'.field()
'percentage'.field({numeric: true, decimals: 2})
'amount'.field({numeric: true, decimals: 2, caption: 'Fixed Price'})
'active'.field({yesOrNo: true})
'product_ids'.field({hidden: true, storedCalc: true})

'Products'.manifest()
'Add Products'.action({noSave: true})
'DiscountLine'.datatype({exportable: true})
'discount'.field({refersToParent: 'Discount', hidden: true})
'product'.field({refersTo: 'products', showAsLink: true, indexed: true})
'Remove'.action({place: 'row', act: 'trash'})

/* eslint-disable no-cond-assign */

'DiscountLine'.cruxFields(['discount', 'product'])

'Add Products'.act(async (maint, discount) => {
  await maint.segue('view', 'DiscountBulkAdd.js', discount)
})

'discountType'.options(['Percentage', 'Amount'])

'discountType'.inception('Percentage')

'active'.inception('Yes')

'product_ids'.calculate(async discount => {
  let line; let lines = await discount.toLines()
  let res = ''
  while ( line = lines.__() ) {
    if ( ! line.product ) continue
    if ( res )
      res += ','
    res += line.product.id
  }
  return res
})

'Discount'.method('containsProduct', async function(product) {
  let discountLine = await 'DiscountLine'.bringFirst({discount: this, product: product}, {useIndexedField: 'product'})
  return discountLine ? true : false
})

'Discount'.method('toLines', async function() {
  return await 'DiscountLine'.bringChildrenOf(this)
})

'Discount'.method('appliesToProduct', async function(product) {
  let lines = await this.toLines()
  if ( (! this.categories) && (lines.length === 0) ) 
    return true
  let matchCategories = this.categories.split(',')
  let category; let categories = await product.toCategories()
  while ( category = categories.__() ) {
    if ( matchCategories.indexOf(category.categoryName) >= 0 ) {
      return true
    }
  }
  if ( lines.length > 0 ) {
    let res = await this.containsProduct(product)
    return res
  }
  return false
})

'Discount'.method('appliesToCustomer', async function(customer) {
  if ( ! this.groups ) 
    return true
  let matchGroups = this.groups.split(',')
  let group; let groups = await customer.toGroups()
  while ( group = groups.__() ) {
    if ( matchGroups.indexOf(group.groupName) >= 0 )
      return true
  }
  return false
})

'Discount'.validate(async function() {
  await this.validateCategories()
  await this.validateGroups()
})

'Discount'.method('validateGroups', async function() {
  let g; let gs = this.groups.split(',')
  while ( g = gs.__() ) {
    let group = await 'Group'.bringFirst({groupName: g})
    if ( ! group ) 
      throw(new Error('Customer Group'.translate() + ' ' + g + ' ' + 'does not exist'.translate()))
  }
})

'Discount'.method('validateCategories', async function() {
  let cat; let cats = this.categories.split(',')
  while ( cat = cats.__() ) {
    let category = await 'category'.bringFirst({categoryName: cat})
    if ( ! category ) 
      throw(new Error('Product Category'.translate() + ' ' + cat + ' ' + 'does not exist'.translate()))
  }
})

'percentage'.visibleWhen((maint, discount) => {
  return discount.discountType === 'Percentage'
})

'amount'.visibleWhen((maint, discount) => {
  return discount.discountType === 'Amount'
})


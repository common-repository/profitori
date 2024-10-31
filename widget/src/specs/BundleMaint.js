'BundleMaint'.maint()
'Add Bundle'.title({when: 'adding'})
'Edit Bundle'.title({when: 'editing'})
'Back'.action({act: 'cancel'})
'OK'.action({act: 'ok'})
'Save'.action({act: 'save'})
'Add another'.action({act: 'add'})

'Bundle'.datatype()
'bundleNumber'.field({key: true})
'product'.field({refersTo: 'products', caption: 'Bundle Product'})
'overheadCost'.field({numeric: true, minDecimals: 2, maxDecimals: 6})
'totalCost'.field({readOnly: true, numeric: true, minDecimals: 2, maxDecimals: 6, caption: 'Total Bundle Cost'})
'bundleProductId'.field({numeric: true, hidden: true})
'quantityPickable'.field({numeric: true, readOnly: true, hidden: true})
'quantityMakeable'.field({numeric: true, readOnly: true, hidden: true})
'quantityReservedForCustomerOrders'.field({numeric: true, readOnly: true, hidden: true})
'sellableQuantity'.field({numeric: true, readOnly: true, hidden: true})
'lastComponentUpdate'.field({hidden: true})

'totalCost'.calculate(async bundle => {
  let res = bundle.overheadCost
  let components = await 'Component'.bringChildrenOf(bundle)
  for ( var i = 0; i < components.length; i++ ) {
    let component = components[i]
    await component.refreshCalculations({force: true, includeDefers: true})
    res += component.totalCost
  }
  return res
})

'quantityPickable'.calculate(async bundle => {
  let inv = await bundle.toInventory(); if ( ! inv ) return 0
  return inv.quantityPickable
})

'quantityMakeable'.calculate(async bundle => {
  let inv = await bundle.toInventory(); if ( ! inv ) return 0
  return inv.quantityMakeable
})

'quantityReservedForCustomerOrders'.calculate(async bundle => {
  let inv = await bundle.toInventory(); if ( ! inv ) return 0
  return inv.quantityReservedForCustomerOrders
})

'Components'.manifest()
'Add Component'.action({act: 'add'})

'Component'.datatype()
'product'.field()
'quantity'.field()
'avgUnitCost'.field()
'totalCost'.field()
'quantityPickable'.field()
'quantityMakeable'.field()
'quantityReservedForCustomerOrders'.field()
'Edit'.action({place: 'row', act: 'edit'})
'Trash'.action({place: 'row', act: 'trash'})
'ComponentMaint.js'.maintSpecname()

'Bundle'.method('toComponents', async function () {
  let res = await 'Component'.bringChildrenOf(this)
  return res
})

'Bundle'.method('toProduct', async function () {
  let res = await this.referee('product')
  return res
})

'Bundle'.method('toInventory', async function () {
  let product = await this.toProduct(); if ( ! product ) return null
  let res = await product.toInventory()
  return res
})

'Bundle'.beforeSaving(async function() {
  this.bundleProductId = this.product ? this.product.id : null // for query efficiency when determining quantity available for sale in the back end
  let otherBundles = await 'Bundle'.bring({product: this.product})
  for ( var i = 0; i < otherBundles.length; i++ ) {
    let otherBundle = otherBundles[i]
    if ( otherBundle.id === this.id ) continue
    throw(new Error('This product is already a bundle product'.translate()))
  }
})

'BundleMaint'.whenAdding(async function() {

  let defaultNumber = async () => {
    let nextNo = await 'NextNumber'.bringOrCreate({forDatatype: 'Bundle'})
    nextNo.number = nextNo.number + 1
    let noStr = nextNo.number + ""
    let adjNo = "BU" + noStr.padStart(5, '0')
    this.setFieldValue('bundleNumber', adjNo)
  }

  await defaultNumber()

})




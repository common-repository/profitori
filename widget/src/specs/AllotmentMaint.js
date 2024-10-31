'AllotmentMaint'.maint({panelStyle: "titled"})
'Back'.action({act: 'cancel'})
'OK'.action({act: 'okNoSave'})
'Add another'.action({act: 'addNoSave'})

'Allotment'.datatype()

'Lot Details'.panel()
'allotmentParent'.field({key: true, nonUnique: true, refersToParent: ['POReceiptLine', 'POLine', 'SOLine', 'Adjustment', 'Transfer'], hidden: true})
'product'.field({refersTo: 'products', readOnly: true})
'lot'.field({refersTo: 'Lot', caption: 'Lot Number', allowAny: true, showAsLink: true})
'quantity'.field({numeric: true})
'expiryDate'.field({date: true, allowEmpty: true})
'expiryDateRequired'.field({yesOrNo: true, hidden: true})

'expiryDate'.default(global.emptyYMD())

'Allotment'.afterRetrieving(async function() {
  let lot = await this.toLot(); if ( ! lot ) return
  this.expiryDate = lot.expiryDate
})

'Allotment'.method('toInventory', async function() {
  let product = await this.toProduct(); if ( ! product ) return null
  return await product.toInventory()
})

'expiryDateRequired'.calculate(async allotment => {
  let inv = await allotment.toInventory(); if ( ! inv ) return 'No'
  return inv.trackExpiryDates
})

'expiryDate'.visibleWhen((maint, allotment) => {
  return allotment.expiryDateRequired === 'Yes'
})

'lot'.readOnlyWhen((maint, allotment) => {
  return ! allotment.isNew()
})

'Lot Details'.dynamicTitle(function() {
  let parent = this.parentCast()
  if ( parent && (parent.lotsAreSerials === 'Yes') )
    return 'Serial Number Details'
  else
    return 'Lot Details'
})

'quantity'.visibleWhen(maint => {
  let parent = maint.parentCast()
  if ( parent && (parent.lotsAreSerials === 'Yes') )
    return false
  return true
})

'lot'.dynamicCaption(maint => {
  let parent = maint.parentCast()
  if ( parent && (parent.lotsAreSerials === 'Yes') )
    return 'Serial Number'
  else
    return 'Lot Number'
})

'Allotment'.cruxFields(['allotmentParent', 'lot'])

'AllotmentMaint'.dynamicTitle(function() {
  let parent = this.parentCast()
  let verb = this.isAdding() ? 'Add'.translate() : 'Edit'.translate()
  if ( parent && (parent.lotsAreSerials === 'Yes') )
    return verb + ' ' + 'Serial Number'.translate()
  else
    return verb + ' ' + 'Lot Quantity'.translate()
})

'Allotment'.method('toClump', async function() {
  let cluster = await this.toCluster(); if ( ! cluster ) return null
  let lot = await this.toLot(); if ( ! lot ) return null
  let res = await 'Clump'.bringSingle({cluster: cluster, lot: lot})
  return res
})

'Allotment'.method('toLotNumber', async function() {
  let lot = await this.toLot(); if ( ! lot ) return null
  return lot.lotNumber
})

'Allotment'.method('toLot', async function() {
  let res = await this.referee('lot')
  return res
})

'Allotment'.method('toProduct', async function() {
  let parent = await this.parent();
  if ( ! parent ) {
    return null
  }
  let res = await parent.referee('product')
  return res
})

'product'.calculate(async allotment => {
  let product = await allotment.toProduct(); if ( ! product ) return null
  return product.reference()
})

'lot'.inception(async allotment => {
  let c = await 'Configuration'.bringFirst(); if ( ! c ) return null
  let product = await allotment.toProduct(); if ( ! product ) return null
  let lot = await c.prodRefToUnspecifiedLot(product.reference())
  return lot.reference()
})

'quantity'.inception(async allotment => {
  let parent = await allotment.parent(); if ( ! parent ) return 0
  let mainQty = await parent.toMainQuantity()
  if ( parent.lotsAreSerials === 'Yes' )
    return global.sign(mainQty) // 1 or -1
  let res = mainQty
  let allotments = await 'Allotment'.bringChildrenOf(parent)
  for ( var i = 0; i < allotments.length; i++ ) {
    let a = allotments[i]
    if ( a.id === allotment.id ) continue
    let lot = await a.referee('lot')
    if ( lot && (lot.lotNumber === 'Unspecified') ) continue
    res -= a.quantity
  }
  return res
})

'Allotment'.beforeValidating(async function() {
  if ( ! this.lot ) return
  let lot = await 'Lot'.bringOrCreate({product: this.product, lotNumber: this.lot.keyval})
  this.lot = lot.reference()
  if ( this.expiryDateRequired )
    lot.expiryDate = this.expiryDate
})

'Allotment'.validate(async function() {

  let parent = await this.parent(); if ( ! parent ) return

  let checkSerialNotDuplicated = async () => {
    if ( this._markedForDeletion ) return
    if ( parent.lotsAreSerials !== 'Yes' ) return
    if ( ! parent.checkSerialNotDuplicated ) return
    await parent.checkSerialNotDuplicated(this)
  }

  await checkSerialNotDuplicated()
  let lot = await this.toLot()
  let mainQty = await parent.toMainQuantity()
  if ( lot && (lot.lotNumber === 'Unspecified') && (global.sign(this.quantity) !== global.sign(mainQty)) )
    throw(new Error('Cannot have an Unspecified lot with a negative quantity'))
})

'Allotment'.beforeSaving(async function() {
  let cluster = await this.toCluster(); if ( ! cluster ) return
  let clump = await 'Clump'.bringOrCreate({cluster: cluster.reference(), lot: this.lot})
  let oldClump
  if ( this.getOld().lot )
    oldClump = await 'Clump'.bringOrCreate({cluster: cluster.reference(), lot: this.getOld().lot})
  await clump.refreshQuantityOnPurchaseOrders()
  if ( oldClump )
    await oldClump.refreshQuantityOnPurchaseOrders()
  let parent = await this.parent()
  if ( parent && parent.createTransactionForAllotment )
    await parent.createTransactionForAllotment(this)
})

'quantity'.afterUserChange(async (oldInputValue, newInputValue, allotment, maint) => {
  await allotment.balanceAllotments()
})

'lot'.afterUserChange(async (oldInputValue, newInputValue, allotment, maint) => {
  await allotment.balanceAllotments()
})

'Allotment'.method('balanceAllotments', async function() {
  let c = await 'Configuration'.bringFirst(); if ( ! c ) return
  let parent = await this.parent(); if ( ! parent ) return
  await c.balanceAllotments(parent)
})

'Allotment'.method('toLocation', async function() {
  let parent = await this.parent(); if ( ! parent ) return null
  if ( ! parent.toLocation ) return null
  if ( ! global.isFunction(parent.toLocation) ) 
    return await parent.getLocation()
  let res = await parent.toLocation()
  return res
})

'Allotment'.method('toCluster', async function() {
  let parent = await this.parent(); if ( ! parent ) return null
  let res = await parent.toCluster()
  return res
})

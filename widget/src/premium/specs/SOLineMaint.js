'SOLineMaint'.maint({panelStyle: "titled", icon: "Truck"})
'Sales Order Line Fulfillment'.title()
'Back'.action({act: 'cancel'})
'OK'.action({act: 'ok'})
'Save'.action({act: 'save'})

'SOLine'.datatype()

'Line Details'.panel()
'salesOrder'.field()
'descriptionAndSKU'.field({caption: 'Product', readOnly: true})
'quantityOrdered'.field({readOnly: true})
'quantityRemainingToShip'.field({readOnly: true})
'quantityPickable'.field({readOnly: true})
'quantityToPick'.field()
'quantityMakeable'.field({readOnly: true})
'quantityToMake'.field()
'quantityPackable'.field({readOnly: true})
'quantityToPack'.field({readOnly: true})
'quantityShipped'.field()
'quantityShippedIncremental'.field()

'Fulfillment Details'.panel()
'shipFromLocation'.field()
'packable'.field({readOnly: true, caption: 'Packable From This Location'})
'fulfillStage'.field()
'priority'.field()
'notes'.field()

'Lots'.manifest()
'Add Lot'.action({act: 'add'})
'Add Serial Number'.action({act: 'add'})
'Allotment'.datatype()
'lot'.field({showAsLink: true, caption: 'Number'})
'quantity'.field()
'expiryDate'.field()
'Edit'.action({place: 'row', act: 'edit'})
'Trash'.action({place: 'row', act: 'trash'})
'AllotmentMaint.js'.maintSpecname()

'quantityShippedIncremental'.visibleWhen((list, line) => {
  return global.confVal('enterIncrementalShipmentQuantity') === 'Yes'
})

'Add Lot'.availableWhen(soLine => {
  let res = (soLine.hasLots === 'Yes') && (soLine.lotsAreSerials !== 'Yes')
  return res
})

'Add Serial Number'.availableWhen(soLine => {
  let res = (soLine.lotsAreSerials === 'Yes')
  return res
})

'Add Lot'.before(async (maint, soLine) => {
  if ( soLine.quantityShipped <= 0 )
    throw(new Error('You must enter the Quantity Shipped before adding lots'.translate()))
})

'Add Serial Number'.before(async (maint, soLine) => {
  if ( soLine.quantityShipped <= 0 )
    throw(new Error('You must enter the Quantity Shipped before adding serial numbers'.translate()))
})


'Lots'.dynamicTitle(function() {
  let grid = this
  let soLine = grid.containerCast()
  if ( soLine.lotsAreSerials === 'Yes' )
    return 'Serial Numbers'
  else
    return 'Lots'
})

'Lots'.visibleWhen((maint, soLine) => {
  return soLine.hasLots === 'Yes'
})

'quantityToPick'.readOnlyWhen((maint, line) => {
  return line.parentSOLine ? true : false
})

'quantityToMake'.readOnlyWhen((maint, line) => {
  return line.parentSOLine ? true : false
})

'quantityShipped'.readOnlyWhen((maint, line) => {
  if ( global.confVal('enterIncrementalShipmentQuantity') === 'Yes' ) 
    return true
  return line.parentSOLine ? true : false
})

'shipFromLocation'.readOnlyWhen((maint, line) => {
  return line.parentSOLine ? true : false
})

'fulfillStage'.readOnlyWhen((maint, line) => {
  return line.parentSOLine ? true : false
})

'priority'.readOnlyWhen((maint, line) => {
  return line.parentSOLine ? true : false
})

'quantityToMake'.visibleWhen((maint, soLine) => {
  return soLine.productIsBundle === 'Yes'
})

'quantityMakeable'.visibleWhen((maint, soLine) => {
  return soLine.productIsBundle === 'Yes'
})

'quantityToPack'.visibleWhen((maint, soLine) => {
  return soLine.productIsBundle === 'Yes'
})

'quantityPackable'.visibleWhen((maint, soLine) => {
  return soLine.productIsBundle === 'Yes'
})


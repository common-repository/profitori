'AdjustmentMaint'.maint({icon: 'LayerGroup'})
'Enter Inventory Adjustment'.title({when: 'adding'})
'View Inventory Adjustment'.title({when: 'editing'})
'Back'.action({act: 'cancel'})
'OK'.action({act: 'ok'})
'Save'.action({act: 'save'})
'Add another'.action({act: 'add'})
'Attachments'.action({act: 'attachments'})
'Adjustment Slip'.action()
'Adjustment'.datatype()
'adjustmentNumber'.field({key: true})
'date'.field({date: true})
'location'.field()
'product'.field({refersTo: 'products', showAsLink: true})
'quantityOnHand'.field({numeric: true, readOnly: true})
'quantity'.field({numeric: true, caption: "Quantity Change"})
'taxPct'.field({numeric: true, decimals: 2, caption: "Tax %"})
'unitCostIncTax'.field({numeric: true, minDecimals: 2, maxDecimals: 6, caption: "Unit Price (Inc Tax)"})
'reason'.field()
'notes'.field({multiLine: true})
'lineCostIncTax'.field({numeric: true, minDecimals: 2, maxDecimals: 6, caption: "Line Total (Inc Tax)", readOnly: true})
'lineTax'.field({numeric: true, decimals: 2, readOnly: true})

'Lots'.manifest()
'Add Lot'.action({act: 'addNoSave'})
'Add Serial Number'.action({act: 'addNoSave'})
'Allotment'.datatype()
'lot'.field({showAsLink: true, caption: 'Number'})
'quantity'.field()
'expiryDate'.field()
'Edit'.action({place: 'row', act: 'edit'})
'Trash'.action({place: 'row', act: 'trash'})
'AllotmentMaint.js'.maintSpecname()

'Adjustment Slip'.act(async (maint, adj) => {
  maint.downloadPDF({spec: "AdjustmentSlip.js", docName: adj.adjustmentNumber + ".PDF"})
})

'Add Lot'.availableWhen(adj => {
  let res = (adj.hasLots === 'Yes') && (adj.lotsAreSerials !== 'Yes')
  return res
})

'Add Serial Number'.availableWhen(adj => {
  let res = (adj.lotsAreSerials === 'Yes')
  return res
})

'Lots'.dynamicTitle(function() {
  let grid = this
  let adj = grid.containerCast()
  if ( adj.lotsAreSerials === 'Yes' )
    return 'Serial Numbers'
  else
    return 'Lots'
})

'Lots'.visibleWhen((maint, adj) => {
  return adj.hasLots === 'Yes'
})

'AdjustmentMaint'.readOnly( (maint, adjustment) => {
  if ( ! adjustment.isNew() )
    return 'Adjustments cannot be altered - please add a new adjustment instead'
})

'AdjustmentMaint'.makeDestinationFor('Adjustment')

'AdjustmentMaint'.whenAdding(async function(adjustment, maint) {

  let getProduct = async () => {
    let c = this.callerCast(); if ( ! c ) return null
    if ( c.datatype() === 'products' ) 
      return c
    if ( c.datatype() === 'Inventory' ) {
      let prodRef = c.product; if ( ! prodRef ) return null
      let prodId = prodRef.id; if ( ! prodId ) return null
      return await 'products'.bringSingle({id: prodId});
    }
    if ( c.datatype() === 'Cluster' )
      return await c.toProduct()
    return null
  }

  let getLocation = async () => {
    let c = this.callerCast(); if ( ! c ) return null
    if ( c.datatype() !== 'Cluster' ) return null
    return await c.toLocation()
  }

  let defaultAdjustmentNumber = async () => {
    let res
    while ( true ) {
      let nextNo = await 'NextNumber'.bringOrCreate({forDatatype: 'Adjustment'})
      nextNo.number = nextNo.number + 1
      let noStr = nextNo.number + ""
      res = "AJ" + noStr.padStart(5, '0')
      let adj = await 'Adjustment'.bringFirst({adjustmentNumber: res})
      if ( ! adj )
        break
    }
    this.setFieldValue('adjustmentNumber', res)
  }

  let refreshProduct = async () => {
    let p = await getProduct(); if ( ! p ) return
    let prodRef = p.reference()
    this.setFieldValue('product', prodRef)
  }

  let refreshLocation = async () => {
    let loc = await getLocation(); if ( ! loc ) return
    let locRef = loc.reference()
    this.setFieldValue('location', locRef)
  }

  let defaultUnitCost = async() => {
    let p = await getProduct(); if ( ! p ) return
    let inv = await 'Inventory'.bringSingle({product: p.reference()}); if ( ! inv ) return
    let cost = inv.avgUnitCost
    if ( cost === global.unknownNumber() )
      cost = 0
    this.setFieldValue('unitCostIncTax', cost)
  }

  await refreshProduct()
  await refreshLocation()
  await defaultAdjustmentNumber()
  await defaultUnitCost()

})

'AdjustmentMaint'.makeDestinationFor('Adjustment')

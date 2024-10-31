'TransferMaint'.maint()
'Enter Inventory Transfer'.title({when: 'adding'})
'View Inventory Transfer'.title({when: 'editing'})
'Back'.action({act: 'cancel'})
'OK'.action({act: 'ok'})
'Save'.action({act: 'save'})
'Add another'.action({act: 'add'})
'Attachments'.action({act: 'attachments'})
'Transfer'.datatype()
'transferNumber'.field()
'date'.field({date: true})
'fromLocation'.field()
'fromLocationQuantityOnHand'.field({readOnly: true})
'toLocation'.field()
'product'.field({showAsLink: true})
'quantity'.field()
'notes'.field({multiLine: true})

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

'Add Lot'.availableWhen(tfr => {
  let res = (tfr.hasLots === 'Yes') && (tfr.lotsAreSerials !== 'Yes')
  return res
})

'Add Serial Number'.availableWhen(tfr => {
  let res = (tfr.lotsAreSerials === 'Yes')
  return res
})

'Lots'.dynamicTitle(function() {
  let grid = this
  let tfr = grid.containerCast()
  if ( tfr.lotsAreSerials === 'Yes' )
    return 'Serial Numbers'
  else
    return 'Lots'
})

'Lots'.visibleWhen((maint, tfr) => {
  return tfr.hasLots === 'Yes'
})

'fromLocation'.default(async maint => {
  let res = await 'Location'.bringSingle({locationName: 'General'})
  return res.reference()
})

'toLocation'.default(async maint => {
  let res = await 'Location'.bringSingle({locationName: 'General'})
  return res.reference()
})

'TransferMaint'.readOnly( (maint, transfer) => {
  if ( ! transfer.isNew() )
    return 'Transfers cannot be altered - please add a new transfer instead'
})

'TransferMaint'.makeDestinationFor('Transfer')

'TransferMaint'.whenAdding(async function(transfer, maint) {

  let getProduct = async () => {
    let c = this.callerCast(); if ( ! c ) return null
    if ( c.datatype() === 'products' ) 
      return c
    if ( c.datatype() === 'Cluster' ) {
      let p = await c.toProduct()
      return p
    }
    if ( c.datatype() !== 'Inventory' ) return null
    let prodRef = c.product; if ( ! prodRef ) return null
    let prodId = prodRef.id; if ( ! prodId ) return null
    let res = await 'products'.bringSingle({id: prodId});
    return res
  }

  let getLocation = async () => {
    let c = this.callerCast(); if ( ! c ) return null
    if ( ! c.toLocation ) return null
    return await c.toLocation()
  }

  let defaultTransferNumber = async () => {
    let nextNo = await 'NextNumber'.bringOrCreate({forDatatype: 'Transfer'})
    let tfrNo
    while ( true ) {
      nextNo.number = nextNo.number + 1
      let noStr = nextNo.number + ""
      tfrNo = "TF" + noStr.padStart(5, '0')
      let tfr = await 'Transfer'.bringSingle({transferNumber: tfrNo})
      if ( ! tfr )
        break;
    }
    this.setFieldValue('transferNumber', tfrNo)
  }

  let refreshProduct = async () => {
    let p = await getProduct(); if ( ! p ) return
    let prodRef = p.reference()
    this.setFieldValue('product', prodRef)
  }

  let refreshFromLocation = async () => {
    let loc = await getLocation(); if ( ! loc ) return
    let locRef = loc.reference()
    this.setFieldValue('fromLocation', locRef)
  }

  await refreshProduct()
  await refreshFromLocation()
  await defaultTransferNumber()
  await transfer.refreshUnspecifiedLot()

})


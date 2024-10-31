'BulkTransferMaint'.maint()
'Bulk Transfer'.title()
'Back'.action({act: 'cancel'})
'OK'.action({act: 'ok'})
'Labels'.action({spec: 'Labels.js'})
'BulkTransfer'.datatype()
'bulkTransferNumber'.field({key: true})
'date'.field({date: true})
'fromLocation'.field({refersTo: 'Location', allowEmpty: false})
'toLocation'.field({refersTo: 'Location', allowEmpty: false})
'notes'.field({multiLine: true})

'BulkTransfer'.beforeSaving(async function() {

  let fromLocation = await this.referee('fromLocation')
  let toLocation = await this.referee('toLocation')
  let knt = 0

  let createTransfer = async product => {
    let inv = await product.toInventory(); if ( ! inv ) return
    let qty = await inv.locationToQuantityOnHand(fromLocation)
    if ( qty <= 0 ) 
      return
    knt++
    let tfrNo = this.bulkTransferNumber + '-' + global.padWithZeroes(knt, 5)
    let tfr = await 'Transfer'.create(null, {transferNumber: tfrNo})
    tfr.date = global.todayYMD()
    tfr.fromLocation = fromLocation.reference()
    tfr.toLocation = toLocation.reference()
    tfr.product = product.reference()
    tfr.quantity = qty
    tfr.notes = this.notes
  }

  let products = await 'products'.bring({bulkTransfer: 'Yes'})
  for ( var i = 0; i < products.length; i++ ) {
    await createTransfer(products[i])
  }
})

'fromLocation'.default(async maint => {
  let res = await 'Location'.bringSingle({locationName: 'General'})
  return res.reference()
})

'BulkTransferMaint'.readOnly( (maint, transfer) => {
  if ( (! transfer.isNew()) && transfer.changed() )
    return 'Bulk Transfers cannot be altered - please add a new transfer instead'
})

'BulkTransferMaint'.whenAdding(async function(transfer, maint) {

  let getLocation = async () => {
    let c = this.callerCast(); if ( ! c ) return null
    if ( ! c.toLocation ) return null
    return await c.toLocation()
  }

  let defaultBulkTransferNumber = async () => {
    let nextNo = await 'NextNumber'.bringOrCreate({forDatatype: 'BulkTransfer'})
    let tfrNo
    while ( true ) {
      nextNo.number = nextNo.number + 1
      let noStr = nextNo.number + ""
      tfrNo = "BT" + noStr.padStart(5, '0')
      let tfr = await 'BulkTransfer'.bringSingle({bulkTransferNumber: tfrNo})
      if ( ! tfr )
        break;
    }
    this.setFieldValue('bulkTransferNumber', tfrNo)
  }

  let refreshFromLocation = async () => {
    let loc = await getLocation(); if ( ! loc ) return
    let locRef = loc.reference()
    this.setFieldValue('fromLocation', locRef)
  }

  await refreshFromLocation()
  await defaultBulkTransferNumber()

})


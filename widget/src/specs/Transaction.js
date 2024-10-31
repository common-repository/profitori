'Transaction'.datatype({exportable: true})
'inventory'.field({refersToParent: 'Inventory'})
'product'.field({refersTo: 'products', indexed: true})
'quantity'.field({numeric: true})
'unitCost'.field({numeric: true, minDecimals: 2, maxDecimals: 6})
'value'.field({numeric: true, decimals: 2})
'source'.field()
'reference'.field({indexed: true})
'date'.field({date: true})
'userLogin'.field({caption: 'User'})
'notes'.field({multiLine: true})
'location'.field({refersTo: 'Location'})
'cluster'.field({refersTo: 'Cluster'})
'auditInfo'.field()
'morselId'.field()
'updatedToInventory'.field({yesOrNo: true})
'lot'.field({refersTo: 'Lot'})
'clump'.field({refersTo: 'Clump'})
'taxPct'.field({numeric: true, decimals: 2, caption: "Tax %"})
'supplier'.field({refersTo: 'Supplier', allowEmpty: true})
'createdDate'.field({date: true})
'createdTime'.field()

'Transaction.Recent'.subset(async () => {
  let config = await 'Configuration'.bringFirst()
  let weeks
  if ( config )
    weeks = config.transactionRecentWeeks
  if ( ! weeks )
    weeks = 12
  let fromDate = global.todayYMD().incDays(- (weeks * 7))
  let res
  res = {post_modified: {compare: '>=', value: fromDate}}
  return res
})

'Transaction'.method('toLocation', async function() {
  return await this.referee('location')
})

'Transaction'.method('toInventory', async function() {
  return await this.referee('inventory')
})

'Transaction'.method('toLot', async function() {
  return await this.referee('lot')
})

'Transaction'.method('toLotNumber', async function() {
  let lot = await this.toLot(); if ( ! lot ) return null
  return lot.lotNumber
})

'Transaction'.method('ensureProdRefComplete', async function() {
  if ( ! this.product ) return
  if ( this.product.id ) return
  let product = await 'products'.bringFirst({uniqueName: this.product.keyval})
  if ( ! product ) 
    throw(new Error('Invalid product ' + this.product.keyval))
  this.product.id = product.id
})

'Transaction'.beforeSaving(async function() {
  if ( this.updatedToInventory === 'Yes' ) return
  await this.updateToInventory()
})

'Transaction'.method('updateToInventory', async function() {
  if ( this._markedForDeletion ) return 

  let prodRef

  let updateWC = async () => {
    if ( this.source === "Sync to WC" ) return
    if ( this.source === "Sale" ) return
    let product = await 'products'.bringSingle({id: prodRef.id}); if ( ! product ) return // throw(new Error("Invalid product id: " + prodRef.id))
    product._stock = product._stock + this.quantity - this.getOld().quantity
    await global.app.stockClue({point: 1, cast: product, fieldName: '_stock', reference: this.reference})
  }

  let updateAvgUnitCost = async () => {
    if ( this.source === "Sync to WC" ) return
    if ( this.source === "Sale" ) return
    if ( this.source === "Consumed" ) return
    if ( inv.avgAlg === 'Dynamic Refresh' ) {
      let done = await inv.refreshAvgUnitCost()
      if ( done )
        return
    }
    if ( inv.quantityOnHand === 0 ) {
      //inv.avgUnitCost = 0
      if ( (this.unitCost !== global.unknownNumber()) && (this.unitCost > 0) )
        inv.avgUnitCost = this.unitCost
      return
    }
    if ( this.unitCost === global.unknownNumber() ) {
      if ( oldQuantityOnHand <= 0 ) {
        //inv.avgUnitCost = global.unknownNumber()
      }
      return
    }
    if ( inv.avgUnitCost === global.unknownNumber() ) {
      inv.avgUnitCost = this.unitCost
      return
    }
    let voh = (this.quantity * this.unitCost) + (oldQuantityOnHand * inv.avgUnitCost)
    inv.avgUnitCost = voh / inv.quantityOnHand
  }

  let checkSerialNumberQuantityOnHand = async () => {
    let serialNumber = await this.toLotNumber(); if ( ! serialNumber ) return
    if ( serialNumber === 'Unspecified' )
      return
    let qty = await inv.lotNumberToQuantityOnHand(serialNumber)
    if ( qty > 1 )
      throw(new Error('Serial Number'.translate() + ' ' + serialNumber + ' ' + 'is already in stock'.translate()))
  }

  let updateClump = async () => {
    let clump = await inv.locationAndLotRefsToClump(this.location, this.lot); if ( ! clump ) return
    this.clump = clump.reference()
    clump.quantityOnHand += qty
    if ( inv.lotTracking === 'Serial' ) {
      await checkSerialNumberQuantityOnHand()
    }
  }

  let updateCluster = async () => {
    let v = global.stEmulatingVersion
    if ( v && (v <= "1.5.1.0") ) return
    let cluster = await inv.locationRefToCluster(this.location); if ( ! cluster ) return
    this.cluster = cluster.reference()
    cluster.quantityOnHand += qty
    if ( inv.lotTracking && (inv.lotTracking !== 'None') )
      await updateClump()
  }

  let balanceClumps = async () => {
    let cluster = await inv.locationRefToCluster(this.location); if ( ! cluster ) return
    this.cluster = cluster.reference()
    await cluster.balanceClumps()
  }

/*
  let sourceToAbbrev = source => {
    if ( source === 'Made' ) {
      return 'MA'
    } else if ( source === 'Consumed' ) {
      return 'CS'
    } else if ( source === 'Sync to WC' ) {
      return 'SY'
    } else if ( (source === 'Sale') || (source === 'Serial/Lot Sale') ) {
      return 'SA'
    } else if ( source === 'Transfer' ) {
      return 'TR'
    } else if ( source === 'Adjustment' ) {
      return 'AD'
    } else if ( source === 'PO Receipt' ) {
      return 'PR'
    } else if ( source === 'Value Adjustment' ) {
      return 'VA'
    } else
      return 'JE'
  }

  let getOrCreateEntry = async (source, date) => {
    let sourceAbbrev = sourceToAbbrev(source)
    let entryNumber = sourceAbbrev + '-' + date
    let res = await 'Entry'.bringOrCreate({entryNumber: entryNumber})
    res.effectiveDate = date
    res.notes = source + ' ' + date.toLocalMMMDY()
    res.enteredDate = global.todayYMD()
    return res
  }

  let updateJournalEntry = async () => {
    let qty = this.quantity - this.getOld().quantity
    if ( qty === 0 )
      return
    let entry = await getOrCreateEntry(this.source, this.date)
    await entry.updateFromTransaction(this, qty)
  }
*/

  await this.ensureProdRefComplete()
  if ( ! this.userLogin ) {
    let sess = await 'session'.bringSingle()
    this.userLogin = sess.user
  }
  if ( ! this.location ) {
    let loc = await 'Location'.bringFirst({locationName: 'General'})
    this.location = loc.reference()
  }
  prodRef = this.product; if ( ! prodRef ) return
  let inv = await 'Inventory'.bringOrCreate({product: prodRef})
  let oldQuantityOnHand = inv.quantityOnHand
  let qty = this.quantity - this.getOld().quantity
  if ( (this.source !== "Sync to WC") && (this.source !== "Sale") ) { // quantityOnHand is already updated for these
    inv.quantityOnHand += qty
    await global.app.stockClue({point: 9, cast: inv, fieldName: 'quantityOnHand', reference: this.reference})
    await updateCluster()
    if ( (this.source !== "Made") && (this.source !== "Consumed") )
      await updateWC()
    this.inventory = inv.reference()
  } else {
    oldQuantityOnHand -= qty
    if ( inv.lotTracking && (inv.lotTracking !== 'None') ) {
      await balanceClumps()
    }
  }
  await updateAvgUnitCost()
  //await updateJournalEntry()
  if ( this.isNew() && ((! this.createdDate) || this.createdDate.isEmptyYMD()) ) {
    this.createdDate = global.todayYMD()
    this.createdTime = global.nowHMS()
  }
  this.updatedToInventory = 'Yes'

})

'value'.calculate(async transaction => {
  if ( transaction.unitCost === global.unknownNumber() )
    return global.unknownNumber()
  return transaction.quantity * transaction.unitCost
})

'Transaction'.method('getSourceDatatype',

  async function() {
    let s = this.source
    if ( s === 'PO Receipt' )
      return 'PO'
    if ( s === 'Adjustment' )
      return 'Adjustment'
    if ( s === 'Transfer' )
      return 'Transfer'
    if ( s === 'Location' )
      return 'Location'
    if ( s === 'Sale' )
      return 'orders'
    if ( s === 'Made' )
      return 'orders'
    if ( s === 'Consumed' )
      return 'orders'
    if ( s === 'Value Adjustment' )
      return 'Evaluation'
    return s
  }

)

'reference'.destination(async transaction => {
  let dt = await transaction.getSourceDatatype(); if ( ! dt ) return
  let c = await dt.bringFirst({key: transaction.reference})
  return c
})

'Transaction'.method('toLocationName', async function () {
  let loc = await this.referee('location'); if ( ! loc ) return null
  return loc.locationName
})

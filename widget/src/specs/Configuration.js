'Configuration'.datatype({singleton: true, plex: false})
'i5'.field({yesOrNo: true})
'ifx'.field({yesOrNo: true})
'viewFromDate'.field({date: true, allowEmpty: true})
'viewToDate'.field({date: true, allowEmpty: true})
'usersWithAccess'.field({caption: "Grant Profitori access to these users only (comma separated)", adminOnly: true})
'businessName'.field()
'phoneNumber'.field()
'email'.field()
'deliveryAddress'.field()
'deliveryCity'.field()
'deliveryState'.field()
'deliveryPostcode'.field()
'deliveryCountry'.field()
'shortDateFormat'.field()
'salesProjectionPriorWeeks'.field({numeric: true, caption: 'Weeks of Prior Sales to use for Sales Projections'})
'salesAnalysisPriorWeeks'.field({numeric: true, caption: 'Weeks of Prior Sales to use for Sales Analysis'})
'salesRecentWeeks'.field({numeric: true})
'lastPriorWeeksUsed'.field({numeric: true})
'enterPurchasePricesInclusiveOfTax'.field({yesOrNo: true})
'srDate'.field({date: true, allowEmpty: true})
'displayDatesUsingShortDateFormat'.field({yesOrNo: true})
'databaseOptimized'.field({yesOrNo: true})
'poPdfLogoUrl'.field()
'defaultStockingUOM'.field({refersTo: 'UOM', caption: 'Default Stocking Unit of Measure'})
'showUOMOnPOLines'.field({yesOrNo: true, caption: 'Show Unit of Measure on PO Lines'})
'ipu'.field({yesOrNo: true})
'sortPOPdfBySupplierSku'.field({yesOrNo: true, caption: 'Sort PO PDF by Supplier SKU'})
'mainCalendar'.field({refersTo: 'Calendar'})
'standardAccountsCreated'.field({yesOrNo: true})
'calendarCreated'.field({yesOrNo: true})
'standardStatementsCreated'.field({yesOrNo: true})
'controlAccessAtPageLevel'.field({yesOrNo: true})
'ipm'.field({yesOrNo: true})
'storeAttachmentsInSecureLocation'.field({yesOrNo: true})
'attachmentsPathOnServer'.field({caption: 'Secure Path (local to the server) for Attachments'})
'useAttachmentSubfolders'.field({yesOrNo: true, caption: 'Store In Subfolders By Supplier/Customer By Document Number'})
'suppressPOQuantityOnHandUpdates'.field({yesOrNo: true})
'ied'.field({yesOrNo: true})
'viewSalesHistoryInPurchasing'.field({yesOrNo: true, caption: 'View Sales History When Entering PO Lines'})
'excludeTaxFromPOPdf'.field({yesOrNo: true, caption: 'Exclude Tax from PO PDF'})
'alwaysCreateInventoryRecord'.field({yesOrNo: true, caption: 'Create Profitori Inventory Records For All WC Products'})
'startPOReceiptsAsZero'.field({yesOrNo: true, caption: 'Start PO Receipts As Zero'})
'lmlDate'.field({date: true, allowEmpty: true})
'transactionRecentWeeks'.field({numeric: true, caption: 'Weeks of Inventory Transaction History To Show'})
'cdr'.field({yesOrNo: true, caption: 'Classic Data Retrieval'})
'crn'.field({caption: 'Company Registration Number'})
'ibn'.field({caption: 'IBAN'})
'bur'.field({caption: "Invoice PDF Background Image URL"})
'asd'.field({caption: "Automatically Show Discounts In Store", yesOrNo: true})
'ump'.field({caption: "Use Markup Pricing", yesOrNo: true})
'ptr'.field({caption: "Track PO Stage and Status Transitions", yesOrNo: true})
'pca'.field()
'trb'.field({caption: 'Turbo Mode'})
'tbs'.field({caption: 'Turbo Mode Status'})
'tbi'.field({caption: 'Turbo Mode Initiated', yesOrNo: true})
'spt'.field({caption: 'Show Payment Terms', yesOrNo: true})
'pte'.field({caption: 'Payment Terms'})

'tbs'.inception('Active')

'trb'.inception('Profitori Data Only')

'trb'.options(['Off', 'Profitori Data Only'])

'Configuration'.method('useClassicDataRetrieval', function() {
  if ( global.foreman.constituent )
    return true
  return this.cdr === 'Yes'
})

'salesRecentWeeks'.calculate(async configuration => {
  let res = configuration.salesProjectionPriorWeeks
  if ( configuration.salesAnalysisPriorWeeks && (configuration.salesAnalysisPriorWeeks > res) )
    res = configuration.salesAnalysisPriorWeeks
  if ( ! res )
    res = 4
  return res
})

'Configuration'.method('getMainCalendar', async function(options) {
  if ( ! this.mainCalendar ) return null
  let res = await this.referee('mainCalendar')
  return res
})

'Configuration'.method('getCurrentPeriod', async function(options) {
  let year = await this.getCurrentYear(options); if ( ! year ) return null
  return await year.toCurrentPeriod(options)
})

'Configuration'.method('getCurrentYear', async function(options) {
  if ( ! this.mainCalendar ) return null
  let calendar = await this.referee('mainCalendar')
  return await calendar.getCurrentYear(options)
})

'Configuration'.method('getFinancialYearStartDate', async function() {
  let year = await this.getCurrentYear()
  let period = await year.getFirstPeriod()
  return period.startDate
})

'Configuration'.method('toDefaultStockingUOM', async function() {
  return await this.referee('defaultStockingUOM')
})

'databaseOptimized'.calculate(async config => {
  let sess = await 'session'.bringSingle()
  return sess.databaseIsOptimized ? 'Yes' : 'No'
})

'Configuration'.method('getFullDeliveryAddress',
  async function() {
    let res = this.businessName
    res = global.appendStr(res, this.deliveryAddress, ", ")
    res = global.appendStr(res, this.deliveryCity, ", ")
    res = global.appendStr(res, this.deliveryState, ", ")
    res = global.appendStr(res, this.deliveryPostcode, " ")
    res = global.appendStr(res, this.deliveryCountry, ", ")
    return res
  }
)

'Configuration'.afterRetrievingFast(function() {
  if ( this.viewFromDate === global.invalidYMD() )
    this.viewFromDate = global.emptyYMD()
  if ( this.viewToDate === global.invalidYMD() )
    this.viewToDate = global.emptyYMD()
  return true
})

'Configuration'.afterRetrieving(async function() {
  if ( ! this.zoomPct )
    this.zoomPct = '100'
})

'Configuration'.beforeSaving(async function() {
  if ( this.storeAttachmentsInSecureLocation === 'Yes' ) {
    if ( ! this.attachmentsPathOnServer ) 
      throw(new Error('Please specify a path to store attachments at on the server'))
    if ( ! this.attachmentsPathOnServer.startsWith('/') ) 
      throw(new Error('The attachments path must be an absolute path (starting with /)'))
  }
})

'Configuration'.afterSaving(async function() {
  global.refreshShortDateFormat()
  global.refreshLanguage()
  //global.refreshTheming()
})

'Configuration'.afterCreating(async function() {
  this.shortDateFormat = 'Browser default'
  this.salesProjectionPriorWeeks = 12
  this.salesAnalysisPriorWeeks = 12
  this.transactionRecentWeeks = 12
  this.enterPurchasePricesInclusiveOfTax = "Yes"
  this.preIncTax = "Yes"
  this.treatOldIncompleteOrdersAsInactive = 'Yes'
  this.prDateType = 'Order Payment Date'
})

'shortDateFormat'.options(["Browser default", "dd/mm/yyyy", "mm/dd/yyyy", "yyyy/mm/dd"])

'Configuration'.method('getSalesProjectionPriorWeeks', async function() {
  let res = this.salesProjectionPriorWeeks
  if ( ! res )
    res = 4
  return res
})

'Configuration'.method('getSalesAnalysisPriorWeeks', async function() {
  let res = this.salesAnalysisPriorWeeks
  if ( ! res )
    res = 4
  return res
})

'Configuration'.method('refreshPackables', async function() {

  let orders

  let zeroQuantitiesAllocated = async opt => {
    for  ( let i = 0; i < orders.length; i++ ) {
      let order = orders[i]
      let isActive = order.isActiveFast(); if ( ! isActive ) continue
      let so = order.toSOFast();
      if ( ! so )
        so = await order.toSO(); 
      if ( ! so ) continue
      await so.refreshPackable({unallocate: true})
    }
  }

  let doIt = async opt => {
    if ( ! opt )
      opt = {}
    let pass = opt.pass
    if ( pass === -1 )
      opt.preallocated = true
    else
      opt.preallocated = false
    for  ( let i = 0; i < orders.length; i++ ) {
      let order = orders[i]
      let isActive = order.isActiveFast(); if ( ! isActive ) continue
      let so = order.toSOFast();
      if ( ! so )
        so = await order.toSO(); 
      if ( ! so ) continue
      if ( pass === 2 ) {
        if ( so.packable === 'Yes' ) continue
      }
      await so.refreshPackable(opt)
      if ( (pass === 1) && (so.packable === 'Partially') ) {
        // Prioritize orders that can be fully packed
        await so.refreshPackable({unallocate: true})
      }
    }
  }

  let soIsDuplicate = async so => {
    let sos = await 'SO'.bring({order: so.order})
    if ( sos.length <= 1 ) return false
    let firstSO = sos[0]
    if ( so.id === firstSO.id ) return false
    return true
  }

  let deleteDuplicateSOs = async () => {
    let sos = await 'SO'.bring()
    for ( var i = 0; i < sos.length; i++ ) {
      let so = sos[i]
      if ( ! await so.isActive() ) continue
      if ( ! await soIsDuplicate(so) ) continue
      if ( so.retired !== 'Yes' )
        await so.retire()
      await so.trash()
    }
  }

  let getClustersThatHaveActiveSalesOrders = async () => {
    let res = []
    let clusters = await 'Cluster'.bring()
    for ( let i = 0; i < clusters.length; i++ ) {
      let cluster = clusters[i]
      if ( cluster.quantityReservedForCustomerOrders === 0 ) continue
      res.push(cluster)
    }
    return res
  }

  let shipmentLinesToQuantityShippedInCurrentShipment = (shipmentLines, so, soLine) => {
    let res = soLine.quantityShipped
    for ( var i = 0; i < shipmentLines.length; i++ ) {
      let shipmentLine = shipmentLines[i]
      let shipmentNumber = shipmentLine.shipmentNumber.keyval
      if ( shipmentNumber !== so.latestShipmentNumber )
        res -= shipmentLine.quantityShipped
    }
    return res
  }

  let soLineToQuantityShippedInCurrentShipment = async soLine => {
    let so = await soLine.toSO(); if ( ! so ) return 0
    let shipmentLines = await soLine.toShipmentLines()
    return shipmentLinesToQuantityShippedInCurrentShipment(shipmentLines, so, soLine)
  }

  let soLineToQuantityShippedInCurrentShipmentFast = soLine => {
    let so = soLine.toSOFast() 
    if ( (! so) || (so === 'na') ) 
      return 'na'
    let shipmentLines = soLine.toShipmentLinesFast()
    if ( (! shipmentLines) || (shipmentLines === 'na') ) 
      return 'na'
    return shipmentLinesToQuantityShippedInCurrentShipment(shipmentLines, so, soLine)
  }

  let soLinesToQuantityShippedInOtherShipments = async soLines => {
    let res = 0
    for ( let i = 0; i < soLines.length; i++ ) {
      let soLine = soLines[i]
      let qty = soLine.quantityShipped - (await soLineToQuantityShippedInCurrentShipment(soLine))
      res += qty
    }
    return res
  }

  let soLinesToQuantityShippedInOtherShipmentsFast = soLines => {
    let res = 0
    for ( let i = 0; i < soLines.length; i++ ) {
      let soLine = soLines[i]
      let qty = soLineToQuantityShippedInCurrentShipmentFast(soLine)
      if ( qty === 'na' )
        return 'na'
      qty = soLine.quantityShipped - qty
      res += qty
    }
    return res
  }

  let soLinesToUnsatisfiedSOLines = async soLines => {
    let res = []
    for ( let i = 0; i < soLines.length; i++ ) {
      let soLine = soLines[i]
      let quantityShippedInCurrentShipment = await soLineToQuantityShippedInCurrentShipment(soLine)
      let required = soLine.quantityRemainingToShip + quantityShippedInCurrentShipment - soLine.divvy
      if ( required <= 0 ) 
        continue
      res.push(soLine)
    }
    return res
  }

  let soLinesToTotalAllocationPct = async soLines => {
    let res = 0
    for ( let i = 0; i < soLines.length; i++ ) {
      let soLine = soLines[i]
      let pct = await soLine.toPreallocationPct()
      res += pct
    }
    return res
  }

  let refreshDivvyPcts = async (aSoLines, options) => {
    let firstPass = options && options.firstPass
    let soLines = aSoLines
    if ( ! firstPass )
      soLines = await soLinesToUnsatisfiedSOLines(aSoLines)
    let totalPct = await soLinesToTotalAllocationPct(soLines)
    for ( let i = 0; i < soLines.length; i++ ) {
      let soLine = soLines[i]
      soLine.divvyPct = 0
      if ( totalPct === 0 )
        continue
      let allocationPct = await soLine.toPreallocationPct()
      soLine.divvyPct = allocationPct * (100 / totalPct)
    }
    return totalPct
  }

  let clusterToSOLines = async cluster => {
    let product = await cluster.toProduct(); if ( ! product ) return []
    let soLines = await 'SOLine'.bring({product: product.reference()})
    let res = []
    for ( let i = 0; i < soLines.length; i++ ) {
      let soLine = soLines[i]
      let location = await soLine.toShipFromLocation()
      if ( cluster.location.id !== location.id ) continue
      res.push(soLine)
    }
    return res
  }

  let clusterToSOLinesFast = cluster => {
    let product = cluster.toProductFast() 
    if ( (! product) || (product === 'na') ) 
      return 'na'
    let soLines = 'SOLine'.retrieveFast({product: product.reference()})
    if ( soLines === 'na' )
      return 'na'
    let res = []
    for ( let i = 0; i < soLines.length; i++ ) {
      let soLine = soLines[i]
      let location = soLine.toShipFromLocationFast()
      if ( (! location) || (location === 'na') )
        return 'na'
      if ( cluster.location.id !== location.id ) continue
      res.push(soLine)
    }
    return res
  }

  let divvyCluster = async cluster => {
    let soLines = clusterToSOLinesFast(cluster)
    if ( soLines === 'na' )
      soLines = await clusterToSOLines(cluster)
    for ( let i = 0; i < soLines.length; i++ ) {
      let soLine = soLines[i]
      let quantityShippedInCurrentShipment = soLineToQuantityShippedInCurrentShipmentFast(soLine)
      if ( quantityShippedInCurrentShipment === 'na' )
        quantityShippedInCurrentShipment = await soLineToQuantityShippedInCurrentShipment(soLine)
      soLine.quantityShippedInCurrentShipment = quantityShippedInCurrentShipment
      soLine.divvy = 0
    }
    let totalQuantityShippedInOtherShipments = soLinesToQuantityShippedInOtherShipmentsFast(soLines)
    if ( totalQuantityShippedInOtherShipments === 'na' )
      totalQuantityShippedInOtherShipments = await soLinesToQuantityShippedInOtherShipments(soLines)
    let pot = cluster.quantityPickable - totalQuantityShippedInOtherShipments
    let potRemaining = pot
    let totalPct = await refreshDivvyPcts(soLines, {firstPass: true})
    if ( totalPct === 0 )
      return
    for ( let i = 0; i < soLines.length; i++ ) {
      let soLine = soLines[i]
      let required = soLine.quantityRemainingToShip + soLine.quantityShippedInCurrentShipment
      let allowed = Math.round(pot * (soLine.divvyPct / 100)) - soLine.quantityShippedInCurrentShipment
      if ( allowed < 0 )
        allowed = 0
      soLine.divvy = Math.min(required, allowed) 
      potRemaining -= (soLine.divvy + soLine.quantityShippedInCurrentShipment)
      if ( potRemaining < 0 ) {
        soLine.divvy += potRemaining
        if ( soLine.divvy < 0 )
          soLine.divvy = 0
        potRemaining = 0
      }
    }
    while ( potRemaining > 0 ) {
      let dregs = potRemaining
      let dregsRemaining = dregs
      await refreshDivvyPcts(soLines)
      for ( let i = 0; i < soLines.length; i++ ) {
        let soLine = soLines[i]
        let required = soLine.quantityRemainingToShip + soLine.quantityShippedInCurrentShipment
        let allowed = Math.round(dregs * (soLine.divvyPct / 100))
        let totalAllowed = allowed + soLine.divvy
        let newDivvy = Math.min(required, totalAllowed) 
        let divvyChg = newDivvy - soLine.divvy
        if ( divvyChg > dregsRemaining ) 
          divvyChg = dregsRemaining
        soLine.divvy += divvyChg
        if ( soLine.divvy < 0 )
          soLine.divvy = 0
        dregsRemaining -= divvyChg
      }
      if ( dregsRemaining === dregs )
        break
      potRemaining = dregsRemaining
    }
  }


  let divvy = async () => {
    let clusters = await getClustersThatHaveActiveSalesOrders() 
    for ( var i = 0; i < clusters.length; i++ ) {
      let cluster = clusters[i]
      await divvyCluster(cluster)
    }
  }

  global.refreshingPackables = true
  try {
    await global.foreman.doSave({msgOnException: true}) // So that stock that needs to be moved based on SOLine location changes is moved
    orders = await 'orders.RecentOrActive'.bring()
    orders.sort((a, b) => a.order_date > b.order_date ? 1 : -1)
    await deleteDuplicateSOs()
    await zeroQuantitiesAllocated()
    let thereAreAllocations = ((await 'Allocation'.bring()).length > 0)
    if ( thereAreAllocations ) {
      await divvy()
      await doIt({pass: -1})
    }
    if ( this.prioritizeOrderCompletion === 'Yes' ) {
      await doIt({pass: 1})
      await doIt({pass: 2})
    } else {
      await doIt()
    }
    await global.foreman.doSave({msgOnException: true})
  } finally {
    global.refreshingPackables = false
  }

})

'Configuration'.method("getPackingListCasts", async output => {

  let soAndLocToPackingList = async (so, loc) => {
    let orderId = await so.toOrderId()
    let packingLists = await 'PackingList'.bring({orderId: orderId})
    for ( var i = 0; i < packingLists.length; i++ ) {
      let packingList = packingLists[i]
      if ( packingList.shipFromLocationName === loc.locationName )
        return packingList
    }
    return null
  }

  let createPackingList = async (so, loc) => {
    let res = await 'PackingList'.create()
    res.orderId = await so.toOrderId()
    res.shipFromLocationName = loc.locationName
    res.orderDate = so.orderDate
    res.shippingNameAndCompany = so.shippingNameAndCompany
    res.shippingAddress = so.shippingAddress
    res.shippingEmailAndPhone = so.shippingEmailAndPhone
    res.notes = so.notes
    res.customerReference = so.customerReference
    return res
  }

  let addSOLineToPackingList = async (packingList, soLine) => {
    let packingListLine = await 'PackingListLine'.create({parentCast: packingList}, {packingList: packingList.reference()})
    packingListLine.soLine = soLine.reference()
    packingListLine.sequence = soLine.sequence
    packingListLine.descriptionAndSKU = soLine.descriptionAndSKU
    packingListLine.quantityOrdered = soLine.quantityOrdered
    packingListLine.quantityRemainingToShip = soLine.quantityRemainingToShip
    packingListLine.quantityToPick = soLine.quantityToPick
    packingListLine.quantityToMake = soLine.quantityToMake
  }

  let addSOLineToPackingLists = async soLine => {
    let so = await soLine.toSO()
    if ( so.include !== 'Yes' ) return
    let loc = await soLine.toShipFromLocation()
    let packingList = await soAndLocToPackingList(so, loc)
    if ( ! packingList )
      packingList = await createPackingList(so, loc)
    await addSOLineToPackingList(packingList, soLine)
  }

  let addSOToPackingLists = async so => {
    let lines = await so.getLines()
    for ( var i = 0; i < lines.length; i++ ) {
      let line = lines[i]
      await addSOLineToPackingLists(line)
    }
  }

  let createPackingLists = async () => {
    let orders = await 'orders.RecentOrActive'.bring()
    for ( var i = 0; i < orders.length; i++ ) {
      updateProgress((i / orders.length) * 0.5)
      let order = orders[i]
      if ( ! await order.isActive() ) continue
      let so = await order.toSO(); if ( ! so ) continue
      await addSOToPackingLists(so)
    }
  }

  let setFulfillStagesToPacking = async () => {
    let packingListLines = await 'PackingListLine'.bring()
    for ( var i = 0; i < packingListLines.length; i++ ) {
      updateProgress(0.5 + ((i / packingListLines.length) * 0.4))
      let packingListLine = packingListLines[i]
      let soLine = await packingListLine.referee('soLine')
      soLine.fulfillStage = 'Packing'
      let so = await soLine.toSO()
      so.fulfillStage = 'Packing'
    }
    await global.foreman.doSave({msgOnException: true})
  }

  let updateProgress = async (complete) => {
    await global.updateProgress(complete)
    await global.wait(1)
  }

  global.startProgress({message: 'Generating Packing Lists'})
  try {
    'PackingList'.clear()
    await createPackingLists()
    updateProgress(0.5)
    await setFulfillStagesToPacking()
    updateProgress(0.95)
    return await 'PackingList'.bring()
  } catch(e) {
    global.gApp.showMessage(e.message)
  } finally {
    global.stopProgress()
  }
})

'Configuration'.method('prodRefToUnspecifiedLot', async function(product) {

  let getUnspecifiedLot = async () => {
    let lots = await 'Lot'.bring({product: product})
    for ( var i = 0; i < lots.length; i++ ) {
      let lot = lots[i]
      if ( lot.lotNumber === 'Unspecified' )
        return lot
    }
    return null
  }

  let res = await getUnspecifiedLot()
  if ( res )
    return res
  res = await 'Lot'.create(null, {product: product, lotNumber: 'Unspecified'})
  return res
})

'Configuration'.method('balanceAllotments', async function(parent) {

  let allotments

  let getAllotments = async () => {
    let res = await 'Allotment'.bringChildrenOf(parent)
    return res
  }

  let removeAllotments = async () => {
    for ( var i = 0; i < allotments.length; i++ ) {
      let a = allotments[i]
      await a.trash()
    }
  }

  let getSpecifiedQuantity = async () => {
    let res = 0
    for ( var i = 0; i < allotments.length; i++ ) {
      let a = allotments[i]
      let lot = await a.referee('lot')
      if ( lot && (lot.lotNumber === 'Unspecified') ) continue
      res += a.quantity
    }
    return res
  }

  let getUnspecifiedAllotment = async () => {
    for ( var i = 0; i < allotments.length; i++ ) {
      let a = allotments[i]
      let lot = await a.referee('lot'); if ( ! lot ) continue
      if ( lot.lotNumber === 'Unspecified' ) 
        return a
    }
    return null
  }

  let getOrCreateUnspecifiedAllotment = async () => {
    let res = await getUnspecifiedAllotment()
    if ( res )
      return res
    res = await 'Allotment'.create({parentCast: parent}, {allotmentParent: parent.reference()})
    res.allotmentParent = parent.reference()
    let lot = await this.prodRefToUnspecifiedLot(parent.product)
    res.lot = lot.reference()
    return res
  }

  let trashZeroAllotments = async () => {
    for ( var i = 0; i < allotments.length; i++ ) {
      let a = allotments[i]
      if ( a.quantity !== 0 ) continue
      await a.trash()
    }
  }

  allotments = await getAllotments()
  await parent.refreshCalculations({force: true, includeDefers: true})
  if ( parent.hasLots !== 'Yes' ) {
    await removeAllotments()
    return
  }
  let specified = await getSpecifiedQuantity()
  let quantity = await parent.toMainQuantity()
  let unspecQuantity = quantity - specified
  let unspecifiedAllotment = await getOrCreateUnspecifiedAllotment(); if ( ! unspecifiedAllotment ) return
  unspecifiedAllotment.quantity = unspecQuantity
  await trashZeroAllotments()
})
  
'Configuration'.method('condense', async function() {

  let condenseNextBatch = async () => {
    let msg = 'global_condense_pdo'
    let req = {
      methodWithParms: "stocktend_object",
      msgToServer: msg,
      json: {}
    }
    let serverRes = await global.server.doPost(req, null) 
    if ( (! serverRes) || (serverRes === 'error') )
      throw(new Error('The server had problems preparing turbo mode.'.translate()))
    return parseInt(serverRes.data, 10)
  }

  let doIt = async () => {
    let remainingRows = await condenseNextBatch()
    let rowCount = remainingRows + 1000
    let rowsDone = 0
    while ( remainingRows > 0 ) {
      rowsDone += 1000
      await global.updateProgress(rowsDone / rowCount)
      let lastRemainingRows = remainingRows
      remainingRows = await condenseNextBatch()
      if ( remainingRows >= lastRemainingRows )
        throw(new Error('Unexpected error switching to turbo mode'))
    }
  }

  global.startProgress({message: "Preparing Turbo Mode"})
  try {
    try {
      await doIt()
      this.tbs = 'Active'
      global.app.save()
    } finally {
      global.stopProgress()
    }
  } catch(e) {
    global.app.showMessage(e.message)
  }
})


require('./Globals.js')

export default class Harmonizer {

  async harmonize(aOptions) {

    let morsels
    let generalLocation
    let didRefreshSales

    let retireOldSOs = async () => {
      let sos = await 'SO'.bring()
      for ( var i = 0; i < sos.length; i++ ) {
        let so = sos[i]
        if ( so.retired === 'Yes' ) continue
        let order = await so.toOrder()
        let isActive = order && order.isActiveFast()
        if ( ! isActive ) {
          await so.retire()
        }
      }
    }

    let syncSOLine = async (orderItem, morsel) => {
      let order
      let so
      if ( ! orderItem ) {
        // order item deletion
        let orderId = morsel.order_id; if ( ! orderId ) return
        order = await 'orders.RecentOrActive'.bringSingle({id: orderId}); if ( ! order ) return
        so = await 'SO'.bringSingle({order: order}); if ( ! so ) return
        await so.syncToOrder()
        return
      }
      if ( ! orderItem ) return
      let isActive = await orderItem.isActive()
      if ( ! isActive ) 
        return
      order = await orderItem.toOrder()
      if ( ! order ) 
        return
      so = await 'SO'.bringOrCreate({order: order})
      await so.syncToOrder()
    }

    let createTransactionsForPreempts = async (morsel, orderItem) => {
      if ( ! morsel.order_item_id ) return
      if ( ! orderItem ) return
      let preempts = await 'Preempt'.bring({order_item_id: morsel.order_item_id})
      preempts.sort((a, b) => a.id > b.id ? 1 : -1) // ascending id order, so that lower level costs get updated before higher levels
      // NOTE: consumption preempts are created before make preempts, hence ascending id order is used
      for ( var i = 0; i < preempts.length; i++ ) {
        let preempt = preempts[i]
        if ( ! preempt.quantity ) continue
        if ( preempt.transactionCreated === 'Yes' ) continue
        let product = await 'products'.bringSingle({id: preempt.product_id}); if ( ! product ) continue
        let inv = await product.toInventory({allowCreate: true})
        let tran = await 'Transaction'.create()
        tran.product = product.reference()
        tran.date = orderItem.order_date
        tran.quantity = preempt.quantity
        tran.source = preempt.madeOrConsumed === 'made' ? 'Made' : 'Consumed'
        if ( tran.source === 'Consumed' )
          tran.unitCost = inv.avgUnitCost
        else
          tran.unitCost = await product.toBundleTotalCost()
        tran.reference = orderItem ? orderItem.theOrder.id : null
        tran.inventory = inv.reference()
        tran.auditInfo = morsel.id + ', ' + global.foreman.uuid() + ', ' + (new Date()).toLocaleTimeString()
        tran.morselId = morsel.id
        tran.userLogin = morsel.user_login
        tran.createdDate = morsel.toDate()
        tran.createdTime = morsel.toHMS()
        preempt.transactionCreated = 'Yes'
        await tran.updateToInventory()
      }
    }

    let syncOrderIdSO = async orderId => {
      let order = await 'orders.RecentOrActive'.bringSingle({id: orderId}); if ( ! order ) return
      let so = await 'SO'.bringSingle({order: order}); if ( ! so ) return
      await so.syncToOrder()
    }

    let morselsContainSales = morsels => {
      for ( var i = 0; i < morsels.length; i++ ) {
        let morsel = morsels[i]
        if ( morsel._markedForDeletion ) continue
        if ( morsel.morsel_type === 'order' ) 
          return true
        if ( morsel.morsel_type === 'sale' ) 
          return true
      }
      return false
    }

    let createSalesTransactions = async () => {
      console.log("Creating sales transactions (" + morsels.length + ")...")
      for ( var i = 0; i < morsels.length; i++ ) {
        let morsel = morsels[i]
        if ( morsel._markedForDeletion ) continue
        if ( morsel.morsel_type === 'order' ) {
          await syncOrderIdSO(morsel.order_id)
          await morsel.trash()
          continue
        }
        if ( morsel.morsel_type !== 'sale' ) continue;
        let product = await 'products'.bringSingle({id: morsel.product_id}); 
        if ( ! product ) {
          await morsel.trash()
          continue;
        }
        global.inventorySyncOff = true
        let inventory
        try {
          inventory = await 'Inventory'.bringOrCreate({product: product})
        } finally {
          global.inventorySyncOff = false
        }
        if ( ! inventory ) continue
        let orderItem = await 'order_items.RecentOrActive'.bringSingle({id: morsel.order_item_id}, {includeMarkedForDeletion: true})
        await createTransactionsForPreempts(morsel, orderItem)
        await inventory.refreshSalesUnits()
        await inventory.refreshQuantityReservedForCustomerOrders({refreshClusters: true})
        await syncSOLine(orderItem, morsel)
        if ( ! morsel.quantity ) {
          await morsel.trash()
          continue;
        }
        let tran = await 'Transaction.Recent'.bringFirst({morselId: morsel.id})
        if ( tran ) {
          await morsel.trash()
          continue;
        }
        tran = await 'Transaction'.create()
        tran.product = product.reference()
        tran.date = orderItem ? orderItem.order_date : global.todayYMD()
        tran.quantity = morsel.quantity
        tran.unitCost = inventory.avgUnitCost
        tran.source = 'Sale'
        tran.reference = orderItem ? orderItem.theOrder.id : null
        tran.inventory = inventory.reference()
        tran.auditInfo = morsel.id + ', ' + global.foreman.uuid() + ', ' + (new Date()).toLocaleTimeString()
        tran.morselId = morsel.id
        inventory.quantityOnHand += tran.quantity
        await global.app.stockClue({point: 7, cast: inventory, fieldName: 'quantityOnHand', reference: tran.reference})
        let allCluster = await inventory.locationNameToCluster('General')
        if ( allCluster ) {
          tran.cluster = allCluster.reference()
          tran.location = allCluster.location
          allCluster.quantityOnHand += tran.quantity
        }

        await morsel.trash()
      }
    }

    let save = async () => {
      let err = await global.foreman.doSave()
      if ( err )
        throw(new Error(err))
    }

    let doIncrementalHarmonize = async () => {
      console.log("Doing incremental harmonize")
      morsels = await 'Morsel'.bring()
      for ( var i = 0; i < morsels.length; i++ ) {
        let morsel = morsels[i]
        if ( morsel.morsel_type !== 'manual' ) continue;
        let productId = morsel.product_id; 
        if ( ! productId ) {
          await morsel.trash()
          continue;
        }
        let product = await 'products'.bringSingle({id: productId}); 
        if ( ! product ) {
          await morsel.trash()
          continue;
        }
        let inventory = await 'Inventory'.bringOrCreate({product: product})
        if ( global.confVal('highConcurrency') === 'Yes' )
          await global.app.pingServer() // Added 26/09/2022 to ensure latest product _stock level is retrieved
        await inventory.syncToProduct(morsel)
        await morsel.trash()
        if ( 
          (inventory.quantityOnHand === inventory.getOld().quantityOnHand) &&
          (inventory.minQuantity === inventory.getOld().minQuantity)
        ) 
          continue
        if ( ((i % 100) === 0) || (i === (morsels.length - 1)) ) {
          await save()
          await global.updateProgress(i / morsels.length)
          await global.wait(100)
        }
      }
      await save()
    }

    let refreshQuantitiesPickable = async () => {
      console.log("Refreshing pickable quantities")
      let invs = await 'Inventory'.bring()
      for ( var i = 0; i < invs.length; i++ ) {
        let inv = invs[i]; if ( ! inv ) continue
        await inv.removeDuplicateClusters()
        await inv.refreshQuantityReservedForCustomerOrders({refreshClusters: true})
        await inv.refreshQuantityAllocated({refreshClusters: true})
        await inv.refreshQuantityPickable({refreshClusters: true})
        if ( ((i % 100) === 0) || (i === (invs.length - 1)) ) {
          try {
            await save()
          } catch(e) {
            global.gApp.showMessage("There was a problem saving your data: " + e.message)
            return
          }
          await global.updateProgress(0.25 + ((i / invs.length) * 0.5))
          await global.wait(100)
        }
      }
    }

    let doFullHarmonize = async () => {
      let products = await 'products'.bring()
      if ( products.length === 0 ) {
        global.gApp.showMessage("You currently have no WooCommerce products set to 'Manage Stock'. " +
          "Please tick 'Manage Stock' in the WooCommerce Inventory tab of each product that you want to see in Profitori.")
        return
      }
      let alwaysCreateInventoryRecord = global.confVal('alwaysCreateInventoryRecord')
      console.log("Doing full harmonize")
      for ( var i = 0; i < products.length; i++ ) {
        let p = products[i]
        let inv = await 'Inventory'.bringSingle({product: p})
        if ( alwaysCreateInventoryRecord !== 'Yes' ) {
          if ( (! inv) && (! p._stock) ) continue;
        }
        if ( ! inv ) {
          inv = await 'Inventory'.bringOrCreate({product: p})
        }
        await inv.syncToProduct()
        if ( ((i % 50) === 0) || (i === (products.length - 1)) ) {
          try {
            await save()
          } catch(e) {
            global.gApp.showMessage("There was a problem saving your data: " + e.message)
            return
          }
          await global.updateProgress((i / products.length) * 0.25)
          await global.wait(100)
        }
        if ( 
          (inv.quantityOnHand === inv.getOld().quantityOnHand) &&
          (inv.minQuantity === inv.getOld().minQuantity)
        ) 
          continue
      }
      try {
        await save()
      } catch(e) {
        global.gApp.showMessage("There was a problem saving your data: " + e.message)
        return
      }
      await refreshQuantitiesPickable()
      let config = await 'Configuration'.bringOrCreate()
      config.i5 = "Yes"
      try {
        await save()
      } catch(e) {
        global.gApp.showMessage("There was a problem saving your data: " + e.message)
        return
      }
    }

    let createGeneralCluster = async (inventory) => {
      let cluster = await inventory.toGeneralCluster()
      cluster.quantityOnHand = inventory.quantityOnHand
      cluster.quantityOnPurchaseOrders = inventory.quantityOnPurchaseOrders 
    }

    let initialiseClusters = async () => {
      let invs = await 'Inventory'.bring()
      for ( var i = 0; i < invs.length; i++ ) {
        let inv = invs[i]
        await createGeneralCluster(inv)
      }
    }

    let upgradePOs = async () => {
      let generalLocation = await 'Location'.bringOrCreate({locationName: 'General'}); if ( ! generalLocation ) return
      let genLocRef = generalLocation.reference()
      let pos = await 'PO'.bring()
      for ( var i = 0; i < pos.length; i++ ) {
        let po = pos[i]
        po.location = genLocRef
      }
    }

    let upgradeLegacyCasts = async () => {
      await upgradePOs()
    }

/*
    let initAutoAccounts = async () => {
      let locations = await 'Location'.bring()
      for ( var i = 0; i < locations.length; i++ ) {
        let location = locations[i]
        await location.initAutoAccounts()
      }
    }

    let createStandardAccounts = async () => {
      let stdAccts = require('./coa.json')
      for ( var i = 0; i < stdAccts.length; i++ ) {
        let stdAcct = stdAccts[i]
        let account = await 'Account'.bringOrCreate({accountCode: stdAcct.code})
        account.name = stdAcct.name
        account.type = stdAcct.type
        account.taxTreatment = stdAcct.taxTreatment
      }
      await initAutoAccounts()
    }

    let createCalendar = async () => {
      let calendar = await 'Calendar'.bringOrCreate({name: 'July - June'})
      let config = await 'Configuration'.bringOrCreate()
      config.mainCalendar = calendar.reference()
      await calendar.initialise({startMonthNo: 7})
    }

    let maybeCreateCalendar = async () => {
      let config = await 'Configuration'.bringOrCreate()
      if ( config.calendarCreated === 'Yes' ) return
      global.startProgress({message: "Creating calendar..."})
      try {
        await createCalendar()
        config.calendarCreated = 'Yes'
        await save()
      } finally {
        global.stopProgress()
      }
    }

    let createStatementLine = async (statement, parms) => {
      let line = await 'StatementLine'.create({parentCast: statement}, {statement: statement})
      line.sequence = parms.sequence
      line.caption = parms.caption
      line.ranges = parms.ranges
      line.drcr = parms.drcr
      line.bold = (parms.bold ? 'Yes' : 'No')
    }

    let createStandardBalanceSheet = async () => {
      let statement = await 'Statement'.bringOrCreate({name: 'Balance Sheet'})
      await statement.trashChildren()
      statement.showYTDBalance0 = 'No'
      statement.showPTDBalance0 = 'No'
      statement.showYTDBalance1 = 'No'
      statement.showPTDBalance1 = 'No'
      statement.showYTDBalance2 = 'No'
      statement.showPTDBalance2 = 'No'
      await createStatementLine(statement, {sequence: 100, caption: 'Cash And Financial Assets', ranges: '010100-010199', drcr: 'DR'})
      await createStatementLine(statement, {sequence: 110, caption: 'Receivables', ranges: '010200-010299', drcr: 'DR'})
      await createStatementLine(statement, {sequence: 120, caption: 'Inventory', ranges: '010300-010399', drcr: 'DR'})
      await createStatementLine(statement, {sequence: 130, caption: 'Other Current Assets', ranges: '010400-010499,010000', drcr: 'DR'})
      await createStatementLine(statement, {sequence: 140, caption: 'CURRENT ASSETS', ranges: '#100-#130', drcr: 'DR'})
      await createStatementLine(statement, {sequence: 150, caption: 'Property, Plant and Equipment', ranges: '010500-010599', drcr: 'DR'})
      await createStatementLine(statement, {sequence: 160, caption: 'Intangible Assets (Excluding Goodwill)', ranges: '010600-010699', drcr: 'DR'})
      await createStatementLine(statement, {sequence: 170, caption: 'Goodwill', ranges: '010700-010799', drcr: 'DR'})
      await createStatementLine(statement, {sequence: 180, caption: 'NON-CURRENT ASSETS', ranges: '#150-#170', drcr: 'DR'})
      await createStatementLine(statement, {sequence: 190, caption: 'ASSETS', ranges: '#140,#180', drcr: 'DR', bold: true})
      await createStatementLine(statement, {sequence: 200, caption: 'Payables', ranges: '020100-020199', drcr: 'CR'})
      await createStatementLine(statement, {sequence: 210, caption: 'Accruals', ranges: '020200-020203', drcr: 'CR'})
      await createStatementLine(statement, {sequence: 220, caption: 'Other Liabilities', ranges: '020204-020299,020000', drcr: 'CR'})
      await createStatementLine(statement, {sequence: 230, caption: 'CURRENT LIABILITIES', ranges: '#200-#220', drcr: 'CR'})
      await createStatementLine(statement, {sequence: 240, caption: 'Financial Liabilities', ranges: '020300-020399', drcr: 'CR'})
      await createStatementLine(statement, {sequence: 250, caption: 'Provisions', ranges: '020400-020499', drcr: 'CR'})
      await createStatementLine(statement, {sequence: 260, caption: 'NON-CURRENT LIABILITIES', ranges: '#240-#250', drcr: 'CR'})
      await createStatementLine(statement, {sequence: 270, caption: 'LIABILITIES', ranges: '#230,#260', drcr: 'CR'})
      await createStatementLine(statement, {sequence: 280, caption: 'Share Capital', ranges: '030000-030199,030500', drcr: 'CR'})
      await createStatementLine(statement, {sequence: 290, caption: 'Retained Earnings', ranges: '030200-030299', drcr: 'CR'})
      await createStatementLine(statement, {sequence: 300, caption: 'Other Equity', ranges: '030300-030499', drcr: 'CR'})
      await createStatementLine(statement, {sequence: 310, caption: 'Profit Current Year', ranges: '#190,-#270,-#280,-#290,-#300', drcr: 'CR'})
      await createStatementLine(statement, {sequence: 320, caption: 'EQUITY', ranges: '#280-#310', drcr: 'CR'})
      await createStatementLine(statement, {sequence: 330, caption: 'LIABILITIES AND EQUITY', ranges: '#270,#320', drcr: 'CR', bold: true})
    }

    let createStandardProfitAndLoss = async () => {
      let statement = await 'Statement'.bringOrCreate({name: 'Profit and Loss'})
      await statement.trashChildren()
      statement.showBalance = 'No'
      await createStatementLine(statement, {sequence: 100, caption: 'Income', ranges: '040000-040303', drcr: 'CR'})
      await createStatementLine(statement, {sequence: 110, caption: 'Cost Of Goods Sold', ranges: '050201', drcr: 'DR'})
      await createStatementLine(statement, {sequence: 120, caption: 'GROSS PROFIT', ranges: '#100,-#110', drcr: 'DR'})
      await createStatementLine(statement, {sequence: 130, caption: 'Expenses', ranges: '050000-050200,050202-050203', drcr: 'DR'})
      await createStatementLine(statement, {sequence: 140, caption: 'NET OPERATING INCOME', ranges: '#120,-#130', drcr: 'CR'})
      await createStatementLine(statement, {sequence: 150, caption: 'Other Income', ranges: '060000-060101,060200-060205,060208', drcr: 'CR'})
      await createStatementLine(statement, {sequence: 160, caption: 'Other Expenses', ranges: '060102,060206-060207,060300-060400', drcr: 'DR'})
      await createStatementLine(statement, {sequence: 170, caption: 'NET OTHER INCOME', ranges: '#150,-#160', drcr: 'CR'})
      await createStatementLine(statement, {sequence: 180, caption: 'NET INCOME', ranges: '#140,-#170', drcr: 'CR', bold: true})
    }

    let createStandardStatements = async () => {
      await createStandardProfitAndLoss()
      await createStandardBalanceSheet()
    }
*/

    let maybeInitialiseProductMeta = async () => {
      let config = await 'Configuration'.bringOrCreate()
      if ( config.ipm === 'Yes' ) return
      global.startProgress({message: "Initialising product custom fields..."})
      try {
        await initialiseProductMeta()
        config.ipm = 'Yes'
        await save()
      } finally {
        global.stopProgress()
      }
    }

    let maybeInitialiseNextExpectedDeliveryDates = async () => {
      let config = await 'Configuration'.bringOrCreate()
      if ( config.ied === 'Yes' ) return
      global.startProgress({message: "Initialising expected delivery dates..."})
      try {
        await initialiseNextExpectedDeliveryDates()
        config.ied = 'Yes'
        await save()
      } finally {
        global.stopProgress()
      }
    }

    let initialiseNextExpectedDeliveryDates = async () => {
      let invs = await 'Inventory'.bring()
      for ( var i = 0; i < invs.length; i++ ) {
        let inv = invs[i]
        await inv.refreshNextExpectedDeliveryDate()
      }
    }

    let initialiseProductMeta = async () => {
      let invs = await 'Inventory'.bring()
      for ( var i = 0; i < invs.length; i++ ) {
        let inv = invs[i]
        inv.makeDirty({allFields: true}) // force save, which will also update product meta
      }
    }

/*
    let maybeCreateStandardStatements = async () => {
      let config = await 'Configuration'.bringOrCreate()
      if ( config.standardStatementsCreated === 'Yes' ) return
      global.startProgress({message: "Creating default financial report templates..."})
      try {
        await createStandardStatements()
        config.standardStatementsCreated = 'Yes'
        await save()
      } finally {
        global.stopProgress()
      }
    }

    let maybeCreateStandardAccounts = async () => {
      let config = await 'Configuration'.bringOrCreate()
      if ( config.standardAccountsCreated === 'Yes' ) return
      global.startProgress({message: "Creating standard chart of accounts..."})
      try {
        await createStandardAccounts()
        config.standardAccountsCreated = 'Yes'
        await save()
      } finally {
        global.stopProgress()
      }
    }
*/

    let maybeCreateGeneralLocation = async () => {
      let v = global.stEmulatingVersion
      if ( v && (v <= "1.5.1.0") ) return
      generalLocation = await 'Location'.bringSingle({locationName: 'General'})
      if ( generalLocation ) return
      global.startProgress({message: "Creating General Location..."})
      try {
        generalLocation = await 'Location'.bringOrCreate({locationName: 'General'})
        await save()
        await initialiseClusters()
        await save()
        await upgradeLegacyCasts()
        await save()
      } finally {
        global.stopProgress()
      }
    }

    let deleteAllOldTrashed = async () => {
      let p = 
        {
          methodWithParms: "stocktend_object",
          json: [
            {
              __submethod: "deleteAllOldTrashed"
            }
          ]
        }
      console.log("Deleting old trashed posts...")
      await global.server.doPost(p, null);
      console.log("Finished deleting old trashed posts")
    }

    let maybeRefreshAllInventorySalesUnits = async () => {
      let lightweight = aOptions && aOptions.lightweight
      if ( lightweight )
        return
      let config = await 'Configuration'.bringFirst(); if ( ! config ) return
      let newDay = (config.srDate < global.todayYMD())
      if ( global.prfiEmulateDaysInFuture || (global.prfiEmulateDaysInFuture === 0) )
        newDay = (config.srDate !== global.todayYMD())
      let configChanged = (config.salesRecentWeeks !== config.lastPriorWeeksUsed)
      if ( configChanged ) {
        await save() // save before flushing so that changes are not blown away
        global.foreman.flushCache() // orders and order_items subsets need to be reretrieved
        config = await 'Configuration'.bringFirst(); if ( ! config ) return
      }
      if ( ! (newDay || configChanged) ) return
      console.log("Updating sales statistics")
      didRefreshSales = true
      global.startProgress({message: "Updating sales statistics..."})
      try {
        config.srDate = global.todayYMD()
        config.lastPriorWeeksUsed = config.salesRecentWeeks
        let invs = await 'Inventory'.bring()
        for ( var i = 0 ; i < invs.length; i++ ) {
          let inv = invs[i]
          await inv.refreshSalesUnits()
          await global.updateProgress((i / invs.length) * 0.5)
          if ( (i % 100) === 0 )
            await global.wait(100)
        }
        await save()
        await deleteAllOldTrashed()
      } finally {
        global.stopProgress()
      }
    }

    let maybeLoadMirrors = async () => {
      let lightweight = aOptions && aOptions.lightweight
      if ( lightweight )
        return
      let config = await 'Configuration'.bringFirst(); if ( ! config ) return
      if ( config.autoLoadSupplierProductData !== 'Yes' )
        return
      let newDay = (config.lmlDate !== global.todayYMD())
      if ( (! newDay) && (! didRefreshSales) ) return
      console.log("Loading Mirrored Supplier Product Data")
      global.startProgress({message: "Loading Mirrored Supplier Product Data..."})
      try {
        config.lmlDate = global.todayYMD()
        let mirrors = await 'Mirror'.bring({stockIsMirrored: 'Yes'})
        for ( var i = 0 ; i < mirrors.length; i++ ) {
          let mirror = mirrors[i]
          await mirror.load()
          await global.updateProgress((i / mirrors.length) * 0.5)
          if ( (i % 100) === 0 )
            await global.wait(100)
        }
        await save()
      } finally {
        global.stopProgress()
      }
    }

    try {
      didRefreshSales = false
      if ( global.noHarmonize ) return
      if ( global.harmonizing )
        return
      global.harmonizing = true
      global.foreman.suspendCastSaves()
      global.showSpinner({immediate: true})
      try {
        await maybeCreateGeneralLocation()
/*
        await maybeCreateCalendar()
        await maybeCreateStandardAccounts()
        await maybeCreateStandardStatements()
*/
        global.lastHarmonizeMs = global.nowMs()
        await maybeRefreshAllInventorySalesUnits()
        await maybeLoadMirrors()
        await maybeInitialiseNextExpectedDeliveryDates()
        await maybeInitialiseProductMeta()
        let full = aOptions && aOptions.full
        let skipInitialPing = aOptions && aOptions.skipInitialPing
        if ( ! skipInitialPing ) {
          await global.app.pingServer()
        }
        morsels = await 'Morsel'.bring()
        if ( (morsels.length < 1) && (! full) ) 
          return
        global.startProgress({message: "Loading inventory levels from WooCommerce..."})
        try {
          await retireOldSOs()
          while ( morselsContainSales(morsels) ) {
            await createSalesTransactions()
            await save()
            morsels = await 'Morsel'.bring()
          }
          if ( full ) {
            await doFullHarmonize()
          } else {
            await doIncrementalHarmonize()
          }
        } finally {
          global.stopProgress()
        }
      } finally {
        global.foreman.unsuspendCastSaves()
        global.hideSpinner()
        global.harmonizing = false
      }
    } catch(e) {
      global.gApp.showMessage("Error in harmonisation: " + e.message)
    }
  }

}

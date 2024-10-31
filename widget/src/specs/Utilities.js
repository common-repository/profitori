'Utilities'.page()
'Back'.action({act: 'cancel'})
'Export'.action({spec: "Export.js"})
'Import'.action({spec: "Import.js"})
'Recalc All Avg Costs'.action({spec: "RecalcAvgCosts.js"})
'Import Unit Costs'.action({spec: "ImportUnitCosts.js"})
'Sync Inventory Levels'.action()
'Copy WC Regular Prices to RRPs'.action()
'Diagnose Stock Issues'.action({spec: 'Diagnose.js'})

'Copy WC Regular Prices to RRPs'.act(async () => {
  let products = await 'products'.bring()
  let updatedCount = 0
  for ( var i = 0; i < products.length; i++ ) {
    let product = products[i]
    let avenue = await product.toMainAvenue(); if ( ! avenue ) continue
    avenue.recommendedRetailPriceIncTax = product._regular_price
    updatedCount++
  }
  let skippedCount = products.length - updatedCount
  await global.foreman.doSave({msgOnException: true})
  global.gApp.showMessage("Updated " + updatedCount + " of " + products.length + " products. (" + skippedCount + " were skipped as they have no main supplier)")
})

'Sync Inventory Levels'.act(async () => {

  let save = async () => {
    let err = await global.foreman.doSave()
    if ( err )
      throw(new Error(err))
  }

  let recalcInvPOQty = async inv => {
    await inv.refreshQuantityOnPurchaseOrders()
    let product = inv.product
    let lines = await 'POLine'.bring({product: product})
    lines = lines.filter(line => (! line.lineType) || (line.lineType === "Product"))
    inv.lastPurchaseDate = global.emptyYMD()
    await lines.forAllAsync(async poLine => {
      let orderDate = await poLine.toOrderDate()
      if ( orderDate > inv.lastPurchaseDate )
        inv.lastPurchaseDate = orderDate
    })
  }

  let recalcQuantitiesOnPurchaseOrders = async () => {
    global.startProgress({message: "Recalculating quantities on purchase orders..."})
    try {
      global.foreman.suspendCastSaves()
      global.foreman.flushCache() // So that all data we get below is up to date
      await 'Configuration'.bring() // Re-cache
      await 'Mod'.bring() // Re-cache
      await 'Extension'.bring() // Re-cache
      let invs = await 'Inventory'.bring()
      let done = 0
      await invs.forAllAsync(async inv => {
        await recalcInvPOQty(inv)
        if ( ! inv.situation )
          inv.situation = 'Active'
        done++
        if ( ((done % 100) === 0) || (done === (invs.length - 1)) ) {
          await save()
          await global.updateProgress(done / invs.length)
          await global.wait(100)
        }
      })
    } finally {
      global.foreman.unsuspendCastSaves()
      global.stopProgress()
    }
  }

  let dedupInventory = async (prod) => {
    let inv = await prod.toInventory(); if ( ! inv ) return
    if ( inv._markedForDeletion ) return
    let productId = prod.id; if ( ! productId ) return
    let otherInvs = await 'Inventory'.bring()
    for ( var i = otherInvs.length - 1; i >= 0; i-- ) {
      let otherInv = otherInvs[i]
      let otherProdRef = otherInv.product; if ( ! otherProdRef ) continue
      if ( ! otherProdRef.id ) {
        let otherProd = await 'products'.bringFirst({uniqueName: otherProdRef.keyval})
        if ( ! otherProd )
          continue
        otherProdRef.id = otherProd.id
      }
      if ( otherProdRef.id !== productId ) continue
      if ( otherInv.id === inv.id ) continue
      console.log("Deleting Inventory cast " + otherInv.id + " for product " + prod.uniqueName + "[id: " + prod.id + "] (keeping cast " + inv.id + ")")
      await otherInv.trash()
    }
  }

  let removeDuplicateInventories = async () => {
    global.startProgress({message: "Checking/fixing duplicates..."})
    try {
      global.foreman.suspendCastSaves()
      global.foreman.flushCache() // So that all data we get below is up to date
      await 'Configuration'.bring() // Re-cache
      await 'Mod'.bring() // Re-cache
      await 'Extension'.bring() // Re-cache
      let products = await 'products'.bring()
      let done = 0
      await products.forAllAsync(async product => {
        await dedupInventory(product)
        done++
        if ( ((done % 100) === 0) || (done === (products.length - 1)) ) {
          await save()
          await global.updateProgress(done / products.length)
          await global.wait(100)
        }
      })
    } finally {
      global.foreman.unsuspendCastSaves()
      global.stopProgress()
    }
  }

  try {
    await removeDuplicateInventories()
  } catch(e) {
    global.gApp.showMessage("Error removing duplicate inventory records: " + e.message)
    return
  }
  try {
    await recalcQuantitiesOnPurchaseOrders()
  } catch(e) {
    global.gApp.showMessage("Error recalculating quantities on purchase orders: " + e.message)
    return
  }
  try {
    await removeDuplicateInventories() // second round needed for stragglers after PO recalcs
  } catch(e) {
    global.gApp.showMessage("Error removing duplicate inventory records: " + e.message)
    return
  }
  await global.gApp.harmonize({full: true})
})


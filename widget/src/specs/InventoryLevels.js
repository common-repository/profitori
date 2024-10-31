'InventoryLevels'.list({expose: true, icon: 'Warehouse'})
'Inventory'.title()
'Back'.action({icon: 'AngleLeft'})
'Create Stocktake'.action()
'Process Bulk Trash'.action()
'Transfer Now'.action()
'Produce Labels'.action({spec: 'Labels.js'})
'Select All'.action()
'Select None'.action()
'GenerateStocktakeSelectAll'.action({caption: 'Select All'})
'GenerateStocktakeSelectNone'.action({caption: 'Select None'})
'BulkTrashSelectAll'.action({caption: 'Select All'})
'BulkTrashSelectNone'.action({caption: 'Select None'})
'BulkTransferSelectAll'.action({caption: 'Select All'})
'BulkTransferSelectNone'.action({caption: 'Select None'})
'Edit'.action({act: "alter"})
'Save'.action({act: "save"})
'Refresh'.action({act: "refresh"})
'Customize'.action({spec: 'Customize.js'})
'Location Inventory'.action({spec: "LocationInventoryList.js"})
'Download to Excel'.action({act: 'excel'})
'Bulk Trash'.action()
'Bulk Transfer'.action()
'BulkLabels'.action({caption: 'Labels'})
'Generate Stocktake'.action()
'View Short Stock'.action({spec: "ViewLowInventory.js"})
//'Bundles'.action({spec: "BundleList.js"})

'products'.datatype({source: "WC"})
'include'.field({ephemeral: true, tickbox: true, allowInput: true})
'bulkTrash'.field({ephemeral: true, tickbox: true, allowInput: true})
'bulkTransfer'.field({ephemeral: true, tickbox: true, allowInput: true})
'includeInStocktake'.field({ephemeral: true, tickbox: true, allowInput: true})
'uniqueName'.field({key: true, caption: "Product", showAsLink: true, useForTotalCaption: true, readOnly: true})
'_sku'.field({readOnly: true})
'Inventory'.datatype()
'product'.field({refersTo: 'products', key: true, readOnly: true, hidden: true})
'thumbnailImage'.field()
'quantityOnHand'.field({numeric: true, showTotal: true, readOnly: true})
'quantityOnPurchaseOrders'.field({numeric: true, caption: "On Purchase Orders", showTotal: true, readOnly: true})
'avgUnitCost'.field({numeric: true, minDecimals: 2})
'inventoryValue2'.field({numeric: true, decimals: 2, showTotal: true, readOnly: true})
'Edit Product'.action({place: 'row', act: 'edit', spec: 'InventoryMaint.js'})
'Adjust Qty'.action({place: 'row', act: 'add', spec: 'AdjustmentMaint.js'})
'Adjust Value'.action({place: 'row', act: 'add', spec: 'EvaluationMaint.js'})
'View History'.action({place: 'row', spec: 'InventoryHistory.js'})
'View Purchase Orders'.action({place: 'row', spec: 'POReport.js'})
'Transfer Between Locations'.action({place: 'row', act: 'add', spec: 'TransferMaint.js'})
'Inventory by Location'.action({place: 'row', spec: 'ProductLocations.js'})
'View Serial/Lots'.action({place: 'row', spec: 'ViewProductLots.js'})
'Supercede'.action({place: 'row', spec: 'Supercede.js'})
'Labels'.action({place: 'row', spec: 'Labels.js'})

'View Serial/Lots'.availableWhen(inv => {
  return inv && inv.lotTracking && (inv.lotTracking !== 'None')
})

'Create Stocktake'.act(async (list, cast) => {

  let stocktake
  let products = await 'products'.bring({includeInStocktake: 'Yes'})
  products.sort((p1, p2) => p1.uniqueName > p2.uniqueName ? 1 : -1)

  let defaultNumber = async () => {
    let nextNo = await 'NextNumber'.bringOrCreate({forDatatype: 'Stocktake'})
    nextNo.number = nextNo.number + 1
    let noStr = nextNo.number + ""
    return "ST" + noStr.padStart(5, '0')
  }

  let createLine = async product => {
    let line = await 'StocktakeLine'.create({parentCast: stocktake})
    line.product = product.reference()
    let inv = await product.toInventory()
    line.systemQuantity = inv ? inv.quantityOnHand : 0
    line.countedQuantity = 0
  }

  let saveChanges = async () => {
    let no = await defaultNumber()
    stocktake = await 'Stocktake'.bringOrCreate({stocktakeNumber: no})
    stocktake.stocktakeDate = global.todayYMD()
    
    for ( var i = 0; i < products.length; i++ ) {
      let p = products[i]
      await createLine(p)
    }
    await global.foreman.doSave({msgOnException: true})
  }

  if ( products.length === 0 ) {
    list.showMessage('No products are selected - please tick at least one then try again')
    return
  }
  await saveChanges()
  await list.segue("edit", 'StocktakeMaint.js', stocktake)

})

'Create Stocktake'.availableWhen((cast, list) => {
  return list.situation()._doingGenerateStocktake
})

'includeInStocktake'.visibleWhen((list) => {
  return list.situation()._doingGenerateStocktake
})

'Generate Stocktake'.availableWhen((cast, list) => {
  let sit = list.situation()
  return (! sit._doingBulkLabels) && (! sit._doingBulkTrash) && (! sit._doingGenerateStocktake) && (! sit._doingBulkTransfer)
})

'Generate Stocktake'.act(async (list, cast) => {
  list.situation()._doingGenerateStocktake = true
})

'GenerateStocktakeSelectAll'.act(async (list, cast) => {
  list.situation()._gsSelectedAll = true
  let products = list.casts()
  for ( var i = 0; i < products.length; i++ ) {
    let product = products[i]
    product.includeInStocktake = 'Yes'
  }
  let mold = global.foreman.doNameToMold('products')
  mold.version++
})

'GenerateStocktakeSelectAll'.availableWhen((cast, list) => {
  return list.situation()._doingGenerateStocktake && (! list.situation()._gsSelectedAll)
})

'GenerateStocktakeSelectNone'.act(async (list, cast) => {
  list.situation()._gsSelectedAll = false
  let products = list.casts()
  for ( var i = 0; i < products.length; i++ ) {
    let product = products[i]
    product.includeInStocktake = 'No'
  }
  let mold = global.foreman.doNameToMold('products')
  mold.version++
})

'GenerateStocktakeSelectNone'.availableWhen((cast, list) => {
  return list.situation()._doingGenerateStocktake && list.situation()._gsSelectedAll
})

'Transfer Now'.act(async (list, cast) => {
  let products = await 'products'.bring({bulkTransfer: 'Yes'})
  if ( products.length === 0 ) {
    list.showMessage('No products are selected - please tick at least one then try again')
    return
  }
  await list.segue('add', 'BulkTransferMaint.js')
})

'Process Bulk Trash'.act(async (list, cast) => {

  let products = await 'products'.bring({bulkTrash: 'Yes'})
  products.sort((p1, p2) => p1.uniqueName > p2.uniqueName ? 1 : -1)

  let saveChanges = async () => {
    for ( var i = 0; i < products.length; i++ ) {
      let p = products[i]
      await p.trash()
    }
    await global.foreman.doSave({msgOnException: true})
  }

  let checkLevels = async () => {
    for ( var i = 0; i < products.length; i++ ) {
      let p = products[i]
      let inv = await p.toInventory(); if ( ! inv ) continue
      if ( inv.quantityOnHand !== 0 )
        return "Product '" + p.uniqueName + "' has non-zero Quantity On Hand - please untick and try again"
      if ( inv.quantityOnPurchaseOrders !== 0 ) 
        return "Product '" + p.uniqueName + "' has non-zero Quantity On Purchase Orders - please untick and try again"
    }
    return null
  }

  if ( products.length === 0 ) {
    list.showMessage('No products are selected - please tick at least one then try again')
    return
  }
  let msg = await checkLevels()
  if ( msg ) {
    list.showMessage(msg)
    return
  }
  list.showMessage(
    'Trashing ' + products.length + ' products - are you sure?',
    { yesNo: true, 
      onYes: saveChanges
    }
  )

})

'Save'.availableWhen((cast, list) => {
  return list.altering()
})

'Edit'.availableWhen((cast, list) => {
  return ! list.altering()
})

'Process Bulk Trash'.availableWhen((cast, list) => {
  return list.situation()._doingBulkTrash
})

'Transfer Now'.availableWhen((cast, list) => {
  return list.situation()._doingBulkTransfer
})

'bulkTrash'.visibleWhen((list) => {
  return list.situation()._doingBulkTrash
})

'bulkTransfer'.visibleWhen((list) => {
  return list.situation()._doingBulkTransfer
})

'Bulk Trash'.availableWhen((cast, list) => {
  let sit = list.situation()
  return (! sit._doingBulkLabels) && (! sit._doingBulkTrash) && (! sit._doingGenerateStocktake) && (! sit._doingBulkTransfer)
})

'Bulk Transfer'.availableWhen((cast, list) => {
  let sit = list.situation()
  return (! sit._doingBulkLabels) && (! sit._doingBulkTrash) && (! sit._doingGenerateStocktake) && (! sit._doingBulkTransfer)
})


'Bulk Trash'.act(async (list, cast) => {
  list.situation()._doingBulkTrash = true
})

'Bulk Transfer'.act(async (list, cast) => {

  let selectAll = async () => {
    list.situation()._bxSelectedAll = true
    let products = list.casts()
    for ( var i = 0; i < products.length; i++ ) {
      let product = products[i]
      if ( ! await product.hasStock() ) continue
      product.bulkTransfer = 'Yes'
    }
    let mold = global.foreman.doNameToMold('products')
    mold.version++
  }

  list.situation()._doingBulkTransfer = true
  await selectAll()
})

'BulkTrashSelectAll'.act(async (list, cast) => {
  list.situation()._btSelectedAll = true
  let products = list.casts()
  for ( var i = 0; i < products.length; i++ ) {
    let product = products[i]
    product.bulkTrash = 'Yes'
  }
  let mold = global.foreman.doNameToMold('products')
  mold.version++
})

'BulkTransferSelectAll'.act(async (list, cast) => {
  list.situation()._bxSelectedAll = true
  let products = list.casts()
  for ( var i = 0; i < products.length; i++ ) {
    let product = products[i]
    if ( ! await product.hasStock() ) continue
    product.bulkTransfer = 'Yes'
  }
  let mold = global.foreman.doNameToMold('products')
  mold.version++
})

'BulkTrashSelectAll'.availableWhen((cast, list) => {
  return list.situation()._doingBulkTrash && (! list.situation()._btSelectedAll)
})

'BulkTransferSelectAll'.availableWhen((cast, list) => {
  return list.situation()._doingBulkTransfer && (! list.situation()._bxSelectedAll)
})

'BulkTrashSelectNone'.act(async (list, cast) => {
  list.situation()._btSelectedAll = false
  let products = list.casts()
  for ( var i = 0; i < products.length; i++ ) {
    let product = products[i]
    product.bulkTrash = 'No'
  }
  let mold = global.foreman.doNameToMold('products')
  mold.version++
})

'BulkTransferSelectNone'.act(async (list, cast) => {
  list.situation()._bxSelectedAll = false
  let products = list.casts()
  for ( var i = 0; i < products.length; i++ ) {
    let product = products[i]
    product.bulkTransfer = 'No'
  }
  let mold = global.foreman.doNameToMold('products')
  mold.version++
})

'BulkTrashSelectNone'.availableWhen((cast, list) => {
  return list.situation()._doingBulkTrash && list.situation()._btSelectedAll
})

'BulkTransferSelectNone'.availableWhen((cast, list) => {
  return list.situation()._doingBulkTransfer && list.situation()._bxSelectedAll
})

'Produce Labels'.availableWhen((cast, list) => {
  return list.situation()._doingBulkLabels
})

'include'.visibleWhen((list) => {
  return list.situation()._doingBulkLabels
})

'BulkLabels'.availableWhen((cast, list) => {
  let sit = list.situation()
  return (! sit._doingBulkLabels) && (! sit._doingBulkTrash) && (! sit._doingGenerateStocktake) && (! sit._doingBulkTransfer)
})

'BulkLabels'.act(async (list, cast) => {
  let products = await 'products'.bring({include: 'Yes'})
  for ( var i = 0; i < products.length; i++ ) {
    let product = products[i]
    product.__oldInclude = product.include
    product.include = 'No'
  }
  products = list.casts()
  for ( i = 0; i < products.length; i++ ) {
    let product = products[i]
    product.include = product.__oldInclude
  }
  list.situation()._selectedAll = false
  list.situation()._doingBulkLabels = true
})

'Back'.act(async (list, cast) => {
  if ( list.situation()._doingBulkLabels ) {
    list.situation()._doingBulkLabels = false
    return
  }
  if ( list.situation()._doingBulkTrash ) {
    list.situation()._doingBulkTrash = false
    return
  }
  if ( list.situation()._doingBulkTransfer ) {
    list.situation()._doingBulkTransfer = false
    return
  }
  if ( list.situation()._doingGenerateStocktake ) {
    list.situation()._doingGenerateStocktake = false
    return
  }
  list.back()
})

'Select All'.act(async (list, cast) => {
  list.situation()._selectedAll = true
  let products = list.casts()
  for ( var i = 0; i < products.length; i++ ) {
    let product = products[i]
    product.include = 'Yes'
  }
  let mold = global.foreman.doNameToMold('products')
  mold.version++
})

'Select All'.availableWhen((cast, list) => {
  return list.situation()._doingBulkLabels && (! list.situation()._selectedAll)
})

'Select None'.act(async (list, cast) => {
  list.situation()._selectedAll = false
  let products = list.casts()
  for ( var i = 0; i < products.length; i++ ) {
    let product = products[i]
    product.include = 'No'
  }
  let mold = global.foreman.doNameToMold('products')
  mold.version++
})

'Select None'.availableWhen((cast, list) => {
  return list.situation()._doingBulkLabels && list.situation()._selectedAll
})

'InventoryLevels'.beforeLoading(async list => {
  await list.harmonize()
})

'InventoryLevels'.createJoinWhen(async product => {
  return product._stock !== 0
})

'InventoryLevels'.modifyFields(async (grid, fields) => {

  let facetToField = async (facet) => {
    let source = await facet.referee('source'); if ( ! source ) return null
    let parts = source.description.split(".")
    let realm = parts[0]
    let name = parts[1]
    let res
    let dt = "products"
    if ( realm === "Inventory" ) {
      res = fields.filterSingle(f => f.name === name)
      dt = "Inventory"
    }
    if ( res ) {
      if ( ! res.englishCaption )
        res.englishCaption = facet.caption
      res.caption = facet.caption //.translate()
      res.realm = facet.realm
      if ( facet.decimalsChanged ) { // Prevent 2 decimals where none were intended, when initialised on older versions
        res.minDecimals = facet.minimumDecimals
        res.maxDecimals = facet.maximumDecimals
      }
      return res
    }
    let disposition = await facet.referee('disposition')
    let numeric = (disposition && (disposition.description === "Number"))
    let date = (disposition && (disposition.description === "Date"))
    let postImage = (disposition && (disposition.description === "Image"))
    let postImageType
    let postIdField
    if ( postImage ) {
      postImageType = 'thumbnail'
      postIdField = 'product'
    }
    let minDecimals 
    let maxDecimals 
    let showTotal 
    if ( numeric ) {
      minDecimals = facet.minimumDecimals
      maxDecimals = facet.maximumDecimals
      showTotal = (facet.showTotal === "Yes")
    }
    let readOnly = (facet.allowEditing !== 'Yes')
    res = grid.createField(
      {
        datatype: dt, 
        name: name, 
        caption: facet.caption, 
        realm: realm, 
        numeric: numeric, 
        date: date, 
        showTotal: showTotal,
        minDecimals: minDecimals, 
        maxDecimals: maxDecimals,
        readOnly: readOnly,
        postImage: postImage,
        postImageType: postImageType,
        postIdField: postIdField,
        inputWidthPx: facet.inputWidthPx
      })
    return res
  }

  let newFields = []
  let template = await 'Template'.bringOrCreate({specification: "InventoryLevels.js"})
  let facets = await 'Facet'.bring({parentId: template.id})
  facets.sort((f1, f2) => f1.sequence > f2.sequence ? 1 : -1)
  await facets.forAllAsync(async facet => {
    let f = await facetToField(facet); if ( ! f ) return "continue"
    newFields.push(f)
  })
  fields.splice(7, fields.length - 1) // Always include the product, sku, the Inventory reference and the 4 tickboxes
  fields.appendArray(newFields)
  if ( global.foreman.doThereAreUnsavedChanges() ) {
    await global.foreman.doSave()
  }
})

'InventoryLevels'.modifyMoldFields(async (mold) => {
  let template = await 'Template'.bringOrCreate({specification: "InventoryLevels.js"});
  let facets = await 'Facet'.bring({parentId: template.id})
  let fieldsAdded = false
  await facets.forAllAsync(async (facet) => {
    let source = await facet.referee('source'); if ( ! source ) return "continue"
    let parts = source.description.split(".")
    let realm = parts[0]
    let name = parts[1]
    if ( ! realm.startsWith("WC Product") ) return "continue"
    let f = mold.fields.filterSingle(f => f.name === name)
    if ( ! f ) {
      f = mold.createField(name)
      fieldsAdded = true
    }
    f.englishCaption = facet.englishCaption ? facet.englishCaption : facet.caption
    f.caption = facet.caption //.translate()
    f.realm = realm
    let disposition = await facet.referee('disposition'); if ( ! disposition ) return "continue"
    f.numeric = (disposition.description === "Number")
    f.date = (disposition.description === "Date")
    f.minDecimals = facet.minimumDecimals
    f.maxDecimals = facet.maximumDecimals
    f.showTotal = (facet.showTotal === "Yes")
    f.readOnly = (facet.allowEditing !== 'Yes')
  })
  if ( global.foreman.doThereAreUnsavedChanges() ) {
    await global.foreman.doSave()
  }
  return fieldsAdded
})


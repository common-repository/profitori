'EnterStocktakeCounts'.maint({panelStyle: "titled", icon: 'HandPointRight', includeManifestSearch: true})
'Enter Stocktake Counts'.title()
'Back'.action({act: 'cancel'})
'OK'.action({act: 'ok'})
'Save'.action({act: 'save'})
'Finalise'.action()
'Scan'.action()
'Zero Uncounted'.action()
'Variances'.action({spec: "StocktakeVariances.js"})
'Stocktake'.datatype()

'Stocktake Details'.panel()
'scanStatus'.field({ephemeral: true, readOnly: true})
'inScanMode'.field({yesOrNo: true, hidden: true})
'stocktakeNumber'.field({readOnly: true})
'stocktakeDate'.field({readOnly: true})
'location'.field({readOnly: true, showAsLink: true})
'status'.field({readOnly: true})

'Lines'.manifest()
'StocktakeLine'.datatype()
'product'.field({showAsLink: true})
'sku'.field()
'supplier'.field({showAsLink: true})
'supplierSku'.field()
'wooCommerceRegularPrice'.field()
'scan'.field({readOnly: false, ephemeral: true})
'countedQuantity'.field({numeric: true, readOnly: false})
'systemQuantity'.field()
'discrepancy'.field()
'shelf'.field({readOnly: false})

'scan'.modifyInputRenderValue((renderValue, stocktakeLine) => {
  return ''
})

'scan'.columnVisibleWhen((list, stocktake) => {
  return (stocktake.inScanMode === "Yes")
})

'EnterStocktakeCounts'.onScannerRead(async (maint, stocktake, barcode) => {

  let scanFieldHasFocus = () => {
    let el = document.activeElement; if ( ! el ) return false
    return el.id.startsWith('scan-')
  }

  let grid = maint.getMainGrid()
  //if ( ! (scanFieldHasFocus() || noInputHasFocus()) ) return
  if ( ! scanFieldHasFocus() ) return
  //let scanEl = document.activeElement
  let line = await stocktake.barcodeToLine(barcode)
  if ( ! line ) {
    stocktake.scanStatus = 'Scanned code unrecognized: ' + barcode
    return
  }
  grid.focusField(line, 'countedQuantity')
  stocktake.scanStatus = 'Scanned and selected Product ' + await line.grab('product.uniqueName')
})

'EnterStocktakeCounts'.afterInitialising(async stocktake => {
  global.prfiInScanMode = (stocktake.inScanMode === "Yes")
})

'scanStatus'.visibleWhen((maint, stocktake) => {
  return global.prfiInScanMode
})

'Scan'.act(async (maint, stocktake) => {
  if ( stocktake.inScanMode === "Yes" ) {
    stocktake.inScanMode = 'No'
    global.prfiInScanMode = false
    return
  }
  stocktake.inScanMode = 'Yes'
  global.prfiInScanMode = true
  stocktake.scanStatus = 'Ready for you to start scanning'
  let grid = maint.getMainGrid()
  grid.focusField(0, 'scan')
})


'Zero Uncounted'.act(async (maint, stocktake) => {
  let lines = await 'StocktakeLine'.bringChildrenOf(stocktake)
  for ( var i = 0; i < lines.length; i++ ) {
    let line = lines[i]
    line.countEntered = true
  }
})

'discrepancy'.visibleWhen(list => {
  let m = global.foreman.doNameToMold('Configuration'); if ( ! m ) return false
  let c = m.fastRetrieveSingle(); if ( ! c ) return false
  return c.showDiscrepanciesInCountPage === 'Yes'
})

'systemQuantity'.visibleWhen(list => {
  let m = global.foreman.doNameToMold('Configuration'); if ( ! m ) return false
  let c = m.fastRetrieveSingle(); if ( ! c ) return false
  return c.showDiscrepanciesInCountPage === 'Yes'
})

'EnterStocktakeCounts'.readOnly((maint, stocktake) => {
  if ( stocktake.status === 'Finalised' )
    return "This Stocktake has been finalised and cannot be altered"
})

'countedQuantity'.modifyInputRenderValue((renderValue, stocktakeLine) => {
  if ( stocktakeLine.countEntered ) return renderValue
  if ( renderValue !== '0' ) return renderValue
  return ''
})

'Finalise'.act(async (maint, stocktake) => {
  if ( stocktake.status === "Finalised" ) throw(new Error("This Stocktake has already been finalised previously"))
  await stocktake.finalise()
  maint.showMessage('The Stocktake has been finalised')
})

'Stocktake'.method('finalise', 
  async function() {
    let lines = await 'StocktakeLine'.bringChildrenOf(this)
    await lines.forAllAsync(async (line) => {
      await line.finalise()
    })
    this.status = 'Finalised'
  }
)

'StocktakeLine'.method('finalise', 
  async function() {
    if ( (! this.countedQuantity) && (! this.countEntered) ) throw(new Error("Please enter a quantity for all products before finalising"))
    let chg = this.countedQuantity - this.systemQuantity
    let tran = await 'Transaction'.create()
    let stocktake = await this.parent()
    tran.product = this.product
    tran.date = stocktake.stocktakeDate
    tran.location = stocktake.location
    tran.quantity = chg
    tran.source = 'Stocktake'
    tran.reference = stocktake.stocktakeNumber
    if ( this.shelf ) {
      let inv = await this.toInventory()
      if ( inv ) {
        inv.shelf = this.shelf
      }
    }
  }
)


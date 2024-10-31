'StocktakeMaint'.maint({panelStyle: "titled", icon: 'HandPointRight'})
'Stocktake'.title({when: 'adding'})
'Edit Stocktake'.title({when: 'editing'})
'Back'.action({act: 'cancel'})
'OK'.action({act: 'ok'})
'Save'.action({act: 'save'})
'Attachments'.action({act: 'attachments'})
'Stocktake'.datatype()

'Stocktake Details'.panel()
'stocktakeNumber'.field({key: true})
'stocktakeDate'.field({date: true})
'location'.field({refersTo: 'Location', allowEmpty: false})
'includeZeroQuantities'.field({yesOrNo: true})
'status'.field({readOnly: true, translateOnDisplay: true})

'Lines'.manifest()
'StocktakeLine'.datatype()
'stocktakeNumber'.field({refersToParent: "Stocktake", hidden: true})
'product'.field({refersTo: "products", showAsLink: true})
'systemQuantity'.field({numeric: true})
'Exclude'.action({place: 'row', act: 'trash'})

'Stocktake'.method('barcodeToLine', async function(barcode) {
  let lines = await 'StocktakeLine'.bringChildrenOf(this)
  for ( var i = 0; i < lines.length; i++ ) {
    let line = lines[i]
    let inv = await line.toInventory(); if ( ! inv ) continue
    if ( await inv.matchesBarcode(barcode) ) {
      return line
    }
  }
})

'Lines'.defaultSort({field: 'product'})

'status'.inception('Unfinalised')

'location'.inception(async stocktake => {
  let res = await 'Location'.bringSingle({locationName: 'General'}); if ( ! res ) return null
  return res.reference()
})

'StocktakeMaint'.makeDestinationFor('Stocktake')

'StocktakeMaint'.readOnly((maint, stocktake) => {
  if ( stocktake.status === 'Finalised' )
    return "This Stocktake has been finalised and cannot be altered"
})

'StocktakeMaint'.whenAdding(async function(stocktake) {

  let defaultNumber = async () => {
    let nextNo = await 'NextNumber'.bringOrCreate({forDatatype: 'Stocktake'})
    nextNo.number = nextNo.number + 1
    let noStr = nextNo.number + ""
    let no = "ST" + noStr.padStart(5, '0')
    this.setFieldValue('stocktakeNumber', no)
  }

  await defaultNumber()
  await stocktake.refreshLines()
})

'includeZeroQuantities'.afterUserChange(async (oldInputValue, newInputValue, stocktake) => {
  let hasCounted = await stocktake.hasCountedQuantities()
  if ( hasCounted ) return "This stocktake has counted quantities - cannot alter Include Zero Quantities"
  return stocktake.refreshLines()
})

'location'.afterUserChange(async (oldInputValue, newInputValue, stocktake) => {
  let hasCounted = await stocktake.hasCountedQuantities()
  if ( hasCounted ) return "This stocktake has counted quantities - cannot alter Location"
  return stocktake.refreshLines()
})

'Stocktake'.method('refreshLines',
  async function () {
    await this.deleteLines()
    let products = await 'products'.bring()
    products.sort((p1, p2) => p1.uniqueName > p2.uniqueName ? 1 : -1)
    let len = products.length
    for ( var i = 0; i < len; i++ ) {
      let product = products[i]
      let inv = await 'Inventory'.bringSingle({product: product.reference()})
      //let qty = inv ? inv.quantityOnHand : 0
      let qty = 0
      if ( inv ) {
        let cluster = await inv.locationRefToCluster(this.location, {preventCreate: true})
        qty = cluster ? cluster.quantityOnHand : 0
      }
      if ( (qty === 0) && (this.includeZeroQuantities === "No") ) continue
      let line = 'StocktakeLine'.add({parent: this})
      line.product = product.reference()
      line.systemQuantity = qty
      line.countedQuantity = 0
      line.shelf = inv ? inv.shelf : ''
    }
  }
)

'Stocktake'.method('hasCountedQuantities',
  async function () {
    let lines = await 'StocktakeLine'.bringChildrenOf(this)
    for ( var i = 0; i < lines.length; i++ ) {
      let line = lines[i]
      if ( line.countedQuantity !== 0 ) return true
    }
    return false
  }
)

'Stocktake'.method('deleteLines',
  async function () {
    let lines = await 'StocktakeLine'.bringChildrenOf(this)
    for ( var i = 0; i < lines.length; i++ ) {
      let line = lines[i]
      await line.trash()
    }
  }
)

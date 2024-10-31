'ProductShelf'.datatype({exportable: true})
'currentShelf'.field()
'shelf'.field()
'productName'.field()
'quantityOnHand'.field({numeric: true})

/* eslint-disable no-cond-assign */


'ProductShelf'.beforeImporting(async function(importRows) {

  let nameToProduct = async name => {
    if ( ! name ) return null
    let lcName = name.toLowerCase()
    let p; let ps = await 'products'.bring()
    while ( p = ps.__() ) {
      let pName = p.toNameFast(); if ( ! pName ) continue
      let pLcName = pName.toLowerCase()
      if ( pLcName === lcName )
        return p
    }
    return null
  }

  let rowToInventory = async row => {
    let product = await nameToProduct(row.productName); if ( ! product ) return null
    return await product.toInventory()
  }

  let res = []
  let index = {}
  for ( var i = 0; i < importRows.length; i++ ) {
    let row = importRows[i]
    let inv = await rowToInventory(row)
    if ( inv )
      inv.shelf = ''
    let productName = row.productName
    let existingRow = index[productName]
    if ( existingRow ) {
      existingRow.shelf = global.appendStr(existingRow.shelf, row.shelf, ', ')
      existingRow.quantityOnHand += row.quantityOnHand
    } else {
      index[productName] = row
      res.push(row)
    }
  }
  return res
})

'ProductShelf'.facade(async function() {
  let res = []
  let checkDup = {}
  let products = await 'products'.bring()
  for ( var i = 0; i < products.length; i++ ) {
    let product = products[i]
    let name =  product.toNameFast()
    if ( checkDup[name] ) continue
    checkDup[name] = true
    let inventory = await product.toInventory({allowCreate: true})
    res.push({id: product.id, currentShelf: inventory.shelf, productName: name, quantityOnHand: inventory.quantityOnHand})
  }
  return res
})

'ProductShelf'.beforeSaving(async function() {

  let nameToProduct = async name => {
    if ( ! name ) return null
    let lcName = name.toLowerCase()
    let p; let ps = await 'products'.bring()
    while ( p = ps.__() ) {
      let pName = p.toNameFast(); if ( ! pName ) continue
      let pLcName = pName.toLowerCase()
      if ( pLcName === lcName )
        return p
    }
    return null
  }

  let generateNumber = async () => {
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
    return res
  }

  let getAvgUnitCost = async parms => {
    let res = await parms.product.toAvgUnitCost()
    if ( res === global.unknownNumber() )
      res = 0
    return res
  }

  let createAdjustment = async parms => {
    let no = await generateNumber()
    let adj = await 'Adjustment'.bringOrCreate({adjustmentNumber: no})
    adj.date = global.todayYMD()
    adj.product = parms.product.reference()
    adj.quantity = parms.quantity
    adj.unitCostIncTax = await getAvgUnitCost(parms)
    adj.location = parms.location.reference()
    adj.reason = 'ProductShelf import'
    adj.refreshCalculations({force: true})
    adj.refreshIndexes()
    return adj
  }

  let product = await nameToProduct(this.productName)
  if ( ! product )
    throw(new Error('Unknown product: ' + this.productName))
  let inventory = await product.toInventory({allowCreate: true})
  inventory.shelf = global.appendStr(inventory.shelf, this.shelf, ", ")
  if ( inventory.quantityOnHand !== this.quantityOnHand ) {
    let location = await 'Location'.bringOrCreate({locationName: 'General'})
    await createAdjustment({
      product: product,
      quantity: this.quantityOnHand - inventory.quantityOnHand,
      location: location
    })
  }
  inventory.refreshCalculations({force: true})
})

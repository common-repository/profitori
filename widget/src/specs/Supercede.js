import React from 'react'
import { Container, Row, Col } from 'reactstrap'

'Supercede'.page({readOnly: false})
'Supercede Product'.title()
'Back'.action({act: 'cancel'})
'Process Now'.action()
'oldProduct'.field({refersTo: 'products'})
'newProduct'.field({refersTo: 'products'})
'updateBundles'.field({yesOrNo: true})
'blurb'.field({snippet: true})

/* eslint-disable no-cond-assign */

'updateBundles'.default('Yes')

'Supercede'.beforeLoading(async page => {
  let cast = page.callerCast()
  let product
  if ( cast.datatype() === 'products' )
    product = cast
  else if ( cast.toProduct )
    product = await cast.toProduct()
  if ( ! product ) 
    return
  page.setFieldValue('oldProduct', product.reference())
})

'Process Now'.act(async page => {

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
    if ( (res === 0) || (res === global.unknownNumber()) )
      res = await parms.fromProduct.toAvgUnitCost()
    if ( res === global.unknownNumber() )
      res = 0
    return res
  }

  let createAllotmentForClump = async (clump, parms) => {
    let adjustment = parms.adjustment
    let lot = await clump.toLot(); if ( ! lot ) return
    if ( lot.lotNumber === 'Unspecified' ) return
    let allotment = await 'Allotment'.create({parentCast: adjustment}, {allotmentParent: adjustment.reference()})
    allotment.product = parms.product.reference()
    allotment.lot = {datatype: 'Lot', keyval: lot.lotNumber}
    allotment.expiryDate = lot.expiryDate
    allotment.supplierLotNumber = lot.supplierLotNumber
    allotment.quantity = clump.quantityOnHand
    if ( parms.side === 'from' )
      allotment.quantity = - allotment.quantity
    allotment.refreshCalculations({force: true})
    allotment.refreshIndexes()
  }

  let addLots = async parms => {
    let clumps = parms.clumps
    for ( var i = 0; i < clumps.length; i++ ) {
      let clump = clumps[i]
      await createAllotmentForClump(clump, parms)
    }
  }

  let createAdjustment = async parms => {
    let no = await generateNumber()
    let adj = await 'Adjustment'.bringOrCreate({adjustmentNumber: no})
    adj.date = global.todayYMD()
    adj.product = parms.product.reference()
    adj.quantity = parms.quantity
    adj.unitCostIncTax = await getAvgUnitCost(parms)
    adj.location = parms.location.reference()
    adj.reason = 'Supercession'
    adj.refreshCalculations({force: true})
    adj.refreshIndexes()
    if ( parms.clumps )
      await addLots({adjustment: adj, clumps: parms.clumps, side: parms.side, product: parms.product})
    await adj.refreshUnspecifiedLot()
    return adj
  }

  let adjustClusterStock = async c => {
    let location = await c.toLocation()
    let clumps = await c.toClumps()
    let quantity = c.quantityOnHand
    let fromAdj = await createAdjustment(
      {product: oldProduct, location: location, quantity: -quantity, clumps: clumps, side: 'from', fromProduct: oldProduct}
    )
    fromAdj.notes = 'Substituted with new product'.translate() + ': ' + newProduct.uniqueName
    let toAdj = await createAdjustment(
      {product: newProduct, location: location, quantity: quantity, clumps: clumps, side: 'to', fromProduct: oldProduct}
    )
    toAdj.notes = 'Substituted for old product'.translate() + ': ' + oldProduct.uniqueName
  }

  let alterBundleFinishedGoods = async () => {
    let b, bs = await 'Bundle'.bring({product: oldProduct})
    while ( b = bs.__() ) {
      b.product = newProduct.reference()
      await b.refreshCalculations({force: true})
    }
  }

  let alterBundleComponents = async () => {
    let c, cs = await 'Component'.bring({product: oldProduct})
    while ( c = cs.__() ) {
      c.product = newProduct.reference()
      await c.refreshCalculations({force: true})
    }
  }

  let alterBundles = async () => {
    await alterBundleFinishedGoods()
    await alterBundleComponents()
  }

  let oldProduct = await page.referee('oldProduct')
  let updateBundles = page.getFieldValue('updateBundles')
  if ( ! oldProduct ) {
    page.showMessage('Please select an old product')
    return
  }
  let newProduct = await page.referee('newProduct')
  if ( ! oldProduct ) {
    page.showMessage('Please select a new product')
    return
  }
  if ( (await newProduct.toLotTracking()) !== (await oldProduct.toLotTracking()) ) {
    page.showMessage('New product has different serial/lot tracking options to the old product - these must be the same')
    return
  }
  if ( updateBundles === 'Yes' ) {
    if ( await newProduct.toBundle() ) {
      page.showMessage('New product already has a bundle')
      return
    }
  }
  await global.app.save()
  let c, cs = await oldProduct.toClusters()
  while ( c = cs.__() ) {
    await adjustClusterStock(c)
  }
  if ( updateBundles === 'Yes' )
    await alterBundles()
  await global.app.save()
  page.showMessage('Supercede complete')
})


'blurb'.content(
  <Container key="migrate" className="mt-5">
    <Row>
      <Col className="text-center mt-3">
        {'Click "Process Now" to supercede the old product with the new product.'.translate()}
      </Col>
    </Row>
    <Row>
      <Col className="text-center mt-3">
        {'This will adjust all stock quantities on hand out of the old product and into the new product, retaining locations and lot numbers.'.translate()}
      </Col>
    </Row>
  </Container>
)

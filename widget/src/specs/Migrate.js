import React from 'react'
import { Container, Row, Col } from 'reactstrap'

'Migrate'.page({expose: true, suppressOnMoreMenu: true})
'Copy ATUM Data'.title()
'Back'.action({act: 'cancel'})
'Start'.action()
'Update Empty Supplier SKUs and Costs'.action()
'blurb'.field({snippet: true})

'Update Empty Supplier SKUs and Costs'.act(async (page) => {

  let productCount = 0

  let doUpdate = async () => {
    let atumProds = await 'atumProduct'.bring()
    for ( var i = 0; i < atumProds.length; i++ ) {
      let changed = false
      await global.updateProgress(i / atumProds.length)
      let atumProd = atumProds[i]
      let product = await 'products'.bringFirst({id: atumProd.product_id}); if ( ! product ) continue
      let inv = await 'Inventory'.bringOrCreate({product: product})
      if ( (inv.lastPurchaseUnitCostIncTax === 0) || (inv.lastPurchaseUnitCostIncTax === global.unknownNumber()) ) {
        inv.lastPurchaseUnitCostIncTax = atumProd.purchase_price
        changed = true
      }
      if ( (inv.avgUnitCost === 0) || (inv.avgUnitCost === global.unknownNumber()) ) {
        inv.avgUnitCost = atumProd.purchase_price
        changed = true
      }
      if ( (! atumProd.supplier_id) || (atumProd.supplier_id === "0") ) {
        inv.supplierSku = atumProd.supplier_sku || inv.supplierSku
        changed = true
      } else {
        let atumSupplier = await 'atumSupplier'.bringFirst({id: atumProd.supplier_id}); if ( ! atumSupplier ) continue
        let supplier = await atumSupplier.toSupplier(); if ( ! supplier ) continue
        let av = await inv.toAvenue(supplier)
        if ( ! ( av && (av.isMain === 'Yes') && av.sku) ) {
          av = await inv.getOrCreateAvenue(supplier)
          av.sku = atumProd.supplier_sku || av.sku
          av.isMain = 'Yes'
          changed = true
        }
      }
      if ( changed )
        productCount++
    }
  }

  global.startProgress({message: "Updating empty Supplier SKUs and Costs"})
  try {
    await doUpdate()
    await global.foreman.doSave()
    global.foreman.flushCache()
  } finally {
    global.stopProgress()
  }
  page.showMessage(
    "Update complete.".translate() + " " + 
    "Products updated:".translate() + " " + productCount
  )
})

'Start'.act(async (page) => {

  let errMsg
  let addedCount = 0
  let modifiedCount = 0
  let productCount = 0
  let poAddedCount = 0
  let poModifiedCount = 0

  let atumSupplierIdToPrfiSupplierRef = async (id) => {
    if ( ! id ) return null
    let atumSupp = await 'atumSupplier'.bringSingle({id: id}); if ( ! atumSupp ) return null
    let supp = await atumSupp.toSupplier(); if ( ! supp ) return null
    return supp.reference()
  }

  let atumStatusToPrfiStage = async (status) => {
    if ( status === 'atum_pending' )
      return 'Entered'
    if ( status === 'atum_ordered' )
      return 'Sent to Supplier'
    if ( status === 'atum_receiving' )
      return 'Goods Arrived'
    if ( status === 'atum_onthewayin' )
      return 'Goods In Transit'
    return null
  }

  let getDeliverTo = async () => {
    let c = await 'Configuration'.bringSingle(); if ( ! c ) return null
    return await c.getFullDeliveryAddress()
  }

  let getOurContactDetails = async () => {
    let c = await 'Configuration'.bringSingle(); if ( ! c ) return null
    let res = c.phoneNumber
    if ( c.email ) {
      if ( res )
        res = res + ", "
      res = res + c.email
    }
    return res
  }

  let getGeneralLocationRef = async () => {
    let loc = await 'Location'.bringSingle({locationName: 'General'})
    return loc.reference()
  }

  let copyPOs = async () => {

    let po 
    let atumPO

    let copyPOLines = async () => {

      let idToProductRef = async (id) => {
        let p = await 'products'.bringSingle({id: id}); if ( ! p ) return null
        return p.reference()
      }

      let createProductLine = async (atumLine) => {
        if ( atumLine._qty === 0 ) return
        if ( atumLine._line_total === 0 ) return
        let prodRef = await idToProductRef(await atumLine.toProductOrVariationId()); if ( ! prodRef ) return
        let line = await 'POLine'.create(null, {purchaseOrder: po.reference()})
        line.lineType = 'Product'
        line.product = prodRef
        line.description = await line.toProductName()
        line.quantity = atumLine._qty
        let lineCostIncTax = atumLine._line_total + atumLine._line_tax
        line.unitCostIncTaxFX = lineCostIncTax / atumLine._qty
        line.taxPct = (atumLine._line_tax / atumLine._line_total) * 100
      }

      let createFeeLine = async (atumLine) => {
        if ( atumLine._line_total === 0 ) return
        let line = await 'POLine'.create(null, {purchaseOrder: po.reference()})
        line.lineType = 'Fee'
        line.description = atumLine.order_item_name
        line.quantity = 1
        let lineCostIncTax = atumLine._line_total + atumLine._line_tax
        line.unitCostIncTaxFX = lineCostIncTax
        line.taxPct = (atumLine._line_tax / atumLine._line_total) * 100
      }

      let createShippingLine = async (atumLine) => {
        if ( atumLine._cost === 0 ) return
        let line = await 'POLine'.create(null, {purchaseOrder: po.reference()})
        line.lineType = 'Shipping'
        line.description = atumLine.order_item_name
        line.quantity = 1
        let lineCostIncTax = atumLine._cost + atumLine._total_tax
        line.unitCostIncTaxFX = lineCostIncTax
        line.taxPct = (atumLine._total_tax / atumLine._cost) * 100
      }

      let atumLines = await 'atumPOLine'.bring({order_id: atumPO.id})
      for ( var j = 0; j < atumLines.length; j++ ) {
        let atumLine = atumLines[j]
        let atumType = atumLine.order_item_type
        if ( atumType === 'line_item' ) 
          await createProductLine(atumLine)
        else if ( atumType === 'fee' ) 
          await createFeeLine(atumLine)
        else if ( atumType === 'shipping' ) 
          await createShippingLine(atumLine)
      }
    }

    let suppRefToCurrencyRef = async suppRef => {
      if ( ! suppRef )
        return null
      let supp = await 'Supplier'.bringFirst({id: suppRef.id}); if ( ! supp ) return null
      return supp.currency2
    }

    let currencyRefToExchangeRate = async currencyRef => {
      if ( ! currencyRef )
        return 1
      let currency = await 'Currency'.bringFirst({id: currencyRef.id}); if ( ! currency ) return 1
      return currency.exchangeRate
    }

    let atumPOs = await 'atumPO'.bring()
    for ( var i = 0; i < atumPOs.length; i++ ) {
      await global.updateProgress(0.5 + ((i / atumPOs.length) * 0.25))
      atumPO = atumPOs[i]
      if ( atumPO._status === 'atum_received' ) 
        continue
      if ( ! atumStatusToPrfiStage(atumPO._status) )
        continue
      po = await 'PO'.bringFirst({purchaseOrderNumber: atumPO.id})
      if ( po ) {
        await po.trash()
        poModifiedCount++
      } else 
        poAddedCount++
      po = await 'PO'.create()
      po.purchaseOrderNumber = atumPO.id
      po.orderDate = atumPO._date_created
      po.supplier = await atumSupplierIdToPrfiSupplierRef(atumPO._supplier)
      po.expectedDeliveryDate = atumPO._date_expected
      po.stage = await atumStatusToPrfiStage(atumPO._status)
      po.deliverTo = await getDeliverTo()
      po.ourContactDetails = await getOurContactDetails()
      po.location = await getGeneralLocationRef()
      po.notesForSupplier = atumPO.notes
      po.status = 'Awaiting Delivery'
      po.currency = await suppRefToCurrencyRef(po.supplier)
      po.exchangeRate = await currencyRefToExchangeRate(po.currency)
      await copyPOLines()
    }
  }

  let currencyCodeToCurrencyRef = async (code) => {
    if ( ! code )
      return null
    let res = await 'Currency'.bringFirst({currencyCode: code}); 
    if ( ! res ) {
      errMsg = "Copy failed. Currency " + code + " not found - please configure via Profitori > Settings > Currencies"
      return null
    }
    return res.reference()
  }

  let copySuppliers = async () => {
    let atumSupps = await 'atumSupplier'.bring()
    for ( var i = 0; i < atumSupps.length; i++ ) {
      await global.updateProgress((i / atumSupps.length) * 0.25)
      let atumSupp = atumSupps[i]
      let supp = await 'Supplier'.bringFirst({name: atumSupp.name})
      if ( ! supp ) {
        supp = await 'Supplier'.create()
        addedCount++
      } else
        modifiedCount++
      supp.code = atumSupp._code
      supp.name = atumSupp.name
      supp.taxNumber = atumSupp._tax_number
      supp.phone = atumSupp._phone
      supp.mobile = atumSupp._phone
      supp.fax = atumSupp._fax
      supp.email = atumSupp._general_email
      supp.orderingEmail = atumSupp._ordering_email
      supp.webSite = atumSupp._website
      supp.orderingUrl = atumSupp._ordering_url
      supp.notes = atumSupp._description
      supp.address = atumSupp._address
      supp.city = atumSupp._city
      supp.state = atumSupp._state
      supp.postcode = atumSupp._zip_code
      supp.country = atumSupp._country
      supp.currency = atumSupp._currency // Legacy
      supp.currency2 = await currencyCodeToCurrencyRef(atumSupp._currency)
      supp.taxPct = atumSupp._tax_rate
      supp.discountPct = atumSupp._discount
      supp.deliveryLeadDays = atumSupp._lead_time
      if ( errMsg )
        break
    }
  }

  let copyProducts1 = async () => {
    let atumProds = await 'atumProduct'.bring()
    for ( var i = 0; i < atumProds.length; i++ ) {
      await global.updateProgress(0.25 + ((i / atumProds.length) * 0.25))
      let atumProd = atumProds[i]
      let product = await 'products'.bringFirst({id: atumProd.product_id}); if ( ! product ) continue
      let inv = await 'Inventory'.bringOrCreate({product: product})
      if ( ! atumProd.supplier_id )
        continue
      productCount++
      let atumSupplier = await 'atumSupplier'.bringFirst({id: atumProd.supplier_id}); if ( ! atumSupplier ) continue
      let supplier = await atumSupplier.toSupplier(); if ( ! supplier ) continue
      let av = await inv.getOrCreateAvenue(supplier)
      av.sku = atumProd.supplier_sku || av.sku
      av.isMain = 'Yes'
    }
  }

  let copyProducts2 = async () => {
    let atumProds = await 'atumProduct'.bring()
    for ( var i = 0; i < atumProds.length; i++ ) {
      await global.updateProgress(0.75 + ((i / atumProds.length) * 0.25))
      let atumProd = atumProds[i]
      let product = await 'products'.bringFirst({id: atumProd.product_id}); if ( ! product ) continue
      let inv = await 'Inventory'.bringOrCreate({product: product})
      if ( (inv.lastPurchaseUnitCostIncTax === 0) || (inv.lastPurchaseUnitCostIncTax === global.unknownNumber()) ) {
        inv.lastPurchaseUnitCostIncTax = atumProd.purchase_price
      }
    }
  }

  global.startProgress({message: "Copying data from ATUM to Profitori"})
  try {
    await copySuppliers()
    if ( ! errMsg ) {
      await global.foreman.doSave()
      await copyProducts1()
      await global.foreman.doSave()
      await copyPOs()
      await global.foreman.doSave()
      await copyProducts2()
      await global.foreman.doSave()
    }
  } finally {
    global.stopProgress()
  }
  if ( errMsg ) {
    page.showMessage(errMsg)
    return
  }
  page.showMessage(
    "Copy complete.".translate() + " " + 
    "Suppliers added:".translate() + " " + addedCount + " " + "modified:".translate() + " " + modifiedCount + "; " +
    "Products updated:".translate() + " " + productCount + "; " +
    "Purchase Orders added:".translate() + " " + poAddedCount + " " + "modified:".translate() + " " + poModifiedCount
  )

})

'blurb'.content(
  <Container key="migrate" className="mt-5">
    <Row>
      <Col className="text-center mt-3">
        Click "Start" to commence.  
      </Col>
    </Row>
    <Row>
      <Col className="text-center mt-3">
        This will copy Suppliers, Purchase Orders and Product information (purchase prices, product supplier and supplier SKUs) from ATUM to Profitori.  
        (Note: Received purchase orders will not be copied).
      </Col>
    </Row>
    <Row>
      <Col className="text-center mt-3">
        (NOTE: ATUM data will *not* be affected and you can continue to use ATUM after the data is copied).
      </Col>
    </Row>
  </Container>
)

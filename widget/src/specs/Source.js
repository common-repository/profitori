'Source'.datatype()
'description'.field({key: true})
'applicableSpecnames'.field()
'readOnly'.field({yesOrNo: true})

'Source'.data(async function() {
  let res = []

  let parmsToApplicableSpecNames = aParms => {
    let res = ''
    if ( aParms.invLev )
      res = res.appendWithSep("InventoryLevels.js", ",")
    if ( aParms.labels )
      res = res.appendWithSep("LabelsPdf.js", ",")
    return res
  }
  
  let addSource = (aParms) => {
    let applicableSpecnames = parmsToApplicableSpecNames(aParms)
    let readOnly = aParms.allowEdit ? "No" : "Yes"
    res.push({description: aParms.description, applicableSpecnames: applicableSpecnames, readOnly: readOnly})
  }

  let addNativeSources = () => {
    addSource({description: "Caption Only", labels: true})
    addSource({description: "Inventory.quantityOnHand", invLev: true})
    addSource({description: "Inventory.quantityOnPurchaseOrders", invLev: true})
    addSource({description: "Inventory.avgUnitCost", invLev: true, allowEdit: true})
    addSource({description: "Inventory.inventoryValue", invLev: true})
    addSource({description: "Inventory.inventoryValue2", invLev: true})
    addSource({description: "Inventory.inventoryValueExclTax", invLev: true})
    addSource({description: "Inventory.inventoryValueExclConsignment", invLev: true})
    addSource({description: "Inventory.inventoryValueExclConsignmentExclTax", invLev: true})
    addSource({description: "Inventory.inventoryValueRetail", invLev: true})
    addSource({description: "Inventory.minQuantity", invLev: true, allowEdit: true})
    addSource({description: "Inventory.maxQuantity", invLev: true, allowEdit: true})
    addSource({description: "Inventory.recommendedRetailPriceIncTax", invLev: true, labels: true, allowEdit: true})
    addSource({description: "Inventory.sku", invLev: true, labels: true})
    addSource({description: "Inventory.notes", invLev: true, labels: true})
    addSource({description: "Inventory.supplierSku", invLev: true, labels: true, allowEdit: true})
    addSource({description: "Inventory.productName", invLev: true, labels: true})
    addSource({description: "Inventory.lastPurchaseUnitCostIncTax", invLev: true, labels: true, allowEdit: true})
    addSource({description: "Inventory.wooCommerceRegularPrice", invLev: true, labels: true, allowEdit: true})
    addSource({description: "Inventory.wooCommerceRegularPriceIncTax", invLev: true, labels: true})
    addSource({description: "Inventory.wooCommerceRegularPriceExclTax", invLev: true, labels: true})
    addSource({description: "Inventory.barcode", invLev: true, labels: true})
    addSource({description: "Inventory.mainSupplier", invLev: true, labels: true})
    addSource({description: "Inventory.estSalesUnitsPerDay", invLev: true, allowEdit: true})
    addSource({description: "Inventory.priorWeeksSalesUnits", invLev: true})
    addSource({description: "Inventory.priorWeeksSalesValue", invLev: true})
    addSource({description: "Inventory.priorWeeksSalesValueExclTax", invLev: true})
    addSource({description: "Inventory.priorWeeksSASalesUnits", invLev: true})
    addSource({description: "Inventory.priorWeeksSASalesValue", invLev: true})
    addSource({description: "Inventory.priorWeeksSASalesValueExclTax", invLev: true})
    addSource({description: "Inventory.totalSalesUnits", invLev: true})
    addSource({description: "Inventory.marginPct", invLev: true})
    addSource({description: "Inventory.lastSaleDate", invLev: true})
    addSource({description: "Inventory.lastPurchaseDate", invLev: true})
    addSource({description: "Inventory.lastReceivedDate", invLev: true})
    addSource({description: "Inventory.situation", invLev: true})
    addSource({description: "Inventory.avgUnitCostExclTax", invLev: true, allowEdit: true})
    addSource({description: "Inventory.quantityPackable", invLev: true})
    addSource({description: "Inventory.quantityPackable2", invLev: true})
    addSource({description: "Inventory.quantityPickable", invLev: true})
    addSource({description: "Inventory.quantityMakeable", invLev: true})
    addSource({description: "Inventory.quantityAllocatedForPicking", invLev: true})
    addSource({description: "Inventory.quantityAllocatedForMaking", invLev: true})
    addSource({description: "Inventory.quantityReservedForCustomerOrders", invLev: true})
    addSource({description: "Inventory.deepestCategoryName", invLev: true, labels: true})
    addSource({description: "Inventory.bundle", invLev: true})
    addSource({description: "Inventory.thumbnailImage", invLev: true})
    addSource({description: "Inventory.intrastatHSCode", invLev: true})
    addSource({description: "Inventory.shelf", invLev: true, labels: true})
    addSource({description: "Inventory.nextExpectedDeliveryDate", invLev: true})
    addSource({description: "Inventory.externalQuantityOnHand", invLev: true})
    addSource({description: "Inventory.externalPrice", invLev: true})
    addSource({description: "Inventory.externalPriceFX", invLev: true})
    addSource({description: "Inventory.defaultLocation", invLev: true})
    addSource({description: "POReceiptLine.receiptNumber", labels: true})
    addSource({description: "POReceiptLine.descriptionAndSKU", labels: true})
    addSource({description: "POReceiptLine.orderedQuantity", labels: true})
    addSource({description: "POReceiptLine.receivedQuantity", labels: true})
    addSource({description: "POReceiptLine.previouslyReceived", labels: true})
    addSource({description: "POReceiptLine.cancelledQuantity", labels: true})
    addSource({description: "POReceiptLine.outstandingQuantity", labels: true})
    addSource({description: "POReceiptLine.unitCost", labels: true})
    addSource({description: "POReceiptLine.unitCostFX", labels: true})
    addSource({description: "POReceiptLine.supplier", labels: true})
    addSource({description: "POReceiptLine.recommendedRetailPriceIncTax", labels: true})
    addSource({description: "POReceiptLine.recommendedRetailPriceExclTax", labels: true})
    addSource({description: "POReceiptLine.barcode", labels: true})
    addSource({description: "Inventory.purchasingUOM", invLev: true, labels: true})
    addSource({description: "Inventory.stockingUOM", invLev: true, labels: true})
  }

  let addWCProductMetakeys = async () => {
    addSource({description: "WC Product.name", invLev: true, labels: true, allowEdit: false})
    let metakeys = await 'metakey'.bring()
    metakeys.forAll(metakey => {
      addSource({description: "WC Product." + metakey.name, invLev: true, labels: true, allowEdit: false})
    })
  }

  let addWCProductAttributes = async () => {
    let attributes = await 'attribute'.bring()
    attributes.forAll(attribute => {
      addSource({description: "WC Product Attribute." + attribute.name, invLev: true, labels: true, allowEdit: false})
    })
  }

  addNativeSources()
  await addWCProductMetakeys()
  await addWCProductAttributes()
  addSource({description: "WC Product.wpl_ebay_id", invLev: true, labels: true, allowEdit: false}) // has special treatment on server
  addSource({description: "WC Product.wpl_ebay_category_name", invLev: true, labels: true, allowEdit: false}) // has special treatment on server
  return res
})

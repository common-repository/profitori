'PurchasePriceChanges'.list()
'Purchase Price Changes'.title()
'Back'.action({act: 'cancel'})
'Refresh'.action({act: "refresh"})
'Download to Excel'.action({act: 'excel'})

'PPC'.datatype({transient: true})

'supplier'.field({refersTo: 'Supplier', showAsLink: true})
'product'.field({refersTo: 'products', showAsLink: true})
'orderDate'.field({date: true, caption: 'Date'})
'oldPrice'.field({numeric: true, decimals: 2})
'newPrice'.field({numeric: true, decimals: 2})
'increaseAmount'.field({numeric: true, decimals: 2})
'increasePercentage'.field({numeric: true, decimals: 1, caption: 'Increase %'})
'oldPO'.field({refersTo: 'PO', showAsLink: true})
'newPO'.field({refersTo: 'PO', showAsLink: true})

'PurchasePriceChanges'.beforeLoading(async list => {
  
  let poLines

  let sortBySupplierByProductByDate = async () => {
    for ( var i = 0; i < poLines.length; i++ ) {
      let poLine = poLines[i]
      let po = await poLine.toPO(); if ( ! po ) continue
      poLine._supplierKeyval = po.supplier && po.supplier.keyval
      poLine.orderDate = po.orderDate
    }
    poLines.sort((a, b) => {
      let supplierKeyA = a._supplierKeyval
      let supplierKeyB = b._supplierKeyval
      let productKeyA = a.product ? a.product.keyval : ''
      let productKeyB = b.product ? b.product.keyval : ''
      if ( supplierKeyA > supplierKeyB )
        return 1
      else if ( supplierKeyA < supplierKeyB )
        return -1
      else {
        if ( productKeyA > productKeyB )
          return 1
        else if ( productKeyA < productKeyB )
          return -1
        else {
          if ( a.orderDate > b.orderDate )
            return 1
          else
            return -1
        }
      }
    })
  }

  'PPC'.clear()
  poLines = await 'POLine'.bring()
  await sortBySupplierByProductByDate()
  let newPOLine
  let oldPO
  let newPO
  let oldSupplier
  let newSupplier
  let oldProduct
  let newProduct
  let oldPrice
  let newPrice
  for ( var i = 0; i < poLines.length; i++ ) {
    newPOLine = poLines[i]
    oldPO = newPO
    newPO = await newPOLine.toPO(); if ( ! newPO ) continue
    oldSupplier = newSupplier
    newSupplier = await newPO.toSupplier(); if ( ! newSupplier ) continue
    let oldSupplierId = oldSupplier && oldSupplier.id
    oldProduct = newProduct
    let oldProductId = oldProduct && oldProduct.id
    newProduct = await newPOLine.toProduct(); if ( ! newProduct ) continue
    oldPrice = newPrice
    newPrice = newPOLine.unitCostIncTaxFX
    if ( newSupplier.id !== oldSupplierId ) continue
    if ( newProduct.id !== oldProductId ) continue
    if ( newPrice === oldPrice ) continue
    let ppc = await 'PPC'.create()
    ppc.supplier = newSupplier.reference()
    ppc.product = newProduct.reference()
    ppc.orderDate = newPO.orderDate
    ppc.oldPrice = oldPrice
    ppc.newPrice = newPrice
    ppc.increaseAmount = ppc.newPrice - ppc.oldPrice
    ppc.increasePercentage = ppc.oldPrice > 0 ? (ppc.increaseAmount / ppc.oldPrice) * 100 : 100
    ppc.oldPO = oldPO.reference()
    ppc.newPO = newPO.reference()
  }

})

'product'.destination(async ppc => {
  let pref = ppc.product; if ( ! pref ) return null
  if ( ! pref.id ) return null
  let p = await 'products'.bringFirst({id: pref.id})
  return p
})


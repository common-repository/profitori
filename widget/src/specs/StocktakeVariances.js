'StocktakeVariances'.list()
'Stocktake Variances'.title()
'Back'.action({act: 'cancel'})
'Refresh'.action({act: "refresh"})
'Download to Excel'.action({act: 'excel'})

'StocktakeVariance'.datatype({transient: true})
'product'.field({refersTo: 'products', key: true, showAsLink: true})
'sku'.field()
'wooCommerceRegularPrice'.field({numeric: true, caption: 'WooCommerce Regular Price'})
'countedQuantity'.field({numeric: true, readOnly: false})
'systemQuantity'.field({numeric: true})
'discrepancy'.field({numeric: true})
'discrepancyValueExclTax'.field({numeric: true, decimals: 2, showTotal: true, caption: 'Discrepancy Value (Excl Tax)'})

'StocktakeVariances'.defaultSort({field: "product"})

'StocktakeVariances'.beforeLoading(async list => {

  let line
  
  let createStocktakeVariance = async product => {
    let stv = await 'StocktakeVariance'.bringOrCreate({product: line.product})
    stv.product = line.product
    stv.sku = line.sku
    stv.wooCommerceRegularPrice = line.wooCommerceRegularPrice
    stv.countedQuantity = line.countedQuantity
    stv.systemQuantity = line.systemQuantity
    stv.discrepancy = line.discrepancy
    let inv = await line.toInventory()
    let cost = inv ? inv.avgUnitCostExclTax : global.unknownNumber()
    if ( (cost === global.unknownNumber()) && (stv.discrepancy !== 0) ) 
      stv.discrepancyValueExclTax = global.unknownNumber()
    else {
      let countedValue = line.countedQuantity * cost
      let systemValue = line.systemQuantity * cost
      stv.discrepancyValueExclTax = countedValue - systemValue
    }
  }

  'StocktakeVariance'.clear()
  let stocktake = list.callerCast(); if ( ! stocktake ) return
  let lines = await 'StocktakeLine'.bringChildrenOf(stocktake)
  for ( var i = 0; i < lines.length; i++ ) {
    line = lines[i]
    await createStocktakeVariance()
  }

})

'product'.destination(async stv => {
  let pref = stv.product; if ( ! pref ) return null
  if ( ! pref.id ) return null
  let p = await 'products'.bringFirst({id: pref.id})
  return p
})


'RecalcAvgCosts'.list({withHeader: true})
'Recalculate Average Unit Costs'.title()
'Back'.action({act: 'cancel'})

'Lines'.manifest()
'Go'.action({place: 'header', spinner: true})
'products'.datatype({source: "WC"})
'uniqueName'.field({key: true, caption: "Product"})
'Inventory'.datatype()
'product'.field({refersTo: 'products', key: true, readOnly: true, hidden: true})
'avgUnitCost'.field({numeric: true, minDecimals: 2, maxDecimals: 6, caption: 'Avg Unit Cost'})

'Go'.act(async (list) => {

  let doIt = async function() {
    list.startProgress({message: "Recalculating..."})
    try {
      let configuration = await 'Configuration'.bringSingle()
      configuration.avgAlg = 'Dynamic Refresh'
      configuration.updCostHist = 'Yes'
      configuration.prHistCost = 'Yes'
      await list.foreman().doSave()
      let products = await 'products'.bring()
      let len = products.length
      for ( var i = 0; i < products.length; i++ ) {
        let product = products[i]
        let inventory = await product.toInventory(); if ( ! inventory ) continue
        inventory.avgAlg = 'Dynamic Refresh'
        await inventory.refreshAvgUnitCost()
        await list.foreman().doSave({msgOnException: true})
        await list.updateProgress(i / len)
      }
    } finally {
      list.stopProgress()
    }
    list.showMessage("Process complete - average unit costs have been updated")
  }

  list.showMessage("WARNING: This will update all Profitori average unit costs. It will also correct historical transaction costs and set " +
      "the Average Costing Algorithm to Dynamic Refresh for all products. Are you sure?",
    {yesNo: true, onYes: doIt}
  )

})


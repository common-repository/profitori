'SAProductList'.list()
'Sales Analysis'.title()
'Back'.action({act: 'cancel'})
'Refresh'.action({act: "refresh"})
'Download to Excel'.action({act: 'excel'})

'Inventory'.datatype()
'productName'.field({caption: 'Product'})
'sku'.field()
'quantityPickable'.field()
'quantityOnPurchaseOrders'.field({caption: "On Purchase Orders"})
'priorWeeksSASalesUnits'.field({showAsLink: true})
'avgUnitCost'.field()

'SAProductList'.defaultSort({field: 'productName'})

'SAProductList'.beforeLoading(async list => {
  await list.harmonize()
})

'priorWeeksSASalesUnits'.destination(async inventory => {
  return 'SAProductCustomerList.js'
})

'priorWeeksSASalesUnits'.caption(async (list) => {
  let config = await 'Configuration'.bringFirst()
  let priorWeekCount = await config.getSalesAnalysisPriorWeeks()
  return "Last".translate() + " " + priorWeekCount + " " + "Weeks Sales".translate()
})

'SAProductList'.filter(async inventory => {
  return inventory.quantityPickable || inventory.quantityOnPurchaseOrders || inventory.priorWeeksSalesUnits
})

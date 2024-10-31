"Report".datatype()
"description".field({key: true})
"specname".field()

"Report".data(async function() {
  let res = []
  
  let addReport = (aParms) => {
    if ( global.gApp.shouldHideSpec(aParms.specname) ) 
      return
    res.push({description: aParms.description.translate(), specname: aParms.specname})
  }

  let addNativeReports = () => {
    addReport({description: "Short Stock", specname: "ViewLowInventory.js"})
    addReport({description: "Forward Cover", specname: "ForwardCoverReport.js"})
    addReport({description: "Overdue Purchase Order Stock", specname: "OverduePOStock.js"})
    addReport({description: "Outstanding Purchase Order Stock", specname: "OutstandingPOStock.js"})
    addReport({description: "Purchase Orders", specname: "POReport.js"})
    addReport({description: "Suppliers", specname: "SupplierReport.js"})
    addReport({description: "Unpaid Invoices", specname: "UnpaidInvoices.js"})
    addReport({description: "Tax Report (Purchases)", specname: "TaxReport.js"})
    addReport({description: "Profits by Supplier", specname: "ProfitsBySupplier.js"})
    addReport({description: "Profits by Category", specname: "ProfitsByCategory.js"})
    addReport({description: "Profits By Category Chart", specname: "ProfitsByCategoryPie.js"})
    addReport({description: "Profits By Week Chart", specname: "ProfitsByWeekLineGraph.js"})
    addReport({description: "Purchase Price Changes", specname: "PurchasePriceChanges.js"})
    addReport({description: "Supplier Products", specname: "ProductReport.js"})
    addReport({description: "Unpaid Purchase Orders", specname: "UnpaidPurchaseOrders.js"})
    addReport({description: "Goods Received", specname: "GoodsReceived.js"})
    addReport({description: "Adjustments", specname: "AdjustmentReport.js"})
    addReport({description: "Outstanding Purchase Order Payments", specname: "OutstandingPaymentsReport.js"})
    addReport({description: "Supplier Payments", specname: "SupplierPaymentsReport.js"})
    addReport({description: "Sales Analysis", specname: "SAProductList.js"})
    addReport({description: "PO Stage and Status Transitions Report", specname: "TransitionReport.js"})
  }

  addNativeReports()
  return res
})

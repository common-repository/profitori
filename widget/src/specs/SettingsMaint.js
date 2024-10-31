'SettingsMaint'.maint({expose: true, panelStyle: "titled", icon: 'Cog'})
'Settings'.title()
'Back'.action({act: 'cancel'})
'OK'.action({act: 'ok'})
'Security'.action({spec: "ManageSecurity.js", icon: 'Lock'})
'Manage Account'.action({spec: "ManageAccount.js"})
'Currencies'.action({spec: "CurrencyList.js"})
'Units of Measure'.action({spec: "UOMList.js"})
'Auto Numbering'.action({spec: 'NextNumberList.js'})
'Utilities'.action({spec: "Utilities.js"})
'Modify Profitori'.action({spec: "Modify.js"})
'Configuration'.datatype()

'Regional Settings'.panel()
'shortDateFormat'.field()
'displayDatesUsingShortDateFormat'.field({yesOrNo: true})
'lun'.field({caption: 'Length Unit for Label Layout'})

'lun'.inception('mm')
'lun'.options(['mm', 'in'])

'Reporting'.panel()
'salesProjectionPriorWeeks'.field()
'salesAnalysisPriorWeeks'.field()
'transactionRecentWeeks'.field()
'poPdfLogoUrl'.field({caption: 'PDF Logo URL'})

'System Settings'.panel()
'trb'.field()
'tbs'.field({readOnly: true})
'databaseOptimized'.field({readOnly: true})
'cdr'.field()
'classicDatabaseUpdates'.field({yesOrNo: true})
'subselects'.field({yesOrNo: true, caption: 'Use Database Subselects Instead of Joins'})
'highConcurrency'.field({yesOrNo: true})
'optimisticLocking'.field({yesOrNo: true})
'logChangesToStockForProblemDiagnosis'.field({yesOrNo: true})
'treatOldIncompleteOrdersAsInactive'.field({yesOrNo: true, caption: 'Treat Old Incomplete WC Orders As Inactive'})

'subselects'.inception('Yes')

'Attachments'.panel()
'storeAttachmentsInSecureLocation'.field()
'attachmentsPathOnServer'.field()
'useAttachmentSubfolders'.field()

'Inventory'.panel()
'defaultStockingUOM'.field({refersTo: 'UOM', caption: 'Default Stocking Unit of Measure'})
'showUOMOnPOLines'.field({yesOrNo: true, caption: 'Show Unit of Measure on PO Lines'})
'suppressPOQuantityOnHandUpdates'.field({caption: 'Suppress PO Receipt Updates to Quantity On Hand'})
'alwaysCreateInventoryRecord'.field()
'avgAlg'.field({caption: 'Average Costing Algorithm'})
'updCostHist'.field({caption: 'Update Inventory Historical Unit Costs When Recalculating Average Cost', yesOrNo: true})
'hideDisc'.field({yesOrNo: true, caption: 'Hide Discontinued Products From Customers'})

'avgAlg'.options(['Dynamic Refresh', 'Simple Weighted'])

'avgAlg'.inception('Dynamic Refresh')

'updCostHist'.inception('Yes')

''.panel()

'Purchasing'.panel()
'businessName'.field()
'deliveryAddress'.field({caption: 'Address for Deliveries'})
'deliveryCity'.field({caption: 'City/Suburb/Town'})
'deliveryState'.field({caption: 'State/Province'})
'deliveryPostcode'.field({caption: 'Postal/Zip Code'})
'deliveryCountry'.field({caption: 'Country'})
'email'.field()
'phoneNumber'.field({caption: 'Phone'})
'taxPct'.field({numeric: true, decimals: 2, caption: "Default Tax %"}) 
'enterPurchasePricesInclusiveOfTax'.field({yesOrNo: true})
'excludeTaxFromPOPdf'.field()
'sortPOPdfBySupplierSku'.field()
'viewSalesHistoryInPurchasing'.field()
'allowDeliveryDatesOnPOLines'.field({yesOrNo: true, caption: 'Allow Separate Delivery Dates On PO Lines'})
'startPOReceiptsAsZero'.field()
'autoLoadSupplierProductData'.field({yesOrNo: true})
'ptr'.field()
'spt'.field()
'pte'.field({multiLine: true})

'pte'.visibleWhen((maint, config) => {
  return config.spt === 'Yes'
})

'Sales Invoicing'.panel()
'salesInvoiceBusinessName'.field({caption: "Business Name"})
'salesInvoiceAddress'.field({caption: 'Address for Sales Invoices'})
'salesInvoiceCity'.field({caption: 'City/Suburb/Town'})
'salesInvoiceState'.field({caption: 'State/Province'})
'salesInvoicePostcode'.field({caption: 'Postal/Zip Code'})
'salesInvoiceCountry'.field({caption: 'Country'})
'salesInvoiceEmail'.field({caption: 'Email'})
'salesInvoicePhoneNumber'.field({caption: 'Phone'})
'salesInvoiceTaxId'.field({caption: 'Tax ID'})
'crn'.field({caption: 'Company Registration Number'})
'ibn'.field({caption: 'IBAN'})
'salesInvoicePaymentInstructions'.field({caption: 'Payment Instructions'})
'salesInvoiceTerms'.field({caption: 'Terms'})
'salesInvoiceDaysToPay'.field({caption: 'Days to Pay', numeric: true})

'Supplier Payments'.panel()
'supplierPaymentHandling'.field()

'Stocktake'.panel()
'showDiscrepanciesInCountPage'.field({yesOrNo: true})

'Sales Order Management'.panel()
'asd'.field({caption: "Automatically Show Discounts In Store", yesOrNo: true})
'ump'.field({caption: "Use Markup Pricing", yesOrNo: true})

'Profit Reporting'.panel()
'prDateType'.field({caption: 'Date To Use For Profit Reporting'})
'prHistCost'.field({caption: 'Use Inventory Historical Unit Costs when Viewing Profits', yesOrNo: true})

'prDateType'.options(['Order Payment Date', 'Order Date'])

'prHistCost'.inception('Yes')

'tbs'.visibleWhen((maint, config) => {
  return config.trb && (config.trb !== 'Off')
})

'trb'.afterUserChange(async (oldInputValue, newInputValue, config, maint) => {
  if ( (! config.trb) || (config.trb === 'Off') ) {
    config.tbs = '';
    return
  }
  config.tbs = 'Pending'
})

'attachmentsPathOnServer'.visibleWhen((maint, configuration) => {
  return configuration.storeAttachmentsInSecureLocation === 'Yes'
})

'supplierPaymentHandling'.options(['Manually Mark POs as Paid', 'Multiple Payments Per PO'])

'supplierPaymentHandling'.inception('Manually Mark POs as Paid')

'SettingsMaint'.onSave(async (maint, config) => {
  
  let condense = async () => {
    config.tbs = 'Conversion Started'
    await global.app.save()
    config.condense()
  }

  let cancel = async () => {
    config.trb = 'Off'
    config.tbs = ''
    await global.app.save()
  }

  if ( config.trb && (config.trb !== 'Off') && (config.tbs === 'Pending') ) {
    maint.showMessage(("You're turning on Turbo mode.  Please backup your system before proceeding. " + 
      " This will take a while to complete and may place extra load on your system while it's processing.  Do you wish to proceed?").translate(),
      {yesNo: true, onYes: condense, onNo: cancel}
    )
  }
})


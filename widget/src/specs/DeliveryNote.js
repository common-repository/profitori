'DeliveryNote'.output()
'DELIVERY NOTE'.title()
'POReceipt'.datatype()

'Header'.section({pageHeading: true})
'receiptNumber'.field()
'purchaseOrder'.field()
'receivedDate'.field({date: true})
'supplier'.field()
'currency'.field()
'exchangeRate'.field({rightAlign: false})
'location'.field()

'Lines'.manifest()
'POReceiptLine'.datatype()
'descriptionAndSKU'.field({width: 59})
'supplierSku'.field({width: 15})
'receivedQuantity'.field({caption: "Qty", width: 12})
'unitCostExclTaxFX'.field({caption: "Price", width: 14})
'taxPct'.field({caption: "Tax %", width: 13})
'unitCostIncTaxFXRounded'.field({caption: "Price (Inc Tax)", width: 16})
'lineCostIncTaxFX'.field({caption: "Amount", width: 15})

'Lines'.filter(async (recLine, output) => {
  return recLine.receivedQuantity !== 0
})

'Footer'.section({outputFooter: true, width: 130, rightAlign: true})
'POReceipt'.datatype()
'costExclTaxFX'.field({caption: "Total Value (Excl Tax)", width: 65, fontSize: 12, rightAlign: true})
'costIncTaxFXWithCurrency'.field({caption: "Total Value (Inc Tax)", width: 65, fontSize: 12, rightAlign: true})

'DeliveryNote'.getCasts(async output => {
  if ( output.cast ) 
    return [output.cast] // individual, set by Maint
  return await 'POReceipt'.bring({include: 'Yes'})
})

'POPdf'.output({rowsPerPage: 10, version: 2})
//'PURCHASE ORDER'.title()
'PO'.datatype()

'Banner'.section({pageHeading: true, rightAlign: true})
'BannerMain'.subsection({captionPosition: "none"})
'businessName'.field()
'pdfLogo'.field({image: true, height: 24, width: 72})

'Banner2'.section({pageHeading: true, height: 16})
'BannerTitle'.subsection({captionPosition: "none"})
'pdfTitle'.field({fontSize: 28})

'Header'.section({pageHeading: true})
'purchaseOrderNumber'.field({caption: "Order Number"})
'orderDate'.field({caption: "Date"})
'deliverTo'.field()
'ourContactDetails'.field({caption: ''})
'notesForSupplier'.field({caption: 'Notes'})
'supplier'.field({caption: "Supplier"})
'supplierFullAddress'.field({caption: ""})
'supplierReference'.field()

'Lines'.manifest()
'POLine'.datatype()
'descriptionAndSKU'.field({width: 53})
'supplierSku'.field({width: 22})
'quantityPUWithUOM'.field({caption: "Qty", width: 16, rightAlign: true})
'unitCostExclTaxFX'.field({caption: "Price", width: 14})
'taxPct'.field({caption: "Tax %", width: 10})
'unitCostIncTaxFXRounded'.field({caption: "Price (Inc Tax)", width: 16})
'lineCostExclTaxFX'.field({caption: "Amount", width: 15})
'lineCostIncTaxFX'.field({caption: "Amount", width: 15})

'descriptionAndSKU'.dynamicWidth(writer => {
  let res = 53
  let configuration = 'Configuration'.bringSingleFast(); if ( ! configuration ) return true
  if ( configuration.excludeTaxFromPOPdf === 'Yes' )
    res = 89
  return res
})

'taxPct'.columnVisibleWhen((writer, po) => {
  let configuration = 'Configuration'.bringSingleFast(); if ( ! configuration ) return true
  return (configuration.excludeTaxFromPOPdf !== 'Yes')
})

'unitCostIncTaxFXRounded'.columnVisibleWhen((writer, po) => {
  let configuration = 'Configuration'.bringSingleFast(); if ( ! configuration ) return true
  return (configuration.excludeTaxFromPOPdf !== 'Yes')
})

'lineCostIncTaxFX'.columnVisibleWhen((writer, po) => {
  let configuration = 'Configuration'.bringSingleFast(); if ( ! configuration ) return true
  return (configuration.excludeTaxFromPOPdf !== 'Yes')
})

'lineCostExclTaxFX'.columnVisibleWhen((writer, po) => {
  let configuration = 'Configuration'.bringSingleFast(); if ( ! configuration ) return true
  return (configuration.excludeTaxFromPOPdf === 'Yes')
})

'Lines'.defaultSort(async () => {
  let c = await 'Configuration'.bringFirst()
  if ( c.sortPOPdfBySupplierSku === 'Yes' )
    return {field: 'supplierSku'}
})

'Footer'.section({outputFooter: true, width: 130, rightAlign: true, lineHeight: 4})
'PO'.datatype()
'costExclTaxFX'.field({caption: "Order Amount (Excl Tax)", width: 65, fontSize: 10, rightAlign: true})
'taxFX'.field({caption: "Tax", width: 65, fontSize: 10, rightAlign: true})
'costIncTaxFXWithCurrency'.field({caption: "Order Amount (Inc Tax)", width: 65, fontSize: 12, rightAlign: true})
'paymentTerms'.field({rightAlign: false})

'paymentTerms'.visibleWhen((writer, po) => {
  return global.confVal('spt') === 'Yes'
})

'costExclTaxFX'.visibleWhen((writer, po) => {
  let configuration = 'Configuration'.bringSingleFast(); if ( ! configuration ) return true
  return (configuration.excludeTaxFromPOPdf === 'Yes')
})

'taxFX'.visibleWhen((writer, po) => {
  let configuration = 'Configuration'.bringSingleFast(); if ( ! configuration ) return true
  return (configuration.excludeTaxFromPOPdf === 'Yes')
})


'POList'.list({expose: true, icon: 'PeopleArrows'})
'Purchase Orders'.title()
'Back'.action({act: 'cancel'})
'Add'.action({act: 'add'})
'PDFs'.action() 
'Select All'.action() 
'Select None'.action() 
'Download PDFs'.action() 
'Refresh'.action({act: "refresh"})
'Download to Excel'.action({act: 'excel'})
'View Short Stock'.action({spec: "ViewLowInventory.js"})
'Tax Report'.action({spec: "TaxReport.js"})
'Unpaid Purchase Orders'.action({spec: "UnpaidPurchaseOrders.js"})
'Outstanding Payments'.action({spec: "OutstandingPaymentsReport.js"})
'PO'.datatype()
'include'.field({ephemeral: true, tickbox: true, allowInput: true}) 
'purchaseOrderNumber'.field({key: true})
'orderDate'.field()
'location'.field({showAsLink: true})
'supplier'.field({showAsLink: true})
'stage'.field()
'status'.field({translateOnDisplay: true})
"carrier".field()
'trackingNumber'.field({caption: "Tracking#"})
'expectedDeliveryDate'.field()
'attachmentIcon'.field({icon: true, caption: ''})
'PDF'.action({place: 'row'}) 
'Edit'.action({place: 'row', act: 'edit'})
'Trash'.action({place: 'row', act: 'trash'})
'POMaint.js'.maintSpecname()

'attachmentIcon'.calculate(async po => {
  let attachment = await 'Attachment'.bringFirst({theParentId: po.id})
  if ( attachment )
    return 'Paperclip'
})

'attachmentIcon'.destination(async po => {
  return 'AttachmentsByParent.js'
})

'include'.visibleWhen(list => { 
  return list.situation()._doingPDFs 
}) 

'Unpaid Purchase Orders'.availableWhen((cast, list) => { 
  return global.confVal('supplierPaymentHandling') !== 'Multiple Payments Per PO'
})

'Outstanding Payments'.availableWhen((cast, list) => { 
  return global.confVal('supplierPaymentHandling') === 'Multiple Payments Per PO'
})

'PDFs'.availableWhen((cast, list) => { 
  return ! list.situation()._doingPDFs 
}) 

'PDFs'.act(async (list, cast) => { 
  list.situation()._selectedAll = true 
  list.casts().forEach(po => po.include = 'Yes') 
  list.dataChanged() 
  list.situation()._doingPDFs = true 
}) 

'Select All'.act(async (list, cast) => { 
  list.situation()._selectedAll = true 
  list.casts().forEach(po => po.include = 'Yes') 
  list.dataChanged() 
}) 

'Select All'.availableWhen((cast, list) => { 
  let s = list.situation() 
  return s._doingPDFs && (! s._selectedAll) 
}) 

'Select None'.act(async (list, cast) => { 
  list.situation()._selectedAll = false 
  list.casts().forEach(po => po.include = 'No') 
  list.dataChanged() 
}) 

'Select None'.availableWhen((cast, list) => { 
  let s = list.situation() 
  return s._doingPDFs && s._selectedAll 
}) 

'Download PDFs'.availableWhen((cast, list) => { 
  return list.situation()._doingPDFs 
}) 

'Download PDFs'.act(async list => { 
  let pos = await 'PO'.bring({include: 'Yes'}) 
  if ( pos.length === 0 ) { 
    list.showMessage('Please select at least one order to include') 
    return 
  } 
  list.downloadPDF({casts: pos, spec: "POPdf.js", docName: "Purchase Orders.PDF"}) 
  list.dataChanged() 
}) 

'PDF'.act(async (list, po) => { 
  list.downloadPDF({cast: po, spec: "POPdf.js", docName: po.purchaseOrderNumber + ".PDF"}) 
}) 

'POList'.defaultSort({field: "orderDate", descending: true})

'PO'.allowTrash(async function() {
  let rec = await 'POReceipt'.bringFirst({purchaseOrder: this}) 
  if ( rec ) 
    return 'Cannot trash this purchase order as there is a receipt for it:'.translate() + ' ' + rec.receiptNumber
  let payment = await 'Payment'.bringFirst({purchaseOrder: this}); 
  if ( payment ) 
    return 'Cannot trash this purchase order as there is a payment for it'.translate()
})

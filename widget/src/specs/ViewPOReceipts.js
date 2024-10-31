'ViewPOReceipts'.list()
'View Receipts'.title()
'POReceipt'.datatype()
'Back'.action({act: 'cancel'})
'Delivery Notes'.action()
'Select All'.action()
'Select None'.action()
'Download Delivery Notes PDF'.action()
'Refresh'.action({act: "refresh"})
'include'.field({ephemeral: true, tickbox: true, allowInput: true})
'receiptNumber'.field()
'receivedDate'.field()
'supplier'.field({showAsLink: true})
'carrier'.field()
'trackingNumber'.field({caption: 'Tracking#'})
'attachmentIcon'.field({icon: true, caption: ''})
'Edit'.action({place: 'row', act: 'edit'});
'Trash'.action({place: 'row', act: 'trash'});
'POReceiptMaint.js'.maintSpecname()

'include'.visibleWhen((list) => {
  return list.situation()._doingDeliveryNotes
})

'Delivery Notes'.availableWhen((cast, list) => {
  return ! list.situation()._doingDeliveryNotes
})

'Delivery Notes'.act(async (list, cast) => {
  list.situation()._selectedAll = true
  let receipts = list.casts()
  for ( var i = 0; i < receipts.length; i++ ) {
    let receipt = receipts[i]
    receipt.include = 'Yes'
  }
  let mold = global.foreman.doNameToMold('POReceipt')
  mold.version++
  list.situation()._doingDeliveryNotes = true
})

'Back'.act(async (list, cast) => {
  if ( list.situation()._doingDeliveryNotes ) {
    list.situation()._doingDeliveryNotes = false
    return
  }
  list.back()
})

'Select All'.act(async (list, cast) => {
  list.situation()._selectedAll = true
  let receipts = list.casts()
  for ( var i = 0; i < receipts.length; i++ ) {
    let receipt = receipts[i]
    receipt.include = 'Yes'
  }
  let mold = global.foreman.doNameToMold('POReceipt')
  mold.version++
})

'Select All'.availableWhen((cast, list) => {
  return list.situation()._doingDeliveryNotes && (! list.situation()._selectedAll)
})

'Select None'.act(async (list, cast) => {
  list.situation()._selectedAll = false
  let receipts = list.casts()
  for ( var i = 0; i < receipts.length; i++ ) {
    let receipt = receipts[i]
    receipt.include = 'No'
  }
  let mold = global.foreman.doNameToMold('POReceipt')
  mold.version++
})

'Select None'.availableWhen((cast, list) => {
  return list.situation()._doingDeliveryNotes && list.situation()._selectedAll
})

'Download Delivery Notes PDF'.availableWhen((cast, list) => {
  return list.situation()._doingDeliveryNotes
})

'Download Delivery Notes PDF'.act(async list => {
  let receipts = await 'POReceipt'.bring({include: 'Yes'})
  if ( receipts.length === 0 ) {
    global.gApp.showMessage('Please select at least one receipt to include')
    return
  }
  let spec = "DeliveryNote.js"
  list.downloadPDF({spec: spec, docName: "Delivery Notes.PDF"})
  let mold = global.foreman.doNameToMold('POReceipt')
  mold.version++
})

'attachmentIcon'.calculate(async cast => {
  let attachment = await 'Attachment'.bringFirst({theParentId: cast.id})
  if ( attachment )
    return 'Paperclip'
})

'attachmentIcon'.destination(async cast => {
  return 'AttachmentsByParent.js'
})

'ViewPOReceipts'.dynamicTitle(function() {
  let po = this.callerCast({immediateOnly: true}); if ( ! po ) return
  if ( po.datatype() !== "PO" ) return 
  let res = "View Receipts for Purchase Order " + po.purchaseOrderNumber
  return res
})

'ViewPOReceipts'.criteria(async function () {
  let r = this.callerCast({immediateOnly: true}); if ( ! r ) return null
  if ( r.datatype() !== "PO" ) return null
  let res = {parentId: r.id}
  return res
})


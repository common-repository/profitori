'ReceivePurchases'.list({expose: true, icon: "Boxes"})
'Receive Purchases'.title()
'Back'.action({act: 'cancel'})
'Refresh'.action({act: "refresh"})
'View All Receipts'.action({spec: 'ViewPOReceipts.js'})
'PO'.datatype()
'purchaseOrderNumber'.field({key: true, showAsLink: true})
'expectedDeliveryDate'.field()
'supplier'.field({showAsLink: true})
'location'.field({showAsLink: true})
'status'.field()
'costExclTax'.field({caption: "Value (Excl Tax)", showTotal: true})
'costIncTax'.field({caption: "Value (Inc Tax)", showTotal: true})
'attachmentIcon'.field({icon: true, caption: ''})
'Enter Receipt'.action({place: 'row', act: 'add', autoChild: true, spec: 'POReceiptMaint.js'});
'View Receipts'.action({place: 'row', spec: 'ViewPOReceipts.js'});

'attachmentIcon'.calculate(async cast => {
  let attachment = await 'Attachment'.bringFirst({theParentId: cast.id})
  if ( attachment )
    return 'Paperclip'
})

'attachmentIcon'.destination(async cast => {
  return 'AttachmentsByParent.js'
})

/*
'ReceivePurchases'.criteria(async function() {
  return {status: {compare: "!=", value: "Received"}}
})
*/

'ReceivePurchases'.defaultSort({field: "expectedDeliveryDate"})

'View Receipts'.availableWhen(po => po.status !== "Awaiting Delivery")

'ReceivePurchases'.filter(async po => {
  let received = (po.status === 'Received')
  let draft = (po.stage === 'Draft')
  let res = (! received) && (! draft)
  return res
})

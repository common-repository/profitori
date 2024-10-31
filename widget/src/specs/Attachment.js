'Attachment'.datatype()
'datatype'.field({caption: 'Document Type'})
'theParentId'.field({numeric: true, indexed: true})
'parentReference'.field({caption: 'Reference'})
'attachmentType'.field({caption: 'Type'})
'description'.field()
'attachedDate'.field({date: true})
'contents'.field({caption: "Attachment File", file: true})
'fileName'.field()
'entityName'.field()
'documentType'.field()
'customerId'.field({numeric: true})

'Attachment'.method('refreshEntityName', async function() {
  let attachment = this
  let cast = await attachment.datatype.bringSingle({id: attachment.theParentId}); if ( ! cast ) return
  if ( cast.supplier ) {
    let supplier = await cast.referee('supplier')
    if ( supplier )
      attachment.entityName = supplier.name
  }
  let order
  if ( cast.datatype() === 'orders' )
    order = cast
  else {
    if ( cast.toOrder )
      order = await cast.toOrder()
    else if ( cast.order )
      order = await 'orders.RecentOrActive'.bringSingle({id: cast.order.id})
  }
  if ( order ) {
    let customer = await order.toCustomer()
    if ( customer ) {
      attachment.entityName = customer.display_name
      attachment.customerId = customer.id
    } else {
      attachment.entityName = order.billingName
    }
  }
})

'documentType'.calculate(async attachment => {
  let datatype = attachment.datatype; if ( ! datatype ) return ''
  let cast = await datatype.bringSingle({id: attachment.theParentId}); if ( ! cast ) return ''
  return cast.datatypeCaption()
})

'attachmentType'.options(['Proforma', 'Invoice', 'Customs', 'Bill', 'Transport', 'Serial Numbers', 'Image', 'Other'])

'attachmentType'.inception('Other')

'attachedDate'.inception(async attachment => {
  return global.todayYMD()
})

'parentReference'.calculate(async attachment => {
  let datatype = attachment.datatype; if ( ! datatype ) return ''
  let cast = await datatype.bringSingle({id: attachment.theParentId}); if ( ! cast ) return ''
  return cast.keyValue()
})

'Attachment'.method('toParent', async function() {
  let datatype = this.datatype; if ( ! datatype ) return
  let res = await datatype.bringFirst({id: this.theParentId})
  return res
})

'parentReference'.destination(async attachment => {
  return await attachment.toParent()
})

'Attachment'.beforeSaving(async function() {
  if ( ! this.contents )
    throw(new Error('Please choose a file to upload'))
})

'Attachment'.method('toAttachmentsSubfolderOnServer', function() {

  let sanitizeEntityName = name => {
    return name.replace(/[/\\?%*:|"<>]/g, '-');
  }

  let res = ''
  let entityName = this.entityName
  if ( entityName ) {
    entityName = sanitizeEntityName(entityName)
    res = entityName
  }
  if ( this.parentReference ) {
    if ( res )
      res += '/'
    res = res + this.parentReference
  }
  return res
})

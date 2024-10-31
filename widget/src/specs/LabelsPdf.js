'LabelsPdf'.output({type: 'labels'})
'LabelHolder'.datatype({transient: true})

'LabelsManifest'.manifest()
'Label'.datatype({transient: true})
'holder'.field({refersToParent: 'LabelHolder', hidden: true})

'LabelsPdf'.substituteCast(async (cast, output) => {

  let populateLabelInventoryField = async (label, field, cast) => {
    let inv
    if ( cast.datatype() === "Inventory" )
      inv = cast
    else if ( cast.toInventory )
      inv = await cast.toInventory({allowCreate: true})
    else
      return
    await inv.refreshCalculations({force: true, includeDefers: true})
    label[field.name] = inv[field.name]
  }

  let populateLabelPOReceiptLineField = async (label, field, cast) => {
    let line
    if ( cast.datatype() === "POReceiptLine" )
      line = cast
    else if ( cast.toPOReceiptLine )
      line = await cast.toPOReceiptLine()
    if ( ! line )
      return
    await line.refreshCalculations({force: true, includeDefers: true})
    label[field.name] = line[field.name]
  }

  let populateLabelProductField = async (label, field, cast) => {
    let product
    if ( cast.datatype() === 'products' ) 
      product = cast
    else {
      if ( ! cast.toProduct ) return
      product = await cast.toProduct()
    }
    await product.refreshCalculations({force: true, includeDefers: true})
    label[field.name] = product[field.name]
  }

  let populateLabelField = async (label, field, cast) => {
    if ( ! field.realm ) return
    if ( field.realm === "POReceiptLine" )
      await populateLabelPOReceiptLineField(label, field, cast)
    else if ( field.realm === "Inventory" )
      await populateLabelInventoryField(label, field, cast)
    else if ( field.realm.startsWith("WC Product") )
      await populateLabelProductField(label, field, cast)
    else if ( field.realm === "Caption Only" )
      label[field.name] = field.caption
  }

  let populateLabelFields = async (label, cast) => {
    let fields = output.getRowFields()
    for ( var i = 0; i < fields.length; i++ ) {
      let field = fields[i]
      await populateLabelField(label, field, cast)
    }
  }
  
  let createLabels = async () => {
    let dt = cast.datatype()
    if ( dt === "POReceipt" )
      return await createPOReceiptLabels()
    else if ( dt === "products" )
      return await createProductLabels()
    else if ( dt === "Inventory" )
      return await createInventoryLabels()
    else if ( dt === "BulkTransfer" )
      return await createMultiProductLabels({bulkTransfer: true})
    else if ( dt === "Labels" )
      return await createMultiProductLabels()
  }

  let createInventoryLabels = async () => {
    let inv = cast
    await 'LabelHolder'.clear()
    await 'Label'.clear()
    let holder = await 'LabelHolder'.create()
    await inv.refreshCalculations({force: true, includeDefers: true})
    let label = await 'Label'.create({parentCast: holder})
    label._labelCount = inv.quantityOnHand ? inv.quantityOnHand : 1
    await populateLabelFields(label, inv)
    return holder
  }

  let getSelectedProducts = async (opt) => {
    let products
    if ( opt && opt.bulkTransfer )
      products = await 'products'.bring({bulkTransfer: "Yes"})
    else
      products = await 'products'.bring({include: "Yes"})
    return products
  }

  let createMultiProductLabels = async (opt) => {
    let products = await getSelectedProducts(opt)
    if ( products.length === 0 ) {
      global.gApp.showMessage("Please select one or more products")
      return
    }
    await 'LabelHolder'.clear()
    await 'Label'.clear()
    let holder = await 'LabelHolder'.create()
    for ( var i = 0; i < products.length; i++ ) {
      let product = products[i]
      await product.refreshCalculations({force: true, includeDefers: true})
      let label = await 'Label'.create({parentCast: holder})
      let inv = await product.toInventory()
      let qoh = inv ? inv.quantityOnHand : 0
      label._labelCount = qoh ? qoh : 1
      await populateLabelFields(label, product)
    }
    return holder
  }

  let createProductLabels = async () => {
    let product = cast
    await 'LabelHolder'.clear()
    await 'Label'.clear()
    let holder = await 'LabelHolder'.create()
    await product.refreshCalculations({force: true, includeDefers: true})
    let label = await 'Label'.create({parentCast: holder})
    let inv = await product.toInventory()
    let qoh = inv ? inv.quantityOnHand : 0
    label._labelCount = qoh ? qoh : 1
    await populateLabelFields(label, product)
    return holder
  }

  let createPOReceiptLabels = async () => {

    let sortBySku = lines => {
      lines.sort(
        (line1, line2) => {
          if ( line1.sku > line2.sku ) return 1
          return -1
        }
      )
    }

    let poReceipt = cast
    await 'LabelHolder'.clear()
    await 'Label'.clear()
    let holder = await 'LabelHolder'.create()
    let lines = await 'POReceiptLine'.bringChildrenOf(poReceipt)
    sortBySku(lines)
    for ( var i = 0; i < lines.length; i++ ) {
      let line = lines[i]
      await line.refreshCalculations({force: true, includeDefers: true})
      let label = await 'Label'.create({parentCast: holder})
      label._labelCount = line.receivedQuantity
      await populateLabelFields(label, line)
    }
    return holder
  }
  
  let holder = await createLabels()
  return holder
})

'LabelsPdf'.labelCount(async label => {
  return label._labelCount
})

'LabelsPdf'.modifyRowFields(async (writer, fields, template) => {

  let captionCount = 0

  let facetToField = async (facet) => {
    let source = await facet.referee('source'); if ( ! source ) return null
    let parts = source.description.split(".")
    let realm = parts[0]
    let name = parts[1]
    if ( realm === "Caption Only" ) {
      name = "caption"
      captionCount++
      if ( captionCount > 1 )
        name += captionCount
    }
    let res
    res = fields.filterSingle(f => f.name === name)
    if ( res ) 
      return res
    let disposition = await facet.referee('disposition')
    let numeric = (disposition && (disposition.description === "Number"))
    let date = (disposition && (disposition.description === "Date"))
    let barcode = (disposition && (disposition.description === "Barcode"))
    let qrcode = (disposition && (disposition.description === "QR Code"))
    let f = writer.createField({name: name})
    f.datatype = 'Label'
    f.englishCaption = facet.englishCaption ? facet.englishCaption : facet.caption
    f.caption = facet.caption
    f.realm = realm
    f.numeric = numeric
    f.minDecimals = facet.minimumDecimals
    f.maxDecimals = facet.maximumDecimals
    f.left = facet.left
    f.top = facet.top
    f.width = facet.width
    f.bold = facet.bold
    f.fontSize = facet.fontSize
    f.height = facet.height
    f.barcode = barcode
    f.barcodeFormat = facet.barcodeFormat
    f.qrcode = qrcode
    f.date = date
    return f
  }

  let newFields = []
  if ( ! template )
    template = await 'Template'.bringOrCreate({specification: "LabelsPdf.js", purpose: ''})
  let facets = await 'Facet'.bring({parentId: template.id})
  facets.sort((f1, f2) => f1.sequence > f2.sequence ? 1 : -1)
  await facets.forAllAsync(async facet => {
    let f = await facetToField(facet); if ( ! f ) return "continue"
    newFields.push(f)
  })
  fields.appendArray(newFields)

})

'LabelsPdf'.modifyRowMoldFields(async (mold) => {

  let template = await 'Template'.bringOrCreate({specification: "LabelsPdf.js"});
  let facets = await 'Facet'.bring({parentId: template.id})
  let fieldsAdded = false
  let captionCount = 0
  await facets.forAllAsync(async (facet) => {
    let source = await facet.referee('source'); if ( ! source ) return "continue"
    let parts = source.description.split(".")
    let realm = parts[0]
    let name = parts[1]
    if ( realm === "Caption Only" ) {
      name = "caption"
      captionCount++
      if ( captionCount > 1 )
        name += captionCount
    }
    let disposition = await facet.referee('disposition')
    let numeric = (disposition && (disposition.description === "Number"))
    let date = (disposition && (disposition.description === "Date"))
    let barcode = (disposition && (disposition.description === "Barcode"))
    let qrcode = (disposition && (disposition.description === "QR Code"))
    let f = mold.fields.filterSingle(f => f.name === name)
    if ( ! f ) {
      f = mold.createField(name)
      fieldsAdded = true
    }
    f.englishCaption = facet.englishCaption ? facet.englishCaption : facet.caption
    f.caption = facet.caption
    f.realm = realm
    f.numeric = numeric
    f.minDecimals = facet.minimumDecimals
    f.maxDecimals = facet.maximumDecimals
    f.left = facet.left
    f.top = facet.top
    f.width = facet.width
    f.bold = facet.bold
    f.fontSize = facet.fontSize
    f.height = facet.height
    f.barcode = barcode
    f.barcodeFormat = facet.barcodeFormat
    f.qrcode = qrcode
    f.date = date
  })
  return fieldsAdded

})



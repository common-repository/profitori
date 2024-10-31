'FacetMaint'.maint()
'Add Inventory Levels Field'.title({when: "adding"})
'Edit Inventory Levels Field'.title({when: "editing"})
'Back'.action({act: 'cancel'})
'OK'.action({act: 'ok'})
'Save'.action({act: 'save'})
'Add another'.action({act: 'add'})
'Facet'.datatype()
'template'.field({refersToParent: 'Template', hidden: true})
'specification'.field({hidden: true})
'source'.field({refersTo: "Source", caption: "Get Value From", allowEmpty: false})
'caption'.field({key: true, caption: "Caption"})
'sequence'.field({numeric: true})
'allowEditing'.field({yesOrNo: true})
'inputWidthPx'.field({numeric: true, decimals: 0, caption: 'Input Width (px)'})
'disposition'.field()
'barcodeFormat'.field()
'minimumDecimals'.field()
'maximumDecimals'.field()
'showTotal'.field()
'left'.field({numeric: true, caption: "Distance from Left of Label (mm)"})
'leftInches'.field({numeric: true, caption: "Distance from Left of Label (in)"})
'top'.field({numeric: true, caption: "Distance from Top of Label (mm)"})
'topInches'.field({numeric: true, caption: "Distance from Top of Label (in)"})
'width'.field({numeric: true, caption: "Maximum Width (mm)"})
'widthInches'.field({numeric: true, caption: "Maximum Width (in)"})
'height'.field({numeric: true, caption: "Height (mm)"})
'heightInches'.field({numeric: true, caption: "Height (in)"})
'fontSize'.field({numeric: true})
'bold'.field()
'sourceIsReadOnly'.field({hidden: true})

'left'.visibleWhen((maint, facet) => {
  return facet.specification === "LabelsPdf.js"
})

'top'.visibleWhen((maint, facet) => {
  return facet.specification === "LabelsPdf.js"
})

'height'.visibleWhen((maint, facet) => {
  let res = facet.disposition && ((facet.disposition.keyval === "Barcode") || (facet.disposition.keyval === "QR Code"))
  return res
})

'width'.visibleWhen((maint, facet) => {
  if ( facet.disposition && (facet.disposition.keyval === "QR Code") )
    return false
  return facet.specification === "LabelsPdf.js"
})

'left'.labelMmUnit({inchField: 'leftInches'})

'top'.labelMmUnit({inchField: 'topInches'})

'height'.labelMmUnit({inchField: 'heightInches'})

'width'.labelMmUnit({inchField: 'widthInches'})

'inputWidthPx'.visibleWhen((maint, facet) => {
  return facet.allowEditing === 'Yes'
})

'inputWidthPx'.modifyInputRenderValue((renderValue, facet) => {
  if ( renderValue !== '0' ) return renderValue
  return ''
})

'minimumDecimals'.afterUserChange(async (oldInputValue, newInputValue, facet) => {
  facet.decimalsChanged = true
})

'maximumDecimals'.afterUserChange(async (oldInputValue, newInputValue, facet) => {
  facet.decimalsChanged = true
})

'source'.afterUserChange(async (oldInputValue, newInputValue, facet) => {
  let source = await facet.referee('source'); if ( ! source ) return
  let parts = source.description.split('.'); if ( parts.length < 2 ) return
  let m = global.foreman.doNameToMold(parts[0]); if ( ! m ) return
  let f = m.nameToField(parts[1]); if ( ! f ) return
  let dispDesc = 'Text'
  if ( f.numeric )
    dispDesc = 'Number'
  else if ( f.date )
    dispDesc = 'Date'
  if ( ! dispDesc )
    return
  let di = await 'Disposition'.bringFirst({description: dispDesc}); if ( ! di ) return
  facet.disposition = di.reference()
})

'sourceIsReadOnly'.calculate(async facet => {
  let source = await facet.referee('source'); if ( ! source ) return 'No'
  return source.readOnly
})

'allowEditing'.inception('No')

'allowEditing'.visibleWhen((maint, facet) => {
  if ( maint.callerSpecname() !== "Customize.js" ) 
    return false
  let res = facet.sourceIsReadOnly === 'No'
  return res
})

'minimumDecimals'.inception(2)

'maximumDecimals'.inception(2)

'FacetMaint'.dynamicTitle(function() {
  if ( this.callerSpecname() === "Customize.js" ) {
    if ( this.isAdding() )
      return 'Add Inventory Levels Field'
    return 'Edit Inventory Levels Field'
  }
  if ( this.isAdding() )
    return 'Add Label Field'
  return 'Edit Label Field'
})

'disposition'.excludeChoiceWhen(async (maint, disposition, facet, template) => {
  if ( maint.callerSpecname() === "Customize.js" ) {
    return (disposition.description === 'Barcode') || (disposition.description === 'QR Code')
  }
  return false
})

'source'.excludeChoiceWhen(async (maint, source, facet, template) => {
  let res
  if ( source.applicableSpecnames.indexOf(template.specification) < 0 )
    return true
  res = source.description === "WC Product._sku"
  return res
})

'showTotal'.visibleWhen((maint, facet) => {
  if ( maint.callerSpecname() !== "Customize.js" ) 
    return false
  let res = facet.disposition && facet.disposition.keyval === "Number"
  return res
})

'barcodeFormat'.visibleWhen((maint, facet) => {
  let res = facet.disposition && facet.disposition.keyval === "Barcode"
  return res
})

'minimumDecimals'.visibleWhen((maint, facet) => {
  let res = facet.disposition && facet.disposition.keyval === "Number"
  return res
})

'maximumDecimals'.visibleWhen((maint, facet) => {
  return facet.disposition && facet.disposition.keyval === "Number"
})

'fontSize'.visibleWhen((maint, facet) => {
  let barcode = facet.disposition && facet.disposition.keyval === "Barcode"
  let qrcode = facet.disposition && facet.disposition.keyval === "QR Code"
  return facet.specification === "LabelsPdf.js" && (! barcode) && (! qrcode)
})

'bold'.visibleWhen((maint, facet) => {
  let barcode = facet.disposition && facet.disposition.keyval === "Barcode"
  let qrcode = facet.disposition && facet.disposition.keyval === "QR Code"
  return facet.specification === "LabelsPdf.js" && (! barcode) && (! qrcode)
})


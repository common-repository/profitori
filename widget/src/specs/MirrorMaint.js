'MirrorMaint'.maint({panelStyle: 'titled'})
'Mirror Stock Settings'.title()
'Back'.action({act: 'cancel'})
'OK'.action({act: 'ok'})
'Save'.action({act: 'save'})
'Load from URL now'.action()
'Mirror'.datatype()

'Settings'.panel()
'supplier'.field({readOnly: false})
'stockIsMirrored'.field()
'url'.field()
'username'.field()
'password'.field()
'format'.field({readOnly: true})
'delimiter'.field()
'mappingType'.field()
'supplierSkuColumnNumber'.field()
'skuColumnNumber'.field()
'externalPriceColumnNumber'.field()
'externalPriceFXColumnNumber'.field()
'externalQuantityOnHandColumnNumber'.field()
'supplierSkuColumnHeading'.field()
'skuColumnHeading'.field()
'externalPriceColumnHeading'.field()
'externalPriceFXColumnHeading'.field()
'externalQuantityOnHandColumnHeading'.field()

'Status'.panel()
'lastLoadAttemptDate'.field({readOnly: true})
'lastLoadAttemptTime'.field({readOnly: true, caption: 'Time'})
'lastLoadResult'.field({readOnly: true, caption: 'Result', multiLine: true})

'username'.visibleWhen((maint, mirror) => {
  return mirror.stockIsMirrored === 'Yes'
})

'password'.visibleWhen((maint, mirror) => {
  return mirror.stockIsMirrored === 'Yes'
})

'delimiter'.visibleWhen((maint, mirror) => {
  return mirror.stockIsMirrored === 'Yes'
})

'delimiter'.inception(',')

'Status'.visibleWhen((maint, mirror) => {
  return mirror.stockIsMirrored === 'Yes'
})

'Load from URL now'.act(async (maint, mirror) => {
  await mirror.load()
})

'Load from URL now'.availableWhen((mirror, maint) => {
  return mirror && ((mirror.stockIsMirrored === 'Yes') && mirror.url)
})

'skuColumnNumber'.modifyInputRenderValue((renderValue, mirror) => {
  if ( renderValue !== '0' ) return renderValue
  return ''
})

'url'.visibleWhen((maint, mirror) => {
  return mirror.stockIsMirrored === 'Yes'
})

'format'.visibleWhen((maint, mirror) => {
  return mirror.stockIsMirrored === 'Yes'
})

'mappingType'.visibleWhen((maint, mirror) => {
  return mirror.stockIsMirrored === 'Yes'
})

'supplierSkuColumnNumber'.visibleWhen((maint, mirror) => {
  return (mirror.stockIsMirrored === 'Yes') && (mirror.mappingType === 'Column Numbers')
})

'skuColumnNumber'.visibleWhen((maint, mirror) => {
  return (mirror.stockIsMirrored === 'Yes') && (mirror.mappingType === 'Column Numbers')
})

'externalPriceColumnNumber'.visibleWhen((maint, mirror) => {
  return (mirror.stockIsMirrored === 'Yes') && (mirror.mappingType === 'Column Numbers')
})

'externalPriceFXColumnNumber'.visibleWhen((maint, mirror) => {
  return (mirror.stockIsMirrored === 'Yes') && (mirror.mappingType === 'Column Numbers')
})

'externalQuantityOnHandColumnNumber'.visibleWhen((maint, mirror) => {
  return (mirror.stockIsMirrored === 'Yes') && (mirror.mappingType === 'Column Numbers')
})

'supplierSkuColumnHeading'.visibleWhen((maint, mirror) => {
  return (mirror.stockIsMirrored === 'Yes') && (mirror.mappingType === 'Column Headings')
})

'skuColumnHeading'.visibleWhen((maint, mirror) => {
  return (mirror.stockIsMirrored === 'Yes') && (mirror.mappingType === 'Column Headings')
})

'externalPriceColumnHeading'.visibleWhen((maint, mirror) => {
  return (mirror.stockIsMirrored === 'Yes') && (mirror.mappingType === 'Column Headings')
})

'externalPriceFXColumnHeading'.visibleWhen((maint, mirror) => {
  return (mirror.stockIsMirrored === 'Yes') && (mirror.mappingType === 'Column Headings')
})

'externalQuantityOnHandColumnHeading'.visibleWhen((maint, mirror) => {
  return (mirror.stockIsMirrored === 'Yes') && (mirror.mappingType === 'Column Headings')
})

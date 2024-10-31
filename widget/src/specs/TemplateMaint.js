'TemplateMaint'.maint({panelStyle: "titled"})
'Labels Layout'.title()
'Back'.action({act: 'cancel'})
'OK'.action({act: 'ok'})
'Save'.action({act: 'save'})
'Template'.datatype()

'Layout'.panel()
'purposeDisplay'.field({readOnly: true, caption: 'Label Purpose'})

''.panel()

'Page Dimensions'.panel()
'specification'.field({hidden: true, key: true})
'pageWidthMm'.field()
'pageWidthInches'.field()
'pageHeightMm'.field()
'pageHeightInches'.field()
'pageLeftMarginMm'.field({numeric: true, caption: 'Page Left Margin (mm)'})
'pageLeftMarginInches'.field({numeric: true, caption: 'Page Left Margin (in)'})
'pageTopMarginMm'.field({numeric: true, caption: 'Page Top Margin (mm)'})
'pageTopMarginInches'.field({numeric: true, caption: 'Page Top Margin (in)'})
'columnCount'.field({numeric: true, decimals: 0, caption: 'Number of Labels Across Page'})
'rowsPerPage'.field({numeric: true, decimals: 0, caption: 'Number of Labels Down Page'})

'Label Dimensions'.panel()
'labelWidthMm'.field({numeric: true, caption: 'Label Width (mm)'})
'labelWidthInches'.field({numeric: true, caption: 'Label Width (in)'})
'labelHeightMm'.field({numeric: true, caption: 'Label Height (mm)'})
'labelHeightInches'.field({numeric: true, caption: 'Label Height (in)'})
'labelHGapMm'.field({numeric: true, caption: 'Horizontal Gap Between Labels (mm)'})
'labelHGapInches'.field({numeric: true, caption: 'Horizontal Gap Between Labels (in)'})
'labelVGapMm'.field({numeric: true, caption: 'Vertical Gap Between Labels (mm)'})
'labelVGapInches'.field({numeric: true, caption: 'Vertical Gap Between Labels (in)'})

'Fields'.manifest()
'Add Field'.action({act: 'add'})
'Facet'.datatype()
'template'.field({refersToParent: 'Template', hidden: true})
'source'.field({caption: "Get Value From"})
'caption'.field()
'left'.field()
'leftInches'.field({caption: 'Left (in)'})
'top'.field()
'topInches'.field({caption: 'Top (in)'})
'Edit'.action({place: 'row', act: 'edit'})
'Trash'.action({place: 'row', act: 'trash'})
'FacetMaint.js'.maintSpecname()

'Fields'.defaultSort({field: "sequence"})

'TemplateMaint'.substituteCast(async (template, maint) => {
  if ( template ) 
    return template
  let specname = 'LabelsPdf.js'
  let res = await 'Template'.bringOrCreate({specification: specname})
  return res
})

'left'.labelMmUnit({inchField: 'leftInches'})

'top'.labelMmUnit({inchField: 'topInches'})

'pageWidthMm'.labelMmUnit({inchField: 'pageWidthInches'})

'pageHeightMm'.labelMmUnit({inchField: 'pageHeightInches'})

'pageLeftMarginMm'.labelMmUnit({inchField: 'pageLeftMarginInches'})

'pageTopMarginMm'.labelMmUnit({inchField: 'pageTopMarginInches'})

'labelWidthMm'.labelMmUnit({inchField: 'labelWidthInches'})

'labelHeightMm'.labelMmUnit({inchField: 'labelHeightInches'})

'labelHGapMm'.labelMmUnit({inchField: 'labelHGapInches'})

'labelVGapMm'.labelMmUnit({inchField: 'labelVGapInches'})


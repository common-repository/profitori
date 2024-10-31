'UOM'.datatype({plex: true})
'uomName'.field({caption: 'Unit of Measure Name', key: true})
'description'.field()

'UOM'.allowTrash(async function() {
  let c = await 'Configuration'.bringFirst({defaultStockingUOM: this.reference()})
  if ( c ) return "Unit of Measure is the default stocking unit ".translate() + " and so cannot be trashed".translate()
  let inv = await 'Inventory'.bringFirst({purchasingUOM: this.reference()})
  if ( inv ) return "Unit of Measure has been referenced on Product ".translate() + inv.productName + " and so cannot be trashed".translate()
  let poLine = await 'POLine'.bringFirst({uom: this.reference()})
  if ( poLine ) return "Unit of Measure has been referenced on Purchase Orders".translate() + " and so cannot be trashed".translate()
  return null
})

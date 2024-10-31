'Facet'.datatype({plex: true})
'template'.field({refersToParent: 'Template', hidden: true})
'caption'.field({key: true, nonUnique: true})
'englishCaption'.field()
'source'.field({refersTo: "Source", caption: "Get Value From"})
'sequence'.field({numeric: true})
'disposition'.field({refersTo: "Disposition", caption: "Display As"})
'minimumDecimals'.field({numeric: true, decimals: 0})
'maximumDecimals'.field({numeric: true, decimals: 0})
'specification'.field()
'left'.field({numeric: true})
'top'.field({numeric: true})
'width'.field({numeric: true})
'fontSize'.field({numeric: true})
'bold'.field({yesOrNo: true})
'showTotal'.field({yesOrNo: true})
'height'.field({numeric: true, decimals: 0, caption: "Height (mm)"})
'barcodeFormat'.field()

'Facet'.cruxFields(['template', 'sequence'])

'barcodeFormat'.options([
  'CODE128',
  'CODE128A',
  'CODE128B',
  'CODE128C',
  'EAN13',
  'UPC',
  'EAN8',
  'CODE39',
  'ITF14',
  'MSI',
  'MSI10',
  'MSI11',
  'MSI1010',
  'MSI1110',
  'pharmacode',
  'codabar'
])

'barcodeFormat'.inception('CODE128')

'height'.inception(10)

'specification'.calculate(async facet => {
  let template = await facet.referee('template')
  return template.specification
})

'fontSize'.inception(10)

'width'.inception(50)

'Facet'.afterCreating(async function() {

  let defaultSequence = async () => {
    let facets = await 'Facet'.bringChildrenOf(this.template)
    facets.sort((f1, f2) => (f1.sequence > f2.sequence ? 1 : -1))
    let lastFacet = facets.last()
    if ( ! lastFacet ) {
      this.sequence = 10
      return
    }
    let roundedSeq = lastFacet.sequence
    if ( (roundedSeq % 10) !== 0 )
      roundedSeq += 10 - (roundedSeq % 10)
    this.sequence = roundedSeq + 10
  }

  let defaultDisposition = async () => {
    let d = await 'Disposition'.bringSingle({description: 'Text'})
    this.disposition = d.reference()
  }

  await defaultSequence()
  await defaultDisposition()

})

'Facet'.beforeSaving(async function() {
  
/*
  let throwIfSourceDuplicated = async () => {
    if ( ! facet.source ) return
    if ( facet.source.keyval === "Caption Only" ) return
    let oldSource = facet.getOld() ? facet.getOld().source : null
    let oldSourceKeyval = oldSource ? oldSource.keyval : null
    if ( facet.source.keyval === oldSourceKeyval ) return
    let template = await facet.referee('template'); if ( ! template ) return
    let allFacets  = await 'Facet'.bringChildrenOf(template)
    let dup = allFacets.filter(f => (f !== facet) && (f.source.keyval === facet.source.keyval))
    if ( dup.length !== 0 )
      throw(new Error(facet.source.keyval + " " + "is already included".translate()))
  }
*/

  //let facet = this
  //await throwIfSourceDuplicated()
  global.stLastFacetChangeTime = global.nowMs()
})

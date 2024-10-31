
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import QRCode from 'qrcode'
var JsBarcode = require('jsbarcode')
require('./Globals.js')

export default class Writer {

  async getDataAsArray(aParms) {
    this.lastError = null
    this.attributes = aParms.attributes
    this.options = aParms.options
    this.data = []
    await this.prepareRowFields()
    this.cast = aParms.cast
    let gcf = this.a().getCastsFunction
    if ( gcf ) {
      gcf = gcf.bind(this)
      this.casts = await gcf(this)
    } else 
      this.casts = aParms.options && aParms.options.casts
    if ( ! this.casts )
      this.casts = [this.cast]
    for ( var i = 0; i < this.casts.length; i++ ) {
      this.cast = this.casts[i]
      let scf = this.a().substituteCastFunction
      if ( scf ) {
        scf = scf.bind(this)
        this.cast = await scf(this.cast, this)
      }
      await this.cast.refreshCalculations({force: true, includeDefers: true})
      await this.addHeaderToData()
      await this.addRowsToData()
    }
    return this.data
  }

  async addHeaderToData() {
    let row = {'$RowType': 'Header'}
    let headerFields = this.getHeaderFields()
    await headerFields.forAllAsync(async field => {
      if ( field.hidden ) return 'continue'
      let val = this.fieldToDisplayValue(field, this.cast)
      row[field.name] = val
    })
    this.data.push(row)
  }

  getHeaderFields() {
    let section = this.attributes.sections[0]
    return section.attributes.fields
  }

  async addRowsToData() {
    let m = this.getRowsMold(); if ( ! m ) return
    this.rowCasts = await m.retrieve({parentId: this.cast.id})
    await this.filterRowCasts()
    await m.refreshCalculations({force: true, includeDefers: true, casts: this.rowCasts})
    let idx = 0
    await this.rowCasts.forAllAsync(async cast => {
      await this.addRowToData(cast, idx)
    })
  }

  async addRowToData(aCast) {
    let row = {'$RowType': 'LineItem'}
    let headerFields = this.getHeaderFields()
    await headerFields.forAllAsync(async field => {
      if ( field.hidden ) return 'continue'
      let val = this.fieldToDisplayValue(field, this.cast)
      if ( global.isNumeric(val) ) return 'continue'
      row[field.name] = val
    })
    let fields = this.getRowFields()
    await fields.forAllAsync(async field => {
      if ( field.hidden ) return 'continue'
      let val = this.fieldToDisplayValue(field, aCast)
      row[field.name] = val
    })
    this.data.push(row)
  }

  async generatePDF(aParms) {
    this.lastError = null
    this.language = global.getLanguage()
    this.attributes = aParms.attributes
    let a = this.attributes
    this.options = aParms.options
    let type = this.attributes.type
    let pageHeightMm = 297
    let pageWidthMm = 210
    if ( type === "labels" ) {
      this.template = await 'Template'.bringOrCreate({specification: 'LabelsPdf.js', purpose: this.options.purpose})
      pageWidthMm = this.template.pageWidthMm
      pageHeightMm = this.template.pageHeightMm
    }
    let ptPerMm = 72 / 25.4000508
    let pageWidthPt = pageWidthMm * ptPerMm
    let pageHeightPt = pageHeightMm * ptPerMm
    let portraitOrLandscape = (pageHeightMm >= pageWidthMm) ? 'p' : 'l'
    this.pdf = new jsPDF(portraitOrLandscape, 'mm', [pageHeightPt, pageWidthPt])
    this.pageWidthMm = pageWidthMm
    this.pageHeightMm = pageHeightMm
    this.defaultFontSize = a.fontSize || 10
    this.rowFontSize = a.fontSize || 8
    this.repeat = a.repeat || 1
    this.setFontSize(this.defaultFontSize)
    this.setFontStyle('normal')
    this.pdf.setFillColor(255, 255, 255);
    await this.prepareRowFields()
    this.cast = aParms.cast
    let gcf = this.a().getCastsFunction
    if ( gcf ) {
      gcf = gcf.bind(this)
      this.casts = await gcf(this)
    } else {
      this.casts = aParms.options && aParms.options.casts
    }
    if ( ! this.casts )
      this.casts = [this.cast]
    for ( var i = 0; i < this.casts.length; i++ ) {
      if ( i > 0 )
        this.pdf.addPage()
      this.repeatTop = 0
      for ( var j = 0; j < this.repeat; j++ ) {
        this.cast = this.casts[i]
        let scf = this.a().substituteCastFunction
        if ( scf ) {
          scf = scf.bind(this)
          this.cast = await scf(this.cast, this)
        }
        if ( type === "labels" ) {
          await this.generateLabelsPDF(aParms)
          return this.pdf
        }
        await this.cast.refreshCalculations({force: true, includeDefers: true})
        this.width = 228
        this.leftMargin = this.a().leftMargin || 17
        this.rightMargin = this.a().rightMargin || 17
        await this.writeRows()
        await this.writeOutputFooter()
        await this.writePageFooter()
        if ( (this.repeat === 2) && (j === 0) ) {
          this.y = this.pageHeightMm / 2
          this.repeatTop = this.y
        }
      }
    }
    return this.pdf
  }

  a() {
    return this.attributes
  }

  async prepareRowFields() {
    this._rowFields = []
    let m = this.attributes.manifests[0]; if ( ! m ) return
    this.manifest = m
    //this._rowFields.appendArray(m.attributes.fields)
    let rawFields = m.attributes.fields
    for ( var i = 0; i < rawFields.length; i++ ) {
      let rawField = rawFields[i]
      let vfn = rawField.columnVisibleWhen
      let vis = true
      if ( vfn )
        vis = vfn(this, this.cast)
      if ( vis )
        this._rowFields.push(rawField)
    }

    let fn = this.attributes.modifyRowFields;
    if ( ! fn ) return
    await fn(this, this._rowFields, this.template)
  }

  async modifyRowMoldFields() {
    let fn = this.attributes.modifyRowMoldFields; if ( ! fn ) return
    let m = this.getRowsMold(); if ( ! m ) return
    let fieldsAdded = await fn(m)
    if ( fieldsAdded && (! m.transient) )
      m.initCasts()
  }

  createField(aParms) {
    let f = global.gApp.newField(aParms.name)
    f.datatype = aParms.datatype
    if ( aParms.caption )
      f.caption = aParms.caption
    f.realm = aParms.realm
    f.numeric = aParms.numeric
    f.decimals = aParms.decimals
    f.minDecimals = aParms.minDecimals
    f.maxDecimals = aParms.maxDecimals
    return f
  }

  async generateLabelsPDF(aParms) {

    let done = 0
    let knt = 0

    let writeCastLabels = async (cast, labelCount) => {
      let t = this.template
      let labelsPerRow = t.columnCount
      let rowsPerPage = t.rowsPerPage
      for ( var i = 0; i < labelCount; i++ ) {
        await this.writeCastLabel(cast)
        this.labelCol++
        if ( this.labelCol >= labelsPerRow ) {
          this.labelCol = 0
          this.labelRow++
          if ( this.labelRow >= rowsPerPage ) {
            this.labelRow = 0
            if ( done < (knt - 1) ) {
              this.pdf.addPage()
            }
          }
        }
        done++
        await global.updateProgress(done / knt)
      }
    }

    let getLabelCount = async (cast) => {
      let labelCountFn = this.attributes.labelCount; if ( ! labelCountFn ) throw(new Error("labelCount method not defined"))
      let res = await labelCountFn(cast)
      let numberOfLabels = this.options && this.options.numberOfLabels
      if ( numberOfLabels && (numberOfLabels !== -1) )
        res = numberOfLabels
      return res
    }

    await this.modifyRowMoldFields()
    let m = this.getRowsMold()
    let dt = m.datatype()
    let casts = await dt.bringChildrenOf(this.cast)
    await m.refreshCalculations({force: true, includeDefers: true, casts: casts})
    this.labelRow = 0
    this.labelCol = 0
    for ( let i = 0; i < casts.length; i++ ) {
      let cast = casts[i]
      let labelCount = await getLabelCount(cast)
      knt += labelCount
    }
    for ( let i = 0; i < casts.length; i++ ) {
      let cast = casts[i]
      let labelCount = await getLabelCount(cast)
      await writeCastLabels(cast, labelCount)
    }
  }

  async writeCastLabel(cast) {
    let fields = this.getRowFields()
    for ( var i = 0; i < fields.length; i++ ) {
      let field = fields[i]
      await this.writeCastLabelField(field, cast)
    }
  }

  getLabelLeft() {
    let t = this.template
    let pageLeftMargin = t.pageLeftMarginMm
    let labelWidth = t.labelWidthMm
    let labelHGap = t.labelHGapMm
    return pageLeftMargin + (this.labelCol * (labelWidth + labelHGap))
  }

  getLabelTop() {
    let t = this.template
    let jsPdfBugFix = 3
    let pageTopMargin = t.pageTopMarginMm + jsPdfBugFix
    let labelHeight = t.labelHeightMm
    let labelVGap = t.labelVGapMm
    return pageTopMargin + (this.labelRow * (labelHeight + labelVGap))
  }

  async writeCastLabelField(field, cast) {
    if ( field.hidden ) return
    let val = this.fieldToDisplayValue(field, cast)
    let options = this.fieldToTextOptions(field)
    if ( (! field.left) && (field.left !== 0) ) throw(new Error("left property must be set for label field " + field.name))
    if ( (! field.top) && (field.top !== 0) ) throw(new Error("left property must be set for label field " + field.name))
    let x = this.getLabelLeft() + field.left
    let y = this.getLabelTop() + field.top
    let w = this.fieldToWidth(field)
    if ( options.align === "right" )
      x = x + w
    let origFontStyle = this.fontStyle
    let origFontSize = this.fontSize
    if ( field.bold === "Yes")
      this.setFontStyle('bold')
    let fontSize = field.fontSize || field.defaultFontSize
    this.setFontSize(fontSize)
    if ( field.barcode ) {
      await this.barcode(val, x, y, field.height, field.barcodeFormat, options)
    }
    else if ( field.qrcode ) {
      await this.qrcode(val, x, y, field.height, options)
    }
    else
      await this.text(val, x, y, options)
    this.setFontSize(origFontSize)
    this.setFontStyle(origFontStyle)
  }

  setFontSize(aFontSize) {
    this.pdf.setFontSize(aFontSize)
    this.fontSize = aFontSize
  }

  setFontStyle(aFontStyle) {
    this.pdf.setFontStyle(aFontStyle)
    this.fontStyle = aFontStyle
  }

  async filterRowCasts() {
    let m = this.attributes.manifests[0]; if ( ! m ) return
    let a = m.attributes; if ( ! a ) return
    let f = a.filter
    if ( ! f ) return
    let filteredCasts = []
    let len = this.rowCasts.length
    for ( var i = 0; i < len; i++ ) {
      let cast = this.rowCasts[i]
      let ok = await f(cast, this)
      if ( ! ok ) continue
      filteredCasts.push(cast)
    }
    this.rowCasts = filteredCasts
  }

  async sortRowCasts() {
    let m = this.attributes.manifests[0]; if ( ! m ) return
    let a = m.attributes; if ( ! a ) return
    let sortObj = a.defaultSort
    if ( global.isFunction(sortObj) ) {
      sortObj = await sortObj(this.cast)
    }
    if ( ! sortObj ) return
    let asc = sortObj.descending ? false : true
    let prop = sortObj.field
    this.doSort(prop, asc)
  }

  doSort(aProp, aAsc) {
    let isRef
    let gt = 1
    let lt = -1
    if ( ! aAsc ) {
      gt = -1
      lt = 1
    }
    let isId = (aProp === "id")
    let unknown = global.unknownNumber()
    this.rowCasts.sort(
      (aCastA, aCastB) => {
        let kv
        let a = aCastA[aProp]; if ( isId && (a < 0) ) a = (-a) + 100000000
        if ( isRef && (typeof a === 'object') ) {
          if ( a ) {
            kv = a.keyval
            if ( kv )
              a = kv
            else
              a = a.id
          }
        }
        if ( ! a )
          a = ''
        let b = aCastB[aProp]; if ( isId && (b < 0) ) b = (-b) + 100000000
        if ( isRef && (typeof b === 'object') ) {
          if ( b ) {
            kv = b.keyval
            if ( kv )
              b = kv
            else
              b = b.id
          }
        }
        if ( ! b )
          b = ''
        if ( a === unknown ) a = 0.000001
        if ( b === unknown ) b = 0.000001
        if ( (a === b) && aCastA.id && aCastB.id )
          return aCastA.id > aCastB.id ? gt : lt
        if ( a > b ) return gt
        if ( a < b ) return lt
        return 0
      }
    )
  }

  async writeRows() {
    let m = this.getRowsMold();
    if ( ! m ) {
      await this.writePageHeading()
      return
    }
    this.rowCasts = await m.retrieve({parentId: this.cast.id})
    await this.filterRowCasts()
    await this.sortRowCasts()
    await m.refreshCalculations({force: true, includeDefers: true, casts: this.rowCasts})
    let rowsWrittenOnPage = 0
    let rowsPerPage = this.attributes.rowsPerPage
    if ( ! rowsPerPage )
      rowsPerPage = 16
    this.page = 1
    this.pageCount = Math.ceil(this.rowCasts.length / rowsPerPage)
    await this.writePageHeading()
    await this.writeOutputHeading()
    await this.writeRowHeadings()
    let needNewPageHeading = false
    let idx = 0
    let rowCount = this.rowCasts.length
    await this.rowCasts.forAllAsync(async cast => {
      needNewPageHeading = rowsWrittenOnPage >= rowsPerPage
      if ( needNewPageHeading ) {
        await this.writePageFooter()
        this.pdf.addPage()
        this.page++
        await this.writePageHeading()
        await this.writeRowHeadings()
        rowsWrittenOnPage = 0
      }
      idx++
      await this.writeRow(cast, idx, rowCount)
      rowsWrittenOnPage++
    })
    this.line(this.leftMargin, this.bottomOfNextText - 4, this.x + 1, this.bottomOfNextText - 4); 
  }

  async maybeWriteBackgroundImage() {
    let fn = this.attributes.backgroundImageUrlFunction
    if ( ! fn ) 
      return
    let url = await fn(this); if ( ! url ) return
    let x = 0
    let y = 0
    let w = this.pageWidthMm
    let h = this.pageHeightMm
    await this.image(url, x, y, w, h)
  }

  async writePageHeading() {
    await this.maybeWriteBackgroundImage()
    let topMargin = this.attributes.topMargin || 30
    this.y = topMargin
    if ( this.repeatTop )
      this.y = this.repeatTop + topMargin
    await this.writeTitle()
    let sections = this.getPageHeadingSections()
    await sections.forAllAsync(async section => {
      await this.writeSection(section)
    })
    let pageHeadingBottomMargin = this.attributes.pageHeadingBottomMargin || 8
    this.y += pageHeadingBottomMargin
  }

  async writeTitle() {
    let title = this.attributes.title; if ( ! title ) return
    let fontSize = this.attributes.titleFontSize || 45
    this.setFontSize(fontSize)
    await this.text(title, this.leftMargin - 1, this.y)
    this.setFontSize(this.defaultFontSize)
    this.y += 12
  }

  totalSectionsHeight(sections) {
    let res = 0
    for ( var i = 0; i < sections.length; i++ ) {
      let section = sections[i]
      if ( section.attributes.height )
        res += section.attributes.height
      if ( section.attributes.bottomMargin )
        res += section.attributes.bottomMargin
    }
    return res
  }

  async writePageFooter() {
    let sections = this.getPageFooterSections()
    this.y = 282 - this.totalSectionsHeight(sections)
    this.x = this.leftMargin
    let hidePageNumber = false
    await sections.forAllAsync(async section => {
      await this.writeSection(section)
      if ( section.attributes.hidePageNumber ) {
        hidePageNumber = true
      }
    })
    if ( ! hidePageNumber )
      await this.text("Page".translate() + " " + this.page + " / " + this.pageCount, this.leftMargin, 282)
  }

  async writeOutputHeading() {
    let sections = this.getOutputHeadingSections()
    await sections.forAllAsync(async section => {
      await this.writeSection(section)
    })
    this.y += 8
  }

  async writeOutputFooter() {
    this.y += 8
    let sections = this.getOutputFooterSections()
    await sections.forAllAsync(async section => {
      await this.writeSection(section)
    })
    this.y += 8
  }

  getOutputHeadingSections() {
    return this.attributes.sections.filter(s => s.attributes.outputHeading === true)
  }

  getOutputFooterSections() {
    return this.attributes.sections.filter(s => s.attributes.outputFooter === true)
  }

  getPageFooterSections() {
    return this.attributes.sections.filter(s => s.attributes.pageFooter === true)
  }

  getPageHeadingSections() {
    return this.attributes.sections.filter(s => s.attributes.pageHeading === true)
  }

  async cookSubsections(section) {
    let subsections = section.attributes.subsections
    if ( subsections.length > 0 ) return
    let subsection = 
      { name: 'Main', 
        attributes: 
          { name: 'Main', 
            componentName: "Subsection", 
            fields: section.attributes.fields 
          }
      }
    subsections.push(subsection)
  }

  async sectionToSubsectionFixedWidthTotal(section, info) {
    let res = 0
    info.unfixedCount = 0
    let subsections = section.attributes.subsections
    for ( var i = 0; i < subsections.length; i++ ) {
      let subsection = subsections[i]
      let w = subsection.attributes.width
      if ( w ) {
        res += w
      } else {
        info.unfixedCount++
      }
    }
    return res
  }

  async determineSubsectionWidths(section) {
    let avail = this.sectionWidth
    let fixedInfo = {}
    let fixed = await this.sectionToSubsectionFixedWidthTotal(section, fixedInfo)
    avail -= fixed
    let subsections = section.attributes.subsections
    avail -= (subsections.length - 1) * this.gapBetweenSubsections
    for ( var i = 0; i < subsections.length; i++ ) {
      let subsection = subsections[i]
      let w = subsection.attributes.width
      if ( w )
        subsection.calculatedWidth = w
      else
        subsection.calculatedWidth = avail / (fixedInfo.unfixedCount || 1)
    }
  }

  async writeSection(aSection) {
    let v = this.attributes.version
    if ( v === 2 ) {
      await this.writeSection2(aSection)
      return
    }
    let origY = this.y
    let a = aSection.attributes
    this.gapBetweenSubsections = 5
    if ( a.gapBetweenSubsections || a.gapBetweenSubsections === 0 )
      this.gapBetweenSubsections = a.gapBetweenSubsections
    this.sectionLeft = this.leftMargin
    this.sectionWidth = this.width
    if ( a.width )
      this.sectionWidth = a.width
    if ( a.rightAlign ) {
      let padding = 0.5
      this.sectionLeft = this.width - this.rightMargin - this.sectionWidth - padding
    }
    this.subsectionLeft = this.sectionLeft
    await this.cookSubsections(aSection)
    await this.determineSubsectionWidths(aSection)
    let sectionTop = this.y
    let subsections = aSection.attributes.subsections
    let maxLastY = this.y
    for ( var i = 0; i < subsections.length; i++ ) {
      let subsection = subsections[i]
      await this.writeSubsection(aSection, subsection)
      this.subsectionLeft += subsection.calculatedWidth + this.gapBetweenSubsections
      if ( this.y > maxLastY )
        maxLastY = this.y
      this.y = sectionTop
    }
    if ( a.height ) {
      this.y = origY + a.height
    } else
      this.y = maxLastY
  }
  
  async writeSectionLines(section) {
    let w = this.sectionWidth
    let x = this.sectionLeft
    let y = this.y
    let lineY
    let lineHeight = section.attributes.lineHeight || 8
    if ( section.attributes.lineAbove ) {
      lineY = y - lineHeight
      this.line(x, lineY, x + w, lineY); 
    }
    if ( section.attributes.lineBelow ) {
      lineY = y + section.attributes.height
      this.line(x, lineY, x + w, lineY); 
    }
  }

  async writeSection2(aSection) {
    let origY = this.y
    let a = aSection.attributes
    this.gapBetweenSubsections = 5
    if ( a.gapBetweenSubsections || a.gapBetweenSubsections === 0 )
      this.gapBetweenSubsections = a.gapBetweenSubsections
    this.sectionLeft = this.leftMargin
    this.sectionWidth = this.width - this.rightMargin - this.leftMargin
    if ( a.width )
      this.sectionWidth = a.width
    if ( a.rightAlign ) {
      let padding = 0.5
      this.sectionLeft = this.width - this.rightMargin - this.sectionWidth - padding
    }
    this.subsectionLeft = this.sectionLeft
    await this.cookSubsections(aSection)
    await this.determineSubsectionWidths(aSection)
    let sectionTop = this.y
    this.writeSectionLines(aSection)
    this.subsectionTop = this.y
    let subsections = aSection.attributes.subsections
    let maxLastY = this.y
    for ( var i = 0; i < subsections.length; i++ ) {
      let subsection = subsections[i]
      if ( subsection.attributes.leftMargin )
        this.subsectionLeft += subsection.attributes.leftMargin
      await this.writeSubsection2(aSection, subsection)
      this.subsectionLeft += subsection.calculatedWidth + this.gapBetweenSubsections
      if ( this.y > maxLastY )
        maxLastY = this.y
      this.y = sectionTop
    }
    if ( a.height ) {
      this.y = origY + a.height
    } else
      this.y = maxLastY
    if ( a.bottomMargin )
      this.y += a.bottomMargin
  }
  
  async writeSubsection2(section, subsection) {
    let a = subsection.attributes
    let fields = a.fields
    this.subsectionPadding = a.padding || 18
    await fields.forAllAsync(async field => {
      await this.writeSubsectionField(section, subsection, field)
    })
    if ( subsection.attributes.inBox )
      await this.writeSubsectionBox(section, subsection)
  }

  async writeSubsectionBox(section, subsection) {
    let w = subsection.attributes.width + 2
    let x = this.subsectionLeft - 1
    let topY = this.subsectionTop - 2
    let bottomY = this.subsectionTop + section.attributes.height
    let leeway = subsection.attributes.boxLeeway
    if ( leeway ) {
      topY -= leeway
      bottomY += leeway
      x -= leeway
      w += leeway + leeway
    }
    this.line(x, topY, x + w, topY)
    this.line(x, topY, x, bottomY)
    this.line(x, bottomY, x + w, bottomY) 
    this.line(x + w, topY, x + w, bottomY)
  }

  async writeFieldCaption(section, subsection, field) {
    let a = subsection.attributes
    let captionWidth = a.captionWidth || 40
    let captionPosition = a.captionPosition || "left"
    let lineHeight = subsection.attributes.lineHeight || section.attributes.lineHeight || 8
    this.x = this.subsectionLeft
    let x = this.x
    let w = captionWidth
    let captionFontStyle = a.captionFontStyle || "bold"
    let fontSize = field.fontSize || field.defaultFontSize || subsection.attributes.fontSize || section.attributes.fontSize
    if ( fontSize )
      this.setFontSize(fontSize)
    if ( captionPosition === "above" ) {
      if ( field.caption ) {
        this.pdf.setFontStyle(captionFontStyle)
        await this.text(field.caption, x, this.y)
        this.pdf.setFontStyle('normal')
        this.y += lineHeight
      }
    } else if ( captionPosition !== 'none' ) {
      this.pdf.setFontStyle(captionFontStyle)
      await this.text(field.caption, x, this.y)
      if ( w === 'fit' )
        this.x += field.caption ? this.pdf.getTextWidth(field.caption) + 1 : 0
      else
        this.x += w + 5
      this.pdf.setFontStyle('normal')
    }
    this.setFontSize(this.defaultFontSize)
  }

  async writeSubsectionField(section, subsection, field) {
    if ( field.hidden ) return
    if ( field.visibleWhen && ! field.visibleWhen(this, this.cast) ) return 'continue'
    let a = subsection.attributes
    let lineHeight = a.lineHeight || subsection.attributes.lineHeight || section.attributes.lineHeight || 8
    this.x = this.subsectionLeft
    await this.writeFieldCaption(section, subsection, field)
    await this.writeFieldValue(section, subsection, field)
    this.y += lineHeight
  }

  async writeValueCentered(section, subsection, field) {
    let val = this.fieldToDisplayValue(field, this.cast)
    let x = this.x
    let y = this.y
    let padding = this.subsectionPadding || 18
    let maxWidth = this.width - this.leftMargin - this.rightMargin - padding
    if ( section.attributes.subsections.length > 1 )
      maxWidth = this.subsectionLeft + subsection.calculatedWidth - x
    let centeredX = x + (maxWidth / 2)
    let lineHeight = subsection.attributes.lineHeight || section.attributes.lineHeight || 8
    let h, w
    if ( field.image ) {
      h = field.height || 50
      w = field.width || 50
      y = y - lineHeight // usually y is the bottom of the text.  Here it needs to be the top of the image
      let ires = await this.image(val, x, y, w, h)
      if ( ! ires ) {
        h = 0
        w = 0
      }
    } else {
      await this.text(val, centeredX, y, {maxWidth: maxWidth, align: "center"})
      let estLines = Math.ceil(val.length / maxWidth)
      h = ((estLines - 1) * 5) // note: 0 unless the text extends over more than one line
    }
    this.y += h
    this.lastFieldX = x
    this.lastFieldY = y
    this.lastFieldWidth = maxWidth
  }

  async writeSubscript(section, subsection, field) {
    let val = field.subscript
    let x = this.lastFieldX
    let y = this.lastFieldY + 3
    let maxWidth = 180 - x
    if ( section.attributes.subsections.length > 1 )
      maxWidth = this.subsectionLeft + subsection.calculatedWidth - x
    this.setFontSize(5)
    await this.text(val, x, y, {maxWidth: maxWidth})
    this.setFontSize(this.defaultFontSize)
  }

  async writeValueLeftAligned(section, subsection, field) {
    let val = this.fieldToDisplayValue(field, this.cast)
    let x = field.left || this.x
    let options = this.fieldToTextOptions(field)
    let lineHeight = subsection.attributes.lineHeight || section.attributes.lineHeight || 8
    let h = lineHeight
    let y = this.y
    let w
    let linkText = options && options.linkText
    let showAsLink = options && options.showAsLink
    if ( options.align === "right" ) {
      w = this.fieldToWidth(field)
      await this.text(val, x + w, y, options)
    } else {
      let maxWidth = 180 - x
      if ( section.attributes.subsections.length > 1 )
        maxWidth = this.subsectionLeft + subsection.calculatedWidth - x
      if ( field.image ) {
        h = field.height || 50
        w = field.width || 50
        y = y - lineHeight // usually y is the bottom of the text.  Here it needs to be the top of the image
        let ires = await this.image(val, x, y, w, h)
        if ( ! ires ) {
          h = 0
          w = 0
        }
      } else {
        await this.text(val, x, y, {maxWidth: maxWidth, showAsLink: showAsLink, linkText: linkText})
        w = maxWidth
        //let estLines = Math.ceil(val.length / 50)
        let estLines = Math.ceil(this.pdf.getTextWidth(val) / maxWidth)
        h = ((estLines - 1) * 5) // note: 0 unless the text extends over more than one line
      }
    }
    this.y += h
    this.lastFieldX = x
    this.lastFieldY = y
    this.lastFieldWidth = w
  }

  async writeValueRightAligned(section, subsection, field) {
    let val = this.fieldToDisplayValue(field, this.cast)
    let padding = 0.5
    let maxWidth = this.width - this.leftMargin - this.rightMargin - padding
    let right = field.right || maxWidth
    let w = this.fieldToWidth(field)
    let x = right - w
    let lineHeight = subsection.attributes.lineHeight || section.attributes.lineHeight || 8
    let h = lineHeight
    let y = this.y
    if ( field.image ) {
      h = field.height || 50
      w = field.width || 50
      y = y - lineHeight // usually y is the bottom of the text.  Here it needs to be the top of the image
      let ires = await this.image(val, x, y, w, h)
      if ( ! ires ) {
        h = 0
        w = 0
      }
    } else {
      let options = this.fieldToTextOptions(field)
      options.align = options.align || "right"
      await this.text(val, x + w, y, options)
    }
    this.y += h
    this.lastFieldX = x
    this.lastFieldY = y
    this.lastFieldWidth = w
  }

  async writeFieldLines(section, subsection, field) {
    let lineHeight = subsection.attributes.lineHeight || section.attributes.lineHeight || 8
    let w = this.lastFieldWidth
    let x = this.lastFieldX
    let y = this.lastFieldY
    let lineY
    if ( field.lineAbove ) {
      lineY = y - lineHeight + 3
      //this.line(x, lineY, x + w, lineY, field.lineAbove); 
      this.line(x, lineY, x + w, lineY); 
    }
    if ( field.lineBelow ) {
      lineY = y + 3
      //this.line(x, lineY, x + w, lineY, field.lineBelow); 
      this.line(x, lineY, x + w, lineY); 
    }
  }

  async writeFieldValue(section, subsection, field) {
    let val = this.fieldToDisplayValue(field, this.cast)
    if ( ! val )
      return
    let a = section.attributes
    let sa = subsection.attributes
    let center = a.centerAlign || sa.centerAlign
    let rightAlign = a.rightAlign
    if ( field.rightAlign === false )
      rightAlign = false
    let fontSize = field.fontSize || field.defaultFontSize || subsection.attributes.fontSize || section.attributes.fontSize
    if ( fontSize )
      this.setFontSize(fontSize)
    let fontStyle = field.fontStyle || 'normal'
    this.pdf.setFontStyle(fontStyle)
    if ( center ) {
      await this.writeValueCentered(section, subsection, field)
    } else if ( rightAlign ) {
      await this.writeValueRightAligned(section, subsection, field)
    } else {
      await this.writeValueLeftAligned(section, subsection, field)
    }
    if ( field.subscript )
      await this.writeSubscript(section, subsection, field)
    await this.writeFieldLines(section, subsection, field)
    this.setFontSize(this.defaultFontSize)
    this.pdf.setFontStyle('normal')
  }

  async writeSubsection(section, subsection) {
    let a = subsection.attributes
    let fields = a.fields
    let captionWidth = a.captionWidth || 40
    let captionPosition = a.captionPosition || "left"
    let lineHeight = subsection.attributes.lineHeight || section.attributes.lineHeight|| 8
    let center = section.attributes.centerAlign
    await fields.forAllAsync(async field => {
      if ( field.hidden ) return 'continue'
      if ( field.visibleWhen && ! field.visibleWhen(this, this.cast) ) return 'continue'
      this.x = this.subsectionLeft
      let x = this.x
      let w = captionWidth
      let captionFontStyle = a.captionFontStyle || "bold"
      if ( captionPosition === "left" ) {
        this.pdf.setFontStyle(captionFontStyle)
        await this.text(field.caption, x, this.y)
        if ( w === 'fit' )
          this.x += field.caption ? this.pdf.getTextWidth(field.caption) + 1 : 0
        else
          this.x += w + 5
        this.pdf.setFontStyle('normal')
      } else if ( captionPosition === "above" ) {
        if ( field.caption ) {
          this.pdf.setFontStyle(captionFontStyle)
          await this.text(field.caption, x, this.y)
          this.pdf.setFontStyle('normal')
          this.y += lineHeight
        }
      } 
      let val = this.fieldToDisplayValue(field, this.cast)
      if ( val ) {
        let fontSize = field.fontSize || field.defaultFontSize || subsection.attributes.fontSize || section.attributes.fontSize
        if ( fontSize )
          this.setFontSize(fontSize)
        let fontStyle = field.fontStyle || 'normal'
        let maxWidth
        let h
        let w
        let y
        this.pdf.setFontStyle(fontStyle)
        if ( center ) {
          x = this.x
          y = this.y
          let padding = 18
          maxWidth = this.width - this.leftMargin - this.rightMargin - padding
          if ( section.attributes.subsections.length > 1 )
            maxWidth = this.subsectionLeft + subsection.calculatedWidth - x
          let centeredX = x + (maxWidth / 2)
          await this.text(val, centeredX, y, {maxWidth: maxWidth, align: "center"})
          let estLines = Math.ceil(val.length / maxWidth)
          h = ((estLines - 1) * 5) // note: 0 unless the text extends over more than one line
          this.y += h
        } else {
          x = field.left || this.x
          let options = this.fieldToTextOptions(field)
          h = lineHeight
          y = this.y
          if ( options.align === "right" ) {
            w = this.fieldToWidth(field)
            await this.text(val, x + w, y, options)
          } else {
            maxWidth = 180 - x
            if ( section.attributes.subsections.length > 1 )
              maxWidth = this.subsectionLeft + subsection.calculatedWidth - x
            if ( field.image ) {
              h = field.height || 50
              w = field.width || 50
              let ires = await this.image(val, x, y, w, h)
              if ( ! ires ) {
                h = 0
                w = 0
              }
            } else {
              let linkText = options && options.linkText
              let showAsLink = options && options.showAsLink
              await this.text(val, x, y, {maxWidth: maxWidth, showAsLink: showAsLink, linkText: linkText})
              let estLines = Math.ceil(val.length / 50)
              h = ((estLines - 1) * 5) // note: 0 unless the text extends over more than one line
            }
            this.y += h
          }
        }
        w = maxWidth || w
        let lineY
        if ( field.lineAbove ) {
          lineY = y - lineHeight + 3
          this.line(x, lineY, x + w, lineY, field.lineAbove); 
        }
        if ( field.lineBelow ) {
          lineY = y + 3
          this.line(x, lineY, x + w, lineY, field.lineBelow); 
        }
        this.setFontSize(this.defaultFontSize)
        this.pdf.setFontStyle('normal')
      }
      this.y += lineHeight
    })
  }

  async getRowRectParms() {
    let fields = this.getRowFields()
    let gap = 5
    let rowHeight = this.manifest.attributes.rowHeight || 8
    let rhs = this.x
    fields.forAll(field => {
      if ( field.hidden ) return 'continue'
      if ( field.visibleWhen && ! field.visibleWhen(this, this.cast) ) return 'continue'
      if ( field.position === 'below' ) return 'continue'
      let w = this.fieldToWidth(field)
      rhs += w + gap
    })
    rhs -= gap
    let res = {rowHeight: rowHeight, rhs: rhs, gap: gap}
    return res
  }

  async writeRowHeadings() {
    let fontSize = this.manifest.attributes.fontSize || this.rowFontSize
    this.setFontSize(fontSize)
    try {
      this.x = this.leftMargin
      let fields = this.getRowFields()
      let ma = this.manifest.attributes
      let headingBGColor = ma.headingBGColor || 'white'
      let rectParms = await this.getRowRectParms()
      if ( headingBGColor === 'black' ) {
        this.pdf.setFillColor(0, 0, 0)
        this.pdf.setTextColor(255, 255, 255)
        let rowHeight = 8
        this.pdf.rect(this.leftMargin, this.y - rowHeight + 3, rectParms.rhs - this.leftMargin + 1, rowHeight, 'F');
      }
      await fields.forAllAsync(async field => {
        if ( field.hidden ) return 'continue'
        if ( field.visibleWhen && ! field.visibleWhen(this, this.cast) ) return 'continue'
        if ( field.position === 'below' ) return 'continue'
        let options = this.fieldToTextOptions(field)
        this.pdf.setFontStyle('bold')
        let x = this.x
        let w = this.fieldToWidth(field)
        if ( options.align === "right" )
          x = x + w
        else if ( options.align === "center" )
          x = x + (w / 2)
        await this.text(field.caption, x, this.y, options)
        this.x += w + rectParms.gap
      })
      this.pdf.setFillColor(255, 255, 255)
      this.pdf.setTextColor(0, 0, 0)
      this.x -= rectParms.gap
      this.y += 6
      if ( headingBGColor === 'white' ) {
        this.line(this.leftMargin, this.y, this.x + 1, this.y); 
        this.bottomOfNextText = this.y + 6
        this.y += rectParms.rowHeight - 2
      } else {
        this.bottomOfNextText = this.y + 2
        this.y += rectParms.rowHeight - 6
      }
    } finally {
      this.setFontSize(this.defaultFontSize)
    }
  }

  line(x, y, x2, y2, thickness) {
    if ( thickness === 'thick' )
      thickness = 0.5
    if ( thickness === 'thin' )
      thickness = 0.2
    let width = thickness || 0.2
    this.pdf.setLineWidth(width)
    this.pdf.line(x, y, x2, y2)
  }

  async writeRow(aCast, aIdx, rowCount) {
    let fontSize = this.manifest.attributes.fontSize || this.rowFontSize
    this.setFontSize(fontSize)
    try {
      this.x = this.leftMargin
      let fields = this.getRowFields()
      let rectParms = await this.getRowRectParms()
      if ( ! this.attributes.linesBetweenRows ) {
        let isOdd = aIdx % 2
        if ( isOdd )
          this.pdf.setFillColor(226, 230, 234);
        else
          this.pdf.setFillColor(255, 255, 255);
      }
      let topOfRect = this.y - rectParms.rowHeight + 3
      if ( ! this.attributes.linesBetweenRows ) 
        this.pdf.rect(this.leftMargin, topOfRect, rectParms.rhs - this.leftMargin + 1, rectParms.rowHeight, 'F');
      this.provisionalBelowY = this.bottomOfNextText
      this.provisionalBelowX = this.x
      await fields.forAllAsync(async field => {
        if ( field.hidden ) return 'continue'
        let x = this.x
        let w, h, y
        let val = this.fieldToDisplayValue(field, aCast)
        if ( field.postImage ) {
          val = this.fieldToPostImageCall(field, aCast)
          h = field.height || 50
          w = field.width || 50
          y = topOfRect
          await this.image(val, x, y, w, h)
          this.x += w + rectParms.gap
        } else {
          let position = field.position
          let options = this.fieldToTextOptions(field)
          this.pdf.setFontStyle('normal')
          x = this.x
          let bottom = this.bottomOfNextText - 1
          let fieldFontSize = field.fontSize || fontSize
          this.setFontSize(fieldFontSize)
          if ( position === 'below' ) {
            bottom = this.provisionalBelowY
            x = this.provisionalBelowX
            this.setFontSize(fieldFontSize - 2)
            if ( field.caption )
              val = field.caption + ': ' + val
          } else
            this.provisionalBelowX = this.x
          w = this.fieldToWidth(field)
          if ( options.align === "right" )
            x = x + w
          else if ( options.align === "center" )
            x = x + (w / 2)
          await this.text(val, x, bottom, options)
          this.setFontSize(fontSize)
          if ( position !== 'below' )
            this.x += w + rectParms.gap
          this.provisionalBelowY = bottom + Math.round(fontSize / 2)
        }
      })
      if ( this.attributes.linesBetweenRows ) {
        if ( aIdx > 1 ) {
          let lineY = topOfRect // we're drawing a line above the row just written
          this.line(this.leftMargin, lineY, rectParms.rhs + 1, lineY); 
        }
      }
      this.pdf.setFillColor(255, 255, 255);
      this.x -= rectParms.gap
      this.y += rectParms.rowHeight
      this.bottomOfNextText += rectParms.rowHeight
    } finally {
      this.setFontSize(this.defaultFontSize)
    }
  }

  fieldToPostImageCall(field, cast) {
    let res
    let id = cast.id
    if ( field.postIdField ) {
      let ref = cast[field.postIdField]
      if ( ref )
        id = ref.id
    }
    res = global.server.getCallString(
      {methodWithParms: 'stocktend_object?datatype=none&source=postImage&id=' + id + '&imageType=' + field.postImageType})
    return res
  }

  fieldToWidth(aField) {
    let res = aField.width
    let fn = aField.dynamicWidth
    if ( fn )
      res = fn(this)
    if ( ! res )
      res = 20
    return res
  }

  fieldToTextOptions(aField) {
    let res = {}
    if ( (aField.rightAlign !== false) && (aField.numeric || aField.rightAlign) ) 
      res.align = "right"
    if ( aField.centerAlign ) 
      res.align = "center"
    if ( aField.width )
      res.maxWidth = this.fieldToWidth(aField) + ''
    if ( aField.showAsLink ) {
      res.showAsLink = true
      res.linkText = aField.linkText
    }
    return res
  }

  getRowsMold() {
    let m = this.attributes.manifests[0]; if ( ! m ) return null
    return global.foreman.doNameToMold(m.attributes.datatype)
  }

  getRowFields() {
    return this._rowFields
  }

  fieldToDisplayValue(aField, aCast) { /* Writer */
    let f = aField
    let res = this.fieldToValue(f, aCast)
    if ( f.numeric && (res === global.unknownNumber()) )
      return "Unknown"
    if ( f.date ) {
      res = res.toLocalDateDisplayText({blankIfEmpty: true})
    }
    if ( f.numeric ) {
      if ( f.blankWhenZero && (! res) )
        res = ''
      else {
        if ( f.decimals || (f.decimals === 0) )
          res = global.numToStringWithXDecimals(res, f.decimals)
        if ( f.minDecimals || (f.minDecimals === 0) )
          res = global.numToStringWithMinXDecimals(res, f.minDecimals, f.maxDecimals)
      }
    }
    if ( res && f.translateOnDisplay )
      res = (res + '').translate()
    return res + ''
  }

  fieldToValue(aField, aCast) { /* Writer */
    if ( aField.value ) 
      return aField.value
    let res = aCast[aField.name]
    if ( ! global.isObj(res) ) 
      return this.safeValue(res)
    return this.safeValue(res.keyval)
  }

  safeValue(aVal) {
    if ( (! aVal) && (aVal !== 0) ) return ''
    return aVal
  }

  async text(aStr, aX, aY, aOptions) {
    if ( aOptions && aOptions.showAsLink ) {
      let text = aOptions.linkText || aStr
      this.link(aStr, text, aX, aY, aOptions)
      return
    }
    if ( ! aStr ) return
    if ( this.stringContainsNonAscii(aStr) ) {
      await this.utf8Text(aStr, aX, aY, aOptions)
      return
    }
    this.pdf.text(aStr, aX, aY, aOptions)
  }

  async link(aStr, linkText, aX, aY, aOptions) {
    if ( ! aStr ) return
    let options = aOptions || {}
    options.url = aStr
    this.pdf.setTextColor(0, 0, 238)
    this.pdf.textWithLink(linkText, aX, aY, options);
    this.pdf.setTextColor(0, 0, 0)
    let lineY = aY + 1
    let w = this.pdf.getTextWidth(linkText)
    this.pdf.setDrawColor(0, 0, 238)
    this.line(aX, lineY, aX + w, lineY); 
    this.pdf.setDrawColor(0, 0, 0)
  }

/* eslint-disable no-control-regex */
  stringContainsNonAscii(aStr) {
    return ! /^[\u0000-\u00ff]*$/.test(aStr);
    //return ! /^[ -~\t\n\r]+$/.test(aStr)
  }

  async utf8Text(aStr, aX, aY, aOptions) {
    let self = this
    let holder = document.getElementById("prfiPdfTemp")
    holder.style = 
      "font-size: " + (this.fontSize * 2) + "px; " + 
      "background-color: " + this.pdf.getFillColor() + "; " + 
      'position: absolute; left: -9999px; height: auto; width: auto; white-space: nowrap; padding: 0px; margin: 0px'
    await Promise.all(
      [
        new Promise(
          function(resolve) {
            holder.innerHTML = aStr
            global.prfiExecDeferred( 
              () => {
                html2canvas(
                  holder
                ).then( 
                  canvas => {
                    let res = canvas.toDataURL('image/png')
                    resolve(res)
                  }
                )
              },
              {noSpinner: true, ms: 10}
            )
          }
        )
      ]
    ).then(
      function(aImageList) { 
        let conv = 0.18
        let width = holder.clientWidth * conv
        if ( aOptions && aOptions.maxWidth && (width > aOptions.maxWidth) )
          width = aOptions.maxWidth
        let height = holder.clientHeight * conv
        let y = aY // - height + 1 // y coordinate is bottom
        let correction = 3.2
        y -= correction
        let x = aX
        if ( aOptions && (aOptions.align === "right") ) 
          x = x - width
        self.pdf.addImage(aImageList[0], 'PNG', x, y, width, height)
      }
    )
  }

  async qrcode(aStr, aX, aY, aHeight, aOptions) {

    if ( ! aStr ) return
    let self = this
    let holder = document.getElementById("prfiPdfQrcodeTemp")

    let addImageToPdf = (aImage) => {
      if ( ! holder.clientHeight ) return
      if ( ! holder.clientWidth ) return
      let height = aHeight
      let width = height
      if ( width > aOptions.maxWidth ) {
        width = aOptions.maxWidth
        height = width
      }
      let y = aY
      let x = aX
      let correction = 3.2
      y -= correction
      self.pdf.addImage(aImage, 'PNG', x, y, width, height)
    }

    if ( aStr === this.lastQrcodeStr ) {
      let res = holder.toDataURL('image/png')
      if ( res ) {
        addImageToPdf(res)
        return
      }
    }
    this.lastQrcodeStr = aStr
    holder.style =
      "background-color: " + this.pdf.getFillColor() + "; " +
      'position: absolute; left: -9999px; height: auto; width: auto; white-space: nowrap; padding: 0px; margin: 0px'
    await Promise.all(
      [
        new Promise(
          function(resolve) {
            try {
              QRCode.toCanvas(holder, aStr,
                function (error, canvas) {
                  if ( error ) {
                    console.log('QR Code error: ' + error)
                    return
                  }
                  let res = canvas.toDataURL('image/png')
                  resolve(res)
                }
              )
            } catch(e) {
              self.lastError = "Qrcode error: ".translate() + e
            }
          }
        )
      ]
    ).then(
      function(aImageList) {
        addImageToPdf(aImageList[0])
      }
    )
  }

  async barcode(aStr, aX, aY, aHeight, aFormat, aOptions) {

    if ( ! aStr ) return
    let self = this
    let holder = document.getElementById("prfiPdfBarcodeTemp")

    let addImageToPdf = (aImage) => {
      if ( ! holder.clientHeight ) return
      if ( ! holder.clientWidth ) return
      let ratio = holder.clientWidth / holder.clientHeight
      let height = aHeight
      let width = height * ratio
      if ( width > aOptions.maxWidth ) {
        width = aOptions.maxWidth
        height = width / ratio
      }
      let y = aY
      let x = aX
      let correction = 3.2
      y -= correction
      self.pdf.addImage(aImage, 'PNG', x, y, width, height)
    }

    if ( (aStr === this.lastBarcodeStr) && (aFormat === this.lastBarcodeFormat) ) {
      addImageToPdf(holder.src)
      return
    }
    this.lastBarcodeStr = aStr
    this.lastBarcodeFormat = aFormat
    holder.style =
      "background-color: " + this.pdf.getFillColor() + "; " +
      'position: absolute; left: -9999px; height: auto; width: auto; white-space: nowrap; padding: 0px; margin: 0px'
    await Promise.all(
      [
        new Promise(
          function(resolve) {
            let format = aFormat || "CODE128"
            try {
              JsBarcode(holder, aStr, {margin: 0, format: format})
            } catch(e) {
              self.lastError = "Barcode error: ".translate() + e
            }
            global.prfiExecDeferred(
              () => {
                html2canvas(
                  holder
                ).then(
                  canvas => {
                    let res = canvas.toDataURL('image/png')
                    resolve(res)
                  }
                )
              },
              {noSpinner: true, ms: 10}
            )
          }
        )
      ]
    ).then(
      function(aImageList) {
        addImageToPdf(aImageList[0])
      }
    )
  }

  async image(aUrl, aX, aY, aWidth, aHeight) {
    if ( ! aUrl ) return false
    var img = new Image()
    img.src = aUrl
    let imageType = img.src.afterLast('.').toLowerCase()
    if ( imageType === 'jpeg' )
      imageType = 'jpg'
    if ( ! ['jpg', 'png'].contains(imageType) )
      imageType = 'png'
    try {
      this.pdf.addImage(img, imageType, aX, aY, aWidth, aHeight)
    } catch(e) {
      console.log(e.message)
      return false
    }
    return true
  }

}

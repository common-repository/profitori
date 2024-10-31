import XLSX from 'xlsx'
require('./Globals.js')

export default class XLSImporter {

  err(msg) {
    let cookedMsg = msg
    if ( this.rowNo >= 2 )
      cookedMsg = "Row " + this.rowNo + ": " + cookedMsg
    throw(new Error(cookedMsg))
  }

  async importData(data, aOptions) {
    global.startProgress({message: "Importing"})
    try {
      this.errorMsg = null
      try {
        let isJustJson = aOptions && aOptions.json
        this.createdCount = 0
        this.updatedCount = 0
        this.unchangedCount = 0
        this.errorCount = 0
        this.rowNo = 0
        if ( isJustJson ) {
          this.rows = data
          this.datatype = aOptions.datatype
        } else {
          this.rows = this.xlsDataToJson(data)
        }
        this.rowNo = 1
        await global.updateProgress(0.05)
        await this.processRows()
        await global.updateProgress(0.95)
      } catch(e) {
        this.errorMsg = e.message
      }
    } finally {
      global.stopProgress()
    }
  }

  xlsDataToJson(data) {
    let workbook = XLSX.read(data, {type: 'binary'})
    let sheetNames = workbook.SheetNames
    if ( sheetNames.length !== 1 )
      this.err('Workbook should have a single sheet')
    let sheetName = sheetNames[0]
    this.datatype = sheetName
    if ( ! global.foreman.doNameToMold(this.datatype) )
      this.err('The worksheet name needs to be a valid Profitori data type (is "' + sheetName + '")')
    let sheet = workbook.Sheets[sheetName]
    let res = XLSX.utils.sheet_to_json(sheet)
    return res
  }

  async processRows(rows) {
    for ( var i = 0; i < this.rows.length; i++ ) {
      this.row = this.rows[i]
      this.rowIndex = i
      try {
        await this.processRow()
      } catch(e) {
        if ( this.ignoreErrors ) {
          this.errorCount++
          console.log(e.message)
        } else
          throw(e)
      }
      await global.updateProgress(0.05 + ((i / this.rows.length) * 0.9))
    }
  }

  async setCastFieldVal(field, val) {
    let cast = this.cast
    let oldRawVal = cast[field.name]
    let oldVal = cast.fieldNameToExtractValue(field.name)
    field.setCastPropValue(cast, val, {forImport: true})
    let newVal = cast.fieldNameToExtractValue(field.name)
    if ( newVal !== oldVal ) {
      if ( field.readOnly ) {
        cast[field.name] = oldRawVal
        this.err('Cannot load value into read only field ' + field.name + ' - old value: ' + oldVal + '; new value: ' + newVal)
      }
      if ( field.isAlwaysCalculated() && (! field.storedCalc) ) {
        cast[field.name] = oldRawVal
        this.err('Cannot load value into calculated field ' + field.name + ' - old value: ' + oldVal + '; new value: ' + newVal)
      }
      let auc = field.toAfterUserChange()
      if ( auc ) {
        try {
          await auc(oldVal, newVal, cast, null)
        } catch(e) {
          // Ignore, as this may be due to null last parameter
        }
      }
    }
  }

  getRowType() {
    let res = this.row['$RowType']
    if ( ! res )
      return "Header"
    if ( (res !== "Header") && (res !== "LineItem") )
      this.err("Invalid row type: " + res)
    return res
  }

  getRowDatatype() {
    let rowType = this.getRowType()
    if ( rowType === "Header" ) 
      return this.datatype
    return this.getLineItemDatatype()
  }

  getLineItemDatatype() {
    let m = global.foreman.doNameToMold(this.datatype); if ( ! m ) return null
    return m.toLineDatatype()
  }

  checkKeyvalUnchanged() {
    if ( this.cast.isNew() ) return
    let key = this.cast.mold().key; if ( ! key ) return
    let castKeyval = this.cast.ultimateKeyval()
    let rowKeyval = this.row[key]
    if ( ! rowKeyval ) return
    if ( castKeyval !== rowKeyval )
      this.err(key + ' value ' + rowKeyval + ' does not match value in database: ' + castKeyval)
  }

  checkIdPresent() {
    if ( ! this.row.id )
      this.err('There is no column for id - this is required (you may set cells to [new] to create new records)')
  }

  checkKeyvalPresent() {
    let key = this.cast.mold().key; if ( ! key ) return
    if ( ! this.row[key] )
      this.err('There is no value for ' + key + ' - this is required')
  }

  async checkKeyvalUnique() {
    let m = this.cast.mold()
    if ( ! m.keyIsUnique() ) {
      if ( ! m.facade )
        this.checkIdPresent()
      return 
    }
    let key = m.key; if ( ! key ) return
    let keyval = this.row[key]
    let dt = this.getRowDatatype(); if ( ! dt ) this.err('Invalid row')
    let otherCast = await dt.bringSingle({[key]: keyval})
    if ( otherCast )
      this.err("Record already exists with " + key + " = " + keyval + " - please specify an id if you want to update existing record")
  }

  checkParentPresent() {
    let fieldName = this.cast.mold().fieldNameReferringToParent(); if ( ! fieldName ) this.err("Unable to find field referring to parent")
    let idFieldName = fieldName + ".id"
    let rowType = this.getRowType()
    if ( rowType === "LineItem" ) {
      fieldName = 'LineItem.' + fieldName
      idFieldName = 'LineItem.' + idFieldName
    }
    if ( (! this.row[fieldName]) && (! this.row[idFieldName]) )
      this.err('Missing column ' + fieldName + ' or ' + idFieldName)
  }

  async checkKeys() {
    if ( this.cast.mold().hasParent() ) {
      this.checkParentPresent()
      if ( this.getRowDatatype() === this.datatype )
        this.checkIdPresent()
      return
    }
    this.checkKeyvalPresent()
    await this.checkKeyvalUnique()
  }

  async createCast() {
    let dt = this.getRowDatatype(); if ( ! dt ) this.err('Invalid row (2)')
    let res = await dt.create()
    return res
  }

  propIsPartOfReference(prop) {
    if ( prop.endsWith('.id') )
      return true
    let f = this.cast.nameToField(prop)
    if ( f && f.refersTo )
      return true
    return false
  }

  fieldNameToRefereeDatatype(fieldName) {
    let f = this.cast.mold().nameToField(fieldName); if ( ! f ) return null
    return f.refersTo.datatype
  }

  fieldIsParentRef(fieldName) {
    let f = this.cast.mold().nameToField(fieldName); if ( ! f ) return false
    let rt = f.refersTo; if ( ! rt ) return false
    return rt.refereeIsParent
  }

  async dealWithRefPart(prop, rawProp) {
    if ( prop.endsWith('.id') ) {
      await this.dealWithRefId(prop, rawProp)
      return
    }
    await this.dealWithRefKeyval(prop, rawProp)
  }

  async dealWithRefId(prop, rawProp) {
    let cast = this.cast
    let id = this.row[rawProp]
    if ( ! id )
      return
    let fieldName = prop.stripRight('.id')
    let castRef = cast[fieldName]
    if ( castRef && (castRef.id === id) ) {
      return
    }
    if ( (! cast.isNew()) && this.fieldIsParentRef(fieldName) )
      this.err('Cannot change parent of existing record')
    let refereeDt = this.fieldNameToRefereeDatatype(fieldName); if ( ! refereeDt ) this.err('Invalid reference field ' + fieldName)
    let referee = await refereeDt.bringSingle({id: id})
    if ( ! referee )
      this.err('Invalid id ' + id + ' for ' + rawProp)
    this.cast[fieldName] = referee.reference()
  }

  async dealWithRefKeyval(prop, rawProp) {
    let keyval = this.row[rawProp]
    if ( ! keyval )
      return
    let cast = this.cast
    let fieldName = prop
    let castKeyval = cast.fieldNameToUltimateKeyval(fieldName)
    if ( castKeyval === keyval )
      return
    if ( (! cast.isNew()) && this.fieldIsParentRef(fieldName) )
      this.err('Cannot change parent of existing record')
    let refereeDt = this.fieldNameToRefereeDatatype(fieldName); if ( ! refereeDt ) this.err('Invalid reference field ' + fieldName)
    let refMold = global.foreman.doNameToMold(refereeDt)
    let keyname = refMold.key
    if ( ! keyname )
      this.err('Key specified for reference that does not have a key: ' + fieldName)
    let referee = await refereeDt.bringSingle({[keyname]: keyval})
    if ( ! referee )
      this.err('Invalid key value ' + keyval + ' for ' + rawProp)
    this.cast[fieldName] = referee.reference()
  }

  propToDatatype(prop) {
    if ( prop.startsWith('LineItem.') ) 
      return this.getLineItemDatatype()
    return this.datatype
  }

  updateSimpleCounts() {
    if ( this.cast.isNew() )
      this.createdCount++
    else if ( this.cast.changed() )
      this.updatedCount++
    else
      this.unchangedCount++
  }

  nextRowIsHeaderOrEnd() {
    if ( this.rowIndex >= (this.rows.length - 1) )
      return true
    let nextRow = this.rows[this.rowIndex + 1]
    return (nextRow.$RowType === "Header")
  }

  async updateCounts() {
    if ( ! this.row.$RowType ) {
      this.updateSimpleCounts()
      return
    }
    if ( this.getRowType() === "LineItem" ) {
      if ( this.cast.isNew() )
        this.linesWereAdded = true
      else if ( this.cast.changed() )
        this.linesWereChanged = true
    } else {
      this.headerWasAdded = false
      this.headerWasChanged = false
      this.linesWereAdded = false
      this.linesWereChanged = false
      if ( this.cast.isNew() )
        this.headerWasAdded = true
      else if ( this.cast.changed() )
        this.headerWasChanged = true
    }
    if ( ! this.nextRowIsHeaderOrEnd() )
      return
    if ( this.headerWasAdded ) 
      this.createdCount++
    else if ( this.linesWereAdded || this.linesWereChanged || this.headerWasChanged )
      this.updatedCount++
    else
      this.unchangedCount++
  }

  async bringCastByUniqueKey (mold) {
    let key = mold.key; if ( ! key ) this.err('Datatype has no key')
    let keyval = this.row[key]
    if ( ! keyval )
      this.err('There is no value for ' + key + ' - this is required')
    let dt = mold.name
    let res = await dt.bringSingle({[key]: keyval}); if ( ! res ) this.err('Invalid key value ' + keyval)
    return res
  }

  async processRow() {
    this.rowNo++
    let dt = this.getRowDatatype(); if ( ! dt ) this.err('Invalid row (3)')
    let mold = global.foreman.doNameToMold(dt); if ( ! mold ) this.err('Invalid datatype ' + dt)
    if ( (this.rowNo === 2) && mold.facade ) {
      dt.clear()
    }
    if ( mold.beforeImporting && (this.rowNo === 2) ) {
      this.rows = await mold.beforeImporting(this.rows)
    }
    let row = this.row
    if ( row.id && (row.id !== '[new]') ) {
      this.cast = await dt.bringSingle({id: row.id})
      if ( ! this.cast )
        this.err('Invalid id: ' + row.id)
      await this.cast.refreshCalculations({force: true, includeDefers: true})
      this.checkKeyvalUnchanged()
    } else if ( (! row.id) && (! mold.hasParent()) && mold.keyIsUnique() ) {
      this.cast = await this.bringCastByUniqueKey(mold)
    } else {
      this.cast = await this.createCast()
      await this.checkKeys()
      await this.cast.mold().doCastAfterCreate(this.cast)
    }
    this.cast.__importRowNo = this.rowNo
    for ( var prop in row ) {
      let rawProp = prop
      prop = prop.trim()
      if ( prop.startsWith('ignore ') ) continue
      if ( prop === 'id' ) continue
      if ( prop === '$RowType' ) continue
      let propDt = this.propToDatatype(prop); if ( ! propDt ) this.err('Invalid property data type for ' + prop)
      prop = prop.stripLeft('LineItem.')
      if ( propDt !== dt )
        continue
      if ( this.propIsPartOfReference(prop) ) {
        await this.dealWithRefPart(prop, rawProp)
        continue
      }
      let f = this.cast.nameToField(prop)
      if ( ! f ) 
        this.err('Invalid column name: ' + prop)
      await this.setCastFieldVal(f, row[rawProp])
      await this.cast.refreshCalculations({force: true, includeDefers: true})
    }
    
    this.cast.mold().refreshKeyIndex(this.cast)
    await this.cast.refreshReferences()
    await this.cast.resolveParentId()
    await this.cast.refreshCalculations({includeDefers: true, force: true, keepState: true})
    this.cast.mold().setCastValuesToCorrectTypes(this.cast)
    let res = await this.cast.mold().acceptOrRejectCastOnSave(this.cast) 
    if ( res ) {
      this.err(res.message)
    }
    res = await this.cast.mold().acceptOrRejectFieldsOnSave(this.cast)
    if ( res ) 
      this.err('Invalid ' + res.field.name + ': ' + res.message)
    await this.updateCounts()
  }

}

require('./Globals.js')

export default class Pancake {
  constructor() {
    this.fields = []
    this.rootObj = null
  }

  initFromObj(aObj) {
    this.rootObj = aObj
    this.addObjProps(aObj, "")
  }

  addObjProps(aObj, aParentFieldName) {
    let cast = aObj
    let isLineItem = (this.rootObj.$RowType === "LineItem")
    let fields = cast.fields()
    let id = cast.id
    if ( ! aParentFieldName ) {
      if ( this.rootObj.$RowType )
        this.addField('$RowType', this.rootObj.$RowType)
      if ( isLineItem )
        id = this.rootObj.LineItem.id
      this.addField('id', id)
    }
    for ( var i = 0; i < fields.length; i++ ) {
      let field = fields[i]
      let rawVal = cast[field.name]
      if ( global.isObj(rawVal) ) {
        let idFieldName = field.name + '.id'
        if (aParentFieldName) 
          idFieldName = aParentFieldName + "." + idFieldName
        this.addField(idFieldName, rawVal.id)
      }
      let propVal = cast.fieldNameToExtractValue(field.name)
      let fieldName = field.name
      let propIsForHeader = true
      if (aParentFieldName) {
        fieldName = aParentFieldName + "." + fieldName
        if (aParentFieldName === "LineItem")
          propIsForHeader = false
      }
      if (isLineItem && propIsForHeader && global.isNumeric(propVal))
        continue
      this.addField(fieldName, propVal)
    }
    if ( isLineItem && ! aParentFieldName) {
      this.addObjProps(this.rootObj.LineItem, "LineItem")
    }
  }

  addField(aName, aVal) {
    this.fields.push({ name: aName, value: aVal })
  }

  toCSVStr(aFieldList) {
    let res = ""
    for ( var i = 0; i < aFieldList.length; i++ ) {
      let fieldName = aFieldList[i]
      let f = this.nameToField(fieldName);
      let val = ""
      if (f)
        val = f.value
      if (global.isString(val)) {
        val = val.replace(/"/, '""');
        val = val.replace(/\r/, ' ');
        val = val.replace(/\n/, '|');
        val = '"' + val + '"'
      }
      res = res + ',' + val
    }
    res = global.stripLeftChars(res, 1)
    return res
  }

  nameToField(aName) {
    for ( var i = 0; i < this.fields.length; i++ ) {
      let f = this.fields[i]
      if (f.name === aName) return f
    }
  }
}


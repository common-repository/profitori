import Pancake from './Pancake.js'
require('./Globals.js')

export default class PancakeList {

  constructor() {
    this.items = []
  }

  addPancakeFromObj(aObj) {
    let p = new Pancake()
    p.initFromObj(aObj)
    this.items.push(p)
  }

  getDataAsArray() {
    let res = []
    let fieldList = this.getFieldList()
    for ( var i = 0; i < this.items.length; i++ ) {
      let item = this.items[i]
      let resItem = {}
      for ( var j = 0; j < fieldList.length; j++ ) {
        let field = fieldList[j]
        let f = item.nameToField(field);
        if ( f )
          resItem[field] = f.value
      }
      res.push(resItem)
    }
    return res
  }

  getFieldList() {
    let res = []
    for ( var i = 0; i < this.items.length; i++ ) {
      let p = this.items[i]
      for ( var j = 0; j < p.fields.length; j++ ) {
        let f = p.fields[j]
        let idx = res.indexOf(f.name); if (idx >= 0) continue
        res.push(f.name)
      }
    }
    return res
  }
}


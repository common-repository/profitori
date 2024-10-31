import PancakeList from './PancakeList.js'
import XLSX from 'xlsx'
require('./Globals.js')

export default class XLSMaker {

  async download(aDatatype) {
    global.startProgress({message: 'Generating Excel spreadsheet'})
    try {
      await global.updateProgress(0.1)
      await global.gApp.harmonize()
      let pancakeList = new PancakeList()
      let casts = await aDatatype.bring(null, {includeDefers: true})
      await global.updateProgress(0.2)
      casts = await this.expandLineItems(casts)
      for (var cast of casts) {
        pancakeList.addPancakeFromObj(cast)
      }
      await global.updateProgress(0.3)
      //let fieldList = pancakeList.getFieldList()
      //let res = this.fieldListToXLSHeaderStr(fieldList, aDatatype) + "\r\n"
      //for (var p of pancakeList.items) {
        //let row = p.toCSVStr(fieldList)
        //res = res + row + "\r\n"
      //}
      //let blob = new Blob([res], {type: "text/plain;charset=utf-8"})
      //FileSaver.saveAs(blob, aDatatype + '.XLS')
      const xu = XLSX.utils
      let data = await pancakeList.getDataAsArray()
      global.exportedJsonData = data
      global.lastExportedDatatype = aDatatype
      await global.updateProgress(0.6)
      if ( data.length === 0 )
        data = [{message: "There is no " + aDatatype + " data."}]
      var ws = xu.json_to_sheet(data)
      var wb = xu.book_new();
      let title = aDatatype
      xu.book_append_sheet(wb, ws, title);
      await global.updateProgress(0.7)
      XLSX.writeFile(wb, aDatatype + '.xlsx')
      await global.updateProgress(0.95)
    } finally {
      global.stopProgress()
    }
  }
  
  async expandLineItems(aHeaders) {
    let res = []
    for ( var i = 0; i < aHeaders.length; i++ ) {
      let h = aHeaders[i]
      let lines = await h.retrieveLines()
      if ( ! lines ) {
        res.push(h.copy())
        continue
      }
      let hCopy = h.copy()
      hCopy.$RowType = "Header"
      res.push(hCopy)
      for ( var j = 0; j < lines.length; j++ ) {
        let line = lines[j]
        let obj = h.copy()
        obj.$RowType = "LineItem"
        obj.LineItem = line
        res.push(obj)
      }
    }
    return res
  }
  
/*
  fieldListToCSVHeaderStr(aList, aDatatype) {
    var res = ""
    for ( var i = 0; i < aList.length; i++ ) {
      let f = aList[i]
      res = res + "," + f;
    }
    res = global.stripLeftChars(res, 1)
    if (!res)
      res = "There is no " + aDatatype + " data."
    return res
  }
*/
}


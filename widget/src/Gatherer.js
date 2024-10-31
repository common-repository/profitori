import Translator from './Translator.js'
require('./Globals.js')

export default class Gatherer {

  constructor() {
    this.strings = {}
  }

  static gather(aStr) {
    gGatherer.doGather(aStr)
  }

  static report() {
    gGatherer.doReport()
  }

  doReport() {
    if ( Object.keys(this.strings).length === 0 ) return
    console.log(JSON.stringify(this.strings, null, 1))
  }

  doGather(aStr, aOptions) {
    if ( aStr.startsWith("_") ) return
    let translated = Translator.translate(aStr, aOptions)
    if ( aStr !== translated )
      return
    if ( global.gatherTargetLang ) {
      if ( Translator.hasTranslationFor(aStr, aOptions) )
        return
    }
    this.strings[aStr] = ""
  }

}

let gGatherer = new Gatherer()


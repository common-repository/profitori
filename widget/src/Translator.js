
export default class Translator {

  static translate(aStr, aOptions) {
    return gTranslator.doTranslate(aStr, aOptions)
  }

  static hasTranslationFor(aStr, aOptions) {
    return gTranslator.doHasTranslationFor(aStr, aOptions)
  }

  doTranslate(aStr, aOptions) {
    let str = aStr
    let supportedLanguages = ["ES", "ZH", "ID", "RO", "FA", "TR"]
    let lang = global.getLanguage()
    if ( (! lang) || (lang === "EN") )
      return str
    if ( ! supportedLanguages.contains(lang) ) 
      return str
    if ( (! this.strings) || ( lang !== this.lastLanguage) ) 
      this.strings = require("./lang/" + lang + ".json")
    this.lastLanguage = lang
    if ( aOptions && aOptions.nonEnBase )
      str = aOptions.nonEnBase
    let res = this.strings[str]; if ( ! res ) return str
    return res
  }

  doHasTranslationFor(aStr, aOptions) {
    let lang = global.gatherTargetLang
    let str = aStr
    if ( aOptions && aOptions.nonEnBase )
      str = aOptions.nonEnBase
    if ( ! this[lang] ) 
      this[lang] = require("./lang/" + lang + ".json")
    let res = this[lang][str] 
    return res ? true : false
  }

}

let gTranslator = new Translator()


import './premium/premium.js'
require('./Globals.js')

let gHooks = {}
let throwError = global.throwError

export default class Hook {

  static apply(aName, aParms) {
    if ( ! aName ) throwError("Hook.apply called without name parameter")
    let hook = gHooks[aName]; if ( ! hook ) return null
    let res = hook.doApply(aParms)
    return res
  }

  static hook(aName, aFunction) {
    let hook = gHooks[aName]
    if ( ! hook ) {
      hook = new Hook(aName)
      gHooks[aName] = hook
    }
    hook.functions.push(aFunction)
  }

  constructor(aName) {
    this.name = aName
    this.functions = []
  }

  doApply(aParms) {
    let res = aParms.defaultResult
    this.functions.forAll(fn => {
      aParms.defaultResult = res
      res = fn(aParms)
    })
    return res
  }

}

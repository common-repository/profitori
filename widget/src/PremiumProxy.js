import './premium/premium.js'
require('./Globals.js')

let handler = global.prfiPremiumHandler

export default class PremiumProxy {

  static initialise() {
    if ( ! handler ) return
    handler.initialise()
  }

  static createMoldsAndMenus() {
    if ( ! handler ) return
    handler.createMoldsAndMenus()
  }

}

global.prfiPremiumProxy = PremiumProxy

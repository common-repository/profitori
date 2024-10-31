import Machine from '../Machine.js'
import Hook from '../Hook.js'
import Graph from './Graph.js'
import React from 'react'

let gCurrentMachine

class PremiumHandler {

  initialise() {
    Hook.hook('featureCreateReactElement', this.hookCreateReactElement.bind(this))
  }

  createMoldsAndMenus() {
    let resolve = require.resolve("./specs/index.js")
    if ( resolve ) {
      if ( require.cache[resolve] )
        delete require.cache[resolve]
    }
    require("./specs/index.js")
  }

  hookCreateReactElement(aParms) {
    let feature = aParms.feature
    let a = feature.attributes
    let cn = a.componentName
    let p = feature.props
    let key = feature.getKey()
    feature.refreshDerivedAttributes()
    if ( cn === "Graph" ) {
      return (
        <Graph 
          key={key}
          operation={p.operation} 
          parentCast={p.parentCast}
          callerCast={p.callerCast}
          attributes={a} 
          forward={p.forward}
          showMessage={p.showMessage}
          situation={p.situation}
          containerSituation={p.containerSituation}
          hideCancelButton={p.hideCancelButton}
          hideLogo={p.hideLogo}
          hideContactSupport={p.hideContactSupport}
          title={p.title}
          scroller={p.scroller}
          tileWidthPx={p.tileWidthPx}
          inTile={p.inTile}
          provideVeil={p.provideVeil}
        /> 
      )
    }
  }

}

global.prfiPremiumHandler = new PremiumHandler()


class PremiumMachine extends Machine {

  constructor() {
    super()
    gCurrentMachine = this
  }

  initAttributes() {
    super.initAttributes()
    this.attributes.tiles = []
  }

  tile(aName, aParms) {
    let specname = this.useParm(aParms, "spec")
    let widthPct = this.useParm(aParms, "widthPct")
    let heightPct = this.useParm(aParms, "heightPct")
    this.checkNoOtherParms(aParms, "tile")
    if ( specname.endsWith('js') ) {
      let idx = global.prfiSpecIndex.indexOf(specname)
      if ( idx < 0 ) throw(new Error("Built in spec " + specname + " not found"))
    }
    let t = 
      { name: aName, 
        attributes: {
          specname: specname, 
          name: aName, 
          widthPct: widthPct,
          heightPct: heightPct,
          componentName: "Tile", 
          fields: [], 
          actions: [], 
          joinedDatatypes: []
        }
      }
    this.attributes.tiles.push(t)
    this.attributes.typedControls.push(t)
  }

  graph(aName, aParms) {
    this.specIsUI = true
    if ( global.currentSpecname.endsWith('.js') ) {
      if ( (aName + ".js") !== global.currentSpecname ) this.err("graph name must match file name")
    } else {
      if ( aName !== global.currentSpecname ) this.err('Name in code doesn\'t match - is "' + aName + '" - should be "' + global.currentSpecname + '"')
    }
    let expose = this.useParm(aParms, "expose")
    let style = this.useParm(aParms, "style")
    let suppressOnMoreMenu = this.useParm(aParms, "suppressOnMoreMenu")
    let withHeader = this.useParm(aParms, "withHeader")
    this.checkNoOtherParms(aParms, "graph")
    this.initAttributes()
    let a = this.attributes
    a.componentName = 'Graph'
    a.name = aName
    a.style = style
    a.withHeader = withHeader
    a.suppressOnMoreMenu = suppressOnMoreMenu
    if ( global.gCreatingMoldsAndMenus && expose ) {
      this.addMenuItem(aName)
    }
    if ( withHeader )
      aName.datatype({transient: true})
  }

  xAxis(aName, aParms) {
    this.axis("x", aName, aParms)
  }

  yAxis(aName, aParms) {
    this.axis("y", aName, aParms)
  }

  axis(aAxis, aName, aParms) {
    let f = this.mostRecentMold.nameToField(aName)
    if ( ! f ) 
      throw(new Error('axis: Unknown field ' + aName))
    f = this.field(aName, aParms)
    let obj = this.getMostRecentTypedControl()
    let a = obj.attributes
    let axis = {field: f}
    this.checkNoOtherParms(aParms, "axis")
    if ( ! a.axes )
      a.axes = {}
    a.axes[aAxis] = axis
  }

  pieSegmentor(aName, aParms) {
    this.axis("x", aName, aParms)
  }

  pieValue(aName, aParms) {
    this.axis("y", aName, aParms)
  }

  modifyDisplayValue(aFieldName, aVal) {
    let f = this.nameToField(aFieldName); if ( ! f ) this.err("modifyDisplayValue: unknown field: " + aFieldName)
    f.modifyInputRenderValue = aVal
  }

  barColor(aName, aFn) {
    let a = this.attributes
    if ( a.componentName !== 'Graph' ) this.err("barColor target must be a Graph")
    if ( a.name !== aName ) this.err("barColor target must be the graph name")
    this.attributes.barColorFunction = aFn
  }

  drilldownSpecname(aSpec) {
    let a = this.attributes
    if ( a.componentName !== 'Graph' ) this.err("drilldownSpecname target must be a Graph")
    this.attributes.drilldownSpecname = aSpec
  }
}

global.prfiMachineClass = PremiumMachine

/* eslint-disable no-extend-native */

String.prototype.tile = function(aOptions) {
  gCurrentMachine.tile(this, aOptions)
  return this
}

String.prototype.graph = function(aOptions) {
  gCurrentMachine.graph(this, aOptions)
  return this
}

String.prototype.pieSegmentor = function(aParms) {
  gCurrentMachine.pieSegmentor(this, aParms)
  return this
}

String.prototype.pieValue = function(aParms) {
  gCurrentMachine.pieValue(this, aParms)
  return this
}

String.prototype.yAxis = function(aParms) {
  gCurrentMachine.yAxis(this, aParms)
  return this
}

String.prototype.xAxis = function(aParms) {
  gCurrentMachine.xAxis(this, aParms)
  return this
}

String.prototype.modifyDisplayValue = function(aVal) {
  gCurrentMachine.modifyDisplayValue(this, aVal)
  return this
}

String.prototype.barColor = function(aVal) {
  gCurrentMachine.barColor(this, aVal)
  return this
}

String.prototype.drilldownSpecname = function() {
  gCurrentMachine.drilldownSpecname(this)
  return this
}


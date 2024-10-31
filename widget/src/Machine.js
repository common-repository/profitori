require('./Globals.js')

let gCurrentMachine = null
let gSpecIndex = []
global.prfiSpecIndex = gSpecIndex
let gSpecIsPremium = []
let gSpecIsUI = []
global.prfiSpecIsUI = gSpecIsUI

let Foreman
let Bringer
let Menu
//let maintOrList

/* eslint-disable no-eval */

export default class Machine {
  
  constructor() {
    Foreman = global.stForemanClass
    Bringer = global.stBringerClass
    Menu = global.stMenuClass
    //maintOrList = global.stMaintOrList
  }

  addMenuItem(aName, beforeSpec) {
    Menu.add({specname: global.currentSpecname, caption: aName, beforeSpec: beforeSpec})
  }

  async specnameToAttributesAsync(aSpecname) {
    let m = Foreman.nameToMold('Mod'); if ( ! m ) return
    if ( (! m.holdingAllCasts) || m.stale() ) 
      await 'Mod'.bring()
    m = Foreman.nameToMold('Extension'); if ( ! m ) return
    if ( (! m.holdingAllCasts) || m.stale() ) 
      await 'Extension'.bring()
    return this.specnameToAttributes(aSpecname)
  }

  specnameToAttributes(aSpecname) {
    this.initAttributes()
    let sn = aSpecname
    let isExt = ! sn.endsWith('.js')
    let premium
    if ( ! isExt ) {
      let idx = gSpecIndex.indexOf(aSpecname)
      if ( idx < 0 ) throw(new Error("Spec " + sn + " must be included in index.js"))
      premium = gSpecIsPremium[idx]
      let resolve
      if ( ! premium )
        resolve = require.resolve("./specs/" + sn)
      else
        resolve = require.resolve("./premium/specs/" + sn)
      if ( resolve ) {
        if ( require.cache[resolve] )
          delete require.cache[resolve]
      }
    }
    gCurrentMachine = this
    global.stCurrentMachine = this
    global.currentSpecname = sn
    if ( isExt ) {
      this.incorporateExtension(sn)
    } else {
      if ( ! premium )
        require("./specs/" + sn)
      else
        require("./premium/specs/" + sn)
      this.incorporateMods(sn)
    }
    return this.attributes
  }

  incorporateExtension(specname) {
    let m = Foreman.nameToMold('Extension'); if ( ! m ) return
    let exts = m.fastRetrieve({specname: specname}); 
    if ( exts.length === 0 ) {
      global.gApp.showMessage("ERROR: Unknown Extension".translate() + ": " + specname)
      return
    }
    let ext = exts[0]
    try {
      if ( ! global.safeMode )
        eval(ext.blueprint)
    } catch(e) {
      global.gApp.showMessage("WARNING: Couldn't apply Extension due to error".translate() + ": " + e.message + ' (Spec: ' + ext.specname + ')')
    }
  }

  incorporateMods(specname) {
    let m = Foreman.nameToMold('Mod'); if ( ! m ) return
    let mods = m.fastRetrieve({builtInSpecname: specname.stripRight('.js')}); if ( mods.length === 0 ) return
    let mod = mods[0]
    try {
      if ( ! global.safeMode )
        eval(mod.blueprint)
    } catch(e) {
      global.gApp.showMessage("WARNING: Couldn't apply Modifications due to error".translate() + ": " + e.message + ' (Spec: ' + mod.builtInSpecname + ')')
    }
  }

  extensionToAttributes(aExtension) {
    this.initAttributes()
    if ( aExtension.status !== 'Valid' ) {
      this.attributes.componentName = 'List'
      this.attributes.name = aExtension.specname
      this.attributes.parseError = aExtension.errorMessage
      return this.attributes
    }
    gCurrentMachine = this
    global.stCurrentMachine = this
    global.currentSpecname = aExtension.specname
    try {
      if ( ! global.safeMode )
        eval(aExtension.blueprint)
    } catch(e) {
      "Error evaluating Extension source".m(aExtension.blueprint)
      console.log(e)
      this.attributes.parseError = e.message
    }
    return this.attributes
  }

  customSpecToAttributes(aCustomSpec) {
    this.initAttributes()
    if ( aCustomSpec.status !== 'Valid' ) {
      this.attributes.componentName = 'List'
      this.attributes.name = aCustomSpec.name
      this.attributes.parseError = aCustomSpec.errorMessage
      return this.attributes
    }
    gCurrentMachine = this
    global.stCurrentMachine = this
    global.currentSpecname = aCustomSpec.name
    try {
      if ( ! global.safeMode )
        eval(aCustomSpec.blueprint)
    } catch(e) {
      "Error evaluating Custom Spec source".m(aCustomSpec.blueprint)
      console.log(e)
      this.attributes.parseError = e.message
    }
    return this.attributes
  }

  specnameIsInIndex(aSpecname) {
    return (gSpecIndex.indexOf(aSpecname) >= 0)
  }

  async createMoldsAndMenus() {
    gCurrentMachine = this
    let resolve
    await global.foreman.populateNucleus()
    //'Mod.js'.spec()
    await 'Mod'.bring()
    //'Extension.js'.spec()
    await 'Extension'.bring()
    resolve = require.resolve("./specs/index.js")
    if ( resolve ) {
      if ( require.cache[resolve] )
        delete require.cache[resolve]
    }
    require("./specs/index.js") // results in multiple calls to spec() below
    this.creatingPremiumSpecs = true
    global.prfiPremiumProxy.createMoldsAndMenus()
    this.creatingPremiumSpecs = false
    this.processExtensionSpecs()
    Foreman.resolveChildMolds()
    let c = await 'Configuration'.bringOrCreate()
    if ( ! c.useClassicDataRetrieval() )
      await global.foreman.populatePlexus()
  }

  processExtensionSpecs() {
    let m = Foreman.nameToMold('Extension'); if ( ! m ) return
    let exts = m.fastRetrieve()
    for ( var i = 0; i < exts.length; i++ ) {
      let ext = exts[i]
      global.currentSpecname = ext.specname
      try {
        if ( ! global.safeMode )
          eval(ext.blueprint)
      } catch(e) {
        global.gApp.showMessage("WARNING: Couldn't apply Extension".translate() + 
          " " + ext.specname + " " +
          "due to error".translate() + ": " + e.message)
      }
    }
  }

  spec(aSpecname, options) {
    let sn = aSpecname
    let isExt = ! sn.endsWith('.js')
    let premium = this.creatingPremiumSpecs
    let resolve
    if ( ! isExt ) {
      if ( ! premium )
        resolve = require.resolve("./specs/" + sn)
      else
        resolve = require.resolve("./premium/specs/" + sn)
      if ( resolve ) {
        if ( require.cache[resolve] )
          delete require.cache[resolve]
      }
    }
    this.initAttributes()
    global.currentSpecname = sn
    this.specIsUI = false
    if ( isExt ) {
      this.incorporateExtension(sn)
    } else {
      if ( ! premium )
        require("./specs/" + sn)
      else
        require("./premium/specs/" + sn)
      this.incorporateMods(sn)
    }
    if ( gSpecIndex.indexOf(sn) < 0 ) {
      gSpecIndex.push(sn)
      gSpecIsPremium.push(premium)
      gSpecIsUI.push(this.specIsUI)
    }
  }

  initAttributes() {
    this.attributes = {fields: [], actions: [], manifests: [], joinedDatatypes: [], sections: [], typedControls: [], panels: []}
  }

  err(aMsg) {
    ("*****Spec Error: " + aMsg).m()    
    throw new Error(aMsg)
  }

  getOrCreateHolder(name) {
    let app = global.gApp
    if ( ! app.holders )
      app.holders = {}
    let res = app.holders[name]
    if ( res )
      return res
    res = {name: name}
    app.holders[name] = res
    return res
  }

  maint(aName, aParms) {
    this.specIsUI = true
    if ( global.currentSpecname.endsWith('.js') ) {
      if ( (aName + ".js") !== global.currentSpecname ) this.err("maint name must match file name")
    } else {
      if ( aName !== global.currentSpecname ) this.err('Name in code doesn\'t match - is "' + aName + '" - should be "' + global.currentSpecname + '"')
    }
    if ( this.attributes._identified && (this.attributes.name === aName) ) {
      this.checkNoOtherParms(aParms, "maint")
      this.attributes.typedControls = []
      return
    }
    let expose = this.useParm(aParms, "expose")
    let suppressOnMoreMenu = this.useParm(aParms, "suppressOnMoreMenu")
    let readOnly = this.useParm(aParms, "readOnly")
    let panelStyle = this.useParm(aParms, "panelStyle")
    let icon = this.useParm(aParms, "icon")
    let includeManifestSearch = this.useParm(aParms, "includeManifestSearch")
    this.checkNoOtherParms(aParms, "maint")
    this.initAttributes()
    let a = this.attributes
    a._identified = true
    a.componentName = 'Maint'
    a.name = aName
    a.readOnly = readOnly
    a.panelStyle = panelStyle
    a.icon = icon
    a.includeManifestSearch = includeManifestSearch
    if ( global.gCreatingMoldsAndMenus && expose ) 
      Menu.add({specname: global.currentSpecname, caption: aName, suppressOnMoreMenu: suppressOnMoreMenu})
  }

  output(aName, aParms) {
    if ( global.currentSpecname.endsWith('.js') ) {
      if ( (aName + ".js") !== global.currentSpecname ) this.err("output name must match file name")
    } else {
      if ( aName !== global.currentSpecname ) this.err('Name in code doesn\'t match - is "' + aName + '" - should be "' + global.currentSpecname + '"')
    }
    if ( this.attributes._identified && (this.attributes.name === aName) ) {
"this.attributes".m(this.attributes)
      this.checkNoOtherParms(aParms, "output")
      this.attributes.typedControls = []
      return
    }
    let rowsPerPage = this.useParm(aParms, "rowsPerPage")
    let topMargin = this.useParm(aParms, "topMargin")
    let leftMargin = this.useParm(aParms, "leftMargin")
    let rightMargin = this.useParm(aParms, "rightMargin")
    let pageHeadingBottomMargin = this.useParm(aParms, "pageHeadingBottomMargin")
    let type = this.useParm(aParms, "type")
    let version = this.useParm(aParms, "version")
    let fontSize = this.useParm(aParms, "fontSize")
    let repeat = this.useParm(aParms, "repeat")
    let linesBetweenRows = this.useParm(aParms, "linesBetweenRows")
    this.checkNoOtherParms(aParms, "output")
    this.initAttributes()
    let a = this.attributes
    a._identified = true
    a.componentName = 'Output'
    a.name = aName
    a.rowsPerPage = rowsPerPage
    a.topMargin = topMargin
    a.leftMargin = leftMargin
    a.rightMargin = rightMargin
    a.pageHeadingBottomMargin = pageHeadingBottomMargin
    a.type = type
    a.version = version
    a.fontSize = fontSize
    a.repeat = repeat
    a.linesBetweenRows = linesBetweenRows
    //this.updateHolder()
  }

  page(aName, aParms) {
    this.specIsUI = true
    if ( global.currentSpecname.endsWith('.js') ) {
      if ( (aName + ".js") !== global.currentSpecname ) this.err("page name must match file name")
    } else {
      if ( aName !== global.currentSpecname ) this.err('Name in code doesn\'t match - is "' + aName + '" - should be "' + global.currentSpecname + '"')
    }
    let expose = this.useParm(aParms, "expose")
    let suppressOnMoreMenu = this.useParm(aParms, "suppressOnMoreMenu")
    let noTitle = this.useParm(aParms, "noTitle")
    let readOnly = this.useParm(aParms, "readOnly")
    this.checkNoOtherParms(aParms, "page")
    this.initAttributes()
    let a = this.attributes
    a.componentName = 'Page'
    a.name = aName
    a.noTitle = noTitle
    a.readOnly = readOnly
    if ( global.gCreatingMoldsAndMenus && expose ) 
      Menu.add({specname: global.currentSpecname, caption: aName, suppressOnMoreMenu: suppressOnMoreMenu})
    aName.datatype({transient: true})
    //this.updateHolder()
  }

  list(aName, aParms) {
    this.specIsUI = true
    if ( global.currentSpecname.endsWith('.js') ) {
      if ( (aName + ".js") !== global.currentSpecname ) {
        this.err("list name must match file name")
      }
    } else {
      if ( aName !== global.currentSpecname ) this.err('Name in code doesn\'t match - is "' + aName + '" - should be "' + global.currentSpecname + '"')
    }
    let expose = this.useParm(aParms, "expose")
    let beforeSpec = this.useParm(aParms, "beforeSpec")
    let suppressOnMoreMenu = this.useParm(aParms, "suppressOnMoreMenu")
    let withHeader = this.useParm(aParms, "withHeader")
    let icon = this.useParm(aParms, "icon")
    this.checkNoOtherParms(aParms, "list")
    this.initAttributes()
    let a = this.attributes
    a.componentName = 'List'
    a.name = aName
    a.withHeader = withHeader
    a.icon = icon
    if ( global.gCreatingMoldsAndMenus && expose ) 
      Menu.add({specname: global.currentSpecname, caption: aName, suppressOnMoreMenu: suppressOnMoreMenu, beforeSpec: beforeSpec})
    if ( withHeader )
      aName.datatype({transient: true})
    //this.updateHolder()
  }

  registerMold(aName, aSource) {
    let parts = aName.split('.')
    let name = parts[0]
    let m = Foreman.nameToMold(name, {allowCreate: true})
    if ( aSource )
      m.source = aSource
    this.mostRecentMold = m
    return m
  }

  setMostRecentMoldKey(aName) {
    this.mostRecentMold.key = aName
  }

  key(aField) {
    let name = aField.name
    this.setMostRecentMoldKey(name)
    let f = aField
    this.attributes.key = name
    f.isKey = true
  }

  essence(aField) {
    let name = aField.name
    this.mostRecentMold.essence = name
    let f = aField
    this.attributes.essence = name
    f.isEssence = true
  }

  nameToPanel(aName) {
    let panels = this.attributes.panels; if ( ! panels ) return null
    return panels.filterSingle(p => (p.name === aName) || (p.name === aName.translate()))
  }

  nameToField(aName) {
    let obj = this.getMostRecentTypedControl()
    let res = this.doNameToField(aName, obj)
    if ( res )
      return res
    return this.doNameToField(aName, this)
  }

  doNameToField(aName, aObj) {
    let fields = aObj.attributes.fields
    for ( var i = 0; i < fields.length; i++ ) {
      let f = fields[i]
      if ( f.name === aName ) return f
      if ( f.caption === aName ) return f
    }
  }

  allowTrash(aDatatype, aFn) {
    let m = Foreman.nameToMold(aDatatype); if ( ! m ) this.err("allowTrash: unknown datatype: " + aDatatype)
    //if ( (! global.runningInsideWordpress) && (! global.isAsync(aFn)) ) this.err("allowTrash function must be async")
    m.allowTrash = aFn
  }

  afterCreating(aDatatype, aFn) {
    let m = Foreman.nameToMold(aDatatype); if ( ! m ) this.err("afterCreating: unknown datatype: " + aDatatype)
    //if ( (! global.runningInsideWordpress) && (! global.isAsync(aFn)) ) this.err("afterCreating function must be async")
    m.afterCreating = aFn
  }

  beforeInception(aDatatype, aFn) {
    let m = Foreman.nameToMold(aDatatype); if ( ! m ) this.err("beforeInception: unknown datatype: " + aDatatype)
    m.beforeInception = aFn
  }

  afterRetrievingFast(aDatatype, aFn) {
    let m = Foreman.nameToMold(aDatatype); if ( ! m ) this.err("afterRetrievingFast: unknown datatype: " + aDatatype)
    m.afterRetrievingFast = aFn
  }

  afterRetrieving(aDatatype, aFn) {
    let m = Foreman.nameToMold(aDatatype); if ( ! m ) this.err("afterRetrieving: unknown datatype: " + aDatatype)
    //if ( (! global.runningInsideWordpress) && (! global.isAsync(aFn)) ) this.err("afterRetrieving function must be async")
    m.afterRetrieving = aFn
  }

  beforeSaving(aDatatype, aFn) {
    let m = Foreman.nameToMold(aDatatype); if ( ! m ) this.err("beforeSaving: unknown datatype: " + aDatatype)
    //if ( (! global.runningInsideWordpress) && (! global.isAsync(aFn)) ) this.err("beforeSaving function must be async")
    m.beforeSaving = aFn
  }

  beforeImporting(aDatatype, aFn) {
    let m = Foreman.nameToMold(aDatatype); if ( ! m ) this.err("beforeImporting: unknown datatype: " + aDatatype)
    m.beforeImporting = aFn
  }

  beforeFirstSave(aDatatype, aFn) {
    let m = Foreman.nameToMold(aDatatype); if ( ! m ) this.err("beforeFirstSave: unknown datatype: " + aDatatype)
    m.beforeFirstSave = aFn
  }

  afterLastSave(aDatatype, aFn) {
    let m = Foreman.nameToMold(aDatatype); if ( ! m ) this.err("afterLastSave: unknown datatype: " + aDatatype)
    m.afterLastSave = aFn
  }

  afterAnyUserChange(aDatatype, aFn) {
    let m = Foreman.nameToMold(aDatatype); if ( ! m ) this.err("afterAnyUserChange: unknown datatype: " + aDatatype)
    m.afterAnyUserChange = aFn
  }

  beforeValidating(aDatatype, aFn) {
    let m = Foreman.nameToMold(aDatatype); if ( ! m ) this.err("beforeValidating: unknown datatype: " + aDatatype)
    m.beforeValidating = aFn
  }

  validate(aDatatype, aFn) {
    let m = Foreman.nameToMold(aDatatype); if ( ! m ) this.err("validate: unknown datatype: " + aDatatype)
    m.validate = aFn
  }

  afterSaving(aDatatype, aFn) {
    let m = Foreman.nameToMold(aDatatype); if ( ! m ) this.err("afterSaving: unknown datatype: " + aDatatype)
    //if ( (! global.runningInsideWordpress) && (! global.isAsync(aFn)) ) this.err("afterSaving function must be async")
    m.afterSaving = aFn
  }

  addExtraField(aDatatype, aParms) {
    let m = Foreman.nameToMold(aDatatype); if ( ! m ) this.err("addExtraField: unknown datatype: " + aDatatype)
    m.addExtraField(aParms)
  }

  method(aDatatype, aName, aFn) {
    let m = Foreman.nameToMold(aDatatype); 
    if ( ! m ) {
      let obj = this.getMostRecentTypedControl()
      let a = obj.attributes
      if ( (a.componentName !== 'List') && (a.componentName !== 'Maint') ) this.err("method target must be a datatype, list or maint")
      if ( a.name !== aDatatype ) this.err("method target must be the list or maint name")
      if ( ! a.methods )
        a.methods = {}
      a.methods[aName] = aFn
      return
    }
    m.addMethod(aName, aFn)
  }

  enhance(aDatatype, aName, aFn) {
    // Note: currently only supports methods using traditional function() syntax, with no arguments (only "this")
    let self = this

    let enhanceFunction = function(obj, aNameOrIndex, aFn) {
      let originalFunction = obj[aNameOrIndex] 
      if ( ! originalFunction ) 
        self.err('enhance called on non-existent function ' + aName)

      let newFunction = async function(arg1, arg2, arg3, arg4, arg5) {
        //let fn = aFn.bind(this)
        //await fn(originalFunction.bind(this))
        await aFn.call(this, originalFunction.bind(this), arg1, arg2, arg3, arg4, arg5)
      }

      obj[aNameOrIndex] = newFunction
    }

    let m = Foreman.nameToMold(aDatatype); 
    if ( ! m ) {
      let obj = this.getMostRecentTypedControl()
      let a = obj.attributes
      if ( (a.componentName !== 'List') && (a.componentName !== 'Maint') ) this.err("enhance target must be a datatype, list or maint")
      if ( a.name !== aDatatype ) this.err("enhance target must be the list or maint name")
      if ( ! a.methods )
        a.methods = {}
      if ( a.methods[aName] )
        enhanceFunction(a.methods, aName, aFn)
      else
        enhanceFunction(obj, aName, aFn)
      return
    }
    let idx = m.methodNames.indexOf(aName)
    if ( idx >= 0 ) {
      enhanceFunction(m.methods, idx, aFn)
    } else {
      enhanceFunction(m, aName, aFn)
    }
  }

  cruxFields(aDatatype, aFieldNames) {
    let m = Foreman.nameToMold(aDatatype); if ( ! m ) this.err("cruxFields: unknown datatype: " + aDatatype)
    m.setCruxFields(aFieldNames)
  }

  facade(aDatatype, aData) {
    let m = Foreman.nameToMold(aDatatype); if ( ! m ) this.err("facade: unknown datatype: " + aDatatype)
    m.facade = aData
  }

  data(aDatatype, aData) {
    let m = Foreman.nameToMold(aDatatype); if ( ! m ) this.err("data: unknown datatype: " + aDatatype)
    m.staticData = aData
  }

  columnVisibleWhen(aName, aVal, opt) {
    let prop = 'columnVisibleWhen'
    if ( opt && opt.internal )
      prop = 'columnVisibleWhenInternal'
    let f = this.nameToField(aName); if ( ! f ) this.err("columnVisibleWhen: unknown field: " + aName)
    f[prop] = aVal
  }

  readOnlyWhen(aName, aVal) {
    let f = this.nameToField(aName); if ( ! f ) this.err("readOnlyWhen: unknown field: " + aName)
    f.readOnlyWhen = aVal
  }

  visibleWhen(aName, aVal, opt) {
    let prop = 'visibleWhen'
    if ( opt && opt.internal )
      prop = 'visibleWhenInternal'
    let manifest = this.nameToManifest(aName)
    if ( manifest ) {
      manifest[prop] = aVal
      return
    }
    let p = this.nameToPanel(aName)
    if ( p ) {
      p[prop] = aVal
      return
    }
    let f = this.nameToField(aName)
    if ( f )
      f[prop] = aVal
    else {
      if ( global.gCreatingMoldsAndMenus ) return
      let a = this.nameToAction(aName)
      if ( a ) {
        a[prop] = aVal
        return
      }
      if ( ! a )
        this.err("visibleWhen: unknown field/action/panel: " + aName)
    }
  }

  visibleWhenInternal(aName, aVal) {
    return this.visibleWhen(aName, aVal, {internal: true})
  }

  columnVisibleWhenInternal(aName, aVal) {
    return this.columnVisibleWhen(aName, aVal, {internal: true})
  }

  accept(aFieldName, aVal) {
    let f = this.nameToField(aFieldName); if ( ! f ) this.err("accept: unknown field: " + aFieldName)
    f.accept = aVal
  }

  guidance(aFieldName, aVal) {
    let f = this.nameToField(aFieldName); if ( ! f ) this.err("guidance: unknown field: " + aFieldName)
    f.guidance = aVal
  }

  afterChoosingFile(aFieldName, aVal) {
    let f = this.nameToField(aFieldName); if ( ! f ) this.err("afterChoosingFile: unknown field: " + aFieldName)
    f.afterChoosingFile = aVal
  }

  afterSearchChange(aName, aFn) {
    let obj = this.getMostRecentTypedControl()
    let a = obj.attributes
    if ( (a.componentName !== 'List') && (a.componentName !== 'Manifest') ) this.err("afterSearchChange target must be a list or a manifest")
    if ( a.name !== aName ) this.err("afterSearchChange target must be the list or manifest name")
    a.afterSearchChange = aFn
  }

  afterUserChange(aFieldName, aVal) {
    let f = this.nameToField(aFieldName); if ( ! f ) this.err("afterUserChange: unknown field: " + aFieldName)
    f.afterUserChange = aVal
  }

  modifyInputRenderValue(aFieldName, aVal) {
    let f = this.nameToField(aFieldName); if ( ! f ) this.err("modifyInputRenderValue: unknown field: " + aFieldName)
    //if ( (! global.runningInsideWordpress) && global.isAsync(aVal) ) this.err("modifyInputRenderValue function must not be async")
    f.modifyInputRenderValue = aVal
  }

  modifyRenderValue(aFieldName, aVal) {
    let f = this.nameToField(aFieldName); if ( ! f ) this.err("modifyRenderValue: unknown field: " + aFieldName)
    f.modifyRenderValue = aVal
  }

  destination(aFieldName, aVal) {
    let f = this.nameToField(aFieldName); if ( ! f ) this.err("destination: unknown field: " + aFieldName)
    f.destinationFunction = aVal
  }

  calculateWhen(aFieldName, aVal) {
    let f = this.nameToField(aFieldName); if ( ! f ) this.err("calculateWhen: unknown field: " + aFieldName)
    f.calculateWhen = aVal
  }

  labelMmUnit(aFieldName, aVal) {
    let f = this.nameToField(aFieldName); if ( ! f ) this.err("labelMmUnit: unknown field: " + aFieldName)
    let mm = f.name
    let inches = aVal.inchField

    mm.calculateWhen(async () => {
      return ! global.enterMmForLabels()
    })
    
    mm.calculate(async cast => {
      let res = global.inchesToMm(cast[inches])
      return res
    })
    
    mm.visibleWhenInternal((maint, cast) => {
      if ( ! global.enterMmForLabels() ) return false
      return true
    })

    mm.columnVisibleWhenInternal((maint, cast) => {
      if ( ! global.enterMmForLabels() ) return false
      return true
    })
    
    inches.calculateWhen(async () => {
      return ! global.enterInchesForLabels()
    })
    
    inches.calculate(async cast => {
      let res = global.mmToInches(cast[mm])
      return res
    })
    
    inches.visibleWhenInternal((maint, facet) => {
      if ( ! global.enterInchesForLabels() ) return false
      return true
    })

    inches.columnVisibleWhenInternal((maint, facet) => {
      if ( ! global.enterInchesForLabels() ) return false
      return true
    })
  }

  calculate(aFieldName, aVal) {
    let isMulti
    let f = this.nameToField(aFieldName); 
    if ( ! f ) {
      f = this.nameToField(aFieldName + '01')
      if ( ! f ) 
        this.err("calculate: unknown field: " + aFieldName)
      isMulti = true
    }
    f.calculate = aVal
    if ( isMulti ) {
      let mfs = f.multiFields
      for ( var i = 0; i < mfs.length; i++ ) {
        let mf = mfs[i]
        mf.calculate = aVal
        mf.multiNo = i + 1
      }
    } 
    let m = f.toMold()
    if ( m )
      m.hasCalculatedFields = true
  }

  sortDropdown(aFieldName, aVal) {
    let f = this.nameToField(aFieldName); 
    f.sortDropdown = aVal
  }

  dropdownValue(aFieldName, aVal) {
    let f = this.nameToField(aFieldName); 
    f.dropdownValue = aVal
  }

  calculateTotal(aFieldName, aVal) {
    let f = this.nameToField(aFieldName); if ( ! f ) this.err("calculateTotal: unknown field: " + aFieldName)
    f.calculateTotalFunction = aVal
  }

  dynamicCaption(aName, aVal) {
    let f = this.nameToField(aName)
    if ( ! f ) {
      if ( global.gCreatingMoldsAndMenus ) return
      let a = this.nameToAction(aName)
      if ( ! a ) this.err("dynamicCaption: unknown field or action: " + aName)
      a.dynamicCaption = aVal
      return
    }
    f.dynamicCaption = aVal
  }

  dynamicWidth(aName, aVal) {
    let f = this.nameToField(aName)
    if ( ! f ) {
      this.err("dynamicWidth: unknown field: " + aName)
      return
    }
    f.dynamicWidth = aVal
  }

  dynamicOptions(aFieldName, aVal) {
    let f = this.nameToField(aFieldName); if ( ! f ) this.err("dynamicOptions: unknown field: " + aFieldName)
    f.dynamicOptions = aVal
  }

  options(aFieldName, aVal) {
    let f = this.nameToField(aFieldName); if ( ! f ) this.err("options: unknown field: " + aFieldName)
    f.staticOptions = aVal
  }

  content(aFieldName, aVal) {
    let f = this.nameToField(aFieldName); if ( ! f ) this.err("content: unknown field: " + aFieldName)
    f.content = aVal
  }

  caption(aFieldName, aFn) {
    let f = this.nameToField(aFieldName); if ( ! f ) this.err("caption: unknown field: " + aFieldName)
    f.captionFunction = aFn
  }

  fontWeight(aFieldName, aFn) {
    let f = this.nameToField(aFieldName); if ( ! f ) this.err("fontWeight: unknown field: " + aFieldName)
    f.fontWeightFunction = aFn
  }

  color(aFieldName, aFn) {
    let f = this.nameToField(aFieldName); if ( ! f ) this.err("color: unknown field: " + aFieldName)
    f.colorFunction = aFn
  }

  default(aFieldName, aVal) {
    let f = this.nameToField(aFieldName); if ( ! f ) this.err("default: unknown field: " + aFieldName)
    f.default = aVal
  }

  fallback(aFieldName, aVal) {
    let f = this.nameToField(aFieldName); if ( ! f ) this.err("fallback: unknown field: " + aFieldName)
    f.fallback = aVal
  }

  inception(aFieldName, aVal) {
    let f = this.nameToField(aFieldName); if ( ! f ) this.err("inception: unknown field: " + aFieldName)
    f.inception = aVal
  }

  refersTo(aField, aDatatype) {
    aField.refersTo = {datatype: aDatatype}
  }

  refersToParent(aField, aDatatype) {
    aField.refersTo = {datatype: aDatatype, refereeIsParent: true}
  }

  readOnly(aName, aFn) {
    let a = this.attributes
    if ( a.componentName !== 'Maint' ) this.err("readOnly target must be a maint")
    if ( a.name !== aName ) this.err("readOnly target must be the maint name")
    this.attributes.readOnlyHook = aFn
  }

  createJoinWhen(aName, aFn) {
    let a = this.attributes
    if ( a.componentName !== 'List' ) this.err("createJoinWhen target must be a list")
    if ( a.name !== aName ) this.err("createJoinWhen target must be the list name")
    this.attributes.createJoinWhen = aFn
  }

  modifyRowMoldFields(aName, aFn) {
    let a = this.attributes
    if ( a.componentName !== 'Output' ) this.err("modifyRowMoldFields target must be an output")
    if ( a.name !== aName ) this.err("modifyRowMoldFields target must be the output name")
    this.attributes.modifyRowMoldFields = aFn
  }

  modifyMoldFields(aName, aFn) {
    let a = this.attributes
    if ( (a.componentName !== 'List') && (a.componentName !== 'Output') ) this.err("modifyMoldFields target must be a list or an output")
    if ( a.name !== aName ) this.err("modifyMoldFields target must be the list or output name")
    this.attributes.modifyMoldFields = aFn
  }

  modifyRowFields(aName, aFn) {
    let a = this.attributes
    if ( a.componentName !== 'Output' ) this.err("modifyRowFields target must be an output")
    if ( a.name !== aName ) this.err("modifyRowFields target must be the output name")
    this.attributes.modifyRowFields = aFn
  }

  modifyFields(aName, aFn) {
    let a = this.attributes
    let m
    if ( (a.componentName !== 'List') && (a.componentName !== 'Output') && (a.componentName !== 'Maint') ) {
      m = Foreman.nameToMold(aName) 
      if ( ! m ) 
        this.err("modifyFields target must be a datatype, maint, list or output")
    }
    if ( m ) {
      m.modifyFields = aFn
      return
    }
    if ( a.name !== aName ) this.err("modifyFields target must be the maint, list or output name")
    this.attributes.modifyFields = aFn
  }

  makeDestinationFor(aName, aDatatype) {
    let a = this.attributes
    if ( a.componentName !== 'Maint' ) this.err("makeDestinationFor target must be a maint")
    if ( a.name !== aName ) this.err("makeDestinationFor target must be the maint name")
    let m = Foreman.nameToMold(aDatatype)
    if ( ! m ) this.err("makeDestinationFor datatype is invalid")
    m.destinationSpecname = a.name + ".js"
  }

  labelCount(aName, aFn) {
    let a = this.attributes
    if ( a.componentName !== 'Output' ) this.err("labelCount target must be an output")
    if ( a.name !== aName ) this.err("labelCount target must be the output name")
    this.attributes.labelCount = aFn
  }

  getCasts(aName, aFn) {
    let a = this.attributes
    if ( a.componentName !== 'Output' ) this.err("getCasts target must be an output")
    if ( a.name !== aName ) this.err("getCasts target must be the output name")
    this.attributes.getCastsFunction = aFn
  }

  substituteCast(aName, aFn) {
    let a = this.attributes
    if ( (a.componentName !== 'Maint') && (a.componentName !== 'Output') ) this.err("substituteCast target must be a maint or an output")
    if ( a.name !== aName ) this.err("substituteCast target must be the maint or output name")
    this.attributes.substituteCastFunction = aFn
  }

  alternativeSpec(aName, aFn) {
    let a = this.attributes
    if ( a.name !== aName ) this.err("warning target must be the name")
    this.attributes.alternativeSpec = aFn
  }

  warning(aName, aFn) {
    let a = this.attributes
    if ( a.componentName !== 'Maint' ) this.err("warning target must be a maint")
    if ( a.name !== aName ) this.err("warning target must be the maint name")
    this.attributes.warningFunction = aFn
  }

  whenAdding(aName, aFn) {
    let a = this.attributes
    if ( a.componentName !== 'Maint' ) this.err("whenAdding target must be a maint")
    if ( a.name !== aName ) this.err("whenAdding target must be the maint name")
    this.attributes.whenAdding = aFn
  }

  onScannerRead(aName, aFn) {
    let a = this.attributes
    if ( a.componentName !== 'Maint' ) 
      this.err("onScannerRead target must be a maint")
    if ( a.name !== aName ) this.err("onScannerRead target must be the maint name")
    this.attributes.onScannerRead = aFn
  }

  afterInitialising(aName, aFn) {
    let a = this.attributes
    if ( a.componentName !== 'Maint' ) 
      this.err("afterInitialising target must be a maint")
    if ( a.name !== aName ) this.err("afterInitialising target must be the maint name")
    this.attributes.afterInitialising = aFn
  }

  afterCreatingCast(aName, aFn) {
    let a = this.attributes
    if ( a.componentName !== 'Maint' ) 
      this.err("afterCreatingCast target must be a maint")
    if ( a.name !== aName ) this.err("afterCreatingCast target must be the maint name")
    this.attributes.afterCreatingCast = aFn
  }

  onOK(aName, aFn) {
    let a = this.attributes
    if ( a.componentName !== 'Maint' ) 
      this.err("onOK target must be a maint")
    if ( a.name !== aName ) this.err("onOK target must be the maint name")
    this.attributes.onOK = aFn
  }

  onSave(aName, aFn) {
    let a = this.attributes
    if ( a.componentName !== 'Maint' ) 
      this.err("onSave target must be a maint")
    if ( a.name !== aName ) this.err("onSave target must be the maint name")
    this.attributes.onSave = aFn
  }

  beforeLoading(aName, aFn) {
    let a = this.attributes
    if ( (a.componentName !== 'Maint') && (a.componentName !== 'List') && (a.componentName !== 'Page') && (a.componentName !== 'Graph') ) 
      this.err("beforeLoading target must be a maint, list, graph or page")
    if ( a.name !== aName ) this.err("beforeLoading target must be the maint, list or page name")
    this.attributes.beforeLoading = aFn
  }

  afterLoading(aName, aFn) {
    let a = this.attributes
    if ( a.componentName !== 'List' ) 
      this.err("afterLoading target must be a list")
    if ( a.name !== aName ) this.err("afterLoading target must be the list name")
    this.attributes.afterLoading = aFn
  }

  beforeTrash(aName, aFn) {
    let a = this.attributes
    if ( a.componentName !== 'List' ) 
      this.err("beforeTrash target must be a list")
    if ( a.name !== aName ) this.err("beforeTrash target must be the list")
    this.attributes.beforeTrash = aFn
  }

  afterTrash(aName, aFn) {
    let a = this.attributes
    let m
    if ( a.componentName !== 'List' ) {
      m = Foreman.nameToMold(aName) 
      if ( ! m ) 
        this.err("afterTrash target must be a datatype or list")
    }
    if ( m ) {
      m.afterTrash = aFn
      return
    }
    if ( a.name !== aName ) this.err("afterTrash target must be the list")
    this.attributes.afterTrash = aFn
  }


  dynamicTitle(aName, aFn) {
    let manifest = this.nameToManifest(aName)
    if ( manifest ) {
      manifest.attributes.dynamicTitle = aFn
      return
    }
    let p = this.nameToPanel(aName)
    if ( p ) {
      p.attributes.dynamicTitle = aFn
      return
    }
    let a = this.attributes
    if ( a.name !== aName ) this.err("dynamicTitle target must be the maint or list name")
    //if ( (! global.runningInsideWordpress) && global.isAsync(aFn) ) this.err("dynamicTitle function cannot be async")
    this.attributes.dynamicTitle = aFn
  }

  render(aName, aFn) {
    let a = this.attributes
    if ( a.componentName !== 'Output' ) this.err("render target must be an output")
    if ( a.name !== aName ) this.err("render target must be the output name")
    //if ( (! global.runningInsideWordpress) && (! global.isAsync(aFn)) ) this.err("render function must be async")
    this.attributes.renderFunction = aFn
  }

  backgroundImageUrl(aName, aFn) {
    let a = this.attributes
    if ( a.componentName !== 'Output' ) this.err("backgroundImageUrl target must be an output")
    if ( a.name !== aName ) this.err("backgroundImageUrl target must be the output name")
    this.attributes.backgroundImageUrlFunction = aFn
  }

  criteria(aName, aFn) {
    let obj = this.getMostRecentTypedControl()
    let a = obj.attributes
    if ( (a.componentName !== 'List') && (a.componentName !== 'Manifest') ) this.err("criteria target must be a list or a manifest")
    if ( a.name !== aName ) this.err("criteria target must be the list or manifest name")
    //if ( (! global.runningInsideWordpress) && (! global.isAsync(aFn)) ) this.err("criteria function must be async")
    a.criteria = aFn
  }

  afterFieldCalculations(aName, aFn) {
    let obj = this.getMostRecentTypedControl()
    let a = obj.attributes
    if ( (a.componentName !== 'List') && (a.componentName !== 'Manifest') ) this.err("afterFieldCalculations target must be a list or a manifest")
    if ( a.name !== aName ) this.err("afterFieldCalculations target must be the list or manifest name")
    a.afterFieldCalculations = aFn
  }

  filter(aName, aFn) {
    let obj = this.getMostRecentTypedControl()
    let a = obj.attributes
    if ( (a.componentName !== 'List') && (a.componentName !== 'Manifest') && (a.componentName !== 'Graph') ) 
      this.err("filter target must be a list, manifest or graph")
    if ( a.name !== aName ) this.err("filter target must be the list, manifest or graph name")
    a.filter = aFn
  }

  shouldIncludeCastInDownload(aName, aFn) {
    let obj = this.getMostRecentTypedControl()
    let a = obj.attributes
    if ( (a.componentName !== 'List') && (a.componentName !== 'Manifest') && (a.componentName !== 'Graph') ) 
      this.err("shouldIncludeCastInDownload target must be a list, manifest or graph")
    if ( a.name !== aName ) this.err("shouldIncludeCastInDownload target must be the list, manifest or graph name")
    a.shouldIncludeCastInDownload = aFn
  }

  limitToSubset(aName, aFn) {
    let obj = this.getMostRecentTypedControl()
    let a = obj.attributes
    if ( (a.componentName !== 'List') && (a.componentName !== 'Manifest') && (a.componentName !== 'Graph') ) 
      this.err("limitToSubset target must be a list, manifest or graph")
    if ( a.name !== aName ) this.err("limitToSubset target must be the list, manifest or graph name")
    a.limitToSubsetName = aFn
  }

  defaultSort(aName, aFn) {
    let obj = this.getMostRecentTypedControl()
    let a = obj.attributes
    if ( (a.componentName !== 'List') && (a.componentName !== 'Manifest') ) this.err("defaultSort target must be a list or a manifest")
    if ( a.name !== aName ) this.err("defaultSort target must be the list or manifest name")
    a.defaultSort = aFn
  }

  before(aName, aFn) {
    if ( global.gCreatingMoldsAndMenus ) return
    let a = this.nameToAction(aName); if ( ! a ) this.err("before: unknown action: " + aName)
    //if ( (! global.runningInsideWordpress) && global.isAsync(aFn) ) this.err("availableWhen: function must not be async")
    a.before = aFn
  }

  availableWhen(aName, aFn) {
    if ( global.gCreatingMoldsAndMenus ) return
    let a = this.nameToAction(aName); if ( ! a ) this.err("availableWhen: unknown action: " + aName)
    //if ( (! global.runningInsideWordpress) && global.isAsync(aFn) ) this.err("availableWhen: function must not be async")
    a.availableWhen = aFn
  }

  act(aName, aFn) {
    if ( global.gCreatingMoldsAndMenus ) return
    let a = this.nameToAction(aName); if ( ! a ) this.err("act: unknown action: " + aName)
    //if ( (! global.runningInsideWordpress) && (! global.isAsync(aFn)) ) this.err("act: function must be async")
    a.tagOrFunction = aFn
  }

  nameToAction(aName) {
    let obj = this.getMostRecentTypedControl()
    let res = this.doNameToAction(aName, obj)
    if ( res )
      return res
    return this.doNameToAction(aName, this)
  }

  doNameToAction(aName, aObj) {
    if ( ! aName ) return null;
    let res =  aObj.attributes.actions.filterSingle(a => (a.name === aName) || (a.caption === aName))
    if ( ! res ) {
      let name = aName.translate()
      res =  aObj.attributes.actions.filterSingle(a => (a.name === name) || (a.caption === name))
    }
    return res
  }

  excludeChoiceWhen(aFieldName, aFn) {
    let f = this.nameToField(aFieldName); if ( ! f ) this.err("excludeChoiceWhen: unknown field: " + aFieldName)
    f.excludeChoiceWhen = aFn
  }

  createMultiFields(aName, knt, aParms) {
    let baseField
    for ( var i = 1; i <= knt; i++ ) {
      let name = aName + global.padWithZeroes(i, 2)
      let parms = global.copyObj(aParms)
      let f = this.field(name, parms)
      if ( ! baseField ) {
        baseField = f
        f.multiFields = []
      }
      f.multiBaseField = baseField
      baseField.multiFields.push(f)
    }
  }

  field(aName, aParms) {
    let multi = this.useParm(aParms, "multi")
    if ( multi ) {
      this.createMultiFields(aName, multi, aParms)
      return
    }
    let ret = {}
    let f = this.mostRecentMold.addField(aName, ret)
    f.deferCalc = true
    let obj = this.getMostRecentTypedControl()
    f.obj = obj
    let a = obj.attributes
    let weAreInDatatypeOnlySpec = (! a.componentName)
    let weAreInUISpec = ! weAreInDatatypeOnlySpec
    let doingMoldsOnly = global.gCreatingMoldsAndMenus
    let doingEverything = ! doingMoldsOnly
    let isClone
    let fields = a.fields
    let existingField = fields.filterSingle(field => field.name === f.name)
    if ( existingField )
      f = existingField
    else {
      if ( (! weAreInDatatypeOnlySpec) && doingEverything ) {
        f = f.clone()
        isClone = true
      }
      fields.push(f)
      let panel = this.attributes.latestPanel
      if ( ! panel )
        panel = this.attributes.panels.last()
      if ( (obj === this) && panel ) {
        panel.attributes.fields.push(f)
        f.panel = panel
      }
    }
    if ( isClone ) {
      f.readOnly = ! ["Maint", "List", "Graph"].contains(a.componentName)
      if ( a.readOnly === false )
        f.readOnly = false
    }
    let inUIButDoingMolds = weAreInUISpec && doingMoldsOnly
    let captionSet = aParms ? aParms.caption : false
    if ( inUIButDoingMolds && f._captionSet )
      captionSet = false
    if ( aParms && aParms.decimals ) {
      if ( (! f.numeric) && (! aParms.numeric) ) {
        throw(new Error('Field ' + f.name + ': cannot specify decimals as numeric has not been specified'))
      }
    }
    this.useParm(aParms, "key", f, this.key)
    this.useParm(aParms, "nonUnique", f)
    this.useParm(aParms, "refersTo", f, this.refersTo)
    this.useParm(aParms, "refersToParent", f, this.refersToParent)
    this.useParm(aParms, "parentIsHeader", f)
    this.useParm(aParms, "readOnly", f, null, {ignore: inUIButDoingMolds})
    this.useParm(aParms, "allowInput", f)
    this.useParm(aParms, "numeric", f)
    this.useParm(aParms, "storedCalc", f)
    this.useParm(aParms, "date", f)
    this.useParm(aParms, "yesOrNo", f)
    this.useParm(aParms, "tickbox", f, null, {ignore: inUIButDoingMolds})
    this.useParm(aParms, "hidden", f, null, {ignore: inUIButDoingMolds})
    this.useParm(aParms, "useForTotalCaption", f, null, {ignore: inUIButDoingMolds})
    this.useParm(aParms, "caption", f, null, {ignore: (inUIButDoingMolds && f._captionSet)})
    this.useParm(aParms, "decimals", f, null, {ignore: f.decimals && inUIButDoingMolds})
    this.useParm(aParms, "minDecimals", f)
    this.useParm(aParms, "maxDecimals", f)
    this.useParm(aParms, "snippet", f)
    this.useParm(aParms, "allowEmpty", f)
    this.useParm(aParms, "width", f)
    this.useParm(aParms, "height", f)
    this.useParm(aParms, "left", f)
    this.useParm(aParms, "suppressRefreshOptions", f)
    this.useParm(aParms, "adminOnly", f)
    this.useParm(aParms, "deferCalc", f)
    this.useParm(aParms, "rightAlign", f)
    this.useParm(aParms, "centerAlign", f)
    this.useParm(aParms, "fontSize", f)
    this.useParm(aParms, "translateOnDisplay", f)
    this.useParm(aParms, "secret", f)
    this.useParm(aParms, "ephemeral", f)
    this.useParm(aParms, "showTotal", f, null, {ignore: inUIButDoingMolds})
    this.useParm(aParms, "multiLine", f)
    this.useParm(aParms, "jsEditor", f)
    this.useParm(aParms, "file", f)
    this.useParm(aParms, "sortUnknownsLast", f)
    this.useParm(aParms, "showAsLink", f, null, {ignore: inUIButDoingMolds})
    this.useParm(aParms, "hideWhenBlank", f, null, {ignore: inUIButDoingMolds})
    this.useParm(aParms, "beforeField", f, null, {ignore: inUIButDoingMolds})
    this.useParm(aParms, "afterField", f, null, {ignore: inUIButDoingMolds})
    this.useParm(aParms, "wcMeta", f)
    this.useParm(aParms, "wcAttribute", f)
    this.useParm(aParms, "position", f)
    this.useParm(aParms, "lineAbove", f)
    this.useParm(aParms, "lineBelow", f)
    this.useParm(aParms, "fontStyle", f)
    this.useParm(aParms, "image", f)
    this.useParm(aParms, "postImage", f)
    this.useParm(aParms, "postImageType", f)
    this.useParm(aParms, "postIdField", f)
    this.useParm(aParms, "allowAny", f)
    this.useParm(aParms, "indexed", f)
    this.useParm(aParms, "html", f)
    this.useParm(aParms, "essence", f, this.essence)
    this.useParm(aParms, "showPlusSign", f, null, {ignore: inUIButDoingMolds})
    this.useParm(aParms, "icon", f)
    this.useParm(aParms, "populatedLate", f)
    this.useParm(aParms, "refreshOnChange", f)
    this.useParm(aParms, "linkText", f)
    this.useParm(aParms, "barcode", f)
    this.useParm(aParms, "qrcode", f)
    this.useParm(aParms, "value", f)
    this.useParm(aParms, "subscript", f)
    this.useParm(aParms, "preserveOnTrash", f)
    this.useParm(aParms, "blankWhenZero", f)
    this.useParm(aParms, "skipConflictChecks", f)
    this.checkNoOtherParms(aParms, "field")
    if ( f.beforeField ) {
      this.placeFieldBefore(f, f.beforeField, fields)
      if ( f.panel )
        this.placeFieldBefore(f, f.beforeField, f.panel.attributes.fields, {ignoreMissing: true})
    }
    if ( f.afterField ) {
      this.placeFieldAfter(f, f.afterField, fields)
      if ( f.panel )
        this.placeFieldAfter(f, f.afterField, f.panel.attributes.fields, {ignoreMissing: true})
    }
    if ( f.tickbox )
      f.yesOrNo = true
    if ( (ret.new || captionSet) && f.caption ) {
      f._captionSet = true
      f.englishCaption = f.caption
      f.caption = f.caption.translate()
    }
    this.maybeUpdateRealms(f)
    if ( f.isKey && (! f.nonUnique) ) {
      this.mostRecentMold.setCruxField(f)
    }
    if ( f.indexed ) {
      this.mostRecentMold.markFieldAsIndexed(f)
    }
    if ( f.file )
      this.mostRecentMold.fileFieldName = f.name
    if ( f.storedCalc )
      this.mostRecentMold.__hasStoredCalcs = true
    return f
  }

  maybeUpdateRealms(f) {
    if ( (! f.wcMeta) && (! f.wcAttribute) ) return
    let realmName
    let m = this.mostRecentMold
    if ( m.name === 'products' ) {
      if ( f.wcMeta )
        realmName = 'WC Product'
      else
        realmName = 'WC Product Attribute'
    } else {
      if ( f.wcMeta )
        realmName = 'Meta'
      else
        realmName = 'Attribute'
    }
    if ( ! m.realms )
      m.realms = {}
    m.realms[f.name] = {name: realmName, wcFieldName: f.wcMeta || f.wcAttribute}
    f.realm = realmName
  }

  placeFieldBefore(field, beforeFieldName, fields, opt) {
    let fieldIdx = this.fieldNameToIndex(field.name, fields)
    let beforeFieldIdx = this.fieldNameToIndex(beforeFieldName, fields) 
    let ignoreMissing = opt && opt.ignoreMissing
    if ( (beforeFieldIdx < 0) && (! ignoreMissing) ) {
      "fields".m(fields)
      throw(new Error("Unknown beforeField field: " + beforeFieldName))
    }
    if ( fieldIdx < beforeFieldIdx )
      beforeFieldIdx--
    global.moveArrayElement(fields, fieldIdx, beforeFieldIdx)
  }


  placeFieldAfter(field, afterFieldName, fields, opt) {
    let fieldIdx = this.fieldNameToIndex(field.name, fields)
    let afterFieldIdx = this.fieldNameToIndex(afterFieldName, fields) 
    let ignoreMissing = opt && opt.ignoreMissing
    if ( (afterFieldIdx < 0) && (! ignoreMissing) )
      throw(new Error("Unknown afterField field: " + afterFieldName))
    if ( fieldIdx < afterFieldIdx )
      afterFieldIdx--
    global.moveArrayElement(fields, fieldIdx, afterFieldIdx + 1)
  }

  fieldNameToIndex(name, fields) {
    for ( var i = 0; i < fields.length; i++ ) {
      let f = fields[i]
      if ( f.name === name )
        return i
    }
    return -1
  }

  useParm(aParms, aParmName, aObj, aFn, aOptions) {
    if ( ! aParms ) return
    if ( aParms[aParmName] === undefined ) return
    let v = aParms[aParmName]
    delete aParms[aParmName]
    if ( aOptions && aOptions.ignore )
      return
    if ( ! aObj ) {
      return v
    }
    if ( ! aFn ) {
      aObj[aParmName] = v
      return v
    }
    let f = aFn.bind(this, aObj, v)
    f()
  }

  checkNoOtherParms(aParms, aMethodName) {
    for ( var prop in aParms ) {
      throw(new Error("Invalid argument in " + aMethodName + ": " + prop))
    }
  }

  action(aName, aParms) {
    let name = aName.translate()
    if ( global.gCreatingMoldsAndMenus ) return
    let place = this.useParm(aParms, "place")
    let spinner = this.useParm(aParms, "spinner")
    let act = this.useParm(aParms, "act")
    let spec = this.useParm(aParms, "spec")
    let autoChild = this.useParm(aParms, "autoChild")
    let caption = this.useParm(aParms, "caption")
    let beforeAction = this.useParm(aParms, "beforeAction")
    let icon = this.useParm(aParms, "icon")
    let parms = this.useParm(aParms, "parms")
    let noSave = this.useParm(aParms, "noSave")
    this.checkNoOtherParms(aParms, "action")
    if ( ! place ) 
      place = 'header'
    let obj = this.getMostRecentTypedControl()
    let a = obj.attributes.actions.filterSingle(a => a.englishName === aName)
    if ( ! a ) {
      a = {englishName: aName}
      obj.attributes.actions.push(a)
    }
    a.name = name
    if ( caption ) a.caption = caption
    if ( act ) a.tagOrFunction = act
    if ( place ) a.place = place
    if ( spec ) a.specname = spec
    if ( autoChild ) a.autoChild = autoChild
    if ( spinner ) a.spinner = spinner
    if ( icon ) a.icon = icon
    if ( parms ) a.parms = parms
    if ( noSave ) a.noSave = noSave
    if ( beforeAction )
      this.placeActionBefore(a, beforeAction, obj.attributes.actions)
  }

  placeActionBefore(action, beforeActionName, actions) {
    let actionIdx = this.actionNameToIndex(action.name, actions)
    let beforeActionIdx = this.actionNameToIndex(beforeActionName, actions) 
    if ( beforeActionIdx < 0 )
      throw(new Error("Unknown beforeAction action: " + beforeActionName))
    global.moveArrayElement(actions, actionIdx, beforeActionIdx)
  }

  actionNameToIndex(name, actions) {
    for ( var i = 0; i < actions.length; i++ ) {
      let a = actions[i]
      if ( a.englishName === name )
        return i
    }
    return -1
  }

  nameToManifest(aName) {
    let ms = this.attributes.manifests
    for ( var i = 0; i < ms.length; i++ ) {
      let m = ms[i]
      if ( m.name === aName ) return m
    }
    return null
  }

  manifest(aName, parms) {
    let m = this.nameToManifest(aName)
    let headingBGColor = this.useParm(parms, "headingBGColor")
    let headingFGColor = this.useParm(parms, "headingFGColor")
    let fontSize = this.useParm(parms, "fontSize")
    let rowHeight = this.useParm(parms, "rowHeight")
    let fixedOrder = this.useParm(parms, "fixedOrder")
    let useContainerSubset = this.useParm(parms, "useContainerSubset")
    this.checkNoOtherParms(parms, "manifest")
    if ( ! m ) {
      m = 
        { name: aName, 
          attributes: {name: aName, componentName: "Manifest", fields: [], actions: [], joinedDatatypes: []}
        }
      this.attributes.manifests.push(m)
    }
    let a = m.attributes
    a.headingBGColor = headingBGColor || a.headingBGColor
    a.headingFGColor = headingFGColor || a.headingFGColor
    a.fontSize = fontSize || a.fontSize
    a.rowHeight = rowHeight || a.rowHeight
    a.fixedOrder = fixedOrder || a.fixedOrder
    a.useContainerSubset = useContainerSubset || a.useContainerSubset
    this.attributes.typedControls.push(m)
  }

  panel(aName, aParms) {
    let p = this.nameToPanel(aName)
    let name = aName.translate()
    if ( ! p ) {
      p = 
        { name: name, 
          attributes: {name: name, fields: []}
        }
      this.attributes.panels.push(p)
    }
    let fullWidth = this.useParm(aParms, "fullWidth")
    let hidden = this.useParm(aParms, "hidden")
    let beforePanel = this.useParm(aParms, "beforePanel")
    if ( fullWidth )
      p.attributes.fullWidth = fullWidth
    if ( hidden )
      p.attributes.hidden = hidden
    if ( beforePanel ) {
      p.attributes.beforePanel = beforePanel
      this.placePanelBefore(p, beforePanel, this.attributes.panels, {ignoreMissing: true})
    }
    this.attributes.latestPanel = p
  }

  placePanelBefore(panel, beforePanelName, panels, opt) {
    let panelIdx = this.panelNameToIndex(panel.name, panels)
    let beforePanelIdx = this.panelNameToIndex(beforePanelName, panels) 
    let ignoreMissing = opt && opt.ignoreMissing
    if ( (beforePanelIdx < 0) && (! ignoreMissing) ) {
      "panels".m(panels)
      throw(new Error("Unknown beforePanel panel: " + beforePanelName))
    }
    if ( panelIdx < beforePanelIdx )
      beforePanelIdx--
    global.moveArrayElement(panels, panelIdx, beforePanelIdx)
  }

  panelNameToIndex(name, panels) {
    for ( var i = 0; i < panels.length; i++ ) {
      let p = panels[i]
      if ( p.name === name )
        return i
    }
    return -1
  }

  nameToSection(aName) {
    let ss = this.attributes.sections
    for ( var i = 0; i < ss.length; i++ ) {
      let s = ss[i]
      if ( s.name === aName ) return s
    }
    return null
  }

  section(aName, aParms) {
    let s = this.nameToSection(aName)
    let pageHeading = this.useParm(aParms, "pageHeading")
    let outputHeading = this.useParm(aParms, "outputHeading")
    let outputFooter = this.useParm(aParms, "outputFooter")
    let pageFooter = this.useParm(aParms, "pageFooter")
    let height = this.useParm(aParms, "height")
    let width = this.useParm(aParms, "width")
    let rightAlign = this.useParm(aParms, "rightAlign")
    let centerAlign = this.useParm(aParms, "centerAlign")
    let lineHeight = this.useParm(aParms, "lineHeight")
    let hidePageNumber = this.useParm(aParms, "hidePageNumber")
    let fontSize = this.useParm(aParms, "fontSize")
    let bottomMargin = this.useParm(aParms, "bottomMargin")
    let gapBetweenSubsections = this.useParm(aParms, "gapBetweenSubsections")
    let lineAbove = this.useParm(aParms, "lineAbove")
    let lineBelow = this.useParm(aParms, "lineBelow")
    this.checkNoOtherParms(aParms, "section")
    if ( ! s ) {
      s = 
        { name: aName, 
          attributes: 
            { name: aName, 
              componentName: "Section", 
              fields: [], 
              subsections: []
            },
        }
      this.attributes.sections.push(s)
    }
    let a = s.attributes
    a.pageHeading = pageHeading || a.pageHeading
    a.outputHeading = outputHeading || a.outputHeading
    a.outputFooter = outputFooter || a.outputFooter
    a.pageFooter = pageFooter || a.pageFooter
    a.width = width || a.width
    a.height = height || a.height
    a.rightAlign = rightAlign || a.rightAlign
    a.centerAlign = centerAlign || a.centerAlign
    a.lineHeight = lineHeight || a.lineHeight
    a.hidePageNumber = hidePageNumber || a.hidePageNumber
    a.fontSize = fontSize || a.fontSize
    a.bottomMargin = bottomMargin || a.bottomMargin
    a.gapBetweenSubsections = gapBetweenSubsections || a.gapBetweenSubsections
    a.lineAbove = lineAbove || a.lineAbove
    a.lineBelow = lineBelow || a.lineBelow
    this.attributes.typedControls.push(s)
  }

  nameToSubsection(section, name) {
    let subsections = section.attributes.subsections
    for ( var i = 0; i < subsections.length; i++ ) {
      let subsection = subsections[i]
      if ( subsection.name === name )
        return subsection
    }
    return null
  }

  subsection(aName, aParms) {
    let s = this.attributes.sections.last()
    let ss = this.nameToSubsection(s, aName)
    let captionPosition = this.useParm(aParms, "captionPosition")
    let width = this.useParm(aParms, "width")
    let captionFontStyle = this.useParm(aParms, "captionFontStyle")
    let captionWidth = this.useParm(aParms, "captionWidth")
    let fontSize = this.useParm(aParms, "fontSize")
    let leftMargin = this.useParm(aParms, "leftMargin")
    let lineHeight = this.useParm(aParms, "lineHeight")
    let inBox = this.useParm(aParms, "inBox")
    let centerAlign = this.useParm(aParms, "centerAlign")
    let padding = this.useParm(aParms, "padding")
    let boxLeeway = this.useParm(aParms, "boxLeeway")
    this.checkNoOtherParms(aParms, "subsection")
    let a = s.attributes
    if ( ! ss ) {
      ss = 
        { name: aName, 
          attributes: 
            { name: aName, 
              componentName: "Subsection", 
              fields: [], 
            }
        }
      a.subsections.push(ss)
    }
    let ssa = ss.attributes
    ssa.captionPosition = captionPosition || ssa.captionPosition || "left"
    ssa.width = width || ssa.width
    ssa.captionFontStyle = captionFontStyle || ssa.captionFontStyle || "bold"
    ssa.captionWidth = captionWidth || ssa.captionWidth
    ssa.fontSize = fontSize || ssa.fontSize
    ssa.leftMargin = leftMargin || ssa.leftMargin
    ssa.lineHeight = lineHeight || ssa.lineHeight
    ssa.inBox = inBox || ssa.inBox
    ssa.centerAlign = centerAlign || ssa.centerAlign
    ssa.padding = padding || ssa.padding
    ssa.boxLeeway = boxLeeway || ssa.boxLeeway
    this.attributes.typedControls.push(ss)
  }

  getMostRecentTypedControl() {
    let tc = this.attributes.typedControls.last()
    if ( tc )
      return tc
    return this
  }

  datatype(aName, aParms) {
    let captionSpecified = aParms && aParms.caption
    let source = this.useParm(aParms, "source")
    let caption = this.useParm(aParms, "caption")
    let transient = this.useParm(aParms, "transient")
    let singleton = this.useParm(aParms, "singleton")
    let readOnly = this.useParm(aParms, "readOnly")
    let plex = this.useParm(aParms, "plex")
    let exportable = this.useParm(aParms, "exportable")
    let lazyCalc = this.useParm(aParms, "lazyCalc")
    let alwaysDoAfterRetrieve = this.useParm(aParms, "alwaysDoAfterRetrieve")
    this.checkNoOtherParms(aParms, "datatype")
    let m = this.registerMold(aName, source)
    if ( caption )
      m.caption = caption
    if ( transient )
      m.transient = transient
    if ( singleton )
      m.singleton = singleton
    if ( readOnly )
      m.readOnly = readOnly
    if ( plex || (plex === false) )
      m.plex = plex
    if ( exportable )
      m.exportable = exportable
    if ( lazyCalc )
      m.lazyCalc = lazyCalc
    if ( alwaysDoAfterRetrieve )
      m.alwaysDoAfterRetrieve = alwaysDoAfterRetrieve
    let obj = this.getMostRecentTypedControl()
    if ( (aName === this.attributes.datatype) && (obj.attributes.fields.length > 0) && (this !== obj) ) {
      obj = this
      this.attributes.typedControls = [] // revert to main spec
    }
    let a = obj.attributes
    if ( a.datatype && (a.datatype !== aName) ) { 
      a.joinedDatatypes.push(aName)
      return
    }
    a.datatype = aName
    if ( a.componentName === "Maint" )
      m._hasMaint = true
    if ( captionSpecified )
      m.caption = m.caption.translate()
  }

  subset(aName, aFn) {
    let parts = aName.split('.')
    if ( parts.length !== 2 ) throw(new Error('Invalid subset: ' + aName))
    let dt = parts[0]
    let m = Foreman.nameToMold(dt); if ( ! m ) throw(new Error('Invalid datatype: ' + dt))
    let subsetName = parts[1]
    let subset = m.subsets[subsetName]
    if ( ! subset ) {
      subset = {}
      m.subsets[subsetName] = subset
    }
    subset.function = aFn
  }

  menuCaption(aCaption) {
    global.stMenu.setItemCaption(global.currentSpecname, aCaption)
  }

  title(aTitle, aParms) {
    let title = aTitle.translate()
    let when = this.useParm(aParms, "when")
    let headerOnly = this.useParm(aParms, "headerOnly")
    let fontSize = this.useParm(aParms, "fontSize")
    this.checkNoOtherParms(aParms, "title")
    if ( when && (! ((when === "adding") || (when === "editing"))) )
      throw(new Error("when parameter must be 'adding' or 'editing'"))
    if ( (!when) || (when === "adding") )
      this.attributes.titleWhenAdding = title
    if ( (!when) || (when === "editing") )
      this.attributes.titleWhenEditing = title
    if ( ! when )
      this.attributes.title = title
    this.attributes.titleFontSize = fontSize || this.attributes.titleFontSize
    if ( ! headerOnly )
      global.stMenu.setItemCaption(global.currentSpecname, aTitle)
  }

  maintSpecname(aSpecname) {
    let obj = this.getMostRecentTypedControl()
    obj.attributes.maintSpecname = aSpecname
  }
}

global.prfiMachineClass = Machine

/* eslint-disable no-extend-native */

String.prototype.maint = function(aParms) {
  gCurrentMachine.maint(this, aParms)
  return this
}

String.prototype.output = function(aParms) {
  gCurrentMachine.output(this, aParms)
  return this
}

String.prototype.page = function(aParms) {
  gCurrentMachine.page(this, aParms)
  return this
}

String.prototype.list = function(aParms) {
  gCurrentMachine.list(this, aParms)
  return this
}

String.prototype.datatype = function(aParms) {
  gCurrentMachine.datatype(this, aParms)
  return this
}

String.prototype.subset = function(aFn) {
  gCurrentMachine.subset(this, aFn)
  return this
}

String.prototype.action = function(aParms) {
  gCurrentMachine.action(this, aParms)
  return this
}

String.prototype.columnVisibleWhen = function(aVal) {
  gCurrentMachine.columnVisibleWhen(this, aVal)
  return this
}

String.prototype.columnVisibleWhenInternal = function(aVal) {
  gCurrentMachine.columnVisibleWhenInternal(this, aVal)
  return this
}

String.prototype.readOnlyWhen = function(aVal) {
  gCurrentMachine.readOnlyWhen(this, aVal)
  return this
}

String.prototype.visibleWhen = function(aVal) {
  gCurrentMachine.visibleWhen(this, aVal)
  return this
}

String.prototype.visibleWhenInternal = function(aVal) {
  gCurrentMachine.visibleWhenInternal(this, aVal)
  return this
}

String.prototype.afterChoosingFile = function(aVal) {
  gCurrentMachine.afterChoosingFile(this, aVal)
  return this
}

String.prototype.afterUserChange = function(aVal) {
  gCurrentMachine.afterUserChange(this, aVal)
  return this
}

String.prototype.afterSearchChange = function(aVal) {
  gCurrentMachine.afterSearchChange(this, aVal)
  return this
}

String.prototype.modifyRenderValue = function(aVal) {
  gCurrentMachine.modifyRenderValue(this, aVal)
  return this
}

String.prototype.modifyInputRenderValue = function(aVal) {
  gCurrentMachine.modifyInputRenderValue(this, aVal)
  return this
}

String.prototype.destination = function(aVal) {
  gCurrentMachine.destination(this, aVal)
  return this
}

String.prototype.calculateTotal = function(aVal) {
  gCurrentMachine.calculateTotal(this, aVal)
  return this
}

String.prototype.calculateWhen = function(aVal) {
  gCurrentMachine.calculateWhen(this, aVal)
  return this
}

String.prototype.labelMmUnit = function(aVal) {
  gCurrentMachine.labelMmUnit(this, aVal)
  return this
}

String.prototype.calculate = function(aVal) {
  gCurrentMachine.calculate(this, aVal)
  return this
}

String.prototype.sortDropdown = function(aVal) {
  gCurrentMachine.sortDropdown(this, aVal)
  return this
}

String.prototype.dropdownValue = function(aVal) {
  gCurrentMachine.dropdownValue(this, aVal)
  return this
}

String.prototype.dynamicCaption = function(aVal) {
  gCurrentMachine.dynamicCaption(this, aVal)
  return this
}

String.prototype.dynamicWidth = function(aVal) {
  gCurrentMachine.dynamicWidth(this, aVal)
  return this
}

String.prototype.dynamicOptions = function(aVal) {
  gCurrentMachine.dynamicOptions(this, aVal)
  return this
}

String.prototype.dynamicTitle = function(aVal) {
  gCurrentMachine.dynamicTitle(this, aVal)
  return this
}

String.prototype.options = function(aVal) {
  gCurrentMachine.options(this, aVal)
  return this
}

String.prototype.fontWeight = function(aVal) {
  gCurrentMachine.fontWeight(this, aVal)
  return this
}

String.prototype.color = function(aVal) {
  gCurrentMachine.color(this, aVal)
  return this
}

String.prototype.caption = function(aVal) {
  gCurrentMachine.caption(this, aVal)
  return this
}

String.prototype.default = function(aVal) {
  gCurrentMachine.default(this, aVal)
  return this
}

String.prototype.fallback = function(aVal) {
  gCurrentMachine.fallback(this, aVal)
  return this
}

String.prototype.inception = function(aVal) {
  gCurrentMachine.inception(this, aVal)
  return this
}

String.prototype.accept = function(aData) {
  gCurrentMachine.accept(this, aData)
  return this
}

String.prototype.guidance = function(aData) {
  gCurrentMachine.guidance(this, aData)
  return this
}

String.prototype.facade = function(aData) {
  gCurrentMachine.facade(this, aData)
  return this
}

String.prototype.data = function(aData) {
  gCurrentMachine.data(this, aData)
  return this
}

String.prototype.readOnly = function(aFn) {
  gCurrentMachine.readOnly(this, aFn)
  return this
}

String.prototype.createJoinWhen = function(aFn) {
  gCurrentMachine.createJoinWhen(this, aFn)
  return this
}

String.prototype.modifyRowFields = function(aFn) {
  gCurrentMachine.modifyRowFields(this, aFn)
  return this
}

String.prototype.modifyFields = function(aFn) {
  gCurrentMachine.modifyFields(this, aFn)
  return this
}

String.prototype.modifyRowMoldFields = function(aFn) {
  gCurrentMachine.modifyRowMoldFields(this, aFn)
  return this
}

String.prototype.modifyMoldFields = function(aFn) {
  gCurrentMachine.modifyMoldFields(this, aFn)
  return this
}

String.prototype.makeDestinationFor = function(aDatatype) {
  gCurrentMachine.makeDestinationFor(this, aDatatype)
  return this
}

String.prototype.labelCount = function(aFn) {
  gCurrentMachine.labelCount(this, aFn)
  return this
}

String.prototype.getCasts = function(aFn) {
  gCurrentMachine.getCasts(this, aFn)
  return this
}

String.prototype.substituteCast = function(aFn) {
  gCurrentMachine.substituteCast(this, aFn)
  return this
}

String.prototype.alternativeSpec = function(aFn) {
  gCurrentMachine.alternativeSpec(this, aFn)
  return this
}

String.prototype.warning = function(aFn) {
  gCurrentMachine.warning(this, aFn)
  return this
}

String.prototype.whenAdding = function(aFn) {
  gCurrentMachine.whenAdding(this, aFn)
  return this
}

String.prototype.onScannerRead = function(aFn) {
  gCurrentMachine.onScannerRead(this, aFn)
  return this
}

String.prototype.afterCreatingCast = function(aFn) {
  gCurrentMachine.afterCreatingCast(this, aFn)
  return this
}

String.prototype.afterInitialising = function(aFn) {
  gCurrentMachine.afterInitialising(this, aFn)
  return this
}

String.prototype.beforeTrash = function(aFn) {
  gCurrentMachine.beforeTrash(this, aFn)
  return this
}

String.prototype.afterTrash = function(aFn) {
  gCurrentMachine.afterTrash(this, aFn)
  return this
}

String.prototype.beforeLoading = function(aFn) {
  gCurrentMachine.beforeLoading(this, aFn)
  return this
}

String.prototype.afterLoading = function(aFn) {
  gCurrentMachine.afterLoading(this, aFn)
  return this
}

String.prototype.onOK = function(aFn) {
  gCurrentMachine.onOK(this, aFn)
  return this
}

String.prototype.onSave= function(aFn) {
  gCurrentMachine.onSave(this, aFn)
  return this
}

String.prototype.allowTrash = function(aFn) {
  gCurrentMachine.allowTrash(this, aFn)
  return this
}

String.prototype.afterCreating = function(aFn) {
  gCurrentMachine.afterCreating(this, aFn)
  return this
}

String.prototype.beforeInception = function(aFn) {
  gCurrentMachine.beforeInception(this, aFn)
  return this
}

String.prototype.afterRetrievingFast = function(aFn) {
  gCurrentMachine.afterRetrievingFast(this, aFn)
  return this
}

String.prototype.afterRetrieving = function(aFn) {
  gCurrentMachine.afterRetrieving(this, aFn)
  return this
}

String.prototype.beforeValidating = function(aFn) {
  gCurrentMachine.beforeValidating(this, aFn)
  return this
}

String.prototype.validate = function(aFn) {
  gCurrentMachine.validate(this, aFn)
  return this
}

String.prototype.afterAnyUserChange = function(aFn) {
  gCurrentMachine.afterAnyUserChange(this, aFn)
  return this
}

String.prototype.beforeSaving = function(aFn) {
  gCurrentMachine.beforeSaving(this, aFn)
  return this
}

String.prototype.beforeFirstSave = function(aFn) {
  gCurrentMachine.beforeFirstSave(this, aFn)
  return this
}

String.prototype.beforeImporting = function(aFn) {
  gCurrentMachine.beforeImporting(this, aFn)
  return this
}

String.prototype.afterLastSave = function(aFn) {
  gCurrentMachine.afterLastSave(this, aFn)
  return this
}

String.prototype.afterSaving = function(aFn) {
  gCurrentMachine.afterSaving(this, aFn)
  return this
}

String.prototype.addExtraField = function(aParms) {
  gCurrentMachine.addExtraField(this, aParms)
  return this
}

String.prototype.cruxFields = function(aFieldNames) {
  gCurrentMachine.cruxFields(this, aFieldNames)
  return this
}

String.prototype.enhance = function(aName, aFn) {
  gCurrentMachine.enhance(this, aName, aFn)
  return this
}

String.prototype.method = function(aName, aFn) {
  gCurrentMachine.method(this, aName, aFn)
  return this
}

String.prototype.dynamicTitle = function(aFn) {
  gCurrentMachine.dynamicTitle(this, aFn)
  return this
}

String.prototype.afterFieldCalculations = function(aFn) {
  gCurrentMachine.afterFieldCalculations(this, aFn)
  return this
}

String.prototype.criteria = function(aFn) {
  gCurrentMachine.criteria(this, aFn)
  return this
}

String.prototype.filter = function(aFn) {
  gCurrentMachine.filter(this, aFn)
  return this
}

String.prototype.shouldIncludeCastInDownload = function(aFn) {
  gCurrentMachine.shouldIncludeCastInDownload(this, aFn)
  return this
}

String.prototype.limitToSubset = function(aName) {
  gCurrentMachine.limitToSubset(this, aName)
  return this
}

String.prototype.defaultSort = function(aVal) {
  gCurrentMachine.defaultSort(this, aVal)
  return this
}

String.prototype.act = function(aFn) {
  gCurrentMachine.act(this, aFn)
  return this
}

String.prototype.before = function(aFn) {
  gCurrentMachine.before(this, aFn)
  return this
}

String.prototype.availableWhen = function(aFn) {
  gCurrentMachine.availableWhen(this, aFn)
  return this
}

String.prototype.excludeChoiceWhen = function(aFn) {
  gCurrentMachine.excludeChoiceWhen(this, aFn)
  return this
}

String.prototype.content = function(aParms) {
  gCurrentMachine.content(this, aParms)
  return this
}

String.prototype.render = function(aParms) {
  gCurrentMachine.render(this, aParms)
  return this
}

String.prototype.backgroundImageUrl = function(aParms) {
  gCurrentMachine.backgroundImageUrl(this, aParms)
  return this
}

String.prototype.field = function(aParms) {
  gCurrentMachine.field(this, aParms)
  return this
}

String.prototype.manifest = function(parms) {
  gCurrentMachine.manifest(this, parms)
  return this
}

String.prototype.panel = function(aParms) {
  gCurrentMachine.panel(this, aParms)
  return this
}

String.prototype.subsection = function(aParms) {
  gCurrentMachine.subsection(this, aParms)
  return this
}

String.prototype.section = function(aParms) {
  gCurrentMachine.section(this, aParms)
  return this
}

String.prototype.menuCaption = function() {
  gCurrentMachine.menuCaption(this)
  return this
}

String.prototype.title = function(aParms) {
  gCurrentMachine.title(this, aParms)
  return this
}

String.prototype.maintSpecname = function() {
  gCurrentMachine.maintSpecname(this)
  return this
}

String.prototype.spec = function(options) {
  gCurrentMachine.spec(this, options)
  return this
}

String.prototype.add = function(aOptions) {
  return global.foreman.addCast(this, aOptions)
}

String.prototype.bring = async function(aCriteria, aOptions) {
  let b = new Bringer()
  return await b.bring(this, aCriteria, aOptions)
}

String.prototype.retrieveFast = function(aCriteria, aOptions) {
  let kosher = aOptions && aOptions.kosher
  let force = kosher || (aOptions && aOptions.force)
  let mold = global.foreman.doNameToMold(this)
  if ( (! force) && (! mold.canAlwaysDoFastRetrieve()) )
    return 'na'
  let res = mold.fastRetrieve(aCriteria);
  if ( kosher && (! mold.castsAreKosher(res)) )
    return 'na'
  return res
}

String.prototype.bringFast = String.prototype.retrieveFast

String.prototype.clear = function() {
  let res = new Bringer().clear(this)
  return res
}

String.prototype.create = async function(aOptions, aCriteria) {
  let b = new Bringer()
  let res = await b.create(this, aCriteria, aOptions)
  return res
}

String.prototype.bringOrCreate = async function(aCriteria, options) {
  //tc(20)
  let b = new Bringer()
  if ( ! options )
    options = {}
  options.single = true
  options.createIfNotFound = true
  options.includeMarkedForDeletion = false
  let res = await b.bring(this, aCriteria, options)
  //tc(21)
  return res
}

String.prototype.bringSingle = async function(aCriteria, options) {
  let b = new Bringer()
  if ( ! options )
    options = {}
  options.single = true
  options.singleOptions = options
  let res = await b.bring(this, aCriteria, options)
  return res
}

String.prototype.bringSingleNoCalc = async function(aCriteria, options) {
  let b = new Bringer()
  if ( ! options )
    options = {}
  options.single = true
  options.singleOptions = options
  options.noCalc = true
  let res = await b.bring(this, aCriteria, options)
  return res
}

String.prototype.bringSingleFast = function(aCriteria, options) {
  let b = new Bringer()
  if ( ! options )
    options = {}
  options.singleOptions = options
  let res = b.bringSingleFast(this, aCriteria, options)
  return res
}

String.prototype.bringFirst = async function(aCriteria, options) {
  //tc(360)
  let b = new Bringer()
  if ( ! options )
    options = {}
  options.first = true
  let res = await b.bring(this, aCriteria, options)
  //tc(361)
  return res
}

String.prototype.bringLast = async function(aCriteria, options) {
  //tc(370)
  let b = new Bringer()
  if ( ! options )
    options = {}
  options.last = true
  let res = await b.bring(this, aCriteria, options)
  //tc(371)
  return res
}

String.prototype.bringChildrenOf = async function(aParent, options) {
  //tc(380)
  let b = new Bringer()
  if ( ! options )
    options = {}
  options.parent = aParent
  let res = await b.bring(this, null, options)
  //tc(381)
  return res
}

String.prototype.bringChildrenOfFast = function(aParent, options) {
  if ( ! options )
    options = {}
  options.parentId = aParent.id
  return this.retrieveFast(null, options)
}


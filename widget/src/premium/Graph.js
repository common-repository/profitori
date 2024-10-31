import React from 'react'
import { Button, FormGroup, Table, Row, Spinner, ButtonDropdown, DropdownItem, DropdownToggle, DropdownMenu } from 'reactstrap'
import logo from '../specs/images/profitori_logo_29x34.png'
import Link from '../Link.js'
import XLSX from 'xlsx'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBars } from '@fortawesome/free-solid-svg-icons'
import { Bar, Pie, Line } from 'react-chartjs-2';
require('../Globals.js')

function execDeferred(fn, options) {
  global.prfiExecDeferred(fn, options)
}

export default class Graph extends React.Component {

  constructor(aProps) {
    super(aProps)
    this.forward = aProps.forward
    this.state = {version: 0}
  }

  async harmonize() {
    if ( this.props.inTile ) 
      return
    await global.gApp.harmonize()
  }

  vassal() {
    return false
  }

  back() {
    let f = this.cancelFunction()
    f()
  }

  casts() {
    return this._chartCasts
  }

  berth() {
    let sit = this.situation()
    let res = sit.getOrCreateBerth(this.name())
    return res
  }

  situation() {
    return global.gApp.currentSituation
  }

  getFieldValue(aName) {
    return this.fieldGet(aName)
  }

  setFieldValue(aName, aValue) {
    this.setFieldValueByName(aName, aValue)
  }

  foreman() {
    return global.foreman
  }

  startProgress(aParms) {
    global.startProgress(aParms)
  }

  stopProgress(aParms) {
    global.stopProgress(aParms)
  }

  updateProgress(aParms) {
    global.updateProgress(aParms)
  }

  showMessage(aMsg, aOptions) {
    this.props.showMessage(aMsg, aOptions)
  }

  componentDidMount() {
    this.mounted = true
  }
  
  app() {
    return global.gApp
  }

  componentWillUnmount() {
    this.mounted = false
  }

  fieldGet(aName) {
    let res = this.cast[aName]
    if ( ! global.isObj(res) ) 
      return this.safeValue(res)
    return res
  }

  safeValue(aVal) {
    if ( (! aVal) && (aVal !== 0) ) return ''
    return aVal
  }

  setFieldValueByName(aName, aVal) { // Graph
    if ( ! this.nameToField(aName) ) throw(new Error("Attempted to set invalid field: " + aName))
    this.cast[aName] = aVal
  }

  hasHeader() {
    return this.props.attributes.withHeader
  }

  refreshState() {
    if ( ! this.mounted ) return
    this.setState({showSpinner: this.spinnerIsShowing, waitCount: this.waitCount})
  }

  name() {
    return this.a().name
  }

  isTopLevel() {
    return ! this.props.hideCancelButton
  }

  spinner() {
    let id = this.name().toId() + "Spinner"
    return (
      <Spinner animation="border" style={{float: "left", display: "none", marginTop: "3px"}} className="stSpinner mr-2" id={id}/>
    )
  }

  logo() {
    if ( this.props.hideLogo )
      return null
    return (
      <img src={logo} alt="logo" style={{width: "29px", height: "34px", float: "left", marginTop: "3px"}} className="prfiLogo"/>
    )
  }

  getTitle() {
    let p = this.props
    if ( p.title )
      return p.title
    let a = p.attributes
    let res = a.title
    let dtf = a.dynamicTitle
    if ( dtf ) {
      let f = dtf.bind(this)
      let t = f()
      if ( t )
        res = t
    }
    return res
  }

  callerCast() {
    let res = this.props.callerCast
    if ( ! res )
      res = global.gApp.getAncestorCallerCast()
    return res
  }

  callerSpecname() {
    return this.props.callerSpecname
  }

  a() {
    return this.props.attributes
  }

  datatype() {
    return this.a().datatype
  }

  manifests() {
    return this.a().manifests
  }

  getParticulars() { /* Graph */
    let Particulars = this.app().getParticularsClass()
    if ( ! this.withHeader() ) return null
    return (
      <Particulars
        classRoot="stGraph"
        container={this}
        attributes={this.a()}
        cast={this.cast}
        forward={this.props.forward}
      />
    )
  }

  withHeader() {
    return this.a().withHeader
  }

  specname() {
    return this.a().specname
  }

  getPlots() {
    if ( ! this.withHeader() ) {
      return this.attributesToPlot(this.a(), 0)
    }
    let res = []
    let manifests = this.manifests()
    for ( var i = 0; i < manifests.length; i++ ) {
      let m = manifests[i]
      let plot = this.attributesToPlot(m.attributes, i)
      res.push(plot)
    }
    return res
  }

  attributesToPlot(aAttributes, aIdx) { /* Graph */
    let p = this.props
    return (
      <Plot 
        key={aIdx}
        graph={this}
        attributes={aAttributes} 
        specname={p.operation.specname} 
        forward={p.forward} 
        showMessage={p.showMessage} 
        callerCast={p.callerCast}
        callerSpecname={p.callerSpecname}
        suppressTitle={true}
        situation={p.situation}
        modifyFields={p.attributes.modifyFields}
        containerVersion={this.state.version}
      /> 
    )
  }

  refresh() {
    if ( ! this.mounted ) return
    this.setState({version: this.state.version + 1})
  }

  async doRefreshAction() {
    if ( ! this.mounted ) return
    execDeferred(
      async () => {
        await global.gApp.harmonize()
        this.setState({version: this.state.version ? this.state.version + 1 : 0})
      }, 
      {forceSpinner: true, ms: 200}
    )
  }

  async initCast() { /* Graph */
    this.cast = await this.datatype().bringOrCreate(); 
    await this.updateDefaults()
    if ( ! this.mounted ) return
    this.setState({cast: this.cast})
  }

  async updateDefaults() {
    let c = this.cast
    let fields = c.fields()
    for ( var i = 0; i < fields.length; i++ ) {
      let f = fields[i]
      let v = f.default
      if ( (! v) && f.date )
        v = global.todayYMD()
      if ( ! v ) continue
      if ( v instanceof Function ) {
        let fres = v(this, this.cast)
        if ( global.isPromise(fres) ) {
          let val = await fres
          c[f.name] = val
        } else
          c[f.name] = fres
      } else
        c[f.name] = v
    }
  }

  shouldHideCancelButton() {
    return this.props.hideCancelButton
  }

  maxNormalButtons() {
    let w = (window.innerWidth || document.documentElement.clientWidth)
    let tileWidthPx = this.props.tileWidthPx
    if ( tileWidthPx )
      w = tileWidthPx
    let avgButtonWidth = 144
    let res = Math.round(w / avgButtonWidth) - 1
    if ( res > 6 )
      res = 6
    return res
  }

  headerButtons() { /* Graph */
    let btns = []
    let actions = this.props.attributes.actions
    let maxNormalButtons = this.maxNormalButtons()
    let knt = 0
    for ( var i = 0; i < actions.length; i++ ) {
      let a = actions[i]
      let vwf = a.visibleWhen
      if ( vwf ) {
        if ( ! vwf(this, this.cast) )
          continue
      }
      let f = this.headerActionToFunction(a); if ( ! f ) continue
      let caption = a.caption || a.name
      let key = caption.toId()
      knt++
      if ( knt <= maxNormalButtons ) {
        let btn = (
          <Button key={key} onClick={f} className="stHeaderButton mr-1">{caption}</Button>
        )
        btns.push(btn)
      }
    }
    let moreKey = this.name() + "-more"
    let moreBtn = (
      <ButtonDropdown
        key={moreKey}
        isOpen={this.state.moreOpen}
        toggle={() => this.setState({moreOpen: ! this.state.moreOpen})}
      >
        <DropdownToggle caret className="stHeaderButton">
          {"More".translate()}
        </DropdownToggle>
        <DropdownMenu>
          {this.moreDropdownItems()}
        </DropdownMenu>
      </ButtonDropdown>
    )
    btns.push(moreBtn)
    let res = (
      <Table className="stGraphHeader" key="prfiHeaderButtons">
        <tbody>
          <tr>
            <td className="stGraphHeaderButtons">
              <div>
                {btns}
              </div>
            </td>
          </tr>
        </tbody>
      </Table>
    )
    return res
  }

  moreDropdownItems() { /* Graph */
    let res = []
    let actions = this.props.attributes.actions
    let maxNormalButtons = global.gApp.maxNormalButtons(2)
    let knt = 0
    for ( var i = 0; i < actions.length; i++ ) {
      let a = actions[i]
      let f = this.headerActionToFunction(a); if ( ! f ) continue
      let caption = a.caption || a.name
      let key = caption.toId()
      knt++
      if ( knt <= maxNormalButtons )
        continue
      let ddi = (
        <DropdownItem key={key} onClick={f} className="stMoreDropdownItem mr-1">{caption}</DropdownItem>
      )
      res.push(ddi)
    }
    global.gApp.menu().addItemsToDropdown(res)
    return res
  }

  headerActionToFunction(aAction) { /* Graph */
    let res = this.doHeaderActionToFunction(aAction)
    if ( aAction.spinner )
      res = global.gApp.wrapFunctionWithSpinner(res, this)
    return res
  }

  doHeaderActionToFunction(aAction) { /* Graph */
    if ( aAction.place !== "header" ) return null
    if ( (aAction.tagOrFunction === "cancel") && this.shouldHideCancelButton() ) return null
    let awf = aAction.availableWhen
    if ( awf ) {
      let available = awf(this.cast, this)
      if ( ! available )
        return null
    }
    let tof = aAction.tagOrFunction
    let specname = aAction.specname
    if ( tof === "cancel" )
      return this.cancelFunction()
    if ( tof === "add" ) 
      return this.startAdding.bind(this)
    if ( tof === "excel" ) 
      return this.downloadXLS.bind(this)
    if ( tof === "refresh" ) 
      return this.doRefreshAction.bind(this)
    if ( ! tof )
      return this.segue.bind(this, "view", specname)
    let f = tof.bind(this, this, this.cast)
    return this.functionToRefreshingFunction(f)
  }

  functionToRefreshingFunction(aFn) {
    return this.execFunctionWithRefresh.bind(this, aFn)
  }

  async execFunctionWithRefresh(aFn) {
    this.showSpinner() 
    try {
      try {
        await aFn()
        this.version++
        this.refreshState()
      } catch(e) {
        this.showMessage(e.message)
        return
      }
    } finally {
      this.hideSpinner()
    }
  }

  async downloadXLS() {
    if ( await global.gApp.preventInteractionWhenBusy() ) return
    const xu = XLSX.utils
    let data = await this.getDataAsArray()
    var ws = xu.json_to_sheet(data)
    var wb = xu.book_new();
    let title = this.a().title
    xu.book_append_sheet(wb, ws, title);
    XLSX.writeFile(wb, title + '.xlsx')
  }

  getDataAsArray() { /* Graph */
    let g = this._plot || this.plot
    if ( ! g ) return []
    return g.getDataAsArray()
  }

  async segue(aAct, aSpecname) {
    let Operation = global.gApp.getOperationClass()
    if ( await global.gApp.preventInteractionWhenBusy() ) return
    let parentCast
    let cast
    let callerCast
    let callerSpecname = this.a().specname
    this.forward(
      new Operation(aSpecname, aAct, this.props.attributes.specname, false), 
      cast, 
      parentCast,
      callerCast,
      callerSpecname
    )
  }

  cancelFunction() { /* Graph */
    return async () => {
      if ( await global.gApp.preventInteractionWhenBusy() ) return
      global.gApp.backToFirstDifferentSpec()
    }
  }

  fields() {
    return this.props.attributes.fields
  }

  nameToField(aName) { /* Graph */
    return this.fields().filterSingle(field => (field.name === aName) || (field.caption === aName))
  }

  onBlur(aEvent) {
    this.version++
    this.refreshState()
  }

  showSpinner() {
    global.showSpinner(this, {immediate: true})
  }

  hideSpinner() {
    global.hideSpinner(this)
  }

  onChange(aParm1, aValue, aInfo) {  /* Graph */
    let val = ''
    let name = ''
    if ( aParm1.target ) {
      let event = aParm1
      let t = event.target
      name = t.name
      val = t.value
    } else {
      name = aParm1
      val = aValue
    }
    name = name.stripLeft("stocktend_")
    let f = this.nameToField(name)
    let c = this.cast; if ( ! c ) return
    let oldVal = c[name]
    f.setCastPropValue(c, val)
    let spinnerStarted

    let finish = (aAfterChangeMsg) => {
      if ( aAfterChangeMsg ) {
        global.gApp.showMessage(aAfterChangeMsg.translate())
        this.hideSpinner()
        c[name] = oldVal
        return
      }
      if ( f.isKey )
        c["wp_post_title"] = val
      this.changedSinceLastSaveAttempt = true
      if ( spinnerStarted )
        this.hideSpinner()
      c.refreshCalculations({force: true, keepState: true}).then(() => {
        this.version++
        this.refreshState()
      })
    }

    if ( (! f.toAfterUserChange()) || (aInfo && aInfo.invalid) ) {
      finish()
      return
    }

    let fn = () => {
      let res
      this.showSpinner()
      spinnerStarted = true
      try {
        res = f.doAfterUserChange(oldVal, val, c, this)
      } catch(e) {
        this.hideSpinner()
        c[name] = oldVal
        throw(e)
      }
      if ( global.isPromise(res) ) {
        res.then(finish)
      } else 
        finish(res)
    }

    execDeferred(fn, {forceSpinner: true, ms: 50})
  }

  toggleVeil() {
    let unveiled = this.state.unveiled ? true : false
    this.setState({unveiled: ! unveiled})
  }

  render() { /* Graph */
    global.gApp.currentSituation.sheet = this
    if ( ! this.firstRenderDone ) {
      this.firstRenderDone = true
      let f = this.props.attributes.beforeLoading
      if ( f ) {
        this.beforeLoadPending = true
        execDeferred(
          () => {
            this.showSpinner()
            f(this).then(
              () => {
                this.beforeLoadPending = false
                execDeferred(
                  () => {
                    this.hideSpinner()
                    if ( ! this.mounted ) return
                    this.forceUpdate()
                  }
                )
              }
            )
          },
          {forceSpinner: true}
        )
      }
    }
    let title = this.getTitle()
    if ( this.withHeader() && (! this.cast) ) {
      execDeferred(this.initCast.bind(this))
      return null
    }
    let sep = null
    if ( this.withHeader() )
      sep = <div className="stPlotSeparator"/>
    let contactSupport = null
    if ( ! this.props.hideContactSupport )
      contactSupport = 
        <div id="stLinks">
          <a id="stHelp" href="https://profitori.com/help" target="_blank" rel="noopener noreferrer">{"Help".translate()}</a>
          <a 
            id="stContactSupport" 
            href="https://profitori.com/contactus" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            {"Contact Support".translate()}
          </a>
        </div>
    let buttons = this.headerButtons()
    let toggleVeil = null
    if ( this.props.provideVeil ) {
      toggleVeil = 
        <Link id="veil" key="stToggleVeilButton" onClick={this.toggleVeil.bind(this)} className="stToggleVeilButton">
          <FontAwesomeIcon icon={faBars} />
        </Link>
      if ( ! this.state.unveiled )
        buttons = null
    }
    let plots = null
    if ( ! this.beforeLoadPending )
      plots = this.getPlots()
    if ( ! global.gApp.firstMaintOrList )
      global.gApp.firstMaintOrList = this
    return (
      <FormGroup className="stLevel3" key={this.name()}>
        <div className="pageTitle">
          {this.spinner()}
          {this.logo()}
          <div className="stPageTitleText" id="stPageTitleText">{title}</div>
          {toggleVeil}
          {contactSupport}
        </div>
        {buttons}
        <FormGroup className="stLevel4" id="stLevel4">
          <FormGroup className="stLevel5" key={this.specname()}>
            {this.getParticulars()}
            {sep}
            {plots}
          </FormGroup>
        </FormGroup>
      </FormGroup>
    )
  }

}

class Plot extends React.Component {

  constructor(aProps) {
    super(aProps)
    this.state = {moldVersion: -1}
    this.allCasts = []
    this.casts = []
    this.version = 0
    this._fields = []
    this.fieldDataVersion = 0
  }

  situation() {
    return this.graph().situation()
  }

  berth() {
    return this.graph().berth()
  }

  refreshState() {
    if ( ! this.mounted ) return
    this.setState({moldVersion: this.mold().version, version: this.version})
  }

  componentDidMount() {
    this.mounted = true
  }

  componentWillUnmount() {
    this.mounted = false
  }

  createField(aParms) { /* Plot */
    let Field = global.gApp.getFieldClass()
    let f = new Field(aParms.name)
    f.datatype = aParms.datatype
    if ( aParms.caption )
      f.caption = aParms.caption
    f.realm = aParms.realm
    f.numeric = aParms.numeric
    f.date = aParms.date
    f.decimals = aParms.decimals
    f.minDecimals = aParms.minDecimals
    f.maxDecimals = aParms.maxDecimals
    f.showTotal = aParms.showTotal
    f.readOnly = aParms.readOnly
    return f
  }

  callerCast() {
    let res = this.props.callerCast
    if ( ! res )
      res = global.gApp.getAncestorCallerCast()
    return res
  }

  callerSpecname() {
    return this.props.callerSpecname
  }

  async doBeforeForward(aOptions) {
    let f = this.props.beforeForward
    if ( ! f ) return true
    return await f(aOptions);
  }

  async segueToDestination(aFromCast, aDestCast, aAct, aSpecname) {
    if ( await global.gApp.preventInteractionWhenBusy() ) return
    let Operation = global.gApp.getOperationClass()
    if ( aFromCast )
      aFromCast.__mold.lastSeguedCast = aFromCast
    let callerCast = aFromCast
    let callerSpecname = this.containerSpecname()
    let ok = await this.doBeforeForward(); if ( ! ok ) return
    this.forward(
      new Operation(aSpecname, aAct, this.containerSpecname(), this.isWithinAMaint(), true), 
      aDestCast, 
      null,
      callerCast,
      callerSpecname
    )
  }

  async segue(aAct, aSpecname, aParm) {
    let Operation = global.gApp.getOperationClass()
    if ( await global.gApp.preventInteractionWhenBusy() ) return
    let parentCast
    let cast
    let callerCast
    let callerSpecname = this.a().specname
    this.forward(
      new Operation(aSpecname, aAct, this.props.attributes.specname, false), 
      cast, 
      parentCast,
      callerCast,
      callerSpecname,
      aParm
    )
  }

  key() {
    return this.props.attributes.key
  }

  containerSpecname() {
    return this.props.containerSpecname
  }

  containerCast() {
    return this.props.containerCast
  }

  containerIsReadOnly() {
    let m = this.props.maint; if ( ! m ) return false
    return m.readOnly()
  }

  containerReadOnlyMessage() {
    let m = this.props.maint; if ( ! m ) return false
    return m.readOnlyMessage()
  }

  showSpinner(aOptions) {
    let immediate = true
    if ( aOptions && aOptions.delayOnMaints && this.props.maint )
      immediate = false
    global.showSpinner(this.graph(), {immediate: immediate})
  }

  hideSpinner() {
    global.hideSpinner(this.graph())
  }

  getDataAsArray() { /* Plot */
    let res = []
    this.casts.forAll(c => {
      let nc = {}
      let fields = this.fields()
      let len = fields.length
      for ( var i = 0; i < len; i++ ) {
        let f = fields[i]
        if ( f.hidden ) continue
        nc[f.caption] = this.fieldToExtractValue(f, c)
      }
      res.push(nc)
    })
    return res
  }

  fieldNameToDisplayValue(aName, aCast, aOptions) { /* Plot */
    let f = this.nameToField(aName); if ( ! f ) return ''
    let res = this.fieldNameToValue(aName, aCast)
    if ( f.numeric && (res === global.unknownNumber()) )
      return "Unknown".translate()
    if ( f.date )  {
      if ( res === global.emptyYMD() ) 
        return ''
      res = res.toLocalDateDisplayText()
    }
    if ( f.decimals || (f.decimals === 0) )
      res = global.numToStringWithXDecimals(res, f.decimals, {thousandSep: true})
    if ( f.minDecimals || (f.minDecimals === 0) )
      res = global.numToStringWithMinXDecimals(res, f.minDecimals, f.maxDecimals, {thousandSep: true})
    res += ''
    if ( f.translateOnDisplay )
      res = res.translate()
    return res
  }

  fieldNameToValue(aName, aCast) { /* Plot */
    let f = this.nameToField(aName); if ( ! f ) return ''
    let res = aCast[aName]
    if ( ! global.isObj(res) ) 
      return this.safeValue(res)
    let val = res.keyval
    if ( res.id && res.datatype ) {
      let m = global.foreman.doNameToMold(res.datatype)
      if ( m && m.holdingAllCasts ) {
        let refCast = m.quickIdToCast(res.id)
        if ( refCast && res.keyname )
          val = refCast[res.keyname]
        else
          val = res.id
      }
    }
    return this.safeValue(val)
  }

  fieldToExtractValue(aField, aCast) {
    let f = aField; if ( ! f ) return ''
    let res = this.fieldNameToValue(f.name, aCast)
    if ( f.numeric && (res === global.unknownNumber()) )
      return "Unknown".translate()
    if ( f.decimals || (f.decimals === 0) )
      res = global.numToStringWithXDecimals(res, f.decimals, {forceDot: true})
    if ( f.minDecimals || (f.minDecimals === 0) )
      res = global.numToStringWithMinXDecimals(res, f.minDecimals, f.maxDecimals, {forceDot: true})
    if ( f.translateOnDisplay )
      res = (res + '').translate()
    if ( f.numeric )
      res = parseFloat((res + ''), 10)
    return res
  }

  getKeyId() {
    return this.nameToId(this.key())
  }

  nameToId(aName) {
    return aName.toId()
  }

  fields() {
    return this._fields
  }

  async prepareFields() {
    this._fields = []
    this._fields.appendArray(this.props.attributes.fields)
    await this.prepareDynamicFieldCaptions()
    let fn = this.props.modifyFields; 
    if ( ! fn ) return
    await fn(this, this._fields)
  }

  async prepareDynamicFieldCaptions() {
    await this._fields.forAllAsync(async f => {
      let fn = f.captionFunction; if ( ! fn ) return "continue"
      f.caption = await fn(this.graph())
    })
  }

  allowFieldInput(aField) {
    if ( this.props.alter ) {
      //let maintField = aField.toMaintField(); if ( ! maintField ) return false
      //return ! maintField.isReadOnly()
      return ! aField.isReadOnly()
    }
    if ( aField.allowInput )
      return true
    let res = this.isWithinAMaint() && (! aField.isReadOnly()) && (! this.containerIsReadOnly())
    return res
  }

  fieldHasFocus(aField, aCast) {
    let el = document.activeElement; if ( ! el ) return false
    let id = this.fieldToId(aField, aCast)
    return el.id === id
  }

  fieldToId(aField, aCast) {
    return global.cleanStr(aField.englishCaption) + "-" + aCast.id
  }

  onBlur(aEvent) {
    //this.refreshState()
  }

  onChange(aCastId, aEvent, aValue, aOptions) { /* Plot */
    let t = aEvent.target
    let val = aValue || t.value
    let name = t.name
    name = name.stripLeft("stocktend_").stripAfterLast("-")
    let f = this.nameToField(name)
    let c = this.idToCast(aCastId); if ( ! c ) return
    let oldVal = c[name]
    f.setCastPropValue(c, val)

    let finish = () => {
      if ( f.isKey )
        c["wp_post_title"] = val
      c.refreshCalculations({force: true, keepState: true}).then(() => {
        //this.refreshState()
      })
    }

    let res = f.doAfterUserChange(oldVal, val, c, this.graph())
    if ( global.isPromise(res) ) {
      res.then(finish)
    } else 
      finish()
  }

  mold() {
    let p = this.props
    let moldName = p.attributes.datatype
    let m = global.foreman.doNameToMold(moldName)
    return m
  }

  idToCast(aId) {
    return this.mold().idToCast(aId)
  }

  primaryDatatype() {
    return this.props.attributes.datatype
  }

  async fieldAndPrimaryCastIdToCast(aField, aPrimaryCastId) {
    let id = aPrimaryCastId
    if ( aField.datatype !== this.primaryDatatype() )
      id = await this.datatypeAndPrimaryCastIdToJoinedCastId(aField.datatype, aPrimaryCastId); if ( ! id ) return null
    let res = await aField.datatype.bringSingle({id: id})
    return res
  }

  async datatypeAndPrimaryCastIdToJoinedCastId(aDatatype, aPrimaryCastId) {
    let res
    if ( ! this.hasJoin() ) return null
    if ( this.hasBackJoin() ) {
      res = await this.castIdToBackJoinedCastId(aPrimaryCastId)
      return res
    }
    res = await this.castIdToForwardJoinedCastId()
    return res
  }

  async castIdToBackJoinedCastId(aCastId) {
    let primaryDt = this.primaryDatatype()
    let primaryCast = this.idToCast(aCastId); if ( ! primaryCast ) return null
    let fields = this.fields()
    for ( var i = 0; i < fields.length; i++ ) {
      let field = fields[i]
      let dt = field.datatype
      if ( dt === primaryDt ) continue
      let rt = field.refersTo
      if ( ! rt ) continue
      let m = global.foreman.doNameToMold(dt); if ( ! m ) return null
      let jc = await dt.bringOrCreate({[m.key]: primaryCast})
      return jc.id
    }
  }

  async castIdToForwardJoinedCastId(aCastId) {
    let firstFieldNeedingJoin = this.fields().filterSingle(f => f.datatype !== this.datatype()); if ( ! firstFieldNeedingJoin ) return
    let joinDatatype = firstFieldNeedingJoin.datatype
    let primaryCast = this.idToCast(aCastId); if ( ! primaryCast ) return null
    let joinField = this.fields().filterSingle(f => (f.datatype === this.datatype()) && (f.refersToDatatype() === joinDatatype))
    let ref = primaryCast[joinField.name]; if ( ! ref ) return null
    return ref.id
  }

  nameToField(aName) {
    return this.fields().filterSingle(f => f.name === aName)
  }

  safeValue(aVal) {
    if ( (! aVal) && (aVal !== 0) ) return ''
    return aVal
  }

  actionToCaption(aAction, aIdx, aCast) { /* Plot */
    let caption = aAction.caption || aAction.name
    if ( aAction.tagOrFunction === "trash" )
      caption = this.garnishTrashCaption(aIdx, aCast, aAction.englishName)
    return caption
  }

  name() {
    return this.a().name
  }

  async waitForServerIdle() {
    while ( global.gServer.waitingCount > 0 ) {
      await global.wait(100);
    }
  }

  async modifyMoldFields() {
    let fn = this.a().modifyMoldFields; if ( ! fn ) return
    await this.waitForServerIdle()
    let m = this.mold()
    let fieldsAdded = await fn(m)
    if ( fieldsAdded )
      m.initCasts()
  }

  async refreshData() {
    if ( global.usingDifferentForeman ) return
    if ( this.refreshingData ) return
    this.refreshingData = true
    this.showSpinner({delayOnMaints: true})
    try {
      let p = this.props
      this.forward = p.forward
      this.showMessage = p.showMessage
      let critObj
      let mold = this.mold()
      let fieldsNeedRefreshing = (! this.fieldsRefreshed) || (global.stLastFacetChangeTime !== this.facetChangeTimeAtLastRefreshFields)
      if ( fieldsNeedRefreshing ) {
        await this.modifyMoldFields()
        this.fieldsRefreshed = true
        this.facetChangeTimeAtLastRefreshFields =  global.stLastFacetChangeTime
      }
      critObj = await this.getCritObj()
      let options = null
      let ssn = this.a().limitToSubsetName
      if ( ssn )
        options = {subsetName: ssn}
      this.allCasts = await mold.retrieve(critObj, options)
      await mold.refreshCalculations({casts: this.allCasts, point: 12, includeDefers: true})
      await this.filterData()
      await this.doAfterFieldCalculations()
      this.lastMoldVersion = mold.version
      await this.refreshJoinedData()
      this.casts = this.allCasts
      this.version++
      execDeferred(() => this.refreshState(), {noSpinner: true})
    } finally {
      this.hideSpinner()
      this.refreshingData = false
    }
  }

  async doAfterFieldCalculations() {
    let fn = this.a().afterFieldCalculations
    if ( ! fn ) return
    await fn(this.allCasts, this.graph())
  }

  a() {
    return this.props.attributes
  }

  async filterData() { // Plot
    let f = this.a().filter
    if ( ! f ) return
    let filteredCasts = []
    let len = this.allCasts.length
    for ( var i = 0; i < len; i++ ) {
      let cast = this.allCasts[i]
      let ok = await f(cast, this.graph())
      if ( ! ok ) continue
      filteredCasts.push(cast)
    }
    this.allCasts = filteredCasts
  }

  async shouldCreateJoinWhenNonexistent(aCast) {
    let f = this.props.attributes.createJoinWhen
    if ( ! f )
      return false
    let res = await f(aCast)
    return res
  }

  async refreshJoinedData(aOptions) {
    if ( ! this.hasJoin() ) return
    if ( this.hasBackJoin() ) {
      await this.refreshBackJoinedData(aOptions)
      return
    }
    await this.refreshForwardJoinedData(aOptions)
  }

  datatype() {
    return this.props.attributes.datatype
  }

  hasJoin() {
    return this.fields().exists(f => f.datatype !== this.datatype())
  }

  hasBackJoin() {
    let res = this.fields().exists(f => f.refersToDatatype() === this.datatype())
    return res
  }

  async refreshForwardJoinedData(aOptions) {
    let casts = this.allCasts
    if ( aOptions && aOptions.casts )
      casts = aOptions.casts
    let len = casts.length
    let firstFieldNeedingJoin = this.fields().filterSingle(f => f.datatype !== this.datatype()); if ( ! firstFieldNeedingJoin ) return
    let joinDatatype = firstFieldNeedingJoin.datatype
    let m = global.foreman.doNameToMold(joinDatatype)
    this._joinMold = m
    let joinField = this.fields().filterSingle(f => (f.datatype === this.datatype()) && (f.refersToDatatype() === joinDatatype))
    for ( var i = 0; i < len; i++ ) {
      let cast = casts[i]
      let ref = cast[joinField.name]; if ( ! ref ) continue
      let jc = await joinDatatype.bringSingle({id: ref.id}); if ( ! jc ) continue
      let keepDt = cast._datatype
      let id = cast.id
      let parentId = cast.parentId
      cast.copyFromJoin(jc)
      cast.id = id
      cast.parentId = parentId
      cast._datatype = keepDt
    }
  }

  async refreshBackJoinedData(aOptions) {
    let noSpinner = aOptions && aOptions.noSpinner
    let createIfNonexistent = aOptions && aOptions.createIfNonexistent
    if ( ! noSpinner )
      this.showSpinner()
    try {
      let casts = this.allCasts
      if ( aOptions && aOptions.casts )
        casts = aOptions.casts
      let len = casts.length
      let fields = this.fields() //this.props.attributes.fields
      for ( var i = 0; i < len; i++ ) {
        let cast = casts[i]
        let flen = fields.length
        for ( var j = 0; j < flen; j++ ) {
          let field = fields[j]
          let dt = field.datatype
          if ( dt === cast._datatype ) continue
          let rt = field.refersTo
          if ( rt ) {
            let m = global.foreman.doNameToMold(dt)
            this._joinMold = m
            let jc
            jc = m.fastRetrieveSingle({[m.key]: cast})
            if ( (jc === "na") || ((! jc) && createIfNonexistent) ) {
              let lazyJoin = (! createIfNonexistent) && (! await this.shouldCreateJoinWhenNonexistent(cast))
              if ( lazyJoin ) {
                jc = await dt.bringSingle({[m.key]: cast})
              } else {
                jc = await dt.bringOrCreate({[m.key]: cast})
              }
            }
            if ( ! jc ) continue
            let keepDt = cast._datatype
            let id = cast.id
            let parentId = cast.parentId
            cast.copyFromJoin(jc)
            cast.id = id
            cast.parentId = parentId
            cast._datatype = keepDt
          }
          cast.setFieldValueToCorrectType(field)
        }
      }
    } finally {
      if ( ! noSpinner )
        this.hideSpinner()
    }
  }
  
  async getCritObj() { /* Plot */
    let fn = this.props.attributes.criteria
    if ( ! fn ) return null
    let f = fn.bind(this)
    let res = await f(this.graph())
    return res
  }

  isWithinAGraphWithHeader() {
    if ( this.props.graph )
      return this.props.graph.hasHeader()
    return false
  }

  headerButtons() { /* Plot */
    let res = []
    if ( ! this.isWithinAGraphWithHeader() ) return res
    let actions = this.props.attributes.actions
    for ( var i = 0; i < actions.length; i++ ) {
      let a = actions[i]
      if ( a.place !== "header" ) continue
      let f = this.headerActionToFunction(a); if ( ! f ) continue
      let key = this.nameToId(a.name)
      let btn = (
        <Button key={key} onClick={f} className="stHeaderButton mr-1">{a.name}</Button>
      )
      res.push(btn)
    }
    return res
  }

  headerActionToFunction(aAction) { /* Plot */
    let res = this.doHeaderActionToFunction(aAction)
    if ( aAction.spinner )
      res = global.gApp.wrapFunctionWithSpinner(res, this.graph())
    return res
  }

  doHeaderActionToFunction(aAction) { /* Plot */
    let awf = aAction.availableWhen
    if ( awf ) {
      let available = awf(this.containerCast())
      if ( ! available )
        return null
    }
    let tof = aAction.tagOrFunction
    let m = this.graph()
    let c = this.containerCast()
    let f = tof.bind(this, m, c)
    if ( m.functionToTrackedFunction )
      return m.functionToTrackedFunction(f, c)
    return this.functionToRefreshingFunction(f)
  }

  functionToRefreshingFunction(aFn) {
    return this.execFunctionWithRefresh.bind(this, aFn)
  }

  async execFunctionWithRefresh(aFn) {
    this.showSpinner() 
    try {
      try {
        await aFn()
        this.version++
        this.refreshState()
      } catch(e) {
        this.showMessage(e.message)
        return
      }
    } finally {
      this.hideSpinner()
    }
  }

  graph() {
    return this.props.graph
  }

  getTitle() { /* Plot */
    if ( this.props.suppressTitle ) return 
    let a = this.props.attributes
    let res = a.title
    let dtf = a.dynamicTitle
    if ( dtf ) {
      let f = dtf.bind(this)
      let t = f()
      //let t = dtf(this)
      if ( t )
        res = t
    }
    if ( (! res) ) {
      let m = this.props.maint
      if ( m && (m.a().panelStyle === "titled") )
        res = a.name
    }
    return res
  }

  moldVersion() {
    let m = this.mold(); if ( ! m ) return
    return m.version
  }

  joinMoldVersion() {
    let m = this._joinMold; if ( ! m ) return 0
    return m.version
  }

  data(rawRes) {
/*
    let data = {
      labels: ["Africa", "Asia", "Europe", "Latin America", "North America"],
      datasets: [
        {
          label: "Population (millions)",
          backgroundColor: ["#3e95cd", "#8e5ea2","#3cba9f","#e8c3b9","#c45850"],
          data: [2478,5267,734,784,433]
        }
      ]
    }
*/
    let xFieldName = this.a().axes.x.field.name
    let yFieldName = this.a().axes.y.field.name
    let res = { labels: [], datasets: [ {data: [], backgroundColor: []} ] }
    let casts = this.allCasts
    let rawData = {}
    for ( var i = 0; i < casts.length; i++ ) {
      let cast = casts[i]
      let xValue = this.fieldNameToDisplayValue(xFieldName, cast)
      let yValue = this.fieldNameToValue(yFieldName, cast)
      let oldValue = rawData[xValue] || 0
      rawData[xValue] = oldValue + yValue
    }
    for ( var prop in rawData ) {
      res.labels.push(prop)
      res.datasets[0].data.push(rawData[prop])
      if ( this.style() !== "line" ) {
        let c = this.barColor(prop)
        res.datasets[0].backgroundColor.push(c)
      }
      if ( this.style() === "line" ) {
        res.datasets[0].backgroundColor = 'rgba(255, 99, 132, 0.2)'
      }
    }
    if ( rawRes )
      rawRes.data = rawData
    return res
  }

  barColor(val) {
    let f = this.a().barColorFunction
    if ( ! f ) 
      return this.getNextColor()
    let res = f(val)
    return res
  }

  getNextColor() {
    let colorList = [
      'rgba(255, 99, 132, 0.2)',
      'rgba(54, 162, 235, 0.2)',
      'rgba(255, 206, 86, 0.2)',
      'rgba(75, 192, 192, 0.2)',
      'rgba(153, 102, 255, 0.2)',
      'rgba(255, 159, 64, 0.2)',
      'rgba(255, 99, 132, 0.4)',
      'rgba(54, 162, 235, 0.4)',
      'rgba(255, 206, 86, 0.4)',
      'rgba(75, 192, 192, 0.4)',
      'rgba(153, 102, 255, 0.4)',
      'rgba(255, 159, 64, 0.4)',
      'rgba(255, 99, 132, 0.6)',
      'rgba(54, 162, 235, 0.6)',
      'rgba(255, 206, 86, 0.6)',
      'rgba(75, 192, 192, 0.6)',
      'rgba(153, 102, 255, 0.6)',
      'rgba(255, 159, 64, 0.6)'
    ]
    if ( ! this.nextColorIdx )
      this.nextColorIdx = 0
    let idx = this.nextColorIdx
    this.nextColorIdx++
    if ( this.nextColorIdx >= colorList.length )
      this.nextColorIdx = 0
    return colorList[idx]
  }

  onHover(event, chartElement) {
    let spec = this.a().drilldownSpecname; if ( ! spec ) return
    event.target.style.cursor = chartElement[0] ? 'pointer' : 'default';
  }

  options() {
    let xField = this.a().axes.x.field
    let yField = this.a().axes.y.field
    let options = {
      events: ['click', 'mousemove'],
      onClick: this.onClick.bind(this),
      onHover: this.onHover.bind(this),
      layout: {
        padding: {
          left: 0,
          right: 10,
          top: 40,
          bottom: 0
        }
      }
    }
    if ( (this.style() === "bar") || (this.style() === "line")  ) {
      options.legend = { display: false }
      options.scales = {
        yAxes: [{
          ticks: {
            beginAtZero: true
          },
          scaleLabel: { display: true, labelString: yField.caption }
        }],
        xAxes: [{
          scaleLabel: { display: true, labelString: xField.caption }
        }],
      }
    }
    return options
  }

  onClick(event, elements) {
    let spec = this.a().drilldownSpecname; if ( ! spec ) return
    if ( ! elements ) return
    if ( ! elements.length ) return
    let element = elements[0]
    let idx = element._index; if ( idx < 0 ) return
    let chart = element._chart; if ( ! chart ) return
    let labels = chart.config.data.labels
    let label = labels[idx]
    this.segue('view', spec, label)
  }
  
  style() {
    return this.props.graph.a().style
  }

  getChartClass() {
    if ( this.style() === "pie" )
      return Pie
    if ( this.style() === "line" )
      return Line
    return Bar
  }

  render() { /* Plot */
    global.gApp.currentSituation.sheet.plot = this
    let p = this.props
    let newPlot = (p.specname !== this.specname) || (p.manifestName !== this.manifestName) ||
      (p.containerCastId !== this.containerCastId) || (this.forwardNo !== global.forwardCount)
    if ( newPlot || (this.moldVersion() !== this.lastMoldVersion) || (this.joinMoldVersion() !== this.lastJoinMoldVersion)) {
      this.specname = p.specname
      this.manifestName = p.manifestName
      this.containerCastId = p.containerCastId
      this.forwardNo = global.forwardCount
      this.lastMoldVersion = this.moldVersion()
      this.lastJoinMoldVersion = this.joinMoldVersion()
      let mol = this.graph()
      mol._plot = this
      if ( newPlot && (! this.refreshingData) ) {
        this.casts = []
      }
      if ( newPlot ) {
        this.prepareFields().then(() => { 
          execDeferred(this.refreshData.bind(this)) 
        })
      } else {
        execDeferred(this.refreshData.bind(this), {noSpinner: true}) 
      }
    }
    else if ( p.containerVersion && (p.containerVersion !== this.containerVersion) ) {
      this.containerVersion = p.containerVersion
      execDeferred(this.refreshData.bind(this), {noSpinner: true}) 
    }
    else if ( this.fieldDataVersion && (this.fieldDataVersion !== this.lastFieldDataVersion) ) {
      this.lastFieldDataVersion = this.fieldDataVersion
      execDeferred(this.refreshData.bind(this), {noSpinner: true}) 
    }
    if ( p.disableInputs !== this.disableInputs ) {
      this.disableInputs = p.disableInputs
      execDeferred(this.refreshState.bind(this), {noSpinner: true})
    }
    let id = "mainPlot"
    if ( this.manifestName )
      id = this.nameToId(this.manifestName)
    let title = this.getTitle()
    if ( title )
      title = title.translate()
    let headerButtons = this.headerButtons()
    let hb
    if ( headerButtons.length > 0 )
      hb = (
        <Row className="stPlotHeaderButtons">
          {headerButtons}
        </Row>
      )
    let rawData = {}
    let data = this.data(rawData)
    let options = this.options()
    let Chart = this.getChartClass()
    let res = (
      <div className="stPlot" key="stPlot" id="stPlot" data-plot={JSON.stringify(rawData.data)}>
        <div className="stPlotTitle">{title}</div>
        {hb}
        <Chart
          id={id}
          data={data}
          options={options}
        />
      </div>
    )
    return res
  }

}

import React from 'react'
import ReactDOM from 'react-dom';
import Tester from './Tester.js'
import { Label, Button, FormGroup, FormText, Table, Input, Modal, ModalHeader, ModalBody, ModalFooter, 
  Container, Row, Spinner, Progress, InputGroup, InputGroupAddon, InputGroupText, ButtonDropdown, 
  DropdownItem, DropdownToggle, DropdownMenu } from 'reactstrap'
import { forAll } from './Functions.js'
import Link from './Link.js'
import DatePicker from './DatePicker.js'
import logo from './specs/images/profitori_logo_29x34.png'
import XLSX from 'xlsx'
import Writer from './Writer.js'
import Machine from './Machine.js'
import PremiumProxy from './PremiumProxy.js'
import Harmonizer from './Harmonizer.js'
import Feature from './Feature.js'
import Inlet from './Inlet.js'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBoxes, faPeopleArrows, faBars, faEye, faAngleLeft, faWarehouse, faFunnelDollar, faTruck, faFileInvoiceDollar, faHandHoldingUsd,
  faChartLine, faDollarSign, faCheckDouble, faSave, faPlus, faSync, faArrowDown, faEdit, faBoxOpen, faLayerGroup, faHistory, faCoins,
  faHandPointRight, faUserFriends, faCubes, faThList, faCog, faBalanceScale, faLock, faPaperclip, faShoppingBasket,
  faListAlt, faMagic, faHashtag, faSearch, faLightbulb } from '@fortawesome/free-solid-svg-icons'
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
require('./Globals.js')

/* eslint-disable no-cond-assign */

let gIncludeTestButtons = false
let gLogSaves = false
let gLogClientRetrieves = false
let gLogServerRetrieves = false
let gLogTimings = false
let gNextTempId = -1
let gMenu
let gApp
let gLatestInputField
let gLatestInputValue
let gLatestInputCast
let gTimes = {}
let gLastTime
let gLastTimeNo = 0

class STTime {
  constructor(aNo, aMt) {
    this.total = 0
    this.totalWhileWaitingForServer = 0
    this.no = aNo
    this.knt = 0
    this.forerunners = {}
    this.max = 0
  }
}

function tc(aNo) {
  if ( ! gLogTimings ) return
  let secs = performance.now() / 1000
  if ( ! gLastTime )
    gLastTime = secs
  if ( ! gTimes[aNo] )
    gTimes[aNo] = new STTime(aNo, secs)
  let t = gTimes[aNo]
  let elapsed = secs - gLastTime
  if ( gServer.waitingCount > 0 )
    t.totalWhileWaitingForServer = t.totalWhileWaitingForServer + elapsed
  t.total = t.total + elapsed
  t.knt++
  let frTotal = t.forerunners[gLastTimeNo]
  if ( ! frTotal ) 
    frTotal = 0
  frTotal = frTotal + elapsed
  t.forerunners[gLastTimeNo] = frTotal
  if ( elapsed > t.max )
    t.max = elapsed
  gLastTime = secs
  gLastTimeNo = aNo
}

global.stTc = tc

function tcReport(aPoint) {
  if ( ! gLogTimings ) return
  tc(999)
  let times = []
  for ( var key in gTimes ) {
    let time = gTimes[key]
    if ( ! time ) continue
    times.push(time)
  }
  times.sort((a, b) => a.total > b.total ? -1 : 1)
  "".m()
  "TIMES".m(aPoint)
  "-----".m()
  times.forAll(t => {
    if ( ! t ) return 'continue'
    let s = Math.round(t.total * 1000) / 1000;
    let sw = Math.round(t.totalWhileWaitingForServer * 1000) / 1000;
    if ( (s + sw) === 0 ) return 'continue'
    let frs = "("
    for ( var frNo in t.forerunners ) {
      let frSecs = Math.round(t.forerunners[frNo] * 1000) / 1000;
      frs = frs + frNo + ":" + frSecs + " "
    }
    frs = frs + ")"
    let max = Math.round(t.max * 1000) / 1000
    console.log(t.no + "\t" + s + "\t" + t.knt + "\t[" + sw + "]\t" + frs + " max: " + max)
  })
  "=====".m(aPoint)
  "".m()
  gTimes = {}
  gLastTime = null
  global.tcCount = 0
  tc(1)
}

let gDeferredCount = 0

/*
let trackDeferred = fn => {
  if ( ! global.deferreds )
    global.deferreds = {}
  global.deferreds[fn.toString()] = true
}

let untrackDeferred = fn => {
  global.deferreds[fn.toString()] = false
}

global.logDeferreds = () => {
  for ( var d in global.deferreds ) {
    if ( ! global.deferreds[d] ) continue
    "logDeferreds d".m(d)
  }
}
*/

let doExecDeferred = (aFn, aOptions, aSpinnerRef) => {
  aFn()
//untrackDeferred(aFn)
  gDeferredCount--
  if ( gDeferredCount === 0 ) {
    gApp.restoreScrollTop()
  }
  if ( aOptions && aOptions.noSpinner ) return
  gHideSpinner(aSpinnerRef)
}

let execDeferred = (aFn, aOptions) => {
  gDeferredCount++
//trackDeferred(aFn)
  let ms = 0
  if ( aOptions && aOptions.ms )
    ms = aOptions.ms
  let forceSpinner = aOptions && aOptions.forceSpinner
  if ( forceSpinner && (ms === 0) )
    ms = 1000
  let spinnerRef = gApp.firstMaintOrList
  setTimeout(doExecDeferred.bind(this, aFn, aOptions, spinnerRef), ms)
  if ( aOptions && aOptions.noSpinner ) return
  gShowSpinner(spinnerRef, {immediate: forceSpinner})
}

global.prfiExecDeferred = execDeferred

let yes = (aVal) => {
  return aVal === "Yes"
}

let no = aVal => {
  return ! yes(aVal)
}

global.yes = yes
global.no = no

global.thereAreDeferredTasks = () => {
  return (gDeferredCount > 0)
}

global.cleanStr = (aStr) => {
  if ( ! aStr ) return aStr
  let res = aStr.replace(/[.,/#!$%^&*;:{}=\-`~()\s]/g, "")
  res = res[0].toLowerCase() + res.substr(1, 9999)
  return res
}

global.prfiProgressCount = 0

function setShowSpinner(aContainer, aVal) {
  aContainer.spinnerIsShowing = aVal
}

function refreshSpinnerElement(aContainer) {
  let id = aContainer.a().name.toId() + "Spinner"
  let spinner = document.getElementById(id)
  if ( spinner ) {
    if ( aContainer.spinnerIsShowing ) {
      spinner.style.display = "flex"
    } else
      spinner.style.display = "none"

    // Force DOM refresh
    let parent = spinner.parentElement
    parent.style.display = "none"
    parent.style.display = "flex"
  }
}

function refreshSpinner(aContainer, aOptions) {
  let was = aContainer.spinnerIsShowing
  if ( ! aContainer.waitStartMs ) aContainer.waitStartMs = 0
  if ( ! aContainer.waitCount ) aContainer.waitCount = 0
  let waitMs = global.nowMs() - aContainer.waitStartMs
  let delayMs = 400
  if ( aOptions && aOptions.immediate )
    delayMs = 0
  let show = (aContainer.waitCount > 0) && (was || (waitMs >= delayMs))
  setShowSpinner(aContainer, show)
  //if ( aContainer.waitCount <= 0 )
    //tcReport("End of waiting period")
  if ( was === aContainer.spinnerIsShowing ) {
    refreshSpinnerElement(aContainer)
    if ( aContainer.waitCount <= 0 ) {
      aContainer.refreshState()
      return
    }
    execDeferred(() => refreshSpinner(aContainer), {noSpinner: true, ms: 50})
    return
  }
  if ( ! aContainer.a ) return
  refreshSpinnerElement(aContainer)

  aContainer.refreshState()
}

function gShowSpinner(aContainer, aOptions) {
  let c = aContainer ? aContainer : gApp.firstMaintOrList; if ( ! c ) return
  if ( ! c.waitCount ) 
    c.waitCount = 0
  c.waitCount++
  if ( ! global.prfiWaitCount )
    global.prfiWaitCount = 0
  global.prfiWaitCount++
  if ( (c.waitCount > 1) && c.spinnerIsShowing ) 
    return c
  c.waitStartMs = global.nowMs()
  if ( aOptions && aOptions.immediate ) {
    refreshSpinner(c, aOptions)
  } else
    execDeferred(() => refreshSpinner(c, aOptions), {noSpinner: true, ms: 10})
  return c
}

function gHideSpinner(aContainer) {
  if ( ! global.prfiWaitCount )
    global.prfiWaitCount = 0
  global.prfiWaitCount--
  if ( ! aContainer ) return
  if ( ! aContainer.waitCount ) 
    aContainer.waitCount = 0
  aContainer.waitCount-- 
  if ( aContainer.waitCount > 0 ) 
    return
  execDeferred(() => refreshSpinner(aContainer), {noSpinner: true})
}

function startProgress(aOptions) {
  if ( ! global.isObj(aOptions) ) throw(new Error("Parameter to startProgress must be an object"))
  global.prfiProgressCount++
  if ( global.prfiProgressCount > 1 ) return
  gApp.setState({showProgress: true, progress: 0, progressMessage: aOptions.message.translate()})
  global.prfiProgressVal = 0
}

function stopProgress() {
  global.prfiProgressCount--; if ( global.prfiProgressCount > 0 ) return
  gApp.setState({showProgress: false})
  global.prfiProgressVal = 0
}

async function updateProgress(aVal) {
  if ( global.prfiProgressCount > 1 ) return // don't clobber overall progress with nested progress
  gApp.setState({progress: aVal})
  if ( aVal < global.prfiProgressVal )
    return
  if ( (aVal - global.prfiProgressVal) < 0.05 )
    return
  global.prfiProgressVal = aVal
  await global.sleep(10)
}

global.startProgress = startProgress
global.stopProgress = stopProgress
global.updateProgress = updateProgress
global.showSpinner = gShowSpinner
global.hideSpinner = gHideSpinner

function wait(aMs) {
  return new Promise(r => execDeferred(r, {ms: aMs, noSpinner: true}));
}

global.wait = wait;

function addListener(element, eventName, handler) {
  if (element.addEventListener) {
    element.addEventListener(eventName, handler, false);
  }
  else if (element.attachEvent) {
    element.attachEvent('on' + eventName, handler);
  }
  else {
    element['on' + eventName] = handler;
  }
}

document.addEventListener("keydown", onDocumentKeyDown, false);

var gScanBuffer = ''
var gBufferStartMs = 0
var gScanElement
var gScanElementOriginalValue
global.prfiInScanMode = false

function onDocumentKeyDown(e) {
  onDocumentKeyCode(e.keyCode)
}

function activeElementId() {
  let el = document.activeElement
  return el ? el.id : null
}

function onDocumentKeyCode(keyCode) {

  if ( ! global.prfiInScanMode ) return
  let timeoutMs = 200

  let onDelay = (orig) => {
    if ( ! gApp ) return
    if ( orig !== gScanBuffer ) return // It's changed, so there's another onDelay coming
    // NOTE - we only get here if there has been a >= 200ms gap between chars - so it's either the user typing, or the end of a scan
    if ( gScanBuffer.length <= 2 ) { // Don't allow scans of 2 chars or less
      gScanBuffer = ''
      return
    }
    let ms = global.nowMs() - gBufferStartMs - timeoutMs
    let msPerChar = ms / gScanBuffer.length
    if ( msPerChar > 150 ) { // Looks like it wasn't a scan
      gScanBuffer = ''
      return
    }
    if ( gScanElement && (gScanElement.id === activeElementId()) ) 
      gScanElement.value = gScanElementOriginalValue
    gApp.processScan(gScanBuffer)
    gScanBuffer = ''
  }

  if ( ! global.keyCodeIsAlphanumeric(keyCode) ) return
  if ( ! gScanBuffer ) {
    gBufferStartMs = global.nowMs()
    gScanElement = document.activeElement
    gScanElementOriginalValue = gScanElement ? gScanElement.value : null
  }
  gScanBuffer += String.fromCharCode(keyCode)
  execDeferred(() => onDelay(gScanBuffer), {noSpinner: true, ms: timeoutMs})
}

export default class App extends React.Component {

  constructor(aProps) {
    tc(200)
    super(aProps)
    this.initialise()
    this.state = {rootVersion: gRootVersion, operation: this.defaultOperation, cast: {}}
    tc(201)
  }

  async save() {
    await Foreman.save()
  }

  async stockClue(parms) {
    if ( global.confVal('logChangesToStockForProblemDiagnosis') !== 'Yes' ) return
    let clue = await 'Clue'.create()
    let cast = parms.cast
    let old = cast.getOld()
    clue.date = global.todayYMD()
    clue.time = (new Date()).toLocaleTimeString()
    clue.clientOrServer = 'C'
    clue.user = this.user
    clue.point = parms.point
    clue.theDatatype = cast.datatype()
    clue.castId = cast.id
    clue.fieldName = parms.fieldName
    clue.newValue = cast[parms.fieldName]
    clue.oldValue = old ? old[parms.fieldName] : ''
    clue.reference = parms.reference
  }

  shouldHideSpec(specName) {
    if ( ! this.state ) return true
    if ( ! this.state.installCheckDone ) return true
    if ( ! specName ) return false
    if ( ( ! this.controlAccessAtPageLevel) || this.userHasAdminRights ) return false
    let cookedSpecName = specName.stripRight('.js')
    let specConfig = 'SpecConfig'.bringSingleFast({specName: cookedSpecName}); if ( ! specConfig ) return false
    let users = specConfig.usersWithAccessToSpec; if ( ! users ) return false
    users = "," + users.replace(" ", "") + ","
    if ( users.indexOf("," + this.user + ",") >= 0 )
      return false
    return true
  }

  shouldHideSpecWithMenuCaption(caption) {
    let specName = gMenu.captionToSpecname(caption); if ( ! specName ) return false
    let res = this.shouldHideSpec(specName)
    return res
  }

  nameToIcon(name, size) {
    let rawIcon
    if ( name === 'AngleLeft' )
      rawIcon = faAngleLeft
    else if ( name === 'CheckDouble' )
      rawIcon = faCheckDouble
    else if ( name === 'Eye' )
      rawIcon = faEye
    else if ( name === 'PeopleArrows' )
      rawIcon = faPeopleArrows
    else if ( name === 'Boxes' )
      rawIcon = faBoxes
    else if ( name === 'Warehouse' )
      rawIcon = faWarehouse
    else if ( name === 'FunnelDollar' )
      rawIcon = faFunnelDollar
    else if ( name === 'Truck' )
      rawIcon = faTruck
    else if ( name === 'FileInvoiceDollar' )
      rawIcon = faFileInvoiceDollar
    else if ( name === 'HandHoldingUsd' )
      rawIcon = faHandHoldingUsd
    else if ( name === 'DollarSign' )
      rawIcon = faDollarSign
    else if ( name === 'ChartLine' )
      rawIcon = faChartLine
    else if ( name === 'HandPointRight' )
      rawIcon = faHandPointRight
    else if ( name === 'UserFriends' )
      rawIcon = faUserFriends
    else if ( name === 'Cubes' )
      rawIcon = faCubes
    else if ( name === 'ThList' )
      rawIcon = faThList
    else if ( name === 'BoxOpen' )
      rawIcon = faBoxOpen
    else if ( name === 'LayerGroup' )
      rawIcon = faLayerGroup
    else if ( name === 'History' )
      rawIcon = faHistory
    else if ( name === 'Coins' )
      rawIcon = faCoins
    else if ( name === 'Cog' )
      rawIcon = faCog
    else if ( name === 'ListAlt' )
      rawIcon = faListAlt
    else if ( name === 'Magic' )
      rawIcon = faMagic
    else if ( name === 'Hashtag' )
      rawIcon = faHashtag
    else if ( name === 'BalanceScale' )
      rawIcon = faBalanceScale
    else if ( name === 'Lock' )
      rawIcon = faLock
    else if ( name === 'Paperclip' )
      rawIcon = faPaperclip
    else if ( name === 'ShoppingBasket' )
      rawIcon = faShoppingBasket
    else if ( name === 'Search' )
      rawIcon = faSearch
    else if ( name === 'LightBulb' )
      rawIcon = faLightbulb
    if ( rawIcon )
      return <span className="prfiButtonIcon"><FontAwesomeIcon icon={rawIcon} size={size} /></span>
    return null
  }

  actionToIcon(action) {
    let rawIcon
    if ( action.icon )
      return this.nameToIcon(action.icon)
    if ( action.tagOrFunction === 'cancel' )
      rawIcon = faAngleLeft
    else if ( action.tagOrFunction === 'ok' )
      rawIcon = faCheckDouble
    else if ( action.tagOrFunction === 'okNoSave' )
      rawIcon = faCheckDouble
    else if ( action.tagOrFunction === 'save' )
      rawIcon = faSave
    else if ( action.tagOrFunction === 'add' )
      rawIcon = faPlus
    else if ( action.tagOrFunction === 'addNoSave' )
      rawIcon = faPlus
    else if ( action.tagOrFunction === 'refresh' )
      rawIcon = faSync
    else if ( action.tagOrFunction === 'excel' )
      rawIcon = faArrowDown
    else if ( action.tagOrFunction === 'alter' )
      rawIcon = faEdit
    else if ( action.tagOrFunction === 'attachments' )
      rawIcon = faPaperclip
    if ( rawIcon )
      return <span className="prfiButtonIcon"><FontAwesomeIcon icon={rawIcon} /></span>
    return null
  }

  getSubscribeLink() {
    if ( global.isTrial )
      return <a id="stGoPro" href="https://profitori.com/pro/coupon" target="_blank" rel="noopener noreferrer">{"Subscribe".translate()}</a>
    return null
  }

  initialise() {
    this.initialising = true
    gApp = this
    global.gApp = this
    global.app = this
    this.monitorNavigation()
    global.forwardCount = 0
    this.createMoldsAndMenus().then(() => {
      this.refreshWPReferences()
      if ( ! this.defaultOperation )
        this.defaultOperation = new Operation("Home.js")
      this.addSituation(this.defaultOperation)
      this.currentSituation = this.situations.last()
      window.addEventListener("resize", this.onBrowserResize.bind(this))
      window.addEventListener('scroll', this.onScroll.bind(this))
      if ( this.mounted ) {
        this.setState({rootVersion: gRootVersion, operation: this.defaultOperation, cast: {}})
      }
      this.initialising = false
    })
  }

  menu() {
    return gMenu
  }

  getFieldClass() {
    return Field;
  }

  getParticularsClass() {
    return Particulars;
  }

  getComboboxClass() {
    return Combobox;
  }

  getOperationClass() {
    return Operation;
  }

  getFirstMaint() {
    let maintOrList = this.firstMaintOrList
    if ( maintOrList.a().componentName !== "Maint" ) return
    return maintOrList
  }

  simulateKeyDown(aCode) {
    onDocumentKeyCode(aCode)
  }

  maxNormalButtons(aDiv) {
    let w = (window.innerWidth || document.documentElement.clientWidth) / aDiv
    let avgButtonWidth = 175
    let res = Math.round(w / avgButtonWidth) - 1
    if ( res > 6 )
      res = 6
    return res
  }

  async processScan(aStr) {
    if ( ! global.prfiInScanMode ) 
      return
    let maint = this.getFirstMaint(); if ( ! maint ) return
    if ( maint.initialising ) 
      return
    let str = aStr.stripRight('\n')
    str = str.stripRight('\r')
    await maint.processScan(str)
  }

  wrapFunctionWithSpinner(aFunction, aMaintOrList) {
    let res = async () => {
      gShowSpinner(aMaintOrList, {immediate: true})
      try {
        await aFunction()
      } finally {
        gHideSpinner(aMaintOrList)
      }
    }
    return res
  }

  onScroll() {
    if ( this.stale ) return
    if ( this !== gApp ) return
    if ( this.anyFillinIsShowing() )
      this.forceUpdate()
  }

  anyFillinIsShowing() {
    return this.idIsShowing("stFillin0") || this.idIsShowing("stFillin19") ||
      this.idIsShowing("stComboFillin0") || this.idIsShowing("stComboFillin19")
  }

  idIsShowing(aId) {
    let el = document.getElementById(aId); if ( ! el ) return false
    let rect = el.getBoundingClientRect()
    let h = window.innerHeight || document.documentElement.clientHeight
    let w = window.innerWidth || document.documentElement.clientWidth
    return (
      rect.bottom > 0 &&
      rect.right > 0 &&
      rect.top < h &&
      rect.left < w
    )
  }

  async harmonize(aOptions) { /* App */
    let h = new Harmonizer()
    await h.harmonize(aOptions)
    //tcReport()
  }

  async pingServer() {
    await 'Null'.bring(null, {forceServerRetrieve: true})
  }

  onBrowserResize() {
    this.forceUpdate()
  }

  modifyWPMenu() {
    let items = this.getWPMenuElements()
    forAll(items).do(item => {
      let specname = this.wpMenuItemToSpecname(item)
      if ( this.shouldHideSpec(specname) ) {
        item.style.display = "none"
        return 'continue'
      }
      addListener(item, 'click', this.onWPMenuClick.bind(this, item))
      let href = item.href
      if ( href ) {
        item.removeAttribute("href")
        let pos = href.indexOf("?page=")
        item.id = "stocktend_" + href.substring(pos + 16, 9999).toId()
      }
    })
  }

  getTotalVertMarginPx(aEl) {
    let s = window.getComputedStyle(aEl)
    let marginTop = this.pxStrToInt(s.getPropertyValue("margin-top"))
    let marginBottom = this.pxStrToInt(s.getPropertyValue("margin-bottom"))
    return marginTop + marginBottom;
  }

  pxStrToInt(aStr) {
    let res = (aStr + "").stripRight("px")
    res = parseInt(res, 10)
    return res
  }

  wpMenuItemIsDefault(aItem) {
    return aItem.innerHTML === this.defaultWPMenuCaption
  }

  getWPMenuElements() {
    let menuRoot = document.getElementById("toplevel_page_profitori"); if ( ! menuRoot ) return []
    let res = menuRoot.getElementsByTagName("A")
    return res
  }

  onWPMenuClick(aMenuItem, arg2) {
    if ( this !== gApp ) return
    this.currentWPMenuItem = aMenuItem
    let specname = this.wpMenuItemToSpecname(aMenuItem); if ( ! specname ) return
    let f = this.specnameToFunction(specname)
    this.refreshWPMenuHighlighting()
    f()
  }

  invokeMenuByCaption(aCaption) {
    let specname = gMenu.captionToSpecname(aCaption); if ( ! specname ) return
    let f = this.specnameToFunction(specname)
    f()
  }

  refreshWPMenuHighlighting(options) {
    if ( options && options.fromFeatureInit )
      this.currentWPMenuItem = this.inferWPMenuItem()
    let items = this.getWPMenuElements()
    forAll(items).do(item => {
      let parent = item.parentElement
      if ( item === this.currentWPMenuItem ) {
        parent.classList.add('current')
      } else {
        parent.classList.remove('current')
      }
    })
  }

  getCurrentSpecname() {
    let currSit = this.currentSituation; if ( ! currSit ) return null
    return currSit.operation.specname
  }

  inferWPMenuItem() {
    let specname = this.getCurrentSpecname() ; if ( ! specname ) return null
    let caption = gMenu.specnameToCaption(specname); if ( ! caption ) return null
    return this.captionToWPMenuItem(caption)
  }

  captionToWPMenuItem(aCaption) {
    let items = this.getWPMenuElements()
    let res
    forAll(items).do(item => {
      if ( item.innerHTML === aCaption )
        res = item
    })
    return res
  }

  wpMenuItemToSpecname(aItem) {
    let caption = aItem.innerHTML
    let res = gMenu.captionToSpecname(caption)
    return res
  }

  refreshWPReferences() {
    let el = getRootParent(); if ( ! el ) return
    let caption = el.getAttribute("data-defaultcaption"); 
    if ( ! caption ) return
    this.defaultWPMenuCaption = caption
    this.currentWPMenuItem = this.captionToWPMenuItem(caption)
    let specname = gMenu.captionToSpecname(caption); if ( ! specname ) return
    this.defaultOperation = new Operation(specname)
  }

  monitorNavigation() {
    let self = this
    this.situations = []
    this.hash = window.location.hash;

    setInterval(
      function(){
        if ( ! self.mounted ) return
        if ( self.stale ) return
        let newHash = window.location.hash
        if ( newHash !== self.hash ) {
          if ( Server.isWaiting() || (global.prfiProgressCount > 0) ) 
            return
          global.doingBrowserBack = false 
          self.hash = newHash
          if ( ! self.hash ) {
            self.situations = []
            self.addSituation(this.defaultOperation)
            self.currentSituation = this.situations.last()
            self.setState({operation: self.defaultOperation, prompting: false})
            return
          }
          let s = self.hashToSituation(newHash); if ( ! s ) return
          if ( s === self.currentSituation ) return
          self.promptAndForward({to: s, from: self.currentSituation, goingBack: true})
        }
      }.bind(this), 
      100
    );
  }

  componentDidMount() {
    this.mounted = true
  }

  componentDidUpdate() { // App
  }

  componentWillUnmount() {
    this.mounted = false
  }

  async createMoldsAndMenus() {
    let m = new global.prfiMachineClass()
    new Menu()
    global.gCreatingMoldsAndMenus = true
    await m.createMoldsAndMenus()
    global.gCreatingMoldsAndMenus = false
  }

  newField(aName) {
    return new Field(aName)
  }

  runFactorySettings() {
    let t = new Tester()
    t.runFactorySettings()
  }

  runScanTests() {
    let t = new Tester()
    t.runScanTests()
  }

  runUomTests() {
    let t = new Tester()
    t.runUomTests()
  }

  runCoreTests() {
    let t = new Tester()
    t.runCoreTests()
  }

  runLabelTests() {
    let t = new Tester()
    t.runLabelTests()
  }

  runCRMTests() {;
    let t = new Tester()
    t.runCRMTests()
  }

  runBackboneTests() {
    let t = new Tester()
    t.runBackboneTests()
  }

  runBackbone2Tests() {
    let t = new Tester()
    t.runBackbone2Tests()
  }

  runBackbone3Tests() {
    let t = new Tester()
    t.runBackbone3Tests()
  }

  runBackbone4Tests() {
    let t = new Tester()
    t.runBackbone4Tests()
  }

  runHarmonizerTests() {
    let t = new Tester()
    t.runHarmonizerTests()
  }

  runSearchTests() {
    let t = new Tester()
    t.runSearchTests()
  }

  runAvgCostingTests() {
    let t = new Tester()
    t.runAvgCostingTests()
  }

  runGPTests() {
    let t = new Tester()
    t.runGPTests()
  }

  runLocTests() {
    let t = new Tester()
    t.runLocTests()
  }

  runMigTests() {
    let t = new Tester()
    t.runMigTests()
  }

  runAllTests() {
    let t = new Tester()
    t.runAllTests()
  }

  async backToFirstDifferentSpec(aOptions) {
    let currSit = this.currentSituation
    if ( ! currSit ) return
    let s = this.getLastSituationWithSpecOtherThan(currSit.operation.specname)
    if ( ! s ) {
      global.doingBrowserBack = true 
      window.history.back()
      return
    }
    this.situations.removeAfterElement(s)
    if ( aOptions && aOptions.promptIfUnsaved ) {
      this.promptAndForward({to: s, from: currSit, goingBack: true})
    } else {
      this.nakedForward(s)
    }
  }

  getLastSituationWithSpecOtherThan(aSpecname) {
    let sits = this.situations
    for ( var i = sits.length - 1; i >= 0; i-- ) {
      let s = sits[i]
      if ( s.operation.specname === aSpecname ) continue
      return s
    }
    return null
  }

  async forward(aOperation, aCast, aParentCast, aCallerCast, aCallerSpecname, aParm) { /* App */
    this.rememberScrollTop()
    let s = this.addSituation(aOperation, aCast, aParentCast, aCallerCast, aCallerSpecname, aParm)
    let cs = this.currentSituation
    if ( cs && (s.operation.specname === cs.operation.specname) ) {
      s.sortField = cs.sortField
      s.sortAscending = cs.sortAscending
    }
    this.nakedForward(s)
  }

  async menuForward(aOperation) {
    if ( this !== gApp )
      throw(new Error("menuForward called on stale App object"))
    tc(1000)
    let s = this.addSituation(aOperation)
    this.promptAndForward({to: s, from: this.currentSituation})
    tc(211)
  }

  async preventInteractionWhenBusy() {
    if ( ! this.installCheckComplete ) 
      await this.waitForInstallCheck({maxMs: 2500})
    if ( ! this.installCheckComplete ) {
      this.showMessage("Initializing - please wait then try again")
      return true
    }
    if ( this.installing ) {
      this.showMessage("Doing installation steps - please wait then try again")
      return true
    }
    if ( Server.isWaiting() )
      await this.waitForServer({maxMs: 1500})
    if ( Server.isWaiting() || (global.prfiProgressCount > 0) ) {
      this.showMessage("System is busy - please wait then try again")
      return true
    }
    return false
  }

  async waitForInstallCheck(aOptions) {
    let maxMs = aOptions.maxMs
    let startMs = global.nowMs()
    while ( true ) {
      if ( this.installCheckComplete )
        return
      if ( (global.nowMs() - startMs) > maxMs )
        return
      await global.sleep(10)
    }
  }

  async waitForServer(aOptions) {
    let maxMs = aOptions.maxMs
    let startMs = global.nowMs()
    while ( true ) {
      if ( ! Server.isWaiting() )
        return
      if ( (global.nowMs() - startMs) > maxMs )
        return
      await global.sleep(10)
    }
  }

  async promptAndForward(aParms) {
    if ( await this.preventInteractionWhenBusy() ) return
    let toSituation = aParms.to
    let fromSituation = aParms.from
    let currentMaintOrList = fromSituation && fromSituation.maintOrList()
    if ( currentMaintOrList ) {
      if ( ! currentMaintOrList.vassal() ) {
        if ( currentMaintOrList.thereAreUnsavedChanges() ) {
          this.nakedForwardWithConfirm(toSituation, aParms)
          return
        }
      } else {
        if ( currentMaintOrList.thereAreUnsavedChanges() ) {
          this.nakedForwardFromVassal(toSituation, aParms)
          return
        }
      }
      if ( currentMaintOrList.removeCastIfNew )
        currentMaintOrList.removeCastIfNew()
    }
    this.nakedForward(toSituation)
  }

  situationIsNextOneBack(aSituation) {
    let len = this.situations.length
    if ( len <= 1 ) return false
    let s = this.situations[len - 2]
    let res = (s.hash === aSituation.hash)
    return res
  }

  getAncestorCallerCast() {
    let sits = this.situations
    for ( var i = sits.length - 2; i >= 0; i-- ) {
      let sit = sits[i]
      if ( sit.callerCast )
        return sit.callerCast
    }
    return null
  }

  getFirstAncestorList(options) {
    let sits = this.situations
    let exclude = options && options.exclude
    for ( var i = sits.length - 2; i >= 0; i-- ) {
      let sit = sits[i]
      if ( sit.specname() === exclude ) continue
      if ( sit.isList() )
        return sit.sheet
    }
    return null
  }

  getCallerSituation() {
    let len = this.situations.length
    if ( len <= 1 ) return null
    return this.situations[len - 2]
  }

  async nakedForward(aSituation, aOptions) { /* App */
    global.forwardCount = global.forwardCount + 1
    this.currentSituation = aSituation
    window.location.hash = aSituation.hash
    this.hash = aSituation.hash
    this.cast = aSituation.cast
    this.parentCast = aSituation.parentCast
    this.callerCast = aSituation.callerCast
    this.callerSpecname = aSituation.callerSpecname
    this.setState({operation: global.copyObj(aSituation.operation), prompting: false})
    if ( (! global.lastHarmonizeMs) || (global.nowMs() - global.lastHarmonizeMs) > (5 * 60 * 1000) ) {
      if ( aSituation.operation.behaviour !== 'add' ) { // New record will cause validation error when saving any harmonized data
        await this.harmonize({lightweight: true})
      }
    }
  }

  nakedForwardWithConfirm(aSituation, aOptions) {
    this.forwardingToSituation = aSituation
    this.forwardingFromVassal = false
    this.goingBack = aOptions && aOptions.goingBack
    this.setState({prompting: true})
  }

  nakedForwardFromVassal(aSituation, aOptions) {
    this.forwardingToSituation = aSituation
    this.forwardingFromVassal = true
    this.goingBack = aOptions && aOptions.goingBack
    this.setState({prompting: true})
  }

  addSituation(aOperation, aCast, aParentCast, aCallerCast, aCallerSpecname, aParm) {
    let s = new Situation(aOperation, aCast, aParentCast, aCallerCast, aCallerSpecname, aParm)
    this.situations.removeAfterElement(this.currentSituation)
    this.situations.push(s)
    return s
  }

  hashToSituation(aHash) {
    return this.situations.filterSingle(s => s.hash === aHash);
  }

  priorHash() {
    let s = this.currentSituation; if ( ! s ) return ''
    let priorS = this.situationToPrior(s); if ( ! s ) return ''
    return priorS.hash
  }

  situationToPrior(aSituation) {
    let idx = this.situations.indexOf(aSituation); if ( idx < 0 ) return null
    if ( idx === 0 ) return null
    return this.situations[idx - 1]
  }

  showMessage(aMsg, aOptions) {
    if ( ! aMsg ) return
    console.log("***Showing Message: " + aMsg)
    this.setState({message: aMsg.translate(), messageOptions: aOptions})
  }

  closeMessage() {
    this.setState({message: null})
  }

  getFeature() {
    //tc(180)
    let op = this.state.operation; 
    if ( ! op )
      return (
        <div>   
          {"Loading...".translate()}
        </div>
      )
    let key = "feature"
    let s = this.currentSituation
    if ( s )
      key = s.hash
    let res = (
      <Feature 
        key={key}
        operation={op} 
        forward={this.forward.bind(this)} 
        showMessage={this.showMessage.bind(this)} 
        cast={this.cast}
        parentCast={this.parentCast}
        callerCast={this.callerCast}
        callerSpecname={this.callerSpecname}
        situation={this.currentSituation}
        installCheckDone={this.state.installCheckDone}
      />
    )
    //tc(181)
    return res
  }

  specnameToFunction(aSpecname) {
    let op = new Operation(aSpecname)
    let res = this.menuForward.bind(this, op)
    return res
  }

  cancelForward() {
    if ( (! this.goingBack) && (this.situations.last() === this.forwardingToSituation) ) {
      this.situations.removeElement(this.forwardingToSituation)
    }
    this.forwardingToSituation = null
    let hash = ''
    let s = this.currentSituation
    if ( s )
      hash = s.hash
    window.location.hash = hash
    this.setState({prompting: false})
  }

  async proceedWithForward() {
    if ( await this.preventInteractionWhenBusy() ) return
    if ( ! this.forwardingFromVassal ) {
      Foreman.cancelChanges()
      await 'Configuration'.bring() // Make sure this is re-cached
    } else {
      let maint = this.currentSituation.maint()
      if ( maint )
        maint.cancelChanges()
    }
    this.nakedForward(this.forwardingToSituation)
    this.forwardingToSituation = null
    this.goingBack = false
  }

  progress() {
    let s = this.state
    if ( ! s.showProgress ) return
    let pct = global.roundToXDecimals(5 + (s.progress * 90), 0)
    return (
      <div className="stProgress" 
        style={
          { height: this.progressHeightPixels() + "px", 
            marginTop: this.progressTopMarginPixels() + "px",
            marginBottom: this.progressBottomMarginPixels() + "px"
          }
        }
      >
        <Progress value={pct}/>
        <div className="stProgressMessage">{s.progressMessage}</div>
      </div>
    )
  }

  message() {
    let close = this.closeMessage.bind(this)
    let s = this.state
    let msg = s.message
    let isOpen = msg ? true : false
    let marker = isOpen ? (<div id="messageDialog"/>) : ''
    let btnText = "OK".translate()
    let mo = s.messageOptions
    let noBtn = null
    let btnId = "messageDialogOK"
    let btnClose = close
    let noClose = close
    if ( mo && mo.yesNo ) {
      btnText = "Yes".translate()
      btnId = "messageDialogYes"
      if ( mo.onNo )
        noClose = async () => { close(); mo.onNo() }
      noBtn = <Button color="primary" onClick={noClose} id="messageDialogNo">No</Button>
      btnClose = async () => { close(); mo.onYes() }
    }
    if ( mo && mo.onClick ) {
      btnClose = async () => { close(); mo.onClick() }
    }
    if ( mo && mo.buttonText )
      btnText = mo.buttonText
    let btn = <Button color="primary" onClick={btnClose} id={btnId}>{btnText}</Button>
    if ( mo && mo.buttonUrl )
      btn = <a className="prfi_a_btn" href={mo.buttonUrl} rel="noopener noreferrer">{btnText}</a>
    if ( mo && mo.noText )
      noBtn = <Button color="primary" onClick={noClose} id="messageDialogNo">{mo.noText}</Button>
    return (
      <Modal isOpen={isOpen} toggle={close}>
        <ModalHeader toggle={close}>Message</ModalHeader>
        <ModalBody id="messageDialogText">{msg}</ModalBody>
        <ModalFooter>
          {btn}{'  '}
          {noBtn}
        </ModalFooter>
        {marker}
      </Modal>
    )
  }

  prompt() { /* App */
    let cancelForward = this.cancelForward.bind(this)
    let proceedWithForward = this.proceedWithForward.bind(this)
    let isOpen = this.state.prompting
    let marker = isOpen ? (<div id="confirmLeave"/>) : ''
    return (
      <Modal isOpen={isOpen} toggle={cancelForward}>
        <ModalHeader toggle={cancelForward}>{"Are you sure?".translate()}</ModalHeader>
        <ModalBody>
          {"There are unsaved changes. Are you sure you want to leave this page?".translate()}
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onClick={proceedWithForward}>{"Yes - Cancel my changes".translate()}</Button>{' '}
          <Button color="secondary" onClick={cancelForward}>{"No - Stay on this page".translate()}</Button>
        </ModalFooter>
        {marker}
      </Modal>
    )
  }

  shouldShowMenu() {
    return ! global.runningInsideWordpress
  }

  getMenuButtons() {
    if ( ! this.shouldShowMenu() ) return
    let btns = []
    gMenu.items.forAll(item => {
      btns.push(
        <Button 
          key={item.specname} 
          onClick={this.specnameToFunction(item.specname)} 
          id={"stocktend_" + item.englishCaption.toId()}
          className="mr-1"
        >
          {item.caption.translate()}
        </Button>
      )
    })
    return (
      <Row className="stMenu" id="stMenu" style={{height: this.menuHeightPixels() + "px", paddingTop: "10px"}}>
        {btns}
      </Row>
    )
  }

  async upgradeForFX() {
    let poLines = await 'POLine'.bring()
    for ( var i = 0; i < poLines.length; i++ ) {
      let poLine = poLines[i]
      if ( (i % 100) === 0 ) {
        await updateProgress(i / poLines.length)
        await global.wait(100)
      }
      if ( ! poLine.unitCostIncTaxFX )
        poLine.unitCostIncTaxFX = poLine.unitCostIncTax
    }
  }

  async upgradeForPU() {
    let poLines = await 'POLine'.bring()
    for ( let i = 0; i < poLines.length; i++ ) {
      let poLine = poLines[i]
      if ( (i % 100) === 0 ) {
        await updateProgress(i / poLines.length)
        await global.wait(100)
      }
      if ( ! poLine.quantityPU ) {
        poLine.quantityPU = poLine.quantity
      }
    }
    let recLines = await 'POReceiptLine'.bring()
    for ( let i = 0; i < recLines.length; i++ ) {
      let recLine = recLines[i]
      if ( (i % 100) === 0 ) {
        await updateProgress(i / recLines.length)
        await global.wait(100)
      }
      if ( ! recLine.receivedQuantityPU ) {
        recLine.receivedQuantityPU = recLine.receivedQuantity
        recLine.cancelledQuantityPU = recLine.cancelledQuantity
      }
    }
  }

  async upgradeData() {
    let c = await 'Configuration'.bringFirst()
    if ( ! yes(c.ifx) ) {
      startProgress({message: "Upgrading PO data..."})
      try {
        await this.upgradeForFX()
        c.ifx = "Yes"
        await Foreman.save({msgOnException: true})
      } finally {
        stopProgress()
      }
    }
    if ( ! yes(c.ipu) ) {
      startProgress({message: "Upgrading PO UOM data..."})
      try {
        await this.upgradeForPU()
        c.ipu = "Yes"
        await Foreman.save({msgOnException: true})
      } finally {
        stopProgress()
      }
    }
  }

  async optimizeDatabase() {
    startProgress({message: "Initializing..."})
    try {
      let p = 
        {
          methodWithParms: "stocktend_object",
          json: [
            {
              __submethod: "optimize_database"
            }
          ]
        }
      await Server.post(p, null)
    } finally {
      stopProgress()
    }
  }

  async doWPAction(action, parm) {
    startProgress({message: "Updating..."})
    try {
      let p = 
        {
          methodWithParms: "stocktend_object",
          json: [
            {
              __submethod: "do_wp_action",
              action: action,
              parm: parm
            }
          ]
        }
      await Server.post(p, null)
    } finally {
      stopProgress()
    }
  }

  async maybeSpruikPro(daysLeft) {
    if ( (daysLeft === 80) || (daysLeft === 50) || (daysLeft === 30) || (daysLeft === 14) || (daysLeft === 7) || (daysLeft === 1) ) {
      await this.spruikPro(daysLeft)
    }
  }

  async spruikPro(daysLeft) {
    let msg = 
      'Only '.translate() + ' ' + daysLeft + ' ' + 'days to go of your Profitori PRO trial.'.translate() + '  ' +
        'Subscribe now and get a 60% discount for your first 9 months!'.translate()
    if ( daysLeft === 1 )
      msg = 'This is the last day of your Profitori PRO trial.'.translate() + '  ' +
        'Subscribe now and get a 60% discount for your first 9 months!'.translate()
    if ( daysLeft <= 0 )
      msg = 'Your Profitori PRO trial period has finished.'.translate() + '  ' +
        'Subscribe now and get a 60% discount for your first 9 months!'.translate()
    this.showMessage(
      msg,
      {
        buttonText: 'Subscribe'.translate(), 
        buttonUrl: 'https://profitori.com/pro/coupon/',
        noText: 'No thanks'.translate()
      }
    )
  }

  async doInstallCheck() {
    if ( this.state.installCheckDone ) return
    if ( this.startedInstallCheck ) return
    this.startedInstallCheck = true
    let c = await 'Configuration'.bringSingle()
    if ( (! c) || (c.tbi !== 'Yes') ) {
      await this.optimizeDatabase()
    }
    if ( ! c ) {
      c = await 'Configuration'.bringOrCreate()
    }
    this.usersWithAccess = c.usersWithAccess
    this.controlAccessAtPageLevel = c.controlAccessAtPageLevel
    this.onlySaveChangedFields = (c.classicDatabaseUpdates !== 'Yes')
    this.pessimisticLocking = (c.optimisticLocking !== 'Yes')
    if ( global.urlOptimisticLocking )
      this.pessimisticLocking = false
    if ( this.controlAccessAtPageLevel )
      await 'SpecConfig'.bring() // cache it
    let sess = await 'session'.bringSingle()
    if ( ! sess.databaseIsOptimized ) {
      await this.optimizeDatabase()
      sess = await 'session'.bringFirst(null, {forceServerRetrieve: true}) // refresh flag from server
      if ( sess.databaseIsOptimized ) {
        c.tbi = 'Yes'
      } else {
        c.trb = 'Off'
        c.tbs = null
      }
    }
    this.userHasAdminRights = sess.userHasAdminRights
    this.user = sess.user
    this.specConfigsReady = true
    this.setState({installCheckDone: true})
    this.modifyWPMenu()
    this.refreshWPMenuHighlighting()
    this.forceUpdate() // Refresh home page menu items
    this.atumIsActive = sess.atumIsActive
    let sep = sess.decimalSeparator
    if ( ! sep ) 
      sep = '.'
    global.stDecimalSeparator = sep
    let tsep = sess.thousandSeparator
    //if ( (! tsep) || (tsep === sep) ) 
    if ( tsep === sep ) 
      tsep = ','
    global.stThousandSeparator = tsep
    await global.refreshShortDateFormat()
    await global.refreshLanguage()
    //await global.refreshTheming()
    if ( yes(c.i5) ) {
      await this.maybeTellAboutProOrCustom()
      await this.harmonize({skipInitialPing: true})
      await this.upgradeData()
      await this.checkRollbackSupported()
      this.installCheckComplete = true
      return
    }
    await this.install()
    await this.maybeTellAboutProOrCustom()
    await this.upgradeData()
    this.installCheckComplete = true
  }

  async checkRollbackSupported() {
    let sess = await 'session'.bringFirst(); if ( ! sess ) return
    if ( sess.supportsRollback !== 'Yes' )
      this.showMessage('WARNING: Your database tables are not compatible with ' + global.prfiSoftwareName + '. Use only for trial purposes.'.translate() + ' ' +
        'Please convert all tables to use the "InnoDB" engine to prevent errors and inconsistencies.')
  }

  async maybeTellAboutProOrCustom() {
    if ( global.noNag ) return
    let isPro = false
    let coinToss = Math.floor(Math.random() * 2) === 0
    if ( (! isPro) && (this.didInstall || coinToss) )
      await this.tellAboutPro()
    else
      await this.tellAboutCustom()
  }

  async tellAboutCustom() {

    let onClick = () => {
      this.forward(new Operation("Modify.js"))
    }

    if ( global.autoTesting ) return
    let msg = 'Need tweaks?  Or radical change??  Profitori is easy to customize!  Do it yourself or let us do it for you.'.translate()
    this.showMessage(
      msg,
      {
        buttonText: 'Read More'.translate(),
        onClick: onClick,
        noText: 'Not Interested'.translate()
      }
    )
  }

  async tellAboutPro() {
    if ( global.autoTesting ) return
    let msg = 'Get Profitori PRO free for 90 days!'.translate() +
      '  ' + '...AND after that a 60% discount for the first 9 months.  No credit card required.'.translate()
    this.showMessage(
      msg,
      {
        buttonText: 'Get PRO Free Trial'.translate(),
        buttonUrl: 'https://profitori.com/pro/',
        noText: 'No thanks'.translate()
      }
    )
  }

  async install() {
    this.installing = true
    try {
      let installer = new Installer()
      await installer.install()
      this.didInstall = true
    } finally {
      this.installing = false
    }
  }

  rememberScrollTop() {
    let s = this.currentSituation; if ( ! s ) return
    s.scrollTop = window.scrollY
  }

  cancelScrollTop() {
    let s = this.currentSituation; if ( ! s ) return
    s.scrollTop = -1
  }

  restoreScrollTop(tries) {
    let s = this.currentSituation; if ( ! s ) return
    if ( s === this.lastSituationRestoredScrollTopFor ) return
    let st = s.scrollTop; if ( st < 0 ) return
    if ( ! st ) 
      st = 0
/*
    let limit = Math.max(document.body.scrollHeight, document.body.offsetHeight, 
      document.documentElement.clientHeight, document.documentElement.scrollHeight, document.documentElement.offsetHeight);
    if ( limit < st ) {
      if ( ! tries )
        tries = 0
      if ( tries > 10 )
        return
      setTimeout(() => this.restoreScrollTop(tries + 1), 100)
      return
    }
*/
    window.scrollTo(0, st)
    this.lastSituationRestoredScrollTopFor = s
  }

  progressHeightPixels() {
    return 30
  }

  progressTopMarginPixels() {
    let res = 6
    if ( global.prfiSunder ) 
      res -= 32
    return res
  }

  progressBottomMarginPixels() {
    let res = 0
    if ( global.prfiSunder ) 
      res += 32
    return res
  }

  menuTopMarginPixels() {
    if ( ! this.shouldShowMenu() ) return 0
    return 10
  }

  menuHeightPixels() {
    if ( ! this.shouldShowMenu() ) return 0
    return 76
  }

  menuHeightWithProgressBarPixels() {
    let res = this.menuHeightPixels()
    if ( this.state.showProgress ) 
      res += this.progressHeightPixels() + this.progressTopMarginPixels()
    return res
  }

  elementIdToTop(aId) {
    return global.elementIdToOffset(aId).top
  }

  elementIdToHeight(aId) {
    let el = document.getElementById(aId); if ( ! el ) return 0
    return el.offsetHeight
  }

  elementIdToBottomPadding(aId) {
    let el = document.getElementById(aId); if ( ! el ) return 0
    return parseFloat(window.getComputedStyle(el, null).getPropertyValue('padding-bottom'), 10)
  }

  refreshRootDivHeight() {
    if ( ! global.runningInsideWordpress ) return
    let viewportHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
    let rootDivTop = this.elementIdToTop('stocktend-root'); if ( ! rootDivTop ) return
    let wpfooterHeight = this.elementIdToBottomPadding('wpbody-content')
    let h = viewportHeight - wpfooterHeight - rootDivTop
    let rootParent = getRootParent(); if ( ! rootParent ) return
    rootParent.style.height = h + "px"
  }

  outputDock() {
    let p = this.props
    let s = this.state
    let specname = s.outputSpecname
    if ( ! specname ) return
    let m = new Machine()
    let a = m.specnameToAttributes(specname)
    let cast = s.outputCast
    let res = (
      //<canvas id="stCanvas" width="480" height="320">
        <div id="stOutputContainer">
          <Output 
            attributes={a} 
            key={this.outputKey}
            specname={specname} 
            cast={cast}
            afterRender={this.afterOutputRender}
            parentCast={p.parentCast}
            callerCast={p.callerCast}
            callerSpecname={p.callerSpecname}
            containerSpecname={p.containerSpecname}
          /> 
        </div>
      //</canvas>
    )
    return res
  }

  showOutput(aOptions) {
    if ( ! this.outputKey ) 
      this.outputKey = 0
    this.outputKey++
    this.afterOutputRender = aOptions.afterRender
    this.setState({outputSpecname: aOptions.specname, outputCast: aOptions.cast})
  }

  userHasAccess() {
    if ( this.initialising ) return true
    if ( this.userHasAdminRights ) return true
    if ( ! this.usersWithAccess ) return true
    let list = "," + this.usersWithAccess.replace(" ", "") + ","
    if ( list.indexOf("," + this.user + ",") >= 0 ) return true
    return false
  }

  async generatePDF(aCast, aOptions) {
    if ( ! aOptions ) throw(new Error("generatePDF options must be specified"))
    let specname = aOptions.spec; if ( ! specname ) throw(new Error("generatePDF spec must be specified"))
    let m = new Machine()
    let a = await m.specnameToAttributesAsync(specname)
    let writer = new Writer()
    let pdf
    startProgress({message: "Generating PDF..."})
    try {
      pdf = await writer.generatePDF({attributes: a, cast: aCast, options: aOptions})
    } finally {
      stopProgress()
    }
    if ( writer.lastError ) {
      this.showMessage(writer.lastError)
      pdf = null
    }
    return pdf
  }

  async downloadPDF(aCast, aOptions) {
    if ( ! aOptions ) throw(new Error("downloadPDF options must be specified"))
    let specname = aOptions.spec; if ( ! specname ) throw(new Error("downloadPDF spec must be specified"))
    let m = new Machine()
    let a = await m.specnameToAttributesAsync(specname)
    let writer = new Writer()
    let pdf
    startProgress({message: "Generating PDF..."})
    try {
      pdf = await writer.generatePDF({attributes: a, cast: aCast, options: aOptions})
    } finally {
      stopProgress()
    }
    if ( writer.lastError ) {
      this.showMessage(writer.lastError)
    }
    let docName = aOptions.docName || 'Download.PDF'
    pdf.save(docName)
    return pdf
  }

  async downloadPDFandPrint(aCast, aOptions) {
    let pdf = await this.downloadPDF(aCast, aOptions); if ( ! pdf ) return
    pdf.autoPrint()
    pdf.output('dataurlnewwindow');
  }

  render() {
    //tc(6000)
    if ( this.stale ) return null
    if ( isIE() ) 
      return "Internet Explorer is not supported.  Please use Chrome, Edge or Firefox.".translate()
    this.refreshRootDivHeight()
    let initialising = this.initialising
    if ( gRootVersion !== this.state.rootVersion ) {
      initialising = true
      execDeferred(this.initialise.bind(this))
    }
    if ( (! this.state.installCheckDone) && (! initialising) ) {
      execDeferred(this.doInstallCheck.bind(this))
    }
    if ( initialising )
      return (
        <div>   
          {"Loading...".translate()}
        </div>
      )
    let testButtons
    let level2HeightStr = "100%"
    if ( gIncludeTestButtons ) {
      let testHeight = 38
      testButtons = (
        <Row className="stTestButtons" id="stTestButtons" style={{height: testHeight + "px"}}>
          <Button onClick={this.runFactorySettings} color="danger" className="mr-1">Factory</Button>
          <Button onClick={this.runAllTests} color="danger" className="mr-1">All</Button>
          <Button onClick={this.runGPTests} color="danger" className="mr-1">GP</Button>
          <Button onClick={this.runBackboneTests} color="danger" className="mr-1">B1</Button>
          <Button onClick={this.runSearchTests} color="danger" className="mr-1">Srch</Button>
          <Button onClick={this.runCRMTests} color="danger" className="mr-1">Crm</Button>
          <Button onClick={this.runScanTests} color="danger" className="mr-1">Sc</Button>
          <Button onClick={this.runUomTests} color="danger" className="mr-1">Uom</Button>
          <Button onClick={this.runMigTests} color="danger" className="mr-1">Mig</Button>
          <Button onClick={this.runLabelTests} color="danger" className="mr-1">Lab</Button>
          <Button onClick={this.runAvgCostingTests} color="danger" className="mr-1">Avg</Button>
          <Button onClick={this.runHarmonizerTests} color="danger" className="mr-1">Har</Button>
          <Button onClick={this.runBackbone4Tests} color="danger" className="mr-1">B4</Button>
          <Button onClick={this.runBackbone3Tests} color="danger" className="mr-1">B3</Button>
          <Button onClick={this.runBackbone2Tests} color="danger" className="mr-1">B2</Button>
          <Button onClick={this.runLocTests} color="danger" className="mr-1">Loc</Button>
          <Button onClick={this.runCoreTests} color="danger" className="mr-1">Core</Button>
        </Row>
      )
      level2HeightStr = "calc(100% - " + testHeight + "px)"
    }
    if ( (! this.userHasAccess()) && this.state.installCheckDone && (! initialising) ) {
      return (
        <div>   
          {"Your user account does not have access to Profitori. Please ask an administrator to grant access to you via the Settings Menu Option.".translate()}
        </div>
      )
    }
    let menuButtons = this.getMenuButtons()
    this.firstMaintOrList = null
    let res = (
      <div className="stLevel0" style={{height: "100%", display: "flex"}}>
        <div id="prfiPdfTemp">
        </div>
        <img id="prfiPdfBarcodeTemp" alt="internal"
          style={{position: 'absolute', left: '-9999px', height: 'auto', width: 'auto', whiteSpace: 'nowrap'}}
        >
        </img>
        <canvas id="prfiPdfQrcodeTemp" alt="internal"
          style={{position: 'absolute', left: '-9999px', height: 'auto', width: 'auto', whiteSpace: 'nowrap'}}
        >
        </canvas>
        {this.outputDock()}
        <Container fluid={true} className="stLevel1" id="stLevel1" style={{height: "100%"}}>
          {testButtons}
          <div className="stLevel2" id="stLevel2" style={{height: level2HeightStr}}>
            {menuButtons}
            {this.progress()}
            {this.getFeature()}
          </div>
        </Container>
        {this.prompt()}
        {this.message()}
      </div>
    )
    //tc(191)
    return res
  }

}


let gNextHashNo = 0

class Situation {

  constructor(aOperation, aCast, aParentCast, aCallerCast, aCallerSpecname, aParm) {
    this.operation = aOperation
    this.cast = aCast
    this.parentCast = aParentCast
    this.callerCast = aCallerCast
    this.callerSpecname = aCallerSpecname
    this.parm = aParm
    this.hash = "#st" + gNextHashNo
    this.berths = {}
    gNextHashNo = gNextHashNo + 1
  }

  maint() {
    let res = this.sheet; if ( ! res ) return null
    let cn = res.a().componentName
    if ( cn !== "Maint" )
      return null
    return res
  }

  maintOrList() {
    let res = this.sheet; if ( ! res ) return null
    let cn = res.a().componentName
    if ( (cn !== "Maint") && (cn !== "List") )
      return null
    return res
  }

  isList() {
    let s = this.sheet; if ( ! s ) return false
    let cn = s.a().componentName
    return ( cn === 'List' )
  }

  getOrCreateBerth(aName) {
    let res = this.berths[aName]
    if ( res )
      return res
    res = {name: aName}
    this.berths[aName] = res
    return res
  }

  specname() {
    return this.operation.specname
  }

}

class Operation {

  constructor(aSpecname, aBehaviour, aParentSpecname, aParentIsManifest, aIsSegueToDestination) {
    this.specname = aSpecname
    this.behaviour = aBehaviour
    this.parentSpecname = aParentSpecname
    this.vassal = aParentIsManifest && (! aIsSegueToDestination)
  }

}

global.prfiOperationClass = Operation

class Maint extends React.Component {

  constructor(aProps) {
    tc(150)
    super(aProps)
    this.version = 1
    let searchText = this.berth().searchText || '' 
    this.state = {searchText: searchText}
  }

  getMainGrid() {
    return this._grid
  }

  createField(aParms) { /* Maint */
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
    f.postImage = aParms.postImage
    f.postImageType = aParms.postImageType
    f.postIdField = aParms.postIdField
    f.inputWidthPx = aParms.inputWidthPx
    this.maybePlaceFieldInPanel(f, aParms)
    return f
  }

  maybePlaceFieldInPanel(f, parms) {
    if ( ! parms.panel ) return
    let panel = this.nameToPanel(parms.panel); if ( ! panel ) throw(new Error('Invalid panel: ' + parms.panel))
    panel.attributes.fields.push(f)
    f.panel = panel
  }

  nameToPanel(name) {
    return this.a().panels.filterSingle(panel => panel.name === name)
  }

  back() {
    gApp.backToFirstDifferentSpec()
  }

  isTopLevel() {
    return ! this.props.hideCancelButton
  }

  async harmonize() {
    if ( this.props.inTile ) 
      return
    await gApp.harmonize()
  }

  getSingleSubsetName() {
    return this.mold.getSingleSubsetName()
  }

  parentDatatype() {
    let pc = this._parentCast; if ( ! pc ) return null
    return pc._datatype
  }

  startAlter() { /* Maint */
    this.refreshState()
  }

  berth() {
    let sit = this.situation()
    let res = sit.getOrCreateBerth(this.name())
    return res
  }

  getFirstAncestorList(options) {
    return gApp.getFirstAncestorList(options)
  }

  callerSpecname() {
    return this._callerSpecname
  }

  name() {
    return this.a().name
  }

  situation() {
    return gApp.currentSituation
  }

  operation() {
    return this.props.operation
  }

  isAdding() {
    return this.operation().behaviour === "add"
  }

  mainCast() {
    return this.cast
  }

  getFieldValue(aName) {
    return this.fieldGet(aName)
  }

  setFieldValue(aName, aValue) {
    this.setFieldValueByName(aName, aValue)
  }

  async prepareFields() {
    this._fields = []
    this._fields.appendArray(this.props.attributes.fields)
    let fn = this.a().modifyFields; 
    if ( ! fn ) return
    await fn(this, this._fields)
  }

  async initialise() { /* Maint */
    try {
      tc(130)
      this.lastOperation = this.operation()
      let p = this.props
      this.refreshMold()
      await this.prepareFields()
      this.cast = this.pendingCast || p.cast
      if ( global.confVal('highConcurrency') === 'Yes' ) 
        await gApp.pingServer()
      if ( this.cast && this.cast.reretrieve )
        await this.cast.reretrieve()
      this.pendingCast = null
      this._parentCast = p.parentCast
      this._callerCast = p.callerCast
      this._callerSpecname = p.callerSpecname
      let scf = this.a().substituteCastFunction
      if ( scf ) {
        scf = scf.bind(this)
        this.cast = await scf(this.cast, this)
      }
      this.rejection = null
      this.forward = p.forward
      this.showMessage = p.showMessage
      this.behaviour = this.operation().behaviour
      gLatestInputField = null
      if ( ! this.cast ) {
        if ( this.mold.singleton ) {
          this.cast = await this.datatype().bringSingle()
          this.behaviour = "edit"
        }
        if ( ! this.cast ) {
          await this.datatype().bringSingle({id: -9999999999}) // make sure data is cached so that duplicate checking works
          await this.createCast()
          await this.doWhenAdding()
        }
        this.props.situation.cast = this.cast
        this.cast.addedDirectlyByUser = true
      }
      this.initReadOnly()
      this.version++
      await this.cast.refreshReferences()
      await this.cast.refreshCalculations({force: true, keepState: true, point: 30, includeDefers: true})
      let aif = this.a().afterInitialising
      if ( aif ) {
        aif = aif.bind(this)
        await aif(this.cast)
      }
      execDeferred(() => this.refreshState(), {noSpinner: true})
      execDeferred(() => this.doInitialFocus(), {noSpinner: true, ms: 100})
    } finally {
      this.initialising = false
    }
  }

  async setCast(aCast) {
    if ( aCast === this.cast ) return
    this.pendingCast = aCast
    this.props.situation.cast = aCast
    this.initialising = true
    this.initialise()
  }

  doInitialFocus() {
    let sit = this.props.situation
    if ( sit.initialFocusDone ) 
      return
    let el = this.getFirstFocussableElement(); if ( ! el ) return
    el.focus()
    if ( el.select )
      el.select()
    sit.initialFocusDone = true
  }

  getFirstFocussableElement() {
    let field = this.fields().filterSingle(f => (! f.isReadOnly()) && (! f.hidden) ); if ( ! field ) return
    let id = field.name
    return document.getElementById(id)
  }

  async createCast() { /* Maint */
    let m = this.mold
    this.cast = m.addCast({parentCast: this._parentCast})
    this.createdCast = this.cast
    let acf = this.a().afterCreatingCast
    if ( acf ) {
      acf = acf.bind(this)
      await acf(this.cast)
    }
    await m.doCastAfterCreate(this.cast)
    this.props.situation.cast = this.cast
    await this.updateDefaults()
    this.cast.refreshFieldIndexes()
  }

  async updateDefaults() { /* Maint */
    let c = this.cast
    let fields = c.fields()
    for ( var i = 0; i < fields.length; i++ ) {
      let f = fields[i]
      let v = f.default
      if ( (! v) && f.date && (! f.inception) )
        v = global.todayYMD()
      if ( ! v ) continue
      if ( v instanceof Function ) {
        let fres = v(this, this.mainCast())
        if ( global.isPromise(fres) ) {
          let val = await fres
          c[f.name] = val
        } else
          c[f.name] = fres
      } else {
        c[f.name] = v
      }
    }
  }

  thereAreUnsavedChanges() {
    if ( this.cast.needsSaving() )
      return true
    if ( this.anyChildCastNeedsSaving() )
      return true
    return false
  }

  anyChildCastNeedsSaving() {
    let casts = this.getChildCasts()
    let len = casts.length
    for ( var i = 0; i < len; i++ ) {
      let c = casts[i]
      if ( c.needsSaving() )
        return true
    }
    return false
  }

  getChildCasts() {
    let m = this.getManifestMold(); if ( ! m ) return []
    let ssn = m.getSingleSubsetName()
    let res = m.fastRetrieve({parentId: this.cast.id}, {subsetName: ssn})
    if ( res === 'na' )
      res = []
    return res
  }

  callerCast(options) { /* Maint */
    let immediateOnly = options && options.immediateOnly
    let res = this._callerCast
    if ( (! res) && (! immediateOnly) )
      res = gApp.getAncestorCallerCast()
    return res
  }

  parentCast() {
    return this._parentCast
  }

  cancelChanges() {
    let c = this.cast
    if ( c.isNew() && (c === this.createdCast) ) {
      this.removeCast()
    } else {
      c.revertToOld()
    }
  }

  removeCast() {
    this.removeChildCasts()
    this.cast.remove()
    this.props.situation.cast = null
  }

  removeCastIfNew() {
    let c = this.cast
    if ( c.isNew() && (c === this.createdCast) ) {
      this.removeCast()
    }
  }

  removeChildCasts() {
    let m = this.getManifestMold(); if ( ! m ) return null
    m.removeCasts({parentId: this.cast.id})
  }

  showSpinner() {
    gShowSpinner(this)
  }

  hideSpinner() {
    gHideSpinner(this)
  }

  async doWhenAdding() { /* Maint */
    this.showSpinner()
    try {
      let f = this.a().whenAdding 
      tc(14)
      if (  f ) {
        tc(15)
        await this.cast.refreshCalculations({force: true, keepState: true, point: 31, includeDefers: true})
        tc(11)
        let cf = f.bind(this)
        await cf(this.cast, this)
        tc(12)
        this.cast.__mold.refreshKeyIndex(this.cast)
      }
      await this.refreshCalculations({force: true, keepState: true, point: 32, includeDefers: true})
      tc(16)
      this.refreshDefaultCastCopies()
      this.cast.doAfterAnyUserChange(this)
      tc(17)
      this.version = this.version + 1
      tc(13)
      this.refreshState()
    } finally {
      this.hideSpinner()
    }
  }

  refreshDefaultCastCopies() {
    this.cast.refreshDefaultCopy()
    let cm = this.getManifestMold(); if ( ! cm ) return
    cm.refreshDefaultCopies({parentId: this.cast.id})
  }

  async refreshCalculations(aOptions) {
    let keepState = aOptions && aOptions.keepState
    await this.cast.refreshCalculations({force: true, keepState: keepState, point: 33, includeDefers: true})
    let cm = this.getManifestMold(); if ( ! cm ) return
    await cm.refreshCalculations({parentId: this.cast.id, force: true, keepState: keepState, point: 1})
    cm.version++
  }

  async addChildCast() { /* Maint */
    if ( gLogTimings ) tc(400)
    let m = this.getManifestMold(); if ( ! m ) return null
    if ( gLogTimings ) tc(402)
    let c = this.cast
    if ( gLogTimings ) tc(403)
    let res = m.addCast({parentCast: c})
    if ( gLogTimings ) tc(401)
    await m.doCastAfterCreate(res)
    c.refreshFieldIndexes()
    return res
  }

  getManifestMold() {
    let man = this.getFirstManifest(); if ( ! man ) return null
    return Foreman.nameToMold(man.attributes.datatype)
  }

  getFirstManifest() {
    let mans = this.manifests(); if ( ! mans ) return null
    if ( mans.length === 0 ) return null
    return mans[0]
  }

  fieldNameToParentCast(aFieldName) {
    return this._parentCast
  }

  refreshMold() {
    let moldName = this.datatype()
    this.mold = Foreman.nameToMold(moldName)
  }

  componentDidMount() {
    this.mounted = true
    this.refreshState()
  }

  componentWillUnmount() {
    this.mounted = false
  }

  componentDidUpdate() {
    tc(620)
  }

  a() {
    return this.props.attributes
  }

  datatype() {
    return this.a().datatype
  }

  key() {
    return this.a().key
  }

  fields() {
    if ( this._fields )
      return this._fields
    return this.a().fields
  }

  manifests() {
    return this.a().manifests
  }

  specname() {
    return this.a().specname
  }

  refreshState(aOptions) { /* Maint */
    tc(500)
    if ( ! this.mounted ) return
    let cast = this.copyCast(this.cast)
    tc(502)
    let op = global.copyObj(this.operation()) 
    tc(503)
    let mmvs = this.getManifestMoldVersions()
    tc(504)
    this.setState({ 
      version: this.version, 
      cast: cast,
      operation: op,
      rejection: this.rejection,
      manifestMoldVersions: mmvs,
      showSpinner: this.spinnerIsShowing,
      waitCount: this.waitCount,
    })
    tc(501)
  }

  copyCast(aCast) {
    if ( ! aCast ) return null
    return aCast.copy()
  }

  getManifestMoldVersions() {
    let manifests = this.props.attributes.manifests; if ( ! manifests ) return null
    return manifests.map(m => this.manifestToMoldVersion(m))
  }

  manifestToMoldVersion(aManifest) {
    let m = this.manifestToMold(aManifest); if ( ! m ) return 0
    return m.version
  }

  manifestToMold(aManifest) {
    return Foreman.nameToMold(aManifest.attributes.datatype)
  }

  id() {
    let c = this.cast; if ( ! c ) return null
    return c.id
  }

  onBlur(aEvent) {
    this.version++
    this.refreshState()
  }

  onChange(aParm1, aValue, aOptions) {  /* Maint */
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
    gLatestInputValue = val
    gLatestInputField = f
    gLatestInputCast = c
    let oldVal = c[name]
    let propVal = val
    if ( aOptions && aOptions.keyVal )
      propVal = aOptions.keyVal
    let changed = f.setCastPropValue(c, propVal, null, this)
    if ( ! changed )
      return
    if ( aOptions && aOptions.invalid ) 
      return

    let spinnerStarted

    let finish = (aAfterChangeMsg) => {
      if ( aAfterChangeMsg ) {
        gApp.showMessage(aAfterChangeMsg.translate())
        this.hideSpinner()
        f.setCastPropValue(c, oldVal, null, this)
        this.version++
        this.refreshState()
        return
      }
      if ( f.isKey )
        c["wp_post_title"] = propVal
      this.changedSinceLastSaveAttempt = true
      this.refreshRejection()
      if ( spinnerStarted )
        this.hideSpinner()
      c.refreshCalculations({force: true, keepState: true, point: 34, includeDefers: true}).then(() => {
        this.version++
        this.refreshState()
      })
    }

    if ( ! f.hasUserChangeMethod() ) {
      finish()
      return
    }

    let fn = () => {
      let res
      this.showSpinner()
      spinnerStarted = true
      try {
        res = f.doAfterUserChange(oldVal, propVal, c, this)
      } catch(e) {
        this.hideSpinner()
        gApp.showMessage(e.message)
        c[name] = oldVal
        gLatestInputValue = oldVal
        return
      }
      if ( global.isPromise(res) ) {
        res.then(finish)
      } else 
        finish()
    }

    execDeferred(fn, {noSpinner: true})
  }

  callThenRefresh(aFn) { /* Maint */

    let finish = () => {
      this.hideSpinner()
      this.version++
      this.refreshState()
    }

    let f = () => {
      let res
      this.showSpinner()
      try {
        res = aFn()
      } catch(e) {
        this.hideSpinner()
        throw(e)
      }
      if ( global.isPromise(res) ) {
        res.then(finish)
      } else 
        finish()
    }

    execDeferred(f, {forceSpinner: true, ms: 50})
  }

  refreshRejection() {
    this.rejection = this.mold.acceptOrRejectCast(this.cast)
    if ( this.rejection )
      console.log("Error on refreshRejection: " + this.rejection.message)
  }

  async acceptOrRejectCastOnSave() {
    let fields = this.fields()
    for ( var i = 0; i < fields.length; i++ ) {
      let res = await this.acceptOrRejectFieldOnSave(fields[i]); if ( res ) return res
    }
  }

  async acceptOrRejectFieldOnSave(f) { /* Maint */
    if ( f.hidden ) 
      return null
    if ( f.visibleWhen && ! f.visibleWhen(this, this.cast) )
      return null
    if ( f.visibleWhenInternal && ! f.visibleWhenInternal(this, this.cast) )
      return null
    if ( (! f.staticOptions) && (! f.dynamicOptions) ) return
    let options = []
    if ( f.staticOptions ) 
      options = f.staticOptions
    else if ( f.dynamicOptions ) 
      options = await f.dynamicOptions(this)
    let val = this.value(f.name)
    if ( val && (options.indexOf(val) < 0) ) 
      return new Rejection('Invalid'.translate() + ' ' + this.fieldToCaption(f) + ': ' + val)
  }

  fieldToCaption(field) {
    let res = field.caption
    let f = field.dynamicCaption; if ( ! f ) return res
    res = f(this)
    if ( ! res )
      res = field.caption
    return res
  }

  async refreshRejectionOnSave() {  /* Maint */
    this.rejection = await this.acceptOrRejectCastOnSave()
    if ( ! this.rejection )
      this.rejection = await this.mold.acceptOrRejectCastOnSave(this.cast)
    if ( this.rejection )
      console.log("Error on refreshRejectionOnSave: " + this.rejection.message)
  }

  nameToField(aName) { /* Maint */
    let res = this.fields().filterSingle(field => (field.name === aName) || (field.caption === aName))
    if ( res ) 
      return res
    return this.fields().filterSingle(field => (field.caption.toId() === aName))
  }

  parentSpecname() {
    return this.operation().parentSpecname
  }

  navigateAfterNew(aAct) { /* Maint */
    this.forward(new Operation(this.specname(), "edit"), this.cast)
  }
  
  navigateToReferrer() {
    this.backToReferrer()
  }

  backToReferrer() { /* Maint */
    gApp.backToFirstDifferentSpec()
  }

  forwardToParentEdit() {
    this.forward(new Operation(this.parentSpecname(), "edit"), this._parentCast, null)
  }

  vassal() {
    return this.operation().vassal
  }

  hasError() {
    return this.rejection
  }

  cancelFunction() {
    return async () => {
      gApp.backToFirstDifferentSpec({promptIfUnsaved: true})
    }
  }

  attachmentsFunction() {
    return async () => {
      if ( await gApp.preventInteractionWhenBusy() ) return
      this.segue("view", 'AttachmentsByParent.js')
    }
  }

  async maybeShowWarning() {
    let c = this.cast; if ( ! c ) return
    let wf = this.a().warningFunction; if ( ! wf ) return
    let warning = await wf(this, c); if ( ! warning ) return
    this.showMessage("WARNING".translate() + ": " + warning)
  }

  async validateMainCast() {
    try {
      let cast = this.mainCast(); if ( ! cast ) return
      let mold = cast.mold()
      if ( mold.beforeValidating ) {
        let bvf = mold.beforeValidating.bind(cast)
        await bvf()
      }
      if ( mold.validate ) {
        let f = mold.validate.bind(cast)
        await f()
      }
    } catch(e) {
      return e.message
    }
  }

  saveFunction(aAutoSave, aForwarding, aAct, aFakeSave) { /* Maint */
    tc(3000)
    let self = this
    return async () => {
      this.showSpinner() 
      try {
        if ( self.readOnly() ) {
          self.showMessage(self.readOnlyMessage())
          return
        }
        self.lastSaveFailed = false
        self.changedSinceLastSaveAttempt = false
        await self.refreshRejectionOnSave()
        if ( self.rejection ) {
          console.log("Error on saving: " + self.rejection.message)
          self.lastSaveFailed = true
          self.refreshState()
          if ( aAutoSave && (! aForwarding) ) throw(new Error("Autosave failed: " + self.rejection.message))
          return self.rejection.message
        }
        let errMsg
        if ( ! aFakeSave ) {
          // The save...
          errMsg = await Foreman.atomicSave()
        } else {
          errMsg = await this.validateMainCast()
        }
        if ( errMsg ) {
          console.log("Error on saving: " + errMsg)
          self.lastSaveFailed = true
          self.rejection = new Rejection(errMsg)
          self.refreshState()
          return errMsg
        }
        await this.doOnSave()
        this.version = this.version + 1
        if ( ! aAutoSave )
          await self.maybeShowWarning()
        if ( aAct === "ok" ) {
          await this.doOnOK()
          execDeferred(this.navigateToReferrer.bind(this), {noSpinner: true})
          return
        }
        let b = self.behaviour
        if ( (b === "add") && (! aAutoSave) ) {
          self.navigateAfterNew(aAct)
          return
        }
        if ( (b === "edit") && (! aAutoSave) ) {
          return
        }
        if ( ! aAutoSave )  {
          self.refreshState()
        }
      } finally {
        this.hideSpinner()
      }
    }
  }

  async doOnSave() {
    let f = this.a().onSave; if ( ! f ) return
    f(this, this.cast)
  }

  async doOnOK() {
    let f = this.a().onOK; if ( ! f ) return
    f(this, this.cast)
  }

  async save(aAutoSave, aForwarding) {
    let f = this.saveFunction(aAutoSave, aForwarding)
    let res = await f()
    return res
  }

  async saveFromGrid(fakeSave) {
    let f = this.saveFunction(true, true, null, fakeSave)
    let res = await f()
    return res
  }

  async commit() {
    await Foreman.commit()
  }

  add(aSpecname, aOptions) { /* Maint */
    let self = this
    return async () => {
      if ( await gApp.preventInteractionWhenBusy() ) return
      let fakeSave = false
      if ( aOptions && aOptions.noSave )
        fakeSave = true
      tc(4000)
      let specname = self.specname()
      if ( aSpecname )
        specname = aSpecname
      this.refreshRejection()
      if ( this.rejection ) 
        return 
      let autoSave = true
      let f = this.saveFunction(autoSave, true, null, fakeSave)
      await f()
      if ( this.rejection ) 
        return 
      let callerSpecname = this.specname()
      if ( ! this.vassal() ) {
        self.forward(new Operation(specname, "add"), null, null, self.cast, callerSpecname)
      } else {
        self.forward(
          new Operation(specname, "add", self.operation().parentSpecname, true), 
          null, 
          self._parentCast,
          null,
          callerSpecname
        )
      }
    }
  }

  getKeyId() {
    return this.nameToId(this.key())
  }

  nameToId(aName) {
    return aName.toId()
  }

  getNonPanelFields() {
    return this.fields().filter(f => ((! f.panel) && (! f.hidden)))
  }

  getNonPanelPortal() {
    let fields = this.getNonPanelFields(); if ( fields.length === 0 ) return null
    return (
      <Particulars
        classRoot="stMaint"
        key="stNonPanelPortal"
        keyRoot="stNonPanelPortal"
        className="stNonPanelPortal"
        container={this}
        attributes={this.a()}
        fields={fields}
        cast={this.cast}
        forward={this.props.forward}
      />
    )
  }

  panelToPortal(aPanel) { /* Maint */
    let vwf = aPanel.visibleWhen
    if ( vwf ) {
      if ( this.cast && (! vwf(this, this.cast)) )
        return null
    }
    let key = "stPortal" + aPanel.name.toId()
    let cls = "stPortal"
    if ( aPanel.attributes.fullWidth )
      cls = "stPortalFullWidth"
    return (
      <Particulars
        classRoot="stMaint"
        key={key}
        keyRoot={key}
        className={cls}
        container={this}
        attributes={this.a()}
        fields={aPanel.attributes.fields}
        cast={this.cast}
        title={this.panelToVisibleTitle(aPanel)}
        forward={this.props.forward}
      />
    )
  }

  panelToVisibleTitle(aPanel) {
    if ( this.a().panelStyle !== "titled" ) return null
    let f = aPanel.attributes.dynamicTitle
    if ( f ) {
      f = f.bind(this)
      let res = f()
      if ( res )
        return res
    }
    return aPanel.attributes.name
  }

  getPortalContainers() {
    let idx = 0
    let panelIdx = 0
    let nonPanelPortal = this.getNonPanelPortal()
    let panels = this.a().panels

    let nextPortal = () => {
      let portal = null
      if ( (idx === 0) && nonPanelPortal )
        portal = nonPanelPortal
      else {
        if ( panelIdx < panels.length ) {
          let panel = panels[panelIdx]
          panelIdx++
          portal = this.panelToPortal(panel)
        }
      }
      idx++
      return portal
    }

    let res = []
    let portalCount = panels.length
    if ( nonPanelPortal )
      portalCount++
    if ( portalCount === 0 ) 
      return null
    let containerCount = Math.ceil(portalCount / 2)
    for ( var i = 0; i < containerCount; i++ ) {
      let key = i
      res.push(
        <div className="stPortalContainer" key={key}>
          {nextPortal()}
          {nextPortal()}
        </div>
      )
      res.push(
        <div key={"sep" + i} className="stPortalVerticalSeparator"/>
      )
    }
    return res
  }

  getGrids() { /* Maint */
    let res = []
    if ( this.initialising )
      return res
    let manifests = this.manifests()
    for ( var i = 0; i < manifests.length; i++ ) {
      let m = manifests[i]
      if ( m.visibleWhen && ! m.visibleWhen(this, this.cast) )
        continue
      if ( m.visibleWhenInternal && ! m.visibleWhenInternal(this, this.cast) )
        continue
      let grid = this.manifestToGrid(m)
      res.push(grid)
    }
    return res
  }

  rejectionToFormFeedback(aRejection) {
    if ( ! aRejection ) return null
    return (
      <div key="formfeedback" id="stFormRejection" className="stFormRejection invalid-feedback d-block">{aRejection.message}</div>
    )
  }

  fieldToRejection(aField) {
    let r = this.state.rejection; if ( ! r ) return null
    let f = r.field; if ( ! f ) return null
    if ( f.name !== aField.name ) return null
    return r
  }

  getEmptyOption() {
    let key = "__empty"
    return ( <option key={key}></option> )
  }

  async beforeForward(aOptions) {
    if ( aOptions && (aOptions.validateOnly) ) {
      this.refreshRejection()
      if ( this.rejection ) {
        this.refreshState()
        return false
      }
      return true
    }
    let autoSave = true
    let f = this.saveFunction(autoSave)
    await f()
    if ( this.rejection ) {
      return false
    }
    return true
  }

  manifestToGrid(aManifest) { /* Maint */
    let name = aManifest.name
    let c = this.cast
    let castId = c ? c.id : null
    tc(240)
    let res = (
      <Grid 
        key={name} 
        maint={this}
        manifestName={name} 
        attributes={aManifest.attributes} 
        forward={this.props.forward}
        showMessage={this.props.showMessage}
        containerSpecname={this.specname()}
        containerCast={c}
        containerCastId={castId}
        containerVersion={this.version}
        beforeForward={this.beforeForward.bind(this)}
        disableInputs={this.spinnerIsShowing}
        searchText={this.state.searchText}
        alter={true}
      />
    )
    tc(241)
    return res
  }

  value(aFieldName) {
    let c = this.cast; if ( ! c) return null
    return c.fieldNameToValue(aFieldName)
  }

  fieldNameToIdReferredTo(aName) {
    let v = this.cast[aName]
    if ( ! global.isObj(v) ) return null
    return this.safeValue(v.id)
  }

  setFieldValueByName(aName, aVal) { // Maint
    if ( ! this.nameToField(aName) ) throw(new Error("Attempted to set invalid field: " + aName))
    this.cast[aName] = aVal
  }

  fieldNameToKeyValue(aName) {
    let res = this.cast[aName]
    if ( ! global.isObj(res) ) this.err(aName + " is not a reference and so can't be the target of a keyValue call")
    return this.safeValue(res.keyval)
  }

  fieldGet(aName) {
    let res = this.cast[aName]
    if ( ! global.isObj(res) ) 
      return this.safeValue(res)
    return res
  }

  safeValue(aVal) {
    if ( aVal === 0 ) return aVal
    if ( ! aVal ) return ''
    return aVal
  }

  headerButtons() { /* Maint */
    let res = []
    let actions = this.props.attributes.actions
    let includeManifestSearch = this.props.attributes.includeManifestSearch
    let maxNormalButtons = gApp.maxNormalButtons(1)
    let knt = 0
    for ( var i = 0; i < actions.length; i++ ) {
      let a = actions[i]
      let f = this.headerActionToFunction(a); if ( ! f ) continue
      let key = this.nameToId(a.name)
      let caption = this.actionToCaption(a)
      let icon = gApp.actionToIcon(a)
      knt++
      if ( knt <= maxNormalButtons ) {
        let btn = (
          <Button key={key} onClick={f} className="stHeaderButton mr-1">
            {icon}
            {caption}
          </Button>
        )
        res.push(btn)
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
    res.push(moreBtn)
    if ( includeManifestSearch ) {
      res = (
        <Table className="stListHeader" key="prfiHeaderButtons">
          <tbody>
            <tr>
              <td className="stListHeaderButtons">
                <div>
                  {res}
                </div>
              </td>
              <td className="stListSearcherCell">
                <div className="stFilterAndSearch">
                  <Searcher
                    className="stListSearcher"
                    key="stSearcher"
                    onChange={this.onSearcherChange.bind(this)}
                    value={this.state.searchText}
                    onClear={this.onSearcherClear.bind(this)}
                    list={this}
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </Table>
      )
    }
    let fb = this.getSaveFeedback()
    if ( fb )
      res.push(fb)
    return res
  }

  onSearcherClear() {
    if ( ! this.mounted ) return
    this.setState({searchText: ''})
    this.berth().searchText = '' 
  }

  onSearcherChange(aEvent) {
    let t = aEvent.target
    let val = t.value
    if ( ! this.mounted ) return
    this.setState({searchText: val})
    this.berth().searchText = val 
    let f = this.a().afterSearchChange
    if ( f )
      f(this, val)
  }

  moreDropdownItems() {
    let res = []
    let actions = this.props.attributes.actions
    let maxNormalButtons = gApp.maxNormalButtons(1)
    let knt = 0
    for ( var i = 0; i < actions.length; i++ ) {
      let a = actions[i]
      let f = this.headerActionToFunction(a); if ( ! f ) continue
      let key = this.nameToId(a.name)
      let caption = this.actionToCaption(a)
      knt++
      if ( knt <= maxNormalButtons )
        continue
      let ddi = (
        <DropdownItem key={key} onClick={f} className="stMoreDropdownItem mr-1">{caption}</DropdownItem>
      )
      res.push(ddi)
    }
    gMenu.addItemsToDropdown(res)
    return res
  }

  actionToCaption(a) {
    let res = a.name
    if ( ! a.dynamicCaption )
      return res
    let dcres = a.dynamicCaption(this)
    if ( dcres )
      res = dcres
    return res
  }

  getSaveFeedback() {
    let res = null
    if ( this.lastSaveFailed && (! this.changedSinceLastSaveAttempt) )
      res = this.rejectionToFormFeedback(this.rejection)
    return res
  }

  headerActionToFunction(aAction) { /* Maint */
    if ( gApp.shouldHideSpec(aAction.specname) ) return null
    let res = this.doHeaderActionToFunction(aAction)
    if ( aAction.spinner )
      res = gApp.wrapFunctionWithSpinner(res, this)
    return res
  }

  doHeaderActionToFunction(aAction) { /* Maint */
    if ( aAction.place !== "header" ) return null
    let awf = aAction.availableWhen
    if ( awf ) {
      let available = awf(this.cast, this)
      if ( ! available )
        return null
    }
    let tof = aAction.tagOrFunction
    let specname = aAction.specname
    if ( tof === "save" )
      return this.saveFunction()
    if ( tof === "ok" )
      return this.saveFunction(null, null, "ok")
    if ( tof === "okNoSave" )
      return this.saveFunction(null, null, "ok", true)
    if ( tof === "add" )
      return this.add(aAction.specname)
    if ( tof === "addNoSave" )
      return this.add(aAction.specname, {noSave: true})
    if ( tof === "cancel" )
      return this.cancelFunction()
    if ( tof === "attachments" )
      return this.functionToTrackedFunction(this.attachmentsFunction(), null, {isAction: true})

    let f
    if ( ! tof ) {
      f = this.segue.bind(this, "view", specname, null)
    } else {
      f = tof.bind(this, this, this.cast)
    }
    if ( this.readOnly() || aAction.noSave )
      return f
    return this.functionToTrackedFunction(f, this.cast, {isAction: true})
  }

  async segue(aAct, aSpecname, aCast) { /* Maint */
    if ( await gApp.preventInteractionWhenBusy() ) return
    let parentCast = this.cast
    let cast = aCast ? aCast : null
    let callerCast = this.cast
    let callerSpecname = this.specname()
    this.forward(
      new Operation(aSpecname, aAct, this.props.attributes.specname, false), 
      cast, 
      parentCast,
      callerCast,
      callerSpecname
    )
  }

  functionToTrackedFunction(aFn, aCast, aOptions) {
    return this.execFunctionWithTracking.bind(this, aFn, aCast, aOptions)
  }

  async execFunctionWithTracking(aFn, aCast, aOptions) {
    execDeferred( // exec deferred, so that last loss of focus event and corresponding field change can process first
      async () => {
        if ( await gApp.preventInteractionWhenBusy() ) return
        if ( aOptions && aOptions.isAction && gScanBuffer ) return // don't respond to ENTER embedded in scan
        this.showSpinner() 
        try {
          tc(5000)
          if ( Foreman.trackingFallout() ) throw(new Error("execFunctionWithTracking called when startTrackingFallout already called"))
          if ( aCast )
            aCast.__mold.lastSeguedCast = aCast
          let autoSave = true
          try {
            let err = await this.save(autoSave)
            if ( err ) {
              return
            }
          } catch(e) {
            return
          }
          Foreman.startTrackingFallout()
          try {
            if ( aCast )
              aCast.makePreFalloutCopy()
            await aFn()
            await Foreman.commit()
          } catch(e) {
            Foreman.rollbackFallout()
            this.showMessage(e.message)
            return
          }
          Foreman.stopTrackingFallout()
        } finally {
          this.hideSpinner()
        }
      },
      {noSpinner: true, ms: 50}
    )
  }

  async processScan(aStr) {
    let f = this.a().onScannerRead; if ( ! f ) return
    f = f.bind(this, this, this.cast, aStr)
    await this.execFunctionWithTracking(f, this.cast)
  }

  getTitle() {
    let a = this.props.attributes
    let res = a.title
    let dtf = a.dynamicTitle
    if ( dtf ) {
      dtf = dtf.bind(this)
      let t = dtf(this)
      if ( t )
        res = t
    }
    return res
  }

  initReadOnly() { /* Maint */
    if ( this.a().readOnly ) {
      this._readOnly = true
      this._readOnlyMessage = null
      return
    }
    let f = this.a().readOnlyHook; if ( ! f ) return false
    this._readOnly = false
    this._readOnlyMessage = false
    let msg = f(this, this.cast)
    if ( msg ) {
      this._readOnly = true
      this._readOnlyMessage = msg.translate()
    }
  }

  readOnly() { /* Maint */
    return this._readOnly
  }
  
  readOnlyMessage() {
    return this._readOnlyMessage
  }
  
  spinner() {
    let id = this.a().name.toId() + "Spinner"
    return (
      <Spinner animation="border" style={{float: "left", display: "none", marginTop: "4px"}} className="stSpinner mr-2" id={id}/>
    )
  }

  logo() {
    let iconName = this.a().icon
    if ( iconName ) {
      let icon = gApp.nameToIcon(iconName)
      if ( icon ) {
        let res = <div className="prfiTopLeftIcon">{icon}</div>
        return res
      }
    }
    return (
      <img src={logo} alt="logo" style={{width: "29px", height: "34px", float: "left", marginTop: "3px"}} className="prfiLogo"/>
    )
  }

  async downloadPDF(aOptions) {
    gApp.downloadPDF(this.cast, aOptions)
  }

  async downloadCSV(aOptions) {
    if ( ! aOptions ) throw(new Error("downloadCSV options must be specified"))
    let specname = aOptions.spec; if ( ! specname ) throw(new Error("downloadCSV spec must be specified"))
    let m = new Machine()
    let a = await m.specnameToAttributesAsync(specname)
    let writer = new Writer()
    let data
    startProgress({message: "Generating CSV..."})
    try {
      data = await writer.getDataAsArray({attributes: a, cast: this.cast, options: aOptions})
    } finally {
      stopProgress()
    }
    if ( writer.lastError ) {
      this.showMessage(writer.lastError)
    }
    const xu = XLSX.utils
    var ws = xu.json_to_sheet(data)
    var wb = xu.book_new();
    let docName = aOptions.docName || 'Download.CSV'
    xu.book_append_sheet(wb, ws, 'Main');
    XLSX.writeFile(wb, docName)
  }

  render() { /* Maint */
    //if ( global.usingDifferentForeman ) return null
    tc(146)
    gApp.currentSituation.sheet = this
    let op = this.operation()
    if ( (! this.initialising) && ((op !== this.lastOperation) || (this.version === 1) )) {
      this.initialising = true
      execDeferred(this.initialise.bind(this))
    }
    let title = this.getTitle()
    let sep = null
    let pcs = this.getPortalContainers()
    if ( pcs ) 
      sep = <div className="stGridSeparator"/>
    if ( ! gApp.firstMaintOrList )
      gApp.firstMaintOrList = this
    let subscribeLink = gApp.getSubscribeLink()
    let res = (
      <FormGroup className="stLevel3">
        <div className="pageTitle">
          {this.spinner()}
          {this.logo()}
          <div className="stPageTitleText" id="stPageTitleText">{title}</div>
          <div id="stLinks">
            <a id="stHelp" href="https://profitori.com/pro/help" target="_blank" rel="noopener noreferrer">{"Help".translate()}</a>
            <a id="stContactSupport" href="https://profitori.com/contactus" target="_blank" rel="noopener noreferrer">{"Contact Support".translate()}</a>
            {subscribeLink}
          </div>
        </div>
        <Row className="headerButtons">
          {this.headerButtons()}
        </Row>
        <FormGroup className="stLevel4" id="stLevel4"> 
          <FormGroup className="stLevel5" key={this.specname()}>
            {pcs}
            {sep}
            {this.getGrids()}
          </FormGroup>
        </FormGroup>
      </FormGroup>
    )
    tc(147)
    return res
  }

}

global.prfiMaintClass = Maint


class Particulars extends React.Component {

  constructor(aProps) {
    super(aProps)
    this.state = {version: 0}
  }
  
  a() {
    return this.props.attributes
  }

  cast() {
    return this.props.cast
  }

  container() {
    return this.props.container
  }

  fields() {
    if ( this.props.fields )
      return this.props.fields
    return this.a().fields
  }

  nameToField(aName) {
    return this.fields().filterSingle(field => field.name === aName)
  }

  fieldIsHidden(aField) { /* Particulars */
    let cast = this.cast()
    if ( aField.hideWhenBlank ) {
      let val = this.fieldNameToDisplayValue(aField.name, cast)
      if ( ! val )
        return true
    }
    if ( aField.visibleWhenInternal ) {
      if ( ! aField.visibleWhenInternal(this.container(), cast) )
        return true
    }
    if ( aField.visibleWhen ) 
      return ! aField.visibleWhen(this.container(), cast)
    if ( aField.hidden ) 
      return true
    let rt = aField.refersTo; if ( ! rt ) return false
    let rtm = Foreman.nameToMold(rt.datatype); if ( ! rtm ) return false
    if ( rtm.source === "WC" ) return false
    if ( ! rtm.key ) 
      return true
    return false
  }

  readOnly() { /* Particulars */
    let c = this.container()
    if ( ! c.readOnly ) return false
    return c.readOnly()
  }

  specname() {
    return this.container().specname()
  }

  fieldToCaption(field) {
    let f = this.container().fieldToCaption;
    if ( ! f )
      return field.caption
    f = f.bind(this.container())
    return f(field)
  }

  fieldToText(aField) { /* Particulars */
    if ( aField.snippet )
      return aField.content
    let name = aField.name
    let id = aField.name
    let val = this.fieldNameToDisplayValue(name, this.cast())
    let key = "fg-" + this.specname() + "-" + id
    let caption = null
    if ( ! this.props.hideCaptions )
      caption = <div><Label for={id} className="stLabel">{this.fieldToCaption(aField)}</Label></div>
    let contents
    if ( ! aField.jsEditor ) {
      contents = (
        <Label className="stTextField" name={"stocktend_" + name} value={val} id={id}>
          {val}
        </Label>
      )
    } else {
      contents = (
        <Editor
          key={id}
          highlight={code => highlight(code, languages.js)}
          id={id}
          name={name}
          value={val}
          padding={10}
          style={{
            fontFamily: '"Fira code", "Fira Mono", monospace',
            fontSize: 12,
            border: '1px solid #ced4da',
            borderRadius: '.25rem'
          }}
          disabled={true}
        />
      )
    }
    return (
      <FormGroup key={key}>
        {caption}
        <div>
          {contents}
        </div>
      </FormGroup>
    )
  }

  fieldToDownloadLink(aField) { /* Particulars */
    let name = aField.name
    let id = aField.name
    let cast = this.cast()
    let val = cast[name]
    let key = "fg-" + this.specname() + "-" + id
    let text = 'Download'.translate()
    let caption = null
    if ( ! this.props.hideCaptions )
      caption = <div><Label for={id} className="stLabel">{this.fieldToCaption(aField)}</Label></div>
    if ( ! (val.startsWith('http:') || val.startsWith('https:')) )
      val = gServer.getDownloadCall(cast, name)
    let theLink = (
      <a className="stLink" name={"stocktend_" + name} href={val} id={id} target="_blank" rel="noopener noreferrer">
        {text}
      </a>
    )
    return (
      <FormGroup key={key}>
        {caption}
        <div>
          {theLink}
        </div>
      </FormGroup>
    )
  }

  fieldToPostImage(aField) { /* Particulars */
    let name = aField.name
    let id = aField.name
    let url = this.fieldToPostImageCall(aField, this.cast())
    let key = "fg-" + this.specname() + "-" + id
    let caption = null
    if ( ! this.props.hideCaptions )
      caption = <div><Label for={id} className="stLabel">{this.fieldToCaption(aField)}</Label></div>
    let errFunc = e => {
      e.target.style.display = 'none'
    }
    return (
      <FormGroup key={key}>
        {caption}
        <div>
          <img className="stImageField" name={"stocktend_" + name} alt={aField.caption} src={url} id={id} onError={errFunc}>
          </img>
        </div>
      </FormGroup>
    )
  }

  fieldToPostImageCall(field, cast) {
    return cast.fieldToImageUrl(field)
/*
    let res
    let id = cast.id
    if ( field.postIdField ) {
      let ref = cast[field.postIdField]
      if ( ref )
        id = ref.id
    }
    res = gServer.getCallString({methodWithParms: 'stocktend_object?datatype=none&source=postImage&id=' + id + '&imageType=' + field.postImageType})
    return res
*/
  }

  fieldNameToDisplayValue(aName, aCast, aOptions) { /* Particulars */
    let f = this.nameToField(aName); if ( ! f ) return ''
    let res = this.fieldNameToValue(aName, aCast)
    if ( f.numeric && (res === global.unknownNumber()) )
      return "Unknown".translate()
    if ( f.date ) {
      if ( res === global.emptyYMD() ) 
        return ''
      res = res.toLocalDateDisplayText()
    }
    if ( f.decimals || (f.decimals === 0) ) {
      res = global.numToStringWithXDecimals(res, f.decimals, {thousandSep: true})
    }
    if ( f.minDecimals || (f.minDecimals === 0) )
      res = global.numToStringWithMinXDecimals(res, f.minDecimals, f.maxDecimals, {thousandSep: true})
    if ( f.refersTo && global.isObj(res) ) {
      res = res.keyval
      while ( global.isObj(res) )
        res = res.keyval
    }
    res += ''
    if ( f.translateOnDisplay )
      res = res.translate()
    if ( f.secret )
      res = ''
    if ( f.showAsLink && res) {
      if ( (! aOptions) || (! aOptions.noLinks) ) {
        res = (
          <Link 
            className="stParticularsDestinationLink"
            onClick={this.onFieldClick.bind(this, f, aCast)}
          >
            {res}
          </Link>
        )
      }
    }
    return res
  }

  async onFieldClick(aField, aCast) {
    if ( await gApp.preventInteractionWhenBusy() ) return
    if ( ! aCast ) return
    let mf = aField.toMoldField()
    let destCast
    let specname
    if ( mf.destinationFunction ) {
      let dest = await mf.destinationFunction(aCast, aCast[aField.name])
      if ( global.isString(dest) ) {
        destCast = aCast
        specname = dest
      } else
        destCast = dest
    } else if ( mf.hasAutoDestination() ) {
      destCast = await mf.getAutoDestinationCast(aCast)
    }
    if ( ! destCast ) 
      return
    if ( ! specname ) {
      specname = destCast.toDestinationSpecname(); if ( ! specname ) return
    }
    this.forward(
      new Operation(specname, "edit", null, false), 
      destCast,
    )
  }

  fieldNameToIndex(aName) {
    let fields = this.fields()
    for ( var i = 0; i < fields.length; i++ ) {
      let f = fields[i]
      if ( f.name === aName )
        return i
    }
    return -1
  }

/*
  fieldNameToPassedInValue(aName) {
    let idx = this.fieldNameToIndex(aName); if ( idx < 0 ) return null
    if ( ! this.props.values ) return null
    return this.props.values[idx]
  }
*/

  fieldNameToValue(aName, aCast) { /* Particulars */
    let res
    //if ( ! this.props.values )
      res = aCast[aName]
    //else 
      //res = this.fieldNameToPassedInValue(aName)
    if ( (! res) && (res !== 0) ) 
      return ''
    if ( ! global.isObj(res) ) 
      return this.safeValue(res)
    let val = res.keyval
    if ( res.id && res.datatype ) {
      let m = Foreman.nameToMold(res.datatype)
      if ( m ) {
        let refCast = m.quickIdToCast(res.id)
        if ( refCast && m.essence )
          val = refCast[m.essence]
        else if ( refCast && res.keyname && refCast[res.keyname] ) {
          val = refCast[res.keyname]
          if ( Cast.isReference(val) ) {
            if ( val.keyval )
              val = val.keyval
            else
              val = val.id
          }
        } else
          val = res.id
      }
    }
    return this.safeValue(val)
  }

  safeValue(aVal) {
    if ( aVal === 0 ) return aVal
    if ( ! aVal ) return ''
    return aVal
  }

  fieldHasFocus(aField) {
    let el = document.activeElement; if ( ! el ) return false
    let id = this.fieldToId(aField)
    let res = el.id === id
    return res
  }

  fieldToId(aField) {
    let res = aField.name
    if ( this.props.idSuffix )
      res += this.props.idSuffix
    return res
  }

  fieldNameToInputRenderValue(aName, aCast) { /* Particulars */
    let f = this.nameToField(aName); if ( ! f ) return ''
    let val
    let cast = aCast || this.cast()
    //if ( ! this.props.values )
      val = cast.fieldNameToValue(aName)
    //else {
      //if ( this.state.valuesChanged ) {
        //val = this.fieldNameToStateValue(aName)
      //} else 
        //val = this.fieldNameToPassedInValue(aName)
    //}
    if ( f.numeric && (val === global.unknownNumber()) )
      return "Unknown".translate()
    if ( f.decimals || (f.decimals === 0) ) {
      val = global.numToStringWithXDecimals(val, f.decimals)
    }
    if ( f.minDecimals || (f.minDecimals === 0) )
      val = global.numToStringWithMinXDecimals(val, f.minDecimals, f.maxDecimals)
    let res = val + ''
    if ( f.secret )
      res = ''
    res = f.doModifyInputRenderValue(res, cast)
    return res
  }

  nothingHasFocus() {
    let el = document.activeElement; 
    if ( ! el ) 
      return true
    return el.id ? false : true
  }

/*
  modStateValues(aFieldName, aValue) {
    let res
    if ( this.state.values )
      res = this.state.values.slice(0) // copy
    if ( ! res ) 
      res = this.props.values.slice(0) // copy
    let idx = this.fieldNameToIndex(aFieldName); if ( idx < 0 ) return res
    res[idx] = aValue
    return res
  }

  fieldNameToStateValue(aFieldName) {
    let values = this.state.values; if ( ! values ) return null
    let idx = this.fieldNameToIndex(aFieldName); if ( idx < 0 ) return null
    return values[idx]
  }
*/

  onInletBlur(aField, aValue) { /* Particulars */
    if ( this.props.onChange ) {
      let v = this.state.version + 1
      let newValObj = {}
      this.props.onChange(aField.name, aValue, null, newValObj).then(changed => {
        if ( ! changed ) return
        //let newValues = this.modStateValues(aField.name, newValObj.value)
        execDeferred(() => this.setState({version: v /* , valuesChanged: true, values: newValues */}), {noSpinner: true})
      })
      return
    }
    this.container().onChange(aField.name, aValue)
  }

  isInGrid() {
    return this.props.idSuffix
  }

  fieldToInput(aField) { /* Particulars */
    let container = this.container()
    let cast = this.cast()
    let moldVersion = cast && cast.__mold.version
    let name = aField.name
    let id = this.fieldToId(aField)
    let val = this.fieldNameToInputRenderValue(name)
    let useInlet = ( ! aField.date ) && ( ! aField.yesOrNo ) && ( ! aField.staticOptions ) && ( ! aField.dynamicOptions ) && ( ! aField.refersTo ) && 
      ( ! aField.multiLine ) && ( ! aField.file ) && ( ! aField.jsEditor )
    if ( ! useInlet ) {
      if ( (this.fieldHasFocus(aField) || this.nothingHasFocus()) && gLatestInputField && (aField.name === gLatestInputField.name) ) {
        if ( (! this.isInGrid()) || (gLatestInputCast === this.cast()) ) {
          val = gLatestInputValue
        }
      }
    }

    let rejection
    if ( container.fieldToRejection )
      rejection = container.fieldToRejection(aField)
    let invalid = rejection ? true : false
    let formFeedback = null
    if ( container.rejectionToFormFeedback )
      formFeedback = container.rejectionToFormFeedback(rejection)
    let disabled = this.container().spinnerIsShowing || Server.isWaiting() || (aField.adminOnly && ! gApp.userHasAdminRights)
    let input
    let guidance = null
    if ( aField.guidance )
      guidance = <FormText color="muted">{aField.guidance}</FormText>
    if ( useInlet ) {
      input = 
        <Inlet
          id={id}
          classRoot={this.props.classRoot}
          externalValue={val}
          onBlur={this.onInletBlur.bind(this, aField)}
          disabled={disabled}
          invalid={invalid}
          hideCaption={this.props.hideCaptions}
          widthPx={aField.inputWidthPx}
        >
        </Inlet>
    } else {
      let onChange = this.props.onChange || container.onChange.bind(container)
      let onBlur = this.props.onBlur || container.onBlur.bind(container)
      input =
        <STInput 
          value={val}
          id={id}
          field={aField}
          maint={container}
          container={container}
          parentVersion={container.state.version}
          moldVersion={moldVersion}
          onChange={onChange}
          onBlur={onBlur}
          invalid={invalid}
          hideCaption={this.props.hideCaptions}
          disabled={disabled}
        >
        </STInput>
    }
    let caption = null
    if ( ! this.props.hideCaptions )
      caption = <Label for={id} className="stLabel">{this.fieldToCaption(aField)}</Label>
    return (
      <FormGroup key={"fg-" + container.specname() + "-" + id}>
        {caption}
        {input}
        {formFeedback}
        {guidance}
      </FormGroup>
    )
  }

  getTitleDiv() {
    let title = this.props.title; if ( ! title ) return null
    return (
      <div className="stPanelTitle">
        {title}
      </div>
    )
  }

  fieldIsReadOnly(aField) {
    let cast = this.cast()
    if ( aField.isReadOnly() )
      return true
    if ( aField.readOnlyWhen ) {
      let res = aField.readOnlyWhen(this.container(), cast)
      return res
    }
    let val = cast[aField.name]
    let isPathlessFileName = val && (val.length <= 256) // if it's larger than this, assume it's the file contents waiting to be uploaded
    if ( aField.file && val && (val.startsWith('http') || isPathlessFileName) )
      return true
    return false
  }

  render() { /* Particulars */
    if ( global.usingDifferentForeman ) return false
    this.forward = this.props.forward
    let cast = this.cast()
    if ( ! cast ) return null
    let res = []
    let fields = this.fields()
    for ( var i = 0; i < fields.length; i++ ) {
      let f = fields[i]
      let p
      if ( this.fieldIsHidden(f) ) { 
        continue
      }
      if ( this.fieldIsReadOnly(f) || this.readOnly() ) {
        if ( f.postImage )
          p = this.fieldToPostImage(f)
        else if ( f.file )
          p = this.fieldToDownloadLink(f)
        else
          p = this.fieldToText(f)
      } else {
        p = this.fieldToInput(f)
      }
      res.push(p)
    }
    let props = this.props
    let className = props.className ? props.className : "stParticulars"
    let key = props.keyRoot ? props.keyRoot : "particulars"

    res = ( 
      <div className={className} key={key}>
        {this.getTitleDiv()}
        {res}
      </div>
    )

    return res
  }

}

class Page extends React.Component {

  constructor(aProps) {
    super(aProps)
    this.forward = aProps.forward
    this.state = {}
    this.version = 0
  }

  async referee(fieldName) {
    let cast = this.cast; if ( ! cast ) return null
    let res = await cast.referee(fieldName, {useEssence: true})
    return res
  }

  componentDidMount() {
    this.mounted = true
  }

  componentWillUnmount() {
    this.mounted = false
  }

  app() {
    return gApp
  }

  readOnly() {
    if ( this.a().readOnly === false )
      return false
    return true
  }

  getFieldValue(aName) {
    return this.fieldGet(aName)
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

  callerCast() {
    let res = this.props.callerCast
    if ( ! res )
      res = gApp.getAncestorCallerCast()
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

  showMessage(aMsg, aOptions) {
    gApp.showMessage(aMsg, aOptions)
  }

  onBlur(aEvent) {
    this.version++
    this.refreshState()
  }

  refreshState() {
    if ( ! this.mounted ) return
    this.setState({version: this.version})
  }

  onChange(aParm1, aValue, aInfo) {  /* Page */
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
    gLatestInputValue = val
    gLatestInputField = f
    gLatestInputCast = c
    let oldVal = c[name]
    f.setCastPropValue(c, val)
    let spinnerStarted

    let finish = (aAfterChangeMsg) => {
      if ( aAfterChangeMsg ) {
        gApp.showMessage(aAfterChangeMsg.translate())
        this.hideSpinner()
        c[name] = oldVal
        return
      }
      if ( f.isKey )
        c["wp_post_title"] = val
      this.changedSinceLastSaveAttempt = true
      if ( spinnerStarted )
        this.hideSpinner()
      c.refreshCalculations({force: true, keepState: true, point: 35, includeDefers: true}).then(() => {
        this.version++
        this.refreshState()
      })
    }

    if ( (! f.hasUserChangeMethod()) || (aInfo && aInfo.invalid) ) {
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

  getParticulars() {
    return (
      <Particulars
        classRoot="stPage"
        container={this}
        attributes={this.a()}
        cast={this.cast}
        forward={this.props.forward}
      />
    )
  }

  specname() {
    return this.a().specname
  }

  situation() {
    return this._situation || gApp.currentSituation
  }

  async initCast() { /* Page */
    if ( this.doingInitCast ) return
      
    this.doingInitCast = true
    let sit = this.situation()
    if ( sit._cast ) 
      this.cast = sit._cast
    else {
      let dt = this.datatype()
      this.cast = await dt.bringOrCreate(); 
      sit._cast = this.cast
      await this.updateDefaults()
    }
    this.setState({cast: this.cast})
    this.doingInitCast = false
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

  cancelFunction() {
    return async () => {
      if ( await gApp.preventInteractionWhenBusy() ) return
      gApp.backToFirstDifferentSpec()
    }
  }

  name() {
    return this.a().name
  }

  nameToId(aName) {
    return aName.toId()
  }

  headerButtons() { /* Page */
    let btns = []
    let maxNormalButtons = gApp.maxNormalButtons(1)
    let actions = this.props.attributes.actions
    let knt = 0
    for ( var i = 0; i < actions.length; i++ ) {
      let a = actions[i]
      let awf = a.availableWhen
      if ( awf ) {
        let available = awf(this.cast)
        if ( ! available )
          continue
      }
      let f = this.headerActionToFunction(a); if ( ! f ) continue
      let icon = gApp.actionToIcon(a)
      let key = a.name
      knt++
      if ( knt <= maxNormalButtons ) {
        let btn = (
          <Button key={key} onClick={f} className="stHeaderButton mr-1">
            {icon}
            {a.name}
          </Button>
        )
        btns.push(btn)
      }
    }
    if ( btns.length > 0 ) {
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
    }
    let res = (
      <Row className="headerButtons">
        <div>
          {btns}
        </div>
      </Row>
    )
    return res
  }

  moreDropdownItems() {
    let res = []
    let actions = this.props.attributes.actions
    let maxNormalButtons = gApp.maxNormalButtons(1)
    let knt = 0
    for ( var i = 0; i < actions.length; i++ ) {
      let a = actions[i]
      let f = this.headerActionToFunction(a); if ( ! f ) continue
      let key = this.nameToId(a.name)
      knt++
      if ( knt <= maxNormalButtons )
        continue
      let ddi = (
        <DropdownItem key={key} onClick={f} className="stMoreDropdownItem mr-1">{a.name}</DropdownItem>
      )
      res.push(ddi)
    }
    gMenu.addItemsToDropdown(res)
    return res
  }

  headerActionToFunction(aAction) { /* Page */
    if ( gApp.shouldHideSpec(aAction.specname) ) return null
    let res = this.doHeaderActionToFunction(aAction)
    if ( aAction.spinner )
      res = gApp.wrapFunctionWithSpinner(res, this)
    return res
  }

  doHeaderActionToFunction(aAction) { /* Page */
    let tof = aAction.tagOrFunction
    let specname = aAction.specname
    if ( tof === "cancel" )
      return this.cancelFunction()
    if ( ! tof )
      return this.segue.bind(this, "view", specname)
    let f = tof.bind(this, this, this.cast)
    return f
  }

  async segue(aAct, aSpecname, aCast) { /* Page */
    if ( await gApp.preventInteractionWhenBusy() ) return
    let parentCast
    let cast = aCast ? aCast : null
    let callerCast
    let callerSpecname
    this.forward(
      new Operation(aSpecname, aAct, this.props.attributes.specname, false), 
      cast, 
      parentCast,
      callerCast,
      callerSpecname
    )
  }

  logo() {
    let iconName = this.a().icon
    if ( iconName ) {
      let icon = gApp.nameToIcon(iconName)
      if ( icon ) {
        let res = <div className="prfiTopLeftIcon">{icon}</div>
        return res
      }
    }
    return (
      <img src={logo} alt="logo" style={{width: "29px", height: "34px", float: "left", marginTop: "3px"}} className="prfiLogo"/>
    )
  }

  setFieldValue(aName, aValue) { /* Page */
    this.setFieldValueByName(aName, aValue)
    this.version++
    this.refreshState()
  }

  setFieldValueByName(aName, aVal) {
    if ( ! this.nameToField(aName) ) throw(new Error("Attempted to set invalid field: " + aName))
    this.cast[aName] = aVal
  }

  nameToField(aName) {
    return this.fields().filterSingle(field => (field.name === aName) || (field.caption === aName))
  }

  fields() {
    return this.props.attributes.fields
  }

  async downloadPDF(aOptions) { /* Page */
    let cast = (aOptions && aOptions.cast) ? aOptions.cast : this.cast
    gApp.downloadPDF(cast, aOptions)
  }

  async downloadPDFandPrint(aOptions) {
    let cast = (aOptions && aOptions.cast) ? aOptions.cast : this.cast
    gApp.downloadPDFandPrint(cast, aOptions)
  }

  fieldNameToElement(aFieldName) {
    let el = document.getElementById(aFieldName)
    return el
  }

  render() { /* Page */
    let title = this.a().title
    if ( ! this.cast ) {
      execDeferred(this.initCast.bind(this), {forceSpinner: true, ms: 50})
      return null
    }
    if ( ! this.beforeLoadingDone ) {
      this.beforeLoadingDone = true
      let f = this.props.attributes.beforeLoading
      if ( f ) {
        execDeferred(
          () => {
            f(this).then(
              () => {
                execDeferred(
                  () => {
                    if ( ! this.mounted ) return
                    this.forceUpdate()
                  },
                  {forceSpinner: true, ms: 50}
                )
              }
            )
          },
          {forceSpinner: true, ms: 50}
        )
      }
    }
    let display = "flex"
    if ( this.a().noTitle )
      display = "none"
    let contactSupport = null
    let subscribeLink = gApp.getSubscribeLink()
    if ( ! this.props.hideContactSupport )
      contactSupport = 
        <div id="stLinks">
          <a id="stHelp" href="https://profitori.com/pro/help" target="_blank" rel="noopener noreferrer">{"Help".translate()}</a>
          <a 
            id="stContactSupport" 
            href="https://profitori.com/contactus" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            {"Contact Support".translate()}
          </a>
          {subscribeLink}
        </div>
    return (
      <FormGroup className="stLevel3">
        <div className="pageTitle" style={{display: display}}>
          {this.logo()}
          <div className="stPageTitleText" id="stPageTitleText">{title}</div>
          {contactSupport}
        </div>
        {this.headerButtons()}
        <FormGroup className="stPageLevel4" id="stLevel4">
          <FormGroup className="stLevel5" key={this.specname()}>
            {this.getParticulars()}
          </FormGroup>
        </FormGroup>
      </FormGroup>
    )
  }

}

global.prfiPageClass = Page


class List extends React.Component {

  constructor(aProps) {
    super(aProps)
    this.addMethods(aProps.attributes.methods)
    this.forward = aProps.forward
    if ( aProps.attributes.name === 'Search' )
      this.berth().searchText = global.globalSearchText
    let searchText = this.berth().searchText || '' 
    this.state = {searchText: searchText, version: 0, alter: false}
  }

  nameToAction(name) {
    let actions = this.props.attributes.actions
    for ( var i = 0; i < actions.length; i++ ) {
      let action = actions[i]
      if ( action.name === name )
        return action
    }
  }

  async doAction(name) {
    let a = this.nameToAction(name)
    if ( ! a ) {
      let g = this._grid
      if ( g )
        await g.doAction(name)
      return
    }
    let f = this.headerActionToFunction(a); if ( ! f ) return
    await f()
  }

  async referee(fieldName) {
    let cast = this.cast; if ( ! cast ) return null
    let res = await cast.referee(fieldName, {useEssence: true})
    return res
  }

  addMethods(methods) {
    if ( ! methods ) return
    for ( var methodName in methods ) {
      if ( this[methodName] )
        throw(new Error('Method name ' + methodName + ' conflicts with existing property'))
      this[methodName] = methods[methodName].bind(this)
    }
  }

  getActionParms() {
    return gApp.lastActionParms
  }

  dataChanged() {
    let g = this._grid; if ( ! g ) return
    g.dataChanged()
  }

  getFirstAncestorList(options) {
    return gApp.getFirstAncestorList(options)
  }

  async userFilterFunction(grid) {
    let res = {}
    let uf = this.currentUserFilter(); if ( ! uf ) return res
    let obj = await uf.convertToJS(grid); if ( ! obj ) return res
    if ( obj.err ) {
      res.err = obj.err 
      return res
    }
    let js = obj.js
    let fn
    let str = 
      'fn = (cast, grid) => {' + 
        'let res;' +
        'try {' + 
          'res = ' + js + ';' + 
        '} catch(e) {' +
          'res = false;' +
        '}' + 
        'return res;' + 
      '}'
/* eslint-disable no-eval */
    try {
      eval(str)
    } catch(e) {
      res.err = 'WARNING: Invalid filter'.translate() + ': ' + e.message
      return res
    }
    res.fn = fn
    return res
  }

  getGridFields() {
    if ( ! this._grid ) return false
    return this._grid.fields()
  }

  async downloadPDF(aOptions) { /* List */
    if ( aOptions.cast )
      this.cast = aOptions.cast
    gApp.downloadPDF(this.cast, aOptions)
  }

  async harmonize() {
    if ( this.props.inTile ) 
      return
    await gApp.harmonize()
  }

  parm() {
    return this.situation().parm
  }

  thereAreUnsavedChanges() {
    if ( ! this.state.alter ) return false
    return Foreman.thereAreUnsavedChanges()
  }

  vassal() {
    return false
  }

  altering() {
    return this.state.alter
  }

  back() {
    let f = this.cancelFunction()
    f()
  }

  ok() {
    let f = this.saveFunction(null, null, "ok")
    f().then(() => gApp.backToFirstDifferentSpec({promptIfUnsaved: false}))
  }

  casts() {
    return this._gridCasts
  }

  berth() {
    let sit = this.situation()
    let res = sit.getOrCreateBerth(this.name())
    return res
  }

  situation() {
    return this._situation || gApp.currentSituation
  }

  getFieldValue(aName) {
    return this.fieldGet(aName)
  }

  setFieldValue(aName, aValue) {
    this.setFieldValueByName(aName, aValue)
  }

  foreman() {
    return gForeman
  }

  startProgress(aParms) {
    startProgress(aParms)
  }

  stopProgress(aParms) {
    stopProgress(aParms)
  }

  async updateProgress(aParms) {
    await updateProgress(aParms)
  }

  async commit() {
    await Foreman.commit()
  }

  showMessage(aMsg, aOptions) {
    this.props.showMessage(aMsg, aOptions)
  }

  componentDidMount() {
    //tc(520)
    this.mounted = true
  }
  
  app() {
    return gApp
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

  setFieldValueByName(aName, aVal) { // List
    if ( ! this.cast ) return
    if ( ! this.nameToField(aName) ) throw(new Error("Attempted to set invalid field: " + aName))
    this.cast[aName] = aVal
    this.setState({version: this.state.version + 1})
  }

  hasHeader() {
    return this.props.attributes.withHeader
  }

  refreshState() {
    //tc(530)
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
    let display = "none"
    if ( this.spinnerIsShowing )
      display = "flex"
    return (
      <Spinner animation="border" style={{float: "left", display: display, marginTop: "4px"}} className="stSpinner mr-2" id={id}/>
    )
  }

  logo() {
    if ( this.props.hideLogo )
      return null
    let iconName = this.a().icon
    if ( iconName ) {
      let icon = gApp.nameToIcon(iconName)
      if ( icon ) {
        let res = <div className="prfiTopLeftIcon">{icon}</div>
        return res
      }
    }
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

  callerCast(options) {
    let immediateOnly = options && options.immediateOnly
    let res = this.props.callerCast
    if ( (! res) && (! immediateOnly) )
      res = gApp.getAncestorCallerCast()
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

  getParticulars() { /* List */
    if ( ! this.withHeader() ) return null
    return (
      <Particulars
        classRoot="stList"
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

  getGrids() {
    if ( ! this.withHeader() ) {
      return this.attributesToGrid(this.a(), 0)
    }
    let res = []
    let manifests = this.manifests()
    for ( var i = 0; i < manifests.length; i++ ) {
      let m = manifests[i]
      let grid = this.attributesToGrid(m.attributes, i)
      res.push(grid)
    }
    return res
  }

  attributesToGrid(aAttributes, aIdx) { /* List */
    let p = this.props
    return (
      <Grid 
        key={aIdx}
        list={this}
        attributes={aAttributes} 
        specname={p.operation.specname} 
        forward={p.forward} 
        showMessage={p.showMessage} 
        callerCast={p.callerCast}
        callerSpecname={p.callerSpecname}
        suppressTitle={true}
        disableInputs={this.spinnerIsShowing}
        searchText={this.state.searchText}
        modifyFields={p.attributes.modifyFields}
        containerVersion={this.state.version}
        refreshNo={this.refreshNo}
        alter={this.state.alter}
        containerCast={this.cast}
        userFilter={this.currentUserFilter()}
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
        await gApp.harmonize()
        if ( ! this.refreshNo )
          this.refreshNo = 0
        this.refreshNo++
        this.setState({version: this.state.version ? this.state.version + 1 : 0})
      }, 
      {forceSpinner: true, ms: 200}
    )
  }

  async initCast() { /* List */
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
    w = w / 2 // Allow for search bar
    let avgButtonWidth = 144
    let res = Math.round(w / avgButtonWidth) - 1
    if ( res > 6 )
      res = 6
    return res
  }

  getUserFilterButton() {
    let specname = this.specname()
    if ( (specname === "UserFilterList.js") || (specname === "Search.js") ) return null
    if ( this.specname() === "UserFilterList.js" ) return null
    let caption = 'Filter'.translate()
    let key = caption.toId()
    let res
    let uf = this.currentUserFilter()
    if ( uf )
      caption = uf.name.abbreviate(26)
    res = (
      <ButtonDropdown
        key={key}
        isOpen={this.state.userFiltersOpen}
        toggle={() => this.setState({userFiltersOpen: ! this.state.userFiltersOpen})}
      >
        <DropdownToggle caret className="stHeaderButton">
          {caption}
        </DropdownToggle>
        <DropdownMenu>
          {this.userFilterDropdownItems()}
        </DropdownMenu>
      </ButtonDropdown>
    )
    return res
  }

  currentUserFilter() {
    let res = this.berth().currentUserFilter
    if ( res && res._markedForDeletion )
      return null
    return res
  }

  setCurrentUserFilter(uf) {
    if ( uf === this.berth().currentUserFilter ) return
    this.berth().currentUserFilter = uf
    this.version++
    this.refreshState()
  }

  manageUserFilters() {
    this.segue('view', 'UserFilterList.js')
  }

  addUserFilter() {
    this.segue('add', 'UserFilterMaint.js')
  }

  userFilterDropdownItems() {
    let res = []
    let ufs = this._userFilters
    if ( ! ufs )
      ufs = []
    let showUnfilter = (this.currentUserFilter() ? true : false)
    for ( var i = 0; i < ufs.length; i++ ) {
      let uf = ufs[i]
      let caption = uf.name
      let key = caption.toId()
      let ddi = (
        <DropdownItem key={key} onClick={() => this.setCurrentUserFilter(uf)} className="stMoreDropdownItem mr-1">{caption}</DropdownItem>
      )
      res.push(ddi)
    }
    if ( ufs.length > 0 ) {
      res.push(<DropdownItem divider key="ddid"></DropdownItem>)
      res.push(
        <DropdownItem key="manageUserFilters" onClick={() => this.manageUserFilters()} className="stMoreDropdownItem mr-1">{'Manage Filters'.translate()}</DropdownItem>
      )
    }
    res.push(
      <DropdownItem key="addUserFilter" onClick={() => this.addUserFilter()} className="stMoreDropdownItem mr-1">{'Add Filter'.translate()}</DropdownItem>
    )
    if ( showUnfilter ) {
      res.push(
        <DropdownItem key="unfilter" onClick={() => this.setCurrentUserFilter(null)} className="stMoreDropdownItem mr-1">{'Unfilter'.translate()}</DropdownItem>
      )
    }
    return res
  }

  listSearcherClass() {
    return this.currentUserFilter() ? "stListSearcherSmall" : "stListSearcher"
  }

  filterAndSearchClass() {
    return this.currentUserFilter() ? "stFilterAndSearchBigFilter" : "stFilterAndSearch"
  }

  headerButtons() { /* List */
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
      let icon = gApp.actionToIcon(a)
      let key = caption.toId()
      knt++
      if ( knt <= maxNormalButtons ) {
        let btn = (
          <Button key={key} onClick={f} className="stHeaderButton mr-1">
            {icon}
            {caption}
          </Button>
        )
        if ( btn )
          btns.push(btn)
      }
    }
    let moreKey = this.name() + "-more"
    let moreBtn = (
      <ButtonDropdown
        className="stListFilterBtn"
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
    let fb = this.getSaveFeedback()
    if ( fb )
      btns.push(fb)
    let ufBtn = this.getUserFilterButton()
    let res = (
      <Table className="stListHeader" key="prfiHeaderButtons">
        <tbody>
          <tr>
            <td className="stListHeaderButtons">
              <div>
                {btns}
              </div>
            </td>
            <td className="stListSearcherCell">
              <div className={this.filterAndSearchClass()}>
                {ufBtn}
                <Searcher
                  className={this.listSearcherClass()}
                  key="stSearcher"
                  onChange={this.onSearcherChange.bind(this)}
                  value={this.state.searchText}
                  onClear={this.onSearcherClear.bind(this)}
                  list={this}
                />
              </div>
            </td>
          </tr>
        </tbody>
      </Table>
    )
    return res
  }

  moreDropdownItems() { /* List */
    let res = []
    let actions = this.props.attributes.actions
    let maxNormalButtons = this.maxNormalButtons()
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
    gMenu.addItemsToDropdown(res)
    return res
  }

  onSearcherClear() {
    if ( ! this.mounted ) return
    this.setState({searchText: ''})
    this.berth().searchText = '' 
    let f = this.a().afterSearchChange
    if ( f )
      f(this, '')
  }

  onSearcherChange(aEvent) {
    let t = aEvent.target
    let val = t.value
    if ( ! this.mounted ) return
    this.setState({searchText: val})
    this.berth().searchText = val 
    let f = this.a().afterSearchChange
    if ( f )
      f(this, val)
  }

  headerActionToFunction(aAction) { /* List */
    if ( gApp.shouldHideSpec(aAction.specname) ) return null
    let res = this.doHeaderActionToFunction(aAction)
    if ( aAction.spinner )
      res = gApp.wrapFunctionWithSpinner(res, this)
    return res
  }

  doHeaderActionToFunction(aAction) { /* List */
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
    if ( tof === "alter" ) 
      return this.startAlter.bind(this)
    if ( tof === "save" )
      return this.saveFunction()
    if ( tof === "ok" )
      return this.saveFunction(null, null, "ok")
    if ( ! tof ) {
      return this.segue.bind(this, "view", specname, this.cast, aAction.parms)
    }
    let f = tof.bind(this, this, this.cast)
    return this.functionToRefreshingFunction(f)
  }

  async refreshRejectionOnSave() {  /* List */
    this.rejection = null
    let casts = this.casts()
    for ( var i = 0; i < casts.length; i++ ) {
      let cast = casts[i]
      if ( ! cast.changed() ) continue
      let r = await cast.mold().acceptOrRejectCastOnSave(cast)
      if ( ! r ) continue
      r.message = cast.ultimateKeyval() + ": " + r.message
      this.rejection = r
      console.log("Error on saving: " + r.message)
      return
    }
  }

  saveFunction(aAutoSave, aForwarding, aAct) { /* List */
    let self = this
    return async () => {
      this.showSpinner()
      try {
        self.lastSaveFailed = false
        self.changedSinceLastSaveAttempt = false
        await self.refreshRejectionOnSave()
        if ( self.rejection ) {
          console.log("Error on save: " + self.rejection.message)
          self.lastSaveFailed = true
          self.refreshState()
          if ( aAutoSave && (! aForwarding) ) throw(new Error("Autosave failed: " + self.rejection.message))
          return self.rejection.message
        }
        // The save...
        let errMsg = await Foreman.atomicSave()
        if ( errMsg ) {
          self.lastSaveFailed = true
          console.log("Error on saving: " + errMsg)
          self.rejection = new Rejection(errMsg)
          self.refreshState()
          return errMsg
        }
        this.version = this.version + 1
        if ( ! aAutoSave )  {
          self.refreshState()
        }
      } finally {
        this.hideSpinner()
      }
    }
  }

  rejectionToFormFeedback(aRejection) {
    if ( ! aRejection ) return null
    return (
      <div key="formfeedback" id="stFormRejection" className="stFormRejection invalid-feedback d-block">{aRejection.message}</div>
    )
  }

  getSaveFeedback() {
    let res = null
    if ( this.lastSaveFailed && (! this.changedSinceLastSaveAttempt) )
      res = this.rejectionToFormFeedback(this.rejection)
    return res
  }

  thereAreEditableGridFields() {
    if ( ! this._grid ) return false
    let fields = this._grid.fields(); if ( ! fields ) return false
    for ( var j = 0; j < fields.length; j++ ) {
      let field = fields[j]
      if ( field.visibleWhen && ! field.visibleWhen(this) ) continue
      if ( field.visibleWhenInternal && ! field.visibleWhenInternal(this) ) continue
      if ( field.columnVisibleWhen && ! field.columnVisibleWhen(this, this.cast) ) continue
      if ( field.columnVisibleWhenInternal && ! field.columnVisibleWhenInternal(this, this.cast) ) continue
      if ( ! field.isReadOnly() ) {
        return true
      }
    }
    return false
  }

  startAlter(options) { /* List */
    if ( (! options) || (! options.skipFieldCheck) ) {
      if ( ! this.thereAreEditableGridFields() ) {
        gApp.showMessage('There are no editable fields - add the ones you need using the Customize button')
        return
      }
    }
    this.setState({alter: true})
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
    if ( await gApp.preventInteractionWhenBusy() ) return
    const xu = XLSX.utils
    let data = await this.getDataAsArray()
    var ws = xu.json_to_sheet(data)
    var wb = xu.book_new();
    let title = this.a().title
    title = global.left(title, 31)
    xu.book_append_sheet(wb, ws, title);
    XLSX.writeFile(wb, title + '.xlsx')
  }

  async getDataAsArray() { /* List */
    let g = this._grid || this.grid
    if ( ! g ) return []
    return await g.getDataAsArray()
  }

  async segue(aAct, aSpecname, cast, aParms) {
    if ( await gApp.preventInteractionWhenBusy() ) return
    let parentCast
    let callerCast
    let callerSpecname = this.a().specname
    gApp.lastActionParms = aParms
    this.forward(
      new Operation(aSpecname, aAct, this.props.attributes.specname, false), 
      cast, 
      parentCast,
      callerCast,
      callerSpecname
    )
  }

  async startAdding() { /* List */
    if ( await gApp.preventInteractionWhenBusy() ) return
    let a = this.props.attributes
    let specname = a.maintSpecname
    this.forward(
      new Operation(specname, "add", null, false), 
      null, 
      null
    )
  }

  cancelFunction() { /* List */
    return async () => {
      if ( await gApp.preventInteractionWhenBusy() ) return
      gApp.backToFirstDifferentSpec({promptIfUnsaved: this.state.alter})
    }
  }

  fields() {
    return this.props.attributes.fields
  }

  nameToField(aName) { /* List */
    return this.fields().filterSingle(field => (field.name === aName) || (field.caption === aName))
  }

  onBlur(aEvent) {
    this.version++
    this.refreshState()
  }

  showSpinner() {
    gShowSpinner(this, {immediate: true})
  }

  hideSpinner() {
    gHideSpinner(this)
  }

  onChange(aParm1, aValue, aInfo) {  /* List */
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
    gLatestInputValue = val
    gLatestInputField = f
    gLatestInputCast = c
    let oldVal = c[name]
    f.setCastPropValue(c, val)
    let spinnerStarted

    let finish = (aAfterChangeMsg) => {
      if ( aAfterChangeMsg ) {
        gApp.showMessage(aAfterChangeMsg.translate())
        this.hideSpinner()
        c[name] = oldVal
        return
      }
      if ( f.isKey )
        c["wp_post_title"] = val
      this.changedSinceLastSaveAttempt = true
      if ( spinnerStarted )
        this.hideSpinner()
      c.refreshCalculations({force: true, keepState: true, point: 36, includeDefers: true}).then(() => {
        this.version++
        this.refreshState()
      })
    }

    if ( (! f.hasUserChangeMethod()) || (aInfo && aInfo.invalid) ) {
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

  async init() {
    this._userFilters = await 'UserFilter'.bring({specname: this.specname()})
    this._userFilters.sort((a, b) => a.name >= b.name ? 1 : -1)
    if ( this.withHeader() && (! this.cast) ) 
      await this.initCast()
    this.forceUpdate()
  }

  render() { /* List */
    if ( ! gApp.installCheckComplete ) {
      return null
    }
    this._situation = gApp.currentSituation
    gApp.currentSituation.sheet = this
    let p = this.props
    //tc(140)
    if ( (! global.usingDifferentForeman) && 
        ((! this.firstRenderDone) || (p.containerRefreshNo !== this.lastContainerRefreshNo) || (this.lastRenderRefreshNo !== this.refreshNo)) 
      ) {
      gLatestInputField = null
      this.firstRenderDone = true
      this.lastContainerRefreshNo = p.containerRefreshNo
      this.lastRenderRefreshNo = this.refreshNo
      let f = this.props.attributes.beforeLoading
      if ( f ) {
        this.beforeLoadPending = true
        execDeferred(
          () => {
            this.showSpinner()
            execDeferred( 
              () => {
                f(this).then(
                  () => {
                    this.beforeLoadPending = false
                    execDeferred(
                      () => {
                        this.hideSpinner()
                        if ( ! this.mounted ) return
                        this.forceUpdate()
                        let alf = this.props.attributes.afterLoading
                        if ( alf )
                          execDeferred(() => alf(this))
                      }
                    )
                  }
                )
              }, {noSpinner: true, ms: 10}
            )
          },
          {noSpinner: true, ms: 10}
        )
      }
    }
    let title = this.getTitle()
    if ( ! this.initStarted ) {
      this.initStarted = true
      execDeferred(this.init.bind(this))
      return null
    }
/*
    if ( this.withHeader() && (! this.cast) ) {
      execDeferred(this.initCast.bind(this))
      return null
    }
*/
    let sep = null
    if ( this.withHeader() )
      sep = <div className="stGridSeparator"/>
    let contactSupport = null
    let subscribeLink = gApp.getSubscribeLink()
    if ( ! this.props.hideContactSupport )
      contactSupport = 
        <div id="stLinks">
          <a id="stHelp" href="https://profitori.com/pro/help" target="_blank" rel="noopener noreferrer">{"Help".translate()}</a>
          <a 
            id="stContactSupport" 
            href="https://profitori.com/contactus" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            {"Contact Support".translate()}
          </a>
          {subscribeLink}
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
    let grids = null
    if ( ! this.beforeLoadPending )
      grids = this.getGrids()
    if ( ! gApp.firstMaintOrList )
      gApp.firstMaintOrList = this
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
            {grids}
          </FormGroup>
        </FormGroup>
      </FormGroup>
    )
  }

}

global.prfiListClass = List


class Foreman {

  constructor() {
    this.molds = []
/* eslint-disable no-mixed-operators */
    this._uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, 
      function(c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      }
    );
/* eslint-enable no-mixed-operators */
  }

  anyHaveBeenSavedOrExternallyAlteredSince(datatypes, time) {
    for ( var i = 0; i < datatypes.length; i++ ) {
      let datatype = datatypes[i]
      let mold = this.doNameToMold(datatype); if ( ! mold ) continue
      if ( mold.hasBeenSavedOrExternallyAlteredSince(time) ) {
        return true
      }
    }
    return false
  }

  async populateNucleus() {

    let getDatatypes = () => {
      return [
        'session',
        'Configuration',
        'Mod',
        'Extension',
        'category',
        'tax_rates',
        'attribute',
        'metakey'
      ]
    }

    let processSpecs = () => {  
      let dts = getDatatypes()
      for ( var i = 0; i < dts.length; i++ ) {
        let dt = dts[i]
        let specname = dt + '.js'
        specname.spec()
      }
      'SettingsMaint.js'.spec() // add fields that aren't explicitly in Configuration.js
    }

    let getDatatypeBatches = () => {

      let currentBatch

      let initCurrentBatch = () => {
        currentBatch = {datatypes: [], plexquests: []}
      }

      let generateCurrentBatchPlexquests = () => {
        currentBatch.plexquests = []
        let dts = currentBatch.datatypes
        for ( var i = 0; i < dts.length; i++ ) {
          let dt = dts[i]
          let mold = Foreman.nameToMold(dt); if ( ! mold ) continue
          let plexquest = {
            datatype: dt,
            call: mold.getBasicBayCall()
          }
          currentBatch.plexquests.push(plexquest)
        }
      }

      let flushCurrentBatch = () => {
        if ( currentBatch.datatypes.length > 0 ) {
          generateCurrentBatchPlexquests()
          res.push(currentBatch)
        }
      }

      let res = []
      let dt; let dts = getDatatypes()
      initCurrentBatch()
      while ( dt = dts.__( ) ) {
        let mold = Foreman.nameToMold(dt); if ( ! mold ) continue
        currentBatch.datatypes.push(dt)
        mold.__plexed = true
      }
      flushCurrentBatch()
      return res
    }

    let constructBatchRequestBody = batch => {
      return {
        methodWithParms: "stocktend_object",
        msgToServer: 'getNucleus',
        json: {
          plexquests: batch.plexquests
        }
      }
    }

    let processBatch = async batch => {
      if ( global.logPlexus )
        "processBatch batch".m(batch)
      let json = constructBatchRequestBody(batch)
      let resultJson = await Server.post(json, null) 
      if ( ! resultJson )
        throw(new Error('Post failed'))
      if ( resultJson.data && (resultJson.data.code === "Error") )
        throw(new Error(resultJson.data.message))
      this.plexus.appendArray(resultJson.data)
      if ( global.logPlexus )
        "processBatch this.plexus".m(this.plexus)
    }

    if ( global.logPlexus )
      "populateNucleus Starting".m()
    processSpecs()
    try {
      this.plexus = []
      let batches = getDatatypeBatches()
      for ( var i = 0; i < batches.length; i++ ) {
        let batch = batches[i]
        await processBatch(batch)
      }
    } catch(e) {
      this.plexus = null
      console.log('Nucleus population failed: ' + e.message + ' (will use classic retrieval instead)')
    }
  }

  async populatePlexus() {
    if ( global.confVal('cdr') === 'Pre-2.9' ) {
      await this.populatePlexusPre29()
      return
    }

    if ( global.logPlexus )
      "populatePlexus Starting".m()

    let constructBatchRequestBody = batch => {
      return {
        methodWithParms: "stocktend_object",
        msgToServer: 'getPlexus',
        json: {
          plexquests: batch.plexquests
        }
      }
    }

    let processBatch = async batch => {
      if ( global.logPlexus )
        "processBatch batch".m(batch)
      let json = constructBatchRequestBody(batch)
      let resultJson = await Server.post(json, null) 
      if ( ! resultJson )
        throw(new Error('Post failed'))
      if ( resultJson.data && (resultJson.data.code === "Error") )
        throw(new Error(resultJson.data.message))
      this.plexus.appendArray(resultJson.data)
      if ( global.logPlexus )
        "processBatch this.plexus".m(this.plexus)
    }

    let getDatatypeBatches = () => {

      let currentBatch
      let maxBatchRows = 5000
      let maxIndividualRows = 1000 // 5000
      let maxFields = 500 // 300

      let initCurrentBatch = () => {
        currentBatch = {rowCount: 0, fieldCount: 0, datatypes: [], plexquests: []}
      }

      let generateCurrentBatchPlexquests = () => {
        currentBatch.plexquests = []
        let dts = currentBatch.datatypes
        for ( var i = 0; i < dts.length; i++ ) {
          let dt = dts[i]
          let mold = Foreman.nameToMold(dt); if ( ! mold ) continue
          let plexquest = {
            datatype: dt,
            call: mold.getBasicBayCall()
          }
          currentBatch.plexquests.push(plexquest)
        }
      }

      let flushCurrentBatch = () => {
        if ( currentBatch.datatypes.length > 0 ) {
          generateCurrentBatchPlexquests()
          res.push(currentBatch)
        }
        initCurrentBatch()
      }

      let getPotentiallyPlexedDatatypes = () => {
        let res = []
        let molds = gForeman.molds
        for ( var i = 0; i < molds.length; i++ ) {
          let mold = molds[i]
          if ( mold.source ) continue
          if ( mold.transient ) continue
          if ( mold.facade ) continue
          if ( mold.staticData ) continue
          if ( mold.plex === false ) continue
          if ( global.logPlexus )
            "getPotentiallyPlexedDatatypes mold.name".m(mold.name)
          res.push(mold.name)
        }
        return res
      }

      let res = []
      let dt; let dts = getPotentiallyPlexedDatatypes()
      initCurrentBatch()
      while ( dt = dts.__( ) ) {
        let mold = Foreman.nameToMold(dt); if ( ! mold ) continue
        mold.__plexed = false
        let rc = mold.__preludeRowCount
        if ( rc > 0 ) {
          let fc = mold.fields.length
          if ( (rc > maxIndividualRows) || (fc > maxFields) )
            continue
          let newRowCount = currentBatch.rowCount + rc
          let newFieldCount = currentBatch.fieldCount + fc
          if ( (newRowCount > 0) && ((newRowCount > maxBatchRows) || (newFieldCount > maxFields)) )
            flushCurrentBatch()
          currentBatch.datatypes.push(dt)
          currentBatch.rowCount += rc
          currentBatch.fieldCount += fc
        }
        mold.__plexed = true
      }
      flushCurrentBatch()
      return res
    }

    try {
      this.plexusDone = false
      if ( ! this.plexus )
        this.plexus = []
      let batches = getDatatypeBatches()
      for ( var i = 0; i < batches.length; i++ ) {
        let batch = batches[i]
        await processBatch(batch)
      }
      this.plexusDone = true
    } catch(e) {
      this.plexus = null
      console.log('Plexus population failed: ' + e.message + ' (will use classic retrieval instead)')
    }
  }

  static rollbackFallout() {
    gForeman.doRollbackFallout()
  }

  static trackingFallout() {
    return gForeman._trackingFallout
  }

  static nameToMold(aName, aOptions) {
    return gForeman.doNameToMold(aName, aOptions)
  }

  static idIsPermanent(aId) {
    return aId >= 0
  }

  static generateTempId() {
    let res = gNextTempId
    gNextTempId = gNextTempId - 1
    return res
  }

  static thereAreUnsavedChanges() {
    return gForeman.doThereAreUnsavedChanges()
  }

  static cancelChanges() {
    return gForeman.doCancelChanges()
  }

  uuid() {
    return this._uuid;
  }

  generateErrorOnNextSave() {
    this.spannerOnNextSave = true
  }

  generateErrorOnNextPreSave() {
    this.spannerOnNextPreSave = true
  }

  async checkNoDuplicateKeys() {
    await this.molds.forAllAsync(async m => {
      await m.checkNoDuplicateKeys()
    })
  }

  suspendCastSaves() {
    this.castSavesSuspended = true
  }

  unsuspendCastSaves() {
    this.castSavesSuspended = false
  }

  flushCache(aOptions) {
    let force = aOptions && aOptions.force
    if ( (! force) && this.doThereAreUnsavedChanges() ) return
    forAll(this.molds).do(mold => {
      if ( mold.readOnly ) return 'continue'
      mold.flush()
      mold.hasBeenRetrievedFromPlexus = false
    })
    global.foreman.plexus = null
  }

/*
  markAllCastsAsNeedingCalculation() {
    forAll(this.molds).do(mold => {
      mold.markAllCastsAsNeedingCalculation()
    })
  }
*/

  doThereAreUnsavedChanges() { /* Foreman */
    let res = false
    forAll(this.molds).do(mold => {
      if ( mold.transient || mold.staticData || mold.readOnly ) return 'continue'
      if ( mold.needsSaving() ) {
        res = true
        return 'break';
      }
    })
    return res
  }

  doCancelChanges() {
    forAll(this.molds).do(mold => {
      if ( mold.transient || mold.staticData || mold.readOnly ) return 'continue'
      mold.cancelChanges()
    })
  }

  doNameToMold(aName, aOptions) {
    let name = aName.stripAfterLast('.') // remove subset if there
    let m = this.doNameToExistingMold(name)
    if ( ! m ) {
      if ( aOptions && aOptions.allowCreate )
        m = this.createMold(name)
    }
    return m
  }

  doNameToExistingMold(aName) {
    let m = this.molds.filter(mold => mold.name === aName)[0]
    return m
  }

  createMold(aName) {
    let m = new Mold(aName)
    this.molds.push(m)
/*
    if ( gForeman.plexusDone ) {
      m.plex = false // too late
    }
*/
    if ( gForeman._prelude ) {
      let rowCount = gForeman._prelude[aName]
      if ( ! rowCount )
        rowCount = 0
      m.__preludeRowCount = rowCount
    }
    return m
  }

  static async save(aOptions) {
    return await gForeman.doSave(aOptions)
  }

  static async atomicSave(aOptions) {
    return await gForeman.doAtomicSave(aOptions)
  }

  static logMolds(aPoint, aDatatype, aOnlyIfChanged) {
    gForeman.doLogMolds(aPoint, aDatatype, aOnlyIfChanged)
  }

  async doAtomicSave(aOptions) {
    this.doStartTrackingFallout()
    try {
      let err = await this.doSaveInternal(aOptions)
      if ( err ) {
        console.log("Error in doAtomicSave: " + err)
        throw(new Error(err))
      }
    } catch(e) {
      this.doRollbackFallout()
      return e.message
    }
    this.doStopTrackingFallout()
  }

  addCast(aDatatype, aOptions) { /* Foreman */
    if ( gLogTimings ) tc(425)
    let m = this.doNameToMold(aDatatype); if ( ! m ) throw(new Error("Invalid datatype " + aDatatype))
    if ( gLogTimings ) tc(426)
    let res = m.addCast({parentCast: aOptions.parent, log: aOptions.log})
    return res
  }

  doRollbackFallout() {
    this.molds.forAll(m => m.rollbackFallout())
    this._trackingFallout = false
  }

  static startTrackingFallout() {
    gForeman.doStartTrackingFallout()
  }

  doStartTrackingFallout() {
    if ( this._trackingFallout ) throw(new Error("startTrackingFallout called when already tracking fallout"))
    this._trackingFallout = true
  }

  static stopTrackingFallout() {
    gForeman.doStopTrackingFallout()
  }

  doStopTrackingFallout() {
    if ( ! this._trackingFallout ) throw(new Error("stopTrackingFallout called when not tracking fallout"))
    this._trackingFallout = false
    this.molds.forAll(m => m.clearFallout())
  }
 
  static async commit() {
    return await gForeman.doCommit()
  }

  async doCommit(aOptions) {
    if ( ! this._trackingFallout ) throw(new Error("commit called when startTrackingFallout not yet called"))
    try {
      let err = await this.doSaveInternal(aOptions)
      if ( err ) 
        throw(new Error(err))
    } catch(e) {
      this.doRollbackFallout()
      throw(e)
    }
    this.restartTrackingFallout()
  }

  restartTrackingFallout() {
    this.doStopTrackingFallout()
    this.doStartTrackingFallout()
  }
 
  async doSave(aOptions) {
    let wasTracking = this._trackingFallout
    if ( ! this._trackingFallout )
      this.doStartTrackingFallout()
    try {
      let err = await this.doSaveInternal(aOptions)
      if ( err ) 
        throw(new Error(err))
    } catch(e) {
      this.doRollbackFallout()
      if ( aOptions && aOptions.msgOnException)
        gApp.showMessage(e.message)
      else {
        if ( wasTracking && (! this._trackingFallout) )
          this.doStartTrackingFallout()
        throw(e)
      }
    }
    if ( (! wasTracking) && this._trackingFallout )
      this.doStopTrackingFallout()
    if ( wasTracking && (! this._trackingFallout) )
      this.doStartTrackingFallout()
  }

  async doSaveInternal(aOptions) {

    let moldToNewlyChangedCasts = (aMold, aRound) => {
      let res = []
      if ( (aRound > 0) && (! aMold.__potentiallyAffectedBySideEffect) )
        return res
      let casts = aMold.casts
      for ( var i = 0; i < casts.length; i++ ) {
        let cast = casts[i]
        if ( ! cast.__potentiallyChanged )
          continue
        if ( cast.__sideEffectsDone )
          continue
        if ( (aRound > 0) && (! cast.__potentiallyAffectedBySideEffect) )
          continue
        aMold.setCastValuesToCorrectTypes(cast)
        if ( cast.isNew() || cast.changed() || cast.__dirty) {
          res.push(cast)
          cast.__sideEffectsDone = true
        } else {
          cast.__potentiallyChanged = false
          cast.__dirty = false
          cast.__saveAllFields = false
        }
      }
      return res
    }

    let initSideEffectFlags = (molds) => {
      molds.forAll(mold => {
        mold.changedCasts = []
        mold.__potentiallyAffectedBySideEffect = false
        let casts = mold.casts
        for ( var i = 0; i < casts.length; i++ ) {
          let c = casts[i]
          c.__sideEffectsDone = false
          c.__potentiallyAffectedBySideEffect = false
        }
      })
    }

    let resolveSideEffects = async () => {
      //let molds = this.molds.filter(m => ! (m.transient || m.staticData || m.readOnly))
      let molds = this.molds.filter(m => ! (m.transient || m.readOnly))
      //if ( gLogTimings ) tc(927)
      initSideEffectFlags(molds)
      //if ( gLogTimings ) tc(928)
      let round = 0
      while ( true ) {
        let newChangeCount = 0
        for ( var i = 0; i < molds.length; i++ ) {
          let mold = molds[i]
          //if ( gLogTimings ) tc(929)
          mold.newlyChangedCasts = moldToNewlyChangedCasts(mold, round)
          //if ( gLogTimings ) tc(930)
          if ( mold.newlyChangedCasts.length === 0 ) continue
          newChangeCount++
          mold.changedCasts.appendArray(mold.newlyChangedCasts)
          await mold.refreshCalculations({force: true, casts: mold.newlyChangedCasts, point: 2})
          mold.version++
          try {
            if ( mold.beforeFirstSave )
              await mold.beforeFirstSave()
            await mold.doBeforeSaving({casts: mold.newlyChangedCasts})
            if ( mold.afterLastSave )
              await mold.afterLastSave()
          } catch(e) {
            console.log('beforeSaving error in ' + mold.name + ': ' + e.message)
            throw(e)
          }
        }
        if ( newChangeCount === 0 )
          break;
        round++
      }
    }

    let waitUntilFinishedSaving = async () => {
      while ( this.saving ) {
        await global.wait(10)
      }
    }

    //if ( gLogTimings) tc(926)
    if ( aOptions && aOptions.fromCast && this.castSavesSuspended ) return
    //if ( this.saving && (! global.runningInsideWordpress) )
      //throw new Error("Foreman save called when already saving")
    if ( this.saving )
      await waitUntilFinishedSaving()
    let committed = false
    this.saving = true
    try {
      let errMsg = null
      let changedCasts = []
      let moldsWithChanges = []
      //if ( gLogTimings) tc(924)
      await resolveSideEffects()
      //if ( gLogTimings) tc(925)
      let molds = this.molds
      for ( var i = 0; i < molds.length; i++ ) {
        let mold = molds[i]
        if ( mold.transient || mold.staticData || mold.readOnly || mold.facade ) continue
        let moldChanges = {changedCasts: []}
        errMsg = await mold.prepareSave(moldChanges); if ( errMsg ) break
        if ( moldChanges.nakedCasts.length > 0 ) {
          moldsWithChanges.push(mold)
          changedCasts.appendArray(moldChanges.changedCasts)
        }
      }
      //if ( gLogTimings) tc(932)
      if ( this.spannerOnNextPreSave ) {
        this.spannerOnNextPreSave = null
        throw(new Error("Presave error was generated for testing"))
      }
      if ( errMsg ) return errMsg
      if ( changedCasts.length === 0 ) return
      this.putChildrenLast(changedCasts)
      errMsg = await this.postCastsInBatches(changedCasts, aOptions); if ( errMsg ) return errMsg
      committed = true
      for ( i = 0; i < moldsWithChanges.length; i++ ) {
        let mold = moldsWithChanges[i]
        mold.removeCastsMarkedForDeletion()
        await mold.refreshCalculations({force: true, casts: mold.changedCasts, point: 3})
        mold.version++
        mold._lastSavedTimeMs = global.nowMs()
        await mold.doAfterSaving()
      }
      //if ( gLogTimings) tc(933)
      if ( this.spannerOnNextSave ) {
        this.spannerOnNextSave = null
        throw(new Error("Save error was generated for testing"))
      }
    } catch(e) {
      if ( committed ) {
        this.flushCache() // cache will be in a potentially invalid state so get rid of it
        await 'Configuration'.bring() // Make sure this is re-cached
        await 'Mod'.bring() // Make sure this is re-cached
        await 'Extension'.bring() // Make sure this is re-cached
      }
      this.saving = false
      throw(e)
    } finally {
      this.saving = false
    }
  }

  async postCastsInBatches(aCasts, aOptions) {
    let len = aCasts.length
    let batch = []
    let showProgress = (len > 250)
    let done = 0
    this.castsBeingPosted = aCasts
    for ( var i = 0; i < len; i++ ) {
      let c = aCasts[i]
      c.__posted = false
    }
    if ( showProgress )
      startProgress({message: "Updating your data..."})
    try {
      for ( i = 0; i < len; i++ ) {
        batch.push(aCasts[i])
        if ( batch.length < 250 ) continue
        let err = await this.postCasts(batch, aOptions); if ( err ) return err
        done = done + batch.length
        await updateProgress(done / len)
        batch = []
      }
      let err = await this.postCasts(batch, aOptions); if ( err ) return err
    } finally {
      if ( showProgress )
        stopProgress()
    }
  }

  async postCasts(aCasts, aOptions) {
    let p = await this.createPayload(aCasts, aOptions)
    if ( gLogSaves ) "postCasts: payload size".m(aCasts.length)
    if ( gLogSaves ) "postCasts: payload".m(p)
    let json = await Server.post(p, aOptions); if ( ! json ) return
    if ( gLogSaves ) "postCasts: server response json".m(json)
    if ( json.data && (json.data.code === "Error") )
      return json.data.message
    this.refreshSavedCasts(json, aCasts)
  }

  doLogMolds(aPoint, aDatatype, aOnlyIfChanged) {
    this.molds.forAll(m => {
      if ( aDatatype && (aDatatype !== m.name) ) return 'continue'
      if ( aOnlyIfChanged && (m.getChangedCasts().length === 0) ) return 'continue'
      "logMold m".m(m)
    })
  }

  static resolveChildMolds() {
    gForeman.doResolveChildMolds()
  }

  doResolveChildMolds() {
    this.molds.forAll(m => {
      m.childLevel = global.padWithZeroes(m.countParents(), 2)
      //let pm = m.parentMold(); if ( ! pm ) return 'continue'
      let pms = m.parentMolds()
      for ( var i = 0; i < pms.length; i++ ) {
        let pm = pms[i]
        pm.addChildMold(m)
      }
    })
  }

  putChildrenLast(aCasts) {
    aCasts.sort(
      (aCastA, aCastB) => {
        let a = this.castToSortKey(aCastA)
        let b = this.castToSortKey(aCastB)
        if ( a > b ) return 1
        if ( a < b ) return -1 
        return 0
      }
    )
  }

/*
  castToSortKey(aCast) {
    let isChild01 = Cast.nakedCastIsChild(aCast) ? '1' : '0'
    let id = aCast.id
    if ( id < 0 )
      id = (-id) + 10000000
    id = global.padWithZeroes(id, 8)
    let res = isChild01 + aCast._datatype + id
    return res
  }
*/

  castToSortKey(aCast) {
    let childLevel = aCast.__mold.childLevel
    let id = aCast.id
    if ( id < 0 )
      id = (-id) + 100000000000
    id = global.padWithZeroes(id, 12)
    let res = childLevel + aCast._datatype + id
    return res
  }
  
  async createPayload(aChangedCasts, aOptions) {
    let json = await Cast.castsToPayloadCasts(aChangedCasts)
    let res = 
      {
        methodWithParms: "stocktend_object",
        json: json
      }
    if ( aOptions && aOptions.msgToServer )
      res.msgToServer = aOptions.msgToServer
    return res
  }

  permanizeRefIds(tempId, permanentId) {
    let casts = this.castsBeingPosted
    for ( var i = 0; i < casts.length; i++ ) {
      let c = casts[i]
      if ( c.__posted ) continue // permanizeRefIds is only to set permanent ids on subsequent batches, not the current batch
      let affected = false
      if ( c.parentId === tempId ) {
        c.parentId = permanentId
        affected = true
      }
      let m = c.__mold
      for ( var prop in c ) {
        if ( c.propIsSystemProp(prop) ) continue
        let val = c[prop]; if ( ! val ) continue
        if ( ! Cast.isReference(val) ) 
          continue
        if ( val.id === tempId ) {
          val.id = permanentId
          affected = true
        }
      }
      if ( ! affected )
        continue
      m.refreshParentIndex(c)
      m.refreshKeyIndex(c)
      m.refreshFieldIndexes(c)
    }
  }

  markMoldsAsStale(antiques, retrievingMold) {
    for ( var i = 0; i < antiques.length; i++ ) {
      let a = antiques[i]
      let dt = a.datatype
      let ts = a.timestamp
      let m = Foreman.nameToMold(dt); if ( ! m ) continue
      if ( m !== retrievingMold ) { // we just retrieved the latest, so we're no longer stale
        if ( ! m._stale ) {
          m._stale = true
          m._staleTimestamp = ts
        }
      }
      this._lastExternallyAlteredTimeMs = global.nowMs()
      if ( a.excisions && a.excisions.length > 0 )
        m.excise(a.excisions)
      m.version++
    }
  }

  refreshSavedCasts(aJson, aChangedCasts) {
    let i = 0
    let lastCast = aJson.data.last()
    if ( lastCast && lastCast.antiques ) {
      this.markMoldsAsStale(lastCast.antiques)
      aJson.data.pop()
    }
    let ccs = aChangedCasts
    for ( var j = 0; j < ccs.length; j++ ) {
      ccs[j].__posted = true
    }
    while ( i < ccs.length ) {
      let c = ccs[i]
      let m = c.__mold
      let sc = aJson.data[i]
      let origId = c.id
      let key = c.__mold.key
      m.copyCastToCast(sc, c, {ignoreDecimals: true})
      c.__old = c.copyNaked()
      c.setValuesToCorrectTypes() // because decimals were ignored above
      c.__potentiallyChanged = false
      c.__dirty = false
      c.__saveAllFields = false
      if ( origId < 0 && c.addedDirectlyByUser ) {
        m.lastAddedCast = c
      }
      if ( c.id !== c.__indexedId )
        m.refreshIdIndex(c)
      if ( c.parentId !== c.__indexedParentId )
        m.refreshParentIndex(c)
      if ( key && (c[key] !== c.__indexedKeyval) ) {
        m.refreshKeyIndex(c)
      }
      m.refreshFieldIndexes(c)
      if ( (origId < 0) && (c.id > 0) )
        this.permanizeRefIds(origId, c.id)
      i = i + 1
    }
  }

}

let gForeman = new Foreman()
global.foreman = gForeman
global.stForemanClass = Foreman


class Field {

  constructor(aName) {
    this.name = aName
    this.caption = this.nameToCaption(aName)
  }

  refersToMoldWithEssence() {
    let rt = this.refersTo; if ( ! rt ) return false
    if ( global.isArray(rt.datatype) ) 
      return false
    let m = Foreman.nameToMold(rt.datatype); if ( ! m ) return false
    if ( ! m.essence ) return false
    return true
  }

  toInception() {
    let res = this.inception
    if ( res )
      return res
    let nf = this.toNativeField(); if ( ! nf ) return null
    return nf.inception
  }

  toAfterUserChange() {
    let res = this.afterUserChange
    if ( res )
      return res
    let nf = this.toNativeField(); if ( ! nf ) return null
    return nf.afterUserChange
  }

  hasUserChangeMethod() {
    if ( this.afterUserChange ) return true
    let nf = this.toNativeField() 
    if ( nf && nf.afterUserChange ) return true
    if ( this.toMold().afterAnyUserChange ) return true
    return false
  }

  toNativeField() {
    let m = Foreman.nameToMold(this.datatype); if ( ! m ) return null
    return m.nameToField(this.name)
  }

  isAlwaysCalculated() {
    return this.calculate && (! this.calculateWhen)
  }

  hasAutoDestination() {
    let m
    if ( this.isKey ) {
      m = Foreman.nameToMold(this.datatype); if ( ! m ) return false
      if ( ! m.destinationSpecname ) return false
      return true
    }
    let rt = this.refersTo; if ( ! rt ) return false
    if ( global.isArray(rt.datatype) ) 
      return false
    m = Foreman.nameToMold(rt.datatype); if ( ! m ) return false
    if ( ! m.destinationSpecname ) return false
    return true
  }

  async getAutoDestinationCast(aCast) {
    if ( this.isKey ) {
      return aCast
    }
    let rt = this.refersTo; if ( ! rt ) return null
    if ( global.isArray(rt.datatype) ) 
      return null
    let ref = aCast[this.name]; if ( ! ref ) return null
    if ( ! ref.id ) return null
    let res = await rt.datatype.bringSingle({id: ref.id})
    return res
  }

  toMold() {
    return Foreman.nameToMold(this.datatype)
  }

  toMoldField() {
    let m = Foreman.nameToMold(this.datatype); if ( ! m ) return null
    return m.nameToField(this.name)
  }

  refersToDatatype() {
    let rt = this.refersTo; if ( ! rt ) return null
    return rt.datatype
  }

  dispositionAsString() {
    if ( this.numeric )
      return "Numeric"
    if ( this.date )
      return "Date"
    if ( this.yesOrNo )
      return "YesOrNo"
    return "String"
  }

  doAfterUserChange(aOldVal, aVal, aCast, aMaintOrList) {
    aCast.doAfterAnyUserChange(aMaintOrList)
    let fn = this.toAfterUserChange(); if ( ! fn ) return aVal
    let res = fn(aOldVal, aVal, aCast, aMaintOrList)
    return res
  }

  doModifyRenderValue(aVal, aCast) {
    let fn = this.modifyRenderValue; if ( ! fn ) return aVal
    return fn(aVal, aCast)
  }

  doModifyInputRenderValue(aVal, aCast) {
    let fn = this.modifyInputRenderValue; if ( ! fn ) return aVal
    return fn(aVal, aCast)
  }

  isReadOnly() {
    if ( this.readOnly ) 
      return true
    if ( this.snippet )
      return true
    if ( this.postImage )
      return true
    let rt = this.refersTo; if ( ! rt ) return false
    return rt.refereeIsParent
  }

  refersToParent() {
    let rt = this.refersTo; if ( ! rt ) return false
    return rt.refereeIsParent
  }

  nameToCaption(aName) {
    let name = this.capitalizeFirstLetter(aName)
    let words = this.splitCamelCapWords(name)
    return words.join(' ')
  }

  capitalizeFirstLetter(aStr) {
    if ( ! aStr ) return aStr
    let res = aStr[0].toUpperCase() + aStr.substring(1, 9999)
    return res
  }

  splitCamelCapWords(aStr) {
    if ( ! aStr ) return ''
    let res = []
    let word = ''
    for ( let i = 0; i < aStr.length; i++ ) {
      let c = aStr[i]
      if ( word.length === 0 ) {
        word = word + c
        continue
      }
      if ( this.isUpper(c) ) {
        let nextC = (i === (aStr.length - 1)) ? '' : aStr[i + 1]
        if ( this.isUpper(nextC) ) {
          word = word + c
          continue
        }
        res.push(word)
        word = c
      } else {
        word = word + c
      }
    }
    res.push(word)
    return res
  }

  isUpper(aChar) {
    if ( ! aChar ) return false
    return aChar === aChar.toUpperCase()
  }

  setCastPropValue(aCast, aVal, aOptions, maint) { // Field
    let val = aVal
    let oldVal = aCast[this.name]
    aCast.__potentiallyChanged = true
    if ( ! this.refersToDynamicData() ) {
      if ( aOptions && aOptions.forImport ) {
        if ( this.date && val ) {
          if ( global.isNumeric(val) )
            val = global.excelDateToYMD(val)
          else if ( ! global.isYMD(val) ) 
            val = global.localToYMD(val + '')
        }
      }
      if ( this.numeric && global.isNumeric(val) ) {
        let sep = global.stDecimalSeparator
        if ( (sep !== '.') && global.isString(val) )
          val = val.replace(sep, '.')
        val = Number(val)
        if ( this.decimals || (this.decimals === 0) )
          val = global.roundToXDecimals(val, this.decimals)
        else if ( this.maxDecimals || (this.maxDecimals === 0) )
          val = global.roundToXDecimals(val, this.maxDecimals)
      }
      if ( aCast[this.name] === val ) {
        if ( aCast[this.name] === aVal )
          return false
        else
          return true
      }
      aCast[this.name] = val
      this.updateIndex(aCast, oldVal)
      return true
    }
    let keyname = this.keynameReferringTo()
    let rt = this.refersTo
    let rdt = rt.datatype
    if ( global.isArray(rdt) && rt.refereeIsParent ) {
      if ( maint ) {
        rdt = maint.parentDatatype()
      } else if ( aOptions && aOptions.parentCast ) {
        rdt = aOptions.parentCast.datatype()
      } else
        throw new Error('setCastPropValue called without maint or parentCast on datatype with multiple parents')
      let rtMold = Foreman.nameToMold(rdt)
      keyname = rtMold.key
    }
    if ( val && (! Cast.isReference(val)) ) {
      val = {datatype: rdt, keyname: keyname, keyval: val}
    }
    if ( val && (! val.id) ) {
      let m = Foreman.nameToMold(rdt)
      let c = m && m.fastRetrieveSingle({[keyname]: val}, {noCalc: true})
      let id = c && c.id
      if ( id )
        val.id = id
    }
    aCast[this.name] = val
    this.updateIndex(aCast, oldVal)
    return true
  }

  updateIndex(aCast, aOldVal) {
    if ( this.isKey )
      aCast.__mold.refreshKeyIndex(aCast, aOldVal)
  }

  refersToDynamicData() {
    let rt = this.refersTo; if ( ! rt ) return false
    return rt.staticData ? false : true
  }

  keynameReferringTo() {
    let rt = this.refersTo; if ( ! rt ) return ''
    let dt = rt.datatype
    if ( global.isArray(dt) ) return null
    dt = global.normalizeDatatype(dt)
    let rtMold = Foreman.nameToMold(dt)
    return rtMold.key
  }

  clone() {
    let res = new Field(this.name)
    for ( var prop in this ) {
      if ( ! Object.prototype.hasOwnProperty.call(this, prop) ) continue
      if ( global.isFunction(this[prop]) ) continue
      res[prop] = this[prop]
    }
    return res
  }

}

class Grid extends React.Component {

  constructor(aProps) {
    super(aProps)
    this.state = {moldVersion: -1}
    this.allCasts = []
    this.casts = []
    this.version = 0
    this._fields = []
    this.fieldDataVersion = 0
    let b = this.berth()
    if ( ! b.fathomage )
      b.fathomage = 50
  }

  nameToAction(name) {
    let actions = this.props.attributes.actions
    for ( var i = 0; i < actions.length; i++ ) {
      let action = actions[i]
      if ( action.name === name )
        return action
    }
  }

  async doAction(name) {
    let a = this.nameToAction(name); if ( ! a ) return
    let f = this.headerActionToFunction(a); if ( ! f ) return
    await f()
  }

  getFocusedCast() {
    let id = activeElementId()
    let rowNoStr = id.split('-').last(); if ( ! rowNoStr ) return null
    if ( ! global.isNumeric(rowNoStr) ) return null
    let rowNo = parseFloat(rowNoStr)
    if ( this.casts.length <= rowNo ) return null
    return this.casts[rowNo]
  }

  focusField(castOrRowNo, fieldName, options) {
    let cast = castOrRowNo
    if ( Number.isInteger(castOrRowNo) )
      cast = this.casts.first()
    if ( ! cast ) return
    let b = this.berth(); if ( ! b ) return
    b.fathomage = 9999999
    this.focusCast = cast
    this.focusFieldName = fieldName
    this.focusOptions = options
    this.version++
    this.refreshState()
  }

  doFocusField() {
    let c = this.focusCast
    let fn = this.focusFieldName
    this.focusCast = null
    this.focusFieldName = null
    let el = this.castAndFieldNameToElement(c, fn); if ( ! el ) return
    if ( el !== document.activeElement )
      el.focus()
    if ( el.select )
      el.select()
    let after = this.focusOptions && this.focusOptions.after
    if ( after )
      after()
  }

  castToRowNo(cast) {
    return this.casts.indexOf(cast)
  }

  castAndFieldNameToElement(cast, fieldName) {
    let rowNo = this.castToRowNo(cast); if ( rowNo < 0 ) return null
    let id = this.nameToId(fieldName) + '-' + rowNo
    return document.getElementById(id)
  }

  situation() {
    return this.maintOrList().situation()
  }

  berth() {
    return this.maintOrList().berth()
  }

  refreshState() {
    if ( ! this.mounted ) return
    let m = this.mold()
    if ( ! m ) return
    let b = this.berth()
    if ( ! b ) return
    tc(450)
    this.setState({moldVersion: m.version, version: this.version, searchText: this.searchText, fathomage: b.fathomage})
    tc(451)
  }

  componentDidMount() {
    this.mounted = true
  }

  componentWillUnmount() {
    this.mounted = false
  }

  createField(aParms) { /* Grid */
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
    f.postImage = aParms.postImage
    f.postImageType = aParms.postImageType
    f.postIdField = aParms.postIdField
    f.inputWidthPx = aParms.inputWidthPx
    return f
  }

  adjustScrollPosition() {
    let m = this.mold()
    let cast = m.lastAddedCast || m.lastSeguedCast; if ( ! cast ) return
    let rowId = this.castToRowId(cast); if ( ! rowId ) return
    let row = document.getElementById(rowId); if ( ! row ) return
    m.lastAddedCast = null
    m.lastSeguedCast = null
    gApp.cancelScrollTop()
    execDeferred(() => {this.scrollRowIntoView(row); gApp.rememberScrollTop()}, {ms: 200, noSpinner: true})
  }

  scrollRowIntoView(aRow) {
    if ( this.rowInViewport(aRow) )
      return
    aRow.scrollIntoView()
  }

  rowInViewport(aRow) {
    let rect = aRow.getBoundingClientRect()
    let h = window.innerHeight || document.documentElement.clientHeight
    return (
      rect.bottom > 0 &&
      rect.top < h 
    )
  }

  callerCast() {
    let res = this.props.callerCast
    if ( ! res )
      res = gApp.getAncestorCallerCast()
    return res
  }

  callerSpecname() {
    return this.props.callerSpecname
  }

  async startAddingLine(fakeSave, action) { /* Grid */
    let bf = action && action.before
    if ( bf ) {
      try {
        await bf(this, this.containerCast())
      } catch(e) {
        gApp.showMessage(e.message)
        return
      }
    }
    if ( await gApp.preventInteractionWhenBusy() ) return
    let a = this.props.attributes
    let specname = a.maintSpecname
    if ( this.isWithinAMaint() ) {
      let err = await this.props.maint.saveFromGrid(fakeSave); if ( err ) return
    }
    let ok = await this.doBeforeForward({validateOnly: true}); if ( ! ok ) return
    let parentCast = this.containerCast()
    let callerSpecname = this.containerSpecname()
    this.forward(
      new Operation(specname, "add", this.containerSpecname(), this.isWithinAMaint()), 
      null, 
      parentCast,
      null,
      callerSpecname
    )
  }

  async doBeforeForward(aOptions) {
    let f = this.props.beforeForward
    if ( ! f ) return true
    let res = await f(aOptions);
    return res
  }

  async segueToDestination(aFromCast, aDestCast, aAct, aSpecname) {
    if ( await gApp.preventInteractionWhenBusy() ) return
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

  async segue(aIdx, aAct, aSpecname, aMakeChild) {
    if ( await gApp.preventInteractionWhenBusy() ) return
    let parentCast
    let cast
    if ( aAct === "edit" )
      cast = this.casts[aIdx]
    else if ( aAct === "editParent" ) {
      cast = await this.casts[aIdx].parent()
    } else if ( aMakeChild )
      parentCast = this.casts[aIdx]
    if ( cast )
      cast.__mold.lastSeguedCast = cast
    let callerCast = this.casts[aIdx]
    let callerSpecname = this.containerSpecname()
    let ok = await this.doBeforeForward(); if ( ! ok ) return
    this.forward(
      new Operation(aSpecname, aAct, this.containerSpecname(), this.isWithinAMaint()), 
      cast, 
      parentCast,
      callerCast,
      callerSpecname
    )
  }

  key() {
    return this.props.attributes.key
  }

  async startEditingLine(aIdx) {
    if ( await gApp.preventInteractionWhenBusy() ) return
    let a = this.props.attributes
    let self = this
    let c = this.casts[aIdx]
    c.__mold.lastSeguedCast = c
    let parentCast = this.containerCast()
    let ok = await this.doBeforeForward({validateOnly: true}); if ( ! ok ) return
    let callerCast = this.casts[aIdx]
    let callerSpecname = this.containerSpecname()
    self.forward(
      new Operation(a.maintSpecname, "edit", this.containerSpecname(), this.isWithinAMaint()), 
      c, 
      parentCast,
      callerCast,
      callerSpecname
    )
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
    gShowSpinner(this.maintOrList(), {immediate: immediate})
  }

  hideSpinner() {
    gHideSpinner(this.maintOrList())
  }

  trashFunction(aIdx) { /* Grid */
    let self = this
    return async () => {
      if ( await gApp.preventInteractionWhenBusy() ) return
      if ( this.containerIsReadOnly() ) {
        this.showMessage(this.containerReadOnlyMessage())
        return
      }
      let c = this.casts[aIdx]
      if ( this.state.trashConfirmCast !== c ) {
        this.setState({trashConfirmCast: c})
        return
      }
      this.showSpinner() 
      try {
        gApp.rememberScrollTop()
        let mol = this.maintOrList()
        try {
          if ( mol && mol.a().beforeTrash )
            await mol.a().beforeTrash(mol, c)
          await c.__mold.trashCastById(c.id)
          c.doAfterAnyUserChange(this)
        } catch(e) {
          this.showMessage(e.message)
          return
        }
        if ( ! this.isWithinAMaint() ) {
          await Foreman.save({msgOnException: true})
        }
        self.refreshData()
        if ( mol && mol.a().afterTrash )
          await mol.a().afterTrash(mol, c)
        this.setState({trashConfirmCast: null})
      } finally {
        this.hideSpinner()
        execDeferred(() => gApp.restoreScrollTop(), {ms: 200, noSpinner: true})
      }
    }
  }

  async getDataAsArray() { /* Grid */
    let res = []
    let mol = this.maintOrList()
    let incFn = mol && mol.a() && mol.a().shouldIncludeCastInDownload
    for ( var i = 0; i < this.casts.length; i++ ) {
      let c = this.casts[i]
      if ( incFn ) {
        let include = incFn(c)
        if ( ! include )
          continue
      }
      let nc = {}
      let fields = this.fields()
      let len = fields.length
      for ( var j = 0; j < len; j++ ) {
        let f = fields[j]
        if ( f.hidden ) continue
        nc[f.caption] = this.fieldToExtractValue(f, c)
      }
      res.push(nc)
    }
    return res
  }

  fieldToExtractValue(aField, aCast) {
    let f = aField; if ( ! f ) return ''
    let res = this.fieldNameToValue(f.name, aCast)
    if ( f.numeric && (res === global.unknownNumber()) )
      return "Unknown".translate()
    let ores = res
    if ( f.decimals || (f.decimals === 0) )
      res = global.numToStringWithXDecimals(res, f.decimals, {forceDot: true})
    if ( f.minDecimals || (f.minDecimals === 0) )
      res = global.numToStringWithMinXDecimals(ores, f.minDecimals, f.maxDecimals, {forceDot: true})
    if ( f.translateOnDisplay )
      res = (res + '').translate()
    if ( f.secret )
      res = ''
    if ( f.numeric )
      res = parseFloat((res + ''), 10)
    if ( f.date && (res === global.emptyYMD()) )
      res = ''
    return res
  }

  rows() {
    tc(250)
    let res = []
    if ( this.hasFieldsNeedingTotals() )
      res.push(this.getTotalRow())
    let casts = this.casts.firstN(this.berth().fathomage)
    for ( let i = 0; i < casts.length; i++ ) {
      let cast = casts[i]
      if ( gLogTimings ) tc(252)
      let row = this.castToRow(cast, i)
      if ( gLogTimings ) tc(253)
      res.push(row)
    }
    let fillinCount = this.casts.length - casts.length
    if ( fillinCount > 20 )
      fillinCount = 20
    for ( let i = 0; i < fillinCount; i++ ) {
      let row = this.getFillinRow(i)
      res.push(row)
    }
    tc(251)
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

  async prepareFieldsAndUserFilter(newGrid, ufChanged) {
    if ( ! (newGrid || ufChanged) ) return
    this.showSpinner()
    try {
      if ( newGrid )
        await this.prepareFields()
      if ( ufChanged )
        await this.prepareUserFilter()
    } finally {
      this.hideSpinner()
    }
  }

  async prepareUserFilter() {
    this._userFilterFunction = null
    let obj = await this.userFilterFunction()
    if ( obj.err )
      gApp.showMessage(obj.err)
    this._userFilterFunction = obj.fn
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
      f.caption = await fn(this.maintOrList())
    })
  }

  hasRowActions() {
    let actions = this.props.attributes.actions
    for ( var i = 0; i < actions.length; i++ ) {
      let a = actions[i]
      if ( a.place && (a.place !== "row") ) continue
      return true
    }
    return false
  }

  getRowActionCount() {
    let res = 0
    let actions = this.props.attributes.actions
    for ( var i = 0; i < actions.length; i++ ) {
      let a = actions[i]
      if ( a.place && (a.place !== "row") ) continue
      res++
    }
    return res
  }

  getRowActionsWidths() {
    let knt = this.getRowActionCount()
    if ( knt === 0 )
      return null
    if ( knt > 3 )
      knt = 3
    return {pct: (knt * 6) + '%', px: (knt * 85) + 'px'}
  }

  getTHs() {
    let res = []
    let fields = this.fields()
    for ( var i = 0; i < fields.length; i++ ) {
      let f = fields[i]
      if ( f.visibleWhen && (! f.visibleWhen(this.maintOrList())) )
        continue
      if ( f.visibleWhenInternal && (! f.visibleWhenInternal(this.maintOrList())) )
        continue
      if ( f.columnVisibleWhen && (! f.columnVisibleWhen(this.maintOrList(), this.containerCast())) )
        continue
      if ( f.columnVisibleWhenInternal && (! f.columnVisibleWhenInternal(this.maintOrList(), this.containerCast())) )
        continue
      if ( f.hidden ) continue
      let th = this.fieldToTH(f)
      res.push(th)
    }
    let widthObj = this.getRowActionsWidths()
    if ( widthObj ) 
      res.push((<th className="stTH stTHButtons" key="thbuttons" style={{width: widthObj.pct, minWidth: widthObj.px}}/>)) // for buttons
    return res
  }

  castToRowTDs(aCast, aRowNo) { /* Grid */
    if ( gLogTimings ) tc(290)
    let res = []
    let fields = this.fields()
    let len = fields.length
    for ( var i = 0; i < len; i++ ) {
      let f = fields[i]
      if ( f.visibleWhen && (! f.visibleWhen(this.maintOrList())) )
        continue
      if ( f.visibleWhenInternal && (! f.visibleWhenInternal(this.maintOrList())) )
        continue
      if ( f.columnVisibleWhen && (! f.columnVisibleWhen(this.maintOrList(), this.containerCast())) )
        continue
      if ( f.columnVisibleWhenInternal && (! f.columnVisibleWhenInternal(this.maintOrList(), this.containerCast())) )
        continue
      if ( f.hidden ) continue
      if ( gLogTimings ) tc(292)
      let td = this.fieldToTD(f, aCast, aRowNo)
      if ( gLogTimings ) tc(293)
      res.push(td)
    }
    if ( gLogTimings ) tc(291)
    return res
  }

  fixedOrder() {
    return this.props.attributes.fixedOrder
  }

  onColumnHeadingClick(aField) {
    if ( this.fixedOrder() )
      return
    if ( this.sortField === aField ) 
      this.sortAscending = ! this.sortAscending
    else {
      this.sortField = aField
      this.sortAscending = true
    }
    let b = this.berth()
    b.sortField = this.sortField
    b.sortAscending = this.sortAscending

    let finish = () => {
      this.resort()
      this.forcedRecalcOfVisibleCasts().then(
        () => {
          this.version++
          this.refreshState()
        }
      )
    }

    if ( this.casts.length < 500 )
      finish()
    else
      this.execWithColumnWait(aField, finish)
  }

  execWithColumnWait(aField, aFn) {
    this.setState({sorting: true})
    execDeferred(
      () => {
        aFn()
        this.setState({sorting: false})
      },
      2000
    )
  }

  fieldToColumnHeadingElement(aField) {
    let id = "stTH" + this.nameToId(aField.name) + "Caption"
    return document.getElementById(id)
  }

  fieldToCaption(f) {
    let res = f.caption
    if ( f.dynamicCaption ) {
      let dcres = f.dynamicCaption(this.maintOrList())
      if ( dcres )
        res = dcres
    }
    return res
  }

  fieldToTH(aField) {
    let name = aField.name
    let className = "stTH"
    let colClass = "stColumnCaption"
    let rightJustified = false
    let canBeReadOnly = (! this.allowFieldInput(aField)) || aField.readOnlyWhen
    if ( aField.numeric && canBeReadOnly ) {
      className += "RightJustified"
      colClass += "RightJustified"
      rightJustified = true
    }
    let sorter
    if ( this.sortField === aField ) {
      let sclass = className + "Sorter"
      let sid = "stTHSorter" + (this.sortAscending ? "Asc" : "Desc")
      let scontent = this.sortAscending ? "\u25B2" : "\u25BC"
      if ( this.state.sorting )
        scontent = <Spinner animation="border" className="stTHSpinner"/>
      sorter = ( 
        <div 
          className={sclass}
          id={sid}
          style={{opacity: "30%"}}
        >
          {scontent}
        </div> 
      )
    }
    let sorter1
    let sorter2 = sorter
    let undef
    if ( rightJustified ) {
      sorter1 = sorter
      sorter2 = undef
    }
    let thId = this.nameToId(name)
    let caption = this.fieldToCaption(aField)
    return (
      <th
        key={thId}
        id={thId}
        className={className}
        onClick={this.onColumnHeadingClick.bind(this, aField)}
      >
        {sorter1}
        <div id={thId + "Caption"} className={colClass}>{caption}</div>
        {sorter2}
      </th>
    )
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

  fieldToDownloadLink(aField, cast) {
    let name = aField.name
    let id = cast.id + '-' + aField.name
    let val = cast[name]
    let text = 'Download'.translate()
    if ( ! (val.startsWith('http:') || val.startsWith('https:')) )
      val = gServer.getDownloadCall(cast, name)
    return (
      <a className="stLink" name={"stocktend_" + name} href={val} id={id} target="_blank" rel="noopener noreferrer">
        {text}
      </a>
    )
  }

  fieldToTD(aField, aCast, aRowNo) { /* Grid */
    if ( gLogTimings ) tc(310)
    let name = aField.name
    let caption = aField.caption
    let id = "td-" + this.nameToId(name) + "-" + aCast.id
    let key = id
    let contents = null
    let elName = "stocktend_" + this.nameToId(caption)
    if ( gLogTimings ) tc(312)
    let className = "stTD" + aField.dispositionAsString()
    //let visible = (! aField.visibleWhen) || (aField.visibleWhen(this.maintOrList(), aCast)) 
    let visible = true
    if ( aField.visibleWhen && (! aField.visibleWhen(this.maintOrList(), aCast)) )
      visible = false
    else if ( aField.visibleWhenInternal && (! aField.visibleWhenInternal(this.maintOrList(), aCast)) )
      visible = false
    if ( visible ) {
      if ( ! this.allowFieldInput(aField) ) {
        if ( aField.postImage )
          contents = this.fieldToPostImage(aField, aCast)
        else if ( aField.file )
          contents = this.fieldToDownloadLink(aField, aCast)
        else
          contents = this.fieldNameToDisplayValue(name, aCast)
        if ( gLogTimings ) tc(313)
      } else {
        if ( this.props.alter ) {
          contents = this.fieldToParticulars(aField, aCast, aRowNo)
        } else {
          contents = this.fieldToInput(aField, aCast)
          className += "Input"
        }
        if ( gLogTimings ) tc(314)
        elName = "td-" + elName
      }
    }
    className += " stTD"
    if ( gLogTimings ) tc(311)
    let style = this.fieldToStyle(aField, aCast)
    return (
      <td
        key={key}
        id={id}
        name={elName}
        className={className}
        style={style}
      >
        {contents}
      </td>
    )
  }

  fieldToParticulars(aField, aCast, aRowNo) { /* Grid */
    let fields = [aField]
    let idSuffix = "-" + aRowNo
    //let val = aCast[aField.name]
    return (
      <Particulars
        classRoot="stGrid"
        key="stGridParticular"
        keyRoot="stGridParticular"
        className="stGridParticular"
        idSuffix={idSuffix}
        container={this.maintOrList()}
        fields={fields}
        cast={aCast}
        hideCaptions={true}
        forward={this.props.forward}
        onChange={this.onChangeViaAlter.bind(this, aCast.id)}
        onBlur={this.onBlurViaAlter.bind(this, aCast.id)}
      />
    )
  }

  fieldToStyle(aField, aCast) {
    let res = {}
    let colorFn = aField.colorFunction 
    if ( colorFn ) {
      let colorObj = colorFn(this.maintOrList(), aCast) 
      if ( colorObj )
        res = {color: colorObj.fg, backgroundColor: colorObj.bg}
    }
    let fwFn = aField.fontWeightFunction 
    if ( fwFn ) {
      let fw = fwFn(this.maintOrList(), aCast) 
      if ( fw )
        res = {fontWeight: fw}
    }
    return res
/*
    let colorFn = aField.colorFunction; if ( ! colorFn ) return
    let colorObj = colorFn(this.maintOrList(), aCast); if ( ! colorObj ) return
    let res = {color: colorObj.fg, backgroundColor: colorObj.bg}
    return res
*/
  }

  fieldHasFocus(aField, aCast) {
    let el = document.activeElement; if ( ! el ) return false
    let id = this.fieldToId(aField, aCast)
    return el.id === id
  }

  fieldToId(aField, aCast) {
    return global.cleanStr(aField.englishCaption) + "-" + aCast.id
  }

  fieldToInput(aField, aCast) { // Grid
    let name = aField.name
    let id = this.fieldToId(aField, aCast)
    let val = this.fieldNameToInputRenderValue(name, aCast)
    if ( this.fieldHasFocus(aField, aCast) && (aField === gLatestInputField) && (aCast === gLatestInputCast) )
      val = gLatestInputValue
    let disabled = this.maintOrList().spinnerIsShowing || Server.isWaiting()
    let className = "stGridInputHolder"
    if ( aField.tickbox )
      className = "stGridCheckboxHolder"
    return (
      <FormGroup key={"fg-" + this.props.attributes.specname + "-" + id} className={className}>
        <STInput 
          value={val}
          id={id}
          field={aField}
          onChange={this.onChange.bind(this, aCast.id)}
          onBlur={this.onBlur.bind(this)}
          moldVersion={this.state.moldVersion}
          disabled={disabled}
          handleOwnValueChange={true}
        >
        </STInput>
      </FormGroup>
    )
  }

  onBlur(aEvent) {
    //this.refreshState()
  }

  onBlurViaAlter(aCastId, aEvent) {
    this.version++
    this.refreshState()
  }

  containerIsList() {
    let maintOrList = this.maintOrList(); if ( ! maintOrList ) return false
    return ( maintOrList.a().componentName === "List" )
  }

  maint() {
    let maintOrList = this.maintOrList(); if ( ! maintOrList ) return false
    if ( maintOrList.a().componentName === "Maint" )
      return maintOrList
    return null
  }

  refreshMaintState() {
    let m = this.maint(); if ( ! m ) return
    let c = m.cast; if ( ! c ) return
    c.refreshCalculations({force: true, keepState: true, point: 37, includeDefers: true}).then(() => {
      execDeferred(() => m.refreshState(), {noSpinner: true})
    })
  }

  async onChangeViaAlter(aCastId, aParm1, aValue, aOptions, aNewValObj) {  /* Grid */
    let val = ''
    let name = ''
    let f
    if ( aParm1.target ) {
      let event = aParm1
      let t = event.target
      name = t.name
      name = name.stripLeft("stocktend_")
      f = this.nameToField(name); if ( ! f ) return
      val = t.value
      if ( f.tickbox )
        val = t.checked
    } else {
      name = aParm1
      name = name.stripLeft("stocktend_")
      f = this.nameToField(name); if ( ! f ) return
      val = aValue
    }
    if ( f.tickbox && val )
      val = 'Yes'
    let c = await this.fieldAndPrimaryCastIdToCast(f, aCastId); if ( ! c ) return
    gLatestInputValue = val
    gLatestInputField = f
    gLatestInputCast = c
    let oldVal = c[name]
    let changed = f.setCastPropValue(c, val)
    f.setCastPropValue(c, val)
    if ( aNewValObj )
      aNewValObj.value = c[name]
    if ( ! changed )
      return false
    if ( aOptions && aOptions.invalid ) 
      return true

    let spinnerStarted

    let finish = (aAfterChangeMsg) => {
      if ( aAfterChangeMsg ) {
        gApp.showMessage(aAfterChangeMsg.translate())
        this.hideSpinner()
        f.setCastPropValue(c, oldVal)
        this.version++
        this.refreshState()
        return
      }
      let primaryCast = this.idToCast(aCastId)
      this.refreshJoinedData({casts: [primaryCast], noSpinner: true, createIfNonexistent: true})
      if ( f.isKey )
        c["wp_post_title"] = val
      this.changedSinceLastSaveAttempt = true
      this.refreshRejection(c)
      if ( spinnerStarted )
        this.hideSpinner()
      c.refreshCalculations({force: true, keepState: true, point: 38, includeDefers: true}).then(() => {
        this.lastMoldVersion = this.moldVersion() // Prevent grid blank before refreshData
        this.lastJoinMoldVersion = this.joinMoldVersion() // Prevent grid blank before refreshData
        this.fieldDataVersion++
        this.refreshMaintState()
        if ( (! this.containerIsList()) || f.refreshOnChange )
          this.refreshState()
      })
    }

    let nativeField = f.toNativeField()
    if ( ! nativeField.hasUserChangeMethod() ) {
      finish()
      return true
    }

    let fn = () => {
      let res
      //this.showSpinner()
      //spinnerStarted = true
      try {
        res = nativeField.doAfterUserChange(oldVal, val, c, this)
        this.lastMoldVersion = this.moldVersion() // Prevent grid refreshData
        this.lastJoinMoldVersion = this.joinMoldVersion() // Prevent grid refreshData
      } catch(e) {
        //this.hideSpinner()
        gApp.showMessage(e.message)
        c[name] = oldVal
        gLatestInputValue = oldVal
        return
      }
      if ( global.isPromise(res) ) {
        res.then(finish)
      } else 
        finish()
    }

    execDeferred(fn, {noSpinner: true})
    return true
  }

  refreshRejection(aCast) {
    this.rejection = aCast.mold().acceptOrRejectCast(aCast)
    if ( this.rejection )
      console.log("Error on refreshRejection: " + this.rejection.message)
  }

  onChange(aCastId, aEvent, aValue, aOptions) { /* Grid */
    tc(460)
    let t = aEvent.target
    let val = aValue || t.value
    let name = t.name
    name = name.stripLeft("stocktend_").stripAfterLast("-")
    let f = this.nameToField(name)
    let c = this.idToCast(aCastId); if ( ! c ) return
    let oldVal = c[name]
    f.setCastPropValue(c, val)

    let finish = () => {
      tc(461)
      if ( f.isKey )
        c["wp_post_title"] = val
      c.refreshCalculations({force: true, keepState: true, point: 39, includeDefers: true}).then(() => {
        //this.refreshState()
        tc(462)
      })
    }

    let res = f.doAfterUserChange(oldVal, val, c, this.maintOrList())
    if ( global.isPromise(res) ) {
      res.then(finish)
    } else 
      finish()
  }

  mold() {
    let p = this.props
    let moldName = p.attributes.datatype
    let m = Foreman.nameToMold(moldName)
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
      let m = Foreman.nameToMold(dt); if ( ! m ) return null
      let jc = await dt.bringOrCreate({[m.key]: primaryCast}, {noCalc: true})
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

  fieldToPostImageCall(field, cast) {
    let res
    let id = cast.id
    if ( field.postIdField ) {
      let ref = cast[field.postIdField]
      if ( ref )
        id = ref.id
    }
    res = gServer.getCallString({methodWithParms: 'stocktend_object?datatype=none&source=postImage&id=' + id + '&imageType=' + field.postImageType})
    return res
  }

/*
  fieldToPostImageCall(field, cast) {
    let res
    let id = cast.id
    if ( field.postIdField ) {
      let ref = cast[field.postIdField]
      if ( ref )
        id = ref.id
    }
    res = gServer.getCallString({methodWithParms: 'stocktend_object?datatype=none&source=postImage&id=' + id + '&imageType=' + field.postImageType})
    return res
  }
*/

  fieldToPostImageUrl(field, cast) {
    return cast.fieldToImageUrl(field)
/*
    let res
    let id = cast.id
    let dt
    if ( field.postIdField ) {
      let ref = cast[field.postIdField]
      if ( ref ) {
        id = ref.id
        dt = ref.datatype
      }
    }
    let product
    if ( (! dt) || (dt === 'products') ) {
      product = 'products'.bringSingleFast({id: id})
      if ( global.fastFail(product) )
        product = null
    }
    if ( product && (! global.runningOutsideWP()) ) 
      res = product['image_url_' + field.postImageType]
    else
      res = gServer.getCallString({methodWithParms: 'stocktend_object?datatype=none&source=postImage&id=' + 
        id + '&imageType=' + field.postImageType})
    if ( ! res )
      res = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" // blank
    return res
*/
  }

/*
  fieldToPostImage(aField, aCast) {
    let name = aField.name
    let id = aField.name
    let url = this.fieldToPostImageCall(aField, aCast)
    let errFunc = e => {
      e.target.style.display = 'none'
    }
    return (
      <img className="stGridImageField" name={"stocktend_" + name} alt={aField.caption} src={url} id={id} onError={errFunc}>
      </img>
    )
  }
*/

  fieldToPostImage(aField, aCast) { /* Grid */
    let name = aField.name
    let id = aField.name
    let url = this.fieldToPostImageUrl(aField, aCast)
    let errFunc = e => {
      e.target.style.display = 'none'
    }
    return (
      <img className="stGridImageField" name={"stocktend_" + name} alt={aField.caption} src={url} id={id} onError={errFunc}>
      </img>
    )
  }

  fieldNameToDisplayValue(aName, aCast, aOptions) { /* Grid */
    let f = this.nameToField(aName); if ( ! f ) return ''
    let res
    res = this.fieldNameToValue(aName, aCast)
    if ( f.numeric && (res === global.unknownNumber()) )
      return "Unknown".translate()
    if ( f.numeric && f.blankWhenZero && (! res) )
      return ''
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
    if ( f.showPlusSign && (res > 0) )
      res = '+' + res
    if ( f.translateOnDisplay )
      res = res.translate()
    if ( f.secret )
      res = ''
    if ( f.showAsLink ) {
      if ( (! aOptions) || (! aOptions.noLinks) ) {
        res = (
          <Link 
            className="stDestinationLink"
            onClick={this.onFieldClick.bind(this, f, aCast)}
          >
            {res}
          </Link>
        )
      }
    }
    if ( f.html ) {
      res = (
        <div dangerouslySetInnerHTML={{__html: res}}/>
      )
    }
    if ( f.icon ) {
      if ( (! aOptions) || (! aOptions.noLinks) ) {
        if ( res ) {
          let icon = gApp.nameToIcon(res)
          if ( icon ) {
            res = (
              <Link 
                className="stDestinationLink"
                onClick={this.onFieldClick.bind(this, f, aCast)}
              >
                {icon}
              </Link>
            )
          }
        }
      }
    }
    res = f.doModifyRenderValue(res, aCast)
    return res
  }

  async onFieldClick(aField, aCast) {
    if ( await gApp.preventInteractionWhenBusy() ) return
    if ( ! aCast ) return
    let mf = aField.toMoldField()
    let destCast
    let specname
    if ( mf.destinationFunction ) {
      let dest = await mf.destinationFunction(aCast, aCast[aField.name]);
      if ( global.isString(dest) ) {
        destCast = aCast
        specname = dest
      } else
        destCast = dest
    } else if ( mf.hasAutoDestination() ) {
      destCast = await mf.getAutoDestinationCast(aCast)
    }
    if ( ! destCast ) 
      return
    if ( ! specname )
      specname = destCast.toDestinationSpecname(); if ( ! specname ) return
    this.segueToDestination(aCast, destCast, "edit", specname)
  }

  fieldNameToInputRenderValue(aName, aCast) { /* Grid */
    let f = this.nameToField(aName); if ( ! f ) return ''
    let val = this.fieldNameToValue(aName, aCast)
    if ( f.decimals || (f.decimals === 0) )
      val = global.numToStringWithXDecimals(val, f.decimals)
    if ( f.minDecimals || (f.minDecimals === 0) )
      val = global.numToStringWithMinXDecimals(val, f.minDecimals, f.maxDecimals)
    let res = val + ''
    if ( f.secret )
      res = ''
    res = f.doModifyInputRenderValue(res, aCast)
    return res
  }

  fieldNameToValue(aName, aCast) { /* Grid */
    let f = this.nameToField(aName); if ( ! f ) return ''
    let res = aCast[aName]
    if ( ! global.isObj(res) ) 
      return this.safeValue(res)
    let val = res.keyval
    if ( res.id && res.datatype ) {
      let m = Foreman.nameToMold(res.datatype)
      if ( m ) {
        let refCast = m.quickIdToCast(res.id)
        if ( refCast && m.essence ) {
          val = refCast[m.essence]
        } else if ( refCast && res.keyname )
          val = refCast[res.keyname]
        else if ( (! val) || global.isObj(val) )
          val = res.id
      }
    }
    return this.safeValue(val)
  }

  nameToField(aName) {
    let res = this.fields().filterSingle(f => f.name === aName)
    if ( res )
      return res
    let name = aName.stripAfterLast('-') // e.g. -0 -1
    return this.fields().filterSingle(f => f.name === name)
  }

  safeValue(aVal) {
    if ( (! aVal) && (aVal !== 0) ) return ''
    return aVal
  }

  castToRowId(aCast) {
    let suffix = aCast.id
    if ( suffix < 0 ) {
      let kv = aCast.keyValue()
      if ( global.isObj(kv) )
        kv = kv.id
      if ( kv )
        suffix = (kv + '').replace(/\s+/g, '') // strip whitespace as this is not valid in an html id
    }
    return "row-" + suffix
  }

  castToRow(aCast, aIdx) {
    let btns = this.idxToRowButtons(aIdx, aCast)
    let id = this.castToRowId(aCast)
    let btnsTD = null
    if ( this.hasRowActions() )
      btnsTD = (
        <td className="stTD">
          {btns}
        </td>
      )
    return (
      <tr className="stTR" key={aIdx} name={aIdx} id={id}>
        {this.castToRowTDs(aCast, aIdx)}
        {btnsTD}
      </tr>
    )
  }

  hasFieldsNeedingTotals() {
    return this.fields().exists(f => f.showTotal)
  }

  getTotalRow() {
    if ( this.casts.length === 0 ) return null
    return (
      <tr className="stTRTotal" key="total" name="total" id="total">
        {this.getTotalTDs()}
        <td className="stTD">
        </td>
      </tr>
    )
  }

  getTotalTDs() {
    let res = []
    let fields = this.fields()
    let len = fields.length
    let totalCaptionField
    for ( let i = 0; i < len; i++ ) {
      let f = fields[i]
      if ( f.hidden ) continue
      if ( f.visibleWhen && ! f.visibleWhen(this) ) continue
      if ( f.visibleWhenInternal && ! f.visibleWhenInternal(this) ) continue
      if ( f.columnVisibleWhen && ! f.columnVisibleWhen(this, this.containerCast()) ) continue
      if ( f.columnVisibleWhenInternal && ! f.columnVisibleWhenInternal(this, this.containerCast()) ) continue
      if ( f.useForTotalCaption )
        totalCaptionField = f
    }
    let isFirst = true
    for ( let i = 0; i < len; i++ ) {
      let f = fields[i]
      if ( f.hidden ) continue
      if ( f.visibleWhen && ! f.visibleWhen(this) ) continue
      if ( f.visibleWhenInternal && ! f.visibleWhenInternal(this) ) continue
      if ( f.columnVisibleWhen && ! f.columnVisibleWhen(this, this.containerCast()) ) continue
      if ( f.columnVisibleWhenInternal && ! f.columnVisibleWhenInternal(this, this.containerCast()) ) continue
      let isTotalCaption = totalCaptionField ? (f === totalCaptionField) : isFirst
      let td = this.fieldToTotalTD(f, isTotalCaption)
      isFirst = false
      res.push(td)
    }
    return res
  }

  fieldToTotalTD(aField, aIsTotalCaption) { /* Grid */
    let caption = aField.caption
    let name = aField.name
    let id = "td-" + this.nameToId(name) + "-total"
    let key = id
    let elName = "stocktend_" + this.nameToId(caption)
    let className = "stTD" + aField.dispositionAsString()
    className += " stTD stTDTotal"
    let contents = ""
    if ( aIsTotalCaption )
      contents = "TOTAL".translate()
    if ( aField.showTotal )
      contents = this.fieldToTotalDisplayValue(aField)
    return (
      <td
        key={key}
        id={id}
        name={elName}
        className={className}
      >
        {contents}
      </td>
    )
  }

  fieldToTotalDisplayValue(aField) { /* Grid */
    let f = aField
    let res = this.fieldToTotalValue(f)
    if ( res === global.unknownNumber() )
      return "Unknown".translate()
    if ( f.decimals || (f.decimals === 0) )
      res = global.numToStringWithXDecimals(res, f.decimals, {thousandSep: true})
    if ( f.minDecimals || (f.minDecimals === 0) )
      res = global.numToStringWithMinXDecimals(res, f.minDecimals, f.maxDecimals, {thousandSep: true})
    res += ''
    return res
  }

  fieldToTotalValue(aField) {
    let res = 0
    let casts = this.casts
    let fn = aField.calculateTotalFunction
    if ( fn ) {
      res = fn(this.casts)
      return res
    }
    for ( var i = 0; i < casts.length; i++ ) {
      let cast = casts[i]
      let val = cast[aField.name]
      if ( ! val ) 
        val = 0
      if ( val === global.unknownNumber() )
        return global.unknownNumber()
      res += val
    }
    return res
  }

  getFillinRow(aIdx) {
    let id = "stFillin" + aIdx
    return (
      <tr className="stTR" key={id} name={aIdx} id={id}>
        <td className="stTD">
        </td>
      </tr>
    )
  }

  rowToAvailableActions(aIdx, aCast) {
    let res = []
    let actions = this.props.attributes.actions
    for ( var i = 0; i < actions.length; i++ ) {
      let a = actions[i]
      if ( a.place && (a.place !== "row") ) continue
      let awf = a.availableWhen
      if ( awf ) {
        let available = awf(aCast)
        if ( ! available )
          continue
      }
      res.push(a)
    }
    return res
  }

  actionToCaption(aAction, aIdx, aCast) { /* Grid */
    let caption = aAction.caption || aAction.name
    if ( aAction.tagOrFunction === "trash" )
      caption = this.garnishTrashCaption(aIdx, aCast, aAction.englishName)
    return caption
  }

  actionsToNormalButtons(aActions, aCount, aThereAreMore, aIdx, aCast) {
    let res = []
    for ( var i = 0; i < aCount; i++ ) {
      let a = aActions[i]
      let f = this.rowActionToFunction(a, aIdx); if ( ! f ) continue
      let key = this.nameToId(a.name)
      let className = 'stRowButton'
      if ( (i < aCount - 1) || aThereAreMore )
        className += " mr-1"
      let caption = this.actionToCaption(a, aIdx, aCast)
      let btn = (
        <Link
          key={key}
          onClick={f}
          style={{fontSize: "14px"}}
          className={className}>
          {caption}
        </Link>
      )
      res.push(btn)
    }
    return res
  }

  name() {
    return this.a().name
  }

  actionsToMoreButton(aActions, aCount, aIdx, aCast) {
    let moreKey = this.name() + "-more"
    let moreBtn = (
      <ButtonDropdown
        direction="left"
        className="stRowMoreButtonDiv"
        key={moreKey}
        isOpen={this.state.moreOpenIdx === aIdx}
        toggle={() => this.setState({moreOpenIdx: this.state.moreOpenIdx === aIdx ? -1 : aIdx})}
      >
        <DropdownToggle caret className="stRowMoreButton">
          {"More".translate()}
        </DropdownToggle>
        <DropdownMenu>
          {this.actionsToMoreDropdownItems(aActions, aCount, aIdx, aCast)}
        </DropdownMenu>
      </ButtonDropdown>
    )
    return moreBtn
  }

  actionsToMoreDropdownItems(aActions, aCount, aIdx, aCast) {
    let res = []
    let actions = aActions
    for ( var i = 2; i < actions.length; i++ ) {
      let a = actions[i]
      let f = this.rowActionToFunction(a, aIdx); if ( ! f ) continue
      let key = this.nameToId(a.name)
      let caption = this.actionToCaption(a, aIdx, aCast)
      let ddi = (
        <DropdownItem key={key} onClick={f} className="stMoreDropdownItem">{caption}</DropdownItem>
      )
      res.push(ddi)
    }
    return res
  }

  idxToRowButtons(aIdx, aCast) {
    //if ( this.props.alter ) return null
    let actions = this.rowToAvailableActions(aIdx, aCast)
    let normalCount = actions.length
    let moreCount = 0
    if ( normalCount > 3 ) {
      moreCount = normalCount - 2
      normalCount = 2
    }
    let thereAreMore = (moreCount > 0)
    let res = this.actionsToNormalButtons(actions, normalCount, thereAreMore, aIdx, aCast)
    if ( moreCount > 0 )
      res.push(this.actionsToMoreButton(actions, moreCount, aIdx, aCast))
    return res
  }

  garnishTrashCaption(aIdx, aCast, aCaption) {
    if ( this.state.trashConfirmCast !== aCast ) return aCaption.translate()
    let res =  "Really " + aCaption + "?"
    res = res.translate()
    return res
  }
  
  rowActionToFunction(aAction, aIdx) {  /* Grid */
    let specname = aAction.specname
    if ( aAction.tagOrFunction === 'trash' )
      specname = this.mold().destinationSpecname
    if ( specname && gApp.shouldHideSpec(specname) ) return null
    let res = this.doRowActionToFunction(aAction, aIdx)
    if ( aAction.spinner )
      res = gApp.wrapFunctionWithSpinner(res, this.maintOrList())
    return res
  }

  doRowActionToFunction(aAction, aIdx) {  /* Grid */
    let tof = aAction.tagOrFunction
    let specname = aAction.specname
    if ( tof === "trash" )
      return this.trashFunction(aIdx)
    if ( (tof === "edit") || (tof === "editParent") ) {
      if ( ! specname )
        return this.startEditingLine.bind(this, aIdx)
      return this.segue.bind(this, aIdx, tof, specname, false)
    } else if ( tof === "add" ) {
      if ( ! specname )
        return this.startAddingLine.bind(this)
      return this.segue.bind(this, aIdx, "add", specname, aAction.autoChild)
    } else if ( ! tof ){
      if ( ! specname )
        specname = this.props.attributes.maintSpecName
      return this.segue.bind(this, aIdx, "view", specname, false)
    }
    let m = this.props.maint;
    let c = this.casts[aIdx]
    if ( m ) {
      let f = tof.bind(this, m, c)
      if ( aAction.noSave ) {
        return f
      }
      return m.functionToTrackedFunction(f, c)
    } else {
      let list = this.props.list; if ( ! list ) return
      let f = tof.bind(this, list, c)
      return f
    }
  }

  async waitForServerIdle() {
    while ( gServer.waitingCount > 0 ) {
      await wait(100);
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

  dataChanged() {
    let mold = this.mold()
    mold.version++
  }

  getContainerSingleSubsetName() {
    if ( ! this.isWithinAMaint() ) return
    let m = this.maintOrList()
    return m.getSingleSubsetName()
  }

  async refreshData() {
    if ( global.usingDifferentForeman ) return
    if ( this.refreshingData ) return
    this.refreshingData = true
    this.showSpinner({delayOnMaints: true})
    execDeferred(
      async () => {
        try {
          tc(270)
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
          let ssn = this.a().limitToSubsetName
          let options
          if ( ssn )
            options = {subsetName: ssn}
          else {
            if ( this.a().useContainerSubset ) {
              ssn = this.getContainerSingleSubsetName()
              if ( ssn ) {
                options = {subsetName: ssn}
              }
            }
          }
          if ( this.isWithinAMaint() ) {
            let id = p.containerCastId
            critObj = await this.getCritObj()
            if ( ! critObj ) critObj = {}
            critObj.parentId = id
            tc(273)
            this.allCasts = await mold.retrieve(critObj, options)
            tc(274)
          } else {
            critObj = await this.getCritObj()
            tc(275)
            options = options || {}
            options.noCalc = true
            this.allCasts = await mold.retrieve(critObj, options)
            tc(276)
          }
          await this.recalcGridFieldsForAllCasts()
          await mold.refreshCalculations({forceAggregands: true, casts: this.allCasts, point: 4})
          await this.filterData()
          await this.doAfterFieldCalculations()
          this.lastMoldVersion = mold.version
          tc(277)
          await this.refreshJoinedData()
          this.sort()
          this.casts = this.allCasts
          this.applySearchText()
          await this.forcedRecalcOfVisibleCasts()
          tc(271)
          tc(272)
          this.version++
          execDeferred(() => this.refreshState(), {noSpinner: true})
          execDeferred(() => this.adjustScrollPosition(), {noSpinner: true})
          tc(277)
        } finally {
          this.hideSpinner()
          this.refreshingData = false
        }
      }, {showSpinner: false, ms: 10}
    )
  }

  fieldNames() {
    let fields = this.fields()
    let res = []
    for ( var i = 0; i < fields.length; i++ )
      res.push(fields[i].name)
    return res
  }

  async recalcGridFieldsForAllCasts() {
    let fieldNames = this.fieldNames()
    let casts = this.allCasts
    for ( var i = 0; i < casts.length; i++ ) {
      let cast = casts[i]
      await cast.refreshCalculations({fieldNames: fieldNames, keepState: true, point: 41})
    }
  }

  async forcedRecalcOfVisibleCasts() {
    let casts = this.casts.firstN(this.berth().fathomage)
    await this.mold().refreshCalculations({force: true, casts: casts, point: 5, includeDefers: true})
    await this.refreshJoinedCalculations({force: true, casts: casts, point: 42, includeDefers: true})
  }

  async refreshJoinedCalculations(aOptions) {
    if ( ! this.hasJoin() ) return
    let casts = aOptions.casts
    for ( var i = 0; i < casts.length; i++ ) {
      let cast = casts[i]
      let jc = cast.__joinedCast; if ( ! jc ) continue
      await jc.refreshCalculations(aOptions)
      cast.copyFromJoin(jc)
    }
    this.lastJoinMoldVersion = this.joinMoldVersion() // prevent repeated refreshes
    this.lastMoldVersion = this.moldVersion() 
  }

  async doAfterFieldCalculations() {
    let fn = this.a().afterFieldCalculations
    if ( ! fn ) return
    await fn(this.allCasts, this.maintOrList())
  }

  a() {
    return this.props.attributes
  }

  async userFilterFunction() {
    let list = this.props.list; if ( ! list ) return
    return await list.userFilterFunction(this)
  }

  async filterData() { // Grid
    let f = this.a().filter
    let uff = this._userFilterFunction
    if ( (! f) && (! uff) ) return
    let filteredCasts = []
    let len = this.allCasts.length
    for ( var i = 0; i < len; i++ ) {
      let cast = this.allCasts[i]
      let ok
      if ( f ) {
        ok = await f(cast, this.maintOrList())
        if ( ! ok ) continue
      }
      if ( uff ) {
        let ok = uff(cast, this)
        if ( ! ok ) continue
      }
      filteredCasts.push(cast)
    }
    this.allCasts = filteredCasts
  }

  applySearchText() {
    let t = this.searchText 
    let mol = this.maintOrList()
    if ( mol.a().afterSearchChange )
      t = null
    if ( ! t ) {
      this.casts = this.allCasts
      if ( mol ) 
        mol._gridCasts = this.casts
      return
    }
    this.casts = []
    for ( var i = 0; i < this.allCasts.length; i++ ) {
      let c = this.allCasts[i]
      if ( ! this.castMatchesSearchText(c, t) ) continue
      this.casts.push(c)
    }
    if ( mol ) 
      mol._gridCasts = this.casts
  }

  castMatchesSearchText(aCast, aText) { /* Grid */
    if ( ! aText ) return true
    let fields = this.fields()
    let text = aText.toLowerCase()
    for ( var i = 0; i < fields.length; i++ ) {
      let f = fields[i]
      if ( f.hidden ) continue
      let val = this.fieldNameToDisplayValue(f.name, aCast, {noLinks: true})
      if ( val && (val.toLowerCase().indexOf(text) >= 0) )
        return true
    }
    return false
  }

  sort() { /* Grid */
    let key = this.mold().key
    if ( ! key ) 
      key = "id"
    let prop = key
    let asc = true
    let berth = this.berth()
    if ( this.sortField ) {
      prop = this.sortField.name
      asc = this.sortAscending
    } else {
      if ( berth.sortField ) {
        prop = berth.sortField.name
        asc = berth.sortAscending
      } else {
        let sortObj = this.props.attributes.defaultSort
        if ( sortObj ) {
          asc = sortObj.descending ? false : true
          prop = sortObj.field
        }
      }
    } 
    this.sortField = this.nameToField(prop)
    this.sortAscending = asc
    berth.sortField = this.sortField
    berth.sortAscending = this.sortAscending
    this.doSort(prop, asc, this.sortField)
  }

  resort() {
    let asc = this.sortAscending
    let prop = this.sortField.name
    this.doSort(prop, asc, this.sortField)
    this.applySearchText()
    this.berth().fathomage = 50
  }

  doSort(aProp, aAsc, aField) {
    let numeric
    let isRef
    let unknownsLast
    if ( aField ) {
      numeric = aField.numeric
      isRef = aField.refersTo ? true : false
      unknownsLast = aField.sortUnknownsLast
    }
    let gt = 1
    let lt = -1
    if ( ! aAsc ) {
      gt = -1
      lt = 1
    }
    let isId = (aProp === "id")
    let unknown = global.unknownNumber()
    this.allCasts.sort(
      (aCastA, aCastB) => {
        let kv
        let a = aCastA[aProp]; if ( isId && (a < 0) ) a = (-a) + 100000000
        if ( isRef && (typeof a === 'object') ) {
          if ( a ) {
            kv = a.keyval
            if ( kv )
              a = kv
            else
              a = a.id
          }
        }
        if ( (! a) && (! numeric) )
          a = ''
        let b = aCastB[aProp]; if ( isId && (b < 0) ) b = (-b) + 100000000
        if ( isRef && (typeof b === 'object') ) {
          if ( b ) {
            kv = b.keyval
            if ( kv )
              b = kv
            else
              b = b.id
          }
        }
        if ( (! b) && (! numeric) )
          b = ''
        if ( unknownsLast ) {
          if ( a === unknown ) a = 999999999999
          if ( b === unknown ) b = 999999999999
        } else {
          if ( a === unknown ) a = 0.000001
          if ( b === unknown ) b = 0.000001
        }
        if ( (a === b) && aCastA.id && aCastB.id ) 
          return aCastA.id > aCastB.id ? gt : lt 
        if ( a > b ) return gt
        if ( a < b ) return lt 
        return 0
      }
    )
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
    let m = Foreman.nameToMold(joinDatatype)
    this._joinMold = m
    let joinField = this.fields().filterSingle(f => (f.datatype === this.datatype()) && (f.refersToDatatype() === joinDatatype))
    for ( var i = 0; i < len; i++ ) {
      let cast = casts[i]
      let ref = cast[joinField.name]; if ( ! ref ) continue
      let jc = await joinDatatype.bringSingle({id: ref.id}); if ( ! jc ) continue
      cast.__joinedCast = jc
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
    if ( ! noSpinner ) {
      this.showSpinner()
    }
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
          if ( gLogTimings ) tc(284)
          let dt = field.datatype
          if ( dt === cast._datatype ) continue
          let rt = field.refersTo
          if ( gLogTimings ) tc(285)
          if ( rt ) {
            let m = Foreman.nameToMold(dt)
            this._joinMold = m
            if ( gLogTimings ) tc(280)
            let jc
            jc = m.fastRetrieveSingle({[m.key]: cast})
            if ( (jc === "na") || ((! jc) && createIfNonexistent) ) {
              let lazyJoin = (! createIfNonexistent) && (! await this.shouldCreateJoinWhenNonexistent(cast))
              if ( lazyJoin ) {
                if ( gLogTimings ) tc(881)
                jc = await dt.bringSingle({[m.key]: cast})
                if ( gLogTimings ) tc(882)
              } else {
                if ( gLogTimings ) tc(883)
                jc = await dt.bringOrCreate({[m.key]: cast})
                if ( gLogTimings ) tc(884)
              }
            }
            if ( gLogTimings ) tc(281)
            cast.__joinedCast = jc
            if ( ! jc ) continue
            let keepDt = cast._datatype
            let id = cast.id
            let parentId = cast.parentId
            cast.copyFromJoin(jc)
            if ( gLogTimings ) tc(288)
            cast.id = id
            cast.parentId = parentId
            cast._datatype = keepDt
          }
          if ( gLogTimings ) tc(286)
          cast.setFieldValueToCorrectType(field)
          if ( gLogTimings ) tc(287)
        }
      }
    } finally {
      if ( ! noSpinner )
        this.hideSpinner()
    }
  }
  
  async getCritObj() { /* Grid */
    let fn = this.props.attributes.criteria
    if ( ! fn ) return null
    let f = fn.bind(this)
    let res = await f(this.maintOrList())
    return res
  }

  isWithinAMaintOrListWithHeader() {
    return this.isWithinAMaint() || this.isWithinAListWithHeader()
  }

  isWithinAMaint() {
    if ( this.props.maint )
      return true
    return false
  }

  isWithinAListWithHeader() {
    if ( this.props.list )
      return this.props.list.hasHeader()
    return false
  }

  headerButtons() { /* Grid */
    let res = []
    if ( ! this.isWithinAMaintOrListWithHeader() ) return res
    let actions = this.props.attributes.actions
    for ( var i = 0; i < actions.length; i++ ) {
      let a = actions[i]
      if ( a.place !== "header" ) continue
      let f = this.headerActionToFunction(a); if ( ! f ) continue
      let icon = gApp.actionToIcon(a)
      let key = this.nameToId(a.name)
      let btn = (
        <Button key={key} onClick={f} className="stHeaderButton mr-1">
          {icon}
          {a.name}
        </Button>
      )
      res.push(btn)
    }
    return res
  }

  headerActionToFunction(aAction) { /* Grid */
    let specname = aAction.specname
    if ( (! specname) && ((aAction.tagOrFunction === 'add') || (aAction.tagOrFunction === 'addNoSave')) )
      specname = this.a().maintSpecname
    if ( specname && gApp.shouldHideSpec(specname) ) return null
    let res = this.doHeaderActionToFunction(aAction)
    if ( aAction.spinner )
      res = gApp.wrapFunctionWithSpinner(res, this.maintOrList())
    return res
  }

  doHeaderActionToFunction(aAction) { /* Grid */
    let awf = aAction.availableWhen
    let m = this.maintOrList()
    if ( awf ) {
      let available = awf(this.containerCast(), m)
      if ( ! available )
        return null
    }
    let tof = aAction.tagOrFunction
    if ( tof === "add" )
      return this.startAddingLine.bind(this, false, aAction)
    if ( tof === "addNoSave" )
      return this.startAddingLine.bind(this, true, aAction)
    if ( tof === "alter" ) 
      return m.startAlter.bind(m)
    let c = this.containerCast()
    let f = tof.bind(this, m, c, this)
    if ( m.functionToTrackedFunction ) {
      if ( aAction.noSave )
        return f
      return m.functionToTrackedFunction(f, c)
    }
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
        console.log(e.message)
        if ( this.showMessage )
          this.showMessage(e.message)
        return
      }
    } finally {
      this.hideSpinner()
    }
  }

  maintOrList() {
    let res = this.props.maint
    if ( res ) 
      return res
    return this.props.list
  }

  getTitle() { /* Grid */
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

  scroller() {
    let res = this.maintOrList().scroller
    if ( ! res )
      res = gApp
    return res
  } 

  visCalcAndRefresh() {
    this.forcedRecalcOfVisibleCasts().then(
      () => {
        this.refreshState.bind(this)
      }
    )
  }

  render() { /* Grid */
    //tc(230)
    gApp.currentSituation.sheet.grid = this
    let p = this.props
    let showRows = true
    let uf = p.userFilter
    let ufVersion = uf && uf.version
    let ufChanged = (uf !== this.lastUserFilter) || (ufVersion !== this.lastUfVersion)
    let newGrid = (p.specname !== this.specname) || (p.manifestName !== this.manifestName) ||
      (p.containerCastId !== this.containerCastId) || (this.forwardNo !== global.forwardCount)
    if ( newGrid || (this.moldVersion() !== this.lastMoldVersion) || (this.joinMoldVersion() !== this.lastJoinMoldVersion) || ufChanged ) {
      gLatestInputField = null
      this.specname = p.specname
      this.manifestName = p.manifestName
      this.containerCastId = p.containerCastId
      this.forwardNo = global.forwardCount
      this.lastMoldVersion = this.moldVersion()
      this.lastJoinMoldVersion = this.joinMoldVersion()
      this.searchText = p.searchText
      this.lastUserFilter = uf
      this.lastUfVersion = ufVersion
      this.disableInputs = p.disableInputs
      let mol = this.maintOrList()
      mol._grid = this
      if ( newGrid && (! this.refreshingData) ) {
        this.casts = []
      }
      //tc(232)
      if ( newGrid || ufChanged ) {
        execDeferred(() => {
          this.prepareFieldsAndUserFilter(newGrid, ufChanged).then(() => { 
            execDeferred(this.refreshData.bind(this)) 
          })
        }, {noSpinner: true})
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
    else if ( p.refreshNo && (p.refreshNo !== this.lastRefreshNo) ) {
      this.lastRefreshNo = p.refreshNo
      execDeferred(this.refreshData.bind(this), {noSpinner: true}) 
    }
    if ( p.disableInputs !== this.disableInputs ) {
      this.disableInputs = p.disableInputs
      tc(233)
      execDeferred(this.refreshState.bind(this), {noSpinner: true})
    }
    if ( p.searchText !== this.searchText ) {
      this.searchText = p.searchText
      this.berth().fathomage = 50
      this.applySearchText()
      execDeferred(this.visCalcAndRefresh.bind(this), {noSpinner: true})
    }
    if ( this.scroller().anyFillinIsShowing() ) {
      this.berth().fathomage += 20
      execDeferred(this.visCalcAndRefresh.bind(this), {noSpinner: true})
    }
    if ( this.focusCast && ((this.focusCast !== this.lastFocusCast) || (this.focusFieldName !== this.lastFocusFieldName)) ) {
      execDeferred(
        () => {
          this.refreshData().then(
            execDeferred(this.doFocusField.bind(this), {noSpinner: true, ms: 50})
          )
        }, 
        {noSpinner: true}
      ) 
    }
    this.lastFocusCast = this.focusCast
    this.lastFocusFieldName = this.focusFieldName
    tc(234)
    let id = "mainTable"
    if ( this.manifestName )
      id = this.nameToId(this.manifestName)
    let title = this.getTitle()
    if ( title )
      title = title.translate()
    let headerButtons = this.headerButtons()
    let hb
    if ( headerButtons.length > 0 )
      hb = (
        <Row className="stGridHeaderButtons">
          {headerButtons}
        </Row>
      )
    let rows = null
    if ( showRows )
      rows = this.rows()
    let res = (
      <div className="stGrid" key="stGrid">
        <div className="stGridTitle">{title}</div>
        {hb}
        <Table>
          <thead>
            <tr>
              {this.getTHs()}
            </tr>
          </thead>
          <tbody id={id}>
            { rows }
          </tbody>
        </Table>
      </div>
    )
    tc(231)
    return res
  }

}

class Searcher extends React.Component {

  constructor(props) {
    super(props)
    this.quickValue = "@@@"
    this.state = {quickValue: this.quickValue}
    this.constOnChange = this.onChange.bind(this)
  }

  getId() {
    let p = this.props
    let res = "searcher"
    let list = p.list
    if ( ! list.isTopLevel() ) {
      let listId = p.list.name().toId()
      res += listId
    }
    return res
  }

  render() {
    let p = this.props
    let val = p.value
    if ( this.quickValue !== "@@@") {
      val = this.quickValue
      this.quickValue = "@@@"
    }
    let ph = "Search".translate()
    let disabled = false //(p.list.waitCount > 0) || Server.isWaiting()
    let list = p.list
    let searcherId = this.getId()
    let searcherClearId = "searcherClear"
    if ( ! list.isTopLevel() ) {
      let listId = p.list.name().toId()
      searcherClearId += listId
    }
    let c = "stSearcher"
    if ( p.className )
      c += " " + p.className
    return (
      <InputGroup className={c}>
        <STInput
          key={searcherId}
          className="stSearcherInput"
          value={val}
          id={searcherId}
          onChange={this.constOnChange}
          placeholder={ph}
          disabled={disabled}
        />
        <InputGroupAddon addonType="append">
          <InputGroupText 
            style={{opacity: "70%"}}
            className="stSearcherClear"
            id={searcherClearId}
            onClick={p.onClear}>
            {"\u2716"}
          </InputGroupText>
        </InputGroupAddon>
      </InputGroup>
    )
  }

  refreshState() {
    this.setState({quickValue: this.quickValue})
  }

  grabFocus() {
    let id = this.getId()
    let el = document.getElementById(id); if ( ! el ) return
    if ( el === document.activeElement ) return
    el.focus()
  }

  onChange(aEvent) {
    let t = aEvent.target
    this.quickValue = t.value
    this.refreshState()
    aEvent.persist()
    execDeferred(() => this.props.onChange(aEvent), 50)
    setTimeout(this.grabFocus.bind(this), 50)
  }

}

class STInput extends React.Component {

  constructor(aProps) {
    super(aProps)
    //this.state = {data: [], inputValue: ''}
    this.state = {inputValue: ''}
    this.lastParentVersion = -1
    this.casts = []
    this.data = []
  }

  componentDidMount() {
    this.unmounted = false
  }

  componentWillUnmount() {
    this.unmounted = true
  }

  field() {
    let f = this.props.field; if ( ! f ) return null
    return f
  }

  async refreshChoices() { /* STInput */
    let f = this.field(); if ( ! f ) return
    if ( f.yesOrNo ) {
      this.refreshYesOrNoChoices()
      return
    }
    if ( f.staticOptions ) {
      this.data = f.staticOptions
      if ( this.unmounted ) return
      this.forceUpdate()
      return
    }
    if ( f.dynamicOptions ) {
      this.data = await f.dynamicOptions(this.props.container)
      if ( this.unmounted ) return
      this.forceUpdate()
      return
    }
    if ( this.refreshingChoices ) return
    this.refreshingChoices = true
    try {
      let rt = f.refersTo; if ( ! rt ) return
      let m = Foreman.nameToMold(rt.datatype)
      tc(550)
      this.casts = await m.retrieve()
      if ( f.sortDropdown ) {
        await f.sortDropdown(this.maint(), this.casts)
      }
      tc(551)
      if ( this.unmounted ) return
      this.data = await this.getData()
      this.forceUpdate()
      tc(552)
    } finally {
      this.refreshingChoices = false
    }
  }

  refreshYesOrNoChoices() {
    //this.setState({data: ["Yes", "No"]})
    this.data = ["Yes", "No"]
    if ( this.unmounted ) return
    this.forceUpdate()
  }

  choiceCasts() {
    return this.casts
  }

  async excludeChoiceCast(aCast) { /* STInput */
    let fn = this.field().excludeChoiceWhen; if ( ! fn ) return false
    let container = this.props.container
    if ( ! container ) return
    if ( container.parentCast )
      return await fn(container, aCast, container.cast, container.parentCast())
    return await fn(container, aCast)
  }

  async getData() {
    let f = this.field()
    let casts = this.choiceCasts()
    let res = [""]
    if ( f.dropdownValue )
      this.dropdownData = [""]
    this.essenceKeys = {"": ""}
    if ( f.allowEmpty === false ) {
      res = []
      if ( f.dropdownValue )
        this.dropdownData = []
      this.essenceKeys = {}
    }
    //await casts.forAllAsync(async c => {
    for ( var i = 0; i < casts.length; i++ ) {
      let c = casts[i]
      if ( f.excludeChoiceWhen && (await this.excludeChoiceCast(c)) ) {
        continue
      }
      let e = c.__mold.essence
      let essVal
      if ( ! e )
        essVal = c.keyValue()
      else {
        await c.refreshCalculations({fieldNames: [e]})
        essVal = c[e]
      }
      res.push(essVal)
      if ( f.dropdownValue ) {
        let ddVal = await f.dropdownValue(this.maint(), c)
        this.dropdownData.push(ddVal)
      }
      this.essenceKeys[essVal] = c.keyValue()
    }
    //})
    if ( ! f.sortDropdown ) {
      res.sort((s1, s2) => (s1 > s2) ? 1 : -1)
      if ( this.dropdownData )
        this.dropdownData.sort((s1, s2) => (s1 > s2) ? 1 : -1)
    }
    return res
  }

  maint() {
    return this.props.maint
  }

  fieldToInputType(aField) {
    if ( ! aField ) return "text"
    if ( aField.date )
      return "date"
    if ( aField.tickbox )
      return "checkbox"
    if ( aField.yesOrNo )
      return "combobox"
    if ( aField.staticOptions || aField.dynamicOptions )
      return "combobox"
    if ( aField.refersTo )
      return "combobox"
    if ( aField.multiLine )
      return "textarea"
    if ( aField.jsEditor )
      return "jsEditor"
    if ( aField.file )
      return "file"
    return "text"
  }

  async refreshOptions() {
    await this.refreshChoices()
  }

  fieldName() {
    let f = this.field(); if ( ! f ) return "generic"
    return f.name
  }

  needsOptions() {
    return this.getInputType() === "combobox"
  }

  render() { // STInput
    let p = this.props
    let f = this.field()
    if ( this.needsOptions() ) {
      let suppressRefreshOptions = f ? f.suppressRefreshOptions : false
      if ( (! suppressRefreshOptions) || ( this.data.length === 0) ) {
        if ( (this.data.length === 0 ) || (p.parentVersion && (p.parentVersion !== this.lastParentVersion)) ||
            (p.moldVersion && (p.moldVersion !== this.lastMoldVersion))
          ) {
          this.value = p.value
          this.lastParentVersion = p.parentVersion
          this.lastMoldVersion = p.moldVersion
          execDeferred(this.refreshOptions.bind(this), {noSpinner: true}) // async - will force re-render after this render if options change
        }
      }
    } else if ( p.parentVersion !== this.lastParentVersion ) {
      this.value = p.value
    } else if ( p.moldVersion !== this.lastMoldVersion ) {
      this.value = p.value
    }
    this.lastParentVersion = p.parentVersion
    this.lastMoldVersion = p.moldVersion
    let elName = "stocktend_" + p.id
    let type = this.fieldToInputType(f)
    let handleClick = event => {
      let el = event.target
      if ( global.lastClickedInput === el ) return null // prevent Edge stopping you from clicking inside the text after you first click in
      global.lastClickedInput = el
      if ( ! global.isFunction(el.select) ) return null
      el.select()
    }
    let value
    if ( p.handleOwnValueChange || (type === "checkbox") || (type === "combobox") || (type === "jsEditor") ) {
      value = this.value
      if ( ! value )
        value = ''
    } else {
      value = p.value
    }
    if ( type === "date" ) {
      let format = global.getShortDateFormat().toUpperCase()
      if ( value === global.emptyYMD() )
        value = null
      if ( value )
        value = global.ymdToDate(value).toISOString()
      return (
        <DatePicker 
          className={p.className}
          id={p.id} 
          name={elName}
          dateFormat={format}
          value={value}
          onChange={this.onDateChange.bind(this)}
          onClick={handleClick}
          invalid={p.invalid}
          placeholder={p.placeholder}
          disabled={p.disabled}
          showClearButton={false}
        >
        </DatePicker>
      )
    }
    if ( type === "combobox" ) {
      if ( f.refersToMoldWithEssence() && (type === 'combobox') ) 
        value = this.keyValueToEssenceValue(value)
      return (
        <Combobox 
          data={this.data}
          dropdownData={this.dropdownData}
          className={p.className}
          id={p.id} 
          name={elName}
          value={value}
          onChange={this.onComboboxChange.bind(this)}
          onBlur={this.onBlur.bind(this)}
          onClick={handleClick}
          invalid={p.invalid}
          type={type}
          placeholder={p.placeholder}
          disabled={p.disabled}>
        </Combobox>
      )
    }
    if ( type === "checkbox" ) {
      let onCheckboxChange = this.onCheckboxChange.bind(this)
      if ( global.autoTesting )
        global.checkboxChangeFunctions[p.id] = onCheckboxChange
      return (
        <Input 
          key={p.id}
          className={p.className}
          id={p.id} 
          name={elName}
          checked={(value === "Yes")}
          onChange={onCheckboxChange}
          type={type}
          disabled={p.disabled}>
        </Input>
      )
    }
    if ( type === "file" ) {
      return (
        <Input 
          key={p.id}
          className={p.className}
          id={p.id} 
          name={elName}
          onChange={this.onChange.bind(this)}
          type={type}
          accept={f.accept}
          disabled={p.disabled}>
        </Input>
      )
    }
    if ( type === "jsEditor" ) {
      return (
        <Editor 
          key={p.id}
          className={p.className}
          highlight={code => highlight(code, languages.js)}
          id={p.id} 
          name={elName}
          value={value}
          padding={10}
          style={{
            fontFamily: '"Fira code", "Fira Mono", monospace',
            fontSize: 12,
            border: '1px solid #ced4da',
            borderRadius: '.25rem'
          }}
          onValueChange={this.onEditorChange.bind(this)}
        />
      )
    }
    let style = {}
    if ( f && f.inputWidthPx )
      style.width = f.inputWidthPx + 'px'
    return (
      <Input 
        key={p.id}
        className={p.className}
        id={p.id} 
        name={elName}
        value={value}
        onChange={this.onChange.bind(this)}
        onBlur={this.onBlur.bind(this)}
        onClick={handleClick}
        invalid={p.invalid}
        type={type}
        placeholder={p.placeholder}
        style={style}
        disabled={p.disabled}>
      </Input>
    )
  }

  onBlur(aEvent) {
    let t = aEvent.target; if ( ! t ) return
    //this.forceValidValue(t.value)
    let f = this.props.onBlur
    if ( f )
      f()
  }

  getAutocomplete(aVal) {
    if ( ! aVal ) return null
    let lcVal = aVal.toLowerCase()
    //for ( var i = 0; i < this.state.data.length; i++ ) {
    for ( var i = 0; i < this.data.length; i++ ) {
      //let val = this.state.data[i]; if ( ! val ) continue
      let val = this.data[i]; if ( ! val ) continue
      if ( val.toLowerCase().startsWith(lcVal) )
        return val
    }
    return null
  }

  isYesOrNo() {
    return this.field().yesOrNo
  }

  getInputType() {
    return this.fieldToInputType(this.field())
  }

  isValidOption(aVal) {
    let type = this.getInputType()
    if ( type !== "combobox" ) return true
    return this.data.contains(aVal)
  }

  rememberCursorPosition(aElement) {
    if ( ! aElement ) return
    this.cursorPosition = aElement.selectionStart
    this.rememberMs = global.nowMs()
  }

  grabFocus() {
    let id = this.props.id
    let el = document.getElementById(id); if ( ! el ) return
    if ( el === document.activeElement ) return
    el.focus()
  }

  restoreCursorPosition(aElement) {
    if ( ! aElement ) return
    if ( aElement.type === "file" ) return
    let pos = this.cursorPosition
    let rememberMs = this.rememberMs
    execDeferred(() => {
      if ( rememberMs !== this.rememberMs ) return
      aElement.selectionStart = pos
      aElement.selectionEnd = pos
    }, {noSpinner: true})
  }

  onChange(aEvent) { /* STInput */
    let f = this.field()
    let t = aEvent.target
    if ( f && f.file ) {
      let acf = f.afterChoosingFile
      if ( acf )
        acf(this.props.container, t.files)
      return
    }
    let val = this.eventToValue(aEvent)
    this.rememberCursorPosition(t)
    let invalid = (! (f && f.allowAny)) && (! this.isValidOption(val))
    this.props.onChange(aEvent, val, {invalid: invalid})
    this.restoreCursorPosition(t)
    if ( this.props.handleOwnValueChange || (f && f.tickbox) ) {
      let t = aEvent.target
      this.value = t.value
      if ( this.unmounted ) return
      this.forceUpdate()
    }
  }

  onEditorChange(aText) { /* STInput */
    let f = this.field()
    this.props.onChange(f.name, aText)
    this.value = aText
    if ( this.unmounted ) return
    this.forceUpdate()
  }

  onCheckboxChange(aEvent, aTestValue) { /* STInput */
    let val
    let t = aEvent.target
    val = (t.checked === true) ? "Yes" : "No"
    this.value = val
    this.props.onChange(aEvent, val)
    this.forceUpdate()
  }

  essenceValueToKeyValue(value) {
    return this.essenceKeys[value]
  }

  keyValueToEssenceValue(value) {
    let casts = this.choiceCasts()
    for ( var i = 0; i < casts.length; i++ ) {
      let cast = casts[i]
      if ( cast.keyValue() !== value ) 
        continue
      return cast[cast.__mold.essence]
    }
    return value
  }

  onComboboxChange(aValue) { /* STInput */
    let val = aValue
    let f = this.field()
    let keyVal
    let invalid
    if ( f.refersToMoldWithEssence() ) {
      keyVal = this.essenceValueToKeyValue(val)
    }
    this.value = val
    invalid = (! (f && f.allowAny)) && (! this.isValidOption(val))
    this.props.onChange(this.fieldName(), val, {invalid: invalid, keyVal: keyVal})
  }

  eventToValue(aEvent) {
    let t = aEvent.target; if ( ! t ) return null
    return t.value
  }

  onDateChange(aValue, aFormattedValue) {
    let ymd = aValue
    if ( ! ymd ) 
      ymd = global.emptyYMD()
    if ( ymd === "invalid" )
      ymd = global.invalidYMD()
    ymd = ymd.substr(0, 10)
    let fn = this.fieldName()
    this.props.onChange(fn, ymd, {invalid: (aValue === "invalid")})
  }

  safeValue(aVal) {
    if ( ! aVal ) return ''
    return aVal
  }

  nameToId(aName) {
    return aName.toId()
  }

}


class Mold {

  constructor(aName) {
    this.name = aName
    this.caption = this.name
    this.fields = []
    this.fieldsObj = {}
    this.methods = []
    this.methodNames = []
    this._childMolds = []
    this.version = 1
    this.calculatingCount = 0
    this.subsets = {}
    this.indexedFieldNames = []
    this.fieldCliques = {}
    this._lastSavedTimeMs = 0
    this._lastExternallyAlteredTimeMs = 0
    this.initCasts()
  }

  hasBeenSavedOrExternallyAlteredSince(time) {
    let res = false
    if ( this._lastSavedTimeMs > time ) {
      res = true
    } else if ( this._lastExternallyAlteredTimeMs > time ) {
      res = true
    }
    if ( res && global.logRefreshPackables )
      "hasBeenSavedOrExternallyAlteredSince returning true for".m(this.name)
    return res
  }

  getSingleSubsetName() {
    let keys = Object.keys(this.subsets)
    if ( keys.length !== 1 ) return null
    let ssn = keys[0]
    return ssn
  }

  markFieldAsIndexed(f) {
    let n = f.name
    if ( this.indexedFieldNames.indexOf(n) >= 0 ) return
    this.indexedFieldNames.push(n)
    this.fieldCliques[n] = {}
  }

  onlyHoldsSubset(subsetName) {
    if ( this.holdingAllCasts ) return false
    if ( Object.keys(this.subsets).length !== 1 ) return false
    let subset = this.subsets[subsetName]; if ( ! subset ) return false
    return subset.held
  }

  qtyInClique(aKey) {
    let c = this.cliques[aKey]
    if ( ! c ) return 0
    return c.casts.length
  }

  excise(aExcisionCastIds) {
    for ( var i = 0; i < aExcisionCastIds.length; i++ ) {
      let id = aExcisionCastIds[i]
      let cast = this.quickIdToCast(id); if ( ! cast ) continue
      this.deleteCastFromIndexes(cast)
      this.casts.removeElement(cast)
    }
  }

  flush() {
    this.initCasts()
    this.initBayCasts()
  }

  toLineDatatype() {
    let m = this.toLineMold(); if ( ! m ) return null
    return m.name
  }

  async checkNoDuplicateKeys() {
    if ( ! this.key ) return
    await this.casts.forAllAsync(async c => {
      let f = this.nameToField(this.key); if ( ! f ) return "continue"
      if ( f.nonUnique )
        return "continue"
      let val = c[this.key]
      let checkCasts = await this.retrieve({[this.key]: val})
      if ( checkCasts.length > 1 ) {
        console.log("checkNoDuplicateKeys: mold " + this.name + " has duplicate on:");
        console.log(val)
        throw(new Error("checkNoDuplicateKeys failed"))
      }
    })
  }

  keyIsUnique() {
    if ( ! this.key ) return false
    let f = this.nameToField(this.key); if ( ! f ) return false
    if ( f.nonUnique )
      return false
    return true
  }

  fieldNameReferringToParent() {
    let f = this.getFieldThatRefersToParent(); if ( ! f ) return null
    return f.name
  }

  hasParent() {
    return this.parentMold() ? true : false
  }

  createField(aName) { /* Mold */
    let f = new Field(aName)
    this.fields.push(f)
    this.fieldsObj[aName] = f
    f.datatype = this.datatype()
    return f
  }

  refreshIdIndex(aCast) {
    this.castsById[aCast.id] = aCast
    delete this.castsById[aCast.__indexedId]
    aCast.__indexedId = aCast.id
  }

  refreshParentIndex(aCast) {
    let family = this.familiesById[aCast.__indexedParentId]
    if ( family )
      family.casts.removeElement(aCast)
    this.addToParentIndex(aCast)
  }

  refreshFieldIndexes(aCast) {
    for ( var i = 0; i < this.indexedFieldNames.length; i++ ) {
      let fn = this.indexedFieldNames[i]
      this.refreshFieldIndex(fn, aCast)
    }
  }

  refreshFieldIndex(aFieldName, aCast) {
    if ( ! aCast.__indexedFieldVals )
      aCast.__indexedFieldVals = {}
    let origVal = aCast.__indexedFieldVals[aFieldName]
    let newVal = aCast[aFieldName]
    if ( newVal === origVal ) return
    let origKeyval
    let origId
    if ( global.isObj(origVal) ) {
      origId = origVal.id
      origKeyval = origVal.keyval
    }
    let newKeyval
    let newId
    if ( global.isObj(newVal) ) {
      newId = newVal.id
      newKeyval = newVal.keyval
    }
    if ( (newId || origId || newKeyval || origKeyval) && (newId === origId) && (newKeyval === origKeyval) )
      return
    let clique
    let cliques = this.fieldCliques[aFieldName]
    if ( origId || origKeyval ) {
      if ( origKeyval ) {
        clique = cliques[origKeyval]
        if ( clique ) {
          clique.casts.removeElement(aCast)
        }
      }
      if ( origId ) {
        clique = cliques["#" + origId]
        if ( clique ) {
          clique.casts.removeElement(aCast)
        }
      }
    } else {
      clique = cliques[origVal]
      if ( clique ) {
        clique.casts.removeElement(aCast)
      }
    }
    this.addToFieldIndex(aFieldName, aCast)
  }

  addToFieldIndex(aFieldName, aCast) {
    let val = aCast[aFieldName]
    aCast.__indexedFieldVals[aFieldName] = val
    let keyval
    let id
    if ( global.isObj(val) ) {
      id = val.id
      keyval = val.keyval
    }
    let clique
    let cliques = this.fieldCliques[aFieldName]
    if ( keyval || id ) {
      if ( keyval ) {
        clique = cliques[keyval]
        if ( ! clique ) {
          clique = {casts: []}
          cliques[keyval] = clique
        }
        clique.casts.push(aCast)
      }
      if ( id ) {
        clique = cliques["#" + id]
        if ( ! clique ) {
          clique = {casts: []}
          cliques["#" + id] = clique
        }
        clique.casts.push(aCast)
      }
    } else {
      clique = cliques[val]
      if ( ! clique ) {
        clique = {casts: []}
        cliques[val] = clique
      }
      clique.casts.push(aCast)
    }
  }

  refreshKeyIndex(aCast) {
    let origVal = aCast.__indexedKeyval
    let newVal = aCast[this.key]
    let origKeyval = origVal
    let origId
    if ( global.isObj(origVal) ) {
      origId = origVal.id
      origKeyval = origVal.keyval
    }
    let newKeyval = newVal
    let newId
    if ( global.isObj(newVal) ) {
      newId = newVal.id
      newKeyval = newVal.keyval
    }
    if ( (newId || origId || newKeyval || origKeyval) && (newId === origId) && (newKeyval === origKeyval) )
      return
    let clique
    if ( origId || origKeyval ) {
      if ( origKeyval ) {
        clique = this.cliques[origKeyval]
        if ( clique ) {
          clique.casts.removeElement(aCast)
        }
      }
      if ( origId ) {
        clique = this.cliques["#" + origId]
        if ( clique ) {
          clique.casts.removeElement(aCast)
        }
      }
    }
    this.addToKeyIndex(aCast)
  }

  assertCastInIndexes(aCast) {
    let c = this.castsById[aCast.id]; if ( ! c ) throw(new Error("Cast not in id index"))
    if ( c !== aCast ) throw(new Error("Incorrect cast in id index"))
    if ( c.parentId ) {
      let f = this.familiesById[c.parentId]; if ( ! f ) throw(new Error("Cast not in parent index"))
      if ( f.casts.indexOf(aCast) < 0 ) throw(new Error("Cast not in parent index (2)"))
    }
    if ( this.key ) {
      let keyval = aCast[this.key]
      if ( global.isObj(keyval) ) {
        if ( keyval.id )
          keyval = "#" + keyval.id
        else
          keyval = keyval.keyval
      }
      let clique = this.cliques[keyval]; 
      if ( ! clique ) {
        "assertCastInIndexes this".m(this)
        "assertCastInIndexes aCast".m(aCast)
        "assertCastInIndexes keyval".m(keyval)
        throw(new Error("Cast not in key index"))
      }
      if ( clique.casts.indexOf(aCast) < 0 ) throw(new Error("Cast not in key index (2)"))
    }
  }

  clearFallout() {
    if ( ! this._hasFallout ) return 
    this._hasFallout = false
    this.casts.forAll(c => c.clearPreFallout())
  }

  rollbackFallout() {
    if ( this.staticData ) {
      this._stale = true
      return
    }
    for ( var i = this.casts.length - 1; i >= 0; i-- ) { // done in reverse order because of potential deletions
      let c = this.casts[i]
      c.rollbackFallout()
    }
  }

  initCasts() {
    this.casts = []
    this.changedCasts = []
    this.castsById = {}
    this.familiesById = {}
    this.cliques = {}
    for ( var i = 0; i < this.indexedFieldNames.length; i++ ) {
      let fieldName = this.indexedFieldNames[i]
      this.fieldCliques[fieldName] = {}
    }
    this.holdingAllCasts = false
    this.markAllSubsetsAsUnheld()
    this._stale = false
    this.__plexed = false
    this.version++
  }

  markAllSubsetsAsUnheld() {
    for ( var subsetName in this.subsets ) {
      this.subsets[subsetName].held = false
    }
  }

  initBayCasts() {
    this.bayCasts = []
  }

  addMethod(aName, aFn) {
    let idx = this.methodNames.indexOf(aName)
    if ( idx < 0 ) {
      this.methodNames.push(aName)
      this.methods.push(aFn)
    } else {
      this.methods[idx] = aFn
    }
  }

  setCruxFields(fieldNames) {
    this.cruxFieldNames = []
    this.cruxFieldNamesObj = {}
    for ( var i = 0; i < fieldNames.length; i++ ) {
      let fieldName = fieldNames[i]
      let field = this.nameToField(fieldName)
      if ( ! field )
        throw(new Error('Invalid crux field ' + fieldName))
      this.cruxFieldNames.push(fieldName)
      this.cruxFieldNamesObj[fieldName] = true
    }
  }

  setCruxField(field) {
    this.cruxFieldNames = [field.name]
    this.cruxFieldNamesObj = {}
    this.cruxFieldNamesObj[field.name] = true
  }

  addCast(aOptions) { /* Mold */
    if ( gLogTimings ) tc(420)
    let c = this.makeCast(aOptions)
    if ( gLogTimings ) tc(422)
    this.casts.push(c)
    this.refreshIdIndex(c)
    if ( gLogTimings ) tc(423)
    this.refreshParentIndex(c)
    if ( gLogTimings ) tc(421)
    this.version++
    if ( gForeman.doingSideEffects ) {
      c.__potentiallyAffectedBySideEffect = true
      this.__potentiallyAffectedBySideEffect = true
    }
    return c
  }

  addToParentIndex(aCast) {
    aCast.__indexedParentId = aCast.parentId
    let familyId = aCast.parentId; if ( ! familyId ) return 
    let family = this.familiesById[familyId]
    if ( ! family ) {
      family = {casts: [], id: familyId}
      this.familiesById[familyId] = family
    }
    family.casts.push(aCast)
  }

  addToKeyIndex(aCast) {
    if ( ! aCast ) return
    let key = this.key; if ( ! key ) return
    let val = aCast[key]
    aCast.__indexedKeyval = global.copyObj(val)
    let keyval
    let id
    if ( global.isObj(val) ) {
      id = val.id
      keyval = val.keyval
    }
    let clique
    if ( keyval || id ) {
      if ( keyval ) {
        clique = this.cliques[keyval]
        if ( ! clique ) {
          clique = {casts: []}
          this.cliques[keyval] = clique
        }
        clique.casts.push(aCast)
      }
      if ( id ) {
        clique = this.cliques["#" + id]
        if ( ! clique ) {
          clique = {casts: []}
          this.cliques["#" + id] = clique
        }
        clique.casts.push(aCast)
      }
    } else {
      clique = this.cliques[val]
      if ( ! clique ) {
        clique = {casts: []}
        this.cliques[val] = clique
      }
      clique.casts.push(aCast)
    }
  }

  makeCast(aOptions) { /* Mold */
    if ( gLogTimings ) tc(430)
    let c = new Cast(this)
    c._datatype = this.datatype()
    let forBay = aOptions && aOptions.forBay
    if ( (! this.staticData) && (! forBay) )
      c.id = Foreman.generateTempId()
    if ( gLogTimings ) tc(431)
    this.setCastValuesToCorrectTypes(c)
    if ( gLogTimings ) tc(432)
    c.__old = c.copyNaked()
    if ( gLogTimings ) tc(433)
    this.addMethodsToCast(c)
    if ( gLogTimings ) tc(434)
    if ( aOptions ) 
      this.linkCastToParent(c, aOptions.parentCast)
    //let m = c.__mold
    //if ( Foreman.trackingFallout() && ! ( m.transient || m.staticData || m.readOnly ) ) {
    if ( ! forBay ) {
      if ( Foreman.trackingFallout() ) {
        c.__preFallout = "nonexistent"
        c.__mold._hasFallout = true
      }
      c.__potentiallyChanged = true
    }
    if ( gLogTimings ) tc(436)
    return c
  }

  addMethodsToCast(aCast) {
    let i = 0
    this.methods.forEach(m => {
      let fn = this.methodNames[i]
      aCast[fn] = m.bind(aCast)
      i = i + 1
    })
  }

  childMolds() {
    return this._childMolds
  }

  cancelChanges() {
    this.removeNewCasts()
    forAll(this.casts).do(cast => {
      cast.revertToOld()
    })
    this.version++
  }

  removeNewCasts() {
    let i = 0
    while ( i < this.casts.length ) {
      let cast = this.casts[i]
      if ( cast.isNew() ) {
        this.deleteCastFromIndexes(cast)
        this.casts.removeByIndex(i)
        continue
      }
      i = i + 1
    }
    this.version++
  }

  deleteCastFromFieldIndexes(aCast) {
    for ( var i = 0; i < this.indexedFieldNames.length; i++ ) {
      let fn = this.indexedFieldNames[i]
      this.deleteCastFromFieldIndex(fn, aCast)
    }
  }

  deleteCastFromFieldIndex(aFieldName, aCast) {
    if ( ! aCast.__indexedFieldVals ) return
    let val = aCast.__indexedFieldVals[aFieldName]
    aCast.__indexedFieldVals[aFieldName] = null
    let keyval
    let id
    if ( global.isObj(val) ) {
      id = val.id
      keyval = val.keyval
    }
    let clique
    let cliques = this.fieldCliques[aFieldName]
    if ( id || keyval ) {
      if ( keyval ) {
        clique = cliques[keyval]
        if ( clique )
          clique.casts.removeElement(aCast)
      }
      if ( id ) {
        clique = cliques["#" + id]
        if ( clique )
          clique.casts.removeElement(aCast)
      }
    } else {
      clique = cliques[val]
      if ( clique )
        clique.casts.removeElement(aCast)
    }
  }

  deleteCastFromKeyIndex(aCast) {
    let val = aCast.__indexedKeyval
    aCast.__indexedKeyval = null
    let key = this.key; if ( ! key ) return
    let keyval
    let id
    if ( global.isObj(val) ) {
      id = val.id
      keyval = val.keyval
    }
    let clique
    if ( id || keyval ) {
      if ( keyval ) {
        clique = this.cliques[keyval]
        if ( clique ) 
          clique.casts.removeElement(aCast)
      }
      if ( id ) {
        clique = this.cliques["#" + id]
        if ( clique )
          clique.casts.removeElement(aCast)
      }
    } else {
      clique = this.cliques[val]
      if ( clique )
        clique.casts.removeElement(aCast)
    }
  }

  deleteCastFromParentIndex(aCast) {
    let familyId = aCast.__indexedParentId
    aCast.__indexedParentId = null
    if ( ! familyId ) return
    let family = this.familiesById[familyId]; if ( ! family ) return
    family.casts.removeElement(aCast)
  }

  deleteCastFromIndexes(aCast) {
    delete this.castsById[aCast.__indexedId]
    aCast.__indexedId = null
    this.deleteCastFromParentIndex(aCast)
    this.deleteCastFromKeyIndex(aCast)
    this.deleteCastFromFieldIndexes(aCast)
  }

  removeCast(aCast, options) {
    let ignoreChildren = options && options.ignoreChildren
    if ( ! ignoreChildren )
      aCast.removeChildren()
    this.deleteCastFromIndexes(aCast)
    this.casts.removeElement(aCast)
    this.version++
  }

  removeCastsMarkedForDeletion() {
    let i = 0
    while ( i < this.casts.length ) {
      let cast = this.casts[i]
      if ( cast._markedForDeletion ) {
        this.deleteCastFromIndexes(cast)
        this.casts.removeByIndex(i)
        continue
      }
      i = i + 1
    }
    this.version++
  }

  refreshOldForCasts(aCasts) {
    for ( var i = 0; i < aCasts.length; i++ ) {
      let cast = aCasts[i]
      cast.refreshOld()
    }
  }

  refreshOld(aOptions) {
    let casts = this.casts
    if ( aOptions ) {
      let parentId = aOptions.parentId
      if ( parentId ) 
        casts = casts.filter(c => c.parentId === parentId)
    }
    this.refreshOldForCasts(casts)
  }

  refreshDefaultCopiesForCasts(aCasts) {
    for ( var i = 0; i < aCasts.length; i++ ) {
      let cast = aCasts[i]
      cast.refreshDefaultCopy()
    }
  }

  refreshDefaultCopies(aOptions) {
    let casts = this.casts
    if ( aOptions ) {
      let parentId = aOptions.parentId
      if ( parentId ) 
        casts = casts.filter(c => c.parentId === parentId)
    }
    this.refreshDefaultCopiesForCasts(casts)
  }

  removeCasts(aOptions) {
    let casts = this.casts
    if ( aOptions ) {
      let parentId = aOptions.parentId
      if ( parentId ) 
        casts = casts.filter(c => c.parentId === parentId)
    }
    casts.forAll(c => {
      c.remove()
    })
    this.version++
  }

  flagCastsAsPotentiallyChanged(aCasts) {
    let doingSideEffects = gForeman.doingSideEffects
    for ( var i = 0; i < aCasts.length; i++ ) {
      let cast = aCasts[i]
      cast.__potentiallyChanged = true
      if ( ! doingSideEffects ) continue
      cast.__potentiallyAffectedBySideEffect = true
      cast.__mold.__potentiallyAffectedBySideEffect = true
    }
  }

  async doAfterRetrievesForCasts(aCasts) {
    if ( ! this.afterRetrieving ) return null
    let done = 0
    let f = this.afterRetrieving; if ( ! f ) return null
    if ( gLogTimings ) tc(607)
    for ( var i = 0; i < aCasts.length; i++ ) {
      let cast = aCasts[i]
      if ( global.monitorRetrievesOpt && (cast.__trb !== 'Yes') && (this.source !== 'WC') && 
        (this.name !== 'Configuration') /* sometimes very first Configuration retrieve is just normal */ ) {
        console.log(cast);
        throw(new Error('Expected turbo results but got normal'))
      }
      if ( cast.isNew() ) continue
      if ( cast.__afterRetrieveDone ) continue
      if ( cast.__doingAfterRetrieve ) continue
      if ( gLogTimings ) tc(611)
      //await this.doCastAfterRetrieve(cast)

      // ===== INLINE FOR PERFORMANCE
      let aCast = cast
      aCast.__doingAfterRetrieve = true
      try {
        let ff = this.afterRetrievingFast
        if ( ff ) {
          ff = ff.bind(aCast)
          let ffres = ff()
          if ( ffres )
            continue
        }
        if ( gLogTimings ) tc(605)
        let f = this.afterRetrieving; if ( ! f ) continue
        f = f.bind(aCast)
        if ( gLogTimings ) tc(606)
        await f()
        if ( gLogTimings ) tc(605)
      } finally {
        aCast.__doingAfterRetrieve = false
        if ( ! aCast.mold().alwaysDoAfterRetrieve )
          aCast.__afterRetrieveDone = true
      }
      // =====

      if ( gLogTimings ) tc(612)
      done++
    }
    if ( gLogTimings ) tc(608)
    if ( done > 0 ) {
      this.version++
    }
    if ( gLogTimings ) tc(609)
  }

  async doCastAfterRetrieve(aCast) {
    if ( aCast.isNew() ) return
    if ( aCast.__afterRetrieveDone ) return
    if ( aCast.__doingAfterRetrieve ) return
    aCast.__doingAfterRetrieve = true
    try {
      let ff = this.afterRetrievingFast
      if ( ff ) {
        ff = ff.bind(aCast)
        let ffres = ff()
        if ( ffres )
          return
      }
      if ( gLogTimings ) tc(605)
      let f = this.afterRetrieving; if ( ! f ) return null
      f = f.bind(aCast)
      if ( gLogTimings ) tc(606)
      await f()
      if ( gLogTimings ) tc(605)
    } finally {
      aCast.__doingAfterRetrieve = false
      if ( ! aCast.mold().alwaysDoAfterRetrieve )
        aCast.__afterRetrieveDone = true
    }
  }

  async doCastAfterCreate(aCast) { /* Mold */
    await this.updateInceptions(aCast)
    let f = this.afterCreating; if ( ! f ) return null
    f = f.bind(aCast)
    let key = aCast.__mold.key
    let origKeyVal
    if ( key )
      origKeyVal = aCast[key]
    await f()
    let keyval = aCast[key]
    if ( keyval !== origKeyVal ) 
      aCast.__mold.refreshKeyIndex(aCast, origKeyVal)
    this.version++
  }

  async updateInceptions(aCast) {
    let f = this.beforeInception 
    if ( f ) {
      f = f.bind(aCast)
      await f()
    }
    let c = aCast
    let fields = c.fields()
    for ( var i = 0; i < fields.length; i++ ) {
      let f = fields[i]
      let v = f.toInception()
      if ( ! v ) continue
      if ( v instanceof Function ) {
        let fres = v(c)
        if ( global.isPromise(fres) ) {
          let val = await fres
          c[f.name] = val
        } else
          c[f.name] = fres
      } else
        c[f.name] = v
    }
  }

  async refreshCalculationsForCasts(aCasts, aOptions) {
    //tc(622)
    if ( this.calculatingCount > 0 ) return 
    let includeDefers = aOptions && (aOptions.includeDefers || aOptions.force)
    let fieldNames = aOptions && aOptions.fieldNames
    let done = 0
    for ( var i = 0; i < aCasts.length; i++ ) {
      let cast = aCasts[i]
      if ( (! includeDefers) && (! fieldNames) && (! cast.__mold.__hasStoredCalcs) ) {
        continue // performance tweak
      }
      if ( cast.__refreshingCalculations ) 
        await this.waitForRefreshCalcs(cast)
      if ( cast.__calculationsRefreshed && (! cast.__aggregandsStale) ) continue
      if ( gLogTimings ) tc(910)
      let didAnything = await this.refreshCastCalculations(cast, aOptions)
      if ( gLogTimings ) tc(911)
      if ( didAnything )
        done++
      //if ( (done % 10) === 0 ) 
        //tcReport()
    }
    if ( done > 0 ) {
      this.version++
    }
    //tc(623)
  }

  hasAggregands() {
    let fields = this.fields
    for ( var i = 0; i < fields.length; i++ ) {
      let f = fields[i]
      if ( f.showTotal )
        return true
    }
    return false
  }

  async refreshCalculations(aOptions) { /* Mold */
    if ( global.stDoingTrashAll ) return
    let fn = this.fields.filter(f => f.calculate ? true : false)
    if ( fn.length === 0 ) return
    let casts = this.casts
    if ( aOptions.casts )
      casts = aOptions.casts
    if ( aOptions ) {
      let parentId = aOptions.parentId
      if ( parentId ) 
        casts = casts.filter(c => c.parentId === parentId)
    }
    if ( aOptions && (aOptions.force) ) {
      for ( let i = 0; i < casts.length; i++ )
        casts[i].__calculationsRefreshed = false
    } else if ( aOptions && aOptions.forceAggregands && this.hasAggregands() ) {
      for ( let i = 0; i < casts.length; i++ )
        casts[i].__aggregandsStale = true
    }
    await this.refreshCalculationsForCasts(casts, aOptions)
  }

  async waitForRefreshCalcs(aCast) {
    while ( aCast.__refreshingCalculations )
      await global.wait(10)
  }

  async refreshCastCalculations(aCast, aOptions) { /* Mold */
    if ( aCast.__refreshingCalculations )
      await this.waitForRefreshCalcs(aCast)
    if ( aCast.__calculationsRefreshed && (! aCast.__aggregandsStale) ) {
      return false
    }
    let knt = 0
    let aggregandsOnly = aCast.__calculationsRefreshed && aCast.__aggregandsStale
    let skippedSome = false
    try {
      aCast.__refreshingCalculations = true
      if ( aCast._markedForDeletion ) {
        return false
      }
      let fields = this.fields
      let fieldNames = aOptions && aOptions.fieldNames
      let includeDefers = aOptions && (aOptions.includeDefers || aOptions.force)
      for ( var i = 0; i < fields.length; i++ ) {
        let field = fields[i]
        if ( fieldNames && (fieldNames.indexOf(field.name) < 0 ) ) {
          skippedSome = true
          continue
        }
        if ( field.deferCalc && (! field.storedCalc) && (! includeDefers) && (! fieldNames) ) {
          skippedSome = true
          continue
        }
        let fn = field.calculate
        if ( ! fn ) {
          continue
        }
        if ( aggregandsOnly && (! field.showTotal) ) {
          continue
        }
        this.calculatingCount++
        try {
          let doIt = true
          let wfn = field.calculateWhen
          if ( wfn ) {
            doIt = wfn(aCast)
            if ( global.isPromise(doIt) )
              doIt = await doIt
          }
          if ( ! doIt ) {
          }
          if ( doIt ) {
            if ( gLogTimings ) tc(923)
            //let calcRes = await fn(aCast)
            let calcRes = fn(aCast, field.multiNo)
            if ( global.isPromise(calcRes) ) {
              calcRes = await calcRes
            }
            if ( field.numeric && Number.isNaN(calcRes) )
              calcRes = 0
            let decimals = field.maxDecimals || field.decimals
            if ( decimals || (decimals === 0) )
              calcRes = global.roundToXDecimals(calcRes, decimals)
            if ( aCast[field.name] !== calcRes ) {
              let eqRef = global.isObj(calcRes) && global.isObj(aCast[field.name]) && calcRes.id === aCast[field.name].id
              if ( ! eqRef ) {
                if ( aCast[field.name] !== calcRes ) {
                  knt++
                  aCast[field.name] = calcRes
                }
              }
            }
            if ( gLogTimings ) tc(this.name + '.' + field.name)
          }
        } catch (e) {
          console.log("Error in calculation:")
          console.log(fn)
          console.log(field)
          console.log(e)
        }
        this.calculatingCount--
      }
      if ( knt > 0 ) {
        this.version++
      }
    } finally {
      aCast.__refreshingCalculations = false
      let keepState = aOptions && aOptions.keepState
      if ( ! keepState ) {
        if ( (! aggregandsOnly) && (! skippedSome) )
          aCast.__calculationsRefreshed = true
        aCast.__aggregandsStale = false
      }
    }
    return (knt > 0)
  }

  parentMold() {
    let f = this.getFieldThatRefersToParent(); if ( ! f ) return null
    let dt = f.refersTo.datatype
    if ( global.isArray(dt) )
      dt = dt[0]
    let res = Foreman.nameToMold(dt)
    return res
  }

  parentMolds() {
    let f = this.getFieldThatRefersToParent(); if ( ! f ) return []
    let dt = f.refersTo.datatype
    let res = []
    if ( global.isArray(dt) ) {
      for ( var i = 0; i < dt.length; i++ ) {
        res.push(Foreman.nameToMold(dt[i]))
      }
    } else {
      res.push(Foreman.nameToMold(dt))
    }
    return res
  }

  countParents() {
    let pm = this.parentMold()
    if ( ! pm ) 
      return 0
    return pm.countParents() + 1
  }

  addChildMold(aChild) {
    if ( this._childMolds.indexOf(aChild) >= 0 ) return
    this._childMolds.push(aChild)
  }

  linkCastToParent(aCast, aParent) { /* Mold */
    if ( ! aParent ) return
    let field = this.getFieldThatRefersToParent(); if ( ! field ) return
    let parentMold = Foreman.nameToMold(aParent._datatype); if ( ! parentMold ) return null
    let parentKey = parentMold.key 
    let keyval = parentKey ? aParent[parentKey] : null
    aCast[field.name] = {datatype: aParent._datatype, keyname: parentKey, keyval: keyval, id: aParent.id, kind: "parent"}
    aCast.parentId = aParent.id
  }

  getFieldThatRefersToParent() {
    let fields = this.fields
    for ( var i = 0; i < fields.length; i++ ) {
      let f = fields[i]
      let rt = f.refersTo; if ( ! rt ) continue
      if ( ! rt.refereeIsParent ) continue
      return f
    }
    return null
  }

  addField(aName, aRet) {
    let f = this.nameToField(aName)
    if ( ! f ) {
      f = new Field(aName)
      this.fields.push(f)
      this.fieldsObj[aName] = f
      if ( aRet )
        aRet.new = true
    }
    f.datatype = this.name
    return f
  }

  fieldExists(aField) {
    for ( var i = 0; i < this.fields.length; i++ ) {
      let f = this.fields[i]
      if ( f.name === aField.name ) return true
    }
    return false
  }

  async prepareSave(aChanges) {
    try {
      this.changedCasts = this.getChangedCasts()
      aChanges.nakedCasts = this.getJsonForChanges()
      aChanges.changedCasts = this.changedCasts
    } catch(e) {
      return e.message
    }
  }

  async doBeforeSaving(aOptions) { /* Mold */
    if ( global.stDoingTrashAll ) return
    gForeman.doingSideEffects = true
    gForeman.errorCast = null
    try {
      let fn = this.beforeSaving
      let ccs = aOptions.casts
      for ( let i = 0; i < ccs.length; i++ ) {
        let c = ccs[i]
        c.refreshFieldIndexes()
        if ( this.beforeValidating ) {
          try {
            let bvfn = this.beforeValidating.bind(c)
            await bvfn()
          } catch(e) {
            gForeman.errorCast = c
            throw(new Error(e.message.translate()))
          }
        }
        if ( this.validate ) {
          try {
            let vfn = this.validate.bind(c)
            await vfn()
          } catch(e) {
            gForeman.errorCast = c
            throw(new Error(e.message.translate()))
          }
        }
        if ( fn ) {
          let cf = fn.bind(c)
          try {
            await cf()
          } catch(e) {
            gForeman.errorCast = c
            throw(new Error(e.message.translate()))
          }
        }
        c.resolveParentId()
        this.setCastValuesToCorrectTypes(c)
      }
    } finally {
      gForeman.doingSideEffects = false
    }
  }

  getChangedCasts() { /* Mold */
    let res = []
    let casts = this.casts
    for ( var i = 0; i < casts.length; i++ ) {
      let cast = casts[i]
      if ( ! cast.__potentiallyChanged ) continue
      let isNew = (! cast.id) || cast.id < 0
      if ( isNew ) {
        if ( this.realms )
          cast._realms = this.realms
        res.push(cast)
        continue
      }
      if ( ! cast.changed() ) continue
      if ( this.realms )
        cast._realms = this.realms
      res.push(cast)
    }
    return res
  }

  needsSaving() {
    let res = false
    if ( this.source ) return false
    if ( this.transient || this.staticData || this.readOnly ) return false
    forAll(this.casts).do(cast => {
      if ( cast.needsSaving() ) {
        res = true
        return 'break'
      }
    })
    return res
  }

  async doAfterSaving() {
    if ( global.stDoingTrashAll ) return
    if ( this.__doingAfterSaving ) return
    this.__doingAfterSaving = true
    try {
      this.version++
      let fn = this.afterSaving; if ( ! fn ) return 
      let ccs = this.changedCasts
      for ( let i = 0; i < ccs.length; i++ ) {
        let c = ccs[i]
        let cf = fn.bind(c)
        await cf(c)
      }
    } finally {
      this.__doingAfterSaving = false
    }
  }

  async trashCastById(aId) {
    let c = this.idToCast(aId); if ( ! c ) return
    await c.trash()
  }

  idToCast(aId) {
    return this.castsById[aId]
  }
  
  async trashChildrenOf(aCast) {
    let id = aCast.id
    let children = await this.retrieve({parentId: id})
    await children.forAllAsync(async c => {
      await c.trash()
    })
  }

  async removeChildrenOf(aCast) {
    let id = aCast.id
    let children = this.fastRetrieve({parentId: id})
    for ( var i = 0; i < children.length; i++ ) {
      let child = children[i]
      child.remove()
    }
  }

  toLineMold() {
    let molds = gForeman.molds
    for ( var i = 0; i < molds.length; i++ ) {
      let mold = molds[i]
      let f = mold.getFieldReferringToDatatype(this.name)
      if ( ! f ) 
        continue
      if ( f.parentIsHeader )
        return mold
    }
  }

  getFieldReferringToDatatype(aDatatype) {
    let fields = this.fields
    for ( var i = 0; i < fields.length; i++ ) {
      let field = fields[i]
      let dt = field.refersToDatatype(); if ( ! dt ) continue;
      if ( global.isArray(dt) ) {
        if ( dt.contains(aDatatype) )
          return field
      } else if ( dt === aDatatype ) {
        return field
      }
    }
    return null
    //return this.fields.filterSingle(f => f.refersToDatatype() === aDatatype)
  }

  async refreshBayCastsFromStaticData() {
    if ( this.bayCasts.length > 0 ) return
    let sd = this.staticData || this.facade
    if ( global.isFunction(sd) )  
      sd = await sd()
    this.bayCasts = []
    for ( var i = 0; i < sd.length; i++ ) {
      let d = sd[i]
      let cast = this.makeCast({forBay: true})
      this.copyCastToCast(d, cast)
      this.bayCasts.push(cast)
    }
    this.version++
  }

  copyCastToCast(aFromCast, aToCast, options) {
    for ( var prop in aFromCast) {
      if ( ! Object.prototype.hasOwnProperty.call(aFromCast, prop) ) continue
      aToCast[prop] = aFromCast[prop]
    }
    this.setCastValuesToCorrectTypes(aToCast, options)
  }

  canAlwaysDoFastRetrieve() {
    if ( ! this.holdingAllCasts ) return false
    if ( this.stale() ) return false
    if ( this.hasCalculatedFields ) return false
    if ( this.afterRetrieving ) return false
    return true
  }

  fastRetrieve(aCriteria, aOptions) { /* Mold */
    let retrieveStartMs = global.nowMs()
    let res = this.retrieveFromCasts(aCriteria, true, retrieveStartMs, aOptions)
    this.flagCastsAsPotentiallyChanged(res)
    return res
  }

  fastRetrieveSingle(aCriteria, aOptions) {
    let notConfig = (this.name !== 'Configuration')
    if ( this.stale() && notConfig ) {
      return "na"
    }
    let casts = this.fastRetrieve(aCriteria, aOptions)
    if ( casts.length === 0 ) {
      if ( this.holdingAllCasts ) {
        return null
      } else {
        return "na"
      }
    }
/*
    let fastPossible = this.holdingAllCasts && (! this.stale())
    if ( ! fastPossible ) 
      return "na"
    let casts = this.fastRetrieve(aCriteria, aOptions)
*/
    //if ( gLogTimings ) tc(892)
    let res = casts.first(); 
    if ( ! res ) {
      return res
    }
    let noCalc = aOptions && aOptions.noCalc
    if ( (! noCalc) && this.hasCalculatedFields && (! res.__calculationsRefreshed) && notConfig ) {
      return "na"
    }
    if ( ! res.__afterRetrieveDone ) {
      if ( this.afterRetrieving ) {
        let ff = this.afterRetrievingFast
        if ( ! ff ) {
          return "na"
        }
        let ffres
        if ( ff ) {
          ff = ff.bind(res)
          ffres = ff()
          if ( ! ffres ) {
            return "na"
          }
        }
      }
    }
    return res
  }

  castIsKosher(cast) {
    if ( gLogTimings ) tc('1099.5')
    if ( ! this.holdingAllCasts ) 
      return false
    if ( this.stale() )
      return false
    if ( this.hasCalculatedFields && (! cast.__calculationsRefreshed) )
      return false
    if ( ! cast.__afterRetrieveDone ) {
      if ( this.afterRetrieving ) {
        let ff = this.afterRetrievingFast
        if ( ! ff )
          return false
        let ffres
        ff = ff.bind(cast)
        if ( gLogTimings ) tc(1100)
        ffres = ff()
        if ( gLogTimings ) tc(1101)
        if ( ! ffres )
          return false
      }
    }
    return true
  }

  castsAreKosher(casts) {
    for ( var i = 0; i < casts.length; i++ ) {
      let cast = casts[i]
      if ( ! this.castIsKosher(cast) )
        return false
    }
    return true
  }

  stale() {
    return this._stale
  }

  needServer(aOptions) {
    if ( this.stale() ) return true
    if ( this.holdingAllCasts ) return false
    let ssn = aOptions && aOptions.subsetName
    if ( ! ssn ) return true
    let subset = this.subsets[ssn]; if ( ! subset ) throw(new Error('Unknown subset: ' + ssn))
    if ( subset.held ) return false
    return true
  }

  async retrieve(aCriteria, aOptions) { /* Mold */

    let criteriaContainCalculatedField = aCriteria => {
      for ( var prop in aCriteria ) {
        let f = this.nameToField(prop); if ( ! f ) continue
        if ( f.calculate )
          return true
      }
      return false
    }

    let criteriaToSubsetName = (criteria, info) => {
      let keys = Object.keys(criteria)
      if ( keys.length === 0 ) throw(new Error('Criteria must be specified when using subset caching'))
      let res = keys[0]
      let val = criteria[keys[0]]
      if ( global.isObj(val) ) {
        val = val.id
        if ( val < 0 )
          info.held = true
      }
      res += val
      return res
    }

    let prepareSubset = () => {
      let info = {}
      aOptions.subsetName = criteriaToSubsetName(aCriteria, info); if ( ! aOptions.subsetName ) return
      let subset = this.subsets[aOptions.subsetName]
      if ( ! subset ) {
        (this.name + '.' + aOptions.subsetName).subset(async () => {
          return aCriteria
        })
        subset = this.subsets[aOptions.subsetName]
      }
      if ( info.held )
        subset.held = true
    }

    let retrieveStartMs = global.nowMs()
    let res
    let noCalc = aOptions && aOptions.noCalc
    if ( aOptions && (aOptions.caching === 'subset') ) {
      prepareSubset()
    }
    if ( (! this._fieldsPrepared) && this.modifyFields ) {
      let mff = this.modifyFields.bind(this)
      await mff()
      this._fieldsPrepared = true
    }
    if ( ! this.needServer(aOptions) ) { 
      if ( criteriaContainCalculatedField(aCriteria) )
        await this.refreshCalculationsForCasts(this.casts, aOptions)
      res = this.retrieveFromCasts(aCriteria, true, retrieveStartMs, aOptions)
      if ( gLogClientRetrieves ) ("retrieved from " + this.name + " casts on first pass").m(res)
      if ( gLogClientRetrieves ) "   criteria".m(aCriteria)
      //await this.doAfterRetrievesForCasts(res)

      /* =====INLINE FOR PERFORMANCE */
      let done = 0
      let f = this.afterRetrieving; 
      if ( f ) {
        for ( let i = 0; i < res.length; i++ ) {
          let cast = res[i]
          if ( cast.isNew() ) continue
          if ( cast.__afterRetrieveDone ) continue
          if ( cast.__doingAfterRetrieve ) continue
          //await this.doCastAfterRetrieve(cast)

          // =====INLINE FOR PERFORMANCE
          let aCast = cast
          aCast.__doingAfterRetrieve = true
          try {
            let ff = this.afterRetrievingFast
            let ffres
            if ( ff ) {
              ff = ff.bind(aCast)
              ffres = ff()
            }
            if ( ! ffres ) {
              //if ( gLogTimings ) tc(605)
              let f = this.afterRetrieving; if ( ! f ) continue
              f = f.bind(aCast)
              //if ( gLogTimings ) tc(606)
              await f()
              //if ( gLogTimings ) tc(605)
            }
          } finally {
            aCast.__doingAfterRetrieve = false
            if ( ! aCast.mold().alwaysDoAfterRetrieve )
              aCast.__afterRetrieveDone = true
          }
          // =====
          done++
        }
        if ( done > 0 ) {
          this.version++
        }
      }
      // =====

      this.flagCastsAsPotentiallyChanged(res)
      if ( ! noCalc ) {
        //await this.refreshCalculationsForCasts(res)
        /* =====INLINE FOR PERFORMANCE */
        if ( ! this.calculatingCount ) {
          let done = 0
          for ( let i = 0; i < res.length; i++ ) {
            let cast = res[i]
            if ( cast.__refreshingCalculations ) 
              await this.waitForRefreshCalcs(cast)
            if ( cast.__calculationsRefreshed && (! cast.__aggregandsStale) ) continue
            //if ( gLogTimings ) tc(1100)
            let didAnything = await this.refreshCastCalculations(cast, aOptions)
            //if ( gLogTimings ) tc(1100)
            if ( didAnything )
              done++
          }
          //tc(844)
          if ( done > 0 ) {
            this.version++
          }
        }
        // =====
      }

      return res
    }
    await this.retrieveAndMergeBay(aOptions)
    tc(5)
    if ( criteriaContainCalculatedField(aCriteria) )
      await this.refreshCalculationsForCasts(this.casts, aOptions)
    res = this.retrieveFromCasts(aCriteria, false, retrieveStartMs, aOptions)
    if ( gLogClientRetrieves ) ("retrieved from " + this.name + " casts on second pass").m(res)
    if ( gLogClientRetrieves ) "   criteria".m(aCriteria)
    await this.doAfterRetrievesForCasts(res)
    this.flagCastsAsPotentiallyChanged(res)
    tc(7)
    if ( ! noCalc ) {
      await this.refreshCalculationsForCasts(res, aOptions)
    }
    tc(10)
    return res
  } /* retrieve */

  async waitForBay() {
    while ( this._baying ) {
      await global.wait(10)
    }
  }

  markSubsetAsHeld(subsetName) {
    let ss = this.subsets[subsetName]; if ( ! ss ) return
    ss.held = true
  }

  async retrieveAndMergeBay(aOptions) {
    if ( this._baying ) {
      tc(920)
      await this.waitForBay()
      if ( ! this.needServer(aOptions) )
        return
      tc(921)
    }
    this._baying = true
    try {
      await this.retrieveToBay(aOptions)
      tc(8)
      this.mergeBay()
      tc(9)
      let ssn = aOptions && aOptions.subsetName
      this._stale = false // Note: server returns new/modified data outside of the subset, if one is specified, so we can safely set _stale to false
      if ( ! ssn ) {
        this.holdingAllCasts = true
      } else
        this.markSubsetAsHeld(ssn)
    } finally {
      this._baying = false
    }
  }

  maxCacheDurationMs() {
    if ( global.suspendCaching ) return 5000
    return 99999999999999999; // Cache until stale with new Tryst functionality
  }

  fieldNamesForRetrieve() {
    let fields = this.fields.filter(field => this.isRetrievalField(field))
    let res = fields.mapJoin(
      (field) => {
        let realmName = field.realm
        if ( realmName ) {
          let realm = this.realms && this.realms[field.name]
          let name = (realm && realm.wcFieldName) ? realm.wcFieldName : field.name
          return realmName + "." + name
        }
        return field.name
      }, 
      ',')
    return res
  }

  isConflictSensitiveProp(fieldName) {
    let field = this.nameToField(fieldName); if ( ! field ) return false
    if ( field.skipConflictChecks ) return false
    return this.isRetrievalField(field)
  }

  isRetrievalField(field) {
    return ((! field.isAlwaysCalculated()) || field.storedCalc) && (! field.ephemeral) && (! field.postImage)
  }

  addExtraField(aParms) {
    let f = this.fields.filterSingle(f => f.name === aParms.name)
    if ( f ) 
      return
    f = new Field(aParms.name)
    this.fields.push(f)
    this.fieldsObj[aParms.name] = f
    f.realm = aParms.realm
    f.datatype = this.datatype()
    if ( aParms.numeric )
      f.numeric = true
    this.initCasts()
  }

  subsetIsHeld(subsetName) {
    let ss = this.subsets[subsetName]; if ( ! ss ) return false
    return ss.held
  }

  getBasicBayCall() {
    let dt = this.datatype()
    let call =  "stocktend_object?datatype=" + dt + "&fields=" + this.fieldNamesForRetrieve()
    let src = this.source
    if ( src ) {
      if ( src === "WC" ) 
        call = call + "&source=WC"
    }
    if ( (global.confVal('tbs') === 'Active') && (! global.noTurbo) ) {
      if ( (src !== 'WC') && (src !== 'Null' ) ) {
        call += '&trb=true'
      }
    }
    return call
  }

  retrieveToBayFromPlexus() {
    let nakedCasts = gForeman.plexus
    this.bayCasts = []
    let datatype = this.datatype()
    let nowMs = global.nowMs()
    for ( var i = 0; i < nakedCasts.length; i++ ) {
      let naked = nakedCasts[i]
      if ( naked.__is_prelude ) {
        this.processPrelude(naked)
        continue
      }
      if ( naked._datatype !== datatype ) continue
      let cast = this.makeCast({forCopy: true, forBay: true})
      cast.copyFromNaked(naked)
      cast.__retrievedMs = nowMs
      this.bayCasts.push(cast)
    }
    let log = (gLogServerRetrieves === "true") || (gLogServerRetrieves === this.name)
    if ( log ) "retrieveToBayFromPlexus this.bayCasts".m(this.bayCasts)
    if ( log ) "  ^^^(retrieveToBayFromPlexus datatype)".m(this.datatype())
    this.setBayValuesToCorrectTypes()
  }

  async retrieveToBay(aOptions) {  /* Mold */
    this.initBayCasts()
    if ( this.transient ) return
    if ( this.staticData || this.facade ) {
      await this.refreshBayCastsFromStaticData()
      return
    }
    if ( this.__plexed && (! this.stale()) && (! this.hasBeenRetrievedFromPlexus) ) {
      /*
      let c = await 'Configuration'.bringOrCreate()
      if ( ! c.useClassicDataRetrieval() ) {
        if ( ! gForeman.plexus )
          await gForeman.populatePlexus()
        if ( gForeman.plexus ) {
          this.hasBeenRetrievedFromPlexus = true
          this.retrieveToBayFromPlexus()
          return
        }
      }
      */
      if ( gForeman.plexus ) {
        this.hasBeenRetrievedFromPlexus = true
        this.retrieveToBayFromPlexus()
        return
      }
    }
    //let call = "stocktend_object?datatype=" + this.datatype() + "&fields=" + this.fieldNamesForRetrieve()
    let call = this.getBasicBayCall()
/*
    let src = this.source
    if ( src ) {
      if ( src === "WC" ) 
        call = call + "&source=WC"
    }
*/
    let callOptions
    let ssn = aOptions && aOptions.subsetName
    if ( ssn && (! this.subsetIsHeld(ssn)) ) {
      let subset = this.subsets[ssn]
      if ( ! subset ) throw (new Error('Unknown subset ' + ssn + ' of datatype ' + this.name))
      subset.parms = await subset.function()
      call += "&subsetCriteria=" + JSON.stringify(subset.parms)
    } else if ( this._stale && this._staleTimestamp ) {
      if ( this.holdingAllCasts || (ssn && this.subsetIsHeld(ssn)) )
        call = call + "&modifiedAfter=" + this._staleTimestamp
    }
    if ( global.testNo ) 
      call += "&testNo=" + global.testNo
    let log = (gLogServerRetrieves === "true") || (gLogServerRetrieves === this.name)
    if ( log ) "retrieveToBay call".m(call)
    tc(101)
    let constituent = gForeman.constituent
    if ( constituent ) {
      if ( ! callOptions )
        callOptions = {}
      callOptions.url = constituent.url
      callOptions.consumerKey = constituent.consumerKey
      callOptions.consumerSecret = constituent.consumerSecret
    }
    let json = await Server.get(call, callOptions); if ( ! json ) return
    tc(102)
    if ( log ) "retrieveToBay json".m(json)
    if ( log ) "  ^^^(retrieveToBay datatype)".m(this.datatype())
    this.bayCasts = this.nakedCastsToBayCasts(json.data)
    this.setBayValuesToCorrectTypes()
  }

  mergeBay() {
    tc(90)
    this.version++
    if ( this.staticData || this.facade )
      this.initCasts()
    if ( (this.bayCasts.length > 0) && (! this.bayCasts[0].id) ) {
      this.initCasts()
    }
    forAll(this.bayCasts).do(bayCast => {
      if ( gLogTimings ) tc(91)
      let cast
      if ( bayCast.id )
        cast = this.idToCast(bayCast.id) 
      if ( gLogTimings ) tc(92)
      if ( cast ) {
        if ( bayCast.__incrementalDelete === 'DELETE' ) {
          this.deleteCastFromIndexes(cast)
          this.casts.removeElement(cast)
          return 'continue'
        }
        if ( ! cast._markedForDeletion )
          cast.copyUnchangedFieldsFrom(bayCast)
        cast.__retrievedMs = bayCast.__retrievedMs
        cast.__afterRetrieveDone = false
        cast.__calculationsRefreshed = false
        return 'continue'
      }
      if ( gLogTimings ) tc(93)
      if ( bayCast.__incrementalDelete === 'DELETE' )
        return 'continue'
      this.casts.push(bayCast)
      if ( bayCast.id )
        this.refreshIdIndex(bayCast)
      this.refreshParentIndex(bayCast)
      this.refreshKeyIndex(bayCast)
      this.refreshFieldIndexes(bayCast)
      if ( gLogTimings ) tc(94)
      bayCast.__old = bayCast.copyNaked()
      if ( gLogTimings ) tc(95)
    })
    if ( gLogTimings ) tc(96)
    this.version++
    if ( gLogTimings ) tc(97)
  }

  limitResultsToSubset(casts, ssn) {
    let subset = this.subsets[ssn]
    if ( ! subset ) throw(new Error('Unknown subset ' + ssn + ' of datatype ' + this.name))
    let res = []
    for ( var i = 0; i < casts.length; i++ ) {
      let cast = casts[i]
      if ( this.castMatchesCriteria(cast, subset.parms) ) {
        res.push(cast)
      }
    }
    return res
  }

  retrieveFromCasts(aCriteria, aFirstPass, aRetrieveStartMs, aOptions) {
    //if ( gLogTimings ) tc(40)
    let res = []
    if ( (! aCriteria) && (this.holdingAllCasts || (aOptions && aOptions.subsetName && this.subsets[aOptions.subsetName].held)) ) {
      res = this.casts
    } else if ( aCriteria && (aCriteria.id || (aCriteria.id === 0)) ) {
      res = this.retrieveFromCastsById(aCriteria)
    } else if ( aCriteria && aCriteria.parentId ) {
      res = this.retrieveFromCastsByParentId(aCriteria)
    } else if ( aCriteria ) { // other criteria
      res = this.retrieveFromCastsByOtherCriteria(aCriteria, aOptions)
    }
    //tc(42)
    if ( (! aOptions) || (! aOptions.includeMarkedForDeletion) )
      res = res.filter(c => ! c._markedForDeletion)
    if ( aOptions && aOptions.subsetName )
      res = this.limitResultsToSubset(res, aOptions.subsetName)
    //tc(43)
    //if ( gLogTimings ) tc(890)
    if ( Foreman.trackingFallout() && (res.length > 0) )
      res.forAll(c => c.makePreFalloutCopy())
    //if ( gLogTimings ) tc(891)
    //tc(44)
    return res
  }

  copyCriteria(aCrit) {
    let res = {}
    for ( var prop in aCrit ) {
      let v = aCrit[prop]
      if ( global.isObj(v) && (! Cast.isCast(v)) )
        v = global.copyObj(v)
      res[prop] = v
    }
    return res
  }

  retrieveFromCastsByIndexedField(aFieldName, aCriteria) {
    let id
    if ( ! this.nameToField(aFieldName) ) console.log("***WARNING: Invalid indexedFieldName property: " + aFieldName)
    let val = aCriteria[aFieldName]
    if ( aCriteria[aFieldName] === '' )
      val = ''
    let casts = []
    if ( val || (val === '') ) {
      if ( Cast.isCast(val) ) {
        val = val.reference()
      }
      let compare = "=="
      if ( global.isObj(val) ) {
        compare = val.compare ? val.compare : compare
        id = val.id
        val = val.keyval
      }
      if ( compare === "==" ) {
        casts = []
        if ( id ) {
          casts = this.retrieveFromCastsByFieldIndex(aFieldName, "#" + id)
        }
        if ( (casts.length === 0) && (val || (val === '')) ) {
          casts = this.retrieveFromCastsByFieldIndex(aFieldName, val)
        }
      }
    }
    return casts
  }

  retrieveFromCastsByFieldIndex(aFieldName, aVal) {
    let cliques = this.fieldCliques[aFieldName]
    let clique = cliques[aVal]; 
    if ( ! clique ) return []
    return clique.casts
  }

  retrieveFromCastsByOtherCriteria(aCriteria, aOptions) {
    //tc(83)
    let criteria = this.copyCriteria(aCriteria)
    delete criteria["parentId"]
    delete criteria["id"]
    this.checkCriteria()
    let res = []
    let cast
    let casts = this.casts
    let key = this.key
    let oneFieldOnly = Object.keys(criteria).length === 1
    let isIndexed
    let fieldName
    if ( oneFieldOnly ) {
      fieldName = Object.keys(criteria)[0]
      isIndexed = this.fieldCliques[fieldName] ? true : false
    }
    if ( aOptions && aOptions.useIndexedField ) {
      casts = this.retrieveFromCastsByIndexedField(aOptions.useIndexedField, aCriteria)
    } else if ( oneFieldOnly && isIndexed ) {
      casts = this.retrieveFromCastsByIndexedField(fieldName, aCriteria)
    } else if ( key ) {
      let id
      let val = criteria[key]
      if ( val ) {
        if ( Cast.isCast(val) ) {
          val = val.reference()
        }
        let compare = "=="
        if ( global.isObj(val) ) {
          compare = val.compare ? val.compare : compare
          id = val.id
          val = val.keyval
        }
        if ( compare === "==" ) {
          casts = []
          if ( id ) {
            casts = this.retrieveFromCastsByKey("#" + id)
          }
          if ( (casts.length === 0) && val ) {
            casts = this.retrieveFromCastsByKey(val)
          }
        }
      }
    }
    let len = casts.length
    //tc(80)
    for ( var i = 0; i < len; i++ ) {
      cast = casts[i]
      //tc(82)
      if ( ! this.castMatchesCriteria(cast, criteria) ) {
        //tc(85)
        continue
      }
      //tc(83)
      res.push(cast);
      //tc(84)
    }
    //tc(81)
    return res
  }


  retrieveFromCastsByKey(aVal) {
    let clique = this.cliques[aVal]; if ( ! clique ) return []
    return clique.casts
  }

  castMatchesCriteria(aCast, aCriteria) {
    //tc(70)
    for ( var prop in aCriteria ) {
      let val = aCriteria[prop]
      //tc(72)
      let res
      if ( prop === 'or' )
        res = this.castMatchesOrCondition(aCast, val)
      else
        res = this.castPropMatchesVal(aCast, prop, val)
      //tc(73)
      if ( ! res ) {
        return false
      }
    }
    //tc(71)
    return true
  }

  castMatchesOrCondition(aCast, aOrClauses) {
    for ( var i = 0; i < aOrClauses.length; i++ ) {
      let clause = aOrClauses[i]
      let res = this.castMatchesCriteria(aCast, clause) 
      if ( res )
        return true
    }
    return false
  }
  
  checkCriteria(aCriteria) {
    for ( var prop in aCriteria ) {
      if ( ! Object.prototype.hasOwnProperty.call(aCriteria, prop) ) continue
      if ( ! this.nameToField(prop) ) console.log("***WARNING: Invalid criteria property: " + prop)
    }
  }

  castPropMatchesVal(aCast, aProp, aVal) {
    let val = aVal
    let valIsArray = global.isArray(val)
    let compare = "=="
    let useId = false
    if ( global.isObj(val) && (! valIsArray) ) {
      if ( Cast.isCast(val) ) {
        val = val.reference()
      }
      compare = val.compare
      if ( val.id ) {
        val = val.id
        useId = true
      } else if ( val.keyval )
        val = val.keyval
      else
        val = val.value
      if ( ! compare ) compare = "=="
    }
    let castVal = aCast[aProp]
    if ( global.isObj(castVal) ) {
      let keepCastVal = castVal
      castVal = null
      if ( useId )
        castVal = aCast[aProp].id
      if ( ! castVal )
        castVal = keepCastVal.keyval
      if ( ! castVal )
        castVal = aCast[aProp].id
    }
    let res = false
/* eslint-disable eqeqeq */
    if ( compare === "==" ) {
      if ( valIsArray ) 
        res = (val.indexOf(castVal) >= 0)
      else
        res = castVal == val
    } else if ( compare === "!=" )
      res = castVal != val
    else if ( compare === ">" )
      res = castVal > val
    else if ( compare === ">=" )
      res = castVal >= val
    else if ( compare === "<" )
      res = castVal < val
    else if ( compare === "<=" )
      res = castVal <= val
    else if ( compare === "NOT IN" )
      res = (val.indexOf(castVal) < 0)
/* eslint-enable eqeqeq */
    return res
  }

  quickIdToCast(aId) {
    return this.castsById[aId + ""]
  }

  retrieveFromCastsById(aOptions) {
    //if ( gLogTimings ) tc(50)
    let res = []
    let c = this.castsById[aOptions.id + ""]
    if ( c )
      res.push(c)
    //if ( gLogTimings ) tc(51)
    return res
  }

  retrieveFromCastsByParentId(aOptions) {
    let res = []
    let family = this.familiesById[aOptions.parentId]; 
    if ( ! family ) return res
    res = family.casts.slice(0) // copy
    return res
  }

  refreshOldCopiesOfCasts(aCasts) { // Mold
    let casts = aCasts || this.casts
    casts.forEach(cast => {
      cast.__old = cast.copyNaked()
    })
  }

  criteriaToCallParms(aCriteria) {
    if ( ! aCriteria ) return ''
    for ( var prop in aCriteria ) {
      if ( ! Object.prototype.hasOwnProperty.call(aCriteria, prop) ) continue
      if ( prop === "parentId" ) continue
      if ( prop === "id" ) continue
      let val = aCriteria[prop]
      if ( ! global.isObj(val) )
        return "&propName=" + prop + "&propVal=" + val
      let res = "&propName=" + prop + "&propVal=" + JSON.stringify(val)
      return res
    }
    return ''
  }

  refreshCastFromServerJson(aCast, aJson) {
    let nakedCasts = aJson.data; if ( ! nakedCasts ) return
    if ( nakedCasts.length === 0 ) return
    let nakedCast = nakedCasts[0]
    for ( var prop in nakedCast ) {
      if ( ! Object.prototype.hasOwnProperty.call(nakedCast, prop) ) continue
      aCast[prop] = nakedCast[prop]
    }
  }

  createChangesPayload() {
    let res = 
      {
        methodWithParms: "stocktend_object",
        json: this.getJsonForChanges()
      }
    return res
  }

  getJsonForChanges() {
    let res = []
    this.changedCasts.forEach(cast => {
      let nakedCast = cast.copyNaked()
      res.push(nakedCast)
    })
    return res
  }

  createTrashPayload(aCast) {
    let cast = aCast
    if ( ! Foreman.idIsPermanent(cast.id) ) return null
    let res = 
      {
        methodWithParms: "stocktend_object/" + cast.id,
        json: {}
      }
    return res
  }

  processPrelude(prelude) {
    gForeman._prelude = prelude
    let molds = gForeman.molds
    for ( var i = 0; i < molds.length; i++ ) {
      let mold = molds[i]
      let rowCount = prelude[mold.name]
      if ( ! rowCount )
        rowCount = 0
      mold.__preludeRowCount = rowCount
    }
    gForeman._preludesProcessed = true
  }

  nakedCastsToBayCasts(aNakedCasts) {
    let res = []
    let nowMs = global.nowMs()
    let lastCast = aNakedCasts.last()
    if ( lastCast && lastCast.__is_prelude ) {
      this.processPrelude(lastCast)
      aNakedCasts.pop()
    }
    if ( lastCast && lastCast.antiques ) {
      gForeman.markMoldsAsStale(lastCast.antiques, this)
      aNakedCasts.pop()
    }
    aNakedCasts.forEach(naked => {
      let cast = this.makeCast({forCopy: true, forBay: true})
      cast.copyFromNaked(naked)
      cast.__retrievedMs = nowMs
      res.push(cast)
    })
    return res
  }

  setBayValuesToCorrectTypes() { /* Mold */
    this.bayCasts.forEach(cast => {
      if ( this.realms )
        this.reassignRealmValues(cast)
      this.setCastValuesToCorrectTypes(cast, {ignoreDecimals: true}) // ignore decimals because for locking, server compares stored string value
    })
  }

  reassignRealmValues(cast) {
    let fields = this.fields
    for ( var i = 0; i < fields.length; i++ ) {
      let field = fields[i]
      let realmName = field.realm
      if ( realmName ) {
        let realm = this.realms[field.name]
        if ( realm ) {
          let wcFieldName = realm.wcFieldName
          if ( wcFieldName ) {
            cast[field.name] = cast[wcFieldName]
          }
        }
      }
    }
  }

  setCastValuesToCorrectTypes(aCast, options) {
    let fields = this.fields
    for ( var i = 0; i < fields.length; i++ ) {
      let field = fields[i]
      aCast.setFieldValueToCorrectType(field, options)
    }
    if ( aCast.id )
      aCast.id = Number(aCast.id)
    if ( aCast.parentId )
      aCast.parentId = Number(aCast.parentId)
  }

  sort() {
    this.version++
    let key = this.key
    if ( ! key )
      key = "id"
    this.casts.sort(
      (aCastA, aCastB) => {
        let a = aCastA[key]; if ( (key === "id") && global.isNumeric(a) && (a < 0) ) a = (-a) + 100000000
        let b = aCastB[key]; if ( (key === "id") && global.isNumeric(b) && (b < 0) ) b = (-b) + 100000000
        if ( a > b ) return 1
        if ( a < b ) return -1 
        return 0
      }
    )
  }

  datatype() {
    return this.name.replace(/\s/g, '')
  }

  castIsNew(aCast) {
    return Foreman.idIsPermanent(aCast.id)
  }

  castIsDuplicate(aCast) {
    if ( ! this.key ) return false
    if ( ! this.keyIsUnique() ) return false
    for ( var i = 0; i < this.casts.length; i++ ) {
      let c = this.casts[i]
      if ( c === aCast ) continue
      if ( c["id"] && (c["id"] === aCast["id"]) ) continue
      if ( c[this.key] !== aCast[this.key] ) continue
      return true
    }
    return false
  }

  acceptOrRejectFields(aCast) {
    let fields = this.fields
    for ( var i = 0; i < fields.length; i++ ) {
      let res = this.acceptOrRejectField(aCast, fields[i]); if ( res ) return res
    }
  }

  async acceptOrRejectFieldsOnSave(aCast) {
    let fields = this.fields
    for ( var i = 0; i < fields.length; i++ ) {
      let res = await this.acceptOrRejectFieldOnSave(aCast, fields[i]); if ( res ) return res
    }
  }

  async acceptOrRejectFieldOnSave(aCast, aField) { /* Mold */
    let res = await this.getReferenceRejection(aCast, aField)
    return res
  }

  async getReferenceRejection(aCast, aField) {
    let f = aField
    if ( f.allowAny ) return null
    let rt = f.refersTo 
    if ( ! rt ) return null
    if ( rt.refereeIsParent ) return null
    let val = aCast[aField.name]; if ( ! val ) return null
    if ( ! val.keyval ) return null
    let m = Foreman.nameToMold(rt.datatype); if ( ! m ) return null
    let crit = {[m.key]: val.keyval}
    let c = await rt.datatype.bringFirst(crit)
    if ( ! c ) {
      console.log(aCast)
      console.log(aField)
      return new Rejection("Invalid".translate() + " " + f.caption + ": " + val.keyval)
    }
    return null
  }

  acceptOrRejectField(aCast, aField) { /* Mold */

    let changed = () => {
      if ( aCast.isNew() ) return true
      if ( aCast.propChanged(aField.name, aField) ) return true
      return false
    }

    if ( aField.isAlwaysCalculated() ) return null
    let val = aCast[aField.name]
    if ( aField.numeric && (! global.isNumeric(val)) && changed() && val )
      return new Rejection(aField.caption + " " + "must be a number".translate(), aField)
    if ( aField.date && (val !== global.emptyYMD()) && (! global.isYMD(val)) && changed() ) {
      return new Rejection(aField.caption + " " + "must be a date".translate(), aField)
    }
    if ( aField.date && (val === global.emptyYMD()) && (! aField.allowEmpty) && changed() ) {
      return new Rejection("Please enter".translate() + " " + aField.caption, aField)
    }
    if ( aField.date && (val === global.invalidYMD()) && changed() ) {
      return new Rejection(aField.caption + " " + "must be a valid date".translate(), aField)
    }
    if ( aField.required && (! val) && changed() )
      return new Rejection(aField.caption + " " + "is required".translate(), aField)
    if ( (aField.allowEmpty === false) && (! val) && changed() )
      return new Rejection(aField.caption + " " + "is required".translate(), aField)
    return null
  }

  async acceptOrRejectCastOnSave(aCast) {
    await aCast.doFallbacks()
    let res = this.acceptOrRejectCast(aCast); if ( res ) return res
    res = await this.acceptOrRejectFieldsOnSave(aCast)
    return res
  }

  acceptOrRejectCast(aCast) { /* Mold */
    let res = this.acceptOrRejectFields(aCast); if ( res ) return res
    if ( ! this.key )
      return null
    if ( ! this.keyPopulatedLate() ) {
      let keyval = aCast[this.key]
      if ( (! keyval) || (keyval === '') ) 
        return new Rejection("You must enter a".translate() + " " + this.keyCaption(), {name: this.key})
    }
    if ( aCast.isNew() && this.castIsDuplicate(aCast) )
      return new Rejection("This".translate() + " " + this.caption.translate() + " " + "already exists".translate(), {name: this.key})
    return null
  }

  keyPopulatedLate() {
    let f = this.keyField(); if ( ! f ) return false
    return f.populatedLate
  }

  keyCaption() {
    let f = this.keyField(); if ( ! f ) return ''
    return f.caption
  }

  keyField() {
    return this.nameToField(this.key)
  }

  nameToField(aName) {
    return this.fieldsObj[aName]
  }
}


class Cast {

  constructor(aMold) {
    this._datatype = aMold.name
    this.__mold = aMold
    this.initValues()
  }

  fieldToImageUrl(field) {
    let cast = this
    let res
    let id = cast.id
    let dt
    if ( field.postIdField ) {
      let ref = cast[field.postIdField]
      if ( ref ) {
        id = ref.id
        dt = ref.datatype
      }
    }
    let product 
    if ( (! dt) || (dt === 'products') ) {
      try {
        product = 'products'.bringSingleFast({id: id})
        if ( global.fastFail(product) )
          product = null
      } catch(e) {
        product = null
      }
    }
    if ( product && (! global.runningOutsideWP()) ) 
      res = product['image_url_' + field.postImageType]
    else
      res = gServer.getCallString({methodWithParms: 'stocktend_object?datatype=none&source=postImage&id=' + 
        id + '&imageType=' + field.postImageType})
    if ( ! res )
      res = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" // blank
    return res
  }

  needsRecalc() {
    if ( this.__refreshingCalculations ) return
    this.__calculationsRefreshed = false
  }

  doAfterAnyUserChange(aMaintOrList) {
    let mfn = this.toMold().afterAnyUserChange
    if ( mfn ) {
      mfn(this, aMaintOrList)
    }
  }
  
  toMold() {
    return this.__mold
  }

  setOldAndNew(prop, val) {
    let old = this.getOld()
    if ( old && (old[prop] === this[prop]) )
      old[prop] = val
    this[prop] = val
  }

  toAttachmentsPathOnServer() {
    let res = global.confVal('attachmentsPathOnServer')
    if ( (global.confVal('useAttachmentSubfolders') === 'Yes') && this.toAttachmentsSubfolderOnServer ) {
      let subfolder = this.toAttachmentsSubfolderOnServer()
      if ( subfolder )
        res = res + '/' + subfolder
    }
    return res
  }

  async reretrieve() {
    if ( ! this.id ) return
    await this._datatype.bringSingle({id: this.id})
  }

  refreshFieldIndexes() {
    this.__mold.refreshFieldIndexes(this)
  }

  onlyHoldsSubset(subsetName) {
    return this.__mold.onlyHoldsSubset(subsetName)
  }

  fieldValuePendingSave(aFieldName) {
    return this.propChanged(aFieldName)
  }

  getOld() {
    return this.__old
  }

  toggle(fieldName) {
    if ( this[fieldName] === 'Yes' )
      this[fieldName] = 'No'
    else
      this[fieldName] = 'Yes'
  }

  async doFallbacks() {
    let c = this
    let fields = c.fields()
    for ( var i = 0; i < fields.length; i++ ) {
      let f = fields[i]
      let v = f.fallback
      if ( ! v ) continue
      if ( c[f.name] ) continue
      if ( v instanceof Function ) {
        let fres = v(c)
        if ( global.isPromise(fres) ) {
          let val = await fres
          c[f.name] = val
        } else
          c[f.name] = fres
      } else
        c[f.name] = v
    }
  }

  ultimateKeyval() {
    let key = this.mold().key; if ( ! key ) return null
    let keyval = this[key]
    while ( global.isObj(keyval) ) {
      keyval = keyval.keyval
    }
    return keyval
  }

  fieldNameToUltimateKeyval(aFieldName) {
    let keyval = this[aFieldName]
    while ( global.isObj(keyval) ) {
      keyval = keyval.keyval
    }
    return keyval
  }

  toDestinationSpecname() {
    return this.__mold.destinationSpecname
  } 

  mold() {
    return this.__mold
  }

  foremanIsSaving() {
    return gForeman.saving
  }

  addToKeyIndex() {
    this.__mold.addToKeyIndex(this)
  }

  assertInIndexes() {
    this.__mold.assertCastInIndexes(this)
  }

  static isCast(aObj) {
    if ( ! aObj ) return false
    return aObj._datatype ? true : false
  }

  static isReference(aObj) {
    if ( ! aObj ) return false
    return aObj.datatype && (aObj.keyname || aObj.id) ? true : false
  }

  static isCastOrReference(aObj) {
    return this.isCast(aObj) || this.isReference(aObj)
  }

  async retrieveLines() {
    let m = this.mold()
    let lineMold = m.toLineMold(); if ( ! lineMold ) return null
    //let res = await lineMold.name.bringChildrenOf(this, {forceServerRetrieve: true, includeDefers: true})
    let res = await lineMold.name.bringChildrenOf(this)
    return res
  }

  async refreshReferences() {
    await this.fields().forAllAsync(async f => {
      let rt = f.refersTo; if ( ! rt ) return "continue"
      let val = this[f.name]
      if ( val && global.isObj(val) && val.id && val.datatype ) {
        let dt = rt.datatype
        if ( ! dt.bringSingle )
          dt = val.datatype
        let refCast = await dt.bringSingle({id: val.id}); if ( ! refCast ) return "continue"
        let keyname = val.keyname
        if ( (keyname === "name") && (val.datatype === "products") )
          keyname = "uniqueName" // Handle legacy casts that predate product unique name changes
        val.keyval = refCast[keyname]
      }
    })
  }

  resolveParentId() {
    let m = this.__mold
    let field = m.getFieldThatRefersToParent(); if ( ! field ) return
    let ref = this[field.name]; if ( ! ref ) return
    if ( ! ref.id ) return
    let origParentId = this.parentId
    this.parentId = ref.id
    ref.kind = "parent"
    m.refreshParentIndex(this, origParentId)
  }

  datatype() { /* Cast */
    return this._datatype
  }

  datatypeCaption() {
    let res = this._datatype
    let mold = Foreman.nameToMold(res)
    if ( mold && mold.caption )
      res = mold.caption
    return res
  }

  fields() {
    return this.__mold.fields
  }

  keyValue() {
    let k = this.__mold.key
    if ( k )
      return this[k]
    return this.name
  }

  essenceValue() {
    let e = this.__mold.essence
    if ( e )
      return this[e]
    return this.keyValue()
  }

  isChild() {
    return Cast.nakedCastIsChild(this)
  }

  static nakedCastIsChild(aNakedCast) {
    let pid = aNakedCast.parentId
    if ( pid < 0 ) return true
    if ( pid > 0 ) return true
    return false
  }

  static async castsToPayloadCasts(aCasts) {

    let includeOldValues = (nakedCast, cast) => {
      let castOld = cast.__old; if ( ! castOld ) return
      let old = {}
      for ( var prop in nakedCast ) {
        if ( ! castOld.hasOwnProperty(prop) ) continue
        let v = castOld[prop]
        if ( global.isObj(v) ) continue // refs not supported as yet for pessimistic locking
        if ( ! cast.__mold.isConflictSensitiveProp(prop) ) continue
        old[prop] = v
      }
      nakedCast.__old = old
    }

    let res = []
    let configuration = await 'Configuration'.bringOrCreate()

    forAll(aCasts).do(cast => {
      let nakedCast
      if ( gApp.onlySaveChangedFields && (! cast.__saveAllFields) )
        nakedCast = cast.copyChangedFieldsNaked()
      else
        nakedCast = cast.copyNaked()
      if ( gApp.pessimisticLocking && (! cast.isNew()) )
        includeOldValues(nakedCast, cast)
      nakedCast.__cruxFieldNames = cast.__mold.cruxFieldNames
      if ( cast.__mold.fileFieldName ) {
        nakedCast.__fileFieldName = cast.__mold.fileFieldName
        nakedCast.__fileName = cast.__fileName
        if ( configuration.storeAttachmentsInSecureLocation === 'Yes' )
          nakedCast.__attachmentsPathOnServer = cast.toAttachmentsPathOnServer()
      }
      res.push(nakedCast)
    })
    return res
  }


  initValues() {
    this.__mold.fields.forEach(field => {
      if ( field.refersTo ) return 'continue'
      if ( field.numeric ) 
        this[field.name] = 0
      else if ( field.date ) 
        this[field.name] = ''
      else if ( field.yesOrNo ) 
        this[field.name] = 'No'
      else
        this[field.name] = ''
    })
  }
  
  nameToField(aName) {
    let res =  this.__mold.fields.filterSingle(field => field.name === aName)
    return res
  }

  safeValue(aVal) {
    if ( (! aVal) && (aVal !== 0) ) return ''
    return aVal
  }

  fieldNameToExtractValue(aName) {
    let f = this.nameToField(aName); if ( ! f ) return ''
    let res = this.fieldNameToValue(f.name)
    if ( f.date )  {
      if ( res === global.emptyYMD() ) 
        return ''
      res = res.toLocal()
    }
    if ( f.numeric && (res === global.unknownNumber()) )
      return "Unknown".translate()
    if ( f.decimals || (f.decimals === 0) )
      res = global.numToStringWithXDecimals(res, f.decimals, {forceDot: true})
    if ( f.minDecimals || (f.minDecimals === 0) )
      res = global.numToStringWithMinXDecimals(res, f.minDecimals, f.maxDecimals, {forceDot: true})
    if ( f.translateOnDisplay )
      res = (res + '').translate()
    if ( f.secret )
      res = ''
    if ( f.numeric )
      res = parseFloat((res + ''), 10)
    return res
  }

  fieldNameToValue(aName) { /* Cast */
    //let f = this.nameToField(aName); if ( ! f ) return '' -- Could be a joined field
    let parentVal
    let val = this[aName]
    while ( global.isObj(val) ) {
      parentVal = val
      val = val.keyval
    }
    if ( parentVal && parentVal.id && parentVal.datatype ) {
      let m = Foreman.nameToMold(parentVal.datatype)
      if ( m ) {
        let refCast = m.quickIdToCast(parentVal.id)
        if ( refCast ) {
          let keyname = parentVal.keyname
          if ( (keyname === "name") && (parentVal.datatype === "products") )
            keyname = "uniqueName" // Handle legacy casts that predate product unique name changes
          val = refCast[keyname]
        }
      }
    }
    return this.safeValue(val)
  }

  fieldNameToDisplayValue(aName) { /* Cast */
    let f = this.nameToField(aName); if ( ! f ) return ''
    let res = this.fieldNameToValue(aName)
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
    if ( f.translateOnDisplay )
      res = (res + '').translate()
    if ( f.secret )
      res = ''
    return res + ''
  }

  refreshDefaultCopy() {
    this.__defaultCopy = this.copyNaked()
  }

  makePreFalloutCopy() {
    //let m = this.__mold
    //if ( m.transient || m.staticData || m.readOnly ) return
    if ( this.__preFallout ) return
    this.__preFallout = this.copyNaked()
    this.__mold._hasFallout = true
  }

  clearPreFallout() {
    this.__preFallout = null
  }

  rollbackFallout() {
    if ( ! this.__preFallout ) return
    if ( this.__preFallout === "nonexistent" ) {
      this.remove({ignoreChildren: true})
      return
    }
    if ( ! this.changedFromCopy(this.__preFallout) ) {
      this.__preFallout = null
      return
    }
    this.copyFromNaked(this.__preFallout)
    this.refreshIndexes()
    this.__preFallout = null
    this.__potentiallyChanged = true
  }

  refreshOld() {
    this.__old = this.copyNaked()
  }

  async refreshCalculations(aOptions) { /* Cast */
    if ( aOptions && (aOptions.force) ) {
      this.__calculationsRefreshed = false
    }
    await this.__mold.refreshCastCalculations(this, aOptions)
  }

  propIsSystemProp(aProp) {
    if ( ! aProp ) return true
    if ( (aProp[1] === '_') && (aProp[0] === '_') ) // i.e. starts with "__" - done this way for performance
      return true
    if ( global.isFunction(this[aProp]) ) return true
    return false
  }

  changedFromCopy(aCopy) {
    for ( var prop in this ) {
      if ( ! Object.prototype.hasOwnProperty.call(this, prop) ) continue
      if ( this.propIsSystemProp(prop) ) continue
      let f = this.__mold.nameToField(prop); if ( ! f ) continue
      if ( f.isAlwaysCalculated() && (! f.storedCalc) ) continue
      if ( f.ephemeral ) continue
      if ( this.propChangedFromCopy(prop, aCopy, f) ) {
        return true
      }
    }
    return false
  }

  needsSaving() {
    let m = this.__mold
    if ( m.transient || m.staticData || m.readOnly ) 
      return false
    if ( this._markedForDeletion ) {
      return true
    }
    if ( this.isNew() ) {
      return this.changedFromDefault()
    } else {
      return this.changed()
    }
  }

  makeDirty(options) {
    this.__dirty = true
    this.__potentiallyChanged = true
    this.__saveAllFields = options && options.allFields
    let p = this.parentFast({noError: true})
    if ( p && global.isObj(p) && p.makeDirty )
      p.makeDirty(options)
  }

  changed() {
    if ( this.__dirty )
      return true
    if ( this._markedForDeletion ) {
      return true
    }
    return this.changedFromCopy(this.__old)
  }

  changedFromDefault() {
    if ( this._markedForDeletion ) return true
    return this.changedFromCopy(this.__defaultCopy)
  }

  revertToOld() {
    if ( ! this.changed() )
      return
    let old = this.__old
    this.copyFromNaked(old)
    this.__calculationsRefreshed = false
    this.__aggregandsStale = true
    this.__afterRetrieveDone = false
    this.__potentiallyChanged = false
    this.__dirty = false
    this.__saveAllFields = false
    this._markedForDeletion = false
    this.refreshIndexes()
  }

  refreshIndexes() {
    this.refreshIdIndex()
    this.refreshParentIndex()
    this.refreshKeyIndex()
    this.refreshFieldIndexes()
  }
 
  refreshIdIndex() {
    if ( this.id !== this.__indexedId )
      this.__mold.refreshIdIndex(this)
  }

  refreshParentIndex() {
    if ( this.parentId !== this.__indexedParentId )
      this.__mold.refreshParentIndex(this)
  }

  refreshKeyIndex() {
    let key = this.__mold.key
    if ( key && (this[key] !== this.__indexedKeyval) )
      this.__mold.refreshKeyIndex(this)
  }

  async checkTrashAllowed() {
    let f = this.__mold.allowTrash; if ( ! f ) return
    f = f.bind(this)
    let msg = await f(); if ( ! msg ) return
    throw(new Error(msg.translate()))
  }

  async trash(aOptions) {
    let force = aOptions && aOptions.force
    if ( ! force )
      await this.checkTrashAllowed()
    this.__mold.version++
    this._markedForDeletion = true
    await this.trashChildren()
    this.zeroNumericFields()
    if ( this.id < 0 ) {
      this.remove()
      await this.doAfterTrash()
      return
    }
    this.__potentiallyChanged = true
    await this.doAfterTrash()
  }

  async doAfterTrash() {
    let f = this.mold().afterTrash; if ( ! f ) return
    f = f.bind(this)
    await f()
  }

  async trashChildren() {
    let molds = this.__mold.childMolds()
    await molds.forAllAsync( async m => {
      await m.trashChildrenOf(this)
    })
  }

  async removeChildren() {
    let molds = this.__mold.childMolds()
    for ( var i = 0; i < molds.length; i++ ) {
      let m = molds[i]
      m.removeChildrenOf(this)
    }
  }

  remove(options) {
    this.__mold.removeCast(this, options)
  }

  isNew() {
    return (! this.id) || this.id < 0
  }

  copy() { /* Cast */
    let res = this.__mold.makeCast({forCopy: true})
    for ( var prop in this ) {
      if ( this.propIsSystemProp(prop) ) continue
      if ( ! Object.prototype.hasOwnProperty.call(this, prop) ) continue
      this.copyProp(prop, this, res)
    }
    return res
  }

  copyNaked() {
    let res = {}
    for ( var prop in this ) {
      if ( this.propIsSystemProp(prop) ) continue
      if ( ! Object.prototype.hasOwnProperty.call(this, prop) ) continue
      if ( global.isFunction(this[prop]) ) continue
      this.copyProp(prop, this, res)
    }
    return res
  }

  propNeededForSave(prop) {
    if ( prop === 'id' )
      return true
    if ( prop === '_datatype' )
      return true
    if ( prop === '_realms' )
      return true
    if ( prop === 'post_parent' )
      return true
    if ( prop === 'parentId' )
      return true
    if ( prop === 'theOrder' )
      return true
    let m = this.__mold
    if ( prop === m.key )
      return true
    if ( prop === m.essence )
      return true
    if ( m.cruxFieldNamesObj && m.cruxFieldNamesObj[prop] )
      return true
    return false
  }

  copyChangedFieldsNaked() {
    let res = {}
    for ( var prop in this ) {
      if ( this.propIsSystemProp(prop) ) continue
      if ( ! Object.prototype.hasOwnProperty.call(this, prop) ) continue
      if ( global.isFunction(this[prop]) ) continue
      if ( (! this.isNew()) && (! this.propChanged(prop)) ) {
        if ( ! this.propNeededForSave(prop) )
          continue
      }
      this.copyProp(prop, this, res)
    }
    return res
  }

  copyProp(aProp, aFrom, aTo) {
    let v = aFrom[aProp]
    if ( global.isObj(v) ) {
      aTo[aProp] = global.copyObj(v)
    } else
      aTo[aProp] = v
  }

  copyProp2(aProp, aToProp, aFrom, aTo) {
    let v = aFrom[aProp]
    if ( global.isObj(v) ) {
      aTo[aToProp] = global.copyObj(v)
    } else
      aTo[aToProp] = v
  }

  copyFromNaked(aNaked) {
    for ( var prop in aNaked ) {
      if ( ! Object.prototype.hasOwnProperty.call(aNaked, prop) ) continue
      if ( prop.startsWith('__index') ) continue
      this.copyProp(prop, aNaked, this)
    }
  }

  copyFromJoin(aFrom) {
    aFrom.__mold.fields.forAll(f => {
      let name = f.name
      let toName = name
      if ( this.__mold.fieldExists(f) ) 
        toName = aFrom.__mold.name + "_" + name
      this.copyProp2(name, toName, aFrom, this)
    })
  }

  setValuesToCorrectTypes(options) {
    this.__mold.setCastValuesToCorrectTypes(this, options)
  }

  copyUnchangedFieldsFrom(aFrom) {
    for ( var prop in this ) {
      if ( this.propIsSystemProp(prop) ) continue
      if ( ! Object.prototype.hasOwnProperty.call(aFrom, prop) ) continue
      if ( this.propChanged(prop) ) continue
      this.copyProp(prop, aFrom, this)
      this.copyProp(prop, aFrom, this.__old)
    }
  }

  propChanged(aProp, field) {
    if ( ! field )
      field = this.nameToField(aProp)
    let res = this.propChangedFromCopy(aProp, this.__old, field)
    return res
  }

  propChangedFromCopy(aProp, aCopy, field) { /* Cast */
    if ( ! field )
      field = this.nameToField(aProp)
    let prop = aProp
    let p = this[prop]
    let oldP = aCopy ? aCopy[prop] : ''
    let decimals = field && (field.maxDecimals || field.decimals)
    if ( decimals || (decimals === 0) ) {
      p = global.roundToXDecimals(p, decimals)
      oldP = global.roundToXDecimals(oldP, decimals)
    }
    if ( ! global.isObj(p) ) {
      if ( (! p) && (! oldP) )
        return false
      if ( (! p) && (oldP === '1971-01-01') )
        return false
      if ( (! oldP) && (p === '1971-01-01') )
        return false
      if ( p !== oldP ) {
        return true
      }
    } else {
      if ( ! global.isObj(oldP) ) {
        return true
      }
      let res
      if ( p.id )
        res = ( p.id !== oldP.id )
      else 
        res = ( p.keyval !== oldP.keyval )
      return res
    }
  }

  setFieldValueByName(aName, aValue, aOptions) { // Cast
    let f = this.nameToField(aName); if ( ! f ) return
    f.setCastPropValue(this, aValue, aOptions)
  }

  async ultimateParent() {
    let res = await this.parent({noError: true})
    if ( ! res ) return null
    let parent = res
    while ( parent ) {
      parent = await parent.parent({noError: true})
      if ( parent )
        res = parent
    }
    return res
  }

  async parent(options) { /* Cast */
    let pp = this.getParentDatatypeAndId(options); if ( ! pp ) return null
    let res
    res = pp.datatype.bringSingleFast({id: pp.id})
    if ( global.fastFail(res) )
      res = await pp.datatype.bringSingle({id: pp.id})
    return res
  }

  parentFast(options) { /* Cast */
    let pp = this.getParentDatatypeAndId(options); if ( ! pp ) return null
    let res = pp.datatype.bringSingleFast({id: pp.id})
    return res
  }

  getParentDatatypeAndId(options) {
    let noError = options && options.noError
    let m = this.__mold
    let field = m.getFieldThatRefersToParent(); 
    if ( ! field ) {
      if ( ! noError )
        throw(new Error("parent called but there is no field referring to a parent"))
      return null
    }
    let valObj = this[field.name] 
    if ( ! valObj ) {
      return null
    }
    let id = valObj.id 
    if ( ! id ) {
      id = this.parentId
    }
    if ( ! id ) {
      return null
    }
    let dt = valObj.datatype
    let ssn = m.getSingleSubsetName()
    if ( ssn )
      dt += '.' + ssn
    return {datatype: dt, id: id}
  }

  async grab(propPath) {
    let pos = propPath.indexOf('.')
    if ( pos < 0 )
      return this[propPath]
    let ref = global.left(propPath, pos)
    let cast = await this.referee(ref); if ( ! cast ) return null
    let prop = propPath.substr(pos+1, 99)
    return cast[prop]
  }

  async referee(aFieldName, options) {
    let valObj = this[aFieldName]; if ( ! valObj ) return null
    let id = valObj.id
    let dt = valObj.datatype
    let res
    let mold = Foreman.nameToMold(dt) 
    if ( ! mold ) 
      throw(new Error('referee: Invalid datatype: ' + dt))
    if ( id ) {
      res = mold.fastRetrieveSingle({id: id}, options) 
      if ( res === 'na' ) {
        res = await dt.bringSingle({id: id})
      }
    }
    if ( res )
      return res
    if ( ! valObj.keyval )
      return null
    res = mold.fastRetrieveSingle({[mold.key]: valObj.keyval}, options) 
    if ( res === 'na' ) {
      res = await dt.bringSingle({[mold.key]: valObj.keyval})
    }
    if ( (! res) && mold.essence && options && options.useEssence ) {
      res = mold.fastRetrieveSingle({[mold.essence]: valObj.keyval}, options) 
      if ( res === 'na' ) {
        res = await dt.bringSingle({[mold.essence]: valObj.keyval})
      }
    }
    return res
  }

  refereeFast(aFieldName, options) {
    let valObj = this[aFieldName]; if ( ! valObj ) return null
    let id = valObj.id
    let dt = valObj.datatype
    let res
    let mold = global.foreman.doNameToMold(dt)
    if ( id ) {
      res = mold.fastRetrieveSingle({id: id}, options) 
      if ( res === 'na' ) 
        res = null
    }
    if ( res )
      return res
    if ( ! valObj.keyval )
      return null
    res = mold.fastRetrieveSingle({[mold.key]: valObj.keyval}, options) 
    if ( res === 'na' ) return null
    return res
  }

  async save(aOptions) {
    aOptions.fromCast = true
    await Foreman.save(aOptions)
  }

  reference() {
    let m = this.__mold
    let res = {id: this.id, datatype: m.datatype()}
    if ( m.key ) {
      res.keyname = m.key
      res.keyval = this[m.key]
    }
    return res
  }

  refereeId(aFieldName) {
    let val = this[aFieldName]
    return val.id
  }

  setFieldValueToCorrectType(aField, options) {
    let v = this[aField.name]
    if ( aField.refersTo ) {
      if ( ! v )
        this[Field.name] = null
    } else if ( aField.numeric ) {
      if ( ! v )
        this[aField.name] = 0
      else
        this[aField.name] = Number(v)
      let ignoreDecimals = options && options.ignoreDecimals
      if ( aField.decimals || (aField.decimals === 0) ) {
        if ( ! ignoreDecimals )
          this[aField.name] = global.roundToXDecimals(this[aField.name], aField.decimals)
      }
      else if ( aField.maxDecimals || (aField.maxDecimals === 0) ) {
        if ( ! ignoreDecimals )
          this[aField.name] = global.roundToXDecimals(this[aField.name], aField.maxDecimals)
      }
    } else if ( aField.date ) {
      if ( v && (v.length > 10) )
        this[aField.name] = v.substr(0, 10)
      if ( ! v )
        this[aField.name] = global.emptyYMD()
    }
  }

  zeroNumericFields() {
    this.__mold.fields.forAll(f => {
      if ( f.numeric && (! f.preserveOnTrash) ) {
        this[f.name] = 0
      }
    })
  }

}


export class Server {
  
  static post = async (aPayload, aOptions) => {
    return await gServer.doPost(aPayload, aOptions)
  }

  static get = async (aMethodWithParms, aOptions) => {
    return await gServer.doGet(aMethodWithParms, aOptions)
  }

  static datatypeToData = async (aDatatype, aOptions) => {
    return await gServer.doDatatypeToData(aDatatype, aOptions)
  }

  static isWaiting = () => {
    return gServer.doIsWaiting()
  }

  constructor() {
    this.waitingCount = 0
  }

  async emailAttachment(options) {
    let attachment = options.attachment
    let payload = {
      methodWithParms: 'stocktend_object',
      msgToServer: 'email',
      json: {
        parms: {
          attachmentId: attachment.id,
          emailAddress: options.emailAddress,
          subject: options.subject,
          message: options.message
        }
      }
    }
    if ( global.confVal('useAttachmentSubfolders') === 'Yes' ) 
      payload.parms.subfolder = attachment.toAttachmentsSubfolderOnServer()
    let serverRes = await this.doPost(payload)
    if ( (! serverRes) || (serverRes.result !== 'sent') )
      throw(new Error('The server was unable to send the email - please check your server configuration.'.translate()))
  }

  getDownloadCall(cast, fieldName) {
    let methodWithParms = 'stocktend_object?datatype=none&source=download&castId=' + cast.id + '&field=' + fieldName
    if ( (global.confVal('useAttachmentSubfolders') === 'Yes') && cast.toAttachmentsSubfolderOnServer )
      methodWithParms = methodWithParms + '&subfolder=' + cast.toAttachmentsSubfolderOnServer()
    return this.getCallString({methodWithParms: methodWithParms})
  }

  generateDBErrorOnNextSave(aOptions) {
    this.intentionalDBError = aOptions
  }

  baseUrl = () => {
    if ( window.location.host === "tocsv.com:5000" )
      return "http://woocommerce.tocsv.com/wp-admin/admin.php"
    if ( window.location.host === "localhost:5999" )
      return "http://localhost/wp-admin/admin.php"
    if ( window.location.host === "127.0.0.1:5999" )
      return "http://127.0.0.1/wp-admin/admin.php"
    if ( window.location.host === "profitori.loc:5999" )
      return "http://profitori.loc:8888/wp-admin/admin.php"
    let loc = window.location
    //let res = loc.protocol + "//" + loc.host + "/" + loc.pathname.split('/')[1] + "/"
    let res = loc.protocol + '//' + loc.host.stripRight('/') + '/' + loc.pathname.stripLeft('/').stripRight('/')
    res = res.stripRight('/admin.php')
    res += '/'
    return res
  }

  sanctify(req) {
    return req.replace(/order/g, 'o_rde_r')
  }

  getCallString(aPayload, aOptions) {
    let url = this.baseUrl()
    let pref = "?page=profitori&foremanUUID=" + gForeman.uuid() + "&req_prfi=/stocktend/v1/"
    if ( aOptions && aOptions.wcNative )
      pref = "?page=profitori_wc&req_prfi=/wc/v3/"
    let req = url + pref
    if ( aPayload )
      req += aPayload.methodWithParms
    if ( aPayload && aPayload.msgToServer )
      req += "&msgToServer=" + aPayload.msgToServer
    if ( global.runningOutsideWP() ) {
      req = req + "&testClient=true"
    }
    if ( global.testNo ) {
      req += "&testNo=" + global.testNo
    }
    let seatId = global.getSeatId()
    req += '&seat_id=' + seatId
    req = this.sanctify(req)
    return req
  }

  doCall = async (aPayload, aRequestType, aOptions) => { // Server
    if ( gApp.serverCommsFailed )
      return;
    let spinnerRef = gShowSpinner()
    try {
      let self = this
      try {
        let req = this.getCallString(aPayload, aOptions)
        req += '&cDef=' + Math.random() // Cache defeater
        if ( global.runningOutsideWP() )
          aPayload.json.testClient = true
        let log = (gLogServerRetrieves === "true")
        if ( log ) 
          "doCall methodWithParms".m(aPayload.methodWithParms)
        let dberr = self.intentionalDBError
        if ( dberr && (aRequestType === "POST") ) {
          req = req + "&spannerDatatype=" + dberr.datatype + "&spannerIndex=" + dberr.index
          aPayload.json.spannerDatatype = dberr.datatype
          aPayload.json.spannerIndex = dberr.index
          self.intentionalDBError = null
        }
        let reqType = aRequestType ? aRequestType : "GET"
        let options = 
          {
            method: reqType,
            headers: {'Accept': 'application/json', 'Content-Type': 'application/json'},
          }
        if ( ! global.runningOutsideWP() )
          options.credentials = "include"
        if ( reqType === "POST" ) 
          options.body = JSON.stringify(aPayload.json)
        //tc(111)
        if ( log ) {
          "doCall req".m(req)
        }
        var resp = await fetch(req, options)
        if ( log ) {
          "doCall finished".m()
        }
        //tc(2000)
        let json
        try {
          json = await resp.json()
        } catch(e) {
          self.decrementWaitingCount()
          gApp.showMessage(('Unable to talk to server. ' +
            'This may be due to a security plugin such as WordFence, All In One WP Security, BBQ or others. ' +
            'Please check these, and your .htaccess file or other configuration, then refresh your browser and try again').translate())
          gApp.serverCommsFailed = true
          console.log(e.message)
          return null
        }
        //tc(2001)
        //let ms = 10
        //setTimeout(() => {self.decrementWaitingCount()}, ms)
        self.decrementWaitingCount()
        return json
      } catch(aException) {
        self.decrementWaitingCount()
        console.log("Server.doCall failed:")
        console.log(aException)
        console.log("Response was:")
        console.log(resp)
      }
    } finally {
      gHideSpinner(spinnerRef)
    }
  }

  decrementWaitingCount = () => {
    this.waitingCount--
    if ( this.waitingCount === 0 )
      setTimeout(() => gApp.forceUpdate(), 10)
  }

/*
  decrementWaitingCount = () => {
    this.waitingCount--
    if ( this.waitingCount === 0 )
      gApp.forceUpdate()
  }
*/

  doPost = async(aPayload, aOptions) => {
    this.waitingCount = this.waitingCount + 1
    return await this.doCall(aPayload, "POST", aOptions)
  }

  doGet = async(aMethodWithParms, aOptions) => {
    this.waitingCount = this.waitingCount + 1
    let p = {methodWithParms: aMethodWithParms, json: {}}
    let res = await this.doCall(p, "GET", aOptions)
    return res
  }

  doDatatypeToData = async (aDatatype, aOptions) => {
    this.waitingCount = this.waitingCount + 1
    let json = await this.doCall(aDatatype, aOptions)
    return json
  }

  doIsWaiting = () => {
    return this.waitingCount > 0
  }

}

let gServer = new Server()
global.gServer = gServer
global.server = gServer

class Rejection {

  constructor(aMsg, aField) {
    this.message = aMsg
    this.field = aField
  }

}

class Bringer {

  bringSingleFast(aDatatype, aCriteria, aOptions) {
    let retOpt = {}
    if ( aDatatype.indexOf('.') >= 0 ) {
      let parts = aDatatype.split('.')
      if ( parts.length > 1 ) {
        aDatatype = parts[0]
        retOpt.subsetName = parts[1]
      }
    }
    let m = Foreman.nameToMold(aDatatype); if ( ! m ) throw(new Error("Invalid datatype: " + aDatatype))
    if ( (! aOptions) || (aOptions.includeMarkedForDeletion !== false) )
      retOpt.includeMarkedForDeletion = true
    retOpt.includeDefers = true
    if ( aOptions && aOptions.useIndexedField )
      retOpt.useIndexedField = aOptions.useIndexedField
    if ( aOptions && aOptions.noCalc )
      retOpt.noCalc = aOptions.noCalc
    if ( aOptions && (aOptions.includeDefers === false) )
      retOpt.includeDefers = false
    if ( aCriteria && aCriteria.key ) {
      aCriteria[m.key] = aCriteria.key
      delete aCriteria["key"]
    }
    let singleFastRes = m.fastRetrieveSingle(aCriteria, retOpt)
    if ( singleFastRes === 'na' ) {
      singleFastRes = null
    }
    return singleFastRes
  }

  async bring(aDatatype, aCriteria, aOptions) {
    //tc(330)
    let retOpt = {}
    if ( aDatatype.indexOf('.') >= 0 ) {
      let parts = aDatatype.split('.')
      if ( parts.length > 1 ) {
        aDatatype = parts[0]
        retOpt.subsetName = parts[1]
      }
    }
    let m = Foreman.nameToMold(aDatatype); if ( ! m ) throw(new Error("Invalid datatype: " + aDatatype))
    if ( aOptions && aOptions.forceServerRetrieve )
      m.flush()
    if ( aOptions && aOptions.parent ) {
      if ( ! Cast.isCastOrReference(aOptions.parent) ) throw(new Error("Parent must be a cast or a reference"))
      aCriteria = {parentId: aOptions.parent.id}
    }
    retOpt.includeDefers = true
    retOpt.caching = aOptions && aOptions.caching
    if ( aOptions && aOptions.single && (aOptions.includeMarkedForDeletion !== false) ) {
      retOpt.includeMarkedForDeletion = true
    }
    if ( aOptions && aOptions.includeMarkedForDeletion ) 
      retOpt.includeMarkedForDeletion = true
    if ( aOptions && aOptions.useIndexedField )
      retOpt.useIndexedField = aOptions.useIndexedField
    if ( aOptions && aOptions.noCalc )
      retOpt.noCalc = aOptions.noCalc
    if ( aOptions && (aOptions.includeDefers === false) )
      retOpt.includeDefers = false
    if ( aCriteria && aCriteria.key ) {
      aCriteria[m.key] = aCriteria.key
      delete aCriteria["key"]
    }
    if ( aOptions && (aOptions.single || aOptions.first) ) {
      let singleFastRes = m.fastRetrieveSingle(aCriteria, retOpt)
      if ( singleFastRes && (singleFastRes !== "na") )
        return singleFastRes
    }
    let casts
    let forceFast = aOptions && aOptions.forceFast
    if ( m.canAlwaysDoFastRetrieve() || (forceFast && m.holdingAllCasts) ) {
      casts = m.fastRetrieve(aCriteria, retOpt)
      if ( forceFast && (casts === 'na') )
        return 'na'
    } else {
      casts = await m.retrieve(aCriteria, retOpt)
    }
    if ( ! aOptions ) {
      return casts
    }
    if ( aOptions.first ) {
      return casts.first()
    }
    if ( aOptions.last )
      return casts.last()
    if ( aOptions.single ) {
      let sopt = aOptions.singleOptions
      if ( (casts.length > 1) && ((! sopt) || (! sopt.noErrorOnMultiple)) ) {
        if ( ! global.runningInsideWordpress ) { // prevent exception in production
          //"bring: casts".m(casts)
          "bring: aDatatype".m(aDatatype)
          "bring: aCriteria".m(aCriteria)
          "bring: aOptions".m(aOptions)
          "bring: casts[0]".m(casts[0])
          "bring: casts[1]".m(casts[1])
          throw(new Error("bring: Multiple results were returned when a single result was expected"))
        }
      }
      let c = casts.first()
      if ( (! c) && aOptions.createIfNotFound ) {
        let res = await this.create(aDatatype, aCriteria)
        return res
      }
      return c
    }
    return casts
  }

  async create(aDatatype, aCriteria, aOptions) { /* Bringer */
    if ( gLogTimings ) tc(437)
    let m = Foreman.nameToMold(aDatatype); if ( ! m ) throw(new Error("Create: Invalid datatype: " + aDatatype))
    if ( gLogTimings ) tc(427)
    let c = m.addCast(aOptions)
    if ( gLogTimings ) tc(428)
    await this.setCastPropsBasedOnCriteria(c, aCriteria, aOptions)
    await m.doCastAfterCreate(c)
    await c.refreshReferences()
    await c.resolveParentId()
    await c.refreshCalculations({force: true, keepState: true, point: 45})
    c.refreshDefaultCopy()
    c.refreshFieldIndexes()
    if ( gLogTimings ) tc(429)
    return c
  }

  clear(aDatatype) {
    let m = Foreman.nameToMold(aDatatype); if ( ! m ) throw(new Error("Clear: Invalid datatype: " + aDatatype))
    if ( (! m.transient) && (! m.facade) ) throw(new Error("Clear is only for transient datatypes"))
    m.initCasts()
  }

  async setCastPropsBasedOnCriteria(aCast, aCriteria, aOptions) {
    if ( ! aCriteria ) return
    for ( var prop in aCriteria ) {
      if ( ! Object.prototype.hasOwnProperty.call(aCriteria, prop) ) continue
      let v = aCriteria[prop]
      if ( Cast.isCast(v) )
        v = v.reference()
      aCast.setFieldValueByName(prop, v, aOptions)
    }
    aCast.assertInIndexes()
  }

}

global.stBringerClass = Bringer


class Menu {

  constructor() {
    gMenu = this
    global.stMenu = this
    this.items = []
  }

  static add (aParms) {
    gMenu.doAdd(aParms)
  }

  doAdd(aParms) {
    if ( this.itemExists(aParms.specname) ) return
    let item = new Menuitem(aParms.specname, aParms.caption, aParms.suppressOnMoreMenu)
    let beforeItem
    if ( aParms.beforeSpec )
      beforeItem = this.specnameToItem(aParms.beforeSpec)
    if ( ! beforeItem ) {
      this.items.push(item)
      return
    }
    let idx = this.items.indexOf(beforeItem)
    this.items.splice(idx, 0, item)
  }

  itemExists(aSpecname) {
    return this.items.exists(item => item.specname === aSpecname)
  }

  setItemCaption(aSpecname, aCaption) {
    let item = this.specnameToItem(aSpecname); if ( ! item ) return
    item.caption = aCaption
    item.englishCaption = aCaption
  }

  specnameToItem(aSpecname) {
    return this.items.filterSingle(item => item.specname === aSpecname)
  }

  specnameToCaption(aSpecname) {
    let item = this.specnameToItem(aSpecname); if ( ! item ) return null
    return item.caption
  }

  captionToItem(aCaption) {
    let res =  this.items.filterSingle(item => item.caption === aCaption)
    if ( ! res ) 
      res =  this.items.filterSingle(item => { return item.caption.translate() === aCaption })
    if ( ! res ) {
      let caption = aCaption.translate()
      res =  this.items.filterSingle(item => item.caption === caption)
    }
    return res
  }

  captionToSpecname(aCaption) {
    let item = this.captionToItem(aCaption); if ( ! item ) return null
    return item.specname
  }

  addItemsToDropdown(aDropdownItems) {

    let pushItem = item => {
      if ( item.suppressOnMoreMenu )
        return
      if ( gApp.shouldHideSpec(item.specname) )
        return
      let id = "stDDMenu" + item.caption.toId()
      let key = id
      let caption = item.caption.translate()
      aDropdownItems.push(
        <DropdownItem 
          id={id}
          key={key} 
          onClick={gApp.specnameToFunction(item.specname)} 
          className="stMoreDropdownItem">
          {caption}
        </DropdownItem>
      )
    }

    if ( aDropdownItems.length > 0 ) {
      aDropdownItems.push(
        <DropdownItem key="stDDMenuDivider" divider></DropdownItem>
      )
    }
    for ( var i = 0; i < this.items.length; i++ ) {
      let item = this.items[i]
      if ( item.caption === 'Settings' ) continue
      pushItem(item)
    }
    for ( i = 0; i < this.items.length; i++ ) {
      let item = this.items[i]
      if ( item.caption !== 'Settings' ) continue
      pushItem(item)
    }

  }

}

global.stMenuClass = Menu

class Menuitem {
  
  constructor(aSpecname, aCaption, aSuppressOnMoreMenu) {
    this.specname = aSpecname
    this.caption = aCaption //.translate()
    this.englishCaption = aCaption
    this.suppressOnMoreMenu = aSuppressOnMoreMenu
  }

}

class Helper {

  emulateDaysInFuture(aDays) {
    global.prfiEmulateDaysInFuture = aDays
  }

  addToExportedJsonData(aParms) {
    let data = global.exportedJsonData; if ( ! data ) throw(new Error("There is no exported Json data"))
    let obj = aParms
    data.push(obj)
  }

  alterExportedJsonData(aParms) {
    let data = global.exportedJsonData; if ( ! data ) throw(new Error("There is no exported Json data"))
    let obj = data[aParms.row - 2] // This method uses spreadsheet row numbers - starts at 1, and there's 1 for the heading
    obj[aParms.fieldName] = aParms.value
  }

  async checkNoNegativeIds() {
    await gForeman.molds.forAllAsync(async m => {
      if ( m.transient || m.staticData || m.readOnly || m.facade ) return "continue"
      for ( var i = 0; i < m.casts.length; i++ ) {
        let cast = m.casts[i]
        if ( cast.id < 0 ) throw(new Error(m.name + " cast has negative id: " + cast.id))
        for ( var j = 0; j < m.fields.length; j++ ) {
          let f = m.fields[j]
          if ( ! f.refersTo ) continue
          let ref = cast[f.name]
          if ( ref && ref.id && (ref.id < 0) ) 
            throw(new Error(m.name + " cast property " + f.name + " has negative id: " + ref.id))
        }
      }
    })
  }

  async checkNoDuplicateKeys() {
    await gForeman.checkNoDuplicateKeys()
  }

  emulateVersion(aVersion) {
    global.stEmulatingVersion = aVersion
  }

  async nameToProduct(aMold, aName) {
    let products = await aMold.retrieve()
    for ( var i = 0; i < products.length; i++ ) {
      let p = products[i]
      if ( p.uniqueName.startsWith(aName) )
        return p
    }
  }

  async nameToSupplier(aMold, aName) {
    let casts = await aMold.retrieve()
    for ( var i = 0; i < casts.length; i++ ) {
      let c = casts[i]
      if ( c.name === aName )
        return c
    }
  }

  async deoptimizeDatabase() {
    let p = 
      {
        methodWithParms: "stocktend_object",
        json: [
          {
            __submethod: "deoptimize_database"
          }
        ]
      }
    let json = await Server.post(p, null); if ( ! json ) return
    if ( json.data && (json.data.code === "Error") )
      throw(new Error(json.data.message))
  }

  async untrashProduct(name, sku) {
    let p = 
      {
        methodWithParms: "stocktend_object",
        msgToServer: "simulatingProductChange",
        json: [
          {
            _datatype: "products",
            __submethod: "untrash",
            name: name,
            _sku: sku
          }
        ]
      }
    let json = await Server.post(p, null); if ( ! json ) return
    if ( json.data && (json.data.code === "Error") )
      throw(new Error(json.data.message))
  }

  async trashOrderWithDifferentForeman(aProductUniqueName) {
    let origForeman = gForeman
    gForeman = new Foreman()
    global.foreman = gForeman
    global.usingDifferentForeman = true
    let m = new global.prfiMachineClass()
    await m.createMoldsAndMenus()
    await 'Configuration'.bring()
    try {
      let p = await 'products'.bringFirst({uniqueName: aProductUniqueName})
      let m = Foreman.nameToMold('order_items')
      let ois
      if ( p.isVariation() )
        ois = await m.retrieve({_variation_id: p.id})
      else
        ois = await m.retrieve({_product_id: p.id})
      if ( ois.length === 0 )
        return
      let oi = ois[0]
      let order = await oi.referee('theOrder')
      order.status = 'wc-pending'
      await Foreman.save()
      await order.trash()
      await Foreman.save()
    } finally {
      gForeman = origForeman
      global.foreman = gForeman
      global.usingDifferentForeman = false
    }
  }

  async trashOrderItemWithDifferentForeman(aProductUniqueName) {
    let origForeman = gForeman
    gForeman = new Foreman()
    global.foreman = gForeman
    global.usingDifferentForeman = true
    let m = new global.prfiMachineClass()
    await m.createMoldsAndMenus()
    await 'Configuration'.bring()
    try {
      let p = await 'products'.bringFirst({uniqueName: aProductUniqueName})
      let m = Foreman.nameToMold('order_items')
      let ois
      if ( p.isVariation() )
        ois = await m.retrieve({_variation_id: p.id})
      else
        ois = await m.retrieve({_product_id: p.id})
      if ( ois.length === 0 )
        return
      let oi = ois[0]
      let ord = await oi.referee('theOrder')
      ord.status = 'wc-pending'
      await Foreman.save()
      await oi.trash()
      await Foreman.save()
    } finally {
      gForeman = origForeman
      global.foreman = gForeman
      global.usingDifferentForeman = false
    }
  }

  async trashProductWithDifferentForeman(aUniqueName) {
    let origForeman = gForeman
    gForeman = new Foreman()
    global.foreman = gForeman
    global.usingDifferentForeman = true
    let m = new global.prfiMachineClass()
    await m.createMoldsAndMenus()
    try {
      let m = Foreman.nameToMold('products')
      let ps = await m.retrieve({uniqueName: aUniqueName})
      if ( ps.length === 0 )
        return
      let p = ps[0]
      await p.trash()
      await Foreman.save()
    } finally {
      gForeman = origForeman
      global.foreman = gForeman
      global.usingDifferentForeman = false
    }
  }

  async trashSupplierWithDifferentForeman(aName) {
    let origForeman = gForeman
    gForeman = new Foreman()
    global.foreman = gForeman
    global.usingDifferentForeman = true
    let m = new global.prfiMachineClass()
    await m.createMoldsAndMenus()
    try {
      let m = Foreman.nameToMold('Supplier')
      let s = await this.nameToSupplier(m, aName)
      await s.trash()
      await Foreman.save()
    } finally {
      gForeman = origForeman
      global.foreman = gForeman
      global.usingDifferentForeman = false
    }
  }

  async setProductSkuWithDifferentForeman(aName, aValue) {
    let origForeman = gForeman
    gForeman = new Foreman()
    global.foreman = gForeman
    global.usingDifferentForeman = true
    let m = new global.prfiMachineClass()
    await m.createMoldsAndMenus()
    try {
      let productMold = Foreman.nameToMold('products')
      let product = await this.nameToProduct(productMold, aName)
      product._sku = aValue
      await Foreman.save()
    } finally {
      gForeman = origForeman
      global.foreman = gForeman
      global.usingDifferentForeman = false
    }
  }

  async setProductLastCostWithDifferentForeman(aUniqueName, aValue) {
    let origForeman = gForeman
    gForeman = new Foreman()
    global.foreman = gForeman
    global.usingDifferentForeman = true
    let m = new global.prfiMachineClass()
    await m.createMoldsAndMenus()
    try {
      let productMold = Foreman.nameToMold('products')
      let products = await productMold.retrieve({uniqueName: aUniqueName})
      let product = products[0]
      let inventoryMold = Foreman.nameToMold('Inventory')
      let invs = await inventoryMold.retrieve({product: product})
      let inv = invs[0]
      inv.lastPurchaseUnitCostIncTax = aValue
      await Foreman.save()
    } finally {
      gForeman = origForeman
      global.foreman = gForeman
      global.usingDifferentForeman = false
    }
  }

  async setProductBarcodeWithDifferentForeman(aUniqueName, aValue) {
    let origForeman = gForeman
    gForeman = new Foreman()
    global.foreman = gForeman
    global.usingDifferentForeman = true
    let m = new global.prfiMachineClass()
    await m.createMoldsAndMenus()
    try {
      let productMold = Foreman.nameToMold('products')
      let products = await productMold.retrieve({uniqueName: aUniqueName})
      let product = products[0]
      let inventoryMold = Foreman.nameToMold('Inventory')
      let invs = await inventoryMold.retrieve({product: product})
      let inv = invs[0]
      await inv.setBarcode(aValue)
      await Foreman.save()
    } finally {
      gForeman = origForeman
      global.foreman = gForeman
      global.usingDifferentForeman = false
    }
  }

  async deleteStocktendObjects() {
    let payload = {
      methodWithParms: 'stocktend_object',
      msgToServer: 'deleteStocktendObjects',
      json: {
        parms: {
        }
      }
    }
    let serverRes = await gServer.doPost(payload)
    if ( (! serverRes) || (serverRes.result !== 'sent') )
      throw(new Error('Error deleting stocktend objects'))
  }

  async deletePrfiObjects() {
    let payload = {
      methodWithParms: 'stocktend_object',
      msgToServer: 'deletePrfiObjects',
      json: {
        parms: {
        }
      }
    }
    let serverRes = await gServer.doPost(payload)
    if ( (! serverRes) || (serverRes.result !== 'sent') )
      throw(new Error('Error deleting prfi objects'))
    let c = await 'Configuration'.bringFirst()
    c.tbi = 'No'
    await gForeman.doSave()
  }

  async monitorRetrieves(opt) {
    global.monitorRetrievesOpt = opt
  }

  async trashAll(aDatatype) {
    global.stDoingTrashAll = true
    try {
      if ( aDatatype === '*' ) {
        try {
          await this.clearWCOrders()
          await this.clearWCStockLevels()
          await this.clearWCUsers()
          await this.clearWCProducts()
        } catch {
        }
        await this.deleteStocktendObjects()
        await this.deletePrfiObjects()
        try {
          await this.clearWCOrders()
          await this.clearWCStockLevels()
        } catch {
        }
        await this.deleteStocktendObjects()
        return
      }
      let casts = await aDatatype.bring()
      await casts.forAllAsync(async cast => {
        await cast.trash({force: true})
      })
      await Foreman.save({msgOnException: true})
    } finally {
      global.stDoingTrashAll = false
    }
  }

  generateDBErrorOnNextSave(aOptions) {
    gServer.generateDBErrorOnNextSave(aOptions)
  }

  generateErrorOnNextSave() {
    gForeman.generateErrorOnNextSave()
  }

  generateErrorOnNextPreSave() {
    gForeman.generateErrorOnNextPreSave()
  }

  suspendCaching() {
    global.suspendCaching = true
  }

  unsuspendCaching() {
    global.suspendCaching = false
  }

  async clearInstalledFlag() {
    let config = await 'Configuration'.bringOrCreate()
    config.i5 = 'No'
    await Foreman.save({msgOnException: true})
  }

  async clearLastPurchaseCosts() {
    await Foreman.save()
    let invs = await 'Inventory'.bring()
    invs.forAll(inv => {
      inv.lastPurchaseUnitCostIncTax = global.unknownNumber()
    })
    await Foreman.save()
  }

  async clearWCStockLevels() {
    let products = await 'products'.bring()
    products.forAll(p => {
      p._stock = 0
      p._low_stock_amount = 0
    })
    await Foreman.save()
  }

  async clearWCUsers() {
    let user; let users = await 'users'.bring()
    while ( user = users.__() ) {
      if ( ! user.user_login.startsWith('prfi_') ) continue
      await user.trash()
    }
    await Foreman.save()
  }

  async clearWCProducts() {
    let p; let ps = await 'products'.bring()
    while ( p = ps.__() ) {
      if ( ! p._sku ) continue
      if ( ! p._sku.startsWith('prfi_') ) continue
      await p.trash()
    }
    await Foreman.save()
  }

  async addProduct(aParms) {
    let uniqueName = aParms.name + ' (' + aParms.sku + ')'
    let p = await 'products'.bringOrCreate({uniqueName: uniqueName})
    p._sku = aParms.sku
    await Foreman.save()
  }

  async addWCOrder(aParms) {

    let doIt = async () => {
      let order = await 'orders'.create()

      let addItem = async (parms) => {
        let orderItem = await 'order_items'.create({parentId: order.id}, {theOrder: order.reference()})
        orderItem._qty = 1
        orderItem._line_total = parms.totalExTax
        orderItem._line_subtotal = parms.totalExTax
        orderItem._line_tax = parms.totalTax
        orderItem._name = parms.type
        orderItem.order_item_type = parms.type
        orderItem.method_id = parms.methodId
        orderItem.instance_id = parms.instanceId
      }

      let methodNameToId = async name => {
        let method = await 'shipping_methods'.bringFirst({uniqueName: name}); if ( ! method ) return null
        return method.method_id
      }

      let methodNameToInstanceId = async name => {
        let method = await 'shipping_methods'.bringFirst({uniqueName: name}); if ( ! method ) return null
        return method.instance_id
      }

      let addShippingItem = async () => {
        let totalExTax = global.roundTo2Decimals(aParms.shippingIncTax * 10/11)
        let totalTax = aParms.shippingIncTax - totalExTax
        let methodId = await methodNameToId(aParms.methodName)
        let instanceId = await methodNameToInstanceId(aParms.methodName)
        await addItem({type: 'shipping', totalExTax: totalExTax, totalTax: totalTax, methodId: methodId, instanceId: instanceId})
      }

      let addFeeItem = async () => {
        let totalExTax = global.roundTo2Decimals(aParms.feesIncTax * 10/11)
        let totalTax = aParms.feesIncTax - totalExTax
        await addItem({type: 'fee', totalExTax: totalExTax, totalTax: totalTax})
      }

      order.order_date = global.localToYMD(aParms.orderDate)
      order.status = "wc-completed"
      if ( ! aParms.excludeDefaultCountry )
        order._shipping_country = 'AU'
      if ( aParms.status )
        order.status = aParms.status
      order.refreshFieldIndexes()
      if ( aParms.shippingIncTax )
        //order._order_shipping = global.roundTo2Decimals((aParms.shippingIncTax * 10/11))
        await addShippingItem()
      if ( aParms.feesIncTax ) {
        //order.fees_total = global.roundTo2Decimals((aParms.feesIncTax * 10/11))
        //order.fees_tax = aParms.feesIncTax - order.fees_total
        await addFeeItem()
      }
      if ( aParms.company ) {
        order._billing_company = aParms.company
        order._shipping_company = 'Warehouse of ' + aParms.company
      }
      if ( aParms.customer ) {
        let customer = await 'users'.bringFirst({display_name: aParms.customer})
        if ( customer )
          order._customer_user = customer.id
      }
      let opt
      if ( aParms.setModDateToOrder )
        opt = {msgToServer: "setModDateToOrder"}
      if ( aParms.useProductPrice )
        opt = {msgToServer: "useProductPrice"}
      if ( aParms.shipmentMethod )
        order.shipmentMethod = aParms.shipmentMethod
      await Foreman.save(opt)
      await this.doAddWCOrderItem(order, aParms)
      await Foreman.save(opt)
      global.lastAddedWCOrder = order
    }

    if ( aParms.differentForeman )
      this.execWithDifferentForeman(doIt)
    else
      doIt()
  }

  async doAddWCOrderItem(aOrder, aParms) {
    let order = aOrder
    let orderItem = await 'order_items'.create({parentCast: order})
    let product = await 'products'.bringSingle({uniqueName: aParms.product})
    if ( ! product )
      throw(new Error("Product doesn't exist: " + aParms.product))
    if ( product.isVariation() )
      orderItem._variation_id = product.id
    else
      orderItem._product_id = product.id
    orderItem._qty = aParms.quantity
    let lineTotalIncTax
    if ( aParms.unitPrice )
      lineTotalIncTax = aParms.quantity * aParms.unitPrice
    else
      lineTotalIncTax = (aParms.quantity * aParms.unitPriceExclTax) * 1.1
    orderItem._line_tax = global.roundTo2Decimals(lineTotalIncTax / 11) // Assume 10% tax for testing
    orderItem._line_total = lineTotalIncTax - orderItem._line_tax
    orderItem._line_subtotal = orderItem._line_total
    orderItem.order_status = order.status
    orderItem.refreshFieldIndexes()
  }

  async addWCOrderItem(aParms) {
    let doIt = async () => {
      let order = global.lastAddedWCOrder
      await this.doAddWCOrderItem(order, aParms)
      let opt
      if ( aParms.useProductPrice )
        opt = {msgToServer: "useProductPrice"}
      await Foreman.save(opt)
    }

    if ( aParms.differentForeman )
      await this.execWithDifferentForeman(doIt)
    else
      await doIt()
  }

  async adjustQtyWithDifferentForeman(productUniqueName, locationName, qty) {
    let doIt = async () => {
      let product = await 'products'.bringSingle({uniqueName: productUniqueName})
      let inv = await product.toInventory({allowCreate: true})
      let loc = await 'Location'.bringSingle({locationName: locationName})
      let tran = await 'Transaction'.create()
      tran.product = product.reference()
      tran.date = global.todayYMD()
      tran.quantity = qty
      tran.source = 'Adjustment'
      tran.inventory = inv.reference()
      tran.location = loc.reference()
      await Foreman.save()
    }

    await this.execWithDifferentForeman(doIt)
  }

  async execWithDifferentForeman(fn) {
    let origForeman = gForeman
    gForeman = new Foreman()
    global.foreman = gForeman
    global.usingDifferentForeman = true
    let m = new global.prfiMachineClass()
    await m.createMoldsAndMenus()
    try {
      await 'Configuration'.bring()
      await fn()
    } finally {
      gForeman = origForeman
      global.foreman = gForeman
      global.usingDifferentForeman = false
    }
  }

  async clearWCOrders() {
    let orders = await 'orders'.bring()
    await orders.forAllAsync(async order => {
      await order.trash()
    })
    let ois = await 'order_items'.bring()
    await ois.forAllAsync(async oi => {
      await oi.trash()
    })
    await Foreman.save()
  }

  async setWCLowStockAmount(aProduct, aQty) {
    let p = await 'products'.bringSingle({uniqueName: aProduct}, {noErrorOnMultiple: true}); 
    if ( ! p ) throw(new Error("Invalid product " + aProduct))
    p._low_stock_amount = aQty
    await Foreman.save({msgToServer: "simulatingStockChange"})
  }

  async checkWCLowStockAmount(aProduct, aQty) {
    let p = await 'products'.bringSingle({uniqueName: aProduct}, {noErrorOnMultiple: true}); 
    if ( ! p ) throw(new Error("Invalid product " + aProduct))
    let qty = p._low_stock_amount
    if ( qty !== aQty )
      throw(new Error("checkWCLowStockAmount: expected quantity: " + aQty + ", actual quantity: " + qty))
  }

  async setWCOrderStatus(options) {

    let customerNameToOrder = async name => {
      let customer = await 'users'.bringFirst({display_name: name})
      let order = await 'orders'.bringFirst({_customer_user: customer.id})
      return order
    }

    let doIt = async () => {
      let order = await customerNameToOrder(options.customer)
      order.status = 'wc-' + options.status.toLowerCase()
      await Foreman.save({msgToServer: "simulatingOrderStatusChange"})
    }

    if ( options && options.differentForeman )
      this.execWithDifferentForeman(doIt)
    else
      doIt()
  }

  async setWCStockLevel(aProduct, aQty, aOptions) {
    let doIt = async () => {
      let p = await 'products'.bringSingle({uniqueName: aProduct}, {noErrorOnMultiple: true}); 
      if ( ! p ) throw(new Error("Invalid product " + aProduct))
      p._stock = aQty
      await Foreman.save({msgToServer: "simulatingStockChange"})
    }

    if ( aOptions && aOptions.differentForeman )
      this.execWithDifferentForeman(doIt)
    else
      doIt()
  }

  async checkWCStockLevel(aProduct, aQty, option) {
    if ( option === "frontend" ) {
      this.checkWCStockLevelOnFrontEnd(aProduct, aQty)
      return
    }
    let p = await 'products'.bringSingle({uniqueName: aProduct}, {noErrorOnMultiple: true}); 
    if ( ! p ) throw(new Error("Invalid product " + aProduct))
    let qty = p._stock
    if ( qty !== aQty )
      throw(new Error("checkWCStockLevel: expected quantity: " + aQty + ", actual quantity: " + qty))
  }

  async checkWCStockLevelOnFrontEnd(aProduct, aQty) {
    let p = await 'products'.bringSingle({uniqueName: aProduct}, {noErrorOnMultiple: true}); 
    if ( ! p ) throw(new Error("Invalid product " + aProduct))
    let methodWithParms = 'stocktend_object?datatype=none&source=wcStockLevel&id=' + p.id
    let res = await gServer.doGet(methodWithParms);
    let qty = res
    if ( qty !== aQty )
      throw(new Error("checkWCStockLevel: expected quantity: " + aQty + ", actual quantity: " + qty))
  }

  async checkForInventoryDuplicates() {
    let call = "stocktend_object?datatype=Inventory&fields=product"
    let json = await Server.get(call); if ( ! json ) return
    json.data.forEach(inv => {
      let id = inv.product.id
      json.data.forEach(inv2 => {
        if ( inv === inv2 ) return "continue"
        let id2 = inv2.product.id
        if ( id === id2 ) {
          "checkForInventoryDuplicates json".m(json)
          throw(new Error("There are inventory duplicates"))
        }
      })
    })
  }

  async simulateBrowserRefresh() {
    global.simulatingBrowserRefresh = true
    gForeman = new Foreman()
    global.foreman = gForeman
    global.stForemanClass = Foreman
    global.globalSearchText = null
    renderApp()
    execDeferred(() => { global.simulatingBrowserRefresh = false }, {noSpinner: true, ms: 1000})
  }

  flushCache() {
    gForeman.flushCache()
  }

}

class Installer {

  async install() {
    await this.harmonize()
  }

  async harmonize() {
    let h = new Harmonizer()
    await h.harmonize({full: true})
  }

}

class Output extends React.Component {

  constructor(aProps) {
    super(aProps)
    this.version = 1
  }

  componentDidMount() {
    this.mounted = true
  }

  componentDidUpdate() {
    if ( this.content )
      this.props.afterRender()
  }

  componentWillUnmount() {
    this.mounted = false
  }

  mainCast() {
    return this.cast
  }

  getChildCasts() {
    let m = this.getManifestMold(); if ( ! m ) return []
    return m.retrieve({parentId: this.cast.id})
  }

  callerCast() {
    return this._callerCast
  }

  callerSpecname() {
    return this._callerSpecname
  }

  parentCast() {
    return this._parentCast
  }

  async refreshCalculations() { /* Output */
    await this.cast.refreshCalculations({force: true})
    let cm = this.getManifestMold(); if ( ! cm ) return
    await cm.refreshCalculations({parentId: this.cast.id, force: true, point: 6})
    cm.version++
  }

  getManifestMold() {
    let man = this.getFirstManifest(); if ( ! man ) return null
    return Foreman.nameToMold(man.attributes.datatype)
  }

  getFirstManifest() {
    let mans = this.manifests(); if ( ! mans ) return null
    if ( mans.length === 0 ) return null
    return mans[0]
  }

  fieldNameToParentCast(aFieldName) {
    return this._parentCast
  }

  refreshMold() {
    let moldName = this.datatype()
    this.mold = Foreman.nameToMold(moldName)
  }

  a() {
    return this.props.attributes
  }

  datatype() {
    return this.a().datatype
  }

  key() {
    return this.a().key
  }

  fields() {
    return this.a().fields
  }

  manifests() {
    return this.a().manifests
  }

  specname() {
    return this.a().specname
  }

  refreshState(aOptions) { /* Output */
    if ( ! this.mounted ) return
    this.setState({ 
      version: this.version, 
      cast: this.cast,
    })
  }

  id() {
    let c = this.cast; if ( ! c ) return null
    return c.id
  }

  nameToField(aName) { /* Output */
    return this.fields().filterSingle(field => (field.name === aName) || (field.caption === aName))
  }

  getKeyId() {
    return this.nameToId(this.key())
  }

  nameToId(aName) {
    return aName
  }

  getParticulars() {
    return (
      <Particulars
        classRoot="stOutput"
        container={this}
        attributes={this.a()}
        cast={this.cast}
      />
    )
  }

  getGrids() { /* Output */
    let res = []
    let manifests = this.manifests()
    for ( var i = 0; i < manifests.length; i++ ) {
      let m = manifests[i]
      let grid = this.manifestToGrid(m)
      res.push(grid)
    }
    return res
  }

  manifestToGrid(aManifest) { /* Output */
    let name = aManifest.name
    let c = this.cast
    let castId = c ? c.id : null
    let res = (
      <Grid 
        key={name} 
        output={this}
        manifestName={name} 
        attributes={aManifest.attributes} 
        containerSpecname={this.specname()}
        containerCast={c}
        containerCastId={castId}
        containerVersion={this.version}
      />
    )
    return res
  }

  value(aFieldName) {
    let c = this.cast; if ( ! c) return null
    return c.fieldNameToValue(aFieldName)
  }

  fieldNameToIdReferredTo(aName) {
    let v = this.cast[aName]
    if ( ! global.isObj(v) ) return null
    return this.safeValue(v.id)
  }

  fieldNameToKeyValue(aName) {
    let res = this.cast[aName]
    if ( ! global.isObj(res) ) this.err(aName + " is not a reference and so can't be the target of a keyValue call")
    return this.safeValue(res.keyval)
  }

  fieldGet(aName) {
    let res = this.cast[aName]
    if ( ! global.isObj(res) ) 
      return this.safeValue(res)
    return res
  }

  safeValue(aVal) {
    if ( aVal === 0 ) return aVal
    if ( ! aVal ) return ''
    return aVal
  }

  render() { /* Output */
    if ( ! this.content ) {
      this.attributes = global.stCurrentMachine.specnameToAttributes(this.props.specname)
      execDeferred(async () => { await this.refreshContent(); this.forceUpdate() })
      return null
    }
    return this.content
  }

  async refreshContent() {
    let p = this.props
    this.refreshMold()
    this.cast = p.cast
    this._parentCast = p.parentCast
    this._callerCast = p.callerCast
    this._callerSpecname = p.callerSpecname
    if ( ! this.cast ) {
      if ( this.mold.singleton ) 
        this.cast = await this.datatype().bringSingle()
      this.props.situation.cast = this.cast
    }
    this.version++
    this.content = (
      <FormGroup className="stOutputLevel3">
        <FormGroup className="stOutputLevel4" id="stOutputLevel4"> 
          <FormGroup className="stOutputLevel5" key={this.specname()}>
            {this.getParticulars()}
            {this.getGrids()}
          </FormGroup>
        </FormGroup>
      </FormGroup>
    )
  }

}

class Combobox extends React.Component {

  constructor(aProps) {
    super(aProps)
    this.value = aProps.value
    this.state = {listVisible: false, userClickedArrow: false}
  }

  getArrowChar() {
    return "\u25BC"
  }

  onArrowClick() {
    if ( this.props.disabled ) return
    let newVis = ! this.state.listVisible
    this.setState({listVisible: newVis, userClickedArrow: newVis})
  }

  onListItemSelected(aValue) {
    let p = this.props
    this.value = aValue
    p.onChange(this.value)
    this.setState({listVisible: false, userClickedArrow: false})
  }

  UNSAFE_componentWillReceiveProps(aProps) {
    this.value = aProps.value
  }

  onElementBlur(aEvent) {
    aEvent.persist()
    execDeferred(() => {
      if ( this.hasFocus() ) return
      this.onBlur(aEvent)
    }, {noSpinner: true})
  }

  hasFocus() {
    let p = this.props
    let el = document.activeElement
    if ( ! el )
      return false
    let id = el.id; if ( ! id ) return false
    return id.startsWith("stCombo") && (id.indexOf(p.id) >= 0)
  }

  onBlur(aEvent) { /* Combobox */
    let p = this.props
    this.setState({listVisible: false, userClickedArrow: false})
    this.autoComplete()
    if ( p.onBlur ) {
      aEvent.persist()
      p.onBlur(aEvent)
    }
  }

  autoComplete() {
    let p = this.props
    let value = this.value
    let newValue = this.determineAutoCompleteValue(value)
    if ( newValue === value ) return
    this.value = newValue
    p.onChange(this.value)
  }

  determineAutoCompleteValue(aValue) {
    if ( ! aValue ) return ''
    let p = this.props
    let data = p.data
    if ( data.indexOf(aValue) >= 0 ) return aValue
    let value = aValue.toLowerCase()
    let valueLen = value.length
    let last = data.length - 1
    for ( let i = 0; i <= last; i++ ) {
      if ( data[i].substr(0, valueLen).toLowerCase() === value )
        return data[i]
    }
    for ( let i = 0; i <= last; i++ ) {
      if ( data[i].toLowerCase().indexOf(value) >= 0 )
        return data[i]
    }
    return aValue
  }

  rememberCursorPosition(aElement) {
    if ( ! aElement ) return
    this.cursorPosition = aElement.selectionStart
  }

  restoreCursorPosition(aElement) {
    if ( ! aElement ) return
    let pos = this.cursorPosition
    execDeferred(() => {
      aElement.selectionStart = pos
      aElement.selectionEnd = pos
    }, {noSpinner: true})
  }

  onInputChange(aEvent) {
    let p = this.props
    if ( ! p.onChange ) return
    let t = aEvent.target; if ( ! t ) return
    let value = t.value
    this.value = value
    this.rememberCursorPosition(t)
    p.onChange(value)
    this.restoreCursorPosition(t)
    this.setState({listVisible: true, userClickedArrow: false})
  }

/*
  focusCombolist() {
    let id = "stCombolistTR0-stCombolist" + this.props.id
    let el = document.getElementById(id); if ( ! el ) return
    el.focus()
  }

  onInputKeyDown(aEvent) {
    if ( aEvent.keyCode === 40 )
      this.focusCombolist()
  }
*/

  render() {
    let p = this.props
    let s = this.state
    let value = this.value
    this.inputId = "stComboboxInput" + p.id 
    if ( ! value )
      value = ''
    return (
      <div 
        className="stCombobox"
        id={"stCombobox" + p.id}
        tabIndex="1000"
      >
        <div
          className="stComboboxContainer"
          id={"stComboboxContainer" + p.id}
          style={{display: "flex"}}
          tabIndex="1000"
        >
          <Input 
            className="stComboboxInput"
            id={this.inputId} 
            name={p.name}
            value={value}
            onChange={this.onInputChange.bind(this)}
            onBlur={this.onElementBlur.bind(this)}
            onClick={p.onClick}
            invalid={p.invalid}
            type="text"
            placeholder={p.placeholder}
            disabled={p.disabled}
            autoComplete="off"
          />
          <div
            className="stComboboxArrow"
            id={"stComboboxArrow" + p.id}
            onClick={this.onArrowClick.bind(this)}
            onBlur={this.onElementBlur.bind(this)}
            tabIndex="1000"
          >
            {this.getArrowChar()}
          </div>
        </div>
        <Combolist
          id={"stCombolist" + p.id}
          field={p.field}
          data={p.data}
          dropdownData={p.dropdownData}
          visible={s.listVisible}
          value={value}
          onBlur={this.onElementBlur.bind(this)}
          onSelect={this.onListItemSelected.bind(this)}
          userClickedArrow={s.userClickedArrow}
        />
      </div>
    )
  }

}

class Combolist extends React.Component {

  constructor(aProps) {
    super(aProps)
    this.fathomage = 70
    //this.state = {selectedIndex: 0}
  }

  getFilteredData(resObj) {
    let p = this.props
    let value = p.value
    if ( (! value) || (p.userClickedArrow) ) {
      resObj.dropdownData = p.dropdownData
      return p.data
    }
    let res = []
    if ( p.dropdownData )
      resObj.dropdownData = []
    value = value ? value.toLowerCase() : ''
    let valueLen = value.length
    let data = p.data
    let last = data.length - 1
    for ( let i = 0; i <= last; i++ ) {
      if ( data[i].substr(0, valueLen).toLowerCase() === value ) {
        res.push(data[i])
        if ( p.dropdownData )
          resObj.dropdownData.push(p.dropdownData[i])
      }
    }
    for ( let i = 0; i <= last; i++ ) {
      if ( data[i].substr(0, valueLen).toLowerCase() === value )
        continue
      if ( data[i].toLowerCase().indexOf(value) >= 0 ) {
        res.push(data[i])
        if ( p.dropdownData )
          resObj.dropdownData.push(p.dropdownData[i])
      }
    }
    return res
  }


/*
  onTRKeyDown(aEvent) {
    let s = this.state
    let p = this.props
    if ( (aEvent.keyCode === 38) && (s.selectedIndex > 0) ) {
      this.setState( prevState => ({
        selectedIndex: prevState.selectedIndex - 1
      }))
    } else if ( (aEvent.keyCode === 40) && (s.selectedIndex < this.allData.length - 1) ) {
      this.setState( prevState => ({
        selectedIndex: prevState.selectedIndex + 1
      }))
    }
  }
*/

  getRows() { // Combolist
    let p = this.props
    let res = []
    let resObj = {}
    let allData = this.getFilteredData(resObj)
    let dropdownData = resObj.dropdownData
    let data = allData.firstN(this.fathomage)
    let last = data.length - 1
    for ( var i = 0; i <= last; i++ ) {
      let tdClass = "stCombolistTD"
      //if ( p.value && (i === this.state.selectedIndex) && (! p.userClickedArrow) )
      if ( p.value && (i === 0) && (! p.userClickedArrow) )
        tdClass += " stSelected"
  
      let rowText = data[i]
      if ( dropdownData )
        rowText = dropdownData[i]
      res.push (
        <tr 
          id={"stCombolistTR" + i + "-" + p.id}
          key={i}
          onBlur={this.onElementBlur.bind(this)}
          tabIndex="1000"
          >
          <td
            id={"stCombolistTD" + i + "-" + p.id}
            className={tdClass}
            style={{borderTop: "none", cursor: "pointer", height: "24px", paddingTop: "4px", paddingBottom: "4px"}}
            onClick={this.onRowClick.bind(this, data[i])}
            onBlur={this.onElementBlur.bind(this)}
            tabIndex="1000"
          >
            {rowText}
          </td>
        </tr>
      )
    }
    let fillinCount = allData.length - data.length
    if ( fillinCount > 20 )
      fillinCount = 20
    for ( let i = 0; i < fillinCount; i++ ) {
      let row = this.getFillinRow(i)
      res.push(row)
    }
    return res
  }

  getFillinRow(aIdx) {
    let id = "stComboFillin" + aIdx
    return (
      <tr key={id} id={id}>
        <td className="stCombolistTD">
        </td>
      </tr>
    )
  }

  onRowClick(aValue) {
    let p = this.props
    p.onSelect(aValue)
  }

  onElementBlur(aEvent) { /* Combolist */
    aEvent.persist()
    let p = this.props
    execDeferred(() => {
      if ( this.hasFocus() ) return
      p.onBlur(aEvent)
    }, {noSpinner: true})
  }

  hasFocus() {
    let el = document.activeElement
    if ( ! el )
      return false
    let id = el.id
    return id.startsWith("stCombolist")
  }

  onScroll() {
    if ( this.anyFillinIsShowing() )
      this.forceUpdate()
  }

  anyFillinIsShowing() {
    return this.idIsShowing("stComboFillin0") || this.idIsShowing("stComboFillin19")
  }

  idIsShowing(aId) {
    let div = document.getElementById("stCombolistContainer" + this.props.id); if ( ! div ) return false
    let row = document.getElementById(aId); if ( ! row ) return false
    let rowRect = row.getBoundingClientRect()
    let divRect = div.getBoundingClientRect()
    return (
      rowRect.bottom > divRect.top &&
      rowRect.top < divRect.bottom
    )
  }

  render() {
    let p = this.props
    if ( ! p.visible ) return null
    this.holderId = "stCombolistHolder" + p.id
    let rows = this.getRows()
    if ( this.anyFillinIsShowing() ) {
      this.fathomage += 20
      execDeferred(this.forceUpdate.bind(this), {noSpinner: true})
    }
    return (
      <div
        id={this.holderId}
        style={{position: "relative"}}
        tabIndex="1000"
        onBlur={this.onElementBlur.bind(this)}
      >
        <div 
          id={"stCombolistContainer" + p.id}
          tabIndex="1000"
          onScroll={this.onScroll.bind(this)}
          style={{
            position: "absolute", 
            zIndex: "10", 
            maxHeight: "320px",
            top: "100%", 
            width: "100%",
            overflowY: "scroll",
            backgroundColor: "white",
            border: "1px solid #ced4da",
            borderRadius: ".25rem"
          }}
        >
          <Table
            onBlur={this.onElementBlur.bind(this)}
            id={"stCombolistTable" + p.id}
            tabIndex="1000"
          >
            <tbody
              id={"stCombolistTbody" + p.id}
              tabIndex="1000"
            >
              { rows }
            </tbody>
          </Table>
        </div>
      </div>
    )
  }

}

global.gHelper = new Helper()
var gRootVersion = 0

function deleteRootDiv(aParent) {
  if ( ! aParent ) return
  aParent.innerHTML = '';
}

function hideBannerAds(parentDiv) {
  let node = parentDiv
  while ( true ) {
    node = node.previousSibling; if ( ! node ) break
    if ( node.tagName === 'DIV' )
      node.style.display = 'none'
  }
}

function createRootDiv(aParent) {
  hideBannerAds(aParent)
  deleteRootDiv(aParent)
  let newDiv = document.createElement("div"); 
  gRootVersion++
  newDiv.id = "root" + gRootVersion
  newDiv.className = "stsubroot"
  aParent.appendChild(newDiv);
  return newDiv
}

function getRootParent() {
  return document.getElementById('stocktend-root');
}

function renderApp() {
  let target = getRootParent()
  if ( ! target ) {
    global.runningInsideWordpress = false
    target = document.getElementById('profitori-root'); if ( ! target ) return
  } else
    global.runningInsideWordpress = true
  let div = createRootDiv(target)
  if ( gApp )
    gApp.stale = true
  PremiumProxy.initialise()
  ReactDOM.render(<App />, div);
}

function getUrlVars() {
  let vars = {};
  let href = window.location.href.stripAfterLast('#')
  href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
    vars[key] = value;
  });
  return vars;
}

function isIE() {
  let ua = window.navigator.userAgent
  let res = /MSIE|Trident/.test(ua)
  return res
}

if ( window.location.hash ) {
  window.location.hash = ''
}

let gUrlVars = getUrlVars()
gIncludeTestButtons = gUrlVars.includeTestButtons
if ( ! gLogSaves ) gLogSaves = gUrlVars.logSaves
if ( ! gLogClientRetrieves ) gLogClientRetrieves = gUrlVars.logClientRetrieves
if ( ! gLogServerRetrieves ) gLogServerRetrieves = gUrlVars.logServerRetrieves
if ( ! gLogTimings ) gLogTimings = gUrlVars.logTimings
if ( ! global.suspendCaching ) global.suspendCaching = gUrlVars.suspendCaching
if ( ! global.safeMode ) global.safeMode = gUrlVars.safeMode
if ( ! global.noHarmonize ) global.noHarmonize = gUrlVars.noHarmonize
if ( ! global.startWithTest ) global.startWithTest = gUrlVars.startWithTest
if ( ! global.stopAfterTestNo ) global.stopAfterTestNo = gUrlVars.stopAfterTestNo
if ( ! global.chapter ) global.chapter = gUrlVars.chapter
if ( ! global.urlLicenseKey ) global.urlLicenseKey = gUrlVars.licenseKey
if ( ! global.logPlexus ) global.logPlexus = gUrlVars.logPlexus
if ( ! global.logRefreshPackables ) global.logRefreshPackables = gUrlVars.logRefreshPackables
if ( ! global.urlOptimisticLocking ) global.urlOptimisticLocking = gUrlVars.optimisticLocking
if ( ! global.noNag ) global.noNag = gUrlVars.noNag
if ( ! global.noTurbo ) global.noTurbo = gUrlVars.noTurbo
global.gather = gUrlVars.gather
global.gatherTargetLang = gUrlVars.gatherTargetLang

if ( gUrlVars.logAll ) {
  gLogSaves = true
  gLogClientRetrieves = true
  gLogServerRetrieves = true
}

if ( gLogTimings ) {
  global.tc = tc
  global.tcReport = tcReport
}

renderApp()

if ( gLogTimings ) {
  let monitorTimings = () => {
    let busy = ( global.gServer.doIsWaiting() || global.thereAreDeferredTasks() || global.doingBrowserBack || (global.prfiProgressCount > 0) ) 
    if ( (! busy) && (Object.keys(gTimes).length > 2) )
      tcReport()
    setTimeout(() => monitorTimings(), 1000)
  }

  setTimeout(() => monitorTimings(), 1000)
}

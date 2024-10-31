import { forAll } from './Functions.js'
import Gatherer from './Gatherer.js'

/* eslint-disable no-eval */

let gTests = []
let gFETests = []
let gFETestNo = 0
let gFEElement = null
let gFEElementName = null
let gFECondition = null
let gFERowNo
let gFELastToFirst
let gCurrentTest = null
let gOrigTestCount = 0
let gUnhandledExceptionMsg
let gTestsFailed
let gGroupName
let gLoadingScript
let gLastLoadingScript
let gTestCountWithinScript

let START_AT = 0

window.addEventListener("unhandledrejection", function(promiseRejectionEvent) { 
  gUnhandledExceptionMsg = promiseRejectionEvent.reason  
})

class Tester {

  runFactorySettings() {
    gGroupName = "FactorySettings"
    require("./FactorySettings.js")
    delete require.cache[require.resolve("./FactorySettings.js")];
    startProcessingTests()
  }

  runUomTests() {
    gGroupName = "UomTests"
    require("./UomTests.js")
    delete require.cache[require.resolve("./UomTests.js")];
    startProcessingTests()
  }

  runScanTests() {
    gGroupName = "ScanTests"
    require("./ScanTests.js")
    delete require.cache[require.resolve("./ScanTests.js")];
    startProcessingTests()
  }

  runCoreTests() {
    gGroupName = "CoreTests"
    require("./CoreTests.js")
    delete require.cache[require.resolve("./CoreTests.js")];
    startProcessingTests()
  }

  runCRMTests() {
    gGroupName = "CRMTests"
    require("./CRMTests.js")
    delete require.cache[require.resolve("./CRMTests.js")];
    startProcessingTests()
  }

  runBackboneTests() {
    gGroupName = "BackboneTests"
    require("./BackboneTests.js")
    delete require.cache[require.resolve("./BackboneTests.js")];
    startProcessingTests()
  }

  runBackbone2Tests() {
    gGroupName = "Backbone2Tests"
    require("./Backbone2Tests.js")
    delete require.cache[require.resolve("./Backbone2Tests.js")];
    startProcessingTests()
  }

  runBackbone3Tests() {
    gGroupName = "Backbone3Tests"
    require("./Backbone3Tests.js")
    delete require.cache[require.resolve("./Backbone3Tests.js")];
    startProcessingTests()
  }

  runBackbone4Tests() {
    gGroupName = "Backbone4Tests"
    require("./Backbone4Tests.js")
    delete require.cache[require.resolve("./Backbone4Tests.js")];
    startProcessingTests()
  }

  runLabelTests() {
    gGroupName = "LabelTests"
    require("./LabelTests.js")
    delete require.cache[require.resolve("./LabelTests.js")];
    startProcessingTests()
  }

  runHarmonizerTests() {
    gGroupName = "HarmonizerTests"
    require("./HarmonizerTests.js")
    delete require.cache[require.resolve("./HarmonizerTests.js")];
    startProcessingTests()
  }

  runSearchTests() {
    gGroupName = "SearchTests"
    require("./SearchTests.js")
    delete require.cache[require.resolve("./SearchTests.js")];
    startProcessingTests()
  }

  runAvgCostingTests() {
    gGroupName = "AvgCostingTests"
    require("./AvgCostingTests.js")
    delete require.cache[require.resolve("./AvgCostingTests.js")];
    startProcessingTests()
  }

  runMigTests() {
    gGroupName = "MigTests"
    require("./MigrationTests.js")
    delete require.cache[require.resolve("./MigrationTests.js")];
    startProcessingTests()
  }

  runLocTests() {
    gGroupName = "LocTests"
    require("./LocationTests.js")
    delete require.cache[require.resolve("./LocationTests.js")];
    startProcessingTests()
  }

  runGPTests() {
    gGroupName = "GPTests"
    require("./GPTests.js")
    delete require.cache[require.resolve("./GPTests.js")];
    startProcessingTests()
  }

  runAllTests() {
    gGroupName = "All"
    gLastLoadingScript = null
    gLoadingScript = "CoreTests.js";
    global.reachedStartScript = false
    require("./CoreTests.js")
    delete require.cache[require.resolve("./CoreTests.js")];
    gLoadingScript = "LocationTests.js";
    require("./LocationTests.js")
    delete require.cache[require.resolve("./LocationTests.js")];
    gLoadingScript = "Backbone2Tests.js";
    require("./Backbone2Tests.js")
    delete require.cache[require.resolve("./Backbone2Tests.js")];
    gLoadingScript = "Backbone3Tests.js";
    require("./Backbone3Tests.js")
    delete require.cache[require.resolve("./Backbone3Tests.js")];
    gLoadingScript = "Backbone4Tests.js";
    require("./Backbone4Tests.js")
    delete require.cache[require.resolve("./Backbone4Tests.js")];
    gLoadingScript = "HarmonizerTests.js";
    require("./HarmonizerTests.js")
    delete require.cache[require.resolve("./HarmonizerTests.js")];
    gLoadingScript = "AvgCostingTests.js";
    require("./AvgCostingTests.js")
    delete require.cache[require.resolve("./AvgCostingTests.js")];
    gLoadingScript = "LabelTests.js";
    require("./LabelTests.js")
    delete require.cache[require.resolve("./LabelTests.js")];
    gLoadingScript = "MigrationTests.js";
    require("./MigrationTests.js")
    delete require.cache[require.resolve("./MigrationTests.js")];
    gLoadingScript = "UomTests.js";
    require("./UomTests.js")
    delete require.cache[require.resolve("./UomTests.js")];
    gLoadingScript = "ScanTests.js";
    require("./ScanTests.js")
    delete require.cache[require.resolve("./ScanTests.js")];
    gLoadingScript = "SearchTests.js";
    require("./SearchTests.js")
    delete require.cache[require.resolve("./SearchTests.js")];
    gLoadingScript = "CRMTests.js";
    require("./CRMTests.js")
    delete require.cache[require.resolve("./CRMTests.js")];
    gLoadingScript = "BackboneTests.js";
    require("./BackboneTests.js")
    delete require.cache[require.resolve("./BackboneTests.js")];
    gLoadingScript = "GPTests.js";
    require("./GPTests.js")
    delete require.cache[require.resolve("./GPTests.js")];
    startProcessingTests()
  }

}

let eventFire = (aElement, aType) => {
  if ( ! aElement ) return
  if (aElement.fireEvent) {
    aElement.fireEvent('on' + aType)
    return
  }
  let evObj = document.createEvent('Events')
  evObj.initEvent(aType, true, false)
  aElement.dispatchEvent(evObj)
}

let click = (aElement) => {
  eventFire(aElement, 'click')
}

let clickDropdown = (aElement) => {
  let el = aElement
  if ( el.classList.contains("stCombobox") )
    el = el.firstChild.firstChild
  let btn = elementToDropdownButton(el)
  if ( ! btn ) throw(new Error("Element doesn't have a dropdown button"))
  click(btn)
}

let elementToDropdownButton = (aElement) => {
  let el = aElement.nextSibling; if ( ! el ) return
  if ( el.classList.contains("stComboboxArrow") )
    return el
  el = el.firstChild
  return el
}

let controlToTableElement = (aControl) => {
  let el = aControl
  if ( ! el.classList.contains("stCombobox") ) { // assume it's a combo input
    el = aControl.parentElement
    el = el.nextSibling
  }
  el = el.getElementsByTagName("table")[0]
  return el
}

let controlToCount = (aControl) => {
  let table = controlToTableElement(aControl); if ( ! table ) throw(new Error("Element doesn't have a combo list"))
  return table.getElementsByTagName("tr").length
}

let restoreFETests = () => {
  let remTests = gTests
  gTests = gFETests
  gTests.appendArray(remTests)
  gFETests = []
}

let endForEach = (aElement) => {
  if ( gFETestNo === 0 ) myThrow("endForEach encountered without corresponding _forEach")
  let oldElName = gFEElementName
  if ( gFELastToFirst )
    gFEElement = elementToLastChildMatchingCondition(aElement, gFECondition)
  else
    gFEElement = elementToFirstChildMatchingCondition(aElement, gFECondition)
  if ( (! gFEElement) || ( gFEElement.getAttribute("name") === oldElName) ) {
    gFEElementName = null
    gFEElement = null
    gFETestNo = 0
    gFETests = []
    return
  }
  gFEElementName = gFEElement.getAttribute("name"); if ( ! gFEElementName ) myThrow("Child elements of a _forEach must have name set")
  restoreFETests()
}

let removeTestsToEndForEach = () => {
  while ( (gTests.length > 0) && (gTests[0].type !== "endForEach") ) {
    gTests.shift()
  }
}

let startForEach = (aElement, aCondition, aOptions) => {
  if ( gFETestNo !== 0 ) myThrow("Nested _forEach statements are not supported")
  gFECondition = aCondition
  gFELastToFirst = aOptions && aOptions.lastToFirst
  if ( gFELastToFirst ) {
    gFERowNo = aElement.rows.length
    gFEElement = elementToLastChildMatchingCondition(aElement, aCondition)
  } else {
    gFERowNo = -1
    gFEElement = elementToFirstChildMatchingCondition(aElement, aCondition)
  }
  if ( ! gFEElement ) {
    removeTestsToEndForEach()
    return
  }
  gFEElementName = gFEElement.getAttribute("name"); if ( ! gFEElementName ) myThrow("Child elements of a _forEach must have name set")
  gFETestNo = gCurrentTest.testNo
  gFETests = []
}

let elementToIndexWithinParent = (aElement) => {
  let i = 0
  let elem = aElement
  while ( (elem=elem.previousSibling) !=null ) ++i;
  return i;
}

let elementToFirstChildMatchingCondition = (aElement, aCondition) => {
  let rows = aElement.rows; if ( ! rows ) return null
  let res = null
  for ( var i = gFERowNo + 1; i < rows.length; i++ ) {
    let row = rows[i]
    if ( ! rowSatisfiesCondition(row, aCondition) ) continue
    res = row
    gFERowNo = i
    break
  }
  return res
}

let elementToLastChildMatchingCondition = (aElement, aCondition) => {
  let rows = aElement.rows; if ( ! rows ) return null
  let res = null
  for ( var i = gFERowNo - 1; i >= 0; i-- ) {
    let row = rows[i]
    if ( ! rowSatisfiesCondition(row, aCondition) ) continue
    res = row
    gFERowNo = i
    break
  }
  return res
}

let escapeDoubleQuotes = (str) => {
  return str.replace(/\\([\s\S])|(")/g,"\\$1$2");
}

let elementToLetCmd = (aElement) => {
  let el = aElement
  let name = el.getAttribute("name"); if ( ! name ) return ''
  name = name.stripLeft("stocktend_")
  if ( ! name ) return ''
  let val = el.value
  if ( (! val) && ! (el instanceof HTMLSelectElement) ) 
    val = el.innerText
  if ( global.isNumeric(val) && (! (val + '').startsWith('0')) ) {
    val = val + ''
    let sep = global.stDecimalSeparator
    if ( sep !== '.' )
      val = val.replace(sep, '.')
  } else {
    val = '"' + escapeDoubleQuotes(val) + '"'
  }
  let res = "let " + name + " = " + val
  return res
}

let rowToLetCmd = (aRow) => {
  let res = ""
  forAll(aRow.cells).do(cell => {
    if ( res ) res = res + ";"
    res = res + elementToLetCmd(cell)
  })
  return res
}

let rowSatisfiesCondition = (aRow, aCondition) => {
  if ( aRow.id.indexOf("Fillin") > 0 ) return false
  var res
  let cmd = rowToLetCmd(aRow)
  cmd = cmd + "; res = " + aCondition
  eval(cmd)
  return res 
}

let cookTestVal = (aVal) => {
  let res = aVal
  if ( global.isNumeric(aVal) ) {
    let sep = global.stDecimalSeparator
    if ( sep === "." ) return aVal
    let res = aVal + ''
    res = res.replace(".", sep);
    return res
  }
  //res = (res + '').translate({noGather: true})
  return res
}

let myScrollTo = (aElement) => {
  //if ( aElement.scrollIntoViewIfNeeded )
    //aElement.scrollIntoViewIfNeeded()
  if ( global.elementIsInViewport(aElement) ) return
  aElement.scrollIntoView({behavior: 'smooth', block: 'center'})
  global.sleepUntilMs = global.nowMs() + 1000
}

let enter = (aElement, aText) => {
  //if ( aElement.disabled ) throw(new Error("Tried to enter a value into a disabled control"))
  let tagName = aElement.tagName.toLowerCase()
  let setter
  if ( tagName === "textarea" )
    setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
  else
    setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
  let text = cookTestVal(aText)
  //setter.call(aElement, "Hello");
  //aElement.scrollIntoViewIfNeeded()
  aElement.focus()
  setter.call(aElement, text);
  eventFire(aElement, 'input')
}

let toggleTick = (aElement) => {
  let f = global.checkboxChangeFunctions[aElement.id]; if ( ! f ) return
  f({target: {checked: ! aElement.checked, name: aElement.id}})
}

let key = (aElement, aChar) => {
  let text = aElement.value
  if ( aChar === "<Backspace>" ) 
    text = text.substr(0, text.length - 1)
  else
    text = text + aChar
  enter(aElement, text)
}

//var keyboardEvent = document.createEvent("KeyboardEvent");
//var initMethod = typeof keyboardEvent.initKeyboardEvent !== 'undefined' ? "initKeyboardEvent" : "initKeyEvent";

let simulateScannerRead = async (aText) => {

  let doChar = aChar => {
    global.gApp.simulateKeyDown(aChar.charCodeAt(0))
  }

  let doChars = async (aChars) => {
    if ( ! aChars ) {
      await global.wait(200)
      return
    }
    doChar(global.left(aChars, 1))
    aChars = global.stripLeftChars(aChars, 1)
    setTimeout(() => doChars(aChars), 10)
  }

  await doChars(aText)
}

let getLetCmd = () => {
  let els = xpathToElements(".//*[starts-with(@name, 'stocktend_')]", document)
  let res = ''
  let doneNames = []
  forAll(els).do(el => {
    let name = el.getAttribute("name")
    if ( name.indexOf('-') >= 0 ) return 'continue'
    if ( doneNames.indexOf(name) >= 0 ) return 'continue'
    doneNames.push(name)
    if ( res ) res = res + ";"
    res = res + elementToLetCmd(el)
  })
  return res
}

let interpretExpression = (aExpression) => {
  var res
  let cmd = getLetCmd()
  cmd = cmd + "; res = " + aExpression
  eval(cmd)
  return res 
}

let enterExpression = (aElement, aExpression) => {
  let text = interpretExpression(aExpression)
  enter(aElement, text)
}

let chooseOption = (aElement, aText) => {
  enter(aElement, aText)
}

let myThrow = (aMsg) => {
  if ( ! gCurrentTest ) throw new Error(aMsg)
  gTests = []
  gFETests = []
  gFETestNo = 0
  gFEElementName = null
  gFEElement = null
  let msg = "***TEST FAILED: " + gCurrentTest.getDesc()
  msg.m()
  let extraMsg = "      (" + aMsg + ")"
  extraMsg.m()
  gTestsFailed = true
  throw new Error(msg)
}

let xpathToElements = (aXpath, aContextNode) => {
  let res = [];
  let query = document.evaluate(aXpath, aContextNode, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)
  for (let i = 0, length = query.snapshotLength; i < length; ++i) {
    res.push(query.snapshotItem(i));
  }
  return res
}

let xpathToElement = (aXpath, aContextNode) => {
  let res = document.evaluate(aXpath, aContextNode, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
  return res
}

if ( ! window.requestIdleCallback ) {

  window.requestIdleCallback = (aFn) => {
    setTimeout(aFn, 50)
  }

}

let processRemainingTests = () => {
  if ( gUnhandledExceptionMsg ) {
    myThrow(gUnhandledExceptionMsg)
  }
  if ( global.gServer.doIsWaiting() || global.thereAreDeferredTasks() || global.doingBrowserBack || gScrolling || (global.prfiProgressCount > 0) ||
    global.simulatingBrowserRefresh || (global.prfiWaitCount > 0) || (! global.gApp) || (! global.gApp.installCheckComplete) ||
    (global.nowMs() < global.sleepUntilMs) || global.searchPending ) {
    requestIdleCallback(processRemainingTests)
    return
  }
global.startedWaitingMs = 0
global.loggedIt = false
  if ( gTests.length === 0 ) {
    global.autoTesting = false
    Gatherer.report()
    if ( gTestsFailed ) {
      console.log("***** " + gGroupName + " FAILED :( *****")
    } else {
      console.log("***** " + gGroupName + " PASSED! *****")
    }
    return
  }
  let test = gTests[0]
  while ( test && test.shouldSkip() ) {
    gTests.shift()
    test = gTests[0]
  }
  if ( test && (! test.isComplete()) ) {
    gCurrentTest = test
    console.log("========== TEST: " + test.getDesc())
    try {
      global.testNo = test.testNoWithinScript || test.testNo
      test.theFunction()
      if ( global.gForemanSaveError ) throw(new Error("Foreman save error occurred"))
      test.ranCount = test.ranCount + 1
    } catch(e) {
      gTests = []
      global.autoTesting = false
      gTestsFailed = true
      console.log(e.message)
      //throw(e)
      //return
    }
  }
  if ( test && test.isComplete() ) {
    if ( gFETestNo !== 0 ) {
      test.ranCount = 0
      gFETests.push(test)
    }
    gTests.shift()
  }
  if ( test )
    requestIdleCallback(processRemainingTests)
}

let startProcessingTests = () => {
  console.log("Commencing " + gGroupName)
  gOrigTestCount = gTests.length
  global.autoTesting = true
  global.checkboxChangeFunctions = {}
  gUnhandledExceptionMsg = null
  gTestsFailed = false
  processRemainingTests()
}

/* eslint-disable no-extend-native */

String.prototype.chk = function(aVal) {
  if ( aVal ) return
  myThrow("'" + this + "': check failed")
}

String.prototype.chkEqual = function(aVal1, aVal2) {
  if ( aVal1 === aVal2 ) return
  if ( aVal2 && (aVal1 === (aVal2 + '').translate({noGather: true})) ) return
  myThrow("'" + this + "': chkEqual failed: is: '" + aVal1 + "'; should be  '" + aVal2 + "'")
}

function removeFromArray(aArray, aVal) {
  let idx = aArray.indexOf(aVal); if ( idx < 0 ) return
  aArray.splice(idx, 1);
}

class Test {

  constructor(aFn, aTargetString, aType, aArgVals) {
    this.theFunction = aFn
    this.targetString = aTargetString
    this.type = aType
    this.argVals = aArgVals
    this.ranCount = 0
    this.testNo = gTests.length + 1
    if ( gLoadingScript !== gLastLoadingScript ) {
      gTestCountWithinScript = 1
      gLastLoadingScript = gLoadingScript
    }
    this.script = gLoadingScript
    this.groupName = gGroupName
    this.testNoWithinScript = gTestCountWithinScript
    gTestCountWithinScript++
  }

  until(aTest) {
    this.untilTest = aTest
    removeFromArray(gTests, aTest)
  }

  shouldSkip() {
    if ( global.stopAfterTestNo && (this.testNo > global.stopAfterTestNo) ) {
      if ( ! global.loggedTestNoStop ) {
        global.loggedTestNoStop = true
        Gatherer.report()
        console.log("STOPPING AFTER TEST " + global.stopAfterTestNo + " AS REQUESTED")
      }
      return true
    }
    if ( global.chapter ) {
      if ( this.type === 'chapter' )
        return false
      if ( global.inChapter !== global.chapter ) {
        if ( global.didChapter ) {
          if ( ! global.loggedChapterStop ) {
            global.loggedChapterStop = true
            Gatherer.report()
            console.log("STOPPING AFTER CHAPTER " + global.chapter)
          }
        }
        return true
      }
      global.didChapter = true
    }
    if ( ! global.startWithTest )
      return false
    if ( global.reachedStartScript )
      return false
    if ( this.script && this.script.startsWith(global.startWithTest) ) {
      global.reachedStartScript = true
      return false
    }
    return true
  }

  isComplete() {
    if ( START_AT > this.testNo ) {
      console.log("SKIPPING TEST " + this.testNo)
      return true
    }
    if ( this.untilTest ) {
      try {
        var res = this.untilTest.theFunction()
      } catch(e) {
        console.log("***EXCEPTION IN UNTIL: " + e.message);
        return true
      }
      return res
    }
    return this.ranCount > 0
  }

  getDesc() {
    let args = this.argVals
    if ( typeof args === 'undefined' )
      args = ''
    if ( (typeof args === 'string') && args )
      args = '"' + args + '"'
    let res = this.testNo + " of " + gOrigTestCount + " - " + this.targetString + "." + this.type + "(" + args + ")" 
    if ( this.groupName === "All" )
      res = this.testNo + " of " + gOrigTestCount + 
        " (" + this.script + "/" + this.testNoWithinScript + ") - " + 
        this.targetString + "." + this.type + "(" + args + ")" 
    return res
  }
}

String.prototype.queueTest = function(aType, aFn, aArgVals) {
  let test = new Test(aFn, this, aType, aArgVals)
  gTests.push(test)
  /* KEEP
  let chkTest = new Test(global.gHelper.checkForInventoryDuplicates, this, "invdup")
  gTests.push(chkTest)
  */
  return test
}

String.prototype.back = function() {
  return this.queueTest("back",
    () => {
      this.chk(this === "browser")
      global.doingBrowserBack = true
      window.history.back()
    }
  )
}

String.prototype._forEach = function(aCondition, aOptions) {
  return this.queueTest("_forEach",
    () => {
      let c = this.toControl(); this.chk(c)
      startForEach(c, aCondition, aOptions)
    },
    aCondition
  )
}

String.prototype.endForEach = function() {
  return this.queueTest("endForEach",
    () => {
      let c = this.toControl(); this.chk(c)
      endForEach(c)
    }
  )
}

String.prototype.click = function(aLevel) {
  
  let getControl = () => {
    let c = this.toControl(aLevel);
    if ( (! c ) && (aLevel !== "doc") )
      c = this.toControl("doc")
    return c
  }

  if ( global.testDelay ) {
    this.queueTest("scrollIntoView",
      () => {
        let c = getControl(); if ( ! c ) return
        myScrollTo(c)
      }
    )
  }

  if ( global.testDelay ) {
    this.queueTest("highlight",
      () => {
        let c = getControl(); if ( ! c ) return
        c.classList.add('prfiHighlight')
        global.sleepUntilMs = global.nowMs() + parseInt(global.testDelay, 10)
      }
    )
    this.queueTest("unhighlight",
      () => {
        let c = getControl(); if ( ! c ) return
        c.classList.remove('prfiHighlight')
      }
    )
  }

  return this.queueTest("click",
    () => {
      //let c = this.toControl(aLevel);
      //if ( (! c ) && (aLevel !== "doc") )
        //c = this.toControl("doc")
      let c = getControl()
      this.chk(c)
      if ( tagIs(c, "td") )
        c = c.firstChild
      click(c)
    }
  )
}

String.prototype.clickDropdown = function() {
  return this.queueTest("clickDropdown",
    () => {
      let c = this.toControl();
      this.chk(c)
      clickDropdown(c)
    }
  )
}

String.prototype.chooseOption = function(aVal) {
  
  let getControl = () => {
    let c = this.toInputControl(); 
    if ( ! c ) {
      c = this.toControl({tagName: "input"})
    }
    return c
  }

  if ( global.testDelay ) {
    this.queueTest("scrollIntoView",
      () => {
        let c = getControl(); if ( ! c ) return
        myScrollTo(c)
      }
    )
  }

  let res = this.queueTest("chooseOption",
    () => {
/*
      let c = this.toInputControl(); 
      if ( ! c ) {
        c = this.toControl({tagName: "input"})
      }
*/
      let c = getControl()
      this.chk(c)
      enter(c, aVal)
    },
    aVal
  )

  if ( global.testDelay ) {
    this.queueTest("highlight",
      () => {
        let c = getControl(); if ( ! c ) return
        c.classList.add('prfiHighlight')
        global.sleepUntilMs = global.nowMs() + parseInt(global.testDelay, 10)
      }
    )
    this.queueTest("unhighlight",
      () => {
        let c = getControl(); if ( ! c ) return
        c.classList.remove('prfiHighlight')
      }
    )
  }

  return res
}

String.prototype.toggle = function() {
  return this.queueTest("toggle",
    () => {
      let c = this.toInputControl(); 
      if ( ! c ) {
        c = this.toControl({tagName: "input"})
      }
      this.chk(c)
      if ( c.value === 'No' )
        chooseOption(c, 'Yes')
      else
        chooseOption(c, 'No')
    }
  )
}

String.prototype.toggleTick = function() {
  return this.queueTest("toggleTick",
    () => {
      let c = this.toInputControl(); 
      if ( ! c ) {
        c = this.toControl({tagName: "input"})
      }
      this.chk(c)
      toggleTick(c)
    }
  )
}

String.prototype.useExportedJsonData = function() {
  return this.queueTest("useJson",
    () => {
      let c = this.toInputControl(); 
      if ( ! c ) {
        c = this.toControl({tagName: "input"})
      }
      this.chk(c)
      if ( ! global._testJsons )
        global._testJsons = {}
      global._testJsons[this + ''] = global.exportedJsonData
    }
  )
}

String.prototype.enter = function(aVal) {

  let getControl = () => {
    let c = this.toInputControl(); 
    if ( ! c ) {
      c = this.toControl({tagName: "input"})
      if ( ! c ) {
        c = this.toControl({tagName: "textarea"})
      }
    }
    return c
  }

  if ( global.testDelay ) {
    this.queueTest("scrollIntoView",
      () => {
        let c = getControl(); if ( ! c ) return
        myScrollTo(c)
      }
    )
  }

  let res = this.queueTest("enter",
    () => {
/*
      let c = this.toInputControl(); 
      if ( ! c ) {
        c = this.toControl({tagName: "input"})
        if ( ! c ) {
          c = this.toControl({tagName: "textarea"})
        }
      }
*/
      let c = getControl()
      this.chk(c)
      enter(c, aVal)
    },
    aVal
  )

  if ( global.testDelay ) {
    this.queueTest("highlight",
      () => {
        let c = getControl(); if ( ! c ) return
        c.classList.add('prfiHighlight')
        global.sleepUntilMs = global.nowMs() + parseInt(global.testDelay, 10)
      }
    )
    this.queueTest("unhighlight",
      () => {
        let c = getControl(); if ( ! c ) return
        c.classList.remove('prfiHighlight')
      }
    )
  }

  return res
}

String.prototype.removeInputLine = function(aVal) {
  return this.queueTest("removeInputLine",
    () => {
      let c = this.toControl({tagName: "textarea"})
      this.chk(c)
      let val = c.value
      val = val.removeLine(aVal)
      enter(c, val)
    },
    aVal
  )
}

String.prototype.replaceInInput = function(aFrom, aTo) {
  return this.queueTest("replaceInInput",
    () => {
      let c = this.toControl({tagName: "textarea"})
      this.chk(c)
      let val = c.value
      val = val.replaceAll(aFrom, aTo)
      enter(c, val)
    },
    aFrom
  )
}

String.prototype.alterInputLine = function(aLine, aVal) {
  return this.queueTest("alterInputLine",
    () => {
      let c = this.toControl({tagName: "textarea"})
      this.chk(c)
      let val = c.value
      val = val.alterLine(aLine, aVal)
      enter(c, val)
    },
    aVal
  )
}

String.prototype.inputLineShouldEqual = function(aLine, aVal) {
  return this.queueTest("inputLineShouldEqual",
    () => {
      let c = this.toControl({tagName: "textarea"})
      this.chk(c)
      let val = c.value
      let lineStr = val.indexToLineStr(aLine)
      this.chkEqual(aVal, lineStr)
    },
    aVal
  )
}

String.prototype.addLine = function(aVal) {
  return this.queueTest("addLine",
    () => {
      let c = this.toControl({tagName: "textarea"})
      this.chk(c)
      let val = c.value
      if ( ! val.endsWith("\n") )
        val += "\n"
      val += aVal + "\n"
      enter(c, val)
    },
    aVal
  )
}

String.prototype.key = function(aVal) {
  return this.queueTest("key",
    () => {
      if ( (aVal.length !== 1) && (aVal !== "<Backspace>") ) myThrow("Only a single character can be passed to the key function")
      let c = this.toInputControl(); 
      if ( ! c ) {
        c = this.toControl({tagName: "input"})
      }
      this.chk(c)
      key(c, aVal)
    },
    aVal
  )
}

String.prototype.enterExpression = function(aVal) {

  let getControl = () => {
    let c = this.toInputControl(); 
    if ( ! c )
      c = this.toControl({tagName: "input"})
    return c
  }

  if ( global.testDelay ) {
    this.queueTest("scrollIntoView",
      () => {
        let c = getControl(); if ( ! c ) return
        myScrollTo(c)
      }
    )
  }

  let res = this.queueTest("enterExpression",
    () => {
/*
      let c = this.toInputControl(); 
      if ( ! c )
        c = this.toControl({tagName: "input"})
*/
      let c = getControl()
      this.chk(c)
      enterExpression(c, aVal)
    },
    aVal
  )

  if ( global.testDelay ) {
    this.queueTest("highlight",
      () => {
        let c = getControl(); if ( ! c ) return
        c.classList.add('prfiHighlight')
        global.sleepUntilMs = global.nowMs() + parseInt(global.testDelay, 10)
      }
    )
    this.queueTest("unhighlight",
      () => {
        let c = getControl(); if ( ! c ) return
        c.classList.remove('prfiHighlight')
      }
    )
  }

  return res
}

function elementToLeafValue(aEl) {
  let el = aEl
  let leaf = el
  while ( el ) {
    el = el.firstChild
    if ( el )
      leaf = el
  }
  return leaf.value || ''
}

function controlAndIndexToRow(aCtrl, aIdx) {
  let res = aCtrl.rows[aIdx]
  return res
}

function controlAndSearchToRow(aCtrl, aSearchStr) {
  let res
  let s = aSearchStr.substr(1, aSearchStr.length - 2)
  s = s.translate({noGather: true})
  forAll(aCtrl.rows).do(row => {
    let el = xpathToElement(".//*[text()='" + s + "']", row)
    if ( el ) {
      res = row
      return 'break'
    }
  })
  return res
}

function isNumber(aVal) {
  return ! isNaN(aVal)
}

function elementInViewport(aElement) {
  let rect = aElement.getBoundingClientRect()
  let h = window.innerHeight || document.documentElement.clientHeight
  let w = window.innerWidth || document.documentElement.clientWidth
  return (
    rect.bottom > 0 &&
    rect.right > 0 &&
    rect.top < h &&
    rect.left < w
  )
}

function grandparent(aEl, aLevels) {
  let par = aEl.parentNode
  let levelsLeft = aLevels - 1
  while ( par && levelsLeft > 0 ) {
    par = par.parentNode; if ( ! par ) return null
    levelsLeft--
  }
  return par
}

function grandparentClassList(aEl, aLevels) {
  let gp = grandparent(aEl, aLevels); if ( ! gp ) return []
  return gp.classList
}

String.prototype.toSubcontrol = function(aParent) {
  if ( aParent && isNumber(this) )
    return controlAndIndexToRow(aParent, Number(this))
  if ( aParent && (this === "<last>") ) {
    let row = aParent.rows[aParent.rows.length - 1]
    return row
  }
  if ( aParent && (this === "<columnHeadings>") )
    return aParent.previousSibling
  if ( aParent && this.startsWith("/") )
    return controlAndSearchToRow(aParent, this)
  let id = this.toId()
  let contextNode = aParent ? aParent : document
  let res = xpathToElement('.//*[@name="stocktend_' + id + '"]', contextNode)
  if ( res ) return res
  res = xpathToElement('.//*[@id="' + id + '"]', contextNode)
  if ( res ) return res
  res = xpathToElement(".//*[text()='" + this + "']", contextNode)
  if ( (! res) && aParent && tagIs(aParent, "tr") ) 
    res = rowAndSearchToElement(aParent, this)
  if ( res && res.classList.contains("stGridTitle") ) {
    res = res.nextSibling
    if ( ! res.classList.contains("table") )
      res = res.nextSibling
    res = res.firstChild.nextSibling // tbody of table
  }
  if ( res && res.classList.contains("stPageTitleText") ) {
    let cl = grandparentClassList(res, 3)
    if ( cl.contains("prfiTile") ) {
      res = grandparent(res, 3)
    }
  }
  return res
}

function rowToHeadRow(aRow) {
  let tbody = aRow.parentNode; if ( ! tbody ) return null
  let thead = tbody.previousSibling
  let tr = thead.firstChild
  return tr
}

function headRowAndSearchToIndex(aHeadRow, aSearch) {
  let el = xpathToElement(".//*[text()='" + aSearch + "']", aHeadRow); if ( ! el ) return -1
  return elementToIndexWithinParent(el.parentNode)
}

function rowAndSearchToElement(aRow, aSearch) {
  let headTR = rowToHeadRow(aRow); if ( ! headTR ) return null
  let idx = headRowAndSearchToIndex(headTR, aSearch); if ( idx < 0 ) return null
  let td = aRow.childNodes[idx]
  if ( td.firstChild )
    td = td.firstChild.firstChild // input
  if ( td.classList.contains('form-group') && td.firstChild )
    td = td.firstChild // input
  return td
}

function getStocktendRoot() {
  return xpathToElement('//*[@id="stocktend-root"]', document)
}

function tagIs(aElement, aTag) {
  return aElement.tagName.toLowerCase() === aTag.toLowerCase()
}

String.prototype.toControl = function(aOptions) {
  let str = this + ''
  let level
  if ( ! global.isObj(aOptions) )
    level = aOptions
  let substrs = str.split(".")
  var res = null
  var parent
  if ( global._usingPanel )
    parent = global._usingPanel
  else {
    if ( level !== 'doc' ) 
      parent = getStocktendRoot()
  }
  for (var i = 0; i < substrs.length; i++) {
    let substr = substrs[i]
    substr = substr.translate({noGather: true})
    res = null
    if ( (i === 0) && gFEElement ) {
      res = substr.toSubcontrol(gFEElement)
    }
    if ( ! res ) {
      res = substr.toSubcontrol(parent); 
      if ( ! res ) return null
    }
    parent = res
  }
  if ( res && (res.tagName.toLowerCase() === "label") ) {
    let el = res
    res = res.nextSibling
    if ( ! res ) {
      let ns = el.parentNode.nextSibling
      if ( ns )
        res = ns.firstChild // Text element - label and the element are both within divs
      else
        res = el
    }
    if ( res.classList.contains("stCombobox") )
      res = res.firstChild.firstChild
    if ( res.classList.contains("input-group") ) {
      res = res.firstChild // dates
    }
  }
  if ( res && global.isObj(aOptions) && aOptions.tagName ) {
    while ( res && ((! res.tagName) || (res.tagName.toLowerCase() !== aOptions.tagName.toLowerCase())) ) {
      res = res.firstChild
    }
  }
  return res
}

String.prototype.toInputControl = function() {
  let id = this.toId()
  let res = xpathToElement('//input[@id="' + id + '"]', document)
  return res
}

String.prototype.toSelectControl = function() {
  let id = this.toId()
  let res = xpathToElement('//select[@id="' + id + '"]', document)
  return res
}

String.prototype.shouldExist = function(aLevel) {
  return this.queueTest("shouldExist",
    () => {
      let c = this.toControl(aLevel); this.chk(c)
    }
  )
}

String.prototype.shouldHaveFocus = function(aLevel) {
  return this.queueTest("shouldHaveFocus",
    () => {
      let c = this.toControl(aLevel); this.chk(c)
      this.chk(c === document.activeElement)
    }
  )
}

String.prototype.shouldntExist = function(aLevel) {
  return this.queueTest("shouldntExist",
    () => {
      let c = this.toControl(aLevel); this.chk(! c)
    }
  )
}

String.prototype.scrollIntoView = function() {
  return this.queueTest("scrollIntoView",
    () => {
      let c = this.toControl(); this.chk(c)
      c.scrollIntoView(c)
    }
  )
}

String.prototype.shouldBeInView = function() {
  return this.queueTest("shouldBeInView",
    () => {
      let c = this.toControl(); this.chk(c)
      this.chk(elementInViewport(c))
    }
  )
}

String.prototype.shouldntBeInView = function() {
  return this.queueTest("shouldntBeInView",
    () => {
      let c = this.toControl(); this.chk(c)
      this.chk(! elementInViewport(c))
    }
  )
}

String.prototype.shouldHaveCount = function(aCount) {
  return this.queueTest("shouldHaveCount",
    () => {
      let c = this.toControl(); this.chk(c)
      this.chkEqual(c.rows.length, aCount)
    },
    aCount
  )
}

let gScrolling = false

String.prototype.scrollToEnd = function() {
  return this.queueTest("scrollToEnd",
    () => {
      let c = this.toControl(); this.chk(c)
      gScrolling = true
      let scrollDown = () => {
        let el = document.getElementById("stFillin0")
        if ( el ) {
          el.scrollIntoView()
          setTimeout(scrollDown, 50)
        } else {
          gScrolling = false
        }
      }
      setTimeout(scrollDown, 50)
    }
  )
}

String.prototype.shouldHaveCountGreaterThan = function(aCount) {
  return this.queueTest("shouldHaveCountGreaterThan",
    () => {
      let c = this.toControl(); this.chk(c)
      if ( c.rows.length <= aCount ) 
        myThrow("Count is: " + c.rows.length + " but should be greater than " + aCount)
    },
    aCount
  )
}

String.prototype.shouldBeEmpty = function() {
  return this.queueTest("shouldBeEmpty",
    () => {
      let c = this.toControl(); this.chk(c)
      this.chkEqual(c.rows.length, 0)
    }
  )
}

String.prototype.isEmpty = function() {
  return this.queueTest("isEmpty",
    () => {
      let c = this.toControl(); this.chk(c)
      return (c.rows.length === 0)
    }
  )
}

String.prototype.shouldBeCurrentPage = function() {
  return this.queueTest("shouldBeCurrentPage",
    () => {
      let c = "stPageTitleText".toControl(); 
      if ( this === '' )
        this.chk(! c)
      else {
        this.chk(c)
        if ( (this.translate() === "Home".translate()) && (! c.innerText) ) return
        this.chk(c.innerText.translate({noGather: true}) === this.translate({noGather: true}))
      }
    }
  )
}

String.prototype.shouldBeTicked = function() {
  return this.queueTest("shouldBeTicked",
    () => {
      let c = this.toControl(); this.chk(c)
      let val = c.value
      this.chk(val)
    }
  )
}

String.prototype.shouldntBeTicked = function() {
  return this.queueTest("shouldntBeTicked",
    () => {
      let c = this.toControl(); this.chk(c)
      let val = c.value
      this.chk(! val)
    }
  )
}

String.prototype.shouldntEqual = function(aVal) {
  return this.queueTest("shouldntEqual",
    () => {
      if ( ! global.isString(aVal) ) myThrow("shouldntEqual - parameter must be a String")
      let c = this.toControl(); this.chk(c)
      let val = c.value
      if ( (! val) && ! (c instanceof HTMLSelectElement) ) 
        val = c.innerText
      this.chk(val !== cookTestVal(aVal))
    },
    aVal
  )
}

String.prototype.shouldBeUnticked = function() {
  return this.queueTest("shouldBeUnticked",
    () => {
      let c = this.toControl(); 
      this.chk(c)
      this.chk(c.checked === false)
    }
  )
}

String.prototype.shouldBeTicked = function() {
  return this.queueTest("shouldBeTicked",
    () => {
      let c = this.toControl(); 
      this.chk(c)
      this.chk(c.checked === true)
    }
  )
}

String.prototype.shouldBeBetween = function(aVal, aVal2, aLevel) {
  return this.queueTest("shouldBeBetween",
    () => {
      let c = this.toControl(aLevel);
      this.chk(c)
      let val = c.value
      if ( (! val) && ! (c instanceof HTMLSelectElement) )
        val = c.innerText
      if ( ! val )
        val = elementToLeafValue(c)
      this.chk((val >= cookTestVal(aVal)) && (val <= cookTestVal(aVal2)))
    },
    aVal
  )
}

String.prototype.attributeShouldContain = function(aAttrName, aVal, aLevel) {
  return this.queueTest("attributeShouldContain",
    () => {
      if ( ! global.isString(aVal) ) myThrow("attributeShouldContain - parameter must be a String")
      let c = this.toControl(aLevel); 
      this.chk(c)
      let val = c.getAttribute(aAttrName)
      this.chk(val.indexOf(cookTestVal(aVal)) >= 0)
    },
    aVal
  )
}

String.prototype.shouldEqual = function(aVal, aLevel, aOptions) {
  return this.queueTest("shouldEqual",
    () => {
      if ( aOptions && aOptions.englishOnly && (global.getLanguage() !== 'EN') ) return
      if ( ! global.isString(aVal) ) myThrow("shouldEqual - parameter must be a String")
      let c = this.toControl(aLevel); 
      if ( c && c.className.indexOf("stCombobox") >= 0 )
        c = this.toControl({tagName: "input"})
      this.chk(c)
      let val = c.value
      if ( (! val) && ! (c instanceof HTMLSelectElement) ) 
        val = c.innerText
      if ( ! val ) {
        val = elementToLeafValue(c)
      }
      this.chkEqual(val, cookTestVal(aVal))
    },
    aVal
  )
}

String.prototype.shouldContain = function(aVal, aLevel, aOptions) {
  return this.queueTest("shouldContain",
    () => {
      if ( aOptions && aOptions.englishOnly && (global.getLanguage() !== 'EN') ) return
      if ( ! global.isString(aVal) ) myThrow("shouldContain - parameter must be a String")
      let c = this.toControl(aLevel); 
      this.chk(c)
      let val = c.value
      if ( (! val) && ! (c instanceof HTMLSelectElement) ) 
        val = c.innerText
      this.chk(val.indexOf(cookTestVal(aVal.translate({noGather: true}))) >= 0)
    },
    aVal
  )
}

String.prototype.shouldIndicateSortAscending = function() {
  return this.queueTest("shouldIndicateSortAscending",
    () => {
      let path = this + ".stTHSorterAsc"
      let c = path.toControl(); 
      if ( ! c ) {
        c = this.toControl();
        this.chk(c)
        if ( c.nextSibling && c.nextSibling.classList.contains("stTHSorterAsc") )
          return
        if ( c.prevSibling && c.prevSibling.classList.contains("stTHSorterAsc") )
          return
      }
      this.chk(c)
    }
  )
}

String.prototype.shouldIndicateSortDescending = function() {
  return this.queueTest("shouldIndicateSortDescending",
    () => {
      let path = this + ".stTHSorterDesc"
      let c = path.toControl()
      if ( ! c ) {
        c = this.toControl();
        this.chk(c)
        if ( c.nextSibling && c.nextSibling.classList.contains("stTHSorterDesc") )
          return
        if ( c.prevSibling && c.prevSibling.classList.contains("stTHSorterDesc") )
          return
      }
      this.chk(c)
    }
  )
}

String.prototype.shouldntIndicateSort = function() {
  return this.queueTest("shouldntIndicateSort",
    () => {
      let path = this + ".stTHSorterAsc"
      let c = path.toControl(); this.chk(! c)
      path = this + ".stTHSorterDesc"
      c = path.toControl(); this.chk(! c)
    }
  )
}

String.prototype.shouldMatch = function(aVal) {
  return this.queueTest("shouldMatch",
    () => {
      if ( ! global.isString(aVal) ) myThrow("shouldMatch - parameter must be a String")
      let c = this.toControl(); this.chk(c)
      let val = c.value
      if ( (! val) && ! (c instanceof HTMLSelectElement) ) 
        val = c.innerText
      let re = new RegExp(aVal)
      if ( val.match(re) ) return
      myThrow("'" + this + "': shouldMatch failed: '" + val + "' does not match '" + aVal + "'")
    },
    aVal
  )
}

String.prototype.shouldContainExpression = function(aExpr) {
  return this.queueTest("shouldContainExpression",
    () => {
      if ( ! global.isString(aExpr) ) myThrow("shouldContainExpression - parameter must be a String")
      let c = this.toControl(); this.chk(c)
      let val = c.value
      if ( (! val) && ! (c instanceof HTMLSelectElement) ) 
        val = c.innerText
      let exprRes = eval(aExpr)
      this.chk(val.indexOf(cookTestVal(exprRes.translate({noGather: true}))) >= 0)
    },
    aExpr
  )
}

String.prototype.shouldEqualExpression = function(aExpr) {
  return this.queueTest("shouldEqualExpression",
    () => {
      if ( ! global.isString(aExpr) ) myThrow("shouldEqual - parameter must be a String")
      let c = this.toControl(); this.chk(c)
      let val = c.value
      if ( (! val) && ! (c instanceof HTMLSelectElement) ) 
        val = c.innerText
      let exprRes = eval(aExpr)
      this.chkEqual(val, exprRes)
    },
    aExpr
  )
}

String.prototype.shouldBeReadOnly = function(aVal) {
  return this.queueTest("shouldBeReadOnly",
    () => {
      let c = this.toInputControl(); 
      if ( ! c ) {
        c = this.toControl({tagName: "input"})
        if ( ! c )
          c = this.toControl({tagName: "textarea"})
      }
      this.chk(!c)
      c = this.toControl(); this.chk(c)
      this.chk(! (c instanceof HTMLSelectElement))
      this.chk(! (c instanceof HTMLInputElement))
    },
    aVal
  )
}

String.prototype.shouldntBeReadOnly = function(aVal) {
  return this.queueTest("shouldntBeReadOnly",
    () => {
      let c = this.toInputControl(); 
      if ( ! c ) {
        c = this.toControl({tagName: "input"})
        if ( ! c )
          c = this.toControl({tagName: "textarea"})
      }
      if ( c ) 
        return
      c = this.toControl()
      this.chk(c)
      this.chk((c instanceof HTMLSelectElement) || (c instanceof HTMLInputElement))
    },
    aVal
  )
}

String.prototype.shouldBeFieldNo = function(aVal) {
  return this.queueTest("shouldBeFieldNo",
    () => {
      let c = this.toControl(); this.chk(c)
      let no = elementToIndexWithinParent(c)
      this.chk(no === aVal)
    },
    aVal
  )
}

Element.prototype.isValid = function() {
  return (this.className.indexOf("is-invalid") < 0)
}

Element.prototype.isInvalid = function() {
  return ! this.isValid()
}

Element.prototype.isInvalidFeedback = function() {
  return this.className.indexOf("invalid-feedback") >= 0
}

String.prototype.shouldntHaveError = function() {
  return this.queueTest("shouldntHaveError",
    () => {
      let c = this.toControl(); this.chk(c)
      this.chk(c.isValid())
    }
  )
}

String.prototype.includes = function(aStr) {
  return (this.indexOf(aStr.toLowerCase()) >= 0)
}

function controlAndIndexToValue(aControl, index) {
  let table = controlToTableElement(aControl); if ( ! table ) throw(new Error("Element doesn't have a combo list"))
  let tbody = table.children[0]
  let rows = tbody.children
  let row = rows[index]
  let tds = row.children
  let td = tds[0]
  let text = td.innerHTML
  return text
}

function controlHasOption(aControl, aText) {
  let table = controlToTableElement(aControl); if ( ! table ) throw(new Error("Element doesn't have a combo list"))
  let tbody = table.children[0]
  let rows = tbody.children
  for ( var i = 0; i < rows.length; i++ ) {
    let row = rows[i]
    let tds = row.children
    for ( var j = 0; j < tds.length; j++ ) {
      let td = tds[j]
      let text = td.innerHTML
      if ( text === aText )
        return true
    }
  }
  return false
}

String.prototype.shouldHaveOption = function(aValue) {
  return this.queueTest("shouldHaveOption",
    () => {
      let c = this.toControl(); this.chk(c)
      this.chk(controlHasOption(c, aValue))
    },
    aValue
  )
}

String.prototype.shouldntHaveOption = function(aValue) {
  return this.queueTest("shouldntHaveOption",
    () => {
      let c = this.toControl(); this.chk(c)
      this.chk(! controlHasOption(c, aValue))
    },
    aValue
  )
}

String.prototype.optionShouldEqual = function(index, value) {
  return this.queueTest("optionShouldEqual",
    () => {
      let c = this.toControl(); this.chk(c)
      let cVal = controlAndIndexToValue(c, index)
      this.chkEqual(cVal, value)
    },
    value
  )
}

String.prototype.optionShouldContain = function(index, value) {
  return this.queueTest("optionShouldContain",
    () => {
      let c = this.toControl(); this.chk(c)
      let cVal = controlAndIndexToValue(c, index)
      this.chk(cVal.indexOf(cookTestVal(value.translate({noGather: true}))) >= 0)
    },
    value
  )
}

String.prototype.shouldHaveNOptions = function(aN) {
  return this.queueTest("shouldHaveNOptions",
    () => {
      let c = this.toControl(); this.chk(c)
      let no = controlToCount(c)
      this.chkEqual(no, aN)
    },
    aN
  )
}

String.prototype.usePanel = function(aErr) {
  return this.queueTest("usePanel",
    () => {
      let c = this.toControl(); this.chk(c)
      global._usingPanel = c.parentElement
    },
    aErr
  )
}

String.prototype.stopUsingPanel = function(aErr) {
  return this.queueTest("stopUsingPanel",
    () => {
      global._usingPanel = null
    },
    aErr
  )
}

String.prototype.shouldHaveError = function(aErr) {
  return this.queueTest("shouldHaveError",
    () => {
      let c = this.toControl(); this.chk(c)
      if ( c instanceof HTMLInputElement )
        this.chk(c.isInvalid())
      let msgCtrl = c.nextSibling; this.chk(msgCtrl)
      this.chk(msgCtrl.isInvalidFeedback())
      let err = aErr.translate({noGather: true})
      err = err.toLowerCase()
      let msg = msgCtrl.innerHTML.toLowerCase()
      if ( ! msg.includes(err) ) {
        myThrow("'" + this + "': check failed: error is '" + msgCtrl.innerHTML + "'")
      }
    },
    aErr
  )
}

String.prototype.checkNoDuplicateKeys = function() {
  return this.queueTest("checkNoDuplicateKeys",
    () => {
      if ( this !== "helper" ) myThrow("checkNoDuplicateKeys target must be helper")
      global.gHelper.checkNoDuplicateKeys()
    }
  )
}

String.prototype.sleepALittle = function() {
  return this.queueTest("sleepALittle",
    () => {
      if ( this !== "helper" ) myThrow("sleepALittle target must be helper")
      global.sleepUntilMs = global.nowMs() + 2000
    }
  )
}

String.prototype.suspendCaching = function() {
  return this.queueTest("suspendCaching",
    () => {
      if ( this !== "helper" ) myThrow("suspendCaching target must be helper")
      global.gHelper.suspendCaching()
    }
  )
}

String.prototype.unsuspendCaching = function() {
  return this.queueTest("unsuspendCaching",
    () => {
      if ( this !== "helper" ) myThrow("unsuspendCaching target must be helper")
      global.gHelper.unsuspendCaching()
    }
  )
}

String.prototype.untrashProduct = function(aName, aSKU) {
  return this.queueTest("untrashProduct",
    () => {
      if ( this !== "helper" ) myThrow("untrashProduct target must be helper")
      global.gHelper.untrashProduct(aName, aSKU)
    },
    aName
  )
}

String.prototype.adjustQtyWithDifferentForeman = function(aProductUniqueName, aLocationName, aQty) {
  return this.queueTest("adjustQtyWithDifferentForeman",
    () => {
      if ( this !== "helper" ) myThrow("adjustQtyWithDifferentForeman target must be helper")
      global.gHelper.adjustQtyWithDifferentForeman(aProductUniqueName, aLocationName, aQty)
    },
    aProductUniqueName
  )
}

String.prototype.trashOrderWithDifferentForeman = function(aProductUniqueName) {
  return this.queueTest("trashOrderWithDifferentForeman",
    () => {
      if ( this !== "helper" ) myThrow("trashOrderWithDifferentForeman target must be helper")
      global.gHelper.trashOrderWithDifferentForeman(aProductUniqueName)
    },
    aProductUniqueName
  )
}

String.prototype.trashOrderItemWithDifferentForeman = function(aProductUniqueName) {
  return this.queueTest("trashOrderItemWithDifferentForeman",
    () => {
      if ( this !== "helper" ) myThrow("trashOrderItemWithDifferentForeman target must be helper")
      global.gHelper.trashOrderItemWithDifferentForeman(aProductUniqueName)
    },
    aProductUniqueName
  )
}

String.prototype.trashProductWithDifferentForeman = function(aUniqueName) {
  return this.queueTest("trashProductWithDifferentForeman",
    () => {
      if ( this !== "helper" ) myThrow("trashProductWithDifferentForeman target must be helper")
      global.gHelper.trashProductWithDifferentForeman(aUniqueName)
    },
    aUniqueName
  )
}

String.prototype.trashSupplierWithDifferentForeman = function(aName) {
  return this.queueTest("trashSupplierWithDifferentForeman",
    () => {
      if ( this !== "helper" ) myThrow("trashSupplierWithDifferentForeman target must be helper")
      global.gHelper.trashSupplierWithDifferentForeman(aName)
    },
    aName
  )
}

String.prototype.setProductSkuWithDifferentForeman = function(aName, aValue) {
  return this.queueTest("setProductSkuWithDifferentForeman",
    () => {
      if ( this !== "helper" ) myThrow("setProductSkuWithDifferentForeman target must be helper")
      global.gHelper.setProductSkuWithDifferentForeman(aName, aValue)
    },
    aName
  )
}

String.prototype.setProductLastCostWithDifferentForeman = function(aUniqueName, aValue) {
  return this.queueTest("setProductLastCostWithDifferentForeman",
    () => {
      if ( this !== "helper" ) myThrow("setProductLastCostWithDifferentForeman target must be helper")
      global.gHelper.setProductLastCostWithDifferentForeman(aUniqueName, aValue)
    },
    aUniqueName
  )
}

String.prototype.setProductBarcodeWithDifferentForeman = function(aUniqueName, aValue) {
  return this.queueTest("setBarcodeWithDifferentForeman",
    () => {
      if ( this !== "helper" ) myThrow("setProductBarcodeWithDifferentForeman target must be helper")
      global.gHelper.setProductBarcodeWithDifferentForeman(aUniqueName, aValue)
    },
    aUniqueName
  )
}

String.prototype.addToExportedJsonData = function(aParms) {
  return this.queueTest("addToExportedJsonData",
    () => {
      if ( this !== "helper" ) myThrow("addToExportedJsonData target must be helper")
      global.gHelper.addToExportedJsonData(aParms)
    },
    aParms
  )
}

String.prototype.alterExportedJsonData = function(aParms) {
  return this.queueTest("alterExportedJsonData",
    () => {
      if ( this !== "helper" ) myThrow("alterExportedJsonData target must be helper")
      global.gHelper.alterExportedJsonData(aParms)
    },
    aParms
  )
}

String.prototype.deletePrfiObjects = function() {
  return this.queueTest("deletePrfiObjects",
    () => {
      if ( this !== "helper" ) myThrow("deletePrfiObjects target must be helper")
      global.gHelper.deletePrfiObjects()
    }
  )
}

String.prototype.monitorRetrieves = function(opt) {
  return this.queueTest("monitorRetrieves",
    () => {
      if ( this !== "helper" ) myThrow("monitorRetrieves target must be helper")
      global.gHelper.monitorRetrieves(opt)
    },
    opt
  )
}

String.prototype.trashAll = function(aDatatype) {
  return this.queueTest("trashAll",
    () => {
      if ( this !== "helper" ) myThrow("trashAll target must be helper")
      global.gHelper.trashAll(aDatatype)
    },
    aDatatype
  )
}

String.prototype.flushCache = function() {
  return this.queueTest("flushCache",
    () => {
      if ( this !== "helper" ) myThrow("flushCache target must be helper")
      global.gHelper.flushCache()
    }
  )
}

String.prototype.chapter = function() {
  return this.queueTest("chapter",
    () => {
      global.inChapter = this
    }
  )
}

String.prototype.simulateBrowserRefresh = function() {
  return this.queueTest("simulateBrowserRefresh",
    () => {
      if ( this !== "helper" ) myThrow("simulateBrowserRefresh target must be helper")
      global.gHelper.simulateBrowserRefresh()
    }
  )
}

String.prototype.emulateDaysInFuture = function(aVersion) {
  return this.queueTest("emulateDaysInFuture",
    () => {
      if ( this !== "helper" ) myThrow("emulateDaysInFuture target must be helper")
      global.gHelper.emulateDaysInFuture(aVersion)
    },
    aVersion
  )
}

String.prototype.emulateVersion = function(aVersion) {
  return this.queueTest("emulateVersion",
    () => {
      if ( this !== "helper" ) myThrow("emulateVersion target must be helper")
      global.gHelper.emulateVersion(aVersion)
    },
    aVersion
  )
}

String.prototype.setWCLowStockAmount = function(aProduct, aQty) {
  return this.queueTest("setWCLowStockAmount",
    () => {
      if ( this !== "helper" ) myThrow("setWCLowStockAmount target must be helper")
      global.gHelper.setWCLowStockAmount(aProduct, aQty)
    },
    aQty
  )
}

String.prototype.clearLastPurchaseCosts = function() {
  return this.queueTest("clearLastPurchaseCosts",
    () => {
      if ( this !== "helper" ) myThrow("clearLastPurchaseCosts target must be helper")
      global.gHelper.clearLastPurchaseCosts()
    }
  )
}

String.prototype.setWCStockLevel = function(aProduct, aQty, aOptions) {
  return this.queueTest("setWCStockLevel",
    () => {
      if ( this !== "helper" ) myThrow("setWCStockLevel target must be helper")
      global.gHelper.setWCStockLevel(aProduct, aQty, aOptions)
    },
    aQty
  )
}

String.prototype.checkWCLowStockAmount = function(aProduct, aQty) {
  return this.queueTest("checkWCLowStockAmount",
    () => {
      if ( this !== "helper" ) myThrow("checkWCLowStockAmount target must be helper")
      global.gHelper.checkWCLowStockAmount(aProduct, aQty)
    },
    aQty
  )
}

String.prototype.checkNoNegativeIds = function() {
  return this.queueTest("checkNoNegativeIds",
    () => {
      if ( this !== "helper" ) myThrow("checkNoNegativeIds target must be helper")
      global.gHelper.checkNoNegativeIds()
    }
  )
}

String.prototype.checkWCStockLevel = function(aProduct, aQty, option) {
  return this.queueTest("checkWCStockLevel",
    () => {
      if ( this !== "helper" ) myThrow("checkWCStockLevel target must be helper")
      global.gHelper.checkWCStockLevel(aProduct, aQty, option)
    },
    aQty
  )
}

String.prototype.generateDBErrorOnNextSave = function(aOptions) {
  return this.queueTest("generateDBErrorOnNextSave",
    () => {
      if ( this !== "helper" ) myThrow("generateDBErrorOnNextSave target must be helper")
      global.gHelper.generateDBErrorOnNextSave(aOptions)
    }
  )
}

String.prototype.generateErrorOnNextPreSave = function() {
  return this.queueTest("generateErrorOnNextPreSave",
    () => {
      if ( this !== "helper" ) myThrow("generateErrorOnNextPreSave target must be helper")
      global.gHelper.generateErrorOnNextPreSave()
    }
  )
}

String.prototype.generateErrorOnNextSave = function() {
  return this.queueTest("generateErrorOnNextSave",
    () => {
      if ( this !== "helper" ) myThrow("generateErrorOnNextSave target must be helper")
      global.gHelper.generateErrorOnNextSave()
    }
  )
}

String.prototype.deoptimizeDatabase = function() {
  return this.queueTest("deoptimizeDatabase",
    () => {
      if ( this !== "helper" ) myThrow("deoptimizeDatabase target must be helper")
      global.gHelper.deoptimizeDatabase()
    }
  )
}

String.prototype.clearWCStockLevels = function() {
  return this.queueTest("clearWCStockLevels",
    () => {
      if ( this !== "helper" ) myThrow("clearWCStockLevels target must be helper")
      global.gHelper.clearWCStockLevels()
    }
  )
}

String.prototype.setWCOrderStatus = function(opt) {
  return this.queueTest("setWCOrderStatus",
    () => {
      if ( this !== "helper" ) myThrow("setWCOrderStatus target must be helper")
      global.gHelper.setWCOrderStatus(opt)
    }
  )
}

String.prototype.addProduct = function(aParms) {
  return this.queueTest("addProduct",
    () => {
      if ( this !== "helper" ) myThrow("addProduct target must be helper")
      global.gHelper.addProduct(aParms)
    }
  )
}

String.prototype.addWCOrderItem = function(aParms) {
  return this.queueTest("addWCOrderItem",
    () => {
      if ( this !== "helper" ) myThrow("addWCOrderItem target must be helper")
      global.gHelper.addWCOrderItem(aParms)
    }
  )
}

String.prototype.addWCOrder = function(aParms) {
  return this.queueTest("addWCOrder",
    () => {
      if ( this !== "helper" ) myThrow("addWCOrder target must be helper")
      global.gHelper.addWCOrder(aParms)
    }
  )
}

String.prototype.clearWCOrders = function() {
  return this.queueTest("clearWCOrders",
    () => {
      if ( this !== "helper" ) myThrow("clearWCOrders target must be helper")
      global.gHelper.clearWCOrders()
    }
  )
}

String.prototype.clearInstalledFlag = function() {
  return this.queueTest("clearInstalledFlag",
    () => {
      if ( this !== "helper" ) myThrow("clearInstalledFlag target must be helper")
      global.gHelper.clearInstalledFlag()
    }
  )
}

String.prototype.simulateScannerRead = function(aText) {
  return this.queueTest("simulateScannerRead",
    () => {
      if ( this !== "helper" ) myThrow("simulateScannerRead target must be helper")
      simulateScannerRead(aText)
    }
  )
}

Array.prototype.appendArray = function(aArray) {
  forAll(aArray).do(el => this.push(el))
}


export default Tester

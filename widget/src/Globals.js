import { forAll } from './Functions.js'
import Gatherer from './Gatherer.js'
import Translator from './Translator.js'
const {Parser} = require("acorn")

/* eslint-disable no-extend-native */

String.prototype.isEmptyYMD = function() {
  return this === global.emptyYMD()
}

String.prototype.abbreviate = function(len) {
  var res = this + ''
  if ( res.length <= len ) 
    return res
  res = res.substr(0, len - 3) + '...'
  return res
}

Array.prototype.__ = function(aArray) {
  if ( ! this.__prfiIndex )
    this.__prfiIndex = 0
  if ( this.length <= this.__prfiIndex ) 
    return null
  let res = this[this.__prfiIndex]
  this.__prfiIndex++
  return res
}

Array.prototype.appendArray = function(aArray) {
  forAll(aArray).do(el => this.push(el))
}

Array.prototype.first = function() {
  if ( this.length === 0 ) return null
  return this[0]
}

Array.prototype.firstN = function(aN) {
  let res = []
  let knt = aN
  if ( this.length < knt )
    knt = this.length
  for ( var i = 0; i < knt; i++ ) {
    let obj = this[i]
    res.push(obj)
  }
  return res
}

Array.prototype.lastButOne = function() {
  if ( this.length < 2 ) return null
  return this[this.length - 2]
}

Array.prototype.last = function() {
  if ( this.length === 0 ) return null
  return this[this.length - 1]
}

Array.prototype.all = function(aFn) {
  let res = true
  forAll(this).do(el => {
    let b = aFn(el)
    if ( ! b ) {
      res = false
      return 'break'
    }
  })
  return res
}

Array.prototype.some = function(aFn) {
  let res = false
  forAll(this).do(el => {
    let b = aFn(el)
    if ( b ) {
      res = true
      return 'break'
    }
  })
  return res
}

Array.prototype.contains = function(aEl) {
  return this.some(el => el === aEl)
}

Array.prototype.exists = function(aFn) {
  return this.some(aFn)
}

Array.prototype.none = function(aFn) {
  return ! this.some(aFn)
}

Array.prototype.removeElement = function(aEl) {
  let idx = this.indexOf(aEl); if ( idx < 0 ) return 
  this.splice(idx, 1);
}

Array.prototype.removeByIndex = function(aIdx) {
  this.splice(aIdx, 1);
}

Array.prototype.removeAfterElement = function(aEl) {
  let idx = this.indexOf(aEl); if ( idx < 0 ) return 
  if ( idx === (this.length - 1) ) return
  this.splice(idx + 1, this.length - idx);
}

Array.prototype.filterSingle = function(aFn) {
  let res = this.filter(aFn)
  if ( res.length === 0 ) return null
  return res[0]
}

Array.prototype.mapJoin = function(aFn, aSep) {
  let res = ''
  this.forAll(el => {
    if ( res !== '' ) res = res + aSep
    res = res + aFn(el)
  })
  return res
}

Array.prototype.sum = function(aFn) {
  let res = 0
  this.forAll(el => {
    res += aFn(el)
  })
  return res
}

Array.prototype.forAll = function(aFn) {
  let coll = this
  for ( var i = 0; i < coll.length; i++ ) {
    let el = coll[i]
    let res = aFn(el)
    if ( res === "continue" ) continue
    if ( res === "break" ) break
  }
}

Array.prototype.forAllAsync = async function(aFn) {
  let coll = this
  for ( var i = 0; i < coll.length; i++ ) {
    let el = coll[i]
    let res = await aFn(el)
    if ( res === "continue" ) continue
    if ( res === "break" ) break
  }
}

global.fastFail = res => {
  if ( res === 0 ) return false
  if ( ! res ) return true
  if ( res === 'na' ) return true
  return false
}

global.enterInchesForLabels = () => {
  return global.confVal('lun') === 'in'
}

global.enterMmForLabels = () => {
  return ! global.enterInchesForLabels()
}

global.inchesToMm = inches => {
  if ( ! inches ) return 0
  return global.roundToXDecimals(inches * 25.4, 1)
}

global.mmToInches = mm => {
  if ( ! mm ) return 0
  return global.roundToXDecimals(mm / 25.4, 3)
}

global.useOrderDateForProfitReporting = () => {
  let prDateType = global.confVal('prDateType')
  if ( ! prDateType )
    return false
  return prDateType === 'Order Date'
}

global.loggedInUserHasAccessToSpec = specName => {
  if ( global.confVal('controlAccessAtPageLevel') !== 'Yes' )
    return true
  let sess = 'session'.bringSingleFast()
  if ( global.fastFail(sess) )
    return false
  let isAdmin = sess.userHasAdminRights
  if ( isAdmin )
    return true
  let cookedSpecName = specName.stripRight('.js')
  let specConfig = 'SpecConfig'.bringSingleFast({specName: cookedSpecName})
  if ( global.fastFail(specConfig) )
    return false
  let users = specConfig.usersWithAccessToSpec
  if ( ! users )
    return true
  let loggedInUser = global.gApp.user
  users = "," + users.replace(" ", "") + ","
  if ( users.indexOf("," + loggedInUser + ",") < 0 )
    return false
  return true
}

global.confVal = prop => {
  let c
  try {
    c = 'Configuration'.bringSingleFast(); if ( ! c ) return null
  } catch {
    return null // In case Configuration mold does not exist yet, eg when first creating nucleus
  }
  return c[prop]
}

global.lg = (aMsg) => {
  console.log(aMsg)
}

global.mergeObjects = (aTo, aFrom) => {
  for ( var prop in aFrom ) {
    aTo[prop] = aFrom[prop]
  }
  return aTo
}

global.runningOutsideWP = () => {
  return ( (window.location.host === "tocsv.com:5000") || (window.location.host === "localhost:5999") ||
    (window.location.host === "127.0.0.1:5999") || (window.location.host === "profitori.loc:5999") )
}

global.appendStr = (aStr, aNew, aConn) => {
  let res = aStr
  if ( ! aNew ) return res
  if ( ! res )
    return aNew
  res = res + aConn + aNew
  return res
}

global.sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

global.todayLocal = () => {
  let d = global.today()
  return global.dateToLocal(d)
}

global.todayYMD = () => {
  let d = global.today()
  return global.dateToYMD(d)
}

global.todayJulian= () => {
  let d = global.today()
  return global.dateToJulian(d)
}

global.ymdToJulian = ymd => {
  let date = global.ymdToDate(ymd)
  return global.dateToJulian(date)
}

global.dateToJulian = date => {
  let ymd = global.dateToYMD(date)
  let yyyy = ymd.toYear()

  let dateToYY = date => {
    return yyyy.substr(2, 2)
  }

  let dateToDDD = date => {
    let days = ymd.dateSubtract(yyyy + '-01-01') + 1
    return global.padWithZeroes(days, 3)
  }

  let yy = dateToYY(date)
  let ddd = dateToDDD(date)
  return yy + ddd
}

global.emptyYMD = () => {
  return "1971-01-01"
}

global.invalidYMD = () => {
  return "1971-01-02"
}

global.today = () => {
  let res = new Date()
  if ( global.prfiEmulateDaysInFuture )
    res = new Date(res.getTime() + (global.prfiEmulateDaysInFuture * 1000 * 3600 * 24))
  return res
}

global.sign = val => {
  if ( val >= 0 ) return 1
  return -1
}

global.getLoggedInAgent = async () => {
  let userLogin = global.app.user
  let res = await 'Agent'.bringFirst({wcUserName: userLogin})
  return res
}

/*
global.refreshTheming = async () => {
  let c = await 'Configuration'.bringSingle(); if ( ! c ) return
  let fontFamily = c.fontFamily
  let zoomPct = c.zoomPct
  let buttonColor = c.buttonColor
  let css
  var sheet = window.document.styleSheets[0];
  if ( fontFamily ) {
    css = '.stLevel0 {font-family: "' + fontFamily + '", "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", ' +
      ' sans-serif !important; }'
    sheet.insertRule(css, sheet.cssRules.length);
  }
}
*/

global.refreshShortDateFormat = async () => {
  let c = await 'Configuration'.bringSingle()
  global.stDisplayDatesUsingShortDateFormat = c && (c.displayDatesUsingShortDateFormat === 'Yes')
  let sdf = c && c.shortDateFormat
  if ( (! sdf) || (sdf === "Browser default") ) {
    global.stShortDateFormat = global.getBrowserShortDateFormat()
    return
  }
  global.stShortDateFormat = sdf
}

global.getShortDateFormat = () => {
  let res = global.stShortDateFormat
  if ( ! res )
    res = global.getBrowserShortDateFormat()
  return res
}

global.sum = (n1, n2) => {
  let unk = global.unknownNumber()
  if ( n1 === unk ) return unk
  if ( n2 === unk ) return unk
  return n1 + n2
}

global.percent = (n1, n2) => {
  let unk = global.unknownNumber()
  if ( n1 === unk ) return unk
  if ( n2 === unk ) return unk
  if ( ! n2 ) return unk
  return (n1 / n2) * 100
}

global.localIsMDY = () => {
  let format = global.stShortDateFormat
  return (format === "mm/dd/yyyy")
}

global.localIsYMD = () => {
  let format = global.stShortDateFormat
  return (format === "yyyy/mm/dd")
}

global.getBrowserShortDateFormat = () => {
  let date = new Date(Date.UTC(2012, 11, 15, 0, 0, 0));
  let lang = navigator.language; if ( ! lang ) return "yyyy/mm/dd"
  let str = new Intl.DateTimeFormat(lang).format(date)
  if ( str.startsWith("12/") )
    return "mm/dd/yyyy"
  if ( str.startsWith("2012/") )
    return "yyyy/mm/dd"
  return "dd/mm/yyyy"
}

global.currencyToExchangeRate = async (curr) => {
  if ( ! curr )
    return 1
  return curr.exchangeRate
}

global.localAmountToForeign = async (amt, curr) => {
  let exchRate = await global.currencyToExchangeRate(curr)
  return amt * exchRate
}

global.dateToLocal = (aDate) => {
  let d = aDate
  let month = '' + (d.getMonth() + 1)
  let day = '' + d.getDate()
  let year = d.getFullYear()
  if ( month.length < 2 ) 
      month = '0' + month
  if ( day.length < 2 ) 
      day = '0' + day
  let res = [day, month, year].join('/');
  if ( global.localIsMDY() )
    res = [month, day, year].join('/');
  if ( global.localIsYMD() )
    res = [year, month, day].join('/');
  return res
}

global.excelDateToYMD = (serial) => {
  var utc_days  = Math.floor(serial - 25569);
  var utc_value = utc_days * 86400;
  var date_info = new Date(utc_value * 1000);
  var fractional_day = serial - Math.floor(serial) + 0.0000001;
  var total_seconds = Math.floor(86400 * fractional_day);
  var seconds = total_seconds % 60;
  total_seconds -= seconds;
  var hours = Math.floor(total_seconds / (60 * 60));
  var minutes = Math.floor(total_seconds / 60) % 60;
  let date = new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate(), hours, minutes, seconds);
  return global.dateToYMD(date)
}

global.dateToStrParts = (aDate) => {
  let d = aDate
  let month = '' + (d.getMonth() + 1)
  let day = '' + d.getDate()
  let year = d.getFullYear()
  if ( month.length < 2 ) 
    month = '0' + month
  if ( day.length < 2 ) 
    day = '0' + day
  let res = {day: day, month: month, year: year}
  return res
}

global.dateToDMY = (aDate) => {
  let parts = global.dateToStrParts(aDate)
  let res = [parts.day, parts.month, parts.year].join('/');
  return res
}

global.dateToMDY = (aDate) => {
  let parts = global.dateToStrParts(aDate)
  let res = [parts.month, parts.day, parts.year].join('/');
  return res
}

global.dateToShortYMD = (aDate) => {
  let parts = global.dateToStrParts(aDate)
  let res = [parts.year, parts.month, parts.day].join('/');
  return res
}

global.dateToYMD = (aDate) => {
  if ( ! aDate ) return null
  let parts = global.dateToStrParts(aDate)
  let res = [parts.year, parts.month, parts.day].join('-');
  return res
}

global.isYMD = (aStr) => {
  return global.ymdToDate(aStr) !== null
}

global.localToYMD = (aLocal) => {
  let dt = global.localToDate(aLocal)
  return global.dateToYMD(dt)
}

global.localToDate = (aLocal) => {
  if ( ! aLocal ) return null
  let parts = (aLocal + '').split("/")
  if ( parts.length !== 3 ) return null
  let di = 0
  let mi = 1
  let yi = 2
  if ( global.localIsMDY() ) {
    mi = 0
    di = 1
    yi = 2
  } else if ( global.localIsYMD() ) {
    yi = 0
    mi = 1
    di = 2
  }
  let y = parts[yi]
  if ( ! global.isNumeric(y) ) return null
  let m = parts[mi]
  if ( ! global.isNumeric(m) ) return null
  let d = parts[di]
  if ( ! global.isNumeric(d) ) return null
  y = parseInt(y, 10)
  m = parseInt(m, 10) - 1
  d = parseInt(d, 10)
  let res =  new Date(y, m, d)
  if ( ! global.dateIsValid(res) ) return null
  return res
}

global.ymdToDate = (aYMD) => {
  if ( ! aYMD ) return null
  if ( aYMD.length !== 10 ) return null
  let y = aYMD.substr(0, 4)
  if ( ! global.isNumeric(y) ) return null
  let m = aYMD.substr(5, 2)
  if ( ! global.isNumeric(m) ) return null
  let d = aYMD.substr(8, 2)
  if ( ! global.isNumeric(d) ) return null
  y = parseInt(y, 10)
  m = parseInt(m, 10) - 1
  d = parseInt(d, 10)
  let res =  new Date(Date.UTC(y, m, d, 0, 0, 0))
  if ( ! global.dateIsValid(res) ) return null
  return res
}

global.dateIsValid = (aDate) => {
  return ! isNaN(aDate.getTime())
}

global.nowMs = () => {
  return Date.now()
}

global.nowHMS = () => {
  var today = new Date()
  var h = global.padWithZeroes(today.getHours(), 2)
  var m = global.padWithZeroes(today.getMinutes(), 2)
  var s = global.padWithZeroes(today.getSeconds(), 2)
  return h + ':' + m + ':' + s
}

global.isString = (aVal) => {
  return (typeof aVal) === "string"
}

global.isNumeric = (aVal) => {
  if ( aVal === 0 ) 
    return true
  if ( ! aVal )
    return false
  if ( ! isNaN(aVal) )
    return true
  let val = aVal
  let sep = global.stDecimalSeparator
  if ( sep !== '.' )
    val = val.replace(sep, '.')
  let f = parseFloat(val)
  let res = !isNaN(f) && isFinite(val)
  return res
}

global.right = (aStr, aLen) => {
  return aStr.substr(aStr.length - aLen, aLen)
}

global.rightEquals = (aWhole, aPiece) => {
  let str = global.right(aWhole, aPiece.length)
  let res = (str === aPiece)
  return res
}

global.left = (aStr, aLen) => {
  return aStr.substr(0, aLen)
}

global.leftEquals = (aWhole, aPiece) => {
  let str = global.left(aWhole, aPiece.length)
  return str === aPiece
}

global.isPromise = (aObj) => {
  if ( ! aObj ) return false
  return (typeof aObj.then) === 'function'
}

global.copyObj = (aObj) => {
  if ( ! aObj ) return null
  return JSON.parse(JSON.stringify(aObj))
}

global.elementHeight = (aId) => {
  let el = document.getElementById(aId); if ( ! el ) return 0
  return el.clientHeight
}

global.elementWidth = (aId) => {
  let el = document.getElementById(aId); if ( ! el ) return 0
  return el.clientWidth
}

global.elementTop = (aId) => {
  let el = document.getElementById(aId); if ( ! el ) return 0
  let rect = el.getBoundingClientRect()
  return rect.top
}

global.getScrollbarWidth = () => {
  let res = global.prfiScrollbarWidth 
  if ( res ) 
    return res
  const outer = document.createElement('div')
  outer.style.visibility = 'hidden'
  outer.style.overflow = 'scroll'
  document.body.appendChild(outer)
  const inner = document.createElement('div')
  outer.appendChild(inner)
  res = outer.offsetWidth - inner.offsetWidth
  outer.parentNode.removeChild(outer)
  global.prfiScrollbarWidth = res
  return res;
}

global.elementLeft = (aId) => {
  let el = document.getElementById(aId); if ( ! el ) return 0
  let rect = el.getBoundingClientRect()
  return rect.left
}

global.getViewportDimensions = () => {
  var viewPortWidth;
  var viewPortHeight;
  if (typeof window.innerWidth != 'undefined') {
    viewPortWidth = window.innerWidth
    viewPortHeight = window.innerHeight
  }
  else if (typeof document.documentElement != 'undefined' && 
    typeof document.documentElement.clientWidth != 'undefined' && document.documentElement.clientWidth !== 0) {
    viewPortWidth = document.documentElement.clientWidth
    viewPortHeight = document.documentElement.clientHeight
  } else {
    viewPortWidth = document.getElementsByTagName('body')[0].clientWidth
    viewPortHeight = document.getElementsByTagName('body')[0].clientHeight
  }
  return {width: viewPortWidth, height: viewPortHeight};
}

global.withinXPct = (aPct, aVal1, aVal2) => {
  if ( (aVal1 === 0) && (aVal2 === 0) ) return true
  if ( (aVal1 === 0) || (aVal2 === 0) ) return false
  let diff = Math.abs(aVal1 - aVal2)
  let pct = Math.abs(diff / aVal1) * 100
  let res = pct <= aPct
  return res
}

global.roundTo2Decimals = (aVal) => {
  return global.roundToXDecimals(aVal, 2)
}

global.roundToXDecimals = (aVal, aX) => {
  let f = Math.pow(10, aX)
  let res = aVal + Number.EPSILON
  res = res * f
  res = Math.round(res) / f
  return res
}

global.roundToNearest = (aVal, aX) => {
  let res = global.roundToXDecimals(aVal / aX, 0)
  res = res * aX
  return res
}

global.addThousandCommas = (nStr) => {
  let sep = ','
  nStr += '';
  var x = nStr.split('.');
  var x1 = x[0];
  var x2 = x.length > 1 ? '.' + x[1] : '';
  var rgx = /(\d+)(\d{3})/;
  while (rgx.test(x1)) {
    x1 = x1.replace(rgx, '$1' + sep + '$2');
  }
  return x1 + x2;
}

global.numToStringWithXDecimals = (aVal, aX, aOptions) => {
  let val = global.roundToXDecimals(aVal, aX)
  let res = val.toFixed(aX)
  let forceDot = aOptions && aOptions.forceDot
  if ( ! forceDot ) {
    let thousandSep = aOptions && aOptions.thousandSep
    if ( thousandSep )
      res = global.addThousandCommas(res)
    let decParts = res.split('.')
    let thouParts = decParts[0].split(',')
    decParts[0] = thouParts.join(global.stThousandSeparator)
    res = decParts.join(global.stDecimalSeparator)
  }
  return res
}

global.numToStringWithMinXDecimals = (aVal, aX, aMax, aOptions) => {

  let removeExtraneousZeroes = str => {
    if ( ! str.endsWith('0') ) return str
    let res = str
    let dotPos = res.indexOf('.')
    let decimals = res.length - dotPos - 1
    while ( (decimals > aX) && res.endsWith('0') ) {
      decimals--
      res = res.stripRight('0')
    }
    return res
  }

  let res = aVal + ''
  let dotPos = res.indexOf('.')
  let decimals = res.length - dotPos - 1
  if ( (dotPos < 0) || (decimals < aX) )
    res = global.numToStringWithXDecimals(aVal, aX, aOptions)
  else if ( aMax && (decimals > aMax) ) {
    res = global.numToStringWithXDecimals(aVal, aMax, aOptions)
    res = removeExtraneousZeroes(res)
  } else {
    let thousandSep = aOptions && aOptions.thousandSep
    if ( thousandSep )
      res = global.addThousandCommas(res)
    let decParts = res.split('.')
    let thouParts = decParts[0].split(',')
    decParts[0] = thouParts.join(global.stThousandSeparator)
    res = decParts.join(global.stDecimalSeparator)
  }
  return res
}

global.keyCodeIsAlphanumeric = code => {
  if (!(code > 47 && code < 58) && // numeric (0-9)
      !(code > 64 && code < 91) && // upper alpha (A-Z)
      !(code > 96 && code < 123)) { // lower alpha (a-z)
    return false;
  }
  return true;
};

global.getSeatId = () => {
  let res = localStorage.getItem('seatId')
  if ( res )
    return res
/* eslint-disable no-mixed-operators */
  res = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, 
    function(c) {
      var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    }
  );
/* eslint-enable no-mixed-operators */
  localStorage.setItem('seatId', res)
  return res;
}

global.unknownNumber = () => -99999999999999

global.stripLeftChars = (aStr, aNo) => {
  return aStr.substr(aNo)
}

global.isObj = (aVal) => {
  return typeof aVal === 'object' && aVal !== null
}

global.isArray = (aVal) => {
  if ( ! aVal ) return false
  return aVal.constructor === Array
}

global.padZero = (aNo) => {
  let res = '' + aNo
  if (res.length < 2)
    res = '0' + res;
  return res;
}

global.padWithZeroes = (aNo, aLength) => {
  let res = '' + aNo
  if ( res.length >= aLength ) 
    return res
  res = '000000000000000000000000000000000'.substr(0, aLength - res.length) + res
  return res
}

global.padWithSpaces = (aNo, aLength) => {
  let res = '' + aNo
  if ( res.length >= aLength ) 
    return res
  res = '                                 '.substr(0, aLength - res.length) + res
  return res
}

global.strStartsWith = (aStr, aStart) => {
  return global.left(aStr, aStart.length) === aStart
}

global.isKindOf = (aObj, aClass) => {
  if ( ! aObj ) return false
  return aObj instanceof aClass
}

global.logCallStack = () => {
  console.log(new Error().stack);
}

global.isAsync = (aFn) => {
  if ( global.runningInsideWordpress ) return true // below doesn't work in react production mode
  return aFn.constructor.name === "AsyncFunction"
}

global.isFunction = (aVal) => {
  let s = {}.toString.call(aVal)
  let res = aVal && ((s === '[object Function]') || (s === '[object AsyncFunction]'))
  return res
}

global.normalizeDatatype = dt => {
  if ( dt.indexOf('.') < 0 ) return dt
  let parts = dt.split('.')
  return parts[0]
}

global.prettySplit = (str, parms) => {
  let bitNo = parms.bit
  let chars = parms.chars
  let parts = str.split(' ')
  let currentBitNo = 0
  let currentBit = ''
  for ( var i = 0; i < parts.length; i++ ) {
    let part = parts[i]
    let temp = currentBit.appendWithSep(part, ' ')
    if ( temp.length > chars ) {
      if ( currentBitNo === bitNo )
        return currentBit
      else {
        currentBitNo++
        currentBit = part
      }
    } else {
      currentBit = temp
    }
  }
  if ( currentBitNo === bitNo )
    return currentBit
  return ''
}

String.prototype.m = function(aVal) {
  if ( ! global.prfiMessageMs )
    global.prfiMessageMs = global.nowMs()
  //let elapsedMsStr = global.padWithSpaces(global.nowMs() - global.prfiMessageMs, 7) + ' '
  global.prfiMessageMs = global.nowMs()
  if ( aVal && global.isObj(aVal) ) {
    //console.log(elapsedMsStr + this + ": (object follows)")
    console.log(this + ": (object follows)")
    console.log(JSON.parse(JSON.prune(aVal)))
    console.log("")
    return
  }
  if ( aVal && global.isFunction(aVal) ) {
    //console.log(elapsedMsStr + this + ": (function follows)")
    console.log(this + ": (function follows)")
    console.dir(aVal)
    console.log("")
    return
  }
  if ( aVal || aVal === 0 ) {
    //console.log(elapsedMsStr + this + ": " + aVal)
    console.log(this + ": " + aVal)
    return
  }
  //console.log(elapsedMsStr + this + "")
  console.log(this + "")
}

// JSON.pruned : a function to stringify any object without overflow
// example : var json = JSON.pruned({a:'e', c:[1,2,{d:{e:42, f:'deep'}}]})
// two additional optional parameters :
//   - the maximal depth (default : 6)
//   - the maximal length of arrays (default : 50)
// GitHub : https://github.com/Canop/JSON.prune
// This is based on Douglas Crockford's code ( https://github.com/douglascrockford/JSON-js/blob/master/json2.js )
/* eslint-disable no-control-regex */
/* eslint-disable no-useless-escape */
/* eslint-disable default-case */
function addPrune() {

    var DEFAULT_MAX_DEPTH = 6;
    var DEFAULT_ARRAY_MAX_LENGTH = 200;
    var seen; // Same variable used for all stringifications

    Date.prototype.toPrunedJSON = Date.prototype.toJSON;
    String.prototype.toPrunedJSON = String.prototype.toJSON;

    var escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        meta = {    // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        };

    function quote(string) {
        escapable.lastIndex = 0;
        return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
            var c = meta[a];
            return typeof c === 'string'
                ? c
                : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        }) + '"' : '"' + string + '"';
    }

    function str(key, holder, depthDecr, arrayMaxLength) {
        var i,          // The loop counter.
            k,          // The member key.
            v,          // The member value.
            length,
            partial,
            value = holder[key];
        if (value && typeof value === 'object' && typeof value.toPrunedJSON === 'function') {
            value = value.toPrunedJSON(key);
        }

        switch (typeof value) {
        case 'string':
            return quote(value);
        case 'number':
            return isFinite(value) ? String(value) : 'null';
        case 'boolean':
        case 'null':
            return String(value);
        case 'object':
            if (!value) {
                return 'null';
            }
            if (depthDecr<=0) { // || seen.indexOf(value)!==-1) {
                return '"-pruned-"';
            }
            seen.push(value);
            partial = [];
            if (Object.prototype.toString.apply(value) === '[object Array]') {
                length = Math.min(value.length, arrayMaxLength);
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value, depthDecr-1, arrayMaxLength) || 'null';
                }
                v = partial.length === 0
                    ? '[]'
                    : '[' + partial.join(',') + ']';
                return v;
            }
            for (k in value) {
                if (Object.prototype.hasOwnProperty.call(value, k)) {
                    try {
                        v = str(k, value, depthDecr-1, arrayMaxLength);
                        if (v) partial.push(quote(k) + ':' + v);
                    } catch (e) { 
                        // this try/catch due to some "Accessing selectionEnd on an input element that cannot have a selection." on Chrome
                    }
                }
            }
            v = partial.length === 0
                ? '{}'
                : '{' + partial.join(',') + '}';
            return v;
        }
    }

    JSON.prune = function (value, depthDecr, arrayMaxLength) {
        seen = [];
        depthDecr = depthDecr || DEFAULT_MAX_DEPTH;
        arrayMaxLength = arrayMaxLength || DEFAULT_ARRAY_MAX_LENGTH;
        return str('', {'': value}, depthDecr, arrayMaxLength);
    };

}

addPrune()

global.refreshLanguage = async () => {
  //let c = await 'Configuration'.bringSingle()
  //let language = c && c.language
  //if ( (! language) || (language === "Browser default") ) {
    global.prfiLanguage = global.getBrowserLanguage()
    //return
  //}
  //global.prfiLanguage = language
}

global.getLanguage = function() {
  if ( global.prfiLanguage )
    return global.prfiLanguage
  let res = global.getBrowserLanguage()
  global.prfiLanguage = res
  return res
}

global.getBrowserLanguage = function() {
  let res = navigator.language; if ( ! res ) return "EN"
  let pos = res.indexOf("-")
  if ( pos < 0 )
    return res.toUpperCase()
  res = res.substr(0, pos).toUpperCase()
  return res
}

global.haveOnlyOneLocation = async () => {
  let locs = await 'Location'.bring()
  return locs.length === 1
}

global.cns = async (point) => {
  let orders = await 'orders'.bring()
  for ( var i = 0; i < orders.length; i++ ) {
    let order = orders[i]
    if ( ! order.niceStatus ) {
      "***** niceStatus blank at point".m(point)
    }
  }
}

String.prototype.jsParse = function() {
  Parser.parse(this, {ecmaVersion: 2020})
}

String.prototype.translate = function(aOptions) {
  if ( global.gather ) {
    let noGather = aOptions && aOptions.noGather
    if ( ! noGather )
      Gatherer.gather(this + '', aOptions)
  }
  let lang = global.getLanguage()
  if ( (! lang) || (lang === "EN") )
    return this + ''
  return Translator.translate(this + '', aOptions)
}

String.prototype.afterLast = function(aVal) {
  let idx = this.lastIndexOf(aVal); if ( idx < 0 ) return this
  let res = this.substr(idx + 1, 9999)
  return res
}

String.prototype.stripAfterLast = function(aVal, aRemObj) {
  let idx = this.lastIndexOf(aVal); if ( idx < 0 ) return this
  let res = this.substr(0, idx)
  if ( aRemObj )
    aRemObj.str = this.substr(idx, 9999)
  return res
}

String.prototype.stripLeft = function(aVal) {
  if ( ! this.leftEquals(aVal) ) return this + ''
  let res = this.substr(aVal.length, 99999)
  return res
}

String.prototype.stripRight = function(aVal) {
  if ( ! this.rightEquals(aVal) ) return this + ''
  let res = this.substr(0, this.length - aVal.length)
  return res
}

String.prototype.leftEquals = function(aVal) {
  if ( this.length < aVal.length ) return false
  let left = this.substr(0, aVal.length)
  return left === aVal
}

String.prototype.rightEquals = function(aVal) {
  if ( this.length < aVal.length ) return false
  let right = this.substr(this.length - aVal.length, aVal.length)
  return right === aVal
}

global.ymdIsSet = ymd => {
  if ( ! ymd ) 
    return false
  return ! ymd.isEmptyYMD()
}

global.ymdOrLocalToDate = (aStr, aInfo) => {
  if ( ! aStr ) 
    aStr = ''
  if ( aStr.indexOf('-') >= 0 )
    return global.ymdToDate(aStr)
  if ( aInfo )
    aInfo.isLocal = true
  return global.localToDate(aStr)
}

global.moveArrayElement = (arr, old_index, new_index) => {
  if (new_index >= arr.length) {
    var k = new_index - arr.length + 1
    while (k--)
      arr.push(undefined)
  }
  arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
}

String.prototype.toMonthNameAbbrev = function() {
  let d = global.ymdOrLocalToDate(this); if ( ! d ) return ''
  return gMMMNames[d.getMonth()]
}

String.prototype.toYear = function() {
  return this.substr(0, 4)
}

String.prototype.toMonth = function() {
  return this.substr(5, 2)
}

String.prototype.incMonths = function(aVal) {
  let val = aVal ? aVal : 0
  let aInfo = {}
  let d = global.ymdOrLocalToDate(this, aInfo); if ( ! d ) return
  d.setMonth(d.getMonth() + val)
  if ( aInfo.isLocal )
    return global.dateToLocal(d)
  return global.dateToYMD(d)
}

String.prototype.incYears = function(aVal) {
  let val = aVal ? aVal : 0
  let aInfo = {}
  let d = global.ymdOrLocalToDate(this, aInfo); if ( ! d ) return
  d.setMonth(d.getMonth() + (val * 12))
  if ( aInfo.isLocal )
    return global.dateToLocal(d)
  return global.dateToYMD(d)
}

String.prototype.incDays = function(aVal) {
  let val = aVal ? aVal : 0
  let aInfo = {}
  let d = global.ymdOrLocalToDate(this, aInfo); if ( ! d ) return
  let t = d.getTime() + (val * 1000 * 3600 * 24)
  d = new Date(t)
  if ( aInfo.isLocal )
    return global.dateToLocal(d)
  return global.dateToYMD(d)
}

String.prototype.toDayNoOfWeek = function() {
  let d = global.ymdOrLocalToDate(this); if ( ! d ) return 0
  return d.getDay()
}

String.prototype.dateSubtract = function(aVal) {
  let d1 = global.ymdOrLocalToDate(this + ''); if ( ! d1 ) return 0
  let d2 = global.ymdOrLocalToDate(aVal); if ( ! d2 ) return 0
  let timeDiff = d1.getTime() - d2.getTime()
  let res = Math.round(timeDiff / (1000 * 3600 * 24))
  return res
}

String.prototype.toLocal = function() {
  let d = global.ymdToDate(this + ''); if ( ! d ) return ''
  return global.dateToLocal(d)
}

let gMMMNames = [
  "Jan".translate({nonEnBase: "January"}), 
  "Feb".translate({nonEnBase: "February"}), 
  "Mar".translate({nonEnBase: "March"}), 
  "Apr".translate({nonEnBase: "April"}), 
  "May".translate({nonEnBase: "May"}), 
  "Jun".translate({nonEnBase: "June"}), 
  "Jul".translate({nonEnBase: "July"}), 
  "Aug".translate({nonEnBase: "August"}), 
  "Sep".translate({nonEnBase: "September"}), 
  "Oct".translate({nonEnBase: "October"}), 
  "Nov".translate({nonEnBase: "November"}), 
  "Dec".translate({nonEnBase: "December"})
]

String.prototype.toLocalDateDisplayText = function(opt) {
  if ( opt && opt.blankIfEmpty && this.isEmptyYMD() ) return ''
  if ( global.stDisplayDatesUsingShortDateFormat ) {
    return this.toLocal()
  }
  return this.toLocalMMMDY()
}

String.prototype.toLocalMMMDY = function() {
  let d = global.ymdOrLocalToDate(this + ''); if ( ! d ) return ''
  let m = gMMMNames[d.getMonth()]
  let res = m + " " + d.getDate() + " " + d.getFullYear()
  return res
}

String.prototype.toDMY = function() {
  let d = global.ymdOrLocalToDate(this + ''); if ( ! d ) return ''
  return global.dateToDMY(d)
}

String.prototype.toMDY = function() {
  let d = global.ymdOrLocalToDate(this + ''); if ( ! d ) return ''
  return global.dateToMDY(d)
}

String.prototype.toShortYMD = function() {
  let d = global.ymdOrLocalToDate(this + ''); if ( ! d ) return ''
  return global.dateToShortYMD(d)
}

String.prototype.capitalizeFirstChar = function() {
  if ( this + "" === "%" ) return "Percent"
  return this.substr(0, 1).toUpperCase() + this.substr(1, this.length - 1)
}

String.prototype.toId = function() {
  let parts = this.split(" ")
  parts = parts.map(part => part.capitalizeFirstChar())
  let str = parts.join(" ")
  let res = global.cleanStr(str)
  return res
}

String.prototype.stripLeftChars = function(aCount) {
  return global.stripLeftChars(this, aCount)
}

String.prototype.appendWithSep = function(aStr2, aSep) {
  if ( ! this ) return aStr2
  if ( ! aStr2 ) return this + ""
  return this + aSep + aStr2
}

String.prototype.removeLine = function(idx) {
  let lines = (this + '').split(/\r?\n/)
  if ( lines.length <= idx ) return this
  lines.removeByIndex(idx)
  return lines.join("\n")
}

String.prototype.removeLinesAfter = function(idx) {
  let lines = (this + '').split(/\r?\n/)
  if ( lines.length <= idx ) return this
  lines.length = idx
  return lines.join("\n")
}

String.prototype.alterLine = function(idx, str) {
  let lines = (this + '').split(/\r?\n/)
  if ( lines.length <= idx ) return this
  lines.removeByIndex(idx)
  lines.splice(idx, 0, str)
  return lines.join("\n")
}

String.prototype.indexToLineStr = function(idx) {
  let lines = (this + '').split(/\r?\n/)
  if ( lines.length <= idx ) return this
  return lines[idx]
}

global.appendWithSep = (aStr1, aStr2, aSep) => {
  if ( ! aStr1 ) return aStr2
  if ( ! aStr2 ) return aStr1
  return aStr1 + aSep + aStr2
}

global.elementIdToOffset = (aId) => {
  let el = document.getElementById(aId); if ( ! el ) return { top: 0, left: 0}
  var _x = 0;
  var _y = 0;
  while( el && !isNaN( el.offsetLeft ) && !isNaN( el.offsetTop ) ) {
    _x += el.offsetLeft - el.scrollLeft;
    _y += el.offsetTop - el.scrollTop;
    el = el.offsetParent;
  }
  return { top: _y, left: _x };
}

global.getLocaleDateFormat = () => {
  var eg = new Date(2013, 11, 31);
  var res = eg.toLocaleDateString();
  res = res.replace("31","DD");
  res = res.replace("12","MM");
  res = res.replace("2013","YYYY");
  return res
} 

global.sortCompare = (a, b) => {
  if ( a > b ) return 1
  if ( a < b ) return -1
  return 0
}

global.hideElement = (id) => {
  let el = document.getElementById(id); if ( ! el ) return
  el.style.display = 'none'
}

global.setElementStyleAttr = (id, attr, val) => {
  let el = document.getElementById(id); if ( ! el ) return
  el.style[attr] = val
}

global.codeToCountry = aCode => {
  if ( ! aCode )
    return null
  let code = aCode.toLowerCase()
  let countries = global.getCountries()
  for ( var i = 0; i < countries.length; i++ ) {
    let country = countries[i]
    if ( country.Code.toLowerCase() === code )
      return country.Country
  }
  return aCode
}

global.countryToCode = aCountry => {
  if ( ! aCountry )
    return null
  let countryName = aCountry.toLowerCase()
  let countries = global.getCountries()
  for ( var i = 0; i < countries.length; i++ ) {
    let country = countries[i]
    if ( country.Country.toLowerCase() === countryName )
      return country.Code
  }
  return aCountry
}

global.getCountryNames = () => {
  let countries = global.getCountries()
  let res = []
  for ( var i = 0; i < countries.length; i++ ) {
    res.push(countries[i].Country)
  }
  return res
}

global.getCountries = () => {
return [
 {
   "Country": "Åland Islands",
   "Code": "AX"
 },
 {
   "Country": "Afghanistan",
   "Code": "AF"
 },
 {
   "Country": "Albania",
   "Code": "AL"
 },
 {
   "Country": "Algeria",
   "Code": "DZ"
 },
 {
   "Country": "Andorra",
   "Code": "AD"
 },
 {
   "Country": "Angola",
   "Code": "AO"
 },
 {
   "Country": "Anguilla",
   "Code": "AI"
 },
 {
   "Country": "Antarctica",
   "Code": "AQ"
 },
 {
   "Country": "Antigua and Barbuda",
   "Code": "AG"
 },
 {
   "Country": "Argentina",
   "Code": "AR"
 },
 {
   "Country": "Armenia",
   "Code": "AM"
 },
 {
   "Country": "Aruba",
   "Code": "AW"
 },
 {
   "Country": "Australia",
   "Code": "AU"
 },
 {
   "Country": "Austria",
   "Code": "AT"
 },
 {
   "Country": "Azerbaijan",
   "Code": "AZ"
 },
 {
   "Country": "Bahamas",
   "Code": "BS"
 },
 {
   "Country": "Bahrain",
   "Code": "BH"
 },
 {
   "Country": "Bangladesh",
   "Code": "BD"
 },
 {
   "Country": "Barbados",
   "Code": "BB"
 },
 {
   "Country": "Belarus",
   "Code": "BY"
 },
 {
   "Country": "Belau",
   "Code": "PW"
 },
 {
   "Country": "Belgium",
   "Code": "BE"
 },
 {
   "Country": "Belize",
   "Code": "BZ"
 },
 {
   "Country": "Benin",
   "Code": "BJ"
 },
 {
   "Country": "Bermuda",
   "Code": "BM"
 },
 {
   "Country": "Bhutan",
   "Code": "BT"
 },
 {
   "Country": "Bolivia",
   "Code": "BO"
 },
 {
   "Country": "Bonaire, Saint Eustatius and Saba",
   "Code": "BQ"
 },
 {
   "Country": "Bosnia and Herzegovina",
   "Code": "BA"
 },
 {
   "Country": "Botswana",
   "Code": "BW"
 },
 {
   "Country": "Bouvet Island",
   "Code": "BV"
 },
 {
   "Country": "Brazil",
   "Code": "BR"
 },
 {
   "Country": "British Indian Ocean Territory",
   "Code": "IO"
 },
 {
   "Country": "British Virgin Islands",
   "Code": "VG"
 },
 {
   "Country": "Brunei",
   "Code": "BN"
 },
 {
   "Country": "Bulgaria",
   "Code": "BG"
 },
 {
   "Country": "Burkina Faso",
   "Code": "BF"
 },
 {
   "Country": "Burundi",
   "Code": "BI"
 },
 {
   "Country": "Cambodia",
   "Code": "KH"
 },
 {
   "Country": "Cameroon",
   "Code": "CM"
 },
 {
   "Country": "Canada",
   "Code": "CA"
 },
 {
   "Country": "Cape Verde",
   "Code": "CV"
 },
 {
   "Country": "Cayman Islands",
   "Code": "KY"
 },
 {
   "Country": "Central African Republic",
   "Code": "CF"
 },
 {
   "Country": "Chad",
   "Code": "TD"
 },
 {
   "Country": "Chile",
   "Code": "CL"
 },
 {
   "Country": "China",
   "Code": "CN"
 },
 {
   "Country": "Christmas Island",
   "Code": "CX"
 },
 {
   "Country": "Cocos (Keeling) Islands",
   "Code": "CC"
 },
 {
   "Country": "Colombia",
   "Code": "CO"
 },
 {
   "Country": "Comoros",
   "Code": "KM"
 },
 {
   "Country": "Congo (Brazzaville)",
   "Code": "CG"
 },
 {
   "Country": "Congo (Kinshasa)",
   "Code": "CD"
 },
 {
   "Country": "Cook Islands",
   "Code": "CK"
 },
 {
   "Country": "Costa Rica",
   "Code": "CR"
 },
 {
   "Country": "Croatia",
   "Code": "HR"
 },
 {
   "Country": "Cuba",
   "Code": "CU"
 },
 {
   "Country": "CuraÇao",
   "Code": "CW"
 },
 {
   "Country": "Cyprus",
   "Code": "CY"
 },
 {
   "Country": "Czech Republic",
   "Code": "CZ"
 },
 {
   "Country": "Denmark",
   "Code": "DK"
 },
 {
   "Country": "Djibouti",
   "Code": "DJ"
 },
 {
   "Country": "Dominica",
   "Code": "DM"
 },
 {
   "Country": "Dominican Republic",
   "Code": "DO"
 },
 {
   "Country": "Ecuador",
   "Code": "EC"
 },
 {
   "Country": "Egypt",
   "Code": "EG"
 },
 {
   "Country": "El Salvador",
   "Code": "SV"
 },
 {
   "Country": "Equatorial Guinea",
   "Code": "GQ"
 },
 {
   "Country": "Eritrea",
   "Code": "ER"
 },
 {
   "Country": "Estonia",
   "Code": "EE"
 },
 {
   "Country": "Ethiopia",
   "Code": "ET"
 },
 {
   "Country": "Falkland Islands",
   "Code": "FK"
 },
 {
   "Country": "Faroe Islands",
   "Code": "FO"
 },
 {
   "Country": "Fiji",
   "Code": "FJ"
 },
 {
   "Country": "Finland",
   "Code": "FI"
 },
 {
   "Country": "France",
   "Code": "FR"
 },
 {
   "Country": "French Guiana",
   "Code": "GF"
 },
 {
   "Country": "French Polynesia",
   "Code": "PF"
 },
 {
   "Country": "French Southern Territories",
   "Code": "TF"
 },
 {
   "Country": "Gabon",
   "Code": "GA"
 },
 {
   "Country": "Gambia",
   "Code": "GM"
 },
 {
   "Country": "Georgia",
   "Code": "GE"
 },
 {
   "Country": "Germany",
   "Code": "DE"
 },
 {
   "Country": "Ghana",
   "Code": "GH"
 },
 {
   "Country": "Gibraltar",
   "Code": "GI"
 },
 {
   "Country": "Greece",
   "Code": "GR"
 },
 {
   "Country": "Greenland",
   "Code": "GL"
 },
 {
   "Country": "Grenada",
   "Code": "GD"
 },
 {
   "Country": "Guadeloupe",
   "Code": "GP"
 },
 {
   "Country": "Guatemala",
   "Code": "GT"
 },
 {
   "Country": "Guernsey",
   "Code": "GG"
 },
 {
   "Country": "Guinea",
   "Code": "GN"
 },
 {
   "Country": "Guinea-Bissau",
   "Code": "GW"
 },
 {
   "Country": "Guyana",
   "Code": "GY"
 },
 {
   "Country": "Haiti",
   "Code": "HT"
 },
 {
   "Country": "Heard Island and McDonald Islands",
   "Code": "HM"
 },
 {
   "Country": "Honduras",
   "Code": "HN"
 },
 {
   "Country": "Hong Kong",
   "Code": "HK"
 },
 {
   "Country": "Hungary",
   "Code": "HU"
 },
 {
   "Country": "Iceland",
   "Code": "IS"
 },
 {
   "Country": "India",
   "Code": "IN"
 },
 {
   "Country": "Indonesia",
   "Code": "ID"
 },
 {
   "Country": "Iran",
   "Code": "IR"
 },
 {
   "Country": "Iraq",
   "Code": "IQ"
 },
 {
   "Country": "Isle of Man",
   "Code": "IM"
 },
 {
   "Country": "Israel",
   "Code": "IL"
 },
 {
   "Country": "Italy",
   "Code": "IT"
 },
 {
   "Country": "Ivory Coast",
   "Code": "CI"
 },
 {
   "Country": "Jamaica",
   "Code": "JM"
 },
 {
   "Country": "Japan",
   "Code": "JP"
 },
 {
   "Country": "Jersey",
   "Code": "JE"
 },
 {
   "Country": "Jordan",
   "Code": "JO"
 },
 {
   "Country": "Kazakhstan",
   "Code": "KZ"
 },
 {
   "Country": "Kenya",
   "Code": "KE"
 },
 {
   "Country": "Kiribati",
   "Code": "KI"
 },
 {
   "Country": "Kuwait",
   "Code": "KW"
 },
 {
   "Country": "Kyrgyzstan",
   "Code": "KG"
 },
 {
   "Country": "Laos",
   "Code": "LA"
 },
 {
   "Country": "Latvia",
   "Code": "LV"
 },
 {
   "Country": "Lebanon",
   "Code": "LB"
 },
 {
   "Country": "Lesotho",
   "Code": "LS"
 },
 {
   "Country": "Liberia",
   "Code": "LR"
 },
 {
   "Country": "Libya",
   "Code": "LY"
 },
 {
   "Country": "Liechtenstein",
   "Code": "LI"
 },
 {
   "Country": "Lithuania",
   "Code": "LT"
 },
 {
   "Country": "Luxembourg",
   "Code": "LU"
 },
 {
   "Country": "Macao S.A.R., China",
   "Code": "MO"
 },
 {
   "Country": "Macedonia",
   "Code": "MK"
 },
 {
   "Country": "Madagascar",
   "Code": "MG"
 },
 {
   "Country": "Malawi",
   "Code": "MW"
 },
 {
   "Country": "Malaysia",
   "Code": "MY"
 },
 {
   "Country": "Maldives",
   "Code": "MV"
 },
 {
   "Country": "Mali",
   "Code": "ML"
 },
 {
   "Country": "Malta",
   "Code": "MT"
 },
 {
   "Country": "Marshall Islands",
   "Code": "MH"
 },
 {
   "Country": "Martinique",
   "Code": "MQ"
 },
 {
   "Country": "Mauritania",
   "Code": "MR"
 },
 {
   "Country": "Mauritius",
   "Code": "MU"
 },
 {
   "Country": "Mayotte",
   "Code": "YT"
 },
 {
   "Country": "Mexico",
   "Code": "MX"
 },
 {
   "Country": "Micronesia",
   "Code": "FM"
 },
 {
   "Country": "Moldova",
   "Code": "MD"
 },
 {
   "Country": "Monaco",
   "Code": "MC"
 },
 {
   "Country": "Mongolia",
   "Code": "MN"
 },
 {
   "Country": "Montenegro",
   "Code": "ME"
 },
 {
   "Country": "Montserrat",
   "Code": "MS"
 },
 {
   "Country": "Morocco",
   "Code": "MA"
 },
 {
   "Country": "Mozambique",
   "Code": "MZ"
 },
 {
   "Country": "Myanmar",
   "Code": "MM"
 },
 {
   "Country": "Namibia",
   "Code": "NA"
 },
 {
   "Country": "Nauru",
   "Code": "NR"
 },
 {
   "Country": "Nepal",
   "Code": "NP"
 },
 {
   "Country": "Netherlands",
   "Code": "NL"
 },
 {
   "Country": "Netherlands Antilles",
   "Code": "AN"
 },
 {
   "Country": "New Caledonia",
   "Code": "NC"
 },
 {
   "Country": "New Zealand",
   "Code": "NZ"
 },
 {
   "Country": "Nicaragua",
   "Code": "NI"
 },
 {
   "Country": "Niger",
   "Code": "NE"
 },
 {
   "Country": "Nigeria",
   "Code": "NG"
 },
 {
   "Country": "Niue",
   "Code": "NU"
 },
 {
   "Country": "Norfolk Island",
   "Code": "NF"
 },
 {
   "Country": "North Korea",
   "Code": "KP"
 },
 {
   "Country": "Norway",
   "Code": "NO"
 },
 {
   "Country": "Oman",
   "Code": "OM"
 },
 {
   "Country": "Pakistan",
   "Code": "PK"
 },
 {
   "Country": "Palestinian Territory",
   "Code": "PS"
 },
 {
   "Country": "Panama",
   "Code": "PA"
 },
 {
   "Country": "Papua New Guinea",
   "Code": "PG"
 },
 {
   "Country": "Paraguay",
   "Code": "PY"
 },
 {
   "Country": "Peru",
   "Code": "PE"
 },
 {
   "Country": "Philippines",
   "Code": "PH"
 },
 {
   "Country": "Pitcairn",
   "Code": "PN"
 },
 {
   "Country": "Poland",
   "Code": "PL"
 },
 {
   "Country": "Portugal",
   "Code": "PT"
 },
 {
   "Country": "Qatar",
   "Code": "QA"
 },
 {
   "Country": "Republic of Ireland",
   "Code": "IE"
 },
 {
   "Country": "Reunion",
   "Code": "RE"
 },
 {
   "Country": "Romania",
   "Code": "RO"
 },
 {
   "Country": "Russia",
   "Code": "RU"
 },
 {
   "Country": "Rwanda",
   "Code": "RW"
 },
 {
   "Country": "São Tomé and Príncipe",
   "Code": "ST"
 },
 {
   "Country": "Saint Barthélemy",
   "Code": "BL"
 },
 {
   "Country": "Saint Helena",
   "Code": "SH"
 },
 {
   "Country": "Saint Kitts and Nevis",
   "Code": "KN"
 },
 {
   "Country": "Saint Lucia",
   "Code": "LC"
 },
 {
   "Country": "Saint Martin (Dutch part)",
   "Code": "SX"
 },
 {
   "Country": "Saint Martin (French part)",
   "Code": "MF"
 },
 {
   "Country": "Saint Pierre and Miquelon",
   "Code": "PM"
 },
 {
   "Country": "Saint Vincent and the Grenadines",
   "Code": "VC"
 },
 {
   "Country": "San Marino",
   "Code": "SM"
 },
 {
   "Country": "Saudi Arabia",
   "Code": "SA"
 },
 {
   "Country": "Senegal",
   "Code": "SN"
 },
 {
   "Country": "Serbia",
   "Code": "RS"
 },
 {
   "Country": "Seychelles",
   "Code": "SC"
 },
 {
   "Country": "Sierra Leone",
   "Code": "SL"
 },
 {
   "Country": "Singapore",
   "Code": "SG"
 },
 {
   "Country": "Slovakia",
   "Code": "SK"
 },
 {
   "Country": "Slovenia",
   "Code": "SI"
 },
 {
   "Country": "Solomon Islands",
   "Code": "SB"
 },
 {
   "Country": "Somalia",
   "Code": "SO"
 },
 {
   "Country": "South Africa",
   "Code": "ZA"
 },
 {
   "Country": "South Georgia/Sandwich Islands",
   "Code": "GS"
 },
 {
   "Country": "South Korea",
   "Code": "KR"
 },
 {
   "Country": "South Sudan",
   "Code": "SS"
 },
 {
   "Country": "Spain",
   "Code": "ES"
 },
 {
   "Country": "Sri Lanka",
   "Code": "LK"
 },
 {
   "Country": "Sudan",
   "Code": "SD"
 },
 {
   "Country": "Suriname",
   "Code": "SR"
 },
 {
   "Country": "Svalbard and Jan Mayen",
   "Code": "SJ"
 },
 {
   "Country": "Swaziland",
   "Code": "SZ"
 },
 {
   "Country": "Sweden",
   "Code": "SE"
 },
 {
   "Country": "Switzerland",
   "Code": "CH"
 },
 {
   "Country": "Syria",
   "Code": "SY"
 },
 {
   "Country": "Taiwan",
   "Code": "TW"
 },
 {
   "Country": "Tajikistan",
   "Code": "TJ"
 },
 {
   "Country": "Tanzania",
   "Code": "TZ"
 },
 {
   "Country": "Thailand",
   "Code": "TH"
 },
 {
   "Country": "Timor-Leste",
   "Code": "TL"
 },
 {
   "Country": "Togo",
   "Code": "TG"
 },
 {
   "Country": "Tokelau",
   "Code": "TK"
 },
 {
   "Country": "Tonga",
   "Code": "TO"
 },
 {
   "Country": "Trinidad and Tobago",
   "Code": "TT"
 },
 {
   "Country": "Tunisia",
   "Code": "TN"
 },
 {
   "Country": "Turkey",
   "Code": "TR"
 },
 {
   "Country": "Turkmenistan",
   "Code": "TM"
 },
 {
   "Country": "Turks and Caicos Islands",
   "Code": "TC"
 },
 {
   "Country": "Tuvalu",
   "Code": "TV"
 },
 {
   "Country": "Uganda",
   "Code": "UG"
 },
 {
   "Country": "Ukraine",
   "Code": "UA"
 },
 {
   "Country": "United Arab Emirates",
   "Code": "AE"
 },
 {
   "Country": "United Kingdom (UK)",
   "Code": "GB"
 },
 {
   "Country": "United States (US)",
   "Code": "US"
 },
 {
   "Country": "Uruguay",
   "Code": "UY"
 },
 {
   "Country": "Uzbekistan",
   "Code": "UZ"
 },
 {
   "Country": "Vanuatu",
   "Code": "VU"
 },
 {
   "Country": "Vatican",
   "Code": "VA"
 },
 {
   "Country": "Venezuela",
   "Code": "VE"
 },
 {
   "Country": "Vietnam",
   "Code": "VN"
 },
 {
   "Country": "Wallis and Futuna",
   "Code": "WF"
 },
 {
   "Country": "Western Sahara",
   "Code": "EH"
 },
 {
   "Country": "Western Samoa",
   "Code": "WS"
 },
 {
   "Country": "Yemen",
   "Code": "YE"
 },
 {
   "Country": "Zambia",
   "Code": "ZM"
 },
 {
   "Country": "Zimbabwe",
   "Code": "ZW"
 }
]
}

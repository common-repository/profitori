'Search'.list({expose: true, icon: 'Search'})
'Search'.title()
'Back'.action({act: 'cancel'})
'Download to Excel'.action({act: 'excel'})

'Found'.datatype({source: 'search'})
'theDatatype'.field({hidden: true})
'docDatatypeCaption'.field({caption: 'Type'})
'descriptor'.field({showAsLink: true, caption: 'Reference'})
'supplierOrCustomerName'.field({showAsLink: true, caption: 'Supplier/Customer'})
'subDatatypeCaption'.field({caption: 'Subtype', showAsLink: true})
'rawFieldName'.field({hidden: true})
'fieldName'.field()
'rawValue'.field({hidden: true})
'value'.field({html: true})
'postType'.field({hidden: true})

'supplierOrCustomerName'.calculate(async found => {
  let suppOrCust = await found.toSupplierOrCustomer(); if ( ! suppOrCust ) return null
  if ( suppOrCust.name )
    return suppOrCust.name
  return suppOrCust.display_name
})

'supplierOrCustomerName'.destination(async found => {
  let res = await found.toSupplierOrCustomer()
  return res
})

'Found'.method('toSupplierOrCustomer', async function() {
  let res = await this.toSupplier()
  if ( res )
    return res
  res = await this.toCustomer()
  return res
})

'Found'.method('toSupplier', async function() {
  let doc = await this.toDocument(); if ( ! doc ) return
  if ( doc.supplier )
    return await doc.referee('supplier')
  if ( doc.toSupplier )
    return await doc.toSupplier()
  if ( doc.toMainSupplier )
    return await doc.toMainSupplier()
  return null
})

'Found'.method('toCustomer', async function() {
  let doc = await this.toDocument(); if ( ! doc ) return
  if ( doc.customer )
    return await doc.referee('customer')
  if ( doc.toCustomer ) {
    return await doc.toCustomer()
  }
  if ( doc.user )
    return await doc.referee('user')
  if ( doc.toUser )
    return await doc.toUser()
  if ( doc.toOrder ) {
    let order = await doc.toOrder()
    return await order.toCustomer()
  }
  return null
})

'value'.calculate(found => {
  let res = found.fieldNameToDisplayValue('rawValue')
  if ( ! res )
    return res
  res = res.replace('<','')
  res = res.replace('>','')
  let lcRes = res.toLowerCase()
  let searchText = global.globalSearchText; if ( ! searchText ) return res
  let lcSearchText = searchText.toLowerCase()
  let pos = lcRes.indexOf(lcSearchText)
  if ( pos < 0 )
    return global.left(lcRes, 100) + '...'
  let start = pos - 100
  if ( start < 0 )
    start = 0
  let first = global.left(res, pos - start)
  let middle = res.substr(pos, lcSearchText.length)
  let last = res.substr(pos + lcSearchText.length, 100)
  res = first + '<span class="prfiFoundText">' + middle + '</span>' + last
  if ( pos > 0 )
    res = '...' + res
  if ( (pos + lcSearchText.length) < lcRes.length )
    res = res + '...'
  return res
})

'descriptor'.destination(async found => {
  return await found.toDocument()
})

'subDatatypeCaption'.destination(async found => {
  return await found.toTargetCast()
})

'fieldName'.calculate(found => {
  return found.rawFieldName.stripLeft('stocktend_')
})

'Found'.method('toDocument', async function() {
  let cast = await this.toTargetCast(); if ( ! cast ) return null
  if ( cast._datatype === 'Attachment' )  {
    let parent = await cast.toParent()
    if ( parent )
      cast = parent
  }
  let res =  await cast.ultimateParent()
  if ( ! res ) {
    res = cast
  }
  if ( res.datatype === 'SO' )
    res = await res.toOrder()
  return res
})

'Found'.method('toTargetCast', async function() {

  let postTypeToDatatype = postType => {
    let map = {
      'product': 'products',
      'product_variation': 'products', 
      'shop_order': 'orders', 
      'shop_order_refund': 'orders'
    }
    return map[postType]
  }

  let datatype = this.theDatatype
  if ( ! datatype )
    datatype = postTypeToDatatype(this.postType)
  let mold = global.foreman.doNameToMold(datatype); if ( ! mold ) return null
  let res = await datatype.bringFirst({id: this.id})
  return res
})

'docDatatypeCaption'.calculate(async found => {
  let doc = await found.toDocument()
  if ( ! doc )
    return found.theDatatype
  return doc.datatypeCaption()
})

'subDatatypeCaption'.calculate(async found => {
  let cast = await found.toTargetCast()
  if ( ! cast )
    return ''
  return cast.datatypeCaption()
})

'descriptor'.calculate(async found => {
  let doc = await found.toDocument()
  if ( ! doc )
    return found.theDatatype + " " + found.id
  return doc.ultimateKeyval()
})

'Search'.beforeLoading(async list => {
  list.searchInfo = {changesPending: 0}
  global.prfiExecDeferred(list.processSearchTextChange, 200)
})

'Search'.afterSearchChange(async (list, value) => {
  global.globalSearchText = value
  list.processSearchTextChange()
})

'Search'.method('processSearchTextChange', function() {
  let list = this
  let info = list.searchInfo
  let callServer

  let clearFoundMold = () => {
    let m = global.foreman.doNameToMold('Found')
    m.initCasts()
  }

  let populateFoundMold = data => {
    clearFoundMold()
    if ( data ) {
      let mold = global.foreman.doNameToMold('Found')
      mold.bayCasts = mold.nakedCastsToBayCasts(data)
      mold.setBayValuesToCorrectTypes()
      mold.mergeBay()
    }
    list.forceUpdate()
  }

  let processResponse = data => {
    clearFoundMold()
    if ( info.changesPending > 0 ) return
    if ( info.serverSearchText !== global.globalSearchText ) {
      if ( info.changesPending <= 0 )
        callServer()
    } else {
      if ( data ) {
        populateFoundMold(data.data)
      } else
        list.forceUpdate()
    }
  }

  let getFetchOptions = () => {
    let options = 
      {
        method: 'GET',
        headers: {'Accept': 'application/json', 'Content-Type': 'application/json'},
      }
    if ( ! global.runningOutsideWP() )
      options.credentials = "include"
    return options
  }

  callServer = () => {
    info.serverRequestPending = true
    global.searchPending = true
    info.serverSearchText = global.globalSearchText
    if ( ! info.serverSearchText ) {
      info.serverRequestPending = false
      global.searchPending = false
      processResponse()
      return
    }
    let payload = {methodWithParms: "stocktend_object?datatype=none&source=search&searchText=" + encodeURIComponent(global.globalSearchText), json: {}}
    let url = global.server.getCallString(payload)
    let options = getFetchOptions()
    fetch(url, options)
      .then(
        function(response) {
          info.serverRequestPending = false
          global.searchPending = false
          if (response.status !== 200) {
            console.log('Error doing search request. Status Code: ' + response.status);
            return;
          }
          response.json().then(function(data) {
            processResponse(data)
          });
        }
      )
      .catch(function(err) {
        info.serverRequestPending = false
        global.searchPending = false
        console.log('Fetch error doing search request: ', err);
      });
  }

  let maybeCallServer = () => {
    info.changesPending--
    if ( info.changesPending > 0 )
      return
    if ( info.serverRequestPending )
      return
    callServer()
  }

  info.changesPending++
  //setTimeout(maybeCallServer, 200)
  global.prfiExecDeferred(maybeCallServer, {noSpinner: true, ms: 200})
})




'Mirror'.datatype({plex: true})
'supplier'.field({refersToParent: 'Supplier'})
'stockIsMirrored'.field({yesOrNo: true})
'url'.field({allowEmpty: false, caption: 'URL'})
'format'.field()
'mappingType'.field()
'supplierSkuColumnNumber'.field({numeric: true, decimals: 0, caption: 'Supplier SKU Column Number'})
'skuColumnNumber'.field({numeric: true, decimals: 0, caption: 'SKU Column Number'})
'externalPriceColumnNumber'.field({numeric: true, decimals: 0, caption: 'Price Column Number'})
'externalPriceFXColumnNumber'.field({numeric: true, decimals: 0, caption: 'Foreign Currency Price Column Number'})
'externalQuantityOnHandColumnNumber'.field({numeric: true, decimals: 0, caption: 'Quantity On Hand Column Number'})
'supplierSkuColumnHeading'.field({caption: 'Supplier SKU Column Heading'})
'skuColumnHeading'.field({caption: 'SKU Column Heading'})
'externalPriceColumnHeading'.field({caption: 'Price Column Heading'})
'externalPriceFXColumnHeading'.field({caption: 'Foreign Currency Price Column Heading'})
'externalQuantityOnHandColumnHeading'.field({caption: 'Quantity On Hand Column Heading'})
'lastLoadAttemptDate'.field({date: true, allowEmpty: true})
'lastLoadAttemptTime'.field()
'lastLoadResult'.field()
'username'.field()
'password'.field()
'delimiter'.field()

'lastLoadAttemptDate'.inception(global.emptyYMD())

'Mirror'.method('load', async function() {

  let loadedCount = 0

  let csvToArray = (strData) => {
    let strDelimiter = this.delimiter
    if ( ! strDelimiter )
      strDelimiter = ','
    var objPattern = new RegExp(
      (
        "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +
        "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
        "([^\"\\" + strDelimiter + "\\r\\n]*))"
      ),
        "gi"
      );
    var arrData = [[]];
    var arrMatches = null;
    while ( true ) {
      arrMatches = objPattern.exec( strData )
      if ( ! arrMatches )
        break
      var strMatchedDelimiter = arrMatches[ 1 ];
      if (
        strMatchedDelimiter.length &&
        strMatchedDelimiter !== strDelimiter
        ){
        arrData.push( [] );
      }
      var strMatchedValue;
      if (arrMatches[ 2 ]){
        strMatchedValue = arrMatches[ 2 ].replace(
            new RegExp( "\"\"", "g" ),
            "\""
            );
      } else {
        strMatchedValue = arrMatches[ 3 ];
      }
      arrData[ arrData.length - 1 ].push( strMatchedValue );
    }
    return arrData
  }

  let getCsv = async () => {
    let options = 
      {
        method: 'GET',
        headers: {'Accept': 'text/csv', 'Content-Type': 'text/csv'},
      }
    if ( this.username )
      options.headers.Authorization = 'Basic ' + btoa(this.username + ":" + this.password);
    var resp = await fetch(this.url, options)
    if ( resp.status >= 400 && resp.status < 600 )
      throw(new Error('There was a problem communicating with the host:'.translate() + ' ' +
        this.url + '.'))
    return await resp.text()
  }

  let rowAndColToValue = (row, col, opt) => {
    let realCol = col - 1
    if ( realCol < 0 )
      return null
    if ( realCol >= row.length )
      throw(new Error('Column ' + col + ' not found'))
    let res = row[realCol]
    if ( opt && opt.numeric )
      res = parseFloat(res + '', 10)
    return res
  }

  let supplierSkuToInventory = async supplierSku => {
    let avenue = await 'Avenue'.bringFirst({sku: supplierSku, supplier: this.supplier}, {useIndexedField: 'sku'})
    if ( ! avenue )
      return null
    return await avenue.toInventory()
  }

  let skuToInventory = async sku => {
    if ( ! sku ) return null
    let product = await 'products'.bringFirst({_sku: sku}); if ( ! product ) return null
    return await product.toInventory({allowCreate: true})
  }

  let rowToInventory = async row => {
    let res
    let supplierSku = rowAndColToValue(row, this.supplierSkuColumnNumber)
    if ( supplierSku )
      res = await supplierSkuToInventory(supplierSku)
    if ( res )
      return res
    let sku = rowAndColToValue(row, this.skuColumnNumber)
    if ( sku )
      res = await skuToInventory(sku)
    if ( ! res )
      throw(new Error('Unable to find product.  SKU: ' + sku + '; Supplier SKU: ' + supplierSku))
    return res
  }

  let processRow = async row => {
    let inventory = await rowToInventory(row) // note: raises exception if not found
    let avenue = await inventory.supplierRefToAvenue(this.supplier)
    if ( ! avenue )
      throw(new Error('Product is not configured as supplied by this supplier. SKU: ' + inventory.sku))
    avenue.externalQuantityOnHand = rowAndColToValue(row, this.externalQuantityOnHandColumnNumber, {numeric: true})
    avenue.externalPrice = rowAndColToValue(row, this.externalPriceColumnNumber, {numeric: true})
    avenue.externalPriceFX = rowAndColToValue(row, this.externalPriceFXColumnNumber, {numeric: true})
    await inventory.refreshExternals()
  }

  let refreshColumnNumber = (headings, fieldName) => {
    let heading = this[fieldName + 'ColumnHeading']
    let idx
    if ( heading ) {
      idx = headings.indexOf(heading)
      if ( idx < 0 )
        throw(new Error('Heading ' + heading + ' was not found'))
    } else {
      idx = -2
    }
    this[fieldName + 'ColumnNumber'] = idx + 1
  }

  let processHeading = headings => {
    refreshColumnNumber(headings, 'supplierSku')
    refreshColumnNumber(headings, 'sku')
    refreshColumnNumber(headings, 'externalQuantityOnHand')
    refreshColumnNumber(headings, 'externalPrice')
    refreshColumnNumber(headings, 'externalPriceFX')
  }

  let doLoad = async () => {
    let csv = await getCsv()
    let array = csvToArray(csv)
    let rowNo = 0
    if ( this.mappingType === 'Column Headings' ) {
      processHeading(array[0])
      rowNo = 1
    }
    while ( rowNo < array.length ) {
      let row = array[rowNo]
      if ( (row.length === 1) && (! row[0]) && (rowNo === (array.length - 1)) )
        break;
      try { 
        await processRow(row)
        loadedCount++
      } catch(e) {
        throw(new Error('Error on row ' + (rowNo + 1) + ': ' + e.message))
      }
      rowNo++
    }
  }

  global.showSpinner({immediate: true})
  await this.reretrieve() // so that save is triggered properly below
  this.lastLoadAttemptDate = global.todayYMD()
  this.lastLoadAttemptTime = new Date().toLocaleTimeString()
  this.lastLoadResult = 'Incomplete'
  await global.app.save()
  await this.reretrieve()
  try {
    try {
      await doLoad()
      this.lastLoadResult = 'Successfully loaded'.translate() + ' ' + loadedCount + ' ' + 'records'.translate()
    } catch(e) {
      global.foreman.doCancelChanges()
      await 'Configuration'.bring() // Make sure this is re-cached
      this.lastLoadResult = e.message
    }
    await global.app.save()
  } finally {
    global.hideSpinner()
  }
})

'format'.inception('CSV')

'mappingType'.options(['Column Numbers', 'Column Headings'])

'mappingType'.inception('Column Numbers')

'supplierSkuColumnNumber'.inception(1)

'externalPriceColumnNumber'.inception(2)

'externalPriceFXColumnNumber'.inception(3)

'externalQuantityOnHandColumnNumber'.inception(4)

'supplierSkuColumnHeading'.inception('supplierSku')

'externalPriceColumnHeading'.inception('price')

'externalPriceFXColumnHeading'.inception('priceFX')

'externalQuantityOnHandColumnHeading'.inception('quantityOnHand')

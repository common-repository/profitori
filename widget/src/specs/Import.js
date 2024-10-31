import XLSImporter from '../XLSImporter.js'
'Import'.page({readOnly: false})
'Import'.title()
'Back'.action({act: 'cancel'})
'Start Importing'.action()
'file'.field({caption: "Excel File to Import From", file: true})

'file'.guidance('Choose an Excel file. To get an example file, use Profitori > Settings > Utilities > Export.')

'file'.accept('.xls,.xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel')

'file'.afterChoosingFile(async (page, files) => {
  if ( files.length !== 1 ) {
    page.app().showMessage('Please select a single file')
    return
  }
  let f = files[0]
  let reader = new FileReader()
  reader.onload = function(e) {
    let binaryData = e.target.result
    page.xlsData = binaryData
  }
  reader.readAsBinaryString(f);
})

'Start Importing'.act(async (page) => {

  let ignoreErrors = false

  let saveChanges = () => {
    global.foreman.doAtomicSave()
    .then((err) => {
      if ( err ) {
        let errCast = global.foreman.errorCast
        let prefix = ''
        if ( errCast && errCast.__importRowNo ) 
          prefix = "Row " + errCast.__importRowNo + " - "
        let msg = prefix + 'Changes were not saved due to error: ' + err
        page.app().showMessage(msg)
        global.foreman.flushCache({force: true})
        'Configuration'.bring() // Make sure this is re-cached
        return
      }
      page.app().showMessage('Changes were saved successfully')
    })
  }

  let getTestJson = () => {
    if ( ! global._testJsons ) return null
    return global._testJsons['Excel File to Import From']
  }

  let testJson = getTestJson()
  if ( (! page.xlsData) && (! testJson) ) {
    page.app().showMessage('Please select a file')
    return
  }
  await global.foreman.doSave({msgOnException: true})
  await page.app().harmonize()
  let importer = new XLSImporter()
  importer.ignoreErrors = ignoreErrors
  if ( page.xlsData )
    await importer.importData(page.xlsData)
  else
    await importer.importData(testJson, {json: true, datatype: global.lastExportedDatatype})
  if ( importer.errorMsg ) {
    page.app().showMessage(importer.errorMsg + " (No data was imported)")
    global.foreman.flushCache({force: true})
    await 'Configuration'.bring() // Make sure this is re-cached
    await 'Mod'.bring() // Make sure this is re-cached
    await 'Extension'.bring() // Make sure this is re-cached
    return
  }
  let msg = 
    importer.datatype + ': ' +
    'creating: '.translate() + importer.createdCount + ', ' +
    'updating: '.translate() + importer.updatedCount + ', ' + 
    'unchanged: '.translate() + importer.unchangedCount
  if ( ignoreErrors )
    msg += ', ' + 'errors: '.translate() + importer.errorCount
  msg += '. Do you want to save these changes?'
  page.app().showMessage(
    msg, 
    { yesNo: true, 
      onYes: saveChanges,
      onNo: () => { global.foreman.flushCache({force: true}); 'Configuration'.bring() } // Make sure this is re-cached
    }
  )
})

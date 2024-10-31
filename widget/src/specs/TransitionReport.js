'TransitionReport'.list({withHeader: true})
'PO Stage and Status Transitions Report'.title()
'Back'.action({act: 'cancel'})
'Download to Excel'.action({act: 'excel'})
'fromDate'.field({date: true})
'toDate'.field({date: true})

'Lines'.manifest()
'Go'.action({place: 'header', spinner: true})
'Transition'.datatype()
'purchaseOrder'.field({showAsLink: true})
'supplier'.field({refersTo: 'Supplier', showAsLink: true})
'oldStage'.field()
'newStage'.field()
'oldStatus'.field()
'newStatus'.field()
'transitionDate'.field({caption: 'Date'})
'transitionTime'.field({caption: 'Time'})
'user'.field({refersTo: 'users'})

'supplier'.calculate(async transition => {
  let po = await transition.referee('purchaseOrder'); if ( ! po ) return null
  let supplier = await po.toSupplier(); if ( ! supplier ) return null
  return supplier.reference()
})

'fromDate'.default(async (list) => {
  let c = await 'Configuration'.bringSingle(); if ( ! c ) return
  return c.viewFromDate
})

'toDate'.default(async (list) => {
  let c = await 'Configuration'.bringSingle(); if ( ! c ) return
  return c.viewToDate
})

'Go'.act(async (list) => {

  let saveSetting = async (fieldName, settingFieldName) => {
    let c = await 'Configuration'.bringOrCreate()
    let v = list.getFieldValue(fieldName)
    c[settingFieldName] = v
  }

  if ( global.confVal('ptr') !== 'Yes' ) {
    list.showMessage('Transitions not turned on - turn on in Settings to start collecting transition data'.translate())
    return
  }
  await saveSetting('fromDate', 'viewFromDate')
  await saveSetting('toDate', 'viewToDate')

  list.refresh()
})

'Lines'.filter(async (transition, list) => {
  let fromDate = list.getFieldValue('fromDate')
  if ( (! fromDate) || fromDate.isEmptyYMD() ) fromDate = "0000-00-00"
  let toDate = list.getFieldValue('toDate')
  if ( (! toDate) || toDate.isEmptyYMD() ) toDate = "9999-99-99"
  if ( transition.transitionDate < fromDate ) return false
  if ( transition.transitionDate > toDate ) return false
  return true
})


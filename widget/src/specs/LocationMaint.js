'LocationMaint'.maint({icon: 'Cubes'})
'Add Location'.title({when: 'adding'})
'Edit Location'.title({when: 'editing'})
'Back'.action({act: 'cancel'})
'OK'.action({act: 'ok'})
'Save'.action({act: 'save'})
'Add another'.action({act: 'add'})
'Location'.datatype({plex: false}) // turned off plex for now - caused Location to fail to retrive sometimes
'locationName'.field({key: true, caption: 'Name'})
'parentLocation'.field({refersTo: 'Location'})
/*
'stockOnHandAccount'.field({refersTo: 'Account'})
'madeCreditAccount'.field({refersTo: 'Account'})
'consumedDebitAccount'.field({refersTo: 'Account'})
'syncCreditAccount'.field({refersTo: 'Account'})
'cogsAccount'.field({refersTo: 'Account'})
'transfersSuspenseAccount'.field({refersTo: 'Account'})
'adjustmentSuspenseAccount'.field({refersTo: 'Account'})
'poClearingAccount'.field({refersTo: 'Account'})
'valueAdjustmentsAccount'.field({refersTo: 'Account'})
'salesIncomeAccount'.field({refersTo: 'Account'})
'salesDebitAccount'.field({refersTo: 'Account'})
'suspenseAccount'.field({refersTo: 'Account'})
*/

/*
'Location'.method('initAutoAccounts', async function() {

  let codeToAccountRef = async code => {
    let account = await 'Account'.bringSingle({accountCode: code})
    return account.reference()
  }

  this.stockOnHandAccount = await codeToAccountRef('010300')
  this.madeCreditAccount = await codeToAccountRef('02020101') // Accrued Overhead
  this.consumedDebitAccount = await codeToAccountRef('02020101')
  this.syncCreditAccount = await codeToAccountRef('02020102') // Inventory Adjustments
  this.cogsAccount = await codeToAccountRef('050201')
  this.transfersSuspenseAccount = await codeToAccountRef('02020103') // Inventory Transfer Clearing
  this.adjustmentSuspenseAccount = await codeToAccountRef('02020102') // Inventory Adjustments
  this.poClearingAccount = await codeToAccountRef('02010101')
  this.valueAdjustmentsAccount = await codeToAccountRef('02020104') // Inventory Value Adjustment Clearing
  this.salesIncomeAccount = await codeToAccountRef('040101')
  this.salesDebitAccount = await codeToAccountRef('01010101')
  this.suspenseAccount = await codeToAccountRef('010400')
})

'Location'.method('sourceAndDrCrToAccount', async function(source, drcr, domain) {

  let sourceAndDrCrToFieldName = (source, drcr, domain) => {
    if ( domain === 'Price' ) {
      if ( (source === 'Sale') || (source === 'Serial/Lot Sale') ) {
        if ( drcr === 'DR' )
          return 'salesDebitAccount'
        else
          return 'salesIncomeAccount'
      }
      return
    }
    if ( (source === 'Sale') || (source === 'Serial/Lot Sale') || (source === 'Consumed') )
      drcr = (drcr === 'DR') ? 'CR' : 'DR' // Because the normal sign of these is negative
    if ( source === 'Made' ) {
      if ( drcr === 'DR' )
        return 'stockOnHandAccount'
      else
        return 'madeCreditAccount'
    } else if ( source === 'Consumed' ) {
      if ( drcr === 'DR' )
        return 'consumedDebitAccount'
      else
        return 'stockOnHandAccount'
    } else if ( source === 'Adjustment' ) {
      if ( drcr === 'DR' )
        return 'stockOnHandAccount'
      else
        return 'adjustmentSuspenseAccount'
    } else if ( source === 'Sync to WC' ) {
      if ( drcr === 'DR' )
        return 'stockOnHandAccount'
      else
        return 'syncCreditAccount'
    } else if ( (source === 'Sale') || (source === 'Serial/Lot Sale') ) {
      if ( drcr === 'DR' )
        return 'cogsAccount'
      else
        return 'stockOnHandAccount'
    } else if ( source === 'Transfer' ) {
      if ( drcr === 'DR' )
        return 'stockOnHandAccount'
      else
        return 'transfersSuspenseAccount'
    } else if ( source === 'PO Receipt' ) {
      if ( drcr === 'DR' )
        return 'stockOnHandAccount'
      else
        return 'poClearingAccount'
    } else if ( source === 'Value Adjustment' ) {
      if ( drcr === 'DR' )
        return 'stockOnHandAccount'
      else
        return 'valueAdjustmentsAccount'
    }
  }

  let getSuspenseAccount = async () => {
    let res = await this.referee('suspenseAccount')
    if ( ! res )
      res = await 'Account'.bringSingle({accountCode: '030204'})
    return res
  }

    Made
      DR Location.stockOnHandAccount
      CR Location.madeCreditAccount
    Consumed
      CR Location.stockOnHandAccount
      DR Location.consumedDebitAccount
    Sync to WC
      DR Location.stockOnHandAccount
      CR Location.syncCreditAccount
    Sale or Serial/Lot Sale (Product)
      CR Location.salesIncomeAccount
      DR Location.salesDebitAccount
      DR Location.cogsAccount
      CR Location.stockOnHandAccount
    Sale (non-Product)
      CR LineType.salesIncomeAccount
      DR LineType.salesDebitAccount
    Transfer
      DR toLocation.stockOnHandAccount
      CR fromLocation.stockOnHandAccount
PO (product)
      DR Location.poClearingAccount
      CR Location.purchaseCreditAccount
PO (non-product)
      DR LineType.expectedNonProductReceiptsAccount
      CR LineType.purchaseCreditAccount
    PO Receipt (product)
      DR Location.stockOnHandAccount
      CR Location.poClearingAccount
    PO Receipt (non-product)
      DR LineType.nonProductReceiptsAccount
      CR LineType.expectedNonProductReceiptsAccount
    Value Adjustment

  let fieldName = sourceAndDrCrToFieldName(source, drcr, domain)
  let res = await this.referee(fieldName)
  if ( ! res )
    res = await getSuspenseAccount()
  return res
})
*/

'LocationMaint'.readOnly( (maint, location) => {
  if (location.locationName === "General")
    return 'The General location cannot be altered'
})

'parentLocation'.excludeChoiceWhen( async (maint, choice) => maint.id() === choice.id )

'parentLocation'.inception(async () => {
  return 'General'
})

'Location'.allowTrash(async function() {
  if ( this.locationName === "General" ) 
    return 'The "General" location cannot be trashed'
  if ( await this.hasClusters() )
    return 'This location has inventory data and cannot be trashed'
  return null
})

'Location'.method('hasClusters', async function() {
  let cluster = await 'Cluster'.bringFirst({location: this})
  return cluster ? true : false
})

'Location'.beforeSaving(async function() {
  if ( this.locationName === 'General' ) return
  if ( ! this.parentLocation ) 
    throw(new Error('You must enter a parent location'))
})

'Location'.method('toParentLocation', async location => {
  let parentRef = location.parentLocation
  if ( (! parentRef) || (! parentRef.id) ) 
    return await 'Location'.bringSingle({locationName: 'General'})
  let res = await 'Location'.bringSingle({id: parentRef.id})
  return res
})

'LocationMaint'.makeDestinationFor('Location')

'SupplierMaint'.maint({panelStyle: "titled", icon: 'UserFriends'})
'Add Supplier'.title({when: 'adding'})
'Edit Supplier'.title({when: 'editing'})
'Back'.action({act: 'cancel'})
'OK'.action({act: 'ok'})
'Save'.action({act: 'save'})
'View Orders'.action({spec: "POReport.js"})
'View Products'.action({spec: "ProductReport.js"})
'Add another'.action({act: 'add'})
'Attachments'.action({act: 'attachments'})
'Mirror Stock'.action()
'Supplier'.datatype({plex: true})

'Supplier Information'.panel()
'name'.field({key: true})
'code'.field({caption: "Supplier Code", indexed: true})
'taxNumber'.field()
'mainContactPerson'.field()
'phone'.field()
'mobile'.field()
'fax'.field()
'email'.field()
'orderingEmail'.field()
'webSite'.field()
'orderingUrl'.field({caption: 'Ordering URL'})
'b2b'.field({caption: 'B2B'})
'b2bUser'.field({caption: 'B2B Login User'})
'b2bPassword'.field({caption: 'B2B Login Password'})
'notes'.field({multiLine: true})

'Address'.panel()
'address'.field()
'city'.field({caption: 'City/Suburb/Town'})
'state'.field({caption: 'State/Province'})
'postcode'.field({caption: 'Postal/Zip Code'})
'country'.field({caption: 'Country'})

'Settings'.panel()
'currency2'.field({refersTo: 'Currency', caption: 'Currency'})
'taxPct'.field({numeric: true, decimals: 2, caption: "Tax %"})
'discountPct'.field({numeric: true, decimals: 2, caption: "Discount %"})
'minimumOrderValue'.field({numeric: true, decimals: 2})
'deliveryLeadDays'.field({numeric: true})
'maximumDaysBetweenDeliveries'.field({numeric: true})
'currency'.field({caption: 'Currency (From external system)'})
'stockIsMirrored'.field({yesOrNo: true, readOnly: true})

'SupplierMaint'.makeDestinationFor('Supplier')

'Mirror Stock'.act(async (maint, supplier) => {
  let mirror = await 'Mirror'.bringFirst({supplier: supplier.reference()})
  if ( mirror )
    await maint.segue('edit', 'MirrorMaint.js', mirror)
  else
    await maint.segue('add', 'MirrorMaint.js')
})

'stockIsMirrored'.calculate(async supplier => {
  let mirror = await 'Mirror'.bringFirst({supplier: supplier.reference()}); if ( ! mirror ) return 'No'
  return mirror.stockIsMirrored
})

'Supplier'.method('toLastPOReceipt', async function() {
  let recs = await 'POReceipt'.bring({supplier: this})
  let res = null
  let latestDate = global.emptyYMD()
  for ( var i = 0; i < recs.length; i++ ) {
    let rec = recs[i]
    if ( rec.receivedDate > latestDate ) {
      res = rec
      latestDate = rec.receivedDate
    }
  }
  return res
})

'Supplier'.method('getFullAddress',
  function() {
    let res = this.address + ", " + this.city + ", " + this.state + " " + this.postcode
    let c = this.country
    if ( c )
      res += ", " + c
    return res
  }
)

'taxPct'.inception(async (supplier) => {
  let config = await 'Configuration'.bringSingle(); if ( ! config ) return 0
  return config.taxPct
})

'currency'.visibleWhen((maint, supplier) => {
  return supplier.currency ? true : false
})

'Supplier'.method('toProducts', async function() {
  let res = []
  let avenues = await 'Avenue'.bring({supplier: this})
  for ( var i = 0; i < avenues.length; i++ ) {
    let avenue = avenues[i]
    if ( avenue.isMain !== "Yes" ) continue
    let product = await avenue.toProduct(); if ( ! product ) continue
    res.push(product)
  }
  return res
})

'CurrencyList'.list({expose: true, icon: 'Coins', suppressOnMoreMenu: true})
'Currencies'.title()
'Back'.action({act: 'cancel'})
'Add'.action({act: 'add'})
'Currency'.datatype()
'currencyCode'.field()
'exchangeRate'.field({caption: "Exchange Rate"})
'Edit'.action({place: 'row', act: 'edit'})
'Trash'.action({place: 'row', act: 'trash'})
'CurrencyMaint.js'.maintSpecname()

'Currency'.allowTrash(async function() {
  let suppliers = await 'Supplier'.bring({currency2: this.reference()})
  if ( suppliers.length > 0 ) return "Currency has been referenced on Suppliers and cannot be trashed"
  let poList = await 'PO'.bring({currency: this.reference()})
  if ( poList.length > 0 ) return "Currency has been referenced on Purchase Orders and cannot be trashed"
  return null
})

'InventoryHistory'.list({withHeader: true, icon: 'History'})
'Inventory History'.title()
'product'.field({readOnly: true})
'Back'.action({act: 'cancel'})
'View Purchase Order Lines'.action({spec: 'ViewPOLines.js'})
'Download to Excel'.action({act: 'excel'})

'InventoryHistory'.limitToSubset('Recent')

'Lines'.manifest()
'Transaction'.datatype()
'inventory'.field({refersToParent: 'Inventory', hidden: true})
'date'.field({date: true, caption: 'Eff Date'})
'createdDate'.field()
'createdTime'.field()
'location'.field()
'lot'.field()
'quantity'.field({numeric: true})
'balance'.field({numeric: true, ephemeral: true})
'unitCost'.field()
'value'.field()
'source'.field()
'reference'.field({showAsLink: true})
'userLogin'.field()
'notes'.field()

'Lines'.defaultSort({field: "date", descending: true})

'Lines'.criteria(async function () {
  let c = this.callerCast()
  let inventory
  if ( c.datatype() === "Inventory" )
    inventory = c
  else {
    let product = this.callerCast(); if ( ! product ) return null
    inventory = await 'Inventory'.bringSingle({product: product}); if ( ! inventory ) return {parentId: -99999999}
  }
  let res = {parentId: inventory.id}
  return res
})

'product'.default((list) => {
  let cc = list.callerCast()
  if ( cc.datatype() === "Inventory" )
    return cc.productName
  return cc.uniqueName
})

'Lines'.afterFieldCalculations(async (casts, list) => {
  
  let sortCastsByDateDesc = () => {
    let res = casts.slice(0) // copy
    res.sort(
      (a, b) => { 
        if ( a.date === b.date )
          return a.id < b.id ? 1 : -1
        return a.date < b.date ? 1 : -1 
      }
    )
    return res
  }

  let getCurrentBalance = async () => {
    let cast = list.callerCast()
    let inventory
    if ( cast.datatype() === "Inventory" )
      inventory = cast
    else if ( cast.datatype() === "products" )
      inventory = await 'Inventory'.bringFirst({product: cast})
    else
      return 0
    //let product = list.getFieldValue('product')
    //let inventory = await 'Inventory'.bringFirst({product: product})
    if ( ! inventory )
      return 0
    return inventory.quantityOnHand
  }

  let sortedCasts = sortCastsByDateDesc()
  let balance = await getCurrentBalance()
  sortedCasts.forAll(tran => {
    tran.balance = balance
    balance -= tran.quantity
  })

})

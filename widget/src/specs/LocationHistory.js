'LocationHistory'.list({withHeader: true})
'Location Inventory History'.title()
'location'.field({readOnly: true})
'product'.field({readOnly: true})
'Back'.action({act: 'cancel'})
'Download to Excel'.action({act: 'excel'})

'LocationHistory'.limitToSubset('Recent')

'Lines'.manifest()
'Transaction'.datatype()
'inventory'.field({refersToParent: 'Inventory', hidden: true})
'date'.field({date: true})
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
  let cluster = this.callerCast()
  let inventory = await cluster.toInventory(); if ( ! inventory ) return null
  let res = {parentId: inventory.id}
  return res
})

'Lines'.filter(async (transaction, list) => {
  let trLocName = await transaction.toLocationName()
  let locName = list.getFieldValue('location')
  return (trLocName === locName)
})

'product'.default(async (list) => {
  let cluster = list.callerCast()
  return await cluster.toProductUniqueName()
})

'location'.default(async (list) => {
  let cluster = list.callerCast()
  return await cluster.toLocationName()
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
    let cluster = list.callerCast()
    return cluster.quantityOnHand
  }

  let sortedCasts = sortCastsByDateDesc()
  let balance = await getCurrentBalance()
  sortedCasts.forAll(tran => {
    tran.balance = balance
    balance -= tran.quantity
  })

})

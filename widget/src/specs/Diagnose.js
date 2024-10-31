'Diagnose'.list()
'Diagnose Stock Issues'.title()
'Back'.action({act: 'cancel'})
'Refresh'.action({act: "refresh"})
'Download to Excel'.action({act: 'excel'})
'Clues'.action({spec: 'ClueList.js'})
'Diagnosis'.datatype({transient: true})
'product'.field({refersTo: 'products', showAsLink:true})
'discrepancy'.field({numeric: true})

'Diagnose'.beforeLoading(async list => {

  let diagnoseInventory = async inv => {
    let trs = await 'Transaction'.bring({inventory: inv.reference()})
    let bal = 0
    for ( var i = 0; i < trs.length; i++ ) {
      let tr = trs[i]
      bal += tr.quantity
    }
    if ( bal === inv.quantityOnHand ) 
      return
    let d = await 'Diagnosis'.create(null, {product: inv.product})
    d.discrepancy = inv.quantityOnHand - bal
  }

  'Diagnosis'.clear()
  let inventories = await 'Inventory'.bring()
  for ( var i = 0; i < inventories.length; i++ ) {
    let inventory = inventories[i]
    await diagnoseInventory(inventory)
  }
})


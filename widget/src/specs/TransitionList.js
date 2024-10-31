'TransitionList'.list()
'PO Transitions'.title()
'Back'.action({act: 'cancel'})
'Download to Excel'.action({act: 'excel'})

'Transition'.datatype()
'oldStage'.field()
'newStage'.field()
'oldStatus'.field()
'newStatus'.field()
'transitionDate'.field({caption: 'Date'})
'transitionTime'.field({caption: 'Time'})
'user'.field({refersTo: 'users'})

'TransitionList'.criteria(async function () {
  let c = this.callerCast()
  let po
  if ( c.datatype() === "PO" )
    po = c
  if ( ! po ) return null
  let res = {purchaseOrder: po}
  return res
})


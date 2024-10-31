'AgentMaint'.maint()
'Add Sales Agent'.title({when: 'adding'})
'Edit Sales Agent'.title({when: 'editing'})
'Back'.action({act: 'cancel'})
'OK'.action({act: 'ok'})
'Save'.action({act: 'save'})
'Add another'.action({act: 'add'})
'Agent'.datatype({caption: 'Sales Agent'})

'agentName'.field({key: true, caption: 'Name'})
'wcUserName'.field({caption: 'WooCommerce Username'})
'commissionPercent'.field({numeric: true, decimals: 2})

'AgentMaint'.makeDestinationFor('Agent')

'Agent'.allowTrash(async function() {
  let tie = await 'Tie'.bringFirst({agent: this.reference()})
  if ( tie ) 
    return "Agent has been referenced on Customer ".translate() + tie.customer.id + " and so cannot be trashed".translate()
  return null
})

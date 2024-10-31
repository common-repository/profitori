'TieMaint'.maint()
'Add Customer Sales Agent'.title({when: 'adding'})
'Edit Customer Sales Agent'.title({when: 'editing'})
'Back'.action({act: 'cancel'})
'OK'.action({act: 'ok'})
'Save'.action({act: 'save'})
'Add another'.action({act: 'add'})
'Tie'.datatype({caption: 'Customer Sales Agent'})
'customer'.field({refersToParent: 'users', readOnly: true, hidden: true, indexed: true})
'agent'.field({refersTo: 'Agent', allowEmpty: false})

'TieMaint'.makeDestinationFor('Tie')

'TieMaint'.dynamicTitle(function() {
  let customer = this.parentCast(); if ( ! customer ) return
  let verb = this.isAdding() ? 'Add'.translate() : 'Edit'.translate()
  let res = (verb + ' Agent for Customer').translate() + ' ' + customer.display_name
  return res
})

'Tie'.beforeSaving(async function() {
  let customer = await this.referee('customer'); if ( ! customer ) return null
  let ties = await 'Tie'.bringChildrenOf(customer)
  let thisAgent = await this.toAgent()
  let thisAgentId = thisAgent ? thisAgent.id : null
  for ( var i = 0; i < ties.length; i++ ) {
    let tie = ties[i]
    if ( tie.id === this.id ) continue
    let otherAgent = await tie.toAgent()
    let otherAgentId = otherAgent ? otherAgent.id : null
    if ( (this.isNew() || this.propChanged('agent')) && (thisAgentId === otherAgentId) ) {
      throw(new Error("This agent is already an agent for this customer"))
    }
  }
})

'Tie'.method('toAgent', async function() {
  return await this.referee('agent')
})

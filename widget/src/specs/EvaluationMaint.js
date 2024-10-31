'EvaluationMaint'.maint({icon: 'FunnelDollar'})
'Adjust Inventory Value'.title({when: 'adding'})
'View Value Adjustment'.title({when: 'editing'})
'Back'.action({act: 'cancel'})
'OK'.action({act: 'ok'})
'Save'.action({act: 'save'})
'Attachments'.action({act: 'attachments'})
'Evaluation'.datatype()
'evaluationNumber'.field()
'date'.field()
'product'.field({readOnly: true, showAsLink: true})
'quantityOnHand'.field({readOnly: true})
'inventoryValue'.field({readOnly: true})
'inventoryValueExclTax'.field({readOnly: true})
'avgUnitCost'.field()
'avgUnitCostExclTax'.field()
'notes'.field({multiLine: true})

'avgUnitCost'.visibleWhen((maint, evaluation) => {
  let configuration = 'Configuration'.bringSingleFast(); if ( ! configuration ) return true
  return configuration.enterPurchasePricesInclusiveOfTax === 'Yes'
})

'inventoryValue'.visibleWhen((maint, evaluation) => {
  let configuration = 'Configuration'.bringSingleFast(); if ( ! configuration ) return true
  return configuration.enterPurchasePricesInclusiveOfTax === 'Yes'
})

'avgUnitCostExclTax'.visibleWhen((maint, evaluation) => {
  let configuration = 'Configuration'.bringSingleFast(); if ( ! configuration ) return true
  return configuration.enterPurchasePricesInclusiveOfTax !== 'Yes'
})

'inventoryValueExclTax'.visibleWhen((maint, evaluation) => {
  let configuration = 'Configuration'.bringSingleFast(); if ( ! configuration ) return true
  return configuration.enterPurchasePricesInclusiveOfTax !== 'Yes'
})

'EvaluationMaint'.makeDestinationFor('Evaluation')

'EvaluationMaint'.readOnly( (maint, evaluation) => {
  if ( ! evaluation.isNew() )
    return 'Value Adjustments cannot be altered - please add a new value adjustment instead'
})

'EvaluationMaint'.whenAdding(async function(evaluation, maint) {

  let getProduct = async () => {
    let c = this.callerCast(); if ( ! c ) return null
    if ( c.datatype() === 'products' ) 
      return c
    if ( c.datatype() !== 'Inventory' ) return null
    let prodRef = c.product; if ( ! prodRef ) return null
    let prodId = prodRef.id; if ( ! prodId ) return null
    let res = await 'products'.bringSingle({id: prodId});
    return res
  }

  let defaultEvaluationNumber = async () => {
    let nextNo = await 'NextNumber'.bringOrCreate({forDatatype: 'Evaluation'})
    nextNo.number = nextNo.number + 1
    let noStr = nextNo.number + ""
    let adjNo = "VA" + noStr.padStart(5, '0')
    this.setFieldValue('evaluationNumber', adjNo)
  }

  let refreshProduct = async () => {
    //let c = this.callerCast(); if ( ! c ) return 
    //if ( c.datatype() !== "products" ) return
    let p = await getProduct(); if ( ! p ) return
    let prodRef = p.reference()
    this.setFieldValue('product', prodRef)
  }

  let defaultUnitCost = async() => {
    let p = await getProduct(); if ( ! p ) return
    let prodRef = p.reference()
    let inv = await 'Inventory'.bringSingle({product: prodRef}); if ( ! inv ) return
    let cost = inv.avgUnitCost
    let costExclTax = inv.avgUnitCostExclTax
    if ( cost === global.unknownNumber() ) {
      cost = 0
      costExclTax = 0
    }
    this.setFieldValue('avgUnitCost', cost)
    this.setFieldValue('avgUnitCostExclTax', costExclTax)
  }

  await refreshProduct()
  await defaultEvaluationNumber()
  await defaultUnitCost()

})


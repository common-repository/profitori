'ImportUnitCosts'.list({withHeader: true})
'Import Unit Costs'.title()
'Back'.action({act: 'cancel'})
'source'.field({refersTo: 'Source', caption: 'WC Product Attribute to import into Profitori Avg Unit Costs'})

'Lines'.manifest()
'Go'.action({place: 'header', spinner: true})
'products'.datatype({source: "WC"})
'uniqueName'.field({key: true, caption: "Product"})
'Inventory'.datatype()
'product'.field({refersTo: 'products', key: true, readOnly: true, hidden: true})
'avgUnitCost'.field({numeric: true, minDecimals: 2, maxDecimals: 6, caption: 'Avg Unit Cost'})

'source'.excludeChoiceWhen(async (list, source) => {
  return ! source.description.startsWith("WC Product")
})

'Go'.act(async (list) => {

  let generateEvaluationNumber = async () => {
    let res
    while ( true ) {
      let nextNo = await 'NextNumber'.bringOrCreate({forDatatype: 'Evaluation'})
      nextNo.number = nextNo.number + 1
      let noStr = nextNo.number + ""
      res = "VA" + noStr.padStart(5, '0')
      let ev = await 'Evaluation'.bringFirst({evaluationNumber: res})
      if ( ! ev )
        break
    }
    return res
  }

  let createEvaluation = async (aNewCost, aProduct) => {
    let no = await generateEvaluationNumber()
    let ev = await 'Evaluation'.bringOrCreate({evaluationNumber: no})
    ev.date = global.todayYMD()
    ev.product = aProduct.reference()
    ev.avgUnitCost = aNewCost
  }

  let addAttributeToProducts = () => {
    'products'.addExtraField({name: fieldName, realm: realm, numeric: true})
  }

  let productToCurrentCost = async product => {
    let inv = await 'Inventory'.bring({product: product.reference()})
    if ( ! inv )
      return 0
    return inv.avgUnitCost
  }

  let doImport = async function() {
    list.startProgress({message: "Importing..."})
    try {
      addAttributeToProducts()
      let products = await 'products'.bring()
      let len = products.length
      let done = 0
      await products.forAllAsync(async product => {
        let cost = product[fieldName]
        let currentCost = await productToCurrentCost(product)
        if ( ! currentCost ) currentCost = 0
        done++
        if ( cost === currentCost ) return "continue"
        await createEvaluation(cost, product)
        await list.foreman().doSave({msgOnException: true})
        await list.updateProgress(done / len)
      })
    } finally {
      list.stopProgress()
    }
    list.showMessage("Process complete - average unit costs have been updated")
  }

  //let source = 'source'.get()
  let source = list.getFieldValue('source')
  if ( ! source ) {
    list.showMessage("Please select an attribute to import from")
    return
  }
  let sourceDesc = source.keyval
  if ( ! sourceDesc.startsWith("WC Product") ) {
    list.showMessage("Inappropriate attribute - please select a WC Product attribute")
    return
  }
  let parts = sourceDesc.split('.')
  let realm = parts[0]
  let fieldName = parts[1]

  list.showMessage("WARNING: This will update all Profitori average unit costs. Are you sure?",
    {yesNo: true, onYes: doImport}
  )

})


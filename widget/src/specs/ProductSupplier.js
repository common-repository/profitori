'ProductSupplier'.datatype({exportable: true})
'productUniqueName'.field()
'supplierName'.field()

'ProductSupplier'.facade(async function() {
  let res = []
  let products = await 'products'.bring()
  for ( var i = 0; i < products.length; i++ ) {
    let product = products[i]
    let supplier = await product.toMainSupplier()
    let supplierName = supplier ? supplier.name : null
    res.push({id: product.id, productUniqueName: product.uniqueName, supplierName: supplierName})
  }
  return res
})

'ProductSupplier'.beforeSaving(async function() {
  let product = await 'products'.bringSingle({uniqueName: this.productUniqueName})
  if ( ! product )
    throw(new Error('Unknown product: ' + this.productUniqueName))
  let supplierName = this.supplierName; if ( ! supplierName ) return
  let supplier = await 'Supplier'.bringSingle({name: supplierName})
  if ( ! supplier )
    throw(new Error('Unknown supplier: ' + supplierName))
  let inventory = await product.toInventory({allowCreate: true})
  await inventory.setMainSupplier(supplier)
  inventory.refreshCalculations({force: true})
})

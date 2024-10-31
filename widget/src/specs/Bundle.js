'Bundle'.datatype()
'product'.field({refersTo: 'products', key: true, caption: 'Bundle Product'})
'overheadCost'.field({numeric: true, minDecimals: 2, maxDecimals: 6})

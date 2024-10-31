'Entry'.datatype({exportable: true})
'entryNumber'.field({key: true})
'effectiveDate'.field({date: true})
'enteredDate'.field({date: true})
'notes'.field({multiLine: true})
'balance'.field({numeric: true, minDecimals: 2, maxDecimals: 2, caption: 'Entry Balance'})
'posted'.field({yesOrNo: true})

'Entry'.method('updateFromSOLine', async function(location, saleValue) {
  if ( ! location ) return

  let getAccount = async drcr => {
    let res = await location.sourceAndDrCrToAccount('Sale', drcr, 'Price')
    return res
  }

  let updateLine = async (drcr, sign) => {
    let account = await getAccount(drcr)
    let line = await this.accountToLine(account)
    let amount = saleValue * sign
    if ( account.drcr === 'CR' )
      amount = - amount
    line.amount += amount
  }

  await updateLine('DR', +1)
  await updateLine('CR', -1)
})

'Entry'.method('accountToLine', async function(account) {
  let lines = await this.toLines()
  for ( var i = 0; i < lines.length; i++ ) {
    let line = lines[i]
    if ( account.id === line.account.id )
      return line
  }
  let res = await 'EntryLine'.create({parentCast: this}, {entry: this, account: account})
  return res
})

'Entry'.method('updateFromTransaction', async function(tran, qty) {

  let getAccount = async drcr => {
    let location = await tran.toLocation(); if ( ! location ) return null
    let res = await location.sourceAndDrCrToAccount(tran.source, drcr)
    return res
  }

  let updateLine = async (drcr, sign) => {
    let unitCost = (tran.unitCost === global.unknownNumber()) ? 0 : tran.unitCost
    let amount = qty * unitCost * sign
    let account = await getAccount(drcr); if ( ! account ) return
    let line = await this.accountToLine(account)
    if ( account.drcr === 'CR' )
      amount = - amount
    line.amount += amount
  }

  await updateLine('DR', +1)
  await updateLine('CR', -1)
})

'Entry'.method('refreshAccountBalances', async function() {
  let lines = await this.toLines()
  for ( var i = 0; i < lines.length; i++ ) {
    let line = lines[i]
    let account = await line.toAccount(); if ( ! account ) continue
    await account.refreshBalances()
  }
})

'Entry'.method('refreshBalance', async function() {
  let lines = await this.toLines()
  this.balance = 0
  for ( var i = 0; i < lines.length; i++ ) {
    let line = lines[i]
    let amount = await line.toDebitAmount()
    this.balance += amount
  }
  this.posted = (this.balance === 0) ? 'Yes' : 'No'
  await this.refreshAccountBalances()
})

'Entry'.method('toLines', async function() {
  let lines = await 'EntryLine'.bringChildrenOf(this)
  return lines
})

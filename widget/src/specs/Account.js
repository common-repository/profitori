'Account'.datatype()
'accountCode'.field({key: true})
'name'.field()
'type'.field({translateOnDisplay: true})
'taxTreatment'.field({translateOnDisplay: true})
'notes'.field()
'ytdBalance'.field({numeric: true, minDecimals: 2, maxDecimals: 2, caption: 'YTD Balance'})
'ptdBalance'.field({numeric: true, minDecimals: 2, maxDecimals: 2, caption: 'PTD Balance'})
'balance'.field({numeric: true, minDecimals: 2, maxDecimals: 2})
'uniqueName'.field({essence: true, caption: 'Name'})
'drcr'.field({caption: 'DR/CR'})

'Account'.method('periodToPTDBalance', async function(period) {
  if ( ! period ) return 0
  let pb = await 'PeriodBalance'.bringSingle({account: this, period: period})
  if ( ! pb ) return 0
  return pb.balance
})

'Account'.method('periodToYTDBalance', async function(period) {
  if ( ! period ) return 0
  let res = 0
  let endDate = period.endDate
  let year = await period.toYear()
  let startDate = year.startDate
  let pbs = await 'PeriodBalance'.bring({account: this})
  for ( var i = 0; i < pbs.length; i++ ) {
    let pb = pbs[i]
    if ( pb.startDate > endDate ) continue
    if ( pb.endDate < startDate ) continue
    res += pb.balance
  }
  return res
})

'Account'.method('periodToBalance', async function(period) {
  if ( ! period ) return 0
  let res = 0
  let endDate = period.endDate
  let pbs = await 'PeriodBalance'.bring({account: this})
  for ( var i = 0; i < pbs.length; i++ ) {
    let pb = pbs[i]
    if ( pb.startDate > endDate ) continue
    res += pb.balance
  }
  return res
})

'Account'.method('periodToPeriodBalance', async function(period) {
  return await 'PeriodBalance'.bringOrCreate({account: this, period: period})
})

'Account'.method('yearToYearBalance', async function(year) {
  return await 'YearBalance'.bringOrCreate({account: this, year: year})
})

'ytdBalance'.calculate(async account => {
  let c = await 'Configuration'.bringOrCreate()
  let year = await c.getCurrentYear(); if ( ! year ) return 0
  let yearBalance = await account.yearToYearBalance(year)
  return yearBalance.balance
})

'ptdBalance'.calculate(async account => {
  let c = await 'Configuration'.bringOrCreate()
  let period = await c.getCurrentPeriod(); if ( ! period ) return 0
  let periodBalance = await account.periodToPeriodBalance(period)
  return periodBalance.balance
})

'Account'.method('refreshBalances', async function() {

  let zeroPeriodBalances = async () => {
    let bals = await 'PeriodBalance'.bring({account: this})
    for ( var i = 0; i < bals.length; i++ ) {
      let bal = bals[i]
      bal.balance = 0
    }
  }

  let zeroYearBalances = async () => {
    let bals = await 'YearBalance'.bring({account: this})
    for ( var i = 0; i < bals.length; i++ ) {
      let bal = bals[i]
      bal.balance = 0
    }
  }

  let effDateToYear = async effDate => {
    let c = await 'Configuration'.bringOrCreate()
    let calendar = await c.referee('mainCalendar')
    let years = await calendar.toYears()
    for ( var i = 0; i < years.length; i++ ) {
      let year = years[i]
      if ( (year.startDate <= effDate) && (year.endDate >= effDate) )
        return year
    }
  }

  await zeroPeriodBalances()
  await zeroYearBalances()
  let lines = await 'EntryLine'.bring({account: this})
  this.balance = 0
  let year
  let yearBalance
  let period
  let periodBalance
  for ( var i = 0; i < lines.length; i++ ) {
    let line = lines[i]
    let posted = await line.isPosted()
    if ( ! posted ) continue
    this.balance += line.amount
    let effDate = line.effectiveDate
    if ( (! period) || (effDate < period.startDate) || (effDate > period.endDate) ) {
      year = await effDateToYear(effDate); if ( ! year ) continue
      yearBalance = await this.yearToYearBalance(year)
      period = await year.dateToPeriod(effDate)
      periodBalance = await this.periodToPeriodBalance(period)
    }
    periodBalance.balance += line.amount
    yearBalance.balance += line.amount
  }
})

'drcr'.calculate(account => {
  if ( (account.type === 'Asset') || (account.type === 'Expenditure') )
    return 'DR'
  return 'CR'
})

'type'.options(['Asset', 'Liability', 'Income', 'Expenditure', 'Equity'])

'taxTreatment'.options(['Taxed', 'Tax Free', 'Excluded'])

'uniqueName'.calculate(account => {
  return account.name + ' (' + account.accountCode + ')'
})

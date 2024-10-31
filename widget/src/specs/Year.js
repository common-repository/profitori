'Year'.datatype({exportable: true})
'calendar'.field({refersToParent: 'Calendar'})
'name'.field()
'startDate'.field({date: true})
'endDate'.field({date: true})

'Year'.method('toCalendar', async function() {
  return await this.referee('calendar')
})

'Year'.method('toCurrentPeriod', async function(options) {
  let date = global.todayYMD()
  let incDays = options && options.incDays
  if ( incDays )
    date = date.incDays(incDays)
  return await this.dateToPeriod(date)
})

'Year'.method('dateToPeriod', async function(date) {
  let periods = await this.toPeriods()
  for ( var i = 0; i < periods.length; i++ ) {
    let period = periods[i]
    if ( (period.startDate <= date) && (period.endDate >= date) )
      return period
  }
})

'Year'.method('initialise', async function() {
  
  let trashExistingPeriods = async () => {
    let periods = await this.toPeriods()
    for ( var i = 0; i < periods.length; i++ ) {
      let period = periods[i]
      await period.trash()
    }
  }

  await trashExistingPeriods()
  let startDate = this.startDate
  for ( var i = 1; i <= 12; i++ ) {
    let name = startDate.toMonthNameAbbrev() + ' ' + this.name
    //let yearNoStr = startDate.substr(0, 4)
    //let yearNoAbbrev = yearNoStr.substr(2, 2)
    //let name = yearNoStr + '/' + monthNoStr + ' (' + startDate.toMonthNameAbbrev() + ' ' + yearNoStr + ')'
    let period = await 'Period'.create({parentCast: this}, {year: this, name: name, number: i, startDate: startDate})
    startDate = startDate.incMonths(1)
    period.endDate = startDate.incDays(-1)
  }

})

'Year'.method('toPeriods', async function() {
  return await 'Period'.bringChildrenOf(this)
})

'Year'.method('getFirstPeriod', async function() {
  let periods = await this.toPeriods()
  let minStartDate = '9999-99-99'
  let res
  for ( var i = 0; i < periods.length; i++ ) {
    let period = periods[i]
    if ( period.startDate < minStartDate ) {
      res = period
      minStartDate = period.startDate
    }
  }
  return res
})

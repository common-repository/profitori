'Calendar'.datatype({exportable: true})
'name'.field({key: true})

'Calendar'.method('nameToPeriod', async function(name) {
  let periods = await this.toPeriods()
  for ( var i = 0; i < periods.length; i++ ) {
    let period = periods[i]
    if ( period.name === name ) 
      return period
  }
})

'Calendar'.method('toPeriods', async function() {
  let res = []
  let years = await this.toYears()
  for ( var i = 0; i < years.length; i++ ) {
    let year = years[i]
    let periods = await year.toPeriods()
    res.appendArray(periods)
  }
  return res
})

'Calendar'.method('dateToPeriod', async function(date) {
  let years = await this.toYears()
  for ( var i = 0; i < years.length; i++ ) {
    let year = years[i]
    if ( (year.startDate > date) || (year.endDate < date) ) continue
    return await year.dateToPeriod(date)
  }
})

'Calendar'.method('initialise', async function(options) {

  let trashExistingYears = async () => {
    let years = await this.toYears()
    for ( var i = 0; i < years.length; i++ ) {
      let year = years[i]
      await year.trash()
    }
  }

  let getStartDate = () => {
    let year = global.todayYMD().toYear()
    year -= 2
    let mm = global.padWithZeroes(options.startMonthNo, 2)
    return year + '-' + mm + '-01'
  }

  await trashExistingYears()
  let startDate = getStartDate()
  for ( var i = 0; i < 7; i++ ) {
    let y = startDate.toYear()
    let m = startDate.toMonth()
    let name = y + ''
    if ( m !== '01' ) {
      name = y + '/' + (parseFloat(y, 10) + 1)
    }
    let year = await 'Year'.create({parentCast: this}, {calendar: this, name: name, startDate: startDate})
    startDate = startDate.incYears(1)
    year.endDate = startDate.incDays(-1)
    await year.initialise()
  }
})

'Calendar'.method('toYears', async function() {
  return await 'Year'.bringChildrenOf(this)
})

'Calendar'.method('getCurrentYear', async function(options) {
  let today = global.todayYMD()
  let incDays = options && options.incDays
  if ( incDays )
    today = today.incDays(incDays)
  let years = await this.toYears()
  for ( var i = 0; i < years.length; i++ ) {
    let year = years[i]
    if ( (year.startDate <= today) && (year.endDate >= today) )
      return year
  }
})

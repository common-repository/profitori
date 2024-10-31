'Period'.datatype({exportable: true})
'year'.field({refersToParent: 'Year'})
'name'.field()
'number'.field({numeric: true})
'startDate'.field({date: true})
'endDate'.field({date: true})
 
'Period'.cruxFields(['year', 'name'])

'Period'.method('toYear', async function() {
  return await this.referee('year')
})

'Period'.method('toCalendar', async function() {
  let year = await this.toYear()
  return year.toCalendar()
})

'Period'.method('toSamePeriodXYearsAgo', async function(x) {
  let cal = await this.toCalendar(); if ( ! cal ) return null
  let date = this.startDate.incDays(-365 * x)
  return await cal.dateToPeriod(date)
})

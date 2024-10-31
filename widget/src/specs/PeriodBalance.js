'PeriodBalance'.datatype({exportable: true})
'period'.field({refersToParent: 'Period'})
'account'.field({refersTo: 'Account', key: true})
'balance'.field({numeric: true})
'startDate'.field({date: true})
'endDate'.field({date: true})

'startDate'.calculate(async pb => {
  let period = await pb.referee('period')
  return period.startDate
})

'endDate'.calculate(async pb => {
  let period = await pb.referee('period')
  return period.endDate
})

'PeriodBalance'.cruxFields(['period', 'account'])

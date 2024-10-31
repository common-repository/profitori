'ReportList'.list({expose: true, icon: 'ThList'})
'Reports'.title()
'Back'.action({act: 'cancel'})
'Report'.datatype()
'description'.field()
'Run'.action({place: 'row'})

'Run'.act(async (list, report) => {
  list.segue("view", report.specname)
})

import XLSMaker from '../XLSMaker.js'
'Export'.page({readOnly: false})
'Export'.title()
'Back'.action({act: 'cancel'})
'Download to Excel'.action()
'genus'.field({caption: "Data Type", refersTo: "Genus"})

'Download to Excel'.act(async (page) => {
  let genus = page.getFieldValue('genus')
  if ( ! genus ) {
    page.showMessage('Please select a data type')
    return
  }
  let dt = genus.keyval || genus
  let maker = new XLSMaker()
  await maker.download(dt)
})

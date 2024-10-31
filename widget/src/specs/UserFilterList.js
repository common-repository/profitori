'UserFilterList'.list()
'Filters'.title()
'Back'.action({act: 'cancel'})
'Add'.action({act: 'add'})
'Refresh'.action({act: "refresh"})

'UserFilter'.datatype()
'name'.field()
'Edit'.action({place: 'row', act: 'edit'})
'Trash'.action({place: 'row', act: 'trash'})
'UserFilterMaint.js'.maintSpecname()

'UserFilterList'.filter(async (uf, list) => {
  let targetList = list.getFirstAncestorList({exclude: 'UserFilterList.js'}); if ( ! targetList ) return false
  return uf.specname === targetList.specname()
})

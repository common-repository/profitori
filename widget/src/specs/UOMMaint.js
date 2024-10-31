'UOMMaint'.maint()
'Add Unit of Measure'.title({when: "adding"})
'Edit Unit of Measure'.title({when: "editing"})
'Back'.action({act: 'cancel'})
'OK'.action({act: 'ok'})
'Save'.action({act: 'save'})
'Add another'.action({act: 'add'})
'UOM'.datatype()
'uomName'.field()
'description'.field()

'UOMMaint'.makeDestinationFor('UOM')


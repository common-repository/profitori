'CurrencyMaint'.maint()
'Add Currency'.title({when: "adding"})
'Edit Currency'.title({when: "editing"})
'Back'.action({act: 'cancel'})
'OK'.action({act: 'ok'})
'Save'.action({act: 'save'})
'Add another'.action({act: 'add'})
'Currency'.datatype()
'currencyCode'.field()
'exchangeRate'.field()

'exchangeRate'.inception(1)

'CurrencyMaint'.makeDestinationFor('Currency')

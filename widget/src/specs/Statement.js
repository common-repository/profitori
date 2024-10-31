'Statement'.datatype({exportable: true})
'name'.field({key: true})
'showBalance'.field({yesOrNo: true})
'showYTDBalance0'.field({yesOrNo: true})
'showPTDBalance0'.field({yesOrNo: true})
'showYTDBalance1'.field({yesOrNo: true})
'showPTDBalance1'.field({yesOrNo: true})
'showYTDBalance2'.field({yesOrNo: true})
'showPTDBalance2'.field({yesOrNo: true})

'showBalance'.inception('Yes')

'showYTDBalance0'.inception('Yes')

'showPTDBalance0'.inception('Yes')

'showYTDBalance1'.inception('Yes')

'showPTDBalance1'.inception('Yes')

'showYTDBalance2'.inception('Yes')

'showPTDBalance2'.inception('Yes')

# -*- coding: utf-8 -*-
{
    'name': "Smay POS Promotions",

    'summary': """
        Charges the  promotions to POS.""",

    'description': """
        This module charges the promotions to POS and validate that be apply correctly.
    """,

    'author': "Gerardo Reyes Preciado.",
    'website': "http://www.supermay.mx",
    'category': 'Point Of Sale',
    'version': '0.1',

    # any module necessary for this one to work correctly
    'depends': ['base', 'point_of_sale'],

    # always loaded
    'data': [
        # 'security/ir.model.access.csv',
        'views/views.xml',
        'views/templates.xml',
    ],

    # 'qweb': ['static/src/xml/promotions.xml']
}

# -*- coding: utf-8 -*-
{
    'name': "smay_edit_promotions",

    'summary': """
        Allow edit the promotions from WayERP""",

    'description': """
        This module allows to modify the promotions from wayERP 
        (You only have to modify the next file /pos_promo/models/pos_promo.py, 
        you have to rename the functions "create" and "write" to "create_smay" and "write_smay" )
    """,

    'author': "Gerardo Reyes Preciado",
    'website': "http://www.supermay.mx",

    # Categories can be used to filter modules in modules listing
    # Check https://github.com/odoo/odoo/blob/master/odoo/addons/base/module/module_data.xml
    # for the full list
    'category': 'Point of Sale',
    'version': '0.1',

    # any module necessary for this one to work correctly
    'depends': ['base', 'point_of_sale', 'pos_promo'],

    # always loaded
    'data': [
        # 'security/ir.model.access.csv',
        'views/views.xml',
        # 'views/templates.xml',
    ],
}

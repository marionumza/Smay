# -*- coding: utf-8 -*-

from odoo import models, fields, api


class SmayChargeWithCard(models.Model):
    _inherit = 'pos.config'

    extra_charge = fields.Float(string="Porcentaje extra al pagar con tarjeta ", default=3.00,
                                help="Define que porcentaje sera añadido al pagar con tarjeta.")

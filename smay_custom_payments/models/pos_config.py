# -*- coding: utf-8 -*-

from odoo import models, fields, api


class smay_custom_payments_PosConfig(models.Model):
    _inherit = 'pos.config'

    multiple_payments = fields.Boolean(string="Permite multiples metodos de pago", default=False,
                                       help="Permite que se puedan seleccionar multiples metodos de pago "
                                            "para saldar la orden.")

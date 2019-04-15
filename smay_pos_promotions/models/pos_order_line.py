# -*- coding: utf-8 -*-

from odoo import models, fields, api
import logging


class pos_order_line(models.Model):
    _inherit = "pos.order.line"

    discount_amount_by_promotion = fields.Float(string="monto descontado en promocion", default=0)
    promotion_name = fields.Char("Promocion aplicada")

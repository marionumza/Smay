# -*- coding: utf-8 -*-

from odoo import models, fields, api
import logging

_logger = logging.getLogger(__name__)


class SmayEditPromotionsPosPromo(models.Model):
    _inherit = 'pos.promo'

    @api.multi
    def write(self, values):
        res = super(SmayEditPromotionsPosPromo, self).write(values)
        for line in self.margin_lines:
            product = line.name
            name_product = line.name.name
            promo_price = line.prm_price
            if abs(line.mrg_price - (line.prm_price - line.cst_price)) > .1:
                state = ''
                if product.standard_price <= 0:
                    state = 'e0'
                if line.prm_price < product.standard_price:
                    state = 'e1'
                else:
                    state = 'v'
                data_line = {
                    'code': product.barcode,
                    'name': product.id,
                    'prm_price': line.prm_price,
                    'cst_price': product.standard_price,
                    'mrg_price': line.prm_price - line.cst_price,
                    'mrg_perce': ((line.prm_price - line.cst_price) * 100) / product.standard_price,
                    'state': state,
                }
                line.write(data_line)
        return res

# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
import logging

_logger = logging.getLogger(__name__)


class SmayRefundResUser(models.Model):
    _inherit = 'res.users'

    is_manager = fields.Boolean(string='Es encargado', default=False)
    pos_security_pin = fields.Char(required=True, string='Security PIN', size=32,
                                   help='A Security PIN used to protect sensible functionality in the Point of Sale')

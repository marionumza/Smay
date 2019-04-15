# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
import logging

_logger = logging.getLogger(__name__)


class SmayPosInvoiceAccountJournal(models.Model):
    _inherit = 'account.journal'

    pay_method_id = fields.Many2one('pay.method', 'Metodo de pago Facturacion', required=True)

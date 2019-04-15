# -*- coding: utf-8 -*-

from odoo import models, fields, api


class SmayCustomTicketResCompany(models.Model):
    _inherit = 'res.company'

    @api.model
    def get_rfc(self):
        return self.vat[2:]

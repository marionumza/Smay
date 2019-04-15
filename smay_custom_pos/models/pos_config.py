# -*- coding: utf-8 -*-

from odoo import models, fields, api

import logging

_logger = logging.getLogger(__name__)


class PosConfig(models.Model):
    _inherit = 'pos.config'

    # inherited fields

    # new fields
    # this field defines the amount for cash fund
    fondo_caja = fields.Float(string="Fondo de Caja", default=500.00,
                              help="Se indica la cantidad que se tiene que manejar"
                                   " como fondo de caja.")

    # inherited functions

    # new functions
    # in calls from javascript this function return true if exists connection with the server
    @api.model
    def existe_conexion(self):
        return True

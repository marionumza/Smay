# -*- coding: utf-8 -*-

from odoo import models, fields, api
import logging
_logger = logging.getLogger(__name__)

# from datetime import datetime, date, time, timedelta
# import pytz




class SmayReprintTicketPosConfig(models.Model):
    _inherit = 'pos.config'

    days_of_reprint = fields.Integer(string="Días permitidos para reimpresion de ticket", default=15)



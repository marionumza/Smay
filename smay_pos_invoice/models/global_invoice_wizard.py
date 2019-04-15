# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
from odoo.exceptions import UserError
from datetime import datetime, date, time, timedelta
import pytz
import logging

_logger = logging.getLogger(__name__)


class GlobalInvoiceWizard(models.TransientModel):
    _name = "global.invoice.wizard"

    start_date = fields.Datetime(string="fecha de inicio", required=True, default=lambda self: self.get_date('START'))
    end_date = fields.Datetime(string="fecha Final", required=True, default=lambda self: self.get_date('END'))
    company_id = fields.Many2one('res.company', 'Compañia', required=True,
                                 default=lambda self: self.get_company(), readonly=True)
    pay_method_id = fields.Many2one("pay.method", "Metodos de Pago", required=True,
                                    default=lambda self: self.get_pay_method())
    sat_pay_method_id = fields.Many2one('sat.metodo.pago', "Forma de pago", required=True,
                                        default=lambda self: self.get_sat_pay_method())
    uso_cfdi_id = fields.Many2one('sat.uso.cfdi', 'Uso de CFDI', required=True,
                                  default=lambda self: self.get_uso_cfdi())

    def generate_invoice(self):
        # client_global_invoice = self.env['res.partner'].search([('name','=','PUBLICO EN GENERAL')],limit=1)
        opened_sessions = self.env['pos.session'].search([('state', '=', 'opened'),
                                                          ('start_at', '>=', self.start_date),
                                                          ('start_at', '<=', self.end_date),
                                                          ('user_id.company_id', '=', self.env.user.company_id.id)])
        if opened_sessions:
            raise UserError('No se puede generar la factura global porque hay sesiones abiertas')

        # here invoice all order assign to global invoice partner
        client_global_invoice = self.env['res.company'].browse(self.env.user.company_id.id).invoice_partner_id

        orders = self.env['pos.order'].search(
            [('date_order', '>=', self.start_date), ('date_order', '<=', self.end_date),
             ('company_id', '=', self.company_id.id), ('state', '=', 'paid'),
             ('partner_id', '=', client_global_invoice.id)], order='id asc')

        orders = orders.filtered(lambda l: l.amount_total > 0)

        self.env['pos.order'].action_global_invoice(orders, self.pay_method_id.id,
                                                    self.sat_pay_method_id.id, self.uso_cfdi_id.id)

    def get_date(self, label):
        default_datetime = ''
        if label == 'START':
            default_datetime = str(datetime.strptime(str(date.today()) + ' 00:00:00', "%Y-%m-%d %H:%M:%S"))
        if label == 'END':
            default_datetime = str(datetime.strptime(str(date.today()) + ' 23:59:59', "%Y-%m-%d %H:%M:%S"))

        if default_datetime:
            local = pytz.timezone(str(self.env.get('res.users').browse(self._uid).tz))
            fecha = datetime.strptime(default_datetime, "%Y-%m-%d %H:%M:%S")
            local_dt = local.localize(fecha, is_dst=None)
            utc_dt = local_dt.astimezone(pytz.utc)
            return utc_dt
        return '2017-02-02 17:30:00'

    def get_company(self):
        return self.env.user.company_id.id

    def get_pay_method(self):
        return self.env['pay.method'].search([('name', '=', 'Efectivo')]).id

    def get_sat_pay_method(self):
        return self.env['sat.metodo.pago'].search([('name', '=', 'Pago en una sola exhibición')]).id

    def get_uso_cfdi(self):
        return self.env['sat.uso.cfdi'].search([('name', '=', 'Por definir')])


class GlobalInvoiceResCompany(models.Model):
    _inherit = 'res.company'

    invoice_partner_id = fields.Many2one('res.partner', string='Cliente factura global', required=True)

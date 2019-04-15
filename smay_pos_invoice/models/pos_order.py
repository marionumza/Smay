# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
from odoo.exceptions import UserError
import logging

_logger = logging.getLogger(__name__)


class SmayPosInvoicePosOrder(models.Model):
    _inherit = 'pos.order'

    uso_cfdi_id = fields.Many2one('sat.uso.cfdi', 'Uso de CFDI')
    forma_pago_id = fields.Many2one('pay.method', 'Metodo de pago')
    pay_method_id = fields.Many2one('sat.metodo.pago', 'Forma de pago')

    @api.model
    def create_from_ui(self, orders):
        # Keep only new orders

        submitted_references = [o['data']['name'] for o in orders]
        pos_order = self.search([('pos_reference', 'in', submitted_references)])
        existing_orders = pos_order.read(['pos_reference'])
        existing_references = set([o['pos_reference'] for o in existing_orders])
        orders_to_save = [o for o in orders if o['data']['name'] not in existing_references]
        order_ids = []

        for tmp_order in orders_to_save:

            to_invoice = tmp_order['to_invoice']
            order = tmp_order['data']

            ##assign by default PUBLICO EN GENERAL
            if order.get('partner_id') == False:
                # order['partner_id'] = self.env['res.partner'].search([('name','=','PUBLICO EN GENERAL')],limit=1).id
                order['partner_id'] = self.env['res.company'].browse(self.env.user.company_id.id).invoice_partner_id.id

            if to_invoice:
                self._match_payment_to_invoice(order)
            pos_order = self._process_order(order)

            order_ids.append(pos_order.id)

            try:
                pos_order.action_pos_order_paid()
            except psycopg2.OperationalError:
                # do not hide transactional errors, the order(s) won't be saved!
                raise
            except Exception as e:
                _logger.error('Could not fully process the POS Order: %s', tools.ustr(e))

            if to_invoice:
                pos_order.write({'uso_cfdi_id': order.get('uso_cfdi_id')})
                pos_order.write({'pay_method_id': order.get('pay_method_id')})
                pos_order.write({'forma_pago_id': order.get('forma_pago_id')})
                pos_order.action_pos_order_invoice()
                pos_order.invoice_id.sudo().action_invoice_open()
                pos_order.account_move = pos_order.invoice_id.move_id

        return order_ids

    @api.multi
    def action_pos_order_invoice(self):
        Invoice = self.env['account.invoice']

        for order in self:
            # Force company for all SUPERUSER_ID action
            local_context = dict(self.env.context, force_company=order.company_id.id, company_id=order.company_id.id)
            if order.invoice_id:
                Invoice += order.invoice_id
                continue

            if not order.partner_id:
                # raise UserError(_('Please provide a partner for the sale.'))
                raise UserError(_('Selecciona un cliente para la factura.'))

            invoice = Invoice.new(order._prepare_invoice())
            invoice._onchange_partner_id()
            invoice.fiscal_position_id = order.fiscal_position_id

            inv = invoice._convert_to_write({name: invoice[name] for name in invoice._cache})
            # assigning parameters for the invoicing
            temp_order = self.env['pos.order'].search([('name', '=', inv.get('name'))], order='create_date', limit=1)
            amount_temp_payment = 0
            method_ids = []
            # reviews main payment(payment with most amount) for that It will send to inovice

            inv['uso_cfdi_id'] = order.uso_cfdi_id.id  # 1
            inv['metodo_pago_id'] = order.pay_method_id.id

            for metodo in temp_order.statement_ids:
                if metodo.amount > 0 and metodo.amount >= amount_temp_payment:
                    amount_temp_payment = metodo.amount
            method_ids.append(int(order.forma_pago_id.id))
            _arguments = 6, 0, method_ids

            # Assigns payment method (cash, card)
            inv['pay_method_ids'] = list(tuple(_arguments))
            inv['pay_method_ids'] = [tuple(inv['pay_method_ids'])]

            # Selects the use that client will do with the invoice  default: [ PUE ] Pago en una sola exhibición
            used_cfdi = self.env['sat.uso.cfdi'].search([('name', '=', 'Adquisición de mercancias')])
            new_invoice = Invoice.with_context(local_context).sudo().create(inv)
            message = _(
                "This invoice has been created from the point of sale session: <a href=# data-oe-model=pos.order data-oe-id=%d>%s</a>") % (
                          order.id, order.name)
            new_invoice.message_post(body=message)
            order.write({'invoice_id': new_invoice.id, 'state': 'invoiced'})
            Invoice += new_invoice

            for line in order.lines:
                self.with_context(local_context)._action_create_invoice_line(line, new_invoice.id)

            new_invoice.with_context(local_context).sudo().compute_taxes()
            order.sudo().write({'state': 'invoiced'})
            # this workflow signal didn't exist on account.invoice -> should it have been 'invoice_open' ? (and now method .action_invoice_open())
            # shouldn't the created invoice be marked as paid, seing the customer paid in the POS?
            # new_invoice.sudo().signal_workflow('validate')

        if not Invoice:
            return {}

        return {
            'name': _('Customer Invoice'),
            'view_type': 'form',
            'view_mode': 'form',
            'view_id': self.env.ref('account.invoice_form').id,
            'res_model': 'account.invoice',
            'context': "{'type':'out_invoice'}",
            'type': 'ir.actions.act_window',
            'nodestroy': True,
            'target': 'current',
            'res_id': Invoice and Invoice.ids[0] or False,
        }

    def _prepare_global_invoice(self):
        """
        Prepare the dict of values to create the new invoice for a pos order.
        """
        return {
            'name': 'Factura Global',  # self.name,
            'origin': self.session_id.name,
            'account_id': self.partner_id.property_account_receivable_id.id,
            'journal_id': self.session_id.config_id.invoice_journal_id.id,
            'company_id': self.company_id.id,
            'type': 'out_invoice',
            'reference': self.session_id.name,  # self.name,
            'partner_id': self.partner_id.id,
            'comment': self.note or '',
            # considering partner's sale pricelist's currency
            'currency_id': self.pricelist_id.currency_id.id,
            'user_id': self.user_id.id,
        }

    @api.multi
    def action_global_invoice(self, orders, pay_method_id, sat_pay_method_id, uso_cfdi_id):
        Invoice = self.env['account.invoice']

        if len(orders) > 0:
            local_context = dict(self.env.context, force_company=orders[0].company_id.id,
                                 company_id=orders[0].company_id.id)
            if orders[0].invoice_id:
                Invoice += orders[0].invoice_id

            if not orders[0].partner_id:
                raise UserError(_('Selecciona un cliente para la factura.'))

            invoice = Invoice.new(orders[0]._prepare_global_invoice())
            invoice._onchange_partner_id()
            invoice.fiscal_position_id = orders[0].fiscal_position_id

            inv = invoice._convert_to_write({name: invoice[name] for name in invoice._cache})

            method_ids = []
            method_ids.append(int(pay_method_id))
            _arguments = 6, 0, method_ids

            # Assigns payment method (cash, card)
            inv['pay_method_ids'] = list(tuple(_arguments))
            inv['pay_method_ids'] = [tuple(inv['pay_method_ids'])]

            # Selects the use that client will do with the invoice  default: [ PUE ] Pago en una sola exhibición
            # used_cfdi = self.env['sat.uso.cfdi'].search([('name','=','Adquisición de mercancias')])
            inv['uso_cfdi_id'] = uso_cfdi_id  # used_cfdi.id #1

            # apply the value
            inv['metodo_pago_id'] = sat_pay_method_id

            new_invoice = Invoice.with_context(local_context).sudo().create(inv)

            message = _(
                "Esta factura se realizo en en proceso de faturacion global  e incluye las siguientes Ordenes de punto de venta: ")
            for order in orders:
                # message = _("Esta factura se realizo en en proceso de cierre de la sesion %s e incluye las siguientes Ordenes de punto de venta: <a href=# data-oe-model=pos.order data-oe-id=%d>%s</a>") % (session_id.name,order.id,[o.name for o in orders])#(order.id, order.name)
                message = message + "<a href=# data-oe-model=pos.order data-oe-id=%d> %s  -  </a>" % (
                    order.id, order.name)
                # new_invoice.message_post(body=message)
                order.write({'invoice_id': new_invoice.id, 'state': 'invoiced'})
                Invoice += new_invoice

                for line in order.lines:
                    self.with_context(local_context)._action_create_invoice_line(line, new_invoice.id)

                new_invoice.with_context(local_context).sudo().compute_taxes()
                order.sudo().write({'state': 'invoiced'})
            new_invoice.message_post(body=message)
            new_invoice.sudo().action_invoice_open()

            for order in orders:
                order.account_move = new_invoice.move_id
            sessions = orders.mapped('session_id')
            for session in sessions:
                session.action_pos_session_close()

        if not Invoice:
            return {}

        return {
            'name': _('Customer Invoice'),
            'view_type': 'form',
            'view_mode': 'form',
            'view_id': self.env.ref('account.invoice_form').id,
            'res_model': 'account.invoice',
            'context': "{'type':'out_invoice'}",
            'type': 'ir.actions.act_window',
            'nodestroy': True,
            'target': 'current',
            'res_id': Invoice and Invoice.ids[0] or False,
        }

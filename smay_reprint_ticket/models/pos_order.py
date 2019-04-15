# -*- coding: utf-8 -*-

from odoo import models, fields, api
import logging
from datetime import datetime, date, time, timedelta

_logger = logging.getLogger(__name__)


class SmayReprintTicketPosOrder(models.Model):
    _inherit = 'pos.order'

    @api.model
    def get_ticket_for_reprint(self):
        tickets = []
        today = datetime.now().replace(microsecond=0)
        current_sesion = self.env['pos.session'].search([('user_id', '=', self._uid), ('state', '=', 'opened')],
                                                        order='id desc', limit=1)
        allowed_date = today - timedelta(days=current_sesion.config_id.days_of_reprint)
        orders = self.search([('id', '>', '0'), ('date_order', '>=', str(allowed_date)),
                              ('company_id.id', '=', self.env.user.company_id.id)], order='id desc')
        for order in orders:
            ticket = {}
            ticket['id'] = order.id
            ticket['pos_reference'] = order.pos_reference
            ticket['date_order'] = order.date_order
            tickets.append(ticket)
        return tickets

    @api.model
    def get_information_reprint(self, order_id):
        order = self.browse(int(order_id))
        ticket_to_reprint = dict()

        ticket_to_reprint['date_order'] = order.date_order  # self.get_correct_datetime(order.date_order)
        ticket_to_reprint['pos_reference'] = order.pos_reference
        ticket_to_reprint['cashier'] = order.user_id.name,
        ticket_to_reprint['partner'] = order.partner_id.name
        _order_lines = []
        taxes = dict()
        subtotal = 0
        qty_products = 0
        for orderline in self.env['pos.order.line'].search([('order_id', '=', order.id)]):
            qty_products = qty_products + orderline.qty
            _order_line = dict()
            _order_line['name_product'] = orderline.product_id.name
            _order_line['qty'] = orderline.qty
            _order_line['price_unit'] = orderline.price_unit
            _order_line['discount'] = orderline.discount
            for tax in orderline.tax_ids:
                # _logger.warning('IMPUESTOOOOOOOO')
                # _logger.warning(tax)
                if tax.amount > 0:
                    subtotal = subtotal + (orderline.price_unit * orderline.qty) / ((tax.amount / 100) + 1)
                    # _logger.warning(a)
                    ####
                    # if not taxes.get(tax.name):
                    #    taxes[tax.name] = (orderline.price_unit * orderline.qty) - (
                    #            orderline.price_unit * orderline.qty) / ((tax.amount / 100) + 1)
                    # else:
                    #    taxes.update({tax.name: taxes.get(tax.name) + (
                    #            orderline.price_unit * orderline.qty - (orderline.price_unit * orderline.qty) / ((
                    #                                                                                                     tax.amount / 100) + 1))})  # [tax.id] = taxes[tax.amount] #+ (((tax.amount/100)+1)*orderline.price_unit)
                    # _logger.warning('ITERACION')
                    # _logger.warning(tax.id)
                    if not taxes.get(tax.id):
                        taxes[tax.id] = (orderline.price_unit * orderline.qty) - (
                                orderline.price_unit * orderline.qty) / ((tax.amount / 100) + 1)
                    else:
                        taxes.update({tax.id: taxes.get(tax.id) + (
                                orderline.price_unit * orderline.qty - (orderline.price_unit * orderline.qty) / ((
                                                                                                                         tax.amount / 100) + 1))})  # [tax.id] = taxes[tax.amount] #+ (((tax.amount/100)+1)*orderline.price_unit)
                else:
                    subtotal = subtotal + (orderline.price_unit * orderline.qty)  ##*orderline.price_unit*orderline.qty
            _order_lines.append(_order_line)
        payments = []
        _payment = {}
        for statement in order.statement_ids:
            _payment = {}
            if statement.amount > 0:
                _payment['name'] = statement.journal_id.name
                _payment['amount'] = statement.amount
                # _payment[statement.journal_id.name] = statement.amount
                payments.append(_payment)

        _logger.warning('Total de TAXES')
        _logger.warning(taxes)
        _logger.warning('SUBTOTAL')
        _logger.warning(subtotal)
        _logger.warning('PAYMENTSSSSSS')
        _logger.warning(payments)
        ticket_to_reprint['orderlines'] = _order_lines
        ticket_to_reprint['subtotal'] = subtotal
        ticket_to_reprint['taxes'] = taxes
        ticket_to_reprint['total'] = order.amount_total
        ticket_to_reprint['payments'] = payments
        ticket_to_reprint['change_amount'] = order.amount_return
        ticket_to_reprint['qty_products'] = qty_products
        # for tax in
        return ticket_to_reprint

    # @api.model
    # def get_correct_datetime(self,_datetime):
    #    _logger.warning("PASO 1")
    #    _logger.warning(str(_datetime))
    #    if _datetime:
    #        local = pytz.timezone(str(self.env.get('res.users').browse(self._uid).tz))
    #        fecha = datetime.strptime( _datetime, "%Y-%m-%d %H:%M:%S")
    #        local_dt = local.localize(fecha, is_dst=None)
    #        utc_dt = local_dt.astimezone(pytz.utc)
    #        _logger.warning("PASO 2")
    #        _logger.warning(str(utc_dt))
    #        return utc_dt
    #    return '2017-02-02 17:30:00'

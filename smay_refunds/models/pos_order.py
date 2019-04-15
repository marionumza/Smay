# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
import logging

_logger = logging.getLogger(__name__)


class SmayRefundPosOrder(models.Model):
    _inherit = 'pos.order'

    is_refund = fields.Boolean(string='Es devolucion', default=False)

    @api.model
    def exist_order(self, pos_reference):
        order = self.search([('pos_reference', '=', pos_reference)], limit=1)
        if order:
            if order.is_refund or order.amount_total <= 0:
                return -1  # exist a refund for this order
        if not order:
            return -2  # don't exist order that user input
        if order:
            return order.id  # the order is correct

    @api.model
    def get_data_order(self, pos_reference):
        order = self.search([('pos_reference', '=', pos_reference), ('is_refund', '=', False)], limit=1)
        if order:
            return order.pos_refund()
        return -1

    @api.multi
    def pos_refund(self):
        """Create a copy of order  for refund order"""
        PosOrder = self.env['pos.order']
        current_session = self.env['pos.session'].search([('state', '!=', 'closed'), ('user_id', '=', self.env.uid)],
                                                         limit=1)
        if not current_session:
            raise UserError(
                _('To return product(s), you need to open a session that will be used to register the refund.'))
        for order in self:
            clone = order.copy({
                # ot used, name forced by create
                'name': order.name + _(' REFUND'),
                'session_id': current_session.id,
                'date_order': fields.Datetime.now(),
                'pos_reference': order.pos_reference,
            })
            PosOrder += clone
            order.write({'is_refund': True})

        for clone in PosOrder:
            for order_line in clone.lines:
                order_line.write({'qty': -order_line.qty})

        PosOrder.write({'is_refund': True})
        _payment = dict()
        _payment['create_uid'] = (self.env.user.id, self.env.user.name)
        current_session = self.env['pos.session'].search([('state', '=', 'opened'), ('user_id', '=', self.env.user.id)])
        for journal in current_session.config_id.journal_ids:
            if journal.type == 'cash':
                _payment['journal_id'] = (journal.id, journal.name)

        statements = self.env['account.bank.statement'].search([('pos_session_id', '=', current_session.id)])
        for statement in statements:
            if statement.journal_id.type == 'cash':
                _payment['statement_id'] = statement.id

        _payment['write_uid'] = _payment['create_uid']
        _payment['amount'] = PosOrder.amount_total
        _payment['pos_statement_id'] = PosOrder.id
        self.pos_add_payment(_payment, PosOrder)
        return PosOrder.id

    @api.multi
    def pos_add_payment(self, data, refund_order):

        """Create a new payment for the order"""
        args = self._prepare_bank_statement_line_payment_values(data)
        context = dict(self.env.context)
        context.pop('pos_session_id', False)
        args['name'] = refund_order.name
        args['pos_statement_id'] = refund_order.id
        self.env['account.bank.statement.line'].with_context(context).create(args)
        refund_order.action_pos_order_paid()
        return args.get('statement_id', False)

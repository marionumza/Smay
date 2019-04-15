# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
from odoo.exceptions import UserError, ValidationError

import logging

_logger = logging.getLogger(__name__)


class smay_pos_invoice_pos_session(models.Model):
    _inherit = 'pos.session'

    # I modify the function for close the session but dont do the conciliation contable
    # the conciliation contable will do in the global invoicing
    @api.multi
    def action_pos_session_closing_control(self):
        for session in self:

            for statement in session.statement_ids:
                if statement.balance_end_real != statement.balance_start and statement.cashbox_start_id:
                    raise ValidationError(
                        "Debes dejar  : $" + str(session.config_id.fondo_caja) + " del Fondo de Caja.")
                if (statement != session.cash_register_id) and (statement.balance_end != statement.balance_end_real):
                    statement.write({'balance_end_real': statement.balance_end})
            # DO NOT FORWARD-PORT
            if session.state == 'closing_control':
                session.write({'state': 'closed', 'stop_at': fields.Datetime.now()})
                session.action_pos_session_close()
                continue
            # session.write({'state': 'closing_control', 'stop_at': fields.Datetime.now()})
            # session.action_pos_session_close()
            session.write({'state': 'closed', 'stop_at': fields.Datetime.now()})
            # if not session.config_id.cash_control:
            #    session.action_pos_session_close()

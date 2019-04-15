# -*- coding: utf-8 -*-

from odoo import models, fields, api
from odoo.exceptions import UserError, ValidationError

import logging

_logger = logging.getLogger(__name__)


class SmayCustomPosSession(models.Model):
    _inherit = 'pos.session'

    # inherited fields

    # new fields

    # inherited functions
    # this function review that cash fund be correct at open session
    @api.multi
    def action_pos_session_open(self):
        # second browse because we need to refetch the data from the DB for cash_register_id
        # we only open sessions that haven't already been opened

        for session in self.filtered(lambda session: session.state == 'opening_control'):
            values = {}
            # Valida que se haya ingresado el fondo
            # for statement in session.statement_ids:

            if session.config_id.fondo_caja != session.cash_register_balance_start:  # and statement.cashbox_start_id:
                raise ValidationError("Falta asignar : $ " + str(session.config_id.fondo_caja) + " del Fondo de Caja.")
            for statement in session.statement_ids:
                if not statement.cashbox_start_id and statement.journal_id.type == 'cash':
                    raise ValidationError("Confirma el Fondo de Caja.")
            if not session.start_at:
                values['start_at'] = fields.Datetime.now()
            values['state'] = 'opened'
            session.write(values)
            session.statement_ids.button_open()
        return True

    # this function review that cash fund was retired before close the session
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
                session.action_pos_session_close()
                continue
            session.write({'state': 'closing_control', 'stop_at': fields.Datetime.now()})
            session.action_pos_session_close()
            # if not session.config_id.cash_control:
            #    session.action_pos_session_close()

    # the function review that difference in cash be not most than permitted
    @api.multi
    def action_pos_session_close(self):
        # Close CashBox
        for session in self:
            company_id = session.config_id.company_id.id
            ctx = dict(self.env.context, force_company=company_id, company_id=company_id)
            for st in session.statement_ids:
                if abs(st.difference) > st.journal_id.amount_authorized_diff:
                    # The pos manager can close statements with maximums.
                    if not self.env['ir.model.access'].check_groups("point_of_sale.group_pos_manager"):
                        # raise UserError(_("Your ending balance is too different from the theoretical cash closing (%.2f), the maximum allowed is: %.2f. You can contact your manager to force it.") % (st.difference, st.journal_id.amount_authorized_diff))
                        raise UserError(
                            "La diferencia de efectivo es mayor a lo permitido : %.2f. Retira el fondo de caja. Contacta al encargado para forzar el cierre." % (
                                st.journal_id.amount_authorized_diff))
                if (st.journal_id.type not in ['bank', 'cash']):
                    raise UserError(_("The type of the journal for your payment method should be bank or cash "))
                st.with_context(ctx).sudo().button_confirm_bank()
        self.with_context(ctx)._confirm_orders()
        self.write({'state': 'closed'})
        return {
            'type': 'ir.actions.client',
            'name': 'Point of Sale Menu',
            'tag': 'reload',
            'params': {'menu_id': self.env.ref('point_of_sale.menu_point_root').id},
        }

    # new methods

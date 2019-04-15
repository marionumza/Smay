# -*- coding: utf-8 -*-
from odoo import http

# class SmayReprintTicket(http.Controller):
#     @http.route('/smay_reprint_ticket/smay_reprint_ticket/', auth='public')
#     def index(self, **kw):
#         return "Hello, world"

#     @http.route('/smay_reprint_ticket/smay_reprint_ticket/objects/', auth='public')
#     def list(self, **kw):
#         return http.request.render('smay_reprint_ticket.listing', {
#             'root': '/smay_reprint_ticket/smay_reprint_ticket',
#             'objects': http.request.env['smay_reprint_ticket.smay_reprint_ticket'].search([]),
#         })

#     @http.route('/smay_reprint_ticket/smay_reprint_ticket/objects/<model("smay_reprint_ticket.smay_reprint_ticket"):obj>/', auth='public')
#     def object(self, obj, **kw):
#         return http.request.render('smay_reprint_ticket.object', {
#             'object': obj
#         })
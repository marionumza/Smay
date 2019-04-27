# -*- coding: utf-8 -*-
from odoo import http

# class SmayWindowProduct(http.Controller):
#     @http.route('/smay_window_product/smay_window_product/', auth='public')
#     def index(self, **kw):
#         return "Hello, world"

#     @http.route('/smay_window_product/smay_window_product/objects/', auth='public')
#     def list(self, **kw):
#         return http.request.render('smay_window_product.listing', {
#             'root': '/smay_window_product/smay_window_product',
#             'objects': http.request.env['smay_window_product.smay_window_product'].search([]),
#         })

#     @http.route('/smay_window_product/smay_window_product/objects/<model("smay_window_product.smay_window_product"):obj>/', auth='public')
#     def object(self, obj, **kw):
#         return http.request.render('smay_window_product.object', {
#             'object': obj
#         })
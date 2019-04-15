# -*- coding: utf-8 -*-

from odoo import models, fields, api

import logging
import smtplib
from email.mime.text import MIMEText

_logger = logging.getLogger(__name__)


class SmayHideProductsPosConfig(models.Model):
    _inherit = 'pos.config'

    utility_percent = fields.Float(string="Porcentaje minimo(utilidad) para estar disponible en POS:", default=0.00,
                                   help="Los productos que estan debajo de este parametro seran ocultados en el POS.")
    notification_mail = fields.Char(string="Correo a enviar notificaciones",
                                    help="Correo donde se enviaran las notificaciones de productos que tienen utlidad invalida.")
    hide_products_utility = fields.Boolean(string="Oculta productos con utilidad baja", default=False)

    @api.model
    def send_mail_hide_products(self, products):
        mail_configuration = self.env['ir.mail_server'].sudo().search(
            [('smtp_debug', '=', True), ('active', '=', True), ('company_id', '=', self.env.user.company_id.id)])
        smtp = smtplib.SMTP("mail.supermay.mx:2525")
        from_address = mail_configuration.smtp_user
        smtp.login(from_address, mail_configuration.smtp_pass)
        to_address = self.env['pos.config'].browse(products[0].get('caja_id')).notification_mail
        subject = "Productos con utilidad baja."
        message = """
        <br/>
        <div>
            """ + str(len(products) - 1) + """ Productos por revisar porcentaje de utilidad.
        </div>
        <br/>
        <br/>
        <style type="text/css">
        
           table{
                border-collapse:collapse;
            }
            
            .encabezado_tabla{
                background-color : #0B0719;
                color: #FFFFFF;
                padding: 5px 35px;               
            }
            
            .encabezado_tabla2{
                background-color :#0B4C5F; 
                padding: 5px 10px;            
            }
            
            .celda_ancabezado{
               border-style: solid;
                border-width:1px;
                border-color: #FFFFFF;            
            }
            
            .celda_cuerpo{
               border-style: solid;
                border-width:1px;
                border-color: #000000; 
                padding: 3px 5px;            
            }
            
           .celda_centrada {
                text-align:center;
           }
           
           .celda_izquierda {
                text-align:left;
           }
           
           .celda_derecha {
                text-align:right;
           }
           
        </style>
            <table>
                <tr >
                    <td colspan='5' class="celda_centrada encabezado_tabla celda_ancabezado">
                        <b>Productos con bajo margen de utilidad - Menor al %s %%</b>
                    </td>
                </tr>
                <tr>
                    <td class="encabezado_tabla encabezado_tabla2 celda_izquierda celda_ancabezado">
                        Codigo
                    </td>
                    <td class="encabezado_tabla encabezado_tabla2 celda_izquierda celda_ancabezado">
                        Nombre
                    </td>
                    <td class="encabezado_tabla encabezado_tabla2 celda_derecha celda_ancabezado">
                        Costo
                    </td>
                    <td class="encabezado_tabla encabezado_tabla2 celda_derecha celda_ancabezado">
                        Precio
                    </td>
                    <td class="encabezado_tabla encabezado_tabla2 celda_derecha celda_ancabezado">
                        Utilidad %%
                    </td>
                </tr>
                
                """ % (self.env['pos.config'].browse(products[0].get('caja_id')).utility_percent)
        body = ""
        for information in products:
            if information.get('barcode'):
                body = body + """
                <tr>
                    <td class="celda_izquierda celda_cuerpo">
                        %s
                    </td>
                    <td class="celda_izquierda celda_cuerpo">
                        %s
                    </td >
                    <td class="celda_derecha celda_cuerpo">
                        %s
                    </td >
                    <td class="celda_derecha celda_cuerpo">
                        %s
                    </td>
                    <td class="celda_derecha celda_cuerpo">
                        %s
                    </td>
                </tr>
                """ % (information.get('barcode'), information.get('name'), information.get('costo'),
                       information.get('precio'), information.get('porcentaje_utilidad'))
        message = message + body

        final = """
            </table>
        """

        message = message + final

        mime_message = MIMEText(message.encode('utf-8'), "html")
        mime_message["From"] = from_address
        mime_message["To"] = to_address
        mime_message["Subject"] = "Productos con baja utilidad."

        email = """From : %s
        To: %s
        MIME-Version:1.0
        Content-type: text/html
        Subject: %s
        %s
        """ % (from_address, to_address, subject, message)

        smtp.sendmail(from_address, to_address, mime_message.as_string())
        smtp.quit()

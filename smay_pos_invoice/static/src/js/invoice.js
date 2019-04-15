odoo.define('smay_pos_invoice.smay_pos_invoice', function (require) {
"use strict";

    var models = require('point_of_sale.models');
    var popups = require('point_of_sale.popups');
    var gui = require('point_of_sale.gui');
    var screens = require('point_of_sale.screens');

    models.load_models(
        [
            {
                model: 'sat.uso.cfdi',
                label: 'Facturacion',
                fields: ['id','code','name','display_name'],
                order: ['id','code','name'],
                loaded: function(self, facturacion_usos_cfdi){
                    self.facturacion_usos_cfdi = facturacion_usos_cfdi;
                },
            },
            {
                model:'pay.method',
                label: 'Facturacion',
                fields: ['id','code','name','display_name'],
                order: ['id','code','name'],
                loaded: function(self, facturacion_pay_methods){
                    self.facturacion_pay_methods= facturacion_pay_methods;
                },
            },
            {
                model: 'sat.metodo.pago',
                label: 'Facturacion',
                fields: ['id','code','name','display_name'],
                order: ['id','code','name'],
                loaded: function(self,facturacion_sat_metodos_pago){
                    self.facturacion_sat_metodos_pago= facturacion_sat_metodos_pago;
                },
            },

        ],
            {
                'after': 'product.product',
            },
    );

    var _super_order = models.Order;
    models.Order = models.Order.extend({

        initialize: function(attributes,options){
            var order = _super_order.prototype.initialize.apply(this, arguments);
            order.pay_method_id = undefined;
            order.uso_cfdi_id = undefined;
            order.forma_pago_id = undefined ;
            return order;
        },

        export_as_JSON: function() {
            var json = _super_order.prototype.export_as_JSON.apply(this,arguments);
            json.uso_cfdi_id =  this.uso_cfdi_id;
            json.pay_method_id = this.pay_method_id;
            json.forma_pago_id = this.forma_pago_id;
            return json;
        },

        set_uso_cfdi: function(id){
            this.uso_cfdi_id = parseInt(id);
        },

        set_pay_method: function(id){
            this.pay_method_id = parseInt(id);
        },

        set_forma_pago: function(id){
            this.forma_pago_id = parseInt(id);
        },
    });


    var invoicePopupWidget = popups.extend({
        template: 'invoicePopupWidget',
        show: function(options){
            this._super(options);
            var order = self.posmodel.get_order();
            self.$('#accept').on('click', function() {
                    order.set_uso_cfdi($('#uso_cfdi').children('option:selected').val());
                    order.set_pay_method($('#metodo_pago').children('option:selected').val());
                    order.set_forma_pago($('#forma_pago').children('option:selected').val());
                    self.posmodel.gui.close_popup();
                    if(!order.get_client()){
                    self.posmodel.gui.show_screen('clientlist');
                    }
                });

            self.$('#cancel').on('click', function() {
                    order.set_uso_cfdi(1);
                    order.set_pay_method(1);
                    order.set_forma_pago(1);
                    self.posmodel.gui.close_popup();
                    self.$('.js_invoice').removeClass('highlight');
                    order.set_to_invoice(false);
                });
            },
    });

    gui.define_popup({
        name: 'invoicePopupWidget',
        widget: invoicePopupWidget,
    });

    var _super_PaymentScreenWidget = screens.PaymentScreenWidget;

    screens.PaymentScreenWidget = screens.PaymentScreenWidget.include({
    click_invoice: function(){
        var order = this.pos.get_order();
        order.set_to_invoice(!order.is_to_invoice());
        if (order.is_to_invoice()) {
            this.$('.js_invoice').addClass('highlight');
            this.pos.gui.show_popup('invoicePopupWidget',{
                    'title':'Opciones de Facturación',
                    'pay_methods': this.pos.facturacion_pay_methods,
                    'sat_metodos_pago': this.pos.facturacion_sat_metodos_pago,
                    'usos_cfdi': this.pos.facturacion_usos_cfdi,
                });
        } else {
            this.$('.js_invoice').removeClass('highlight');
        }
    },
    });
});


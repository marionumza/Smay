odoo.define('smay_charge_with_card.smay_charge_with_card', function(require){
    "use strict";

    var models = require('point_of_sale.models');
    var screens = require('point_of_sale.screens');

    var _super_ActionpadWidget = screens.ActionpadWidget;

    screens.ActionpadWidget = screens.ActionpadWidget.include({

        ///Inherited Functions
        renderElement: function() {
            var self = this;
            this._super();
            this.$('.pay').click(function(){
                var order = self.pos.get_order();
                var has_valid_product_lot = _.every(order.orderlines.models, function(line){
                    return line.has_valid_product_lot();
                });
                if(!has_valid_product_lot){
                    self.gui.show_popup('confirm',{
                        'title': _t('Empty Serial/Lot Number'),
                        'body':  _t('One or more product(s) required serial/lot number.'),
                        confirm: function(){
                            self.gui.show_screen('payment');
                        },
                    });
                }else{
                    if(order.get_total_with_tax()!= 0 && order.get_orderlines().length > 0){
                        self.gui.show_screen('payment');
                        }else{
                        self.gui.show_screen('products');
                        }
                }
            });
            this.$('.set-customer').click(function(){
                self.gui.show_screen('clientlist');
            });
        }
        ///////////

    });


    var _super_order = models.Order;
    models.Order = models.Order.extend({

        //Inherited functions
        add_product: function(product, options){
            _super_order.prototype.add_product.apply(this, arguments);
            this.remove_all_paymentlines();
        },

        add_paymentline: function(cashregister){
            if(cashregister.journal.type=='bank' && this.payment_exists(cashregister.journal.type)==false){
                var orderlines = this.get_orderlines();
                for(var i = 0; i< orderlines.length; i++){
                    var new_price = orderlines[i].get_unit_display_price()*((this.pos.config['extra_charge']/100)+1);
                    orderlines[i].set_unit_price(new_price);
                }
            }
            _super_order.prototype.add_paymentline.apply(this,arguments);
        },

        remove_paymentline: function(line){
            if(line.get_type()=='bank'){
                var orderlines = this.get_orderlines();
                for(var i = 0; i< orderlines.length; i++){
                    var new_price = orderlines[i].get_unit_display_price()/((this.pos.config['extra_charge']/100)+1);
                    orderlines[i].set_unit_price(new_price);
                }
            }
            _super_order.prototype.remove_paymentline.apply(this, arguments);
        },
        ////////////////////

        // New functions
        remove_all_paymentlines: function(){
            var paymentlines = this.get_paymentlines();
            for(var i=0; i<paymentlines.length; i++){
                this.remove_paymentline(paymentlines[i]);
                i--;
            }
        },
        ////////////////

    });
});

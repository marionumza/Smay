odoo.define("smay_hide_products.smay_hide_products",function(require){
    "use strict"

    var models = require('point_of_sale.models')
    var Model = require('web.DataModel');
    var screens = require('point_of_sale.screens');
    var gui = require('point_of_sale.gui');
    //var task;

    var _super_order = models.Order;
    models.Order = models.Order.extend({

        //Inherited functions
        add_product: function(product, options){
            var self=this;
            var permited_utility_percent = (Math.abs(this.pos.config.utility_percent)/100)+1;
            if(this.pos.config.hide_products_utility){
                if(product.price  > product.standard_price * permited_utility_percent ){
                    _super_order.prototype.add_product.apply(this, arguments);
                }else{
                    self.pos.gui.show_popup('error',{
                    'title': 'Producto mal configurado.',
                    'body': 'Comunicate con administración para que configure correctamente la utilidad del producto.  '+
                    product.display_name,
                    })
                }
            }else{
                _super_order.prototype.add_product.apply(this, arguments);
            }
        },
    });

    var _super_pos = models.PosModel;
    models.PosModel = models.PosModel.extend({

        //inherited Functions
        initialize: function(session, attributes) {
            _super_pos.prototype.initialize.apply(this,arguments);
            this.send_mail= false;
        },


        //new Functions
        hide_products_negative_utility: function(){
            var self = this;
            var $products  = $('.product');
            var permited_utility_percent = (Math.abs(self.config.utility_percent)/100)+1;
            var hiddend_products =[];
            var source ={};

            source['empresa']= self.config.company_id;
            source['caja']= self.config.display_name;
            source['caja_id']=self.config.id;
            hiddend_products.push(source);

            $products.each(function(){
                var id = parseInt($(this).attr('data-product-id'));
                var product = self.db.get_product_by_id(id);
                if(product.price  <= product.standard_price * permited_utility_percent){
                    if(self.config.hide_products_utility){
                        $(this).addClass('sold-out');
                        $(this).addClass('disable');
                        $(this).hide();
                    }
                }else{
                    $(this).removeClass('sold-out');
                    $(this).removeClass('disable');
                    $(this).show();
                }
            });

            if(!self.send_mail){
                var products = self.db.product_by_id;
                for(var i in products){
                    var information_product={};
                    if(products[i].price  <= products[i].standard_price * permited_utility_percent){
                        information_product['barcode']= products[i].barcode;
                        information_product['name']= products[i].display_name;
                        information_product['precio']= products[i].price;
                        information_product ['costo']= products[i].standard_price;
                        information_product['porcentaje_utilidad']= (((products[i].price*100)/products[i]
                        .standard_price)-100).toFixed(2);
                        hiddend_products.push(information_product);
                    }
                }
            }

            if(hiddend_products.length > 1 && !self.send_mail && self.config.notification_mail ){
                self.send_mail = true;
                new Model('pos.config').call('send_mail_hide_products',[hiddend_products], undefined, {
                        timeout: 4000
                    }).then(function(){
                                self.send_mail = true;
                    },function(err,event){
                        //console.log("Error en la conexion");
                    });
            }
        },
    });

    var _super_screens = screens.ProductListWidget;
    screens.ProductListWidget.include({
        renderElement: function(){
            var self = this;
            this._super();
            this.pos.hide_products_negative_utility();
        },
    });
});

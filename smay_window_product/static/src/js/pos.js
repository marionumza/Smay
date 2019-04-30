odoo.define('smay_window_product.smay_window_product', function(require){
    "use strict";

    var gui = require('point_of_sale.gui');
    var popups = require('point_of_sale.popups');
    var screens = require('point_of_sale.screens');

	var InformationProductPopUp = popups.extend({
	    template:'InformationProductPopUp',

	    show: function(options){
	        var self = this;
	        self._super(options);
	        var product_id = 0;
	        var qty = 0;

	        self.$('.priceProductUnit').on('click',function(){
	            self.gui.close_popup();
	            //console.log('clic al producto por unidad')
	            console.log(self.$('.priceProductUnit').attr('product_id'))
	            product_id = self.$('.priceProductUnit').attr('product_id');
	            qty=1;
	            if(product_id > 0){
                    var product = self.pos.db.get_product_by_id(product_id);
                    for(var i = 0; i < qty; i++){
                        if(product.to_weight && self.pos.config.iface_electronic_scale){
                            self.gui.show_screen('scale',{product: product});
                        }else{
                            self.pos.get_order().add_product(product);
                        }
                    }
	            }
	        });

	        self.$('.priceProductBox').on('click',function(){
	            self.gui.close_popup();
	            //console.log('clic al producto por caja')
	            console.log(self.$('.priceProductBox').attr('product_id'))
	            product_id = self.$('.priceProductBox').attr('product_id');
	            qty = self.pos.db.get_product_by_id(product_id).display;

	            if(product_id > 0 ){
                    var product = self.pos.db.get_product_by_id(product_id);
                    for(var i=0; i< qty; i++){
                        if(product.to_weight && self.pos.config.iface_electronic_scale){
                        self.gui.show_screen('scale',{product: product});
                        }else{
                            self.pos.get_order().add_product(product);
                        }
                    }
	            }
	        });

            self.$('#cancel').on('click',function(){
                self.gui.close_popup();
            });
	    },

	});

	gui.define_popup({name:'InformationProductPopUp',widget: InformationProductPopUp});

	screens.ProductScreenWidget.include({
        click_product: function(product) {
            var self = this;
            self.gui.show_popup('InformationProductPopUp',{
                'title': product.name,
                'id': product.id,
                'url_image': self.pos.attributes.origin+"/web/image?model=product.product&field=image&id="+product.id,
                'qty_per_box': product.display,
                'price_per_box': product.list_price_box,
                'price_per_unit': product.price,
                'stock_qty': self.pos.db.qty_by_product_id[product.id],
            });

            /*
               if(product.to_weight && this.pos.config.iface_electronic_scale){
                   this.gui.show_screen('scale',{product: product});
               }else{
                   this.pos.get_order().add_product(product);
               }
               */
        },
	});

 });

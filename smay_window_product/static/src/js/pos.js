odoo.define('smay_window_product.smay_window_product', function(require){
    "use strict";

    //var chrome = require('point_of_sale.chrome');
    var gui = require('point_of_sale.gui');
    var popups = require('point_of_sale.popups');
    var screens = require('point_of_sale.screens')
    //var Model = require('web.DataModel');
    //var core = require('web.core');
    //var QWeb = core.qweb;


	var InformationProductPopUp = popups.extend({
	    template:'InformationProductPopUp',

	    show: function(options){
	        var self = this;
	        self._super(options);

	        self.$('.priceProduct').on('click',function(){
	            console.log('clic al producto')
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
        console.log('Entro al clic product');
        console.log(product)
        self.gui.show_popup('InformationProductPopUp',{
            'title': product.name,
            'id': product.id,
            'url_image': "http://192.168.5.216:8069/web/image?model=product.product&field=image&id="+product.id,
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

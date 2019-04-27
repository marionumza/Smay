odoo.define('smay_window_product.smay_window_product', function(require){
    "use strict";

    //var chrome = require('point_of_sale.chrome');
    var gui = require('point_of_sale.gui');
    var popups = require('point_of_sale.popups');
    //var Model = require('web.DataModel');
    //var core = require('web.core');
    //var QWeb = core.qweb;


	var InformationProductPopUp = popups.extend({
	    template:'InformationProductPopUp',

	    show: function(options){
	        var self = this;
	        self._super(options);

            self.$('#cancel').on('click',function(){
                self.gui.close_popup();
            });
	    },

	});

	gui.define_popup({name:'InformationProductPopUp',widget: InformationProductPopUp});

 });

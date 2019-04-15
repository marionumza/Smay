odoo.define('smay_custom_payments.smay_custom_payments', function(require){
    "use strict";

	var models = require('point_of_sale.models');

	var _super_order = models.Order;
	models.Order = models.Order.extend({

        ///Inherited Functions
	    add_paymentline: function(cashregister) {
	        var type = cashregister.journal['type'];
	        if(this.payment_exists(type)==false){
	            _super_order.prototype.add_paymentline.apply(this,arguments);
	        }
	    },
	    ///////////

        //////New functions
	    payment_exists:function(type){
	        var paymentlines = this.get_paymentlines();
	        if(!this.pos.config.multiple_payments && paymentlines.length>=1){
	            return true;
	        }
            for(var i=0; i<paymentlines.length ; i++){
                if(paymentlines[i].get_type()==type){
                    return true;
                }
            }
            return false;
	    },
	    //////////////

	});
});



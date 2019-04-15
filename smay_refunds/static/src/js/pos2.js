odoo.define('smay_refunds.smay_refunds2', function(require){
"use strict";

    var popups = require('point_of_sale.popups');
    //var reprint_ticket = require('smay_reprint_ticket.smay_reprint_ticket');
    var gui = require('point_of_sale.gui');


    console.log('FFFFFFFFFFFF222222222222222222222')
    console.log(require('smay_reprint_ticket.smay_reprint_ticket'));
    //console.log(require('pos_stock_quantity.pos_stock'))
    //console.log(require('pos_stock_quantity.popups'))




  //  })

    var RefundPopUp = popups.extend({
        template : 'RefundPopUp',
        show: function(options){

        var self = this;
			self._super(options);

			$('#refund_accept').on('click',function(){
				//self.gui.show_popup('ReprintTicketPopUp');
				console.log('aceptar')
			});

			$('#refund_cancel').on('click',function(){
				//self.gui.show_popup('ReprintTicketPopUp');
				console.log('cancelar')
			});
        },
    });

    gui.define_popup({name:'RefundPopUp',widget: RefundPopUp});
});

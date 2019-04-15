odoo.define('smay_custom_ticket.smay_custom_ticket', function(require){
    "use strict";

    var models = require('point_of_sale.models');
	var screens = require('point_of_sale.screens');

	models.load_fields('res.company', ['rfc', 'street','l10n_mx_street3','colonia_sat_id','township_sat_id',
	'country_id','state_id','invoice_partner_id'])


	screens.ReceiptScreenWidget.include({
		show: function()
		{
			this.pos.config.iface_print_auto  = false
			this._super();
			var self = this;
			this.render_change();
			this.render_receipt();
			this.lock_screen(false);
			if(!self.pos.gui.get_current_screen_param('reprint') &&
			!self.pos.gui.get_current_screen_param('refund') &&
			!self.pos.gui.get_current_screen_param('retirement'))
			    self.render_barcode_ticket(self.pos.get_order().name);
			this.pos.config.iface_print_auto = true
			//self.handle_auto_print();

			setTimeout(function(){
			        if(!self.pos.gui.get_current_screen_param('reprint') &&
                        !self.pos.gui.get_current_screen_param('refund') &&
                        !self.pos.gui.get_current_screen_param('retirement'))
			                self.render_barcode_ticket(self.pos.get_order().name);

			        self.handle_auto_print();
			        },500);

		},

	    render_barcode_ticket: function(pos_reference){
	        $('.barcode_ticket').attr('src','/report/barcode/Code128/'+pos_reference)
	        $('#barcode_ticket').attr('src','/report/barcode/Code128/'+pos_reference)
	    },
	});


	var _super_order = models.Order;
	models.Order = models.Order.extend({

        get_zip_code: function(){
            var zip_code = this.pos.company.colonia_sat_id[1].substring(this.pos.company.colonia_sat_id[1].indexOf(']')+1,
            this.pos.company.colonia_sat_id[1].indexOf('/'));
            return zip_code;
        },

        get_colonia: function(){
            //console.log(this.pos.company)
            var colonia = this.pos.company.colonia_sat_id[1].substring(this.pos.company.colonia_sat_id[1].indexOf('/')+1,
            this.pos.company.colonia_sat_id[1].lenght);
            return colonia;
        },

        get_town: function(){
            var town = this.pos.company.township_sat_id[1].substring(this.pos.company.township_sat_id[1].indexOf(']')+1,
            this.pos.company.township_sat_id[1].lenght);
            return town;
        },

        get_qty_products(){
            var qty = 0;
            for(var i in this.get_orderlines() ){
                //console.log(this.get_orderlines()[i]);
                qty=qty+this.get_orderlines()[i].quantity
            }
            return qty
        },
    });
});

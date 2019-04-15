odoo.define('smay_custom_ticket.smay_custom_ticket', function(require){
    "use strict";

    var models = require('point_of_sale.models');
	var screens = require('point_of_sale.screens');

	models.load_fields('res.company', ['rfc', 'street','l10n_mx_street3','colonia_sat_id','township_sat_id',
	'country_id','state_id','invoice_partner_id'])



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

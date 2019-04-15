odoo.define('smay_pos_promotions.smay_pos_promotions', function(require){
    "use strict";

	var models = require('point_of_sale.models');
	var utils = require('web.utils');


	var round_di = utils.round_decimals;

	models.load_fields('product.product', ['list_price_box','display','standard_price']);

	models.load_models([{
            model: 'pos.promo',
            label: 'Promociones',
            order:['sequence','date_ini','date_end'],
            fields: ['name','calculate', 'date_end', 'date_ini','from_price','from_qty','id','sequence','percent','type2'],
            loaded: function(self, promociones) {
                for(var i=0; i< promociones.length; i++){
                    if(new Date(new Date(promociones[i].date_end)+'UTC') > new Date() &&
                        new Date(new Date(promociones[i].date_ini)+'UTC') < new Date()){
                            //console.log('Lista Valida:')
                           // console.log(promociones[i].name)
                        }else{
                            //console.log('Lista Invalida')
                            //console.log(promociones[i].name)
                            promociones.splice(i,1);
                            i--;
                        }
                    }
               self.promociones = promociones;
            },
        },
        {
            model: 'pos.promo.margin',
            label: 'Precios de Promociones',
            domain: function(self){
                    var promociones = [];
                    for(var i = 0; i< self.promociones.length ; i++){
                        promociones.push(self.promociones[i].id);
                    }
                    return [['promo_id.id','in',promociones],['state', '=', 'v']];
            },
            loaded: function(self,precios_promociones){
                self.precios_promociones = precios_promociones;
            },
        },
    ],
    {
        'after': 'product.product'
    });

        var _super_numpad = models.NumpadState;
        models.NumpadState = models.NumpadState.extend({

            appendNewChar : function(newChar){
                _super_numpad.prototype.appendNewChar.apply(this, arguments);
                self.posmodel.get_order().apply_promotion();
            },

            deleteLastChar: function() {
                _super_numpad.prototype.deleteLastChar.apply(this, arguments);
                self.posmodel.get_order().apply_promotion();
            },
        });

        var _super_order = models.Order;
        models.Order = models.Order.extend({
            add_product: function(product, options){
                _super_order.prototype.add_product.apply(this, arguments);
                this.group_orderlines();
                this.apply_promotion();
            },

            group_orderlines: function(){
                var new_orderline = this.selected_orderline;
                var orderlines = this.get_orderlines();
                for(var i =0 ; i< orderlines.length-1; i++){
                    if(orderlines[i].product){
                        if(orderlines[i].product.id == new_orderline.product.id &&
                        orderlines[i].id != new_orderline.id){
                            var qty = orderlines[i].quantity +1;
                            orderlines[i].set_quantity(qty);
                            new_orderline.set_quantity('remove');
                            this.select_orderline(orderlines[i]);
                        }
                    }
                }
            },

            apply_promotion:function(){
                var promotions = this.pos.promociones;
                var price_promotions = this.pos.precios_promociones;
                var orderline = this.pos.get_order().selected_orderline;
                var change_price = false;
                if(orderline){
                    //orderline.set_unit_price(orderline.get_product()['list_price']);
                    for(var i = 0 ; i < promotions.length; i++){
                        if(new Date(new Date(promotions[i]['date_end'])+'UTC') > new Date() &&
                        new Date() > new Date(new Date(promotions[i]['date_ini'])+'UTC')){
                            var id_promo = promotions[i]['id'];
                            var activation_method = promotions[i]['type2']; // [precio/cantidad]
                            var application_method = promotions[i]['calculate']; //[porcentaje/precio]
                            var discount_price = promotions[i]['from_price'];  //minimum amount
                            var qty = promotions[i]['from_qty'];   //minimum quantity
                            var percent = promotions[i]['percent'];

                            if( change_price) break;

                            for(var j=0; j< price_promotions.length; j++){
                                if(id_promo == price_promotions[j]['promo_id'][0] &&
                                    price_promotions[j]['code'] == orderline.get_product().barcode){
                                        if(qty>0 && activation_method == 'cantidad'){
                                            if(orderline.get_quantity() >= qty &&
                                            orderline.get_quantity() < orderline.get_product().display &&
                                            qty > 0 ){
                                                orderline.set_unit_price(price_promotions[j]['prm_price']);
                                                ///// Version DEMO
                                                /*
                                                orderline.promotion_name = promotions[i]['name']
                                                var product = this.pos.db.get_product_by_id(orderline.get_product()['id'])
                                                orderline.discount_amount_by_promotion= (product['list_price'] - price_promotions[j]['prm_price'])*orderline.get_quantity()
*/
                                                ////


                                                ////version descuento POS
                                                orderline.promotion_name = promotions[i]['name']
                                                var product = this.pos.db.get_product_by_id(orderline.get_product()['id'])
                                                //orderline.set_discount_amount_by_promotion((product['list_price'] - price_promotions[j]['prm_price'])*orderline.get_quantity())
                                                orderline.set_discount_amount_by_promotion((product['price'] - price_promotions[j]['prm_price'])*orderline.get_quantity())

                                                ////
                                                change_price = true;
                                            }
                                        }else if(discount_price > 0 && activation_method == 'precio'){
                                                    if(orderline.price * orderline.get_quantity() >= discount_price){
                                                        console.log('entro a precio')
                                                        orderline.set_unit_price(price_promotions[j]['prm_price']);
                                                        ///////// version DEMO
                                                        /*
                                                        orderline.promotion_name = promotions[i]['name']
                                                var product = this.pos.db.get_product_by_id(orderline.get_product()['id'])
                                                orderline.discount_amount_by_promotion= (product['list_price'] - price_promotions[j]['prm_price'])*orderline.get_quantity()
*/
                                                        /////
                                                        orderline.promotion_name = promotions[i]['name']
                                                var product = this.pos.db.get_product_by_id(orderline.get_product()['id'])
                                                        //orderline.set_discount_amount_by_promotion((product['list_price'] - price_promotions[j]['prm_price'])*orderline.get_quantity())
                                                        orderline.set_discount_amount_by_promotion((product['price'] - price_promotions[j]['prm_price'])*orderline.get_quantity())
                                                        ////
                                                        change_price = true;
                                                        console.log(this.pos.get_order().get_selected_orderline().price)
                                                        console.log(this.pos.get_order().get_selected_orderline().get_quantity())
                                                    }
                                                }

                                        if(orderline.get_product().list_price_box > 0 &&
                                            orderline.get_quantity()  >= orderline.get_product().display){
                                                orderline.set_unit_price(orderline.get_product().list_price_box)

                                                ///////// Version DEMO
                                                       /* orderline.promotion_name = 'Precio por caja'
                                                var product = this.pos.db.get_product_by_id(orderline.get_product()['id'])
                                                orderline.discount_amount_by_promotion= (product['list_price'] - orderline.get_product().list_price_box)*orderline.get_quantity()
*/
                                                        /////

                                                        orderline.promotion_name = 'Precio por caja'
                                                var product = this.pos.db.get_product_by_id(orderline.get_product()['id'])
                                                        //orderline.set_discount_amount_by_promotion((product['list_price'] - orderline.get_product().list_price_box)*orderline.get_quantity())
                                                        orderline.set_discount_amount_by_promotion((product['price'] - orderline.get_product().list_price_box)*orderline.get_quantity())
                                                change_price = true
                                        }

                                        if( change_price) break;

                                        //orderline.set_unit_price(orderline.get_product()['list_price']);
                                        orderline.set_unit_price(orderline.get_product()['price']);
                                        orderline.set_discount_amount_by_promotion(0)
                                        orderline.promotion_name = ''
                                }
                            }
                        }
                    }
                }
            },
        });

        var _super_orderline = models.Orderline;
        models.Orderline = models.Orderline.extend({

            ///Inherited functions
            initialize : function(attr,options){
                _super_orderline.prototype.initialize.apply(this, arguments);
                this.discount_amount_by_promotion = 0;
                this.promotion_name = ''
            },

            init_from_JSON:function(json){
                _super_orderline.prototype.init_from_JSON.apply(this,arguments);
                this.discount_amount_by_promotion = this.discount_amount_by_promotion
                this.promotion_name = this.promotion_name
            },

            export_as_JSON: function(){
             var json = _super_orderline.prototype.export_as_JSON.apply(this,arguments);
                json.discount_amount_by_promotion = this.discount_amount_by_promotion;
                json.promotion_name = this.promotion_name;
              return json
            },

            export_for_printing: function(){
                var json = _super_orderline.prototype.export_for_printing.apply(this,arguments);
                json.promotion = {
                    name: this.promotion_name,
                    total_discount: this.discount_amount_by_promotion,
                    unit_discount: this.discount_amount_by_promotion/this.get_quantity(),
                }
                return json;
            },

            clone : function(){
                var json = _super_orderline.prototype.clone.apply(this,arguments);
                json.promotion_name = this.promotion_name;
                json.discount_amount_by_promotion = this.discount_amount_by_promotion;
                return json;
            },
            ///////

            ////New functions

            set_discount_amount_by_promotion:function(amount){
                this.discount_amount_by_promotion = round_di(parseFloat(amount) || 0, this.pos.dp['Product Price']);
                this.trigger('change',this);
            },

            /*
            get_discount_amount_by_promotion_str: function(){
               var disc = Math.max(parseFloat(this.discount_amount_by_promotion) || 0, 0);
                this.discount_amount_by_promotion = disc;
                return ''+disc;
            },
            */

            //////

        });
});

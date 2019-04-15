odoo.define('smay_refunds.smay_refunds', function(require){
"use strict";

    var models = require('point_of_sale.models');
    var Model = require('web.DataModel');
    var reprint_ticket = require('smay_reprint_ticket.smay_reprint_ticket');
    var gui = require('point_of_sale.gui');
    var popups = require('point_of_sale.popups');
    var core = require('web.core');
    var QWeb = core.qweb;
    var screens = require('point_of_sale.screens');

    models.load_fields('res.users', 'is_manager');


    //I add the button in the menu
    reprint_ticket.PopUpMenu.include({
        show: function(options){

            var self = this;
			self._super(options);

			$('.gridView-toolbar.refundButton').on('click',function(){
                    var refund_pass = self.gui.ask_password_smay('devolucion');
                    refund_pass.done(function(){
                        self.gui.show_popup('RefundPopUp');
                    });
			});
        }
    });


    //define it the new password popup for smay
    gui.Gui = gui.Gui.extend({

        ask_password_smay: function(action) {
            var self = this;
            var _managers =[];
            for(var i=0; i<self.pos.users.length; i++){
                if(self.pos.users[i].is_manager){
                    _managers.push(self.pos.users[i].pos_security_pin);
                }
            }

            var ret = new $.Deferred();
                this.show_popup('password',{
                    'title': 'Contraseña',
                    confirm: function(pw) {
                        if(!_managers.includes(pw)){
                            self.show_popup('error','Contaseña incorrecta');
                            ret.reject();
                        } else {
                            ret.resolve();
                        }
                    },
                });
            return ret;
        },

    });


    // this popup shows an input for type the pos_reference
    var RefundPopUp = popups.extend({
        template : 'RefundPopUp',
        show: function(options){
            var self = this;
			self._super(options);
			self.pos.refund_order = false;
			$('#refund_order').focus();

            //here I define the accept action
			$('#refund_accept').on('click',function(){
			    self.gui.close_popup();
				if($('#refund_order').val() == ""){
				    self.gui.show_popup('error',{
                            title: 'Error en la orden',
                            body: 'El campo no puede estar vacio'
				        });
				    return;
				}

                //here I validate that there is connection with the server
				new Model('pos.config').call(
                            'existe_conexion',
                            [],
                            undefined,
                            {timeout:1000}
				        ).done(function(resp){

				                //I verify if the order exists
				                new Model('pos.order').call(
                                            'exist_order',
                                            [$('#refund_order').val()],
                                            undefined,
                                            {timeout:5000}
                                        ).done(function(resp){
                                                    if(resp == -1 ){
                                                        self.gui.show_popup('error', {
                                                            title:'Orden invalida',
                                                            body: 'No se puede hacer devolución de una orden que ya le fue aplicada.'
                                                        });
                                                        return;
                                                    }

                                                    if(resp == -2){
                                                        self.gui.show_popup('error', {
                                                            title:'Orden invalida',
                                                            body: 'No se encontro la orden. Revisa la información ingresada.'
                                                        });
                                                        return;
                                                    }

                                                    if(resp > 0){
                                                        self.pos.config.iface_print_auto  = false;
                                                        //console.log("esta es una orden valida");

                                                        //if the pos_reference typed was validate,
                                                        //It shows the information with the original order
                                                        //self.pos.gui.show_popup('RefundOrderInformationPopUp');
                                                        new Model('pos.order').call(
                                                                    'get_information_reprint',
                                                                    [resp],
                                                                    undefined,
                                                                    {timeout:5000}
                                                                ).done(function(data){
                                                                        self.pos.gui.show_popup('RefundOrderInformationPopUp',{
                                                                                title: data.pos_reference+ '       Total : $ ' +data.total  ,
                                                                                order:data,
                                                                        });
                                                                });
                                                    }
                                        }).fail(function(){
                                            self.pos.gui.show_popup('error',{
                                                    title: 'Devolución',
                                                    body: 'No existe la orden.'
                                            });
                                        });
                        }).fail(function(){
				                self.pos.gui.show_popup('error',{
                                        title: 'Devolución',
                                        body: 'No hay conexion con el servidor, intentalo más tarde.',
                                });
                        });
            });


            $('#refund_cancel').on('click',function(){
				self.gui.close_popup();
				self.pos.refund_order = false;
			});
        }
    });

    gui.define_popup({name:'RefundPopUp',widget: RefundPopUp});


    var RefundOrderInformationPopUp = popups.extend({
        template: 'RefundOrderInformationPopUp',
        show : function(options){
            var self = this;
            self._super(options);
            if(options){
                var orderlines = options.order.orderlines;
                $("#original_order").append("
                        <table style='width: 100%;'>
                            <tr>
                                <td style='width: 60%;' align='center'>
                                    Producto
                                </td>
                                <td style='width: 20%;' align='center';>
                                    Cantidad
                                </td>
                                <td style='width: 20%;' align='center';>
                                    Precio Unitario
                                </td>
                            </tr>
                        </table>"
                        );

                for(var i = 0; i < orderlines.length; i++){

                    $("#original_order").append("
                            <table style='width: 100%;'>
                                <tr>
                                    <td style='width: 60%;padding=0px 5px' align='left'>
                                        <div style='text-align:left; padding:0px 15px'>"+
                                            orderlines[i].name_product
                                        +"</div>
                                    </td>
                                    <td style='width: 20%;' align='right'>"+
                                        orderlines[i].qty
                                    +"</td >
                                    <td style='width: 20%;padding=100px 100px' align='right'>
                                        <div style='text-align:right; padding : 0px 15px'> $"+
                                            orderlines[i].price_unit
                                        +"</div>
                                    </td>
                                </tr>
                            </table>"
                            );
                }
            }


            $("#OriginalOrderAccept").on('click', function(){

                new Model('pos.order').call(
                        'get_data_order',
                        [options.order.pos_reference],
                        undefined,
                        {timeout:12000}
                    ).done(function(data){
                            if(data > 0){
                                self.pos.refund_order = true;
                                self.pos.gui.show_screen('receipt',{refund:'true'})
                                new Model('pos.order').call(
                                       'get_information_reprint',
                                       [data],
                                       undefined,
                                       {timeout:5000}
                                    ).done(function(data){
                                            var _order =self.pos.get_order();
                                            var orderlines =_order.get_orderlines();

                                            while (_order.get_orderlines().length > 0) {
                                                _order.remove_orderline(_order.get_last_orderline());
                                            }

                                            ///////////*
                                            var _refund_orderlines = data.orderlines
                                            for(var i = 0; i < _refund_orderlines.length; i++){
                                                var _product_id = self.pos.db.get_product_by_id(_refund_orderlines[i].product_id);
                                                var _qty = Math.abs(_refund_orderlines[i].qty);
                                                var _price_unit = _refund_orderlines[i].price_unit;

                                                self.pos.db.qty_by_product_id[_refund_orderlines[i].product_id] += Math.abs(_refund_orderlines[i].qty)
                                                _order.add_product(_product_id,{
                                                                            quantity: _qty,
                                                                            price: _price_unit,
                                                                            });
                                            }

                                            var date_reprint = new Date()
                                            var day = (date_reprint.getDate() >= 10) ? date_reprint.getDate() : '0'+date_reprint.getDate()
                                            var month  = ((parseInt(date_reprint.getMonth())+1)>=10) ?
                                                (parseInt(date_reprint.getMonth())+1) : '0'+(parseInt(date_reprint.getMonth())+1)
                                            var hours =  (date_reprint.getHours() >= 10)? date_reprint.getHours() : '0'+date_reprint.getHours()
                                            var minutes = (date_reprint.getMinutes() >= 10) ? date_reprint.getMinutes() : '0'+date_reprint.getMinutes()
                                            var seconds = (date_reprint.getSeconds() >= 10) ? date_reprint.getSeconds() : '0'+date_reprint.getSeconds()

                                            var receipt = {
                                                //head
                                                logo : self.pos.company_logo.currentSrc,
                                                company_name : self.pos.company.name,
                                                rfc : self.pos.company.rfc,
                                                street : self.pos.company.street,
                                                number : self.pos.company.l10n_mx_street3,
                                                county : self.pos.get_order().get_colonia(),
                                                zip_code : self.pos.get_order().get_zip_code(),
                                                city : self.pos.get_order().get_town(),
                                                state : self.pos.company.state_id[1],
                                                country : self.pos.company.country.name,
                                                phone: self.pos.company.phone,

                                                //body
                                                order_name : data.pos_reference,
                                                date_order: data.date_order,//self.get_correct_datetime(data.date_order),
                                                cashier : data.cashier,
                                                client : data.partner,
                                                header : self.pos.config.recepit_header,
                                                orderlines : data.orderlines,
                                                subtotal : data.subtotal,
                                                taxes : data.taxes,
                                                total: data.total,
                                                paymentlines : data.payments,
                                                change_amount : data.change_amount,
                                                qty_products : data.qty_products,
                                                footer: self.pos.config.receipt_footer,
                                                //date_reprint : date_reprint.getDate()+'/'+(parseInt(date_reprint.getMonth())+1)+'/'+date_reprint.getFullYear()+'   '+date_reprint.getHours()+':'+date_reprint.getMinutes()+':'+date_reprint.getSeconds(),
                                                date_reprint : day+'/'+month+'/'+date_reprint.getFullYear()+'  '+hours+':'+minutes+':'+seconds
                                            }

                                            var reprinted_order = QWeb.render('RefoundPosTicket' ,{widget:self,receipt:receipt,refound: true});

                                            $('.pos-sale-ticket').html(reprinted_order);
                                            self.pos.config.iface_print_auto  = true;
                                    }).fail(function(){
                                            self.pos.gui.show_popup('error',{
                                                    title: 'Devolución',
                                                    body: 'No se obtuvo la información de la devolución.',
                                                    });
                                    });
                            }
                    }).fail(function(){
                        self.pos.gui.show_popup('error',{
                                title: 'Devolución',
                                body: 'Se vencio el tiempo de espera. Contacta al encargado.'
                        });
                        //console.log('error')
                    });
                });

            $("#OriginalOrderCancel").on('click', function(){
                    self.gui.close_popup();
                });
        }
    });

    gui.define_popup({name:'RefundOrderInformationPopUp',widget: RefundOrderInformationPopUp});


    screens.ReceiptScreenWidget = screens.ReceiptScreenWidget.include({

        click_next: function() {
            if(this.pos.refund_order){
                this.gui.show_screen('products');
                this.pos.refund_order = false;
                return;
            }
            this.pos.get_order().finalize();
        },
    });

    screens.NumpadWidget = screens.NumpadWidget.include({
        start: function() {
            this.state.bind('change:mode', this.changedMode, this);
            this.changedMode();
            this.$el.find('.numpad-backspace').click(_.bind(this.clickDeleteLastChar, this));
            //this.$el.find('.numpad-minus').click(_.bind(this.clickSwitchSign, this));
            this.$el.find('.number-char').click(_.bind(this.clickAppendNewChar, this));
            this.$el.find('.mode-button').click(_.bind(this.clickChangeMode, this));
        },
    });
});

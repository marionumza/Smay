odoo.define('smay_reprint_ticket.smay_reprint_ticket', function(require){
    "use strict";

    var chrome = require('point_of_sale.chrome');
    var gui = require('point_of_sale.gui');
    var popups = require('point_of_sale.popups');
    var Model = require('web.DataModel');
    var core = require('web.core');
    var QWeb = core.qweb;


    chrome.OrderSelectorWidget.include({
    renderElement: function(){
        var self = this;
        this._super();
        //this.$('.smay_menu').hide()
        this.$('.smay_menu').click(function(){
            console.log('boton menu');
            //self.gui.show_popup('popup_menu_acctions');

            self.gui.show_popup('PopUpMenu');
        });
		},
	});

	var ReprintTicketPopUp = popups.extend({
	    template:'ReprintTicketPopUp',

	    get_correct_datetime : function(date){
            var correct_datetime = new Date(date+' UTC').toString();
            var correct_date = date.substring(0,10)
            var correct_time = correct_datetime.substring(16,24)
            //return correct_date+' '+correct_time+'   '
            return correct_date.substring(8,10)+'/'+correct_date.substring(5,7)+'/'+correct_date.substring(0,4) +' '+correct_time
	    },

	    show: function(options){
	        var self = this;
	        self._super(options);

	        new Model('pos.config').call('existe_conexion',[],undefined,{timeout:1000}).done(function(){
                    console.log("ecxxiste conexion con el server")
                    new Model('pos.order').call('get_ticket_for_reprint',[],undefined,{timeout:3000}).done(function(tickets){
                            for(var i in tickets){
                            //console.log(tickets[i])
                            $("#tickets").append('<option value="'+tickets[i].id+'">'+'   '+tickets[i].pos_reference+'  -  '+self.get_correct_datetime(tickets[i].date_order)+ '</option>')
                            }
                        }).fail(function(){
                                console.log('ERROR AL LLAMAR FUNCION TICKETS')
                        });
            }).fail(function(){
                    self.gui.show_popup('error',{
                        title: 'Sin conexión al servidor',
                        body: 'Por el momento no se puede obtener la información del sevidor. Intentalo más tarde',
                     })
            });

            self.$('#accept').on('click',function(){
                    $(this).children("option:selected").val()
                    new Model('pos.order').call('get_information_reprint',
                        [$( "#tickets").children("option:selected").val()],undefined,{timeout:5000}).done(function(data){
                            console.log(data)
                            console.log('DATA')
                            console.log(data)
                            //self.gui.show_screen('receipt')
                            var date_reprint = new Date()

                            var day = (date_reprint.getDate()>=10) ? date_reprint.getDate() : '0'+date_reprint.getDate()
                            var month  = ((parseInt(date_reprint.getMonth())+1)>=10) ? (parseInt(date_reprint.getMonth())+1) : '0'+(parseInt(date_reprint.getMonth())+1)
                            var hours =  (date_reprint.getHours()>=10)? date_reprint.getHours() : '0'+date_reprint.getHours()
                            var minutes = (date_reprint.getMinutes() >=10) ? date_reprint.getMinutes() : '0'+date_reprint.getMinutes()
                            var seconds = (date_reprint.getSeconds()>=10) ? date_reprint.getSeconds() : '0'+date_reprint.getSeconds()
                            //+':'+date_reprint.getMinutes()+':'+date_reprint.getSeconds()
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
                                date_order: self.get_correct_datetime(data.date_order),
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
                            var reprinted_order = QWeb.render('ReprintPosTicket' ,{widget:self,receipt:receipt})
                            //$('.pos-sale-ticket').html(receiptFinal);
                            //self.gui.show_screen('receipt')
                            $('.pos-sale-ticket').html(reprinted_order);//').html(receiptFinal);
                            setTimeout(function(){
                            self.gui.show_screen('receipt'); 
                            console.log('entro al timeout')},5000);
                            //ReprintPosTicket
                    }).fail(function(){
                        console.log('no trajo informacion de reimpresion')
                    });
                    console.log($( "#tickets").children("option:selected").val());
            });
            self.$('#cancel').on('click',function(){
                self.gui.close_popup();
            });

	    },
	});

	gui.define_popup({name:'ReprintTicketPopUp',widget: ReprintTicketPopUp});





var PopUpMenu = popups.extend({
		template: 'PopUpMenu',

		show: function(options){
			var self = this;
			self._super(options);

			$('.gridView-toolbar.reprintButton').on('click',function(){
				self.gui.show_popup('ReprintTicketPopUp');
				console.log('"vengaaa')
			});

			$('.button.close').on('click',function(){
				self.gui.close_popup();
			});
		}
	});
	gui.define_popup({name:'PopUpMenu',widget: PopUpMenu});

 });

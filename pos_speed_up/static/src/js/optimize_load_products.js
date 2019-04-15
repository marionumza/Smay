/*
* @Author: D.Jane
* @Email: jane.odoo.sp@gmail.com
*/
odoo.define('pos_speed_up.optimize_load_products', function (require) {
    "use strict";
    var models = require('point_of_sale.models');
    var screens = require('point_of_sale.screens');
    var indexedDB = require('pos_speed_up.indexedDB');
    var Model = require('web.DataModel');

    require('pos_speed_up.pos_model');

    if (!indexedDB) {
        return;
    }

    models.PosModel = models.PosModel.extend({
        p_init: function () {
            var model = this.get_model('product.product');

            if (!model) {
                return;
            }

            model.fields = model.fields.concat(['sequence', 'name']);

            if (indexedDB.is_cached('products')) {
                this.p_sync(model);
            } else {
                this.p_save(model);
            }
        },
        p_sync: function (model) {
            var pos = this;

            var client_version = localStorage.getItem('product_index_version');
            if (!/^\d+$/.test(client_version)) {
                client_version = 0;
            }

            new Model('product.index').call('synchronize', [client_version]).then(function (res) {
                // update version
                localStorage.setItem('product_index_version', res['latest_version']);

                // create and delete
                var data_change = indexedDB.optimize_data_change(res['create'], res['delete'], res['disable']);

                model.domain.push(['id', 'in', data_change['create']]);

                pos.p_super_loaded = model.loaded;

                model.loaded = function (self, new_products) {
                    var done = new $.Deferred();

                    indexedDB.get('products').then(function (products) {

                        products = products.concat(new_products).filter(function (value) {
                            return data_change['delete'].indexOf(value.id) === -1;
                        });

                        // order_by product
                        products = indexedDB.order_by(products, model.order, 'esc');

                        self.p_super_loaded(self, _.map(products, function (product) {
                            return _.clone(product);
                        }));

                        done.resolve();

                    }).fail(function (error) {
                        console.log(error);
                        done.reject();
                    });

                    // put and delete product - indexedDB
                    indexedDB.get_object_store('products').then(function (store) {
                        _.each(new_products, function (product) {
                            store.put(product).onerror = function (ev) {
                                console.log(ev);
                                localStorage.setItem('product_index_version', client_version);
                            }
                        });
                        _.each(data_change['delete'], function (id) {
                            store.delete(id).onerror = function (ev) {
                                console.log(ev);
                                localStorage.setItem('product_index_version', client_version);
                            };
                        });
                    }).fail(function (error) {
                        console.log(error);
                        localStorage.setItem('product_index_version', client_version);
                    });

                    return done;
                };
            });
        },
        p_save: function (model) {
            this.p_super_loaded = model.loaded;
            model.loaded = function (self, products) {
                indexedDB.save('products', products);

                // order_by product
                products = indexedDB.order_by(products, model.order, 'esc');

                self.p_super_loaded(self, _.map(products, function (product) {
                    return _.clone(product);
                }));
            };
            this.p_update_version();
        },
        p_update_version: function () {
            var old_version = localStorage.getItem('product_index_version');
            if (!/^\d+$/.test(old_version)) {
                old_version = 0;
            }
            new Model('product.index').call('get_latest_version', [old_version]).then(function (res) {
                localStorage.setItem('product_index_version', res);
            });
        }
    });

    // temporary solution for fix pricelist problem, cache-first
    screens.ProductListWidget.include({
        renderElement: function () {
            this._super();
            this.update_price();
        },
        update_price: function () {
            var self = this;
            var ids = this.product_list.filter(function (product) {
                return !product.is_new_price;
            }).map(function (product) {
                return product.id;
            });
            clearTimeout(self.time_out);
            self.time_out = setTimeout(function () {
                self.get_price_from_server(ids);
            }, 500);
        },
        get_price_from_server: function (ids) {
            if (ids.length <= 0) {
                return;
            }
            var self = this;
            new Model('product.product').call('read', [ids, ['price']], {context: {pricelist: self.pos.pricelist.id}})
                .then(function (items) {
                    // mark all
                    _.each(ids, function (id) {
                        self.pos.db.product_by_id[id].is_new_price = true;
                    });

                    // get only change_items
                    var change_items = items.filter(function (item) {
                        return item.price !== self.pos.db.product_by_id[item.id].price;
                    });

                    if (change_items.length <= 0) {
                        return;
                    }

                    _.each(change_items, function (item) {
                        self.pos.db.product_by_id[item.id].price = item.price;
                    });

                    indexedDB.update_all('products', change_items);

                    // refresh ui
                    $(self.el.querySelector('.product-list')).find('.product').each(function () {
                        var $product = $(this);
                        var id = parseInt($product.attr('data-product-id'));
                        var product = self.pos.db.product_by_id[id];
                        var $price = $product.find('.price-tag');
                        if (product.to_weight) {
                            $price.text(self.format_currency(product.price) + '/' + self.pos.units_by_id[product.uom_id[0]].name);
                        } else {
                            $price.text(self.format_currency(product.price));
                        }
                    });
                })
        }
    });
});
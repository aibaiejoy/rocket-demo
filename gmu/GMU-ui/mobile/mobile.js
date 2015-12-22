///import ui.core.zepto;

/**
 * @name $.ui
 * @file
 * @desc ui库的基础，提供构建组件和定义模块相关的方法
 */

(function($) {
    //公共模块的集合
    var memoizedMods = [];

    /**
     * @namespace $.ui
     */
    $.ui = $.ui || {
        version: '1.0.4',

        defineProperty: Object.defineProperty,

        /**
         * @desc 定义组件，默认继承widget，需要实现_create及_init接口
         * @grammar create(name, [base], proto) ⇒ obj
         * @name create
         * @desc 参数
         * ***name*** {String}  组件名
         * ***base*** {Function} 组件父类
         * ***proto*** {Object}  原型扩展
         * @example  $.ui.create('button', {
         *     _data: {},
         *     _create: function(){},
         *     _init: function(){}
         * });
         */
        create: function(name, base, proto) {
            if (!proto) {
                proto = base;
                base = $.ui.widget;
            }

            var attachMods = [],
                baseProto = new base(),
                rcheck = /\b_super\b/,
                superProto = baseProto.__proto__,
                constructor = function(element, options){
                    if (element) {
                        var me = this,
                            args = $.slice(arguments);
                            
                        $.each(attachMods, function(index, mod) {
                            var paths = mod.split('.'),
                                mod = memoizedMods[paths.shift()] || {},
                                key, source = {};

                            $.each(paths, function(index, val) {
                                key = val;
                                mod = mod[key];
                            });

                            mod && (key ? source[key] = mod : source = mod);
                            _attach(me, source, 'delegate');
                        });
                        // invoke component's real _create
                        me._createWidget.apply(me, args);
                    }
                };

            $.ui[name] = function(element, options) {
                return new constructor(element, options);
            };

            constructor.prototype = $.extend(baseProto, {
                widgetName: name,
                widgetBaseClass: baseProto.widgetName || base
            }, $.each(proto, function(key, method) {
                if ($.isFunction(method) && $.isFunction(superProto[key]) && rcheck.test(method.toString())) {
                    proto[key] = function() {
                        this._super = superProto[key];
                        var ret = method.apply(this, arguments);
                        delete this._super;
                        return ret;
                    };
                }
            }));

            return {
                attach: function(paths) {
                    attachMods = attachMods.concat($.isArray(paths) ? paths : paths.split(','));
                }
            };
        },

        /**
         * 定义模块，支持传入function或object
         * @name define
         * @grammar define(name, [factory]) ⇒ undefined
         * @desc 参数
         * ***name*** {String} name 模块名
         * ***factory*** {Object}  模块构造器
         * @example $.ui.define('moduleA', {
         *     name: 'A',
         *     getName: function(){
         *         reurn this.name;
         *     }
         * });
         *
         * $.ui.define('moduleB', function(){
         *     var name = 'B';
         *     return {
         *         getName: function(){
         *             return name;
         *         }
         *     }
         * });
         */
        define: function(name, factory) {
            try {
                if(!factory){ // anonymous module
                    factory = name;
                    name = '_privateModule'
                }

                var ns = $.ui[name] || ($.ui[name] = {}),
                    exports = _checkDeps(factory);

                memoizedMods[name] = $.extend(ns, exports);
            } catch (e) {
                throw new Error(e);
            }
        }

    };

     /**
      * 加载配置项
      * @private
      */
     function _attach(target, source, mode) {
         switch (mode) {
         case 'attach':
             $.extend(target, source);
             break;

         case 'delegate':
             $.each(source, function(key, fn) {
                 if (target[key] === undefined) {
                     target[key] = function() {
                         var args = $.slice(arguments);
                         args.unshift(this.widget());
                         fn.apply(this, args);
                     };
                 }

             });
             break;
         }
     }

    /**
     * 获取模块api
     * @private
     */
    function require(module) {
        var exports = $.ui[module] || {},
            args = $.slice(arguments, 1),
            i = 0, temp;

        while( temp = exports[args[i]]){
            exports = temp;
            i++;
        }
        return args[i] ? temp : exports;
    }

    /**
     * 检查模块依赖
     * @private
     */
    function _checkDeps(factory) {
        var rdeps = /require\(\s*['"]?([^'")]*)/g,
            ret = [],
            code, match, module;

        if ($.isPlainObject(factory)) return factory;

        else if ($.isFunction(factory)) {
            code = factory.toString();

            while (match = rdeps.exec(code)) {
                if (module = match[1]) {
                    !$.ui[module] && ret.push('$.ui.' + module);
                }
            }

            if (ret.length) throw ('undefined modules: ' + ret.join(', '));
            return factory(require);
            
        } else throw ('type error: factory should be function or object');
    }

})(Zepto);
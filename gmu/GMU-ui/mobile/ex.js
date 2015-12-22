///import ui.mobile.mobile;
/**
 * @file
 * @name Extend
 * @desc 基于zepto的扩展, 添加了些常用的公共方法
 */

(function($, undefined) {
    $.ui.define('ex', function() {
        var class2type = {},
            toString = Object.prototype.toString,
            timer;

        $.each("Boolean Number String Function Array Date RegExp Object".split(" "), function(i, name) {
            class2type["[object " + name + "]"] = name.toLowerCase();
        });

        /**
         * @name $.implement
         * @grammar $.implement(obj, [sm, [force]])  ⇒ Zepto
         * @desc 扩展方法，若***sm***为***true***，则***obj***扩展到***$***中，若***sm***不设或设为***false***，则默认扩展到***$.fn***中，
         * 若第二个参数传入的是对象，obj中的属性或方法将被扩展到此对象中
         * @example $.extend({    //foo和abc，将被扩展到$.fn中，即Zepto的原型中
         *     foo: 'bar',
         *     abc: function(){
         *         //...
         *     }
         * });
         *
         * $.extend({      //foo和abc扩展到$中，即Zepto中
         *     foo: 'bar',
         *     abc: function(){
         *         //...
         *     }
         * }, true);
         *
         * $.extend({       //foo和abc被扩展到$.os中
         *     foo: 'bar',
         *     abc: function(){
         *         //...
         *     }
         * }, $.os);
         */
        $.implement = function(obj, sm, force) {
            //可以扩展到sm制定的命名空间上
            var proto = $.isObject(sm) ? sm : sm ?  $ : $.fn;
            $.each(obj, function(name, method) {
                var previous = proto[name];
                if (previous == undefined || !previous.$ex || force) {
                    method.$ex = true;
                    proto[name] = method;
                }
            });
            return $;
        };

        //扩展ua,qq,chrome浏览器的识别
        var ua = navigator.userAgent,
            na = navigator.appVersion,
            br = $.browser;

        /**
         * @name $.os
         * @since 1.0.4+
         * @desc  扩展zepto中对android系统的检测
         *
         * **可用属性**
         * - ***android*** 扩展zepto中$.os.andriod，修复htc不能检测bug
         */
        $.implement({
            android :$.os.android||/HTC/.test(ua)
        }, $.os,true);

        /**
         * @name $.browser
         * @since 1.0.4+
         * @desc 扩展zepto中对browser的检测
         *
         * **可用属性**
         * - ***qq*** 检测qq浏览器
         * - ***chrome*** 检测chrome浏览器
         * - ***uc*** 检测uc浏览器
         * - ***version*** 检测浏览器版本
         *
         * @example
         * if ($.browser.qq) {      //在qq浏览器上打出此log
         *     console.log('this is qq browser');
         * }
         */
        $.implement({
            qq : /qq/i.test(ua),
            chrome : /chrome/i.test(ua) || /CriOS/i.test(ua),
            uc : /UC/i.test(ua) || /UC/i.test(na)
        }, $.browser,true);
        $.browser.uc = $.browser.uc || !$.browser.qq && !$.browser.chrome && !/safari/i.test(ua);

        try {
            $.browser.version = br.uc ? na.match(/UC(?:Browser)?\/([\d.]+)/)[1] :
                br.qq ? ua.match(/MQQBrowser\/([\d.]+)/)[1] :
                    br.chrome ? ua.match(/(?:CriOS|Chrome)\/([\d.]+)/)[1] : br.version;
        } catch (e) {
        }

        /**
         * @name $.support
         * @since 1.0.4+
         * @desc 检测设备对某些属性或方法的支持情况
         *
         * **可用属性**
         * - ***orientation*** 检测是否支持转屏事件，UC中存在orientaion，但不会转屏不会触发该事件，故UC属于不支持转屏事件
         * - ***touch*** 检测是否支持touch相关事件
         * - ***cssTransitions*** 测测是否支持css3的transition
         * - ***has3d*** 检测是否支持translate3d的硬件加速
         *
         * @example
         * if ($.support.has3d) {      //在支持3d的设备上使用
         *     console.log('you can use transtion3d');
         * }
         */
        $.support = $.support || {};
        $.extend( $.support, {
            orientation: !$.browser.uc && "orientation" in window && "onorientationchange" in window ,
            touch: "ontouchend" in document,
            cssTransitions: "WebKitTransitionEvent" in window,
            has3d: 'WebKitCSSMatrix' in window && 'm11' in new WebKitCSSMatrix()
        });

        $.implement({ // static
            _guid: 0,

            emptyFn: function() {},

            /**
             * @name $.type
             * @grammar $.type(val)  ⇒ string
             * @desc 判断变量类型.
             * @example console.log($.type(new Boolean(true));// => "boolean"
             * console.log($.type(3));// => "number"
             * console.log($.type("abdcd"));// => "string"
             * console.log($.type(function(){}));// => "function"
             * console.log($.type([]));// => "array"
             * console.log($.type(new Date()));// => "date"
             * console.log($.type(/reg/));// => "regexp"
             * console.log($.type({}));// => "obj"
             */
            type: function(o) {
                return o == null ? String(o) : class2type[toString.call(o)] || "object";
            },

            /**
             * @name $.isNull
             * @grammar $.isNull(val)  ⇒ Boolean
             * @desc 判断变量类型是否为***null***
             * @example console.log($.isNull(false));// => false
             * console.log($.isNull(0));// => false
             * console.log($.isNull(null));// => true
             */
            isNull: function(o) {
                return o === null;
            },

            /**
             * @name $.isUndefined
             * @grammar $.isUndefined(val)  ⇒ Boolean
             * @desc 判断变量类型是否为***undefined***
             * @example
             * console.log($.isUndefined(false));// => false
             * console.log($.isUndefined(0));// => false
             * console.log($.isUndefined(a));// => true
             */
            isUndefined: function(o) {
                return o === undefined;
            },

            /**
             * @desc 从集合中截取部分数据，集合可以是数组，也可以是具有数组性质的对象，比如***arguments***
             * @name $.slice
             * @grammar $.slice(collection, [index])  ⇒ array
             * @example (function(){
             *     var args = $.slice(arguments, 2);
             *     console.log(args); // => [3]
             * })(1, 2, 3);
             */
            slice: function(array, index) {
                return Array.prototype.slice.call(array, index || 0);
            },

            /**
             * @desc 绑定函数. 将参数***context***作为fn的***this***. 同时***arguments***可以作为第三个参数传入
             * @name $.bind
             * @grammar $.bind(fn, context, [args])  ⇒ function
             * @example var obj = {name: 'Zepto'},
             * handler = function(){
             *   console.log("hello from + ", this.name) // => hello from + Zepto
             * };
             *
             * // 确保handler在obj的上下文中执行
             * $(document).on('click', $.bind(handler, obj));
             */
            bind: function(fn, context, args) {
                return function() {
                    fn.apply(context, (args || []).concat($.slice(arguments)));
                }
            },

            /**
             * @desc 生成递增id
             * @name $.guid
             * @grammar $.guid()  ⇒ number
             */
            guid: function() {
                return this._guid++;
            },

            /**
             * @name $.later
             * @grammar $.later(fn, [when, [periodic, [context, [data]]]])  ⇒ timer
             * @desc 延迟执行传入的方法
             * **参数:**
             * - ***fn*** {Function}: 将要延时执行的方法
             * - ***when*** {Number} *可选(默认 0)*: 什么时间后执行
             * - ***periodic*** {Boolean} *可选(默认 false)*: 设定是否是周期性的执行，相当于setInterval
             * - ***context*** {Object} *可选(默认 undefined)*: 给方法指定上下文
             * - ***data*** {Array} *可选(默认 undefined)*: 给方法指定传入参数
             * @example $.later(function(str){
             *     console.log(this.name + ' ' + str); // => Example hello
             * }, 250, false, {name:'Example'}, ['hello']);
             */
            later: function(fn, when, periodic, context, data) {
                var when = when || 0,
                    f = function() {
                        fn.apply(context, data);
                    };

                return periodic ? setInterval(f, when) : setTimeout(f, when);
            },

            /**
             * @desc 用系统弹出框弹出信息, 如果将one设置成true, 多次调用只有第一次才会执行
             * @deprecated
             * @name $.alert
             * @grammar $.alert(str, [one])  ⇒ undefined
             * @example
             * setInterval(      //只输出一次hello
             *     function (){
             *         $.alert('hello', 200);
             *     }, 100)
             */
            alert: function() {
                var isAlert = false;
                return function(str, once) {
                    if (!isAlert) {
                        window.alert(str);
                        once && (isAlert = true);
                    }
                };
            }(),

            /**
             * @desc 解析模版，在模板中可以使用变量，格式为***<%=varname%>***。字符串中的变量，将会替换成data中传入的对象中对应key值的变量值。
             * @grammar $.parseTpl(str, data)  ⇒ string
             * @name $.parseTpl
             * @example var str = "<p><%=name%></p>",
             * obj = {name: 'ajean'};
             * console.log($.parseTpl(str, data)); // => <p>ajean</p>
             */
            parseTpl: function(str, data) {
                var tmpl = 'var __p=[],print=function(){__p.push.apply(__p,arguments);};' + 'with(obj||{}){__p.push(\'' + str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/<%=([\s\S]+?)%>/g, function(match, code) {
                    return "'," + code.replace(/\\'/g, "'") + ",'";
                }).replace(/<%([\s\S]+?)%>/g, function(match, code) {
                    return "');" + code.replace(/\\'/g, "'").replace(/[\r\n\t]/g, ' ') + "__p.push('";
                }).replace(/\r/g, '\\r').replace(/\n/g, '\\n').replace(/\t/g, '\\t') + "');}return __p.join('');";
                var func = new Function('obj', tmpl);
                return data ? func(data) : func;
            },

            /**
             * @desc 加载script或者css资源，其中script资源，支持加载完成方法回调。
             * @name $.loadFile
             * @grammar $.loadFile(url, [callback, [timeout]])  ⇒ undefined
             * @example $.loadFile('common.js', function(){//加载js文件
             *     console.log('complete');
             * });
             *
             * $.loadFile('style.css');//加载样式表
             */
            loadFile: function(url, cb, timeout) {
                var isCSS = /\.css(?:\?|$)/i.test(url),
                    head = document.head || document.getElementsByTagName('head')[0],
                    node = document.createElement(isCSS ? 'link' : 'script'),
                    cb = cb || $.emptyFn,
                    timer, onload;

                if (isCSS) {
                    node.rel = 'stylesheet';
                    node.href = url;
                    head.appendChild(node);
                } else {
                    onload = function() {
                        cb();
                        clearTimeout(timer);
                    };

                    timer = setTimeout(function() {
                        onload();
                        throw new Error('failed to load js file:' + url);
                    }, timeout || 50);

                    node.addEventListener('load', onload, false);
                    node.async = true;
                    node.src = url;
                    head.insertBefore(node, head.firstChild);
                }
            },

            /**
             * @desc 减少执行频率, 多次调用，在指定的时间内，只会执行一次。***delay*** 指定时间段，单位为毫秒，***fn*** 被稀释的方法
             *
             * <pre>||||||||||||||||||||||||| (空闲) |||||||||||||||||||||||||
             * X    X    X    X    X    X      X    X    X    X    X    X</pre>
             *
             * @grammar $.throttle(delay, fn) ⇒ function
             * @name $.throttle
             * @since v1.0.4+
             * @example var touchmoveHander = function(){
             *     //....
             * }
             * //绑定事件
             * $(document).bind('touchmove', $.throttle(250, touchmoveHander));//频繁滚动，每250ms，执行一次touchmoveHandler
             *
             * //解绑事件
             * $(document).unbind('touchmove', touchmoveHander);//注意这里面unbind还是touchmoveHander,而不是$.throttle返回的function, 当然unbind那个也是一样的效果
             *
             */
            throttle: function(delay, fn, debounce_mode) {
                var last = 0,
                    timeId;

                if (typeof fn !== 'function') {
                    debounce_mode = fn;
                    fn = delay;
                    delay = 250;
                }

                function wrapper() {
                    var that = this,
                        period = Date.now() - last,
                        args = arguments;

                    function exec() {
                        last = Date.now();
                        fn.apply(that, args);
                    };

                    function clear() {
                        timeId = undefined;
                    };

                    if (debounce_mode && !timeId) {
                        // debounce模式 && 第一次调用
                        exec();
                    }

                    timeId && clearTimeout(timeId);
                    if (debounce_mode === undefined && period > delay) {
                        // throttle, 执行到了delay时间
                        exec();
                    } else {
                        // debounce, 如果是start就clearTimeout
                        timeId = setTimeout(debounce_mode ? clear : exec, debounce_mode === undefined ? delay - period : delay);
                    }
                };
                // for event bind | unbind
                wrapper._zid = fn._zid = fn._zid || $.proxy(fn)._zid;
                return wrapper;
            },

            /**
             * @desc 减少执行频率, 在指定的时间内, 多次调用，只会执行一次。
             *
             * options
             * - ***delay*** 指定时间段，单位为毫秒。
             * - ***fn*** 被稀释的方法
             * - ***at_begin*** 指定是在开始处执行，还是结束是执行
             *
             * 非at_begin模式
             * <pre>||||||||||||||||||||||||| (空闲) |||||||||||||||||||||||||
             *                         X                                X</pre>
             * at_begin模式
             * <pre>||||||||||||||||||||||||| (空闲) |||||||||||||||||||||||||
             * X                                X                        </pre>
             *
             * @grammar $.debounce(delay, fn[, at_begin]) ⇒ function
             * @name $.debounce
             * @since v1.0.4+
             * @example var touchmoveHander = function(){
             *     //....
             * }
             * //绑定事件
             * $(document).bind('touchmove', $.debounce(250, touchmoveHander));//频繁滚动，只要间隔时间不大于250ms, 在一系列移动后，只会执行一次
             *
             * //解绑事件
             * $(document).unbind('touchmove', touchmoveHander);//注意这里面unbind还是touchmoveHander,而不是$.debounce返回的function, 当然unbind那个也是一样的效果
             */
            debounce: function(delay, fn, t) {
                return fn === undefined ? $.throttle(250, delay, false) : $.throttle(delay, fn, t !== false);
            }

        }, true);

        var $onFn = $.fn.on,
            $offFn = $.fn.off,
            $triggerFn = $.fn.trigger,
            transEvent = {
                touchstart: 'mousedown',
                touchend: 'mouseup',
                touchmove: 'mousemove',
                tap: 'click'
            },
            transFn = function(e) {
                var events = [];
                (e || '').split(' ').forEach(function(type) {
                    events.push(!('ontouchstart' in window) ? (transEvent[type] ? transEvent[type] : type) : type);
                });
                return events.join(' ');
            };

        $.implement({
            /**
             * @desc 注册事件, 调用方式同Zepto的on，同时兼容PC的事件，如绑定touchstart在pc上对应mousedown.
             * @name on
             * @grammar on(type, [selector], function(e){ ... })  ⇒ self
             * @grammar on({ type: handler, type2: handler2, ... }, [selector])  ⇒ self
             * @example var div = $('div');
             * div.on('touchstart', function(e){
             *     //event handler
             * });
             */
            on: function(event, selector, callback) {
                return $onFn.call(this, transFn(event), selector, callback);
            },

            /**
             * @desc 注销事件, 参考{@link on}
             * @grammar off(type, [selector], function(e){ ... })  ⇒ self
             * @grammar off({ type: handler, type2: handler2, ... }, [selector])  ⇒ self
             * @grammar off(type, [selector])  ⇒ self
             * @grammar off()  ⇒ self
             * @name off
             */
            off: function(event, selector, callback) {
                return $offFn.call(this, transFn(event), selector, callback);
            },

            /**
             * @desc 获取元素相对与body的offset值, 返回包含top, left, right, bottom, width, height等信息的对象。
             * 第二个参数用来指定是否忽略滚动距离，跟getBoundingClientRect相似，但此方法考虑到低端设备不支持getBoundingClientRect的情况
             * @example
             * var obj = $('<div = "position:absolute; width:200px; height:100px; top:300px; left:400px;"></div>')
             * .appendTo(document.body).offset();
             * console.log(obj); // => {top:300, left:400, right: 600, bottom: 400, width: 200, height: 100}
             * @grammar offset([ignore]) ⇒ object
             * @name offset
             * @param {Boolean} ignore 是否忽视window滚动距离
             * @todo ios下safari top值有1-2px的偏差
             */
            offset: function(ignoreScroll) {
                if (this.length == 0) return null;
                var obj = "getBoundingClientRect" in this[0] ? this[0].getBoundingClientRect() : (function(elem) {
                    var top = elem.offsetTop,
                        left = elem.offsetLeft,
                        width = elem.offsetWidth,
                        height = elem.offsetHeight;

                    while (elem.offsetParent) {
                        elem = elem.offsetParent;
                        top += elem.offsetTop;
                        left += elem.offsetLeft;
                    }
                    top -= window.pageYOffset;
                    left -= window.pageXOffset;

                    return {
                        top: top,
                        left: left,
                        right: left + width,
                        bottom: top + height,
                        width: width,
                        height: height
                    }
                })(this[0]);

                return {
                    left: obj.left + (ignoreScroll ? 0 : window.pageXOffset),
                    top: obj.top + (ignoreScroll ? 0 : window.pageYOffset),
                    width: obj.width,
                    height: obj.height,
                    right: obj.right + (ignoreScroll ? 0 : window.pageXOffset),
                    bottom: obj.bottom + (ignoreScroll ? 0 : window.pageYOffset)
                }
            },

            //主要是为了把originalEvent给带到event对象里面去
            trigger: function(event) {
                var _args = $.slice(arguments);
                //caller有可能不存在
                if ($.fn.trigger.caller) {
                    var callerArgs = $.fn.trigger.caller.arguments,
                        evtObj;

                    if ($.type(event) == 'string') _args[0] = $.Event(event);
                    if (callerArgs && (evtObj = callerArgs[0]) && /Event\]$/i.test(toString.call(evtObj)) && $.inArray(_args[0].type, ['tap', 'singleTap', 'doubleTap', 'swipe', 'swipeLeft', 'swipeRight', 'swipeUp', 'swipeDown ']) > -1) {
                        //是Event对象才放入
                        _args[0].originalEvent = evtObj;
                    }
                }
                return $triggerFn.apply(this, _args);
            }

        }, false, true);

        /** detect orientation change */
        $(document).ready(function () {
            var getOrt = function() {
                    var elem = document.documentElement;
                    return elem.clientWidth / elem.clientHeight < 1.1 ? "portrait" : "landscape";
                },
                lastOrt = getOrt(),
                handler = function() {
                    clearInterval(timeId);
                    timeId = $.later(function() {
                        var curOrt = getOrt();
                        if (lastOrt !== curOrt) {
                            lastOrt = curOrt;
                            clearInterval(timeId);
                            $(window).trigger('ortchange')
                        }
                    }, 50, true);
                },
                timeId;
            if (!$.support.orientation) $(window).bind('resize', $.debounce(handler));
            else $(window).bind('orientationchange', $.debounce(handler));
        });
    });
})(Zepto);


//自定义highlight效果
(function($) {
    $.implement({
        /**
         * @name highlight
         * @desc 禁用掉系统的高亮，当手指移动到元素上时添加指定class，手指移开时，删除该class
         * @grammar  highlight(className)   ⇒ self
         * @example var div = $('div');     //添加高亮效果
         * div.highlight('div-hover');
         */
        highlight: function(cl) {
            return this.each(function() {
                var $el = $(this),
                    timer;
                $el.css('-webkit-tap-highlight-color', 'rgba(255,255,255,0)')
                    .on('touchstart touchend touchmove', function(e) {
                        if ($el[0].contains(e.target)) {
                            switch (e.type) {
                                case 'mousedown':
                                case 'touchstart':
                                    timer = $.later(function() {
                                        $el.addClass(cl);
                                    }, 100);
                                    break;
                                case 'touchend':
                                case 'mouseup':
                                case 'touchmove':
                                case 'mousemove':
                                    clearTimeout(timer);
                                    $el.removeClass(cl);
                            }
                        }
                    })
            })
        },
        /**
         * @name behavior
         * @desc 禁用掉系统的高亮，当手指移动到元素上时添加指定class，手指移开时，删除该class
         * @deprecated 不推荐使用, 代替方法{@link[mobile/ex.js#highlight] highlight}.
         * @grammar  behavior(className)   ⇒ self
         * @example var div = $('div');
         * div.behavior('div-hover');
         */
        behavior: function() {
            return this.highlight.apply(this, arguments);
        }
    }, false, true);

    /**
     * @name Trigger Events
     * @theme event
     * @desc 扩展的事件
     * - ***scrollStop*** : scroll停下来时触发
     * @example $(document).on('scrollStop', function () {        //scroll停下来时显示scrollStop
     *     console.log('scrollStop');
     * });
     */

    /** dispatch scrollStop */
    $(window).on('scroll', $.debounce(0, function() {
        $(document).trigger('scrollStop');
    }, false));
})(Zepto);
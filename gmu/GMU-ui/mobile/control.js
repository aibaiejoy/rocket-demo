///import ui.mobile.mobile;
///import ui.mobile.ex;

/**
 * @file 公共行为方法
 * @name Control
 */

(function($, undefined) {
    $.ui.define('control', function(require) {
        var os = $.os,
            version = parseFloat(os.version),
            isDesktop = !version,
            isIos = os.ios,
            isAndroid = os.android,
            htcBug = /htc_sensation_z710e/i.test(navigator.userAgent),
            adapter = {};

        /**
         * @desc 固顶fix方法，在ios5及以上设备采用css支持的position:fixed属性，其他支持fix方法不好或不支持的设备上
         * 将元素position设为absolute，在每次scrollstop时根据opts参数设置当前显示的位置，类似fix效果。单个元素可
         * 调用，也可直接在组件实例上调用
         * @grammar $.ui.control.fix(el, options)  ⇒ undefined
         * @grammar instance.fix(options)  ⇒ undefined
         * @name fix
         * @param {String || HTMLElement}      elem      选择器或elements
         * @param {Object}                     options   设置属性
         * @example var div = $('div');
         * $.ui.control.fix(div, {top:0, left:0}); //将div固顶在左上角
         * $.ui.control.fix(div, {top:0, right:0}); //将div固顶在右上角
         * $.ui.control.fix(div, {bottom:0, left:0}); //将div固顶在左下角
         * $.ui.control.fix(div, {bottom:0, right:0}); //将div固顶在右下角
         *
         * var gotop = $.ui.gotop(el, opts);
         * gotop.fix({bottom: 10, right: 10});     //将返回顶部按钮固定在右下角
         */
        adapter.fix = function(elem, options) {
            var $elem = $(elem),
                elem = $elem.get(0),
                UA = navigator.userAgent,
                isUC = /Linux/i.test(UA) || ($.os.ios && (!/safari/i.test(UA) && !/qq/i.test(UA))),
                opts = $.extend({zIndex: 999}, options || {}),
                offset = options.bottom ? options.bottom*-1 : (options.top||0);

            if ((isDesktop || isIos && version >= 5) && !htcBug && !isUC) {
                $elem.css('position', 'fixed').css(opts);

                if (!elem.isFixed && $.browser.qq) {
                     $(document).on('scrollStop', function() { // modified by zmm, 在QQ上当pageOffsetY大于45时，top值会自动增加45，trace:FEBASE-368
                        $elem.css('top', Math.max(-45, -window.pageYOffset) + 'px');
                    });
                }

                elem.isFixed = true;
                return;
            }

            opts['position'] = 'absolute';
            $elem.css(opts);
            if (!elem.isFixed) {
                elem.isFixed = true;
                $(document).on('scrollStop', function(e) {
                    $elem.css('top',window.pageYOffset + (options.bottom ? window.innerHeight  - $elem.height() : 0) + offset + 'px')
                });
            }
        };

        adapter.setFloat = function(elem) {
            var $elem = $(elem),
                $copy = $elem.clone().css({
                    opacity: 0,
                    display: 'none'
                }).attr('id', ''),
                isFloat = false,
                touch = {},
                defaultPosition = $elem.css('position') || 'static',
                appear = function() {
                    adapter.fix($elem, {
                        x: 0,
                        y: 0
                    });
                    $copy.css('display', 'block');
                    isFloat = true;
                },
                disappear = function() {
                    $elem.css('position', defaultPosition);
                    $copy.css('display', 'none');
                    isFloat = false;
                },
                check = function(pos) {
                    var top = $copy.get(0).getBoundingClientRect().top || $elem.get(0).getBoundingClientRect().top,
                        pos = pos || 0 + top;

                    if(pos < 0 && !isFloat){
                        appear();
                    }else if(pos > 0 && isFloat){
                        disappear();
                    }
                };

            $elem.after($copy);

            $(document).on('touchstart', function(e){
                touch.y = e.touches[0].pageY;
            }).on('touchmove', function(e){
                var pos = e.touches[0].pageY - touch.y;
                touch.y = e.touches[0].pageY;
                check(pos);
            });

            $(window).on('scroll', function() {
                check();
            });
        };
        
        return adapter;
    });

})(Zepto);
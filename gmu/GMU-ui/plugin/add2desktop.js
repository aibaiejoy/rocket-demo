
/**
 * @file
 * @name Add2desktop
 * @desc 在IOS中将页面添加为桌面图标(不支持Android系统)
 * @import mobile/mobile.js, mobile/ex.js, mobile/widget.js, mobile/control.js
 */

(function($, undefined) {
    /**
     * @name     $.ui.add2desktop
     * @grammar  $.ui.add2desktop([el [,options]]) =>instance
     * @desc 组件构造器
     * **el**
     * 根元素选择器或者对象
     * **Options**
     * - ***options.icon {String}*** (必选) 产品线ICON'S URL
     * - ***options.container {selector}*** (可选) 渲染到哪个元素
     * @example
     * var demo = $.ui.add2desktop({
     *     icon: '..//image/icon.png'
     * })
     */
    $.ui.create('add2desktop', {
        _data: {
            icon: '../../add2desktop/icon.png'
        },

        _create: function() {
            var me = this,
                $elem = (me.widget() || me.widget($('<div></div>'))).addClass('ui-add2desktop').css('display', 'none'),
                container = $(me.data('container') || document.body),
                addicon = ($.os.ios && ($.os.version).substr(0, 3)) > 4.1 ? 'ui-add2desktop-new' : 'ui-add2desktop-old',
                tpl = '<div class="ui-add2desktop-shadowbox"></div><div class="ui-add2desktop-content"><div class="ui-add2desktop-type"><img src="' + me.data('icon') + '"/></div><div class="ui-add2desktop-text">先点击<span class="' + addicon + '"></span>，<br>再"添加至主屏幕"</div><a href="javascript:;" class="ui-add2desktop-close"><span class="ui-add2desktop-close-btn"></span></a>';

            if (!$elem.html(tpl).parent().length) $elem.appendTo(container);
            me.trigger('create');
        },

        _init: function() {
            var me = this,
                os = $.os,
                version = parseFloat(os.version),
                isDesktop = !version,
                isIos = os.ios,
                isAndorid = os.android,
                ua = navigator.userAgent,
                isUC = me.data('isUC', /Linux/i.test(ua) || ($.os.ios && (!/safari/i.test(ua) && !/qq/i.test(ua)))),
                _rotateEV = me.data('rotateEV', 'ortchange');

            $('.ui-add2desktop-close').on('tap', function(e) {
                me.hide();
                (e.originalEvent || e).preventDefault();
            });

            me.data('_winfun', function(e) {
                me._setpos();
            });

            $(window).on(_rotateEV + ' scrollStop', me.data('_winfun'));

            me.widget().css('position', me.data('useFixed', isDesktop || isIos && version >= 5 && !isUC || isAndorid) ? 'fixed' : 'absolute');
            $(function() {
                $.later(function() {
                    me.data('available', true);
                    me._setpos().trigger('init');
                }, 200)
            });
        },

        _setpos: function() {
            var me = this,
                $elem = me.widget();

            !me.data('useFixed') && $elem.css('top', window.pageYOffset + $(window).height() - 85);
            return me.trigger('setpos');
        },
        /**
         * @name hide
         * @grammar hide() => self
         * @desc 隐藏add2desktop
         */
        hide: function() {
            var me = this;
            $.later(function(){
                me.widget().css({display: 'none', zIndex: -1, left: -9999});
                me.trigger('close');
            }, 20);
            return me;
        },
        /**
         * @name show
         * @grammar show() => self
         * @desc 显示add2desktop
         */
        show: function() {
            var me = this;

            if ( $.os.ios) {
                if(!me.data('available')){
                    $.later( $.bind(me.show, me), 20);
                    return me;
                }

                me.widget().css({display: 'block', opacity: 0}).animate({
                    opacity: 1
                }, {
                    duration: 100,
                    ease: 'ease-in',
                    complete: function() {
                        me.trigger('open');
                    }
                });
            }
            return me;
        },
        /**
         * @name destroy
         * @grammar destroy()   => undefined
         * @desc 销毁add2desktop
         */
        destroy: function() {
            var me = this;
            $(window).off(me.data('rotateEV')+ ' scrollStop', me.data('_winfun'));
            $('.ui-add2desktop-close', me.widget()).off().remove();
            me.widget().html('');
            me._super();
        }

        /**
         * @name Trigger Events
         * @theme event
         * @desc 组件内部触发的事件
         * - ***create*** : 组件创建时触发
         * - ***init*** : 组件初始化时触发
         * - ***setpos*** : 设置位置时触发的事件
         * - ***close*** : 关闭时触发的事件
         * - ***open*** : 显示时触发的事件
         */

    }).attach('control.fix');

})(Zepto);

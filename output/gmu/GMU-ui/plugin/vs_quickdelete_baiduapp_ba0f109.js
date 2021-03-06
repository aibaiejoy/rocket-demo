///import ui.mobile.mobile;
///import ui.mobile.ex;
///import ui.mobile.widget;
///import ui.mobile.control;

/**
 * @file
 * @name Quickdelete
 * @desc 快速删除组件
 * @import mobile/mobile.js, mobile/ex.js, mobile/widget.js, mobile/control.js
 */
(function($) {
    /**
     * @desc   快速删除组件
     *
     * **Options**
     * - ***container {Selector}*** (必选)父元素
     * - ***ondelete {Function}*** (可选)点击close按钮时触发
     * - ***box {Number}*** (可选)close按钮的大小: 20
     * - ***offset {Object}*** (可选)close按钮偏移量{x:0, y:0}
     * 
     * @name     $.ui.quickdelete
     * @grammar  $.ui.quickdelete([options])
     * @param    {Object}         options                   参数
     * @param    {Selector}       options.container         (必选)父容器
     * @param    {Function}       options.ondelete          (可选)点击close按钮时触发
     * @param    {Number}         options.box              (可选)close按钮的大小: 20
     * @param    {Object}         options.offset            (可选)close按钮偏移量{x:0, y:0}
     */
    $.ui.create('quickdelete', {
        _data: {
            box: 20,
            offset: {x: 0, y: 0}
        },

        _create: function() {
            var me = this,
                $input = me.data('input', $(me.data('container'))),
                expando = +new Date(),
                maskID = 'ui-input-mask-' + expando,
                elemID = "ui-quickdelete-delete-" + expando,
                $maskElem = $input.parent(),
                $deleteElem = $('<div id="' + elemID + '" class="ui-quickdelete-button"></div>').css({
                    height: me.data('box'),
                    width: me.data('box')
                });

            //在android2.1下-webkit-background-size不支持contain属性，
            $.os.android && $.os.android && parseFloat($.os.version).toFixed(1) == 2.1 && $deleteElem.css('-webkit-background-size', '20px 20px');
            if ($maskElem.attr('class') != 'ui-input-mask') {
                $maskElem = $('<div id="' + maskID + '" class="ui-input-mask"></div>').appendTo($input.parent());
            }

            me.widget($maskElem.append($input).append(me.data('deleteElem', $deleteElem)).css('height', $input.height()));
            me._initButtonOffset().trigger('create');
        },

        _init: function() {
            var me = this,
                $input = me.data('input'),
                eventHandler = $.bind(me._eventHandler, me);

            $input.on('focus input blur', eventHandler);
            me.data('deleteElem').on('touchstart', eventHandler);
            me.on('destroy', function(){
                $input.off('focus input blur', eventHandler);
                me.data('deleteElem').off('touchstart', eventHandler);
                eventHandler = $.fn.emptyFn;
            });
            me.trigger('init');
        },

        _show: function() {
            this.data('deleteElem').css('visibility', 'visible');
            return this;
        },

        _hide: function() {
            this.data('deleteElem').css('visibility', 'hidden');
            return this;
        },

        _eventHandler: function(e){
            var me = this,
                type = e.type,
                target = e.target,
                $input = me.data('input');

            switch (type) {
                case 'focus':
                case 'input':
                    $.trim($input.val()) ? me._show() : me._hide();
                    break;
                case 'mousedown':
                case 'touchstart':
                    if (target == me.data('deleteElem').get(0)) {
                        e.preventDefault();
                        e.formDelete = true; // suggestion解决删除问题
                        $input.val('');
                        me._hide().trigger('delete'); 
                        $input.get(0).focus();                                                                   
                    }
                    break;
                case 'blur':
                    me._hide();
                    break;
            }

        },

        _initButtonOffset: function() {
            var me = this,
                $input = me.data('input'),
                size = me.data('box'),
                targetOffset = me.widget().offset(),
                customOffset = me.data('offset'),
                offsetX = customOffset.x || 0,
                offsetY = customOffset.y || 0,
                paddingOffsetY = Math.round((targetOffset.height - 2*offsetY - size) / 2);   //padding值根据外层容器的宽度-Y的偏移量-小叉的大小

            me.data('deleteElem').css({
                /** @by vs
                padding: paddingOffsetY < 0 ? 0 : paddingOffsetY,          //modified by zmm, 使quickdelete图标可点区域更大
                top: offsetY,
                right: offsetX
                */
                /*
                top: 14,
                right: 85
                */
                top: offsetY,
                right: offsetX
            });

            // 处理输入长字符串，input挡住删除按钮问题
            $input.css({
                position: 'absolute',
                /** @by vs
                top: 0,
                left: 0,
                width: 'auto',
                right: size + 20
                 */
                top: 0,
                left: 4,
                width: 'auto',
                right: 115
            });
            return me;
        }
    });

    $(document).on('pageInit', function() {
        // role: data-widget = quickdelete.
        $('[data-widget=quickdelete]').each(function(i, elem) {
            var $elem = $(elem),
                size = $elem.data("quickdelete-size"),
                offsetX = $elem.data('quickdelete-offsetx'),
                offsetY = $elem.data('quickdelete-offsety');

            var quickdelete = $.ui.quickdelete({
                container: elem,
                size: parseInt(size, 10) || undefined,
                offset: {
                    x: parseInt(offsetX, 10) || undefined,
                    y: parseInt(offsetY, 10) || undefined
                }
            });
        });
    });

    /**
     * @name Trigger Events
     * @theme event
     * @desc 组件内部触发的事件
     * - ***delete*** : (event)点击删除按钮触发
     */

})(Zepto);

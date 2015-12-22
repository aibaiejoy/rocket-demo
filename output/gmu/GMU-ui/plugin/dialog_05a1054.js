///import ui.mobile.mobile;
///import ui.mobile.ex;
///import ui.mobile.widget;
///import ui.mobile.control;

/**
 * @file
 * @name Dialog
 * @desc 对话框组件
 * @import mobile/mobile.js, mobile/ex.js, mobile/widget.js, mobile/control.js
 */
(function($, undefined) {
    /**
     * @desc     dialog组件
     * 
     * **Options**
     * - ***content {selector}*** (必选)内容
     * - ***container {String}*** (可选)父元素
     * - ***width {String}*** (可选)宽度
     * - ***height {String}*** (可选)高度
     * - ***cls {String}*** (可选)样式
     * - ***title {selector}*** (可选)标题
     * - ***mask {Boolean}*** (可选)是否启用遮罩：true
     * - ***closeBtn {Function}*** (可选)是否显示关闭按钮：true
     * - ***onclose {Function}***(可选)组件关闭时触发
     * 
     * @name     $.ui.dialog
     * @grammar  $.ui.dialog(options) => instance
     * @param    {Object}     options                参数
     * @param    {String}     options.content        (必选)内容
     * @param    {Selector}   options.container      (可选)父元素
     * @param    {Number}     options.width          (可选)宽度
     * @param    {Number}     options.height         (可选)高度
     * @param    {String}     options.cls            (可选)样式
     * @param    {String}     options.title          (可选)标题
     * @param    {Boolean}    options.mask           (可选)是否启用遮罩：true
     * @param    {Boolean}    options.closeBtn       (可选)是否显示关闭按钮：true
     * @param    {Event}      options.onclose        (可选)组件关闭时触发
     */
    $.ui.create('dialog', {
        _data: {
            width: 300,
            mask: true,
            closeBtn: true
        },

        _create: function() {
            var me = this,
                $container = $(me.data('container') || document.body),
                $elem = (me.widget() || me.widget($('<div></div>'))).css({
                    width: me.data('width'),
                    height: me.data('height')
                }).addClass('ui-dialog');

            me.data('cls') && $elem.addClass(me.data('cls'));
            me.data('title') && me.data('titleElem', $('<div class="ui-dialog-title"><div class="titleText">' + me.data('title') + '</div></div>')).appendTo($elem);
            me.data('contentElem', $('<div class="ui-dialog-content"><div class="contentHtml">' + me.data('content') + '</div></div>')).appendTo($elem);
            me.data('closeBtn') && (me.data('titleElem') || me.data('contentElem')).append('<div class="ui-dialog-close">×</div>');
            me.data('maskElem', $('<div class="ui-mask"></div>')).appendTo($container);
            $elem.appendTo($container);
            me.trigger('create');
        },

        _init: function() {
            var me = this,
                $elem = me.widget(),
                _eventHandler = $.bind(me._eventHandler, me);

            $elem.on('touchmove click', _eventHandler);
            $(window).on('ortchange', _eventHandler);
            me.data('maskElem').on('touchmove tap', _eventHandler);

            me.on('destroy', function() {
                me.data('maskElem').off();
                $(window).off('ortchange', _eventHandler);
            }).trigger('init');
        },

        /**
         * 事件管理函数
         * @private
         */
        _eventHandler: function(e) {
            var me = this,
                elem = e.target;

            if (!me.data('status')) return;
            switch (e.type) {
                case 'touchmove':
                    e.preventDefault();
                    break;
                case 'tap':
                case 'click':
                    if (elem.className == 'ui-dialog-close' || elem.nodeValue == '×') me.hide();
                    else if (elem.className == 'ui-mask') me.trigger('maskClick');
                    break;
                case 'ortchange':
                    me._resize(e);
                    break;

            }
        },

        /**
         * 调整mask尺寸
         * @private
         */
        _resize: function(e) {
            var me = this,
                $mask = me.data('maskElem'),
                root = document.body,
                ucOffset = $.browser.uc ? 1 : 0; // add by zmm, 在UC下，mask盖住window不会触发resize事件，故减掉1px

            if ($mask.css('display') == 'block') {
                $mask.css({
                    width:  root.clientWidth,
                    height: Math.max(root.scrollHeight, root.clientHeight) - ucOffset
                });
            }
            me.trigger('resize');
        },

        /**
         * @desc 设置 || 获取title
         * @name title
         * @grammar title(value)  ⇒ string
         * @param {String} value 标题
         * @return {String} html
         */
        title: function(value) {
            var $title = this.data('titleElem').find('.titleText');

            if (value != undefined) {
                $title.html(value);
                this.trigger('resize');
            }

            return $title.html();
        },

        /**
         * @desc 设置 || 获取content
         * @name content
         * @grammar content(value)  ⇒ string
         * @param {String} value 内容
         * @return {String} html
         */
        content: function(value) {
            var $content = this.data('contentElem').find('.contentHtml');

            if (value != undefined) {
                $content.html(value);
                this.trigger('resize');
            }
            
            return $content.html();
        },

        /**
         * dialog居中
         * @private
         */
        _center: function() {
            var me = this,
                $elem = me.widget(),
                $win = $(window);

            $elem.css({
                left: $win.width() / 2,
                top: $win.height() / 2 + window.pageYOffset,
                marginTop: -$elem.height() / 2,
                marginLeft: -$elem.width() / 2
            });

            me.on('resize', function() {
                $.later(function() {
                    $elem.css({
                        left: $win.width() / 2,
                        top: $win.height() / 2 + window.pageYOffset
                    });
                }, 10);
            });

            return me;
        },

        /**
         * @desc 显示dialog
         * @name show
         * @grammar show(0, 0) => self
         * @param {String} x 横坐标
         * @param {String} y 纵坐标
         * @return {Object} this
         */
        show: function(x, y) {
            var me = this,
                $elem = me.widget(),
                root = document.body,
                pos = {left: x || 0, top: y || 0};

            $elem.css('display', 'block');
            if (me.data('mask')) {
                me.data('maskElem').css({
                    display: 'block',
                    width: root.clientWidth,
                    height: Math.max(root.scrollHeight, root.clientHeight)
                });
            }

            x == undefined ? me._center() : $elem.css(pos);
            return me;
        },

        /**
         * @desc 隐藏dialog
         * @name hide
         * @grammar hide() => self
         * @param {Boolean} destroy 是否销毁
         * @return {Object} this
         */
        hide: function(destroy) {// trace 157 by rxq, 取消hide函数的延时
            var me = this;
            me.widget().css('display', 'none');
            me.data('maskElem').css('display', 'none');
            me.trigger('close');
            destroy && me.destroy();
            return me;
        },

        /**
         * @desc 关闭dialog
         * @name close
         * @grammar close() => self
         * @return {Object} this
         */
        close: function() {
            this.hide(true);
        },

        /**
         * @desc 销毁组件
         * @name destory
         * @grammar destroy() => undefined
         */
        destroy: function() {
            var me = this;
            me.data('maskElem').remove();
            me._super();
        }

        /**
         * @name Trigger Events
         * @theme event
         * @desc 组件内部触发的事件
         * - ***close*** : (event)点击关闭按钮触发
         * - ***maskClick***: (event)点击遮罩层时触发
         */

    }).attach('control.fix');

})(Zepto);

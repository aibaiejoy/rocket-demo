///import ui.mobile.mobile;
///import ui.mobile.ex;
///import ui.mobile.widget;
///import ui.mobile.control;

/**
 * @fileOverview
 * @name Button
 * @desc 按钮组件
 * @import mobile/mobile.js, mobile/ex.js, mobile/widget.js, mobile/control.js
 */

(function ($, undefined) {
    /**
     * @desc 按钮组件构造器
     * **el**
     * css选择器，或者zepto对象
     * **options**
     * - ***selector {selector}*** (可选)根元素, 跟el一致
     * - ***skin {String}*** (可选)风格
     * - ***text {String}*** (可选)内容
     * - ***title {String}*** (可选)标题
     * - ***href {String}*** (可选)链接
     * - ***container {selector}*** (可选)渲染到哪个元素
     * - ***disabled {Boolean}*** (可选)禁用与否
     * - ***onclick {Function}*** (可选)组件dom点击时触发
     * - ***oncreate {Function}***(可选)组件创建节点后执行
     * - ***oninit {Function}*** (可选)组件初始化后执行
     * - ***onstatechange {Function}*** (可选)当状态可用与不可用发生变化时触发
     * @name $.ui.button
     * @grammar $.ui.navigator([el [,options]]) ⇒ instance
     * @param      {selector}       el                     (可选)根元素
     * @param      {Object}         options                参数
     * @param     {selector}       options.selector       (可选)根元素, 跟el一致
     * @param     {String}         options.skin           (可选)风格
     * @param     {String}         options.text           (可选)内容
     * @param     {String}         options.title          (可选)标题
     * @param     {String}         options.href           (可选)链接
     * @param     {selector}       options.container      (可选)渲染到哪个元素
     * @param     {Boolean}        options.disabled       (可选)禁用与否
     * @param     {Event}          options.onclick        (可选)组件dom点击时触发
     * @param     {Event}          options.oncreate       (可选)组件创建节点后执行
     * @param     {Event}          options.oninit         (可选)组件初始化后执行
     * @param     {Event}          options.onstatechange  (可选)当状态可用与不可用发生变化时触发
     * @example $.ui.button('#link1', {skin:'blue'});
     * $.ui.button({selector:'#link2', skin:'blue', disabled: true});
     *
     * $.ui.button('#link3');
     * $.ui.button({selector:'#link4', disabled: true});
     *
     * $.ui.button({selector:'#link5', skin: 'custom'});
     */
    $.ui.create('button', {
        _data:{
            selector:  '',
            skin:  '',
            container:  '',
            disabled: false
        },

        _create: function () {
            var me = this,
                $el = this.widget(),
                selector = this.data('selector'),
                text = this.data('text'),
                href = this.data('href'),
                title = this.data('title'),
                container = this.data('container');

            me.widget($el = $el || selector && $(selector) || $('<a></a>'));
            text !== undefined && $el.html(text);
            container ||  $el.parent().length || (container = 'body');
            container && $el.appendTo(container);
            href !== undefined && $el.attr('href', href);
            title !== undefined && $el.attr('title', title);
            me.trigger('create');
        },

        _init: function () {
            var me = this,
                $el = me.widget(),
                skin = me.data('skin'),
                eventHandler = $.bind(me._eventHandler, me);

            $el.addClass('ui-button' + (skin ? ' ui-button-' + skin + '' : ''))
                .on('touchstart touchend click touchcancel',eventHandler);
            $(document).on('touchstart', eventHandler);
            me._setState(!this.data('disabled'), true, true);
            me.on('destroy', function(){
                $el.off( 'touchstart touchend tap touchcancel', eventHandler);
                $(document).off('touchstart', eventHandler);
            });
            me.trigger('init');
        },

        /**
         * 事件管理器
         * @private
         */
        _eventHandler: function(e){
            var me = this,
                type = e.type,
                currentTarget = e.currentTarget || e.srcElement,
                $el = me.widget(),
                skin = me.data('skin');

            switch (type) {
                case 'touchstart':
                case 'mousedown':
                    if(currentTarget==document){
                        (e._target ? $el.not(e._target) : $el)
                            .filter('.ui-button-hover').
                            removeClass('ui-button-hover' + (skin ? ' ui-button-' + skin + '-hover' : ''));
                        return ;
                    }
                    if (me.data('disabled')) {
                        e.preventDefault();
                        return false;
                    }
                    $(currentTarget).addClass('ui-button-hover' + (skin ? ' ui-button-' + skin + '-hover' : ''));
                    e._target = currentTarget;
                    break;
                case 'touchend':
                case 'mouseup':
                case 'touchcancel':
                    $(currentTarget).removeClass('ui-button-hover' + (skin ? ' ui-button-' + skin + '-hover' : ''));
                    break;
                case 'tap':
                case 'click':
                    if (me.data('disabled')) {
                        e.preventDefault();
                        return false;
                    }
                    me.trigger('click', e);
                    break;
            }
        },

        /**
         * 设置按钮状态，传入true，设置成可用，传入false设置成不可用
         * @param enable
         * @private
         */
        _setState: function(enable, force, notrigger){
            var me = this,
                preState = !me.data('disabled'),
                $el = me.widget(),
                skin = me.data('skin');

            if(force || enable != preState){
                $el[enable?'removeClass':'addClass']('ui-button-disabled' + (skin ? ' ui-button-' + skin + '-disabled' : ''));
                this.data('disabled', !enable);
                notrigger || me.trigger('stateChange', enable);
            }
            return me;
        },

        /**
         * @desc 设置成可用状态, 当状态变化时，会触发***statechange***事件。
         * @name enable
         * @grammar enable([force])  ⇒ self
         * @param {Boolean} force 设置成可用状态
         * @return {Object} this
         * @example var btn = $.ui.button('#link1');
         * btn.enable();
         */
        enable: function (force) {
            return this._setState(true, force);
        },

        /**
         * @desc 设置成不可用状态, 当状态变化时，会触发***statechange***事件。
         * @name disable
         * @grammar disable([force])  ⇒ self
         * @param {Boolean} force 设置成可用状态
         * @return {Object} this
         * @example var btn = $.ui.button('#link1');
         * btn.disable();
         */
        disable: function (force) {
            return this._setState(false, force);
        },

        /**
         * @desc 切换可用和不可用状态, 当状态变化时，会触发***statechange***事件。
         * @name toggleEnable
         * @grammar toggleEnable()  ⇒ self
         * @param {Boolean} force 设置成可用状态
         * @return {Object} this
         * @example var btn = $.ui.button('#link1');
         * btn.toggleEnable();
         */
        toggleEnable: function () {
            return this._setState(this.data('disabled'));
        }

        /**
         * @name Trigger Events
         * @theme event
         * @desc 组件内部触发的事件
         * - ***create*** : 组件创建时触发
         * - ***init*** : 组件初始化时触发
         * - ***click*** : (event)当按钮被点击时触发
         * - ***statechange***: (state)当按钮状态变化时触发，比如从可点击到不可点击。
         * @example instance.on('click', function(e){
         *     console.log('clicked');// => clicked
         *     //this 指向instance
         *     //e指向当前事件对象
         * });
         */

    }).attach("control.fix");
})(Zepto);
///import ui.mobile.mobile;
///import ui.mobile.ex;
///import ui.mobile.widget;
///import ui.mobile.control;

/**
 * @file
 * @name Refresh_lite
 * @desc refresh组件的lite版，适用于android，不使用iscroll
 * @import mobile/mobile.js, mobile/widget.js, mobile/ex.js, mobile/control.js
 * */

(function($, undefined) {
    /**
     * @name $.ui.refresh
     * @grammar $.ui.refresh([el [,options]])  ⇒ instance
     * @desc **el**
     * css选择器，或者zepto对象
     *
     * **Options**
     * - ***container***              *{Selector|Zepto}* (可选)父容器，渲染的元素，默认值：document.body
     * - ***pullUpText***             *{String}*         (可选)上拉或下拉的文案，默认值：'加载更多'
     * - ***pullReleaseText***        *{String}*         (可选)上拉或下拉加载前松开时的文案，默认值：'松开立即加载'
     * - ***loadingText***            *{String}*         (可选)加载中的文案，点击和上拉下拉一样，默认值：'加载中...'
     * - ***direction***              *{String}*         (可选)拉动加载时的方向，默认值：'up'
     * - ***clickText***              *{String}*         (可选)点击加载时的按钮文案，默认值：'点击加载更多'
     * - ***type***                   *{String}*         (可选)铵钮类型，'click'或'pullup'，默认值：'click'
     * - ***isShow***                 *{Boolean}*        (可选)默认是否显示，默认值：true
     * - ***onReady***                *{Function}*       (可选)外部加载方法
     * @notice
     * **refresh非lite版中的以下参数，在lite版是不支持的**
     * - *speedScale iscroll的速度倍率，默认值：1*
     * - *useTransition 是否开启iscroll中的useTransition*
     * - *onBeforeScrollStart iscroll中scroll前的事件*
     * - *onScroll iscroll中scrollmove时的事件*
     * - *onScrollEnd iscroll中scrollend时的事件*
     * @example
     * var refresh = $.ui.refresh({
     *      container: '.scroller',
     *      direction: 'up',
     *      type:'pullup', //pullup or click
     *      onReady:function (callback) {
     *          $.ajax({
     *              type:'GET',
     *              url:'../data/refresh.php',
     *              data:{ name:'Zepto.js' },
     *              dataType:'json',
     *              timeout:300000,
     *              success:function (data) {
     *                  render(data);     //外部数据渲染方法
     *                  callback();
     *                  refresh.setStatus(true);
     *              },
     *          });
     *      }
     * });
     */
    $.ui.create('refresh', {
        _data:{
            container: "",
            instanceId: "",
            pullUpText:"加载更多",
            pullReleaseText:"松开立即加载",
            loadingText:'加载中...',
            clickText:"点击加载更多",
            type: 'click',
            direction: "up",       //加载方向，上拉加载
            isShow: true,
            onReady: null
        },

        _create: function() {
            var me = this;

            me._createButtonUI();    //创建refresh button的UI

            me.trigger('create');
        },

        _init: function() {
            var me = this,
                type = me.data("type"),
                $el = me.widget();

            //目前只支持上拉和点击
            if ($.inArray(me.data('type'), ['click','pullup']) == -1) return;

            me.data({
                range: 150,
                _isOk: true,              //加载是否完成
                refreshing: false,
                list: $el.parent().parent(),
                maxHeight: $el.parent().parent().height() || 200,
                maxTop: parseInt($el.parent().parent().get(0).getBoundingClientRect().top)
            });

            type == "click" ? me._clickAction() : me._pullUpAction();
            
            if (!me.data('isShow')) $el.hide();

            me.trigger('init');
        },

        /**
         * 创建下拉或点击的按钮UI
         * @private
         */
        _createButtonUI: function() {
            var me = this,
                $el = me.widget(),
                pullUpTpl = [],
                direction = me.data("direction"),
                container = $(me.data('container') || document.body)[0];// , //只处理第一个元素

            if ($.inArray(me.data('direction'), ['up','down']) == -1) {    //设置direction的默认值
                direction = "up";
            }
            //设定默认el
            if (!$el) {
                $el = me.widget($('<div></div>')).appendTo(container);
            }
            pullUpTpl.push('<span class="ui-refresh-pullup-icon"></span>');
            pullUpTpl.push('<span class="ui-refresh-pullup-label">' + (me.data('type') == 'pullup' ? me.data('pullUpText') : me.data('clickText')) + '</span>');
            $el.html(pullUpTpl.join(''));

            if (!$el.parent().length) {
                direction == "up" ? $el.appendTo(container): $el.prependTo(container);
            } else if (container !== document.body) {
                direction == "up" ? $el.appendTo(container) : $el.prependTo(container)
            }

            me.data({
                pullUpLabel: $el.find('.ui-refresh-pullup-label'),
                pullUpIcon: $el.find(".ui-refresh-pullup-icon"),
                dir: direction
            });

            me.data("pullUpIcon").hide();    //lite版箭头默认不显示

            $el.addClass(me.data("instanceId") || "ui-refresh");    //处理多实例
        },

        /**
         * 点击操作
         * @private
         */
        _clickAction: function () {
            var me = this,
                $el = me.widget(),
                eventHandler = $.bind(me._eventHandler, me);

            $el.on("click", eventHandler);      //tap改成click，解决穿透问题

        },

        /**
         * 上拉操作
         * @private
         */
        _pullUpAction: function () {
            var me = this,
                $list = me.data("list"),
                eventHandler = $.bind(me._eventHandler, me);

            $list.on("touchstart touchmove touchend", eventHandler);
            me.widget().on("click", eventHandler);      //点击和上拉同时存在，tap改成click，解决穿透问题
        },

        /**
         * 点击方式事件
         * @private
         */
        _tapHandler: function (e) {
            var me = this;
            
            if (!me.data("_isOk")) {
                return;
            }

            var $el = me.widget(),
                $pullUpLabel = me.data("pullUpLabel"),
                $pullUpIcon = me.data("pullUpIcon"),
                type = me.data("type");

            $el.addClass('ui-refresh-loading');
            $pullUpIcon.show();      //icon转化为loading图标
            $pullUpLabel.html(me.data('loadingText'));

            me.data('onReady').call(this, function() {      //数据加载完成后的默认执行函数
                $el.removeClass('ui-refresh-loading');
                $pullUpIcon.hide();
                $pullUpLabel.html(type == "click" ? me.data('clickText') : me.data("pullUpText"));
            });

            me.data("_isOk", false);
        },

        /**
         * touchstart事件
         * @private
         */
        _touchStartHandler: function (e) {
            if (!e.targetTouches[0]) {
                return;
            }

            var me = this,
                $list = me.data("list"),
                direction = me.data("dir"),
                maxTop = me.data("maxTop"),
                range = me.data("range"),
                touchY = e.targetTouches[0].pageY;

            //方向向上或向下且在拉动可加载的范围内
            if ((direction == "up" && touchY > ($list.height() + maxTop - range)) || (direction == "down" && touchY < (maxTop + me.widget().height() + range))) {
                me.data("startY", touchY);
            }
        },

        /**
         * touchmove事件
         * @private
         */
        _touchMoveHandler: function (e) {
            var me = this,
                moveY = e.targetTouches[0].pageY,
                startY = me.data("startY"),
                direction = me.data("dir"),
                thisMoveY = moveY - startY;

            //不需要执行的条件
            if (!e.targetTouches[0] || !me.data("_isOk") || !startY || (direction == "up" && thisMoveY > 0) || (direction == "down" && thisMoveY < 0)) {
                return;
            }

            var $pullUpLabel = me.data("pullUpLabel"),
                range = me.data("range"),
                maxTop = me.data("maxTop");

            if (Math.abs(thisMoveY) < me.data("maxHeight") && !me.data("refreshing")) {    //判断点击区域
                $pullUpLabel.html(me.data('pullReleaseText'));
                me.data("refreshing", true);
            }

            me.data("allMoveY", thisMoveY);
        },

        /**
         * touchend事件
         * @private
         */
        _touchEndHandler: function() {
            var me = this,
                $el = me.widget(),
                $pullUpIcon = me.data("pullUpIcon"),
                $pullUpLabel = me.data("pullUpLabel");

            if (me.data("refreshing")) {
                $el.addClass('ui-refresh-loading');
                $pullUpIcon.show();
                $pullUpLabel.html(me.data('loadingText'));

                me.data('onReady').call(this, function() {      //数据加载完成后的默认执行函数
                    $pullUpIcon.hide();
                    $el.removeClass('ui-refresh-loading');
                    $pullUpLabel.html(me.data('pullUpText'));
                });

                me.data({
                    refreshing: false,
                    _isOk: false
                });
            }
            me.data("startY", 0);     //重置startY的值
        },

        /**
         * @name setStatus
         * @grammar setStatus(status)  ⇒ self
         * @desc 设置是否启用加载功能，true为加载，false为不加载
         * @example
         * var refresh = $.ui.refresh(options);
         * if (data.length > 100) {
         *     refresh.setStatus(true);    //此时refresh不可再加载
         * }
         */
        setStatus: function(status) {
            var me = this;

            me.data("_isOk", !!status ? true : false);

            return me;
        },

        /**
         * @name hide
         * @grammar hide(isOpen)  ⇒ self
         * @desc 隐藏refresh按钮，如传参数isOpen为true，则同时加载功能仍然保留，隐藏的同时关闭加载功能，默认isOpen为false
         * @example
         * var refresh = $.ui.refresh(options);
         * refresh.hide(false);    //隐藏refresh按钮，同时关闭加载功能
         */
        hide: function(isOpen) {
            var me = this,
                $el = me.widget(),
                open = isOpen ? true : false;

            me.setStatus(open);

            if (me.data('isShow')) {
                me.data('isShow', false);
                $el.hide();
            }

            return me;
        },

        /**
         * @name show
         * @grammar show(isOpen)  ⇒ self
         * @desc 显示refresh按钮，如传参数isOpen为true，则同时加载功能仍然保留，隐藏的同时关闭加载功能，默认isOpen为true
         * @example
         * var refresh = $.ui.refresh(options);
         * refresh.show(false);    //显示refresh按钮，同时关闭加载功能
         */
        show: function(isOpen) {
            var me = this,
                $el = me.widget(),
                open = isOpen || isOpen == undefined ? true : false;

            me.setStatus(open);

            //修改代码格式 - by gsl
            if (!me.data('isShow')) {
                me.data('isShow', true);
                $el.show();
            }
        },

        /**
         * @name setLoadEndText
         * @grammar setLoadEndText(text, isOpen)  ⇒ self
         * @desc text设置加载完成后的refresh按钮的内容，isOpen设置是否关闭加载功能
         * @example
         * var refresh = $.ui.refresh(options);
         * refresh.setLoadEndText('没有更多内容', true);    //按钮文案显示为'没有更多内容'，并且不能再加载
         */
        setLoadEndText: function (text, isOpen) {
            var me = this,
                pullUpLabel = me.data("pullUpLabel"),
                pullUpIcon = me.data("pullUpIcon"),
                defText = me.data("type") == "click" ? me.data("clickText") : me.data("pullUpText"),
                cont = !text ? defText : text,
                open = isOpen ? true : false;

            pullUpLabel.html(cont);
            pullUpIcon && pullUpIcon.hide();
            me.setStatus(open);
        },

        /**
         * 事件处理中心
         * @private
         */
        _eventHandler: function(e) {
            var me = this;

            switch (e.type) {
                case 'click':
                    me._tapHandler(e);
                    break;
                case 'touchstart':
                    me._touchStartHandler(e);
                    break;
                case 'touchmove':
                    me._touchMoveHandler(e);
                    e.target.nodeType == 3 && $.os.ios && me._touchEndHandler(e);      //在ios4下，touchmove改变了target的内容，会导致touchend不触发
                    $.os.android && me.data('touchMoveTimer', setTimeout(function () {      //在android下，touchmove没有preventDefault时，touchend不触发
                        me._touchEndHandler();
                    }, 1000));
                    break;
                case 'touchend':
                    me.data('touchEndTimer', setTimeout(function () {me._touchEndHandler(e);}, 0));
                    break;
            }
        },

        /**
         * @name destroy
         * @grammar destroy()  => undefined
         * @desc 销毁组件创建的dom及绑定的事件
         */
        destroy: function () {
            var me = this,
                touchMoveTimer = me.data('touchMoveTimer'),
                touchEndTimer = me.data('touchEndTimer');

            me.widget().off('click');
            me.data('list').off('touchstart touchmove touchend');
            touchMoveTimer && clearTimeout(touchMoveTimer);
            touchEndTimer && clearTimeout(touchEndTimer);

            me._super();
        }

        /**
         * @name Trigger Events
         * @theme event
         * @desc 组件内部触发的事件
         * - ***create*** : 组件创建时触发
         * - ***init*** : 组件初始化时触发
         */

    });
})(Zepto);
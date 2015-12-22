///import ui.mobile.mobile;
///import ui.mobile.ex;
///import ui.mobile.widget;
///import ui.mobile.control;
///import third-party.iscroll.iscroll;

/**
 * @file
 * @name Refresh
 * @desc refresh组件
 * @import mobile/mobile.js, mobile/widget.js, mobile/ex.js, mobile/control.js, mobile/iscroll.js
 * */
(function($, undefined) {
    /**
     * @name $.ui.refresh
     * @grammar $.ui.refresh([el [,options]])  ⇒ instance
     * @desc **el**
     * css选择器，或者zepto对象
     *
     * @desc **Options**
     * - ***container***              *{Selector|Zepto}* (可选)父容器，渲染的元素，默认值：document.body
     * - ***pullUpText***             *{String}*         (可选)上拉或下拉的文案，默认值：'加载更多'
     * - ***pullReleaseText***        *{String}*         (可选)上拉或下拉加载前松开时的文案，默认值：'松开立即加载'
     * - ***loadingText***            *{String}*         (可选)加载中的文案，点击和上拉下拉一样，默认值：'加载中...'
     * - ***direction***              *{String}*         (可选)拉动加载时的方向，默认值：'up'
     * - ***clickText***              *{String}*         (可选)点击加载时的按钮文案，默认值：'点击加载更多'
     * - ***type***                   *{String}*         (可选)铵钮类型，'click'或'pullup'，默认值：'click'
     * - ***isShow***                 *{Boolean}*        (可选)默认是否显示，默认值：true
     * - ***speedScale***             *{Number}*         (可选)iscroll的速度倍率，默认值：1
     * - ***useTransition***          *{Boolean}*        (可选)是否开启iscroll中的useTransition
     * - ***onReady***                *{Function}*       (可选)外部加载方法，可以通过me.data('iscroll')方法获取refresh中封装的iscroll
     * - ***onBeforeScrollStart***    *{Function}*       (可选)iscroll中scroll前的事件
     * - ***onScroll***               *{Function}*       (可选)iscroll中scrollmove时的事件
     * - ***onScrollEnd***            *{Function}*       (可选)iscroll中scrollend时的事件
     * @example
     * var refresh = $.ui.refresh({
     *      container: '.scroller',
     *      direction: 'up',
     *      type:'pullup', //pullup or click
     *      onBeforeScrollStart:function (e) {      //使iscroll中input、select等可点击
     *          var target = e.target;
     *          while (target.nodeType != 1) target = target.parentNode;
     *          if (target.tagName != 'SELECT' && target.tagName != 'INPUT' && target.tagName != 'TEXTAREA')
     *              e.preventDefault();
     *      },
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
            pullUpText:"加载更多",
            pullReleaseText:"松开立即加载",
            loadingText:'加载中...',
            clickText:"点击加载更多",
            type: 'click',
            direction: "up",       //加载方向，上拉加载
            isShow: true,
            iscroll: '',
            speedScale: 1,
            useTransition: true,
            topOffset: 0,
            onReady: function(){}
        },
        _myScroll: '',
        range: 10,
        _isOk: true,

        _create: function() {
            var me = this;

            me._createButtonUI();
            me.trigger('create');
        },

        _init: function() {
            var me = this,
                $el = me.widget(),
                $el2 = me.data('widgetElem2'),
                pullUpIcon = $el.find('.ui-refresh-pullup-icon'),
                pullUpLabel = $el.find('.ui-refresh-pullup-label'),
                _eventHandler = $.bind(me._eventHandler, me),
                $pullUpIcon2, $pullUpLabel2;

            //目前只支持上下拉动和点击
            if($.inArray(me.data('type'),['click','pullup']) == -1) return;

            me.data({
                hotArea: $el.parent().parent().get(0),
                refreshing: false,
                elObj: {
                    el: $el,
                    pullUpIcon: pullUpIcon,
                    pullUpLabel: pullUpLabel
                }
            });

            if ($el2) {
                $pullUpIcon2 = $el2.find('.ui-refresh-pullup-icon');
                $pullUpLabel2 = $el2.find('.ui-refresh-pullup-label');
                me.data('elObj2', {
                    el: $el2,
                    pullUpIcon: $pullUpIcon2,
                    pullUpLabel: $pullUpLabel2
                });
            }

            me._loaded();

            //事件绑定
            $el.on("touchmove", _eventHandler);

            if (me.data("type") == "pullup") {
                $el.on('click',_eventHandler);
                $el2 && $el2.on('click',_eventHandler);
            }else {
                pullUpIcon.hide();
                pullUpLabel.html(me.data('clickText'));
                $el.on('click',_eventHandler);
                if ($el2) {
                    $pullUpIcon2.hide();
                    $pullUpLabel2.html(me.data('clickText'));
                    $el2.on('click', _eventHandler);
                }
            }
            if(!me.data('isShow')) $el.hide();

            me.trigger('init');
        },

        /**
         * 创建UI
         * @private
         */
        _createButtonUI: function() {
            var me= this,
                $el = me.widget(),$el2, pullUpTpl = [],
                direction = me.data("direction"),
                $container = $(me.data('container') || document.body)[0];// || document.body)[0], //只处理第一个元素

            if ($.inArray(me.data('direction'), ['up','down', 'both']) == -1) {    //设置direction的默认值
                direction = "up";
            }

            pullUpTpl.push('<span class="ui-refresh-pullup-icon"></span>');
            if(me.data('type') == 'pullup') {
                pullUpTpl.push('<span class="ui-refresh-pullup-label">' + me.data('pullUpText') + '</span>');
            } else if(me.data('type') == 'click') {
                pullUpTpl.push('<span class="ui-refresh-pullup-label">' + me.data('clickText') + '</span>');
            }

            if ($el === undefined) {
                $el = me.widget($('<div class="ui-refresh"></div>'));
                direction == 'both' && ($el2 = me.data('widgetElem2', $('<div class="ui-refresh"></div>')));   //另外一个el保存在widgetElem2中
            }

            /*根元素存在*/
            if (direction == 'up') {
                $el.html(pullUpTpl.join(''));
            } else if (direction == 'down') {
                $el.html(pullUpTpl.join(''));
                $.os.ios && $el.addClass('ui-refresh-flip');
            } else if (direction == 'both') {
                if ($el.length > 1) {
                    var $root = $el;
                    $el2 = me.data('widgetElem2', $($root[0]));
                    $el = me.widget($($root[1]));
                }
                $el.html(pullUpTpl.join(''));
                $el2.html(pullUpTpl.join(''));
                $.os.ios && $el2.addClass('ui-refresh-flip');
            }

            /*根元素不在页面上或者传了父容器*/
            if ($container !== document.body || !$el.parent().length) {
                if (direction == 'up') {
                    $el.appendTo($container);
                } else if (direction == 'down') {
                    $el.prependTo($container);
                } else if (direction == 'both') {
                    $el.appendTo($container);
                    $el2.prependTo($container);
                }
            }

            !$.os.ios && $('.ui-refresh-pullup-icon').hide();
            me.data("dir", direction);
        },

        /**
         * 绑定iscroll事件
         * @private
         */
        _loaded: function () {
            var me = this,
                hotArea = me.data('hotArea'),
                direction = me.data("dir"),
                onBeforeScrollStart = me.data('onBeforeScrollStart'),
                onScroll = me.data('onScroll'),
                onScrollEnd = me.data('onScrollEnd');

            if(me.data('type') == 'pullup'){                 // pull时的iscroll初始化
                me._myScroll = new iScroll(hotArea, {
                    useTransition: me.data('useTransition'),
                    speedScale: me.data('speedScale'),
                    topOffset: me.data('topOffset'),
                    onBeforeScrollStart: function(e) {
                        $.isFunction(onBeforeScrollStart) ? onBeforeScrollStart.call(this, e) : e.preventDefault();
                    },
                    onScrollMove: function () {
                        var that = this,
                            isPullUp = that.distY < 0 && that.y <= that.maxScrollY - me.range,     //判断当前的拉动方向
                            isPullDown = that.distY > 0 && that.y >= me.range,
                            isRestoreUp = that.distY < 0 && that.y > that.maxScrollY - me.range,
                            isRestoreDown = that.distY > 0 && that.y < me.range,
                            refreshing = me.data('refreshing');

                        // 处于加载中，直接返回
                        if(!me._isOk) {
                            return;
                        }


                        if (direction == 'up') {
                            if (!refreshing && isPullUp) {
                                me._pullBeforeAdapter('up', 'pull');
                            } else if (refreshing && isRestoreUp) {
                                me._pullBeforeAdapter('up', 'restore');
                            }
                        } else if (direction == 'down') {
                            if (!refreshing && isPullDown) {
                                me._pullBeforeAdapter('down', 'pull');
                            } else if (refreshing && isRestoreDown) {
                                me._pullBeforeAdapter('down', 'restore');
                            }
                        } else {
                            if (!refreshing && isPullUp) {
                                me._pullBeforeAdapter('pullUpBoth', 'pull');
                            } else if (refreshing && isRestoreUp) {
                                me._pullBeforeAdapter('pullUpBoth', 'restore');
                            } else if (!refreshing && isPullDown) {
                                 me._pullBeforeAdapter('pullDownBoth', 'pull');
                            } else if (refreshing && isRestoreDown) {
                                me._pullBeforeAdapter('pullDownBoth', 'restore');
                            }
                        }

                        $.isFunction(onScroll) && onScroll.apply(that);
                    },
                    onBeforeScrollEnd: function () {
                        if (me.data("refreshing")) {
                            me._refreshLoading('pullUp');
                            this.options.topOffset = 0;
                            me._refreshAction('pullUp');
                            me.data("refreshing", false);
                        }
                        $.isFunction(onScrollEnd) && onScrollEnd.apply(this);
                    }
                });

            }  else if(me.data('type') == 'click') {        //click时的iscroll初始化
                me._myScroll = new iScroll(hotArea, {
                    useTransition: me.data('useTransition'),
                    speedScale: me.data('speedScale'),
                    topOffset: 0,
                    onBeforeScrollStart: function(e) {
                        $.isFunction(onBeforeScrollStart) ? onBeforeScrollStart.call(this, e) : e.preventDefault();
                    },
                    onScrollMove: function(){
                        $.isFunction(onScroll) && onScroll.apply(this);
                    },
                    onScrollEnd: function() {
                        $.isFunction(onScrollEnd) && onScrollEnd.apply(this);
                    }
                });
            }
            me.data('iscroll', me._myScroll);
        },

        /**
         * 上拉或下拉不同type的适配
         * @parm {String} 拉动的方向，取值为up, down, pullUpBoth, pullDownBoth
         * @parm {String} 拉动类型，取值为pull, restore
         * @private
         */
        _pullBeforeAdapter: function (pullDirection, pullType) {
            var me = this;

            me._pullBeforeLoading(pullDirection, pullType);
            me.data('refreshing', !!(pullType == 'pull'));
        },

        /**
         * pull时改变loading前的状态
         * @parm {String} 拉动的方向，取值为up, down, pullUpBoth, pullDownBoth
         * @parm {String} 拉动类型，取值为pull, restore
         * @private
         */
        _pullBeforeLoading: function (pullDirection, pullType) {
            var me = this,
                textType = me.data('type') == 'pullup' ? 'pullUp' : 'click',
                elObj = me._getCurObj(pullDirection),
                className;

            if ($.os.ios) {
                if (pullDirection == "up" || pullDirection == "pullUpBoth") {          //统一的className处理
                    className = 'ui-refresh-flip';
                } else if (pullDirection == "down" || pullDirection == "pullDownBoth") {
                    className = 'ui-refresh-flip-origin';
                }
                if (pullType == 'pull') {
                    elObj['el'].addClass(className);
                    elObj['pullUpLabel'].html(me.data('pullReleaseText'));
                } else {
                    elObj['el'].removeClass(className);
                    elObj['pullUpLabel'].html(me.data(textType + 'Text'));
                }
            } else {
                pullType == 'pull' && elObj['pullUpLabel'].html(me.data('pullReleaseText'));
                pullType == 'restore' && elObj['pullUpLabel'].html(me.data(textType + 'Text'));

            }
            pullDirection == "pullUpBoth" && me.data('pullDirection', 'pullUpBoth');
            pullDirection == "pullDownBoth" && me.data('pullDirection', 'pullDownBoth');


        },

        /**
         * 改变loading时的状态
         * @parm {String} 触发的type，click或者pullUp，在refresh时改变的状态up,down的效果是一样的
         * @private
         */
        _refreshLoading: function (type) {
            var me = this,
                direction = me.data('dir'),
                pullDirection = me.data('pullDirection'),
                elObj = me._getCurObj();

            if (type == 'pullUp') {
                (direction == "up" || pullDirection == 'pullUpBoth') && elObj['el'].removeClass('ui-refresh-flip');
                (direction == "down" || pullDirection == 'pullDownBoth') &&  elObj['el'].removeClass('ui-refresh-flip-origin');
            }
            elObj['el'].addClass('ui-refresh-loading');
            !($.os.ios && type == 'pullUp') && elObj['pullUpIcon'].show();       //在android下无箭头，并且在click情况下也没有箭头
            elObj['pullUpLabel'].html(me.data('loadingText'));

            return me;
        },

        /**
         * 改变loading后的状态
         * @parm {String} 触发的type，click或者pullUp，在数据完成后改变的状态，up,down的效果是一样的
         * @private
         */
        _refreshAfterLoading: function (type) {
            var me = this,
                textType = me.data('type') == 'pullup' ? 'pullUp' : 'click',      //现在type传值是pullup，但文字是pullUpText
                elObj = me._getCurObj();

            elObj['el'].removeClass('ui-refresh-loading');
            (!$.os.ios || type == 'click' && textType == 'click') && elObj['pullUpIcon'].hide();

            elObj['pullUpLabel'].html(me.data(textType + 'Text'));
        },

        /**
         * loading时执行的动作
         * @parm {String} 触发的type，click或者pullUp
         * @private
         */
        _refreshAction: function (type) {
            var me = this;

            type == 'click' && me._refreshLoading('click');
            me.data('onReady').call(this, function(){
                me.afterDataLoading(type);
            }, type);

            me._isOk = false;
        },

        /**
         * 数据loading完后更改refresh状态
         * @parm {String} 触发的type，click或者pullUp
         * @private
         */
        afterDataLoading: function (type) {
            var me = this;

            me._refreshAfterLoading(type);
            me.data('iscroll').options.topOffset = me.data('topOffset');
            me._scrollRefresh();     //调用iscroll的refresh
            me.setStatus(true);      //完成数据加载后，重新
        },

        /**
         * 取得当前的refresh按钮对象
         * @private
         */
        _getCurObj:function (dir) {
            var me = this,
                pullDirection = dir || me.data('pullDirection');

            return pullDirection == 'pullDownBoth' ? me.data('elObj2') : me.data('elObj');
        },

        /**
         * refresh
         * @private
         */
        _scrollRefresh: function() {
            var me = this;

            me._myScroll.refresh();
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
            me._isOk = !!status;

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
                open = !!isOpen;

            me.setStatus(open);    //修改不显示refresh按钮时，仍然上拉可加载的问题 - by zmm

            //修改代码格式 - by gsl
            if(me.data('isShow')) {
                me.data('isShow',false);
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

            me.setStatus(open);    //修改不显示refresh按钮时，仍然上拉可加载的问题 - by zmm

            //修改代码格式 - by gsl
            if(!me.data('isShow')) {
                me.data('isShow',true);
                $el.show();
            }

            return me;
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
                $el = me.widget(),
                pullUpLabel = $el.find(".ui-refresh-pullup-label"),
                defText = me.data("type") == "click" ? me.data("clickText") : me.data("pullUpText"),
                cont = !text ? defText : text,
                open = !!isOpen;

            pullUpLabel.html(cont);
            if ($('.ui-refresh-pullup-icon', $el)) {
                $('.ui-refresh-pullup-icon', $el).hide();
            }
            me.setStatus(open);

            return me;
        },

        /**
         * 事件处理中心
         * @private
         *
         * @param {object} e 事件对象
         */
        _eventHandler: function(e) {
            var me = this;

            switch (e.type) {
                case 'touchmove':
                    e.preventDefault();
                    break;
                case 'click':
                    if (!me._isOk) return;
                    var $target = $(e.target).hasClass('ui-refresh') ? $(e.target) : $(e.target).parents('.ui-refresh');

                    //当ui-refresh button位于scroller中的第一个元素时，认为是both中的第一个元素
                    me.data('dir') == 'both' && ($target.prev().length ? me.data('pullDirection', 'pullUpBoth') : me.data('pullDirection', 'pullDownBoth'));
                    me._refreshAction('click');
            }
        },

        /**
         * @name destroy
         * @grammar destroy()  => undefined
         * @desc 销毁组件创建的dom及绑定的事件，同时调用iscroll中的destroy
         */
        destroy: function () {
            var me = this;

            me.widget().off();
            me.data('iscroll').destroy();

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
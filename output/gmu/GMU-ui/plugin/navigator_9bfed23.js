///import ui.mobile.mobile;
///import ui.mobile.ex;
///import ui.mobile.widget;
///import ui.mobile.control;
///import third-party.iscroll.iscroll;

/**
 * @file
 * @name Navigator
 * @desc 导航栏组件，也可配置为tab组件，支持render和setup两种方式
 * @import mobile/mobile.js, mobile/widget.js, mobile/ex.js, mobile/control.js, mobile/iscroll.js
 * */
(function ($, undefined) {
    /**
     * @name $.ui.navigator
     * @grammar $.ui.navigator([el [,options]])  ⇒ instance
     * @desc **el**
     * css选择器，或者zepto对象
     *
     * @desc **Options**
     * - ***container***       *{Selector|Zepto}*    (可选)父容器，渲染的元素，默认值：document.body
     * - ***content***         *{Array|Selector}*    (必选)导航tab项的内容，当传入的是css selector时，即为setup方式
     * - ***fixContent***      *{Array|Selector}*    (可选)固定tab项的内容
     * - ***isSwipe***         *{Boolean}*           (可选)是否滑动，默认值：true
     * - ***defTab***          *{Number}*            (可选)默认选中的导航tab项的索引，若为默认选中固定tab，则索引值在原来tabs.length上加1，默认值：0
     * - ***instanceId***      *{Selector}*          (可选)多实例的类名选择器
     * - ***onverticalswipe*** *{Function}*          (可选)父容器，竖滑时事件
     * - ***ontabselect***     *{Function}*          (可选)tab选中时的事件
     *
     * <code type="html"><!--setup方式，即html写在页面上，content传入的是css selector时即采取此种方式，但html结构需符合要求-->
     *   <div id="box1"class="ui-navigator">
     *       <div class="ui-navigator-fix"><a href="javascript:;">fix1</a></div>
     *       <div class="ui-navigator-wrap" style="overflow: hidden">
     *           <ul class="ui-navigator-list clearfix">
     *               <li><a href="#test1">首页</a></li>
     *               <li><a href="#test2">电影</a></li>
     *               <li class="cur"><a href="#test3">电视剧</a></li>
     *               <li><a href="javascript:;">动漫</a></li>
     *               <li><a href="javascript:;">综艺</a></li>
     *               <li><a href="javascript:;">美女</a></li>
     *               <li><a href="javascript:;">搞笑剧</a></li>
     *               <li><a href="javascript:;">个人中心</a></li>
     *           </ul>
     *       </div>
     *   </div>
     * </code>
     * @example
     * $.ui.navigator("#box1", {
     *      content:".ui-navigator-wrap",
     *      fixContent:".ui-navigator-fix",
     *      defTab:2
     * });
     * //render方式，即html写在页面上，content传入的是css selector时即采取此种方式，但html结构需符合要求
     * $.ui.navigator({
     *      container:"#box4",
     *      content:[
     *          {text:"首页", url:"http://gmu.baidu.com"},
     *          {text:"电影", url:"index#movie"},
     *          {text:"电视剧", url:"index#tv"},
     *          {text:"动漫", url:"index#movie"},
     *          {text:"综艺", url:"index#movie"},
     *          {text:"美女", url:"javascript:;"},
     *          {text:"搞笑剧", url:"javascript:;"},
     *          {text:"个人中心1", url:"http://gmu.baidu.com"},
     *          {text:"个人中心2", url:"http://gmu.baidu.com"},
     *      ],
     *      fixContent:[
     *          {text:"fix1", url:"javascript:;", pos:"right"}
     *       ],
     *      defTab:1,
     *      instanceId:"instance2"
     * });
     * //render方式创建tab，setup类似
     * $.ui.navigator("#box6", {
     *      content:[
     *          {text:"我要提问", url:"javascript:;"},
     *          {text:"我要回答", url:"javascript:;"},
     *          {text:"我要知道", url:"javascript:;"}
     *      ],
     *      isSwipe:false,
     *      defTab:1
     * });
     */
    $.ui.create("navigator", {
        _data:{
            container:"",
            defTab:0,
            isSwipe:true,
            onverticalswipe:function (e) {
            },
            ontabselect:function (e) {
            }
        },

        _create:function () {
            var me = this,
                content = me.data("content"),
                fixContent = me.data("fixContent");

            if ($.isArray(content)) {      //判断采用哪种方式
                me._createNavUI();           //Render模式
                (fixContent && $.isArray(content)) ? me._createFixTab() : me._createRenderFixTab();
            } else {
                me._createRenderNavUI();      //普通模式
                (fixContent && $.isArray(content)) ? me._createFixTab() : me._createRenderFixTab();
            }

            me.trigger("create");
        },

        _init:function () {
            var me = this,
                $el = me.widget(),
                $navList = me.data("navList"),
                $listWrap = me.data("listWrap"),
                $fixElem = me.data("fixElem"),
                defTab = me.data("defTab"),
                tabNum = me.data("tabNum"),
                tabWidthSumArr = [],
                _eventHandler = $.bind(me._eventHandler, me),
                _rotateEV = 'ortchange';

            //为固定tab添加index属性
            if (me.data("fixNum") && $fixElem) {
                $fixElem.each(function (index) {
                    this.index = index + tabNum;
                });
            }

            //为每个固定tab添加index属性并计算所有tab总长度
            $navList.each(function (index) {
                this.index = index;
                if (!index) {
                    tabWidthSumArr[index] = parseInt(this.offsetWidth);
                } else {
                    tabWidthSumArr[index] = tabWidthSumArr[index - 1] + parseInt(this.offsetWidth);     //记录tab累加的宽度
                }
            });

            me.data("lastTabIndex", -1);
            me.data("tabWidthSumArr", tabWidthSumArr);
            $listWrap.css("width", tabWidthSumArr[tabNum - 1] + "px");

            //加载iScroll对象
            me._loaded();

            me.data("wrapOffsetWidth", me.data("myScroll").scrollerW - tabWidthSumArr[tabNum - 1]);

            //设置默认选中的tab
            if (me.data("defTab") != undefined) {
                me.data("isDefTab", true);       //modified by zmm 默认选中标识，修改url跳转方式，半个tab跳动距离不对的问题
                me.switchTo(parseInt(defTab));
            }

            //事件绑定
            $fixElem && $fixElem.on('tap', _eventHandler);
            $el.on('touchmove', _eventHandler);
            $(window).on(_rotateEV, _eventHandler);

            me.on('destroy', function () {
                $fixElem && $fixElem.off('click tap', _eventHandler);
                $el.off('touchmove', _eventHandler);
                $(window).off(_rotateEV, _eventHandler);
            });

            me.trigger("init");
        },

        /**
         * 创建导航tab的UI
         * @private
         */
        _createNavUI:function () {
            var me = this,
                $el = me.widget(),
                $container = $(me.data("container") || document.body)[0],
                content = me.data("content"),
                tabNum = content.length,
                instanceId = me.data("instanceId"),
                navArr = [], tabHref = [], $navList, $listWrap, $screenWrap;

            for (var i = 0; i < tabNum; i++) {     //创建nav list的html
                navArr[i] = "<li><a href='javascript:;'>" + content[i]["text"] + "</a></li>";
            }

            $screenWrap = $("<div class='ui-navigator-wrap'></div>");
            $listWrap = $("<ul class='ui-navigator-list clearfix'></ul>");
            $navList = $(navArr.join(""));

            //渲染导航的tab列表
            $screenWrap.append($listWrap.prepend($navList));

            if ($el) {    //存在外围容器，selector或html
                $el.append($screenWrap);
                if (!$el.parent().length) {
                    $el.appendTo($container);
                } else if ($container !== document.body) {
                    $el.appendTo($container);
                }
            } else {
                $el = me.widget($("<div></div>").append($screenWrap)).appendTo($container);
            }

            me.data({
                tabNum:tabNum,
                screenWrap:$screenWrap,
                listWrap:$listWrap,
                navList:$navList
            });

            $.each(content, function (index, item) {
                tabHref.push(item.url);
            });

            me.data("tabHref", tabHref);

            //创建多个实例时样式处理
            $el.addClass(instanceId || "ui-navigator");
        },

        /**
         * Render模式创建导航tab的UI
         * @private
         */
        _createRenderNavUI:function () {
            var me = this,
                $el = me.widget(),
                instanceId = me.data("instanceId"),
                tabHref = [];

            !$el && ($el = me.widget($(me.data("content")).parent()));    //由于需要在页面渲染，故不支持传container和el为自己创建的dom的方式

            me.data({
                screenWrap:$el.find(".ui-navigator-wrap"),
                listWrap:$el.find(".ui-navigator-list"),
                navList:$el.find(".ui-navigator-list li")
            });

            $.each(me.data("navList"), function (index, item) {
                tabHref.push($(item).find("a")[0].href);
            });

            me.data({
                tabNum:me.data("navList").length,
                tabHref:tabHref
            });

            //创建多个实例时样式处理
            $el.addClass(instanceId || "ui-navigator");
        },

        /**
         * 创建导航栏中固定的tab项
         * @private
         */
        _createFixTab:function () {
            var me = this,
                $el = me.widget(),
                fixContent = me.data("fixContent"),
                fixTabHref = [];

            for (var j = 0; j < fixContent.length; j++) {
                var fixChild = $("<div class='ui-navigator-fix'><a href='" + fixContent[j]["url"] + "'>" + fixContent[j]["text"] + "</a></div>");
                if (fixContent[j]["pos"] == "right") {
                    $el.append(fixChild);
                } else {
                    $el.prepend(fixChild);
                }
            }

            $.each(fixContent, function (index, item) {
                fixTabHref.push(item.url);
            });

            me.data({
                fixTabHref:fixTabHref,
                fixNum:fixContent.length,
                fixElem:$el.find(".ui-navigator-fix")
            });
        },

        /**
         * Render模式创建固定导航tab的UI
         * @private
         */
        _createRenderFixTab:function () {
            var me = this,
                $el = me.widget(),
                fixContent = $el.find(me.data("fixContent")),
                fixTabHref = [];

            $.each(fixContent, function (index, item) {
                fixTabHref.push($(item).find("a")[0].href);
            });

            me.data({
                fixNum:fixContent.length,
                fixElem:fixContent,
                fixTabHref:fixTabHref
            });
        },

        /**
         * @name switchTo
         * @grammar switchTo(index)  ⇒ self
         * @desc index是切换到的tab的索引，索引值从0开始。若是切换到固定tab，则索引值在原来tabs.length上加1。调用该方法时
         * 会先改变选中的状态，再设置url跳转值
         * @example
         * if (index > 3) {
         *     this.switchTo(index);
         * }
         */
        switchTo:function (index) {
            var me = this,
                tabNum = me.data("tabNum"),
                curIndex = parseInt(index),
                $fixElem = me.data("fixElem"),
                $navList = me.data("navList"),
                myScroll = me.data("myScroll"),
                lastIndex = me.data("lastTabIndex"),
                tabHref = me.data("tabHref"),
                fixTabHref = me.data("fixTabHref"),
                href = "", linkEle;

            //url判断切换操作
            if (curIndex >= tabNum) {     //当前选中的是固定的tab
                linkEle = $($fixElem[curIndex - tabNum]).children("a")[0];
                if (lastIndex == curIndex) {          //modified by zmm 当选中的是同一个tab时，将其href置为javascript:;
                    linkEle.href = "javascript:;";
                    return me;
                }
                href = fixTabHref[curIndex - tabNum];
            } else {        //当前选中的是可滑动的tab
                linkEle = $($navList[curIndex]).children("a")[0];
                if (lastIndex == curIndex) {         //modified by zmm 当选中的是同一个tab时，将其href置为javascript:;
                    linkEle.href = "javascript:;";
                    return me;
                }
                href = tabHref[curIndex];
            }

            if (href.indexOf("#") != -1 || lastIndex == -1) {    //modified by zmm，修改默认选中时刷新的bug
                linkEle.href = href;
            } else if (!/javascript/.test(href)) {
                location.href = href;
                return me;         //若是跳转页面，则不需要修改样式
            }
            //改变当前选中状态
            if (curIndex >= tabNum) {
                $($fixElem[curIndex - tabNum]).addClass("fix-cur");
            } else {
                $($navList[curIndex]).addClass("cur");
                me.data("isSwipe") && myScroll.hScroll && me._swipeNextPre(curIndex, me._screenPos(curIndex));
            }

            if (lastIndex >= tabNum) {   //上次选中的是固定的tab
                $($fixElem[lastIndex - tabNum]).removeClass("fix-cur");
            } else if (lastIndex >= 0) {   //上次选中的是可滑动的tab
                $($navList[lastIndex]).removeClass("cur");
            }

            me.data("lastTabIndex", curIndex);
            me.trigger("tabselect");    //触发ontabselect事件

            return me;
        },

        /**
         * @name getCurTab
         * @grammar getCurTab()  ⇒ value
         * @desc  取得当前选中的tab的信息，包括当前tab的index和初始化时传入的tab信息text和url
         * @example
         * var tabInfo = this.getCurTab();
         * console.log(tabInfo)    //{index:0, info:{text:'测试', url:"javascript:;"}}
         */
        getCurTab:function () {
            var me = this,
                lastTabIndex = me.data("lastTabIndex"),
                content = me.data("content"),
                fixContent = me.data("fixContent"),
                tabNum = me.data("tabNum"),
                curTab = [], info = null;

            if ($.isArray(content)) {
                curTab = lastTabIndex >= tabNum ? fixContent[lastTabIndex - tabNum] : content[lastTabIndex];
                info = {
                    text:curTab["text"],
                    url:curTab["url"]
                }
            } else {
                curTab = lastTabIndex >= tabNum ? me.data("fixElem")[lastTabIndex - tabNum] : me.data("navList")[lastTabIndex];
                info = {
                    text:$(curTab).find("a").html(),
                    url:$(curTab).find("a")[0].href
                }
            }

            return {
                index:lastTabIndex,
                info:info
            }
        },

        /**
         * 切换到某个tab的事件处理
         * @private
         *
         * @param {object} e 事件对象
         */
        _switchEventHandle:function (e) {
            var me = this,
                obj = e.target.tagName == "LI" ? $(e.target)[0] : $(e.target).parents("li").get(0) || $(e.target).parents("div").get(0);

            if (obj && obj.index != undefined) {
                me.switchTo(obj.index);
            }

        },

        /**
         * 加载iScroll对象
         * @private
         */
        _loaded:function () {
            var me = this,
                screenWrap = me.data("screenWrap")[0],
                isSwipe = me.data("isSwipe") ? true : false,
                myScroll = {};

            myScroll = new iScroll(screenWrap, {
                hScroll:isSwipe,
                vScroll:false,
                hScrollbar:false,
                vScrollbar:false,
                onScrollMove:function () {
                    me.data('scrollTimer', setTimeout($.bind(me._setShadow, me), 1));
                },
                onScrollEnd:function (e) {
                    if (this.absDistY > this.absDistX) {
                        me.trigger("verticalswipe", e);
                    }
                },
                onTouchEnd:function (e) {
                    if (!this.moved && !this.absDistY && !this.isStopScrollAction) {    //未触发scrollmove并且也没有竖滑操作
                        me._switchEventHandle(e);
                    }
                }
            });

            me.data("myScroll", myScroll);

        },

        /**
         * 设置滚动tab两边出现阴影
         * @private
         */
        _setShadow:function () {
            var me = this,
                $screenWrap = me.data("screenWrap"),
                myScroll = me.data("myScroll"),
                maxOffsetWidth = Math.abs(myScroll.maxScrollX);

            if (myScroll.x < 0) {
                $screenWrap.addClass("ui-navigator-shadowall");
                if (Math.abs(myScroll.x) >= maxOffsetWidth) {
                    $screenWrap.removeClass("ui-navigator-shadowall");
                    $screenWrap.addClass("ui-navigator-shadowleft");
                    $screenWrap.removeClass("ui-navigator-shadowright");
                }
            } else {
                $screenWrap.removeClass("ui-navigator-shadowall");

                $screenWrap.removeClass("ui-navigator-shadowleft");
                $screenWrap.addClass("ui-navigator-shadowright");
            }
        },

        /**
         * touchmove事件
         * @private
         *
         * @parm {Object} e 事件对象
         */
        _touchMoveHandle:function (e) {
            e.preventDefault();
        },

        /**
         * 当切换至可显示范围内的最后一个tab时，自动将该tab置为倒数第二个；当切换至可显示范围内的第一个tab时，自动将该tab置为第二个
         * 注：若出现半个tab，则半个tab及其前一个或者后一个tab也算第一个或最后一个tab
         * @private
         *
         * @parm {Object} elem 原生dom节点
         * @parm {String/Number} 当前dom节点的位置
         */
        _swipeNextPre:function (index, pos) {
            var me = this,
                thisMoveX = 0,
                tabNum = me.data("tabNum"),
                $navList = me.data("navList"),
                myScroll = me.data("myScroll"),
                isDefTab = me.data("isDefTab"),
                scrollX = myScroll.x || 0;

            switch (pos) {
                case "defTab":
                    thisMoveX = me.data("defTabMoveX") || 0;               //modified by zmm 默认选中tab跳动的距离
                    myScroll.scrollTo(thisMoveX, 0, 400);
                    if (isDefTab) {
                        me.data("isDefTab", false);
                        me.data("defTabMoved", true);
                    }
                    break;
                case 0 :         //点击列表第一个tab项
                    thisMoveX = 0;
                    myScroll.scrollTo(thisMoveX, 0, 400);
                    if (isDefTab) {
                        me.data("isDefTab", false);
                        me.data("defTabMoved", true);
                    }
                    break;
                case (tabNum - 1) :       //点击列表最后一个tab项
                    thisMoveX = myScroll.wrapperW - myScroll.scrollerW;
                    myScroll.scrollTo(thisMoveX, 0, 400);
                    if (isDefTab) {
                        me.data("isDefTab", false);
                        me.data("defTabMoved", true);
                    }
                    break;
                case "first" :      //可视区域第一个tab
                    if (index == 1 && !scrollX) {    //还未滚动，并且点击的是第二个tab
                        return;
                    }
                    thisMoveX = scrollX + parseInt($navList[index - 1].offsetWidth);
                    myScroll.scrollTo(thisMoveX, 0, 400);
                    break;
                case "last" :       //可视区域最后一个tab
                    if (index == tabNum - 2 && Math.abs(scrollX) == Math.abs(myScroll.maxScrollX)) {//列表已滚动到头，并且点击的是倒数第二个tab
                        return;
                    }
                    thisMoveX = scrollX - parseInt($navList[index - 1].offsetWidth);
                    myScroll.scrollTo(thisMoveX, 0, 400);
                    break;
                case "middle" :    //点周中间的tab
                    break;
            }

            me.data("isDefTab", false);
            me.data('nextPreTimer', setTimeout($.bind(me._setShadow, me), 1));
        },

        /**
         * 定位当前tab在屏幕中的位置，第一个，最后一个或者中间
         * @private
         *
         * @parm {Object} elem 原生dom节点
         */
        _screenPos:function (index) {
            var me = this,
                lastIndex = me.data("tabNum") - 1;

            if (!index || index == lastIndex) {      //若是列表中的第一个或者最后一个，直接返回其索引
                return index;
            }

            var $navList = me.data("navList"),
                tabWidthSumArr = me.data("tabWidthSumArr"),
                lastAbsMoveXDis = Math.abs(me.data("myScroll").x) || 0,
                wrapOffset = $navList[0].offsetLeft - me.data("screenWrap")[0].offsetLeft, //第一个tab相对于wrap的偏移
                thisOffsetDis = tabWidthSumArr[index] + wrapOffset - lastAbsMoveXDis,
                preOffsetDis = tabWidthSumArr[index - 1] + wrapOffset - lastAbsMoveXDis,
                nextOffsetDis = tabWidthSumArr[index + 1] + wrapOffset - lastAbsMoveXDis,
                screenWidth = me.data("myScroll").wrapperW,
                thisWidth = parseInt($navList[index].offsetWidth),
                preWidth = parseInt($navList[index - 1].offsetWidth),
                screenPos = "middle";

            if (me.data("isDefTab")) {              //modified by zmm 默认选中的tab单独处理
                screenPos = "defTab";
                me.data("defTabMoveX", screenWidth - thisOffsetDis);
                return screenPos;
            }

            if (preOffsetDis < preWidth && nextOffsetDis > screenWidth) {     //当前tab的前一个tab出现半个同时其后一个tab也出现半个时
                screenPos = "middle";
            } else if (thisOffsetDis <= thisWidth || preOffsetDis < preWidth) {    //当前tab为半个或者其前面的tab是半个，则视为可显示区的第一个
                screenPos = "first";
            } else if (thisOffsetDis >= screenWidth || nextOffsetDis > screenWidth) {    //当前tab为半个tab或者其下一个tab为半个，则视为可显示区的最后一个
                screenPos = "last";
            } else {
                screenPos = "middle";
            }

            return screenPos;

        },

        /**
         * 转屏处理事件，主要针不滑动的导航栏
         * @private
         */
        _orientationEvent:function () {
            var me = this,
                myScroll = me.data("myScroll"),
                wrapOffsetWidth = me.data("wrapOffsetWidth"), //相对于所有tab宽度的差值
                defTab = me.data("defTab"),
                $navList = me.data("navList"),
                wrapOffset = $navList[0].offsetLeft - me.data("screenWrap")[0].offsetLeft;

            myScroll.refresh(); //modified by zmm, trace:FEBASE-343,FEBASE-341, 键盘出来的时候，iscroll中的refresh算的宽度不对，需要重新调用iscroll中的refresh
                                //在ex.js中统一处理的转屏延迟后，不需要再处理延迟了

            if (!me.data("isSwipe")) {
                me.data("listWrap").css("width", myScroll.wrapperW - wrapOffsetWidth + "px");
            }

            if (!me.data("isDefTab") && me.data("defTabMoved")) {
                myScroll.scrollTo(myScroll.wrapperW - me.data("tabWidthSumArr")[defTab] - wrapOffset, 0, 400);
                me.data("defTabMoved", false);
            }
        },

        /**
         * 事件处理中心
         * @private
         *
         * @param {object} e 事件对象
         */
        _eventHandler:function (e) {
            var me = this;

            switch (e.type) {
                case 'click':
                case 'tap':
                    me._switchEventHandle(e);
                    break;
                case 'touchmove':
                    me._touchMoveHandle(e);
                    break;
                case 'ortchange':
                    me._orientationEvent(e);
                    break;
            }
        },

        /**
         * @name destroy
         * @grammar destroy()  => undefined
         * @desc 销毁组件创建的dom及绑定的事件，同时调用iscroll中的destroy
         */
        destroy:function () {
            var me = this,
                fixElem = me.data('fixElem'),
                scrollTimer = me.data('scrollTimer'), //清除延迟
                nextPreTimer = me.data('nextPreTimer'),
                orientTimer = me.data('orientTimer');

            fixElem && fixElem.remove();
            scrollTimer && clearTimeout(scrollTimer);
            nextPreTimer && clearTimeout(nextPreTimer);
            orientTimer && clearTimeout(orientTimer);
            me.data('myScroll').destroy();

            me._super();
        }

        /**
         * @name Trigger Events
         * @theme event
         * @desc 组件内部触发的事件
         * - ***create*** : 组件创建时触发
         * - ***init*** : 组件初始化时触发
         * - ***onverticalswipe*** : 竖滑时触发的事件，如可以呼出其他组件
         * - ***ontabselect***: tab选中时触发的事件
         * @example
         * var refresh = $.ui.refresh(opts);
         * refresh.on('beforescrollstart', function(e){
         *      var target = e.target;
         *      while (target.nodeType != 1) target = target.parentNode;
         *      if (target.tagName != 'SELECT' && target.tagName != 'INPUT' && target.tagName != 'TEXTAREA'){
         *          e.preventDefault();
         *      }
         * });
         */

    }).attach('control.fix');

})(Zepto);

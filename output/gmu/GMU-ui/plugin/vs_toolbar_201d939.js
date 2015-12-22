///import ui.mobile.mobile;
///import ui.mobile.ex;
///import ui.mobile.widget;
///import ui.mobile.control;

/**
 * @file
 * @name Toolbar
 * @short Toolbar
 * @desc 工具栏组件 
 * @import mobile/mobile.js, mobile/ex.js, mobile/widget.js, mobile/control.js
 */
(function($) {
    /**
     * @desc   工具栏组件构造函数
     * **el**
     * 根元素选择器或者对象
     * **Options**
     * - *** container {selector|zepto}*** (可选)渲染到哪个元素 || document.body
     * - *** instanceId {String}***  (可选)实例标示
     * - *** titleText {String}*** (可选)标题文字
     * - *** backButtonText {String}*** (可选)返回按钮文字
     * - *** onBackButtonClick {Function}*** (可选)返回按钮的点击事件
     * - *** isPreventDefault {Boolean}*** (可选)是否取消move事件的默认行为
     * @name     $.ui.vs_toolbar
     * @grammar  $.ui.vstoolbar([el [,options]])  ⇒ instance
     * @example
     * var toolbarIns = $.ui.vs_toolbar($('#page_toolbar'), {
            instanceId:'blue',//针对不同的实例，可以写不同的css
            titleText:'焦点新闻',
            backButtonText:'返回', //实时,String,按钮文字
        });
     * 
     * @mode setup模式
     * @param {selector|zepto} el   根元素选择器或者对象
     * @param {Object} options 参数
     * @param {selector|zepto} options.container (必选)渲染到哪个元素 || document.body
     * @param {String} options.instanceId  (必选)实例标示
     * @param {String} options.titleText (可选)标题文字
     * @param {String} options.backButtonText (可选)返回按钮文字
     * @param {Function} options.onSearchButtonClick (可选)搜索按钮的点击事件
     * @param {Function} options.onBackButtonClick (可选)返回按钮的点击事件
     * @param {Function} options.onHomeButtonClick (可选)主页按钮的点击事件
     * @param {Function} options.onProductButtonClick (可选)产品切换按钮的点击事件
     * @param {Function} options.onTitleClick (可选)标题的点击事件
     * @param {Function} options.onTextButtonClick (可选)文本按钮的点击事件
     * @param {Function} options.onSendButtonClick (可选)发送按钮的点击事件
     * @param {Function} options.onGoBaiduButtonClick (可选)返回百度按钮的点击事件
     * @param {Boolean} options.isPreventDefault (可选)是否取消move事件的默认行为
     */
    $.ui.create('vs_toolbar', {

        _data: {
            titleText: '',
            // backButtonText: '返回',
            // //无图模式
            // onImageButtonClick:function() {
            //     console.log('image button click');
            // },
            // onProductButtonClick:function() {
            //     console.log('product button click');
            // },
            // onSearchButtonClick:function() {
            //     console.log('search button click');
            // },
            // onHomeButtonClick:function() {
            //     console.log('home button click');
            // },
            // onBackButtonClick:function() {
            //     console.log('back button click');
            //     history.back();
            // },
            // onTextButtonClick:function() {
            //     console.log('text button click');
            // },
            // onSendButtonClick:function() {
            //     console.log('send button click');
            // },
            // onGoBaiduButtonClick:function() {
            //     console.log('gobaidu button click');
            // },
            // onTitleClick:function() {
            //     console.log('title button click');
            // },
            // onSwipeUp:function() {
            //     console.log('title swipeUp');
            // },
            // onSwipeDown:function() {
            //     console.log('title swipeDown');
            // },
            // onMoreButtonClick:function() {
            //     console.log('more button click');
            // },
            // onTextSmallerButtonClick:function() {
            //     console.log('text smaller button click');
            // },
            // onTextBiggerButtonClick:function() {
            //     console.log('text bigger button click');
            // },
            isShow:true,
            // isNewPageProduct: true,
            // isTitleClickable: false,
            // onverticalswipeup:function(e) {},
            // onverticalswipedown:function(e){},
            // isPreventDefault:true
        },

        _create: function() {
            var me = this,
                $elem = me.widget(),
                buttons = $elem.find(".ui-toolbar-btn");;

            // if (me.data('instanceId')) {
            //     $elem.addClass(me.data('instanceId'));
            // }
            
            // me.data('titleContainer', $('.ui-toolbar-title', $elem));
            me.data("buttons", buttons);

            me.trigger('create');
        },

        _init: function() {
            var me = this,
                btns = me.data("buttons");

            // _onTitleClick = function(e){
            //     var btn = me.data('titleContainer');

            //     if(me.data('isTitleClickable')){
            //         if($('.ui-toolbar-title-up-arrow', me.widget()).length > 0){
            //             btn.removeClass('ui-toolbar-title-up-arrow')
            //                 .addClass('ui-toolbar-title-down-arrow');
            //         }
            //         else{
            //             btn.removeClass('ui-toolbar-title-down-arrow')
            //                 .addClass('ui-toolbar-title-up-arrow');
            //         }
            //     }

            //     $.later(function(){
            //         me.data('onTitleClick')(e);
            //     }, 200);
            // };

            // $elem.swipeUp(_onSwipeUp);
            // console.log(me.data('onSwipeUp'))
            // $elem.swipeDown(_onSwipeDown);

            for(var i = 0, iLen = btns.length; i < iLen; i++) {
                (function(){
                    var btn = $(btns[i]);
                    btn.on('touchend', function(e){
                        btn.toggleClass('press');
                        $.later(function(){
                            btn.toggleClass('press');
                        }, 300);
                    });
                })();
            }
            
            // me.data('productButton')
            //     .on('touchend', function(){
            //         var btn = me.data('productButton'),
            //             arrowBtn = me.data('productButtonUpDownArrow');

            //         btn.toggleClass('ui-toolbar-productbtn-press');
            //         $.later(function(){
            //             btn.toggleClass('ui-toolbar-productbtn-press');
            //         }, 300);

            //         if(!me.data('isNewPageProduct')){
            //             if($('.ui-toolbar-backcon .ui-toolbar-up-arrow', me.widget()).length > 0){
            //                 arrowBtn.removeClass('ui-toolbar-up-arrow')
            //                     .addClass('ui-toolbar-down-arrow');
            //             }
            //             else{
            //                 arrowBtn.removeClass('ui-toolbar-down-arrow')
            //                     .addClass('ui-toolbar-up-arrow');
            //             }
            //         }
            //     })
            //     .on('click', _onProductButtonClick);

            // me.data('searchButton')
            //     .on('touchend', function(e){
            //         var btn = me.data('searchButton');
            //         btn.toggleClass('ui-toolbar-searchbtn-press');
            //         $.later(function(){
            //             btn.toggleClass('ui-toolbar-searchbtn-press');
            //         }, 300);
            //     })
            //     .on('click', _onSearchButtonClick);

            // me.data('homeButton')
            //     .on('touchend', function(e){
            //         var btn = me.data('homeButton');
            //         btn.toggleClass('ui-toolbar-homebtn-press');
            //         $.later(function(){
            //             btn.toggleClass('ui-toolbar-homebtn-press');
            //         }, 300);
            //     })
            //     .on('click', _onHomeButtonClick);

            // me.data('backButton')
            //     .on('touchend', function(e){
            //         var btn = me.data('backButton');
            //         btn.toggleClass('ui-toolbar-backbtn-press');
            //         $.later(function(){
            //             btn.toggleClass('ui-toolbar-backbtn-press');
            //         }, 300);
            //     })
            //     .on('click', _onBackButtonClick);

            // me.data('textButton')
            //     .on('touchend', function(e){
            //         var btn = me.data('textButton');
            //         btn.toggleClass('ui-toolbar-textbtn-press');
            //         $.later(function(){
            //             btn.toggleClass('ui-toolbar-textbtn-press');
            //         }, 300);
            //     })
            //     .on('click', _onTextButtonClick);

            // me.data('sendButton')
            //     .on('touchend', function(e){
            //         var btn = me.data('sendButton');
            //         btn.toggleClass('ui-toolbar-sendbtn-press');
            //         $.later(function(){
            //             btn.toggleClass('ui-toolbar-sendbtn-press');
            //         }, 300);
            //     })
            //     .on('click', _onSendButtonClick);

            // me.data('goBaiduButton')
            //     .on('touchend', function(e){
            //         var btn = me.data('goBaiduButton');
            //         btn.toggleClass('ui-toolbar-gobaidubtn-press');
            //         $.later(function(){
            //             btn.toggleClass('ui-toolbar-gobaidubtn-press');
            //         }, 300);
            //     })
            //     .on('click', _onGoBaiduButtonClick);
            
            // me.data('textSmallerButton')
            //     .on('touchend', function(e){
            //         var btn = me.data('textSmallerButton');
            //         btn.toggleClass('ui-toolbar-textsmallerbtn-press');
            //         $.later(function(){
            //             btn.toggleClass('ui-toolbar-textsmallerbtn-press');
            //         }, 300);
            //     })
            //     .on('click', _onTextSmallerButtonClick);
            // me.data('textBiggerButton')
            //     .on('touchend', function(e){
            //         var btn = me.data('textBiggerButton');
            //         btn.toggleClass('ui-toolbar-textbiggerbtn-press');
            //         $.later(function(){
            //             btn.toggleClass('ui-toolbar-textbiggerbtn-press');
            //         }, 300);
            //     })
            //     .on('click', _onTextBiggerButtonClick);
            // me.data('moreButton')
            //     .on('touchend', function(e){
            //         var btn = me.data('moreButton');
            //         btn.toggleClass('ui-toolbar-morebtn-press');
            //         $.later(function(){
            //             btn.toggleClass('ui-toolbar-morebtn-press');
            //         }, 300);
            //     })
            //     .on('click', _onMoreButtonClick);
            // me.data('titleContainer')
            //     .on('click', _onTitleClick);

            me.trigger('init');
        },

        /**
         * @desc 打开工具栏面板
         * @name     show
         * @grammar  show()  ⇒ self
         */
        show: function() {
            var me = this,
                $elem = me.widget();

            if (!me.data('isShow')) {
                me.trigger('beforeshow');
                me.data('isShow', true);
                $elem.show();
                me.trigger('aftershow');
            }
            return me;
        },

        /**
         * @desc 关闭工具栏面板
         * @name     hide
         * @grammar  hide()  ⇒ self
         */
        hide: function() {
            var me = this,
                $elem = me.widget();

            if (me.data('isShow')) {
                me.data('isShow', false);
                me.trigger('beforehide');
                $elem.hide();
                me.trigger('afterhide');
            }
            return me;
        },

        /**
         * @desc 打开/关闭工具栏面板。
         * - 如果工具栏是打开的，执行toggle方法后会关闭工具栏
         * - 如果工具栏是关闭的，执行toggle方法后会打开工具栏
         * @name     toggle
         * @grammar  toggle()  ⇒ self
         * @example
         * toolbarIns.toggle();
         */
        toggle:function(){
            var me = this,
                $elem = me.widget();
            if (me.data('isShow')) {
                me.hide();
            }else{
                me.show();
            }
            return me;
        },

        /**
         * @desc 获取/设置返回按钮的文字。
         * - 如果不设置参数，返回返回按钮的文字
         * - 如果设置参数，设置返回按钮的文字为参数
         * @name backButtonText
         * @grammar  backButtonText()  ⇒ string
         * @grammar  backButtonText(value)  ⇒ self
         * @example
         * toolbarIns.backButtonText();
         * toolbarIns.backButtonText("value");
         */
        // backButtonText: function() {
        //     var me = this,
        //             $elem = me.widget();
        //     if (arguments[0] != undefined) {
        //         me.data('backButtonText', arguments[0]);
        //         $('.ui-toolbar-backbtn .ui-toolbar-content', $elem).text(arguments[0]);
        //         return me;
        //     } else {
        //         return me.data('backButtonText');
        //     }
        // },

        /**
         * @desc 获取/设置标题的文字
         * - 如果不设置参数，返回返回标题的文字
         * - 如果设置参数，设置返回标题的文字为参数
         * @name titleText
         * @grammar  titleText()  ⇒ string
         * @grammar  titleText(value)  ⇒ self
         * @example
         * toolbarIns.titleText();
         * toolbarIns.titleText("value");
         */
        // titleText: function() {
        //     var me = this,
        //             $elem = me.widget();
        //     if (arguments[0] != undefined) {
        //         me.data('titleText', arguments[0]);
        //         $('.ui-toolbar-title', $elem).text(arguments[0]);
        //         return me;
        //     } else {
        //         return me.data('titleText');
        //     }
        // },

        // closeTitle: function() {
        //     var me = this, btn = me.data('titleContainer');

        //     btn.removeClass('ui-toolbar-title-up-arrow')
        //         .addClass('ui-toolbar-title-down-arrow');
        // },

        // openTitle: function() {
        //     var me = this, btn = me.data('titleContainer');

        //     btn.removeClass('ui-toolbar-title-down-arrow')
        //         .addClass('ui-toolbar-title-up-arrow');
        // },

        // openProduct: function() {
        //     var me = this, btn = me.data('productButtonUpDownArrow');

        //     btn.removeClass('ui-toolbar-down-arrow')
        //         .addClass('ui-toolbar-up-arrow');
        // },

        // closeProduct: function() {
        //     var me = this, btn = me.data('productButtonUpDownArrow');

        //     btn.removeClass('ui-toolbar-up-arrow')
        //         .addClass('ui-toolbar-down-arrow');
        // },
        
        /**
         * @desc 销毁组件。会移除toolbar和其components上的所有事件监听。
         * @name destroy
         * @grammar  destroy()  ⇒ undefined
         * @example
         * toolbarIns.destroy();
         */
        destroy: function () {
            var me = this;

            me.widget().off();

            me._super();
        }

    }).attach('control.fix');
})(Zepto);

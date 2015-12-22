


/**
 * @file
 * @name More
 * @desc 显示一个包含更多选项的下拉框
 * @import mobile/mobile.js, mobile/ex.js, mobile/widget.js, mobile/control.js
 */

(function($, undefined) {
    /**
     * @name       $.ui.more
<<<<<<< .mine
     * @grammar    $.ui.more(el [,options]) => instance
=======
     * @grammar    $.ui.more(el [,options]) =>instance
>>>>>>> .r4545
     * @desc 组件构造器
     * **el**
     * 根元素选择器或者对象
     * **Options**
     * - ***options.container {selector|zepto}*** (可选)放置的父容器
     * - ***options.content {Array}*** ((必选)内容
     * - ***options.count {Number}*** (可选)列数
     * - ***options.isShow {Boolean}*** (可选)是否默认展开
     * @example
     * var more1 = $.ui.more($('<div class="ui-more"></div>'),{
     *      'container': '.nav-wrap',
     *      content:links,
     *      oncreate:function(){}
     *  });
     */
    $.ui.create('more', {
        _data:{
			container: "",
            content: [],
            count: 5,
            isShow: false
        },
        _create: function() {
            var me = this,
                $el = me.widget(),rowTpl=[],tpl=[],rowConts=[], i, 
                $container = $(me.data('container')|| document.body)[0], //只处理第一个元素
                conts=me.data('content').concat(), //数组引用 -- by gsl
                count=me.data('count'),
                width=parseInt(100/count);
			//判断链接数据合法性
			if(!$.isArray(conts) || conts.length < 1) return;

            while(conts.length>count){
                rowConts.push(conts.splice(0,count));
            }
            if(conts.length){
                rowConts.push(conts);
            }
			//设定默认el
            if($el == undefined) {
                $el = me.widget($('<div class="ui-more"></div>'));
            }  
			//$container = $(me.data('container')|| document.body)[0];
			
			if(!$el.hasClass('ui-more')) $el.addClass('ui-more');
            tpl.push('<div class="ui-more-arrow"></div>');

            rowConts.forEach(function (rowCont) {
                rowTpl=['<div class="ui-more-links">'];
                rowCont.forEach(function(cont,itemNum){
                    var style="width:"+width+"%;"+(itemNum==count-1?"-webkit-box-flex:1":""),
                        key = cont.key || "word";     //增加各产品线搜索的key值, modified by zmm
                    rowTpl.push('<a href="'+cont.url+'" class="ui-more-link" data-key="' + key + '" style="'+style+'"><span>'+cont.text+'</span></a>');
                });
                rowTpl.push("</div>");
                tpl.push(rowTpl.join(''));
            });
			
				
			$el.html(tpl.join(''));
				
			//.appendTo($container);
			
			if($el.parent().length && !me.data('container')){
                    //如果$elem有parent，且没有传入container，不需要appendTo
             } else {
				if (!$el.parent().length) $el.appendTo($container);
             }
            me.trigger('create');
        },

        _init: function() {
            var me = this,
                $el = me.widget();
            if(!me.data('isShow')) $el.hide();
            me.trigger('init');
        },

        /**
         * @name show
         * @grammar show() => self
         * @desc 显示more面板
         */
        show: function() {
            var me = this,
                $el = me.widget();
            me.data('isShow',true);
			$el.show();
			me.trigger('aftershow');
            return me;
        },

        /**
         * @name hide
         * @grammar hide() => self
         * @desc 隐藏more面板
         */
        hide: function() {
            var me = this,
               $el = me.widget();
            me.data('isShow','');
			$el.hide();
			me.trigger('afterhide');
            return me;
        }

        /**
         * @name Trigger Events
         * @theme event
         * @desc 组件内部触发的事件
         * - ***create*** : 组件创建时触发
         * - ***init*** : 组件初始化时触发
         * - ***aftershow*** : 显示后触发的事件
         * - ***afterhide*** : 隐藏后触发的事件
         */
    });
})(Zepto);

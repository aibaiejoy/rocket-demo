(function($){

rocket.pageview.index = rocket.pageview.extend({

    el: '#index_page'


    ,init: function(options){
        var me = this;
        
        //dom 存在，使用setup
        me.setup(new rocket.subview.index_header(
            $.extend({}, options)
            , me
        ));
        
        me.setup( new rocket.subview.index_footer(
            $.extend({}, options)
            , me
        ));
        
        me.setup( new rocket.subview.index_content(
            $.extend({}, options)
            , me
        ));

        //添加自定义分享。
        //new rocket.subview.ui_shareWx({}, me);
    }
});

})(Zepto);

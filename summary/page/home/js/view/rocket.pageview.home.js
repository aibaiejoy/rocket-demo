(function($){

rocket.pageview.home = rocket.pageview.extend({

    el: '#home_page'

    ,init: function(options){
        var me = this;
        
        //dom 存在，使用setup
        me.setup(new rocket.subview.home_header(
            $.extend({}, options)
            , me
        ));
        
        me.setup( new rocket.subview.home_footer(
            $.extend({}, options)
            , me
        ));
        
        me.setup( new rocket.subview.home_content(
            $.extend({}, options)
            , me
        ));
    }
});

})(Zepto);

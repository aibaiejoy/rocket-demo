(function($){

rocket.pageview.detail = rocket.pageview.extend({

    el: '#detail_page'

    ,init: function(options){
        var me = this;
        //dom 存在，使用setup
        me.setup(new rocket.subview.detail_header(
            $.extend({}, options)
            , me
        ));
        
        me.setup( new rocket.subview.detail_content(
            $.extend({}, options)
            , me
        ));
        
        /*me.setup( new rocket.subview.detail_footer(
            $.extend({}, options)
            , me
        ));*/
    }

});

})(Zepto);

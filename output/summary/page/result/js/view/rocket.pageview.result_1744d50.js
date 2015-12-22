(function($){

rocket.pageview.result = rocket.pageview.extend({

    el: '#result_page'

    ,init: function(options){
        var me = this;

        //$.localStorage("SUMMARY_isShared", true);

        me.setup( new rocket.subview.result_footer(
            $.extend({}, options)
            , me
        ));
        
        me.setup( new rocket.subview.result_content(
            $.extend({}, options)
            , me
        ));
    }

    ,registerEvents: function(){
        var me = this,
            ec = me.ec;

        ec.on('pagebeforechange', me.onpagebeforechange, me);
    }

    ,onpagebeforechange: function(params){
        var me = this,
            ec = me.ec,
            from = params.from,
            to = params.to,
            param = params.params;
        
        if(to == me){
            me.$dialog && me.$dialog.hide();
        }
    }
});

})(Zepto);

(function($){

rocket.subview.index_header = rocket.subview.extend({

    el: '#index_page header'

    , events: {
        "click" : "onheaderclick"
    }

    ,init: function(options){
        var me = this;

        me.options = options;
        me.show();
    }

    , registerEvents: function(){
        var me = this;
    }

    , onheaderclick:function(){
        
        var me = this
            , router = "" ;
        
        me.navigate(router);
    } 

});

})(Zepto);

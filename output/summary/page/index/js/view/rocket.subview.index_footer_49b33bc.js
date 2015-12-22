(function($){

rocket.subview.index_footer = rocket.subview.extend({

    el: '#index_page > .page-footer'

    , events: {

    }

    ,tpl: ""

    ,init: function(options){
        var me = this;

        me.showLoading(me.$el);
        me.render();
    }

    , registerEvents: function(){
        var me = this;
    }

    ,render: function(){
        var me = this;

        me.$el.append(
            _.template(
                me.tpl
                , {
                    pageName: '标题'        
                }
            )
        );

        me.show();

        me.hideLoading(-1);
    }   

});

})(Zepto);

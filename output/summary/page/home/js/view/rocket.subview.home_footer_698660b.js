(function($){

rocket.subview.home_footer = rocket.subview.extend({

    el: '#home_page > .page-footer'

    , events: {
        "click .home-start" : "onHomeStart"
    }

    ,tpl: ""

    ,init: function(options){
        var me = this;

        me.showLoading(me.$el);
        me.render();
    }

    , registerEvents: function(){
        var me = this;
        me.ec.on("homeStartAble", me.homeStartAble, me);
        me.ec.on("homeStartDisable", me.homeStartDisable, me);
    }

    , homeStartAble: function(){
        var me = this;
        me.$(".home-start").addClass("able");
    }

    , homeStartDisable: function(){
        var me = this;
        me.$(".home-start").removeClass("able");
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
    ,onHomeStart:function(){
        var me = this,
            route = "#detail/"+cids[0];
        $.localStorage("cids", cids.join(","));
        if(cids.length >= 3){
            me.navigate(route);
        }

    } 

});

})(Zepto);

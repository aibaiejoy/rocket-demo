(function($){
 
rocket.globalview.gotop = rocket.globalview.extend({
     
    el: '#gotop_globalview'

    ,events: {
        'click': 'onclick'
    }

    ,init: function(options){
        var me = this;

        me.isEnabled = true;
        me.initGoTop();
    }

    ,initGoTop: function(){
        var me = this,
            gotopTimeOut;

        $.ui.gotop(me.$el, {
            useAnim: false
            , touchendHandler: function(){
                var self = this;
                clearTimeout(gotopTimeOut);
                if(window.pageYOffset > $(window).height()
                    && me.isEnabled){
                    gotopTimeOut = setTimeout(function(){
                        self.show();
                    },1000);
                }else{
                    self.hide();
                }
                return false;
            }
        }).fix({
            bottom:60
            , right:10
        });
    }

    ,registerEvents: function(){
        var me = this, ec = me.ec;

        me.on('routechange', me.onroutechange, me);
    }

    ,onroutechange: function(params){
        var me = this,
            from = params.from || null,
            to = params.to || null,
            fromAction = from && from.action || null,
            toAction = to && to.action || null,
            pageviews = params.pageviews;

        if(toAction == 'managesubscribe'){
            me.isEnabled = false;
        }
        else{
            me.isEnabled = true;
        }
    }

    ,onclick: function(e){
        var me = this;

        me.$el.addClass('press');

        setTimeout(function(){
            me.$el.removeClass('press');
        }, 300);

        _ss({"act": "gotop"});

    }

});

 })(Zepto);


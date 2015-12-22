(function($){

rocket.subview.result_footer = rocket.subview.extend({

    el: '#result_page > .result-footer'

    , events: {
        "click .share-btn":"shareRank"
    }

    ,tpl: ""

    ,init: function(options){
        var me = this;
        me.showLoading(me.$el);
        me.render();
    }

    , registerEvents: function(){
        var me = this;
        me.on('pagebeforechagne', me.onpagebeforechange, me);
    }

    , unregisterEvents: function(){
        me.off('pagebeforechagne', me.onpagebeforechange, me);
    }

    , shareRank: function(){
        var me = this;
        function _isWeiXin(){
            return /micromessenger/i.test(navigator.userAgent);
        }
        
        var addClassName = _isWeiXin() ? "share-rank-dialog":"share-rank-dialog-other";
        me.ec.$dialog = $("<div><div>").addClass(addClassName);
        me.ec.$dialog.on('click', function(){
            this.remove();
        })
        me.ec.$el.append(me.ec.$dialog);
    }

    , onpagebeforechange:function(){
        var me = this;
        me.$dialog.hide();
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

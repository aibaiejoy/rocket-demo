;(function($){

rocket.subview.home_content = rocket.subview.extend({

	el : '#home_page_content'

	, init : function(options){
		var me = this;

		me.isFirstLoad = true;
		
		me.model = new rocket.model.home(
            null,
            $.extend({}, options)
        )
		me.show();
		me.showLoading();
		me.render();
	}

	,registerEvents: function(){
        var me = this,
            ec = me.ec;

        // @note: 子页面级别的事件，避免使用页面级别事件中心ec
        //me.model.on('change', me.render, me);
        // ec.on("pagebeforechange", me.onpagebeforechange, me)
        
        //$(window).on("resize", $.proxy(me.resize, me));
    }

    , unregisterEvents: function(){
        var me = this,
            ec = me.ec;

        //me.model.off('change', me.render, me);
        //ec.off("pagebeforechange", me.onpagebeforechange);
        //$(window).off("resize", $.proxy(me.resize, me));
        
    }

    ,selectCompany:function(){
        var me = this;
    }

    , onpagebeforechange: function(params){

        var me = this, 
            from = params.from,
            to = params.to,
            param = params.params;

        if(to == me.ec ){

            if(me.isFirstLoad){
                if(me.loadingLock){
                    return;
                }
                me.loadingLock = true;
                me.model.fetch({
                	type:"POST"
                    , success: function(model){
                        //me.scrollSection(param);
                        me.isFirstLoad = false;
                        me.loadingLock = false;
                        
                    }        
                    , error: function(){
                        me.loadingLock = false;
                    }
                });
            }
            else{
                //me.ec.trigger('titlechange', {title: me.zTitle});
                //me.scrollSection(param);
            }

            // @note: 平滑子页面，显示不隐藏
            me.$el.show();
        }

    }

	, render: function(result){

		var me = this;

		var options = me.options || {};
        
        me.append( new rocket.subview.home_content_clist(
            $.extend({}, options)
            , me
        ));

		me.hideLoading();
	}
})
})(Zepto);

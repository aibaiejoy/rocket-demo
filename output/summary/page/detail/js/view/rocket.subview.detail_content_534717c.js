(function($){

	rocket.subview.detail_content = rocket.subview.extend({
		el : '#detail_page_content'

		, init : function(options){
			var me = this,
				subview, 
				spm;

			spm = me.getSubpageManager({
				subpageClass : rocket.subpageview.detail_content
				, maxSubpages: 11
				, subpageTransition: 'simple'
			})

			subView = new rocket.subpageview.detail_content(
				$.extend({}, options)
				, me
			);

			me.append(subView);
			spm.registerSubpage(me.featureString, subView);
		}

		,registerEvents: function(){
	        var me = this,
	            ec = me.ec;

	        // @note: 子页面级别的事件，避免使用页面级别事件中心ec
	        ec.on("pagebeforechange", me.onpagebeforechange, me)
	    }

	    , unregisterEvents: function(){
	        var me = this,
	            ec = me.ec;

	        ec.off("pagebeforechange", me.onpagebeforechange);
	    }

	    , onpagebeforechange: function(params){
	    	var me = this, 
	    		to = params.to, 
	    		param = params.params ;

	    	if( to == me.ec ){
	    		me.show();
	    	}

	    }
	})
})(Zepto);
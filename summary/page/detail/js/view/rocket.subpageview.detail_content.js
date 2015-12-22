(function($){

	rocket.subpageview.detail_content = rocket.subpageview.extend({
		
		className: 'detail-view-subpage'

		, cidList:{
	        "1001":"baidu",
	        "1002":"ali",
	        "1003":"qq",
	        "1004":"xiaomi",
	        "1005":"jd",
	        "1006":"lenovo",
	        "1007":"360",
	        "1008":"huawei",
	        "1009":"jumei",
	        "10010":"momo",
	        "10011":"chuizi"
	    }

		, tpl: __inline("../../tpl/detail_content.tpl.html")

        ,events:{
            "click .c-content-title":"onPlayerClick"

        }

		, init : function(options){
			var me = this;

			me.isFirstLoad = true;

			me.model = new rocket.model.detail(
	            null,
	            $.extend({}, options)
	        )

	        me.cidList = me.model.getCidList();

			me.show();
			me.showLoading(me.$el);
		}

		,registerEvents: function(){
	        var me = this,
	            ec = me.ec;

	        // @note: 子页面级别的事件，避免使用页面级别事件中心ec
	        me.model.on('change', me.render, me);
	        ec.on("pagebeforechange", me.onpagebeforechange, me)
	    }

	    , unregisterEvents: function(){
	        var me = this,
	            ec = me.ec;

	        me.model.off('change', me.render, me);
	    }

	    , onsubpagebeforechange: function(params){
	        var me = this, 
	            from = params.from,
	            to = params.to,
	            param = params.params,
	            featureString = me.getFeatureString(param);

	        if(to == me.ec 
	            && featureString == me.featureString){

	            if(me.isFirstLoad){
	                if(me.loadingLock){
	                    return;
	                }
	                me.loadingLock = true;
	                me.model.fetch({
	                	type:"POST"
	                    , success: function(model){
	                        //debugger;
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
	            }

	            // @note: 平滑子页面，显示不隐藏
	            me.$el.show();
	        }

	    }

	    ,onPlayerClick:function(e){
	    	var me = this,
	    		$el = $(e.currentTarget),
	    		data = $el.data();
	    	me.scrollY = window.scrollY;
	    	
	    	var $content = $("<p></p>").text(data.content),
	    		$title = $("<h3></h3>").addClass("detail-content-dialog-title").text(data.title)
	    		$img = $("<img/>").attr("src", data.imgsrc),
	    		$close = $("<span></span>").addClass("detail-content-dialog-close"),
	    		$dialogInner = $("<div></div>").addClass("detail-content-dialog-inner")
	    		.append($title).append($img).append($content).append($close),
	    		$dialog = $("<div></div>").append($dialogInner);
	    	$dialog.addClass("detail-content-dialog");
	    	$dialog.on('click', function(){
	    		$dialog.remove();
	    		window.scrollTo(0, me.scrollY);
	    	});
	    	me.$el.append($dialog);
	    	window.scrollTo(0, 0);
	    }

		, render: function(result){
			var me = this,
				_logoIcon = me.cidList[me.options.cid];

			var data = result.toJSON();
			me.ec.detailData = data;
			me.$el.html(
				_.template(
					me.tpl
					, $.extend({logoIcon:_logoIcon}, data, me.options)
				)
			)

			me.append( new rocket.subview.detail_footer(
		        $.extend({}, me.options)
		        , me
		    ));

			me.hideLoading();
		}
	})
})(Zepto);
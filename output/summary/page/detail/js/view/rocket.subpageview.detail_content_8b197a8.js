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

		, tpl: "<div class=\"c-name\"><span class=\"logo-icon logo-<%=logoIcon%>\">待评公司</span></div>\n<div class=\"c-content\">\n\t<div class=\"c-content-scroll\">\n\n\t\t<table class=\"c-content-table\">\n\t\t\t<tr class=\"first-tr\">\n\t\t\t\t<th class=\" c-content-table-title\"><span>【自评】</span>业绩回顾</th>\n\t\t\t\t<th class=\"even\">得分</th>\n\t\t\t</tr>\n\t\t\t<% if(errno == 0){%>\n\t\t\t\t<% _.each(data.self.list, function(item, i){ %>\n\t\t\t\t<tr>\n\t\t\t\t\t<td data-content=\"<%=item.content%>\" \n\t\t\t\t\t\tdata-imgsrc=\"<%=item.imgsrc%>\"\n\t\t\t\t\t\tdata-title=\"<%=item.title%>\"\n\t\t\t\t\t\tclass=\"c-content-title\">\n\t\t\t\t\t\t<%=item.title%> &gt;\n\t\t\t\t\t</td>\n\t\t\t\t\t<% if(i == 0){ %>\n\t\t\t\t\t<td class=\"even c-content-self-score\" rowspan=\"<%=data.self.list.length%>\"><%=data.self.score%></td>\n\t\t\t\t\t<% } %>\n\t\t\t\t</tr>\n\t\t\t\t<% }) %>\t\n\t\t\t<% } %>\n\t\t</table>\n\n\t\t<table class=\"c-content-table\">\n\t\t\t<tr>\n\t\t\t\t<th class=\"c-content-table-title\"><span>【他评】</span>同行&媒体观点</th>\n\t\t\t\t<th class=\"even\">得分</th>\n\t\t\t</tr>\n\t\t\t<% if(errno == 0){%>\n\t\t\t\t<% _.each(data.other, function(item, i){ %>\n\t\t\t\t<tr>\n\t\t\t\t\t<td data-content=\"<%=item.content%>\" \n\t\t\t\t\t\tdata-imgsrc=\"<%=item.imgsrc%>\"\n\t\t\t\t\t\tdata-title=\"<%=item.title%>\"\n\t\t\t\t\t\tclass=\"c-content-title\">\n\t\t\t\t\t\t<img src=\"<%= item.avatarsrc %>\"><%=item.title%> &gt;\n\t\t\t\t\t</td>\n\t\t\t\t\t<td class=\"even c-content-self-score\"><%= item.score %></td>\t\n\t\t\t\t</tr>\n\t\t\t\t<% }) %>\t\n\t\t\t<% } %>\n\t\t</table>\n\t\t\n\t</div>\n</div>\n\n\n"

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
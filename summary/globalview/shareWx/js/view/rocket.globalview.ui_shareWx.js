;(function($){
	
rocket.globalview.ui_shareWx = rocket.globalview.extend({
	init:function(options){
		var me = this;

		me.model = new rocket.model.ui_shareWx(
			null,
			$.extend({}, options)
		);

		me.model.fetch({
			success: function(data){
				
				var data = data.toJSON();
				wx.config({
					debug: false,
					appId: 'wxf3c5150a1ba3beb5',
					timestamp: data.timestamp,
					nonceStr: data.nonceStr,
					signature: data.signature,
					jsApiList: [
						'onMenuShareTimeline',
						'onMenuShareAppMessage'
					]
				});
			}
		});
	}
})

})(Zepto);
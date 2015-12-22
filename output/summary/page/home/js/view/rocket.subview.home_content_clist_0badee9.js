;(function($){

rocket.subview.home_content_clist = rocket.subview.extend({

	className : 'company-list'

    , tagName: 'ul'

    , events:{
        "click li":"selectCompany"
    }

    , tpl:"<li data-cid='1001' class='logo-baidu'></li>\n<li data-cid='1002' class='logo-ali'></li>\n<li data-cid='1003' class='logo-qq'></li>\n<li data-cid='1004' class='logo-xiaomi'></li>\n<li data-cid='1005' class='logo-jd'></li>\n<li data-cid='1006' class='logo-lenovo'></li>\n<li data-cid='1007' class='logo-360'></li>\n<li data-cid='1008' class='logo-huawei'></li>\n<li data-cid='1009' class='logo-jumei'></li>\n<li data-cid='10010' class='logo-momo'></li>\n<li data-cid='10011' class='logo-chuizi'></li>\n"

	, init : function(options){
		var me = this;

		me.x = 0;
        me.y = 0;
        me.tw = $('body').width();
		me.show();
		me.render();
        window.cids = window.cids || [];
        
	}

    , selectCompany:function(e){
        var me = this,
            $ele = $(e.currentTarget),
            data = $ele.data();

        if($ele.hasClass("checked")){
            for (var i = cids.length - 1; i >= 0; i--) {
                if(cids[i] == data.cid){
                    $ele.removeClass("checked");
                    cids.splice(i, 1);
                    break;
                }
            }
        }else{
            $ele.addClass("checked");
            cids.push(data.cid);
        }

        if(cids.length >= 3){
            me.ec.trigger("homeStartAble")
        }else{
            me.ec.trigger("homeStartDisable")
        }
    }

	, render: function(result){

		var me = this;

		var options = me.options || {};
        
        me.$el.html(
                _.template(me.tpl, {})
        );

		me.hideLoading();
	}
})
})(Zepto);

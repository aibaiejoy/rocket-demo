;(function($){

rocket.subview.home_content_clist = rocket.subview.extend({

	className : 'company-list'

    , tagName: 'ul'

    , events:{
        "click li":"selectCompany"
    }

    , tpl:__inline("../../tpl/home_content_clist.tpl.html")

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

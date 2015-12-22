(function($){

rocket.subview.detail_header = rocket.subview.extend({

    el: '#detail_page > header'

    , events: {
        'click .btn-back': 'onBackButtonClick'
        ,'click .ui-toolbar-title': 'onTitleClick'
    }

    ,init: function(options){
        var me = this;

        me.$title = me.$('.ui-toolbar-title');
        me.show();
    }

    , registerEvents: function(){
        var me = this,
            ec = me.ec;

        ec.on('pagebeforechange', me.onpagebeforechange, me);
    }

    ,onpagebeforechange: function(params){
        var me = this,
            ec = me.ec,
            from = params.from, 
            to = params.to, 
            param = params.params;

        if(to == ec){
            me.from = from;
            me.type = param.type;
        }
    }

    ,onBackButtonClick: function(e){
        var me = this,
            upRoute = webappandroid.levelnav.getUpLevel(
                me.ec.action
            ),
            route;

        // 应用内导航过来，回到上一级页面
        if(upRoute){
            me.navigate(upRoute.route);
        }
        // 页面第一次打开，比如微信中分享，回首页
        else if(history.length <= 1){
            me.navigate('#index');
        }
        // 第三方页面或者当前页面被刷新（history.length > 1），使用历史返回
        else{
            history.back();
        }
    }

    ,onTitleClick: function(e) {
        var me = this,
            upRoute = webappandroid.levelnav.getUpLevel(
                me.ec.action
            ),
            route;

        // 应用内导航过来，回到上一级页面
        if(upRoute){
            route = upRoute.route;
        }
        else{
            route = 'index';
        }

        me.navigate(route);
    }

});

})(Zepto);

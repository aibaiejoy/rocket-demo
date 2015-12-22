;(function($) {

rocket.model.ui_shareWx = rocket.model.extend({

    initialize: function(attributes, options){
        var me = this,
            opt = options,
            classInfo, catId;

        me.options = options;

        me.type = opt.type;

    }

    ,getRequestInfo: function(nameInRouter){
        var me = this,
            info = {
                method: 'GET'
                ,querystring: '?tn=bdapiweixin_auth&appid=wxf3c5150a1ba3beb5&url='+ 
                    encodeURIComponent(location.href.split('#')[0])
            }
        return info;
    }
    
    ,urlHandler: function() {
        var handler = location.host.toLowerCase() 
            == 'news.baidu.com'
            ? '/i' : '/news';

        return handler;
    }

    ,fetch: function(options){
        var me = this,
            info = me.getRequestInfo(me.type),
            opt = $.extend({
                type: info.method 
                , url: me.urlHandler() + (info.querystring || '') 
                , data: {} 
            }, options);

        return Backbone.Model.prototype.fetch.call(me, opt);
    }

});

})(Zepto);

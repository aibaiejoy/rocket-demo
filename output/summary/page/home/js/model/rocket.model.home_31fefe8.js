(function($) {

rocket.model.home = rocket.model.extend({

    initialize: function(attributes, options){
        var me = this,
            opt = options,
            classInfo, catId;

        me.options = options;

        me.type = opt.type;

    }

    ,getRequestInfo: function(nameInRouter){
        // debugger;
        var me = this,
            info = {
                method: 'POST'
                , querystring: '?tn=bdapiworldcup&from=' +
                    ( webappandroid.helper.isBdbox ? "shijiebeibdbox" : "shijiebeiwebapp" )
            }

        return info;
    }
    
    ,urlHandler: function() {
        var handler = location.host.toLowerCase() 
            == 'news.baidu.com'
            ? '/i' : '/news';

        return handler;
    }

    ,parseLive: function(liveData){
        
        _.each(liveData, function(item, home){
            
            item._txt = item.status == 0 ? '即将开始': item.status == 1 ? '正在直播' : '已结束';
            item._status = item.status != 1 ? 'lived': 'living';
        })
        
        return liveData;
    }
    
    ,parseRank:function(data){
        var _t = data.type;
        data._type = _t.substr(3, _t.length - 4);;
        return data;
    }


    ,parse: function(data){
        if(!data){
            return {};
        }
        var me = this;
        data.data.live = me.parseLive(data.data.zhibo || []);
        data.data.rank = data.data.rank.map(me.parseRank);
        //debugger;
        
        return data;
    }

    ,fetch: function(options){
        // debugger;
        var me = this,
            info = me.getRequestInfo(me.type),
            opt = $.extend({
                type: info.method 
                , url: me.urlHandler() + (info.querystring || '') //me.urlHandler() + ( info.querystring || '' )
                , data: {} 
            }, options);

        return Backbone.Model.prototype.fetch.call(me, opt);
    }

});



})(Zepto);




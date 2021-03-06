(function($) {

rocket.model.detail = rocket.model.extend({

    initialize: function(attributes, options){
        var me = this;

        me.options = options;
        me.curCid = options.cid;
    }

    , cidList:{
        "1001":"baidu",
        "1002":"alibaba",
        "1003":"tengxun",
        "1004":"xiaomi",
        "1005":"jd",
        "1006":"lenovo",
        "1007":"360",
        "1008":"huawei",
        "1009":"jumei",
        "10010":"momo",
        "10011":"chuizi"
    }

    ,getCidList:function(){
        return this.cidList;
    }

    ,fetch: function(options){
        var me = this;
    
        var opt = $.extend({
            type: 'get'
            , dataType:'jsonp'
            , url: 'http://baijia.baidu.com/ajax/kpi' + '&t=list&file='+me.cidList[me.curCid]
            , data: {
                t: "list"
                , file: me.cidList[me.curCid]
            } 
        }, options);

        return Backbone.Model.prototype.fetch.call(me, opt);
    }

});



})(Zepto);




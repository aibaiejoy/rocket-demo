(function($) {

rocket.model.result = rocket.model.extend({

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

    ,getCidListKeys:function(){
        var _arr = [];
        _.each(this.cidList, function(item, i){
            _arr.push(i);
        })
        return _arr;
    }

    ,parse: function(data){
        var me = this,  
            _cids = window.cids || $.localStorage("cids") && $.localStorage("cids").split(",") || [];

        data.data.user = Number(data.data.user) + 30000;
        _.each(data.data.list, function(item, i){
            item.logobg = me.cidList[item.cid];
            item.commented = _cids.length && _cids.inArray(item.cid) != -1 ? true: false;
        })
        return data;
    }

    ,fetch: function(options){
        var me = this;
    
        var opt = $.extend({
            type: 'POST'
            , dataType:'jsonp'
            , url: 'http://baijia.baidu.com/ajax/kpi' + '&t=ranking&cids='+me.getCidListKeys().join(",")
            , data: {
                t: "ranking"
                , cids: me.getCidListKeys().join(",")
            } 
        }, options);

        return Backbone.Model.prototype.fetch.call(me, opt);
    }

});

})(Zepto);




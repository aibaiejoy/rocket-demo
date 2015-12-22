(function($){

rocket.subview.detail_footer = rocket.subview.extend({

    //: '#detail_page > .page-footer'

    events: {
        
        "click .user-action-prev": "userActionPrev"
        , "click .user-action-next": "userActionNext"
        , "click .user-score-list li": "checkedScore"
        , "click .user-action-view": "viewRank"
    }

    ,tpl: "<div class=\"detail-footer\">\n\t<div class=\"user-score\">\n\t\t<div class=\"user-score-title\">你怎么看？</div>\n\t\t<ul class=\"user-score-list\">\n\t\t\t<li data-userScore=\"5\">\n\t\t\t\t<span class=\"score-checkbox\">5分</span>\n\t\t\t\t<span class=\"score-biaoqing biaoqing5\">人生巅峰</span>\n\t\t\t</li>\n\t\t\t<li data-userScore=\"4\">\n\t\t\t\t<span class=\"score-checkbox\">4分</span>\n\t\t\t\t<span class=\"score-biaoqing biaoqing4\">潜力股</span>\n\t\t\t</li>\n\t\t\t<li data-userScore=\"3\">\n\t\t\t\t<span class=\"score-checkbox\">3分</span>\n\t\t\t\t<span class=\"score-biaoqing biaoqing3\">马马虎虎</span>\n\t\t\t</li>\n\t\t\t<li data-userScore=\"2\">\n\t\t\t\t<span class=\"score-checkbox\">2分</span>\n\t\t\t\t<span class=\"score-biaoqing biaoqing2\">瞎混</span>\n\t\t\t</li>\n\t\t\t<li data-userScore=\"1\" class=\"last-item\">\n\t\t\t\t<span class=\"score-checkbox\">1分</span>\n\t\t\t\t<span class=\"score-biaoqing biaoqing1\">no zuo no die</span>\n\t\t\t</li>\n\t\t</ul>\n\t</div>\t\n\t<div class=\"user-action\">\n\t\t<span class=\"user-action-btn user-action-prev\">上一个</span>\n\t\t<span class=\"user-action-btn user-action-next\">下一个</span>\n\t\t<span class=\"user-action-btn user-action-view\">提交</span>\n\t</div>\n</div>\n"

    ,init: function(options){
        var me = this, 
            _curCidIndex, 
            _cids = window.cids || $.localStorage("cids") && $.localStorage("cids").split(",") || "";
        me.curCid = me.options.cid;
        me.model = new rocket.model.score(
            null,
            $.extend({}, options)
        );

        me.render();
        me.cids = _cids;

        _curCidIndex = me.cids.inArray(me.curCid);

        if( _curCidIndex !== -1 && _curCidIndex === me.cids.length - 1 ){
            me.$(".user-action-next").hide();
            me.$(".user-action-view").show();
        }else{
            me.$(".user-action-next").show();
            me.$(".user-action-view").hide();
        }
    }

    ,render: function(){
        var me = this;

        me.$el.append(
            _.template(
                me.tpl
                , {
                    pageName: '标题'        
                }
            )
        );

        me.show();
    } 
    , checkedScore: function(e){
        var me = this,
            _curCidIndex, 
            _cids = window.cids || $.localStorage("cids").split(",") || "",
            $el = $(e.currentTarget)
            data = $el.data();

        _curCidIndex = me.cids.inArray(me.curCid);

        me.$(".user-action-btn").addClass("able");
        
        if( _curCidIndex == 0){
            me.$(".user-action-prev").removeClass("able");
        }
        
        me.userscore = data.userscore;
        $el.addClass('checked').siblings().removeClass("checked");

        _detailData = me.ec.detailData.data;
        var other_score_arr = [];
        for (var i = 0; i < _detailData.other.length; i++) {
            other_score_arr.push(_detailData.other[i].score);
        };

        var postData = {
            cid:_detailData.cid,
            self_score:_detailData.self.score,
            other_score:other_score_arr.join(","),
            user_score:data.userscore
        }
        if( _curCidIndex == 0){
            postData.uid = new Date().getTime();
        }
        //debugger;
        me.model.fetch({}, postData);
    }

    , viewRank: function(){
        var me = this;
        if(me.userscore){
            me.navigate("#result");    
        }
        
    }

    , userActionPrev: function(){
        var me = this,
            _cids = me.cids,
            curCidIndex = _cids.inArray(me.curCid);

        if(curCidIndex !== -1 && curCidIndex !== 0 && me.userscore){
            route = "#detail/" + _cids[curCidIndex - 1];
            me.navigate(route);
        }
    }  
    , userActionNext: function(){
        var me = this,
            _cids = me.cids,
            curCidIndex = _cids.inArray(me.curCid);

        if( curCidIndex !== -1 && curCidIndex < _cids.length - 1 && me.userscore){
            route = "#detail/" + _cids[curCidIndex + 1];
            me.navigate(route);    
        }
        
    }

});

})(Zepto);

(function($){

rocket.subview.detail_footer = rocket.subview.extend({

    //: '#detail_page > .page-footer'

    events: {
        
        "click .user-action-prev": "userActionPrev"
        , "click .user-action-next": "userActionNext"
        , "click .user-score-list li": "checkedScore"
        , "click .user-action-view": "viewRank"
    }

    ,tpl: __inline("../../tpl/detail_footer.tpl.html")

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

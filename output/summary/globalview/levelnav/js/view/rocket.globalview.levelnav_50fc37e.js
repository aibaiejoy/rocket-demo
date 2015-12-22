(function($){
 
/**
 * 提供层级导航需要的数据结构和API接口
 * 由于记录了完整的用户的浏览轨迹，后续可用于用户浏览轨迹的数据分析
 */
rocket.globalview.levelnav = rocket.globalview.extend({
     
    init: function(options){
        var me = this;

        me.routeTrail = [];

        me.readConfig();
    }

    ,readConfig: function(){
        var me = this;

        // 上级路由模式配置表，以页面类型为key
        me.upLevelRoutePattern = {
            index: []

            // 频道新闻、地区新闻、话题新闻等
            , page_other: [
                /^index/
                , /^team/
                , /^news/
                , /^$/
                , /^discuss/
            ]

            // 检索新闻
            , page_search: [
                /^index/
                , /^team/
                , /^news/
                , /^$/
                , /^discuss/
            ]

            // 轮播图新闻
            , page_focuspic: [
                /^index/
                , /^team/
                , /^news/
                , /^$/
                , /^discuss/
            ]

            // 相关新闻
            , page_0: [
                /^index/
                , /^$/
                , /^team/
                , /^news/
                , /^page\/[a-z]+/
                , /^discuss/
            ]

            // 热点新闻
            , page_1: [
                /^index/
                , /^$/
                , /^team/
                , /^page\/[a-z]+/
                , /^news/
                , /^discuss/
            ]

            , image: [
                /^page/
                , /^index/
                , /^$/
                , /^team/
            ]

            , comment: [
                /^index/
                , /^$/
                , /^page/
            ]

            , team: [
                /^index/
                , /^$/
                , /^searchresult/
            ]

            , team_team: [
                /^index/
                , /^$/
                , /^searchresult/
            ]

            , team_player: [
                /^index/
                , /^$/
                , /^searchresult/
                , /^team\/team/
            ]

            , news: [
                /^index/
                , /^$/
                , /^team/
            ]
            , discuss:[
                /^index/
                , /^$/
            ]

            , rank: [
                /^index/
                , /^$/
            ]

            , searchresult: [
                /^index/
                , /^$/
                , /^search_country/
                , /^search_position/
            ]

            , search_country: [
                /^index/
                , /^$/
            ]

            , search_position: [
                /^index/
                , /^$/
            ]


        };
    }

    ,registerEvents: function(){
        var me = this, ec = me.ec;

        me.on('routechange', me.onroutechange, me);
    }

    ,onroutechange: function(params){
        var me = this,
            from = params.from || null,
            to = params.to || null,
            fromAction = from && from.action || null,
            toAction = to && to.action || null,
            pageviews = params.pageviews;

        if(to){
            // 每次路由变化，均记录route信息
            me.addRoute();
            // me.showRouteTrail();
        }
    }

    ,getUpLevel: function(){
        return this.getNearestUpLevelRoute
            .apply(this, arguments);
    }

    ,getNearestUpLevelRoute: function(pageType){
        if(!pageType){
            return null;
        }

        var me = this,
            pat,
            routeTrail = me.routeTrail; 

        pat = me.upLevelRoutePattern[pageType];

        if(!pat || pat.length == 0){
            return null;
        }

        for(var i=routeTrail.length-1; i>=0; i--){
            for(var j=0; j<pat.length; j++){
                if(pat[j].test(routeTrail[i])){
                    routeTrail.splice(i + 1, routeTrail.length - i - 1);
                    return {
                        index: i
                        , route: routeTrail[i]
                    };
                }
            }
        }

        return null;
    }

    ,addRoute: function(){
        var me = this;

        me.routeTrail.push(
            location.hash.replace(/^#/, '')
        );
    }

    ,showRouteTrail: function(){
        var me = this,
            i = me.routeTrail.length;

        console.log('');
        console.log('[ route trail stack ]');
        while(i > 0){
            console.log('    ' + me.routeTrail[i - 1]);
            i--;
        }
    }

});

 })(Zepto);



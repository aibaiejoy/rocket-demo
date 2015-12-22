(function($) {

function decode(param){
    return 'undefined' == typeof param                                                                        
        ? '' 
        // 1.0版本开始，路由参数已经decode
        : parseInt(Backbone.VERSION) < 1
            ? decodeURIComponent(param)
            : param;
}       
            
function encode(param){                                                                                       
    return 'undefined' == typeof param
        ? ''    
        : parseInt(Backbone.VERSION) < 1
            ? param                                                                                           
            : encodeURIComponent(param);                                                                      
}                   

rocket.router.summary = rocket.router.extend({

    // 路由配置
    routes: {
        /**
         * 'index/:param1/:param2': '_ROUTEHANDLER_'
         */

        '': 'index'
        , 'index':'index'
        , 'home':'home'
        , 'detail/:cid':'detail'
        , 'result':'result'
    }

    // 页面切换顺序配置
    ,pageOrder: [
        /*
        'home'
        ,'detail'
        */
    ]

    // 位置记忆，默认为false，不进行位置记忆
    ,enablePositionRestore: true

    // 默认页面切换动画
    ,defaultPageTransition: 'fade'

    // 页面切换动画配置
    ,pageTransition: {
        /**
         * @note: slide比较适用于固高切换，fade比较适用DOM树较小的两个页面切换，simple性能最好，但效果最一般，合理选择配置
         */
        // 'index-sayhello': 'slide' 

    }

    , setTitle:function(title){
        title && (
            document.title = title
        );  
    }

    , index: function(){
        this.isShared = true;
        this.doAction('index', {});
    }

    , home: function(){
        if(!this.isShared){
            window.location.href = window.location.href.replace('home', 'index');
        }
        this.doAction('home', {});
    }

    , detail: function(cid){
        if(!this.isShared){
            window.location.href = window.location.href.replace(/detail\/.*/, 'index');
        }
        this.doAction('detail', {cid:cid});
    }

    , result: function(){
        if(!this.isShared){
            window.location.href = window.location.href.replace('result', 'index');
        }
        this.doAction('result');
    }

    /**
     * action处理逻辑
     * @{param} action {string} action名称
     * @{param} params {object} action参数
     * @{param} statOptions {object} 统计选项{disable:是否屏蔽统计,默认开启;param:{key: value,key: value}}]统计参数}
     */
    ,doAction: function(action, params, statOptions){
        var me = this;
        // 必须延时，否则动画性能大打折扣
        setTimeout(function(){
            var opts = statOptions ? statOptions : {}
            if(!opts.disable){
                var statObj = _.extend({
                    "wa_type": action,
                    "act" : "switch"
                }, opts.params ? opts.params : {});
                
                //webappandroid.helper.sendStatistics(statObj);
            }
            //me.setTitle( statOptions.params && statOptions.params.title || "2014世界杯");
        }, 0);

        rocket.router.prototype.doAction.apply(this, arguments);
    }
}); 

})(Zepto);





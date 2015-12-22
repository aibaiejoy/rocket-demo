(function($){
    $.ui.productlist = function(product) {
    
    var config = [

 {id: 'web',       name: '网页',   pos: {x:-1, y:0}}  
,{id: 'image',     name: '图片',   pos: {x:-104, y:0}}  
,{id: 'video',     name: '视频',   pos: {x:-154, y:0}}  
,{id: 'hao123',    name: '上网导航', pos: {x:-104, y:-150}}    
,{id: 'tieba',     name: '贴吧',   pos: {x:-52, y:0}} 
,{id: 'zhidao',    name: '知道',   pos: {x:-1, y:-100}}   
,{id: 'wenku',     name: '文库',   pos: {x:-53, y:-100}}    
,{id: 'baike',     name: '百科',   pos: {x:-154, y:-50}}    
// ,{id: 'space',     name: '空间',   pos: {x:-154, y:-100}}    
,{id: 'music',     name: '音乐',   pos: {x:-104, y:-50}}    
,{id: 'map',       name: '地图',   pos: {x:-1, y:-150}}    
,{id: 'app',       name: '应用',   pos: {x:-52, y:-50}}   
,{id: 'lvyou',     name: '旅游',   pos: {x:-103, y:-100}}    
,{id: 'fanyi',     name: '翻译',   pos: {x:-154, y:-150}}   
,{id: 'tuangou',     name: '团购',   pos: {x:-205, y:0}}
,{id: 'tuiguang',     name: '百度推广',   pos: {x:-205, y:-50}}
        ],

        urlConfig = [
// 与config的配置顺序必须一致
        
// 网页
'http://m.baidu.com/?bd_page_type=1&ssid=0&from=0&uid=&pu=sz%401320_2001&fr='
// 图片
,'http://m.baidu.com/img?tn=bdidxiphone&itj=41&bd_page_type=1&ssid=0&from=0&uid=&pu=sz@1320_2001&fr='
// 视频
,'http://m.baidu.com/video?fr='
// Hao123
,'http://m.hao123.com/?z=2&tn=baidunews'
// 贴吧
,'http://wapp.baidu.com/?lp=1065&amp;bd_page_type=1&amp;ssid=0&amp;from=0&amp;uid=&amp;pu=sz%401320_2001&amp;fr='
// 知道
,'http://wapiknow.baidu.com/?st=3&amp;bd_page_type=1&amp;ssid=0&amp;from=0&amp;uid=&amp;pu=sz%401320_2001&amp;fr='
// 文库
,'http://wk.baidu.com/?st=3&amp;bd_page_type=1&amp;ssid=0&amp;from=0&amp;uid=&amp;pu=sz%401320_2001&amp;fr='
// 百科
,'http://wapbaike.baidu.com/?st=3&amp;bd_page_type=1&amp;ssid=0&amp;from=0&amp;uid=&amp;pu=sz%401320_2001&amp;fr='
// 空间
// ,'http://i.hi.baidu.com/?bd_page_type=1&amp;ssid=0&amp;from=0&amp;uid=&amp;pu=sz%401320_2001&amp;fr='
// 音乐
,'http://mp3.baidu.com/mobile.html?bd_page_type=1&amp;ssid=0&amp;from=0&amp;uid=&amp;pu=sz%401320_2001&amp;fr='
// 地图
,'http://map.baidu.com?bd_page_type=1&amp;ssid=0&amp;from=0&amp;uid=&amp;pu=sz%401320_2001&amp;fr='
// 应用
,'http://m.baidu.com/app?bd_page_type=1&amp;ssid=0&amp;from=0&amp;uid=&amp;pu=sz%401320_2001&amp;fr='
// 旅游
,'http://lvyou.baidu.com?bd_page_type=1&amp;ssid=0&amp;from=0&amp;uid=&amp;pu=sz%401320_2001&amp;fr='
// 翻译
,'http://fanyi.baidu.com/?from=xinwen'
//团购
,'http://mtuan.baidu.com/view?z=2&from=map_webapp'
//推广
,'http://e.baidu.com/m2/?refer=707'
// 小说
//,'http://wap.baidu.com/xs?bd_page_type=1&amp;ssid=0&amp;from=0&amp;uid=&amp;pu=sz%401320_2001&amp;fr= '

        ];

        for(var i = 0; i < config.length; i++){
            config[i]['url'] = urlConfig[i];
        }

        for(i = 0; i < config.length; i++){
            if(config[i].id == product){
                config.splice(i, 1);
                break;
            }
        }

        return config;
    } 
})(Zepto);


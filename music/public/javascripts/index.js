/**
 * Created by Administrator on 2015/7/29.
 */
var Hmusic={
    /*music app初始化*/
    init:function(){
        this.canvas={};
        this.canvasContainer=this._qLite('.right')[0];
        this.canvasDom=this._qLite('#canvas')[0];
        this.ctx=this.canvasDom.getContext('2d');
        this.size=256;//定义canvas点的个数
        this.type='柱状图';//定义初始化图形
        this.r=40;//定义圆的最大半径

        this.xhr=new XMLHttpRequest();
        this.ac=this._getAudioContext();
        //定义基于ac的必须节点
        this.analyser=this.ac.createAnalyser();
        this.gain=this.ac[this.ac.createGain?'createGain':'createGainNode']();
        //analyser处理
        this.analyser.fftSize=this.size*2;
        this.analyser.connect(this.gain);
        //gain处理
        this.gain.connect(this.ac.destination);
        this.render();
    },
    /*程序各动作加载*/
    render:function(){
        this.eventHandler();
        this._analyserData();
        this._resize();

        this.dots=this._dotedHandler();
    },
    /*程序事件定义*/
    eventHandler:function(){
        var musicLis=this._qLite('#music_list li'),
            voiceControl=this._qLite('#voice_control'),
            typeLis=this._qLite('#type_list li'),
            that=this;
        //定义图形类型
        for(var i= 0,liLen=typeLis.length;i<liLen;i++){
            typeLis[i].onclick=function(){
                that.nextMusic=true;
                if(this.className=='active'){
                    return;
                }
                for(var j=0;j<typeLis.length;j++){
                    typeLis[j].className='';
                }
                this.className='active';
                var typeName=this.title;
                //重置type
                that.type=typeName;
                that._resize();
            }
        };
        //定义歌曲点击事件
        for(var i= 0,liLen=musicLis.length;i<liLen;i++){
            musicLis[i].onclick=function(){
                for(var j=0;j<musicLis.length;j++){
                    musicLis[j].className='music-item';
                }
                this.className='music-item active';
                var musicName=this.title;
                //重新创建bufferSource
                that.bufferSource=that.ac.createBufferSource();
                that._ajaxHandler('/'+window.encodeURIComponent(musicName));
            }
        };
        //定义音量大小事件
        voiceControl[0].onchange=function(){
            var voice=this.value/this.max;
            that.gain.gain.value=voice*voice;
        };

        //窗口重置
        window.onresize=function(){
            that._resize();
        };

        //初始化事件
        voiceControl[0].onchange();
        musicLis[0].onclick();
    },
    /*获取webAudio对象*/
    _getAudioContext:function(){
        window.AudioContext = (window.AudioContext || window.webkitAudioContext);
        if(window.AudioContext) {
            return new window.AudioContext();
        } else {
            throw Error('not support web audio api');
        }
    },
    /*获取节点*/
    _qLite:function(selector){
        return document.querySelectorAll(selector);
    },
    /*获取下一个节点*/
    _getNextNode:function(node){
        if(!node.nextSibling){
            return null;
        }
        if(node.nextSibling.nodeType == 1){    //判断下一个节点类型为1则是“元素”节点
            return node.nextSibling;
        }
        if(node.nextSibling.nodeType == 3){      //判断下一个节点类型为3则是“文本”节点  ，回调自身函数
            return this._getNextNode(node.nextSibling);
        }
        return null;
    },
    /*对歌曲数据进行处理*/
    _musicDataHandler:function(data){
        var that=this,
            ac=this.ac,
            bufferSource=this.bufferSource,
            analyser=this.analyser;
        ac.decodeAudioData(data,function(buffer){
            bufferSource.buffer=buffer;
            bufferSource.connect(analyser);
            bufferSource[bufferSource.start?'start':'noteOn'](0);
            that.source=bufferSource;
            that.duration=bufferSource.buffer.duration;
            that.nextMusic=false;
        },function(err){
            console.log(err);
        });
    },
    /*分析歌曲数据*/
    _analyserData:function(){
        var that=this,
            arr=new Uint8Array(that.analyser.frequencyBinCount);
        var requestAnimationFrame  =  window.requestAnimationFrame||
                                        window.webkitRequestAnimationFrame||
                                        window.mozRequestAnimationFrame;
        function timer(){
            that.analyser.getByteFrequencyData(arr);
            requestAnimationFrame(timer);
            that._canvasDisplay(arr);
            var rate=that.source?(that.ac.currentTime/that.duration*100):0;
            var text=that.source?(rate.toFixed(0)=='NaN'?0:rate.toFixed(0))+'%':'loading...';
            that._qLite('.music-rate')[0].innerHTML=text;
            console.log(rate);
            if(rate>=100){
                //var nextNode=that._getNextNode(that._qLite('#music_list li.active')[0]);
                //if(nextNode){
                //    nextNode.onclick();
                //    that._qLite('.music-rate')[0].innerHTML='waiting...';
                //}else{
                //    that._qLite('.music-rate')[0].innerHTML='finish...';
                //}
                that._qLite('.music-rate')[0].innerHTML='finish...';
            }
        };
        requestAnimationFrame(timer);
    },
    /*初始化点状图数据*/
    _dotedHandler:function(){
        var dots=[];
        for(var i=0;i<this.size;i++){
            var x=this._geRande(0,this.canvas.width);
            var y=this._geRande(0,this.canvas.height);
            var color='rgba('+Math.ceil(this._geRande(0,256))+','+Math.ceil(this._geRande(0,256))+','+Math.ceil(this._geRande(0,256))+','+this._geRande(0,1).toFixed(1)+')';
            dots.push({
                x:x,
                y:y,
                color:color
            });
        }
        return dots;
    },
    /*获取介于m和n之间的数*/
    _geRande:function(m,n){
        return Math.random()*(n-m)+m;
    },
    /*根据条件画出歌曲数据*/
    _canvasDisplay:function(data){
        var that=this;
        this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
        var w=canvas.width/this.size;
        this.dots.forEach(function(dot){
            if(dot.x>=that.canvas.width){
                dot.x=0;
            }else{
                dot.x+=1;
            }

        })
        for(var i=0;i<this.size;i++){
            this.ctx.beginPath();
            if(this.type=='柱状图'){
                var h=data[i]/256*this.canvas.height;
                this.ctx.fillRect(w*i,this.canvas.height-h, w*0.6,h);
            }else{
                var dot=this.dots[i], r=data[i]/256*this.r,line;
                line=this.ctx.createRadialGradient(dot.x,dot.y,0,dot.x,dot.y,r);
                line.addColorStop(0,'#fff');
                line.addColorStop(1,dot.color);
                this.ctx.fillStyle=line;
                this.ctx.arc(dot.x,dot.y,r,0,Math.PI*2,true);
            }
            this.ctx.fill();
        }
    },
    /*窗口重置参数定义*/
    _resize:function(){
        this.canvas.width=this.canvasContainer.clientWidth;
        this.canvas.height=this.canvasContainer.clientHeight;
        this.canvasDom.width=this.canvas.width;
        this.canvasDom.height=this.canvas.height;
        this.dots=this._dotedHandler();
        var line;
        if(this.canvas.width<600){
            this.r=20;
        }else if(this.canvas.width<800){
            this.r=30;
        }else{
            this.r=40;
        }
        if(this.type=='柱状图'){
            this.size=256;
            line=this.ctx.createLinearGradient(0,0,0,this.canvas.height);
            line.addColorStop(0,'red');
            line.addColorStop(0.5,'green');
            line.addColorStop(1,'blue');
            this.ctx.fillStyle=line;
        }else{
            this.size=128;
        }
    },
    /*后台获取歌曲信息*/
    _ajaxHandler:function(url){
        var xhr=this.xhr,
            that=this;
        xhr.abort();
        //判断是否有歌曲在播放
        if(this.source){
            this.source[this.source.stop?'stop':'noteOff']();
            this.source=null;
        }
        xhr.open('get',url,true);
        xhr.responseType='arraybuffer';
        xhr.onload=function(){
           that._musicDataHandler(xhr.response);
        };
        xhr.send();
    }
};

/*应用启动函数*/
Hmusic.init();
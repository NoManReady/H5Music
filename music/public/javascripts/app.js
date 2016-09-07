(function($) {
    class Music {
        constructor() {
            this.canvas = Music._canvas;
            this.ctx = this.canvas.getContext('2d');
            this.size = 256;
            this.r = 40;
            this.type = 1;

            this.xhr = new XMLHttpRequest();
            this.timers = {};

            // 初始化audiocontext
            this.ac = Music._ac;
            // 获取过滤node
            this.filter = this.ac.createBiquadFilter();
            // 获取频谱分析node
            this.analyerNode = this.ac.createAnalyser();
            this.analyerNode.fftSize = this.size * 2;
            // 获取音量调节node
            this.voiceNode = this.ac.createGain();
            // 数据流对象
            this.bufferSource = null;
            // 数据流连接
            this.filter.connect(this.analyerNode);
            this.analyerNode.connect(this.voiceNode);
            this.voiceNode.connect(this.ac.destination);

            let sources = [
                '../video/bound.mp3',
                '../video/happy.mp3'
            ];
            this.bufferLoader = new BufferLoader(this.ac, sources, this._loadComplete.bind(this));
            this.bufferLoader.load();

            // this.frame=Music._frame;
            this._init();
        }
        _init() {
            let _model = {
                title: 'NoManReady_Music',
                totalTime: 0,
                remainTime: 0,
                playTime: 0,
                type: this.type,
                rate: 'load...',
                currentIndex: 0,
                musics: [],
                hasFilter: true,
                filterType: 'lowpass',
                Q: '1',
                progress:0
            };
            this.model = ko.mapping.fromJS(_model);
            ko.applyBindings(this);
            this._loadMusics().done((musics) => {
                this.model.musics(musics);
                setTimeout(() => {
                    this._loadMusicById($('#music_' + this.model.currentIndex()).text());
                }, 500);
            });
            this.model.filterType.subscribe(v => {
                this.filter.type = v;
            });
            this.model.Q.subscribe(v => {
                this.filter.Q.value = +v;
            });
            this._loadCanvas();
            window.onresize = () => {
                this._loadCanvas();
            };
            this._eventRegister();
        }
        _eventRegister() {
            let _index=0,_source;
            document.addEventListener('keydown', (e) => {
                if (e.keyCode === 13) {
                    if(_source){
                        _source.stop();
                    }
                    _source = this._createBuffer(this.bufferList[_index]);
                    _index=_index===0?1:0;
                    _source.start(0);
                }
            });
        }
        _createBuffer(buffer) {
            var source = this.ac.createBufferSource();
            source.buffer = buffer;
            // 将gain与目标相连接
            source.connect(this.ac.destination);
            return source;
        }
        _filterEffect() {
            this.filter.type = this.model.filterType();
            this.filter.frequency.value = this.ac.sampleRate / 2 * 0.4;

        }
        toggleFilter(val) {
            this.source.disconnect(0);
            this.filter.disconnect(0);
            if (this.model.hasFilter()) {
                this.source.connect(this.filter);
                this.filter.connect(this.analyerNode);
            } else {
                this.source.connect(this.analyerNode);
            }
        }
        frequencyChange(b, evt) {
            let _target = evt.target,
                _value = _target.value / _target.max,
                _maxValue = this.ac.sampleRate / 2;
            this.filter.frequency.value = _maxValue * _value;
        }
        musicClick(index, b, evt) {
            this.model.currentIndex(index);
            this._loadMusicById(b);
        }
        voiceChange(b, evt) {
            let _target = evt.target,
                _voice = _target.value / _target.max;
            this.voiceNode.gain.value = (1 + _voice) / 2;
        }
        typeChange(type) {
            this.model.type(type);
            this._loadCanvas();
        }
        toggleMusic(){
            if(this.ac.state==='running'){
                this.stop();
            }else if(this.ac.state==='suspend'){
                this.start();
            }
        }
        start(){
            this.ac.resume();
        }
        stop(){
            this.ac.suspend();
        }
        _loadComplete(bufferList) {
            this.bufferList = bufferList;
        }
        _loadCanvas() {
            let _canvasContainer = $('.right')[0];
            this.canvas.width = _canvasContainer.clientWidth;
            this.canvas.height = _canvasContainer.clientHeight;
            this.dots = this._dotedHandler();
            if (this.canvas.width < 600) {
                this.r = 20;
            } else if (this.canvas.width < 800) {
                this.r = 30;
            } else {
                this.r = 40;
            }
        }
        _loadMusics() {
            return $.ajax({
                url: '/music'
            });
        }
        _loadMusicById(id) {
            this.xhr.abort();
            this.bufferSource = this.ac.createBufferSource();
            if (this.source) {
                this.source.stop(0);
                this.source = null;
                this.timers.optType = 'user';
            }
            this.xhr.open('get', '/music/' + encodeURIComponent(id), true);
            this.xhr.responseType = 'arraybuffer';
            this.xhr.onload = () => {
                this._analyerSource(this.xhr.response);
            };
            this.xhr.send();
        }
        _analyerSource(source) {
            let t = this;
            this.model.totalTime(0);
            this.model.playTime(0);
            this.model.remainTime(0);
            this.model.rate('load...');
            this.model.progress(0);
            this.ac.decodeAudioData(source, function(buffer) {
                t.bufferSource.buffer = buffer;
                t.bufferSource.connect(t.filter);
                t.bufferSource.start(0);
                t.source = t.bufferSource;
                t.bufferSource.onended = function() {
                    window.clearInterval(t._timer);
                    if (t.timers.optType === 'user') {
                        t.timers = {};
                        return;
                    }
                    t.model.currentIndex(t.model.currentIndex()+1);
                    t.timers = {};
                    let _nextId = $('#music_' + t.model.currentIndex()).text();
                    if(!_nextId){
                        return;
                    }
                    t._loadMusicById(_nextId);
                };
                t.beginTime=Date.now();
                t._analyserData();
            }, error => {
                console.error("decodeAudioData error", error.message);
            });
        }
        _round() {
            window.requestAnimationFrame(this._round.bind(this));
            let _arr = this.timers.arr;
            if(this._rateValue&&this._rateValue>=100){
                return;
            }
            // this.filter.Q.value+=1;
            this.analyerNode.getByteFrequencyData(_arr);
            this._draw(_arr);
            if(!this.source){
                return;
            }
            let _playTime=(Date.now()-this.beginTime)/1000
            this.model.totalTime(this.source.buffer.duration.toFixed(0));
            this.model.playTime(_playTime.toFixed(0));
            this.model.remainTime(this.model.totalTime() - this.model.playTime());
            this._rateValue = this.model.playTime() / this.model.totalTime() * 100
            this.model.rate(this._rateValue.toFixed(0) + '%');
            this.model.progress(_playTime/this.source.buffer.duration*100+'%');
        }
        _analyserData() {
            // Music._frame(this._round);
            this.timers.arr = new Uint8Array(this.analyerNode.frequencyBinCount);
            this._rateValue=0;
            window.requestAnimationFrame(this._round.bind(this));
        }
        _dotedHandler() {
            let dots = [];
            for (let i = 0; i < this.size; i++) {
                let x = this._geRande(0, this.canvas.width),
                    y = this._geRande(0, this.canvas.height),
                    color = 'rgba(' + Math.ceil(this._geRande(0, 256)) + ',' + Math.ceil(this._geRande(0, 256)) + ',' + Math.ceil(this._geRande(0, 256)) + ',' + this._geRande(0, 1).toFixed(1) + ')';
                dots.push({
                    x: x,
                    y: y,
                    color: color,
                    direct: Math.random() > 0.5 ? 'go' : 'back'
                });
            }
            return dots;
        }
        _geRande(m, n) {
            return Math.random() * (n - m) + m;
        }
        _draw(arr) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            if (this.model.type() === 2) {
                this.dots.forEach((dot) => {
                    if (dot.direct === 'back') {
                        if (dot.x <= 0) {
                            dot.x = this.canvas.width;
                        } else {
                            dot.x -= (Math.random() * 2);
                        }
                    } else {
                        if (dot.x >= this.canvas.width) {
                            dot.x = 0;
                        } else {
                            dot.x += (Math.random() * 2);
                        }
                    }

                })
            }
            let _size=this.size;
            if(this.model.type() == 1){
                _size*=1;
            }
            for (let i = 0; i < _size; i++) {
                this.ctx.beginPath();
                let h = arr[i] / 256 * this.canvas.height,
                    w = canvas.width / _size,
                    line;
                this.ctx.fillStyle = line;
                if (this.model.type() == 1) {
                    line = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
                    line.addColorStop(0, 'red');
                    line.addColorStop(0.5, 'green');
                    line.addColorStop(1, 'blue');
                    this.ctx.fillStyle = line;
                    this.ctx.fillRect(w * i, this.canvas.height - h, w * 0.6, h);
                } else if(this.model.type() == 2) {
                    let dot = this.dots[i],
                        r = arr[i] / 256 * this.r;
                    line = this.ctx.createRadialGradient(dot.x, dot.y, 0, dot.x, dot.y, r);
                    line.addColorStop(0, '#fff');
                    line.addColorStop(1, dot.color);
                    this.ctx.fillStyle = line;
                    this.ctx.arc(dot.x, dot.y, r, 0, Math.PI * 2, true);
                }else if(this.model.type() == 3){

                }
                this.ctx.fill();
            }
        }
        static get _canvas() {
            return $('#canvas')[0];
        }
        static get _ac() {
            window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.msAudioContext;
            if (window.AudioContext) {
                return new window.AudioContext();
            } else {
                throw Error('not support web audio api');
            }
        }
        static get _frame() {
            // return setTimeout('func', 1000/60);
        }
    }

    class BufferLoader{
        constructor(context, urlList, callback) {
            this.context = context;
            this.urlList = urlList;
            this.onload = callback;
            this.bufferList = new Array();
            this.loadCount = 0;
        }
        loadBuffer(url, index) {
            let request = new XMLHttpRequest();
            request.open("GET", url, true);
            request.responseType = "arraybuffer";

            let loader = this;

            request.onload = function() {
                loader.context.decodeAudioData(
                    request.response,
                    function(buffer) {
                        if (!buffer) {
                            alert('error decoding file data: ' + url);
                            return;
                        }
                        loader.bufferList[index] = buffer;
                        if (++loader.loadCount == loader.urlList.length)
                            loader.onload(loader.bufferList);
                    }
                );
            }
            request.onerror = function() {
                alert('BufferLoader: XHR error');
            }
            request.send();
        }
        load(){
            for (let i = 0; i < this.urlList.length; ++i)
            this.loadBuffer(this.urlList[i], i);
        }
    }

    window.music = new Music();
})(jQuery);

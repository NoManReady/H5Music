(function($) {
    class Music {
        constructor() {
            this.canvas = Music._canvas;
            this.ctx = this.canvas.getContext('2d');
            this.size = 128;
            this.r = 40;
            this.type = 1;

            this.xhr = new XMLHttpRequest();
            this.timers = {};

            // 初始化audiocontext
            this.ac = Music._ac;
            // 获取频谱分析node
            this.analyerNode = this.ac.createAnalyser();
            this.analyerNode.fftSize = this.size * 4;
            // 获取音量调节node
            this.voiceNode = this.ac.createGain();
            // 数据流对象
            this.bufferSource = null;
            // 数据流连接
            this.analyerNode.connect(this.voiceNode);
            this.voiceNode.connect(this.ac.destination);

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
                musics: []
            };
            this.model = ko.mapping.fromJS(_model);
            ko.applyBindings(this);
            this._loadMusics().done((musics) => {
                this.model.musics(musics);
                setTimeout(() => {
                    this._loadMusicById($('#music_' + this.model.currentIndex()).text());
                }, 500);
            });
            this._loadCanvas();
            window.onresize = ()=>{
                this._loadCanvas();
            };
        }
        musicClick(index, b, evt) {
            this.model.currentIndex(index);
            this._loadMusicById(b);
        }
        voiceChange(b, evt) {
            let _target = evt.target,
                _voice = _target.value / _target.max;
            this.voiceNode.gain.value = _voice * _voice;
        }
        typeChange(type) {
            this.model.type(type);
            this._loadCanvas();
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
                this.source.stop();
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
            this.ac.decodeAudioData(source, function(buffer) {
                t.bufferSource.buffer = buffer;
                t.bufferSource.connect(t.analyerNode);
                t.bufferSource.start(0);
                t.source = t.bufferSource;
                t.model.totalTime(t.bufferSource.buffer.duration);
                t.bufferSource.onend = function() {
                    if (t.timers.optType === 'user') {
                        t.timers = {};
                        return;
                    }
                    t.timers = {};
                    let _nextId = $('music_' + t.model.currentIndex()).text();
                    t._loadMusicById(_nextId);
                };
                t._analyserData();
            }, error => {
                console.error("decodeAudioData error", error.message);
            });
        }
        _round() {
            let _arr = this.timers.arr;
            this.analyerNode.getByteFrequencyData(_arr);
            setTimeout(this._round.bind(this), 1000 / 60);
            this._draw(_arr);
            if (this.timers.firstTime) {
                this.timers.lastTime = new Date().getTime();
                // 本地时间差（ms）
                this.timers.timeCount = this.timers.lastTime - this.timers.firstTime;
                // 播放时间
                this.timers.playTime = Math.ceil(this.timers.timeCount / 1000);
                // 剩余时间
                this.timers.remainTime = this.model.totalTime() - this.timers.playTime;

                this.model.playTime(this.timers.playTime);
                this.model.remainTime(this.timers.remainTime);
            } else {
                this.timers.firstTime = new Date().getTime();
                return;
            }
            let _value = this.timers.playTime / this.source.buffer.duration * 100
            let _rate = _value > 100 ? 100 : _value;
            this.model.rate(_rate.toFixed(0) + '%');
        }
        _analyserData() {
            this.timers.arr = new Uint8Array(this.analyerNode.frequencyBinCount);
            // Music._frame(this._round);
            setTimeout(this._round.bind(this), 1000 / 60);
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
            for (let i = 0; i < this.size; i++) {
                this.ctx.beginPath();
                let h = arr[i] / 256 * this.canvas.height,
                    w = canvas.width / this.size,
                    line;
                this.ctx.fillStyle = line;
                if (this.model.type() == 1) {
                    line = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
                    line.addColorStop(0, 'red');
                    line.addColorStop(0.5, 'green');
                    line.addColorStop(1, 'blue');
                    this.ctx.fillStyle = line;
                    this.ctx.fillRect(w * i, this.canvas.height - h, w * 0.6, h);
                } else {
                    let dot = this.dots[i],
                        r = arr[i] / 256 * this.r;
                    line = this.ctx.createRadialGradient(dot.x, dot.y, 0, dot.x, dot.y, r);
                    line.addColorStop(0, '#fff');
                    line.addColorStop(1, dot.color);
                    this.ctx.fillStyle = line;
                    this.ctx.arc(dot.x, dot.y, r, 0, Math.PI * 2, true);
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
    new Music();
})(jQuery);

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var fs = require('fs');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/:id', function(req, res) {
    var id = req.params.musicId;
    fs.readFile(path.join(__dirname,'public/musics/'+id),function(err,data){
        if(err){
            console.log(err);
        }else{
            res.json(data);
        }
    });
});

app.get('/',function(req,res){
    fs.readdir(path.join(__dirname, 'public/musics'), function(err, files) {
        if (err) {
            console.log(err);
        } else {
            console.log(files);

            res.render('index', {
                files: files,
                title: 'H5音乐可视化'
            });
        }
    });
})


// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

app.listen(8080,function(){
    console.log('ok');
})

module.exports = app;
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var fs = require('fs');

var app = express();

var music = path.join(__dirname, '/public/musics');

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

app.get('/music',function(req,res){
    fs.readdir(music, function(err, musics) {
        if (err) {
            console.log(err);
        } else {
            res.send(musics);
        }
    });
});
app.get('/music/:id', function(req, res) {
    var id = req.params.id;
    fs.readFile(path.join(music, id), function(err, data) {
        if (err) {
            console.log(err);
        } else {
            res.send(data);
        }
    });
});

app.get('/', function(req, res) {
    res.render('index',{
        title:'H5 Audio'
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

app.listen(8080, function() {
    console.log('ok');
})

module.exports = app;

const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');
const config = require('config');
const template = require('express-art-template');
const index = require('./routes/index');

const app = express();


//设置配置
template.template.defaults.root = path.join(__dirname, "views");
template.template.defaults.extname = ".html";

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.engine('html', template);

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json({
    limit: "10000kb"
}));
app.use(bodyParser.urlencoded({
    extended: false,
    limit: "10000kb"
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: "gfc",
    resave: false,
    saveUninitialized: true,
}));

app.use('/', index);
app.use('/api', require('./routes/api'));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    //   console.log(req.url)
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    if (res.locals.message) {
        res.end(res.locals.message);
    } else {
        res.end("404")
    }
});
console.log(process.env.SERVER_ENV, process.env.NODE_ENV)
module.exports = app;

/**
 * Module dependencies.
 */
var express = require('express')
,	path = require('path')
,	streams = require('./app/streams.js')();

var favicon = require('serve-favicon')
,	logger = require('morgan')
,	methodOverride = require('method-override')
,	bodyParser = require('body-parser')
,	errorHandler = require('errorhandler');

var https = require('https');
var fs = require('fs');

var app = express();
var server = https.createServer({
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.cert')
}, app)

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
//app.set('ip', process.env.SERVER_IP || "127.0.0.1")
app.use(favicon(__dirname + '/public/images/icon.png'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride());
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(errorHandler());
}

// app.locals.test = function(test){
//   console.log(test);
//   return test;
// }

// routing
require('./app/routes.js')(app, streams);

//var server = app.listen(app.get('port'), function(){
//  console.log('Express server listening on port ' + app.get('port'));
//});
// var server = app.listen(app.get('port'), "127.0.0.1" );

server.listen(app.get('port'), "192.168.1.178" );
var io = require('socket.io').listen(server);
/**
 * Socket.io event handling
 */
require('./app/socketHandler.js')(io, streams);

//10.131.185.68
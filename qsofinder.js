
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
// var user = require('./routes/user');
var http = require('http');
var path = require('path');
var najax = require('najax');
var xml2js = require('xml2js');
var parser = new xml2js.Parser();
var cradle = require('cradle');
var app = express();
var fs = require('fs');
var jade = require('jade');

var db = new(cradle.Connection)().database('dash');
var usernames = {};
var frequencies = {};
var qthTime = 0;
var qthID = 0;
var freqHTML = '';

var renderUser = function(locals) {
	console.log(locals);
};

fs.readFile(userJade, function(err, data) {
	if (err) throw err;
	renderUser = jade.compile(data, jadeoptions);
});


var renderFreqs = function(locals) {
	console.log(locals);
};

fs.readFile(freqJade, function(err, data) {
	if (err) throw err;
	renderFreqs = jade.compile(data, jadeoptions);
});

najax(tokenURL, function(xml) {
	parser.parseString(xml, function(err, result) {
		var session = eval(result.HamQTH.session);
		qthID = session[0].session_id[0];
		// console.log("qthID: " + qthID);
	});
});

// all environments
app.set('port', process.env.PORT || 8008);
app.set('hostname', '::');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);

var server = http.createServer(app).listen(app.get('port'), app.get('hostname'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

var io = require('socket.io').listen(server,{ log: false});

	
io.sockets.on('connection', function(socket) {

	io.sockets.emit('standardfreq', standardfreq);
	freqs();

	socket.on('sendchat', function(data) {
		io.sockets.emit('updatechat', socket.username, data);
	});

	socket.on('adduser', function(username) {
		// console.log("Username: " + username);
		if (username) {
			callLookup(username,function(err,result) {
				// console.log("callLookup returned: " + JSON.stringify(result));
				if (!err) {
					socket.username = username;
					usernames[username] = username;
					writeuser(username);
				} else {
					socket.emit('callnotfound',username + ' not found!');		
				}
			});
		}
	});

	socket.on('disconnect', function() {
		if (socket.username !== undefined)
			socket.broadcast.emit('updatechat', 'SERVER', socket.username
					+ ' has disconnected');
		delete usernames[socket.username];
		delete frequencies[socket.username];
		socket.broadcast.emit('updateusers', usernames);
		freqs();
	});

	socket.on('stationfreq', function(frequency) {
		// console .log("Station Frequency " + frequency + " " + frequencies.length);
		if (frequency === '0.0000' || frequency.length < 1){
			delete frequencies[socket.username];
			socket.emit('updatechat', 'Acknowledge', 'Frequency Cleared');
			socket.broadcast.emit('updatechat', socket.username,
					'Cleared Frequency');
		} else {
			var message = 'QSY ' + frequency;
			frequencies[socket.username] = frequency;
			socket.emit('updatechat', 'Acknowledge', message);
			socket.broadcast.emit('updatechat', socket.username, message);

		}
		freqs();
	});

	socket.on('stationlookup', function(data) {
		callLookup(data,function(err,result) {
			if (err) {
				// console.log("Get Call: " + err);
			} else {
				var lat = result.HamQTH.search[0].latitude[0];
				var lon = result.HamQTH.search[0].longitude[0];

				var mapURL = googleMapURL + ll(lat,lon) + '(' + result._id + ')';
				// console.log(mapURL);
				result.mapURL = mapURL;
				result.socketusername = socket.username;
				var userHTML = renderUser(result);
				socket.emit('stationdata', userHTML);
			}
		});
	});

	function freqs(){
		var freqs = {};
		for (var key in frequencies) { 
			var value = frequencies[key];
			if (freqs[value] === undefined) { 
				freqs[value] = new Array(key); 
			} else { 
				freqs[value].push(key); }
		} 
		var f = {'frequencies':freqs};
		var freqHTML = renderFreqs(f); 
		io.sockets.emit('freqlist', freqHTML);
	}

	function ll(lat, lon) {
		var latlon = Math.abs(lat);
		latlon += (lat >= 0) ? 'N+' : 'S+';
		latlon += Math.abs(lon);
		latlon += (lon >= 0) ? 'E' : 'W';
		return latlon;
	}
	
	function writeuser(username) {
		socket.emit('loggedin');
		socket.emit('updatechat', 'Acknowledge', username + ' has connected');
		socket.broadcast.emit('updatechat', 'SERVER', username + ' has connected');
		io.sockets.emit('updateusers', usernames);
	}


	function callLookup(data,fx) {
		// console.log("Data: " + data);
		ts = Math.round((new Date()).getTime() / 1000);
		var delta = ts - qthTime;
		// console.log("Delta: " + delta);
		if (delta > 2700) {
			qthTime = ts;
			najax(tokenURL, function(xml) {
				parser.parseString(xml, function(err, result) {
					var session = eval(result.HamQTH.session);
					qthID = session[0].session_id[0];
					// console.log("qthID: " + qthID);
					delta = 0;
				});
			});
		}	
	
		db.get(data,function(err,doc){
			if (doc !== undefined && doc.error === undefined) {
				fx(err,doc);
			} 
			else {
				if (qthID != null) {
					var lookupcall = lookupURL  + qthID
					+ "&callsign=" + data + "&prg=" + hamqthprog;
					najax(lookupcall, function(xml) {
						parser.parseString(xml, function(err, result) {
							if (err) {
								console.log("Parse Errror: " + err);
								socket.emit('callnotfound', data + " " + err);
							} else {
								if (result.HamQTH.search) {
									db.save(data,result,function(err,res){

										usernames[data] = data;
										if(err) {
											console.log("CouchDB (save): " + err);
											fx(null,result);
										} else {
											fx(err,result);
										}
									});
								} else {
									socket.emit('callnotfound', data + " Not Found!");
								}
							}
						});
					});
				}
			 }
		});
	}
});

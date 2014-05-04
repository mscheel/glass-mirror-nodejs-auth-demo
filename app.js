// Module dependencies

var express = require('express'), http = require('http'), googleapis = require('googleapis'), OAuth2Client = googleapis.OAuth2Client;

//You will need to set these three environment variables before running
//Find the values at the Developer Console APIs & Auth > APIs > Credentials > OAuth
//Mac: $ EXPORT PROJECT_NAME_CLIENT_ID="1482blahblah"
//PC:  $ EXPORT PROJECT_NAME_CLIENT_ID 1482blahblah
//Open new shell prompt to be sure 

var oauth2Client = new OAuth2Client(process.env.SDFGGXE16_CLIENT_ID,
		process.env.SDFGGXE16_CLIENT_SECRET,
		process.env.SDFGGXE16_REDIRECT_URI);

var app = express();

// all environments
app.set('port', 3000);
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);

// development only
if ('development' == app.get('env')) {
	app.use(express.errorHandler());
}

var success = function(data) {
	console.log('success', data);
};
var failure = function(data) {
	console.log('failure', data);
};
var gotToken = function() {
	googleapis.discover('mirror', 'v1').execute(function(err, client) {
		if (!!err) {
			failure();
			return;
		}
		console.log('mirror client', client);
		listTimeline(client, failure, success);
		insertHello(client, failure, success);
	});
};

// send a simple 'hello world' timeline card with a delete option
var insertHello = function(client, errorCallback, successCallback) {
	client.mirror.timeline
			.insert(
					{
						"text" : "Hello, World",
						"callbackUrl" : "https://mirrornotifications.appspot.com/forward?url=http://localhost:8081/reply",
						"menuItems" : [ {
							"action" : "REPLY"
						}, {
							"action" : "DELETE"
						} ]
					}).withAuthClient(oauth2Client).execute(
					function(err, data) {
						if (!!err)
							errorCallback(err);
						else
							successCallback(data);
					});
};

var listTimeline = function(client, errorCallback, successCallback) {
	client.mirror.timeline.list().withAuthClient(oauth2Client).execute(
			function(err, data) {
				if (!!err)
					errorCallback(err);
				else
					successCallback(data);
			});
};
var grabToken = function(code, errorCallback, successCallback) {
	oauth2Client.getToken(code, function(err, tokens) {
		if (!!err) {
			errorCallback(err);
		} else {
			console.log('tokens', tokens);
			oauth2Client.credentials = tokens;
			successCallback();
		}
	});
};

app.get('/', function(req, res) {
	console.log("mark");
	console.log("mark: " + process.env.SDFGGXE16_CLIENT_ID);
	if (!oauth2Client.credentials) {
		// generates a url that allows offline access and asks permissions
		// for Mirror API scope.
		var url = oauth2Client.generateAuthUrl({
			access_type : 'offline',
			scope : 'https://www.googleapis.com/auth/glass.timeline'
		});
		res.redirect(url);
	} else {
		gotToken();
	}
	res.write('Hello, World card sent to Glass Timeline.  SDFGGXE16 FTW');
	res.end();

});
app.get('/oauth2callback', function(req, res) {
	// if we're able to grab the token, redirect the user back to the main page
	grabToken(req.query.code, failure, function() {
		res.redirect('/');
	});
});
app.post('/reply', function(req, res) {
	console.log('replied', req);
	res.end();
});
app.post('/location', function(req, res) {
	console.log('location', req);
	res.end();
});

http.createServer(app).listen(app.get('port'), function() {
	console.log('Express server listening on port ' + app.get('port'));
});
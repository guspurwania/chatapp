var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var passport = require('passport');
var session = require('express-session');
var FacebookStrategy = require('passport-facebook').Strategy;

app.use(require('cookie-parser')());

var sessionMid = session({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true
});

io.use(function(socket, next){
	sessionMid(socket.request, socket.request.res, next);
});

app.use(sessionMid);

app.use(passport.initialize());
app.use(passport.session());

passport.use(new FacebookStrategy({
	clientID: '112176366049432',
	clientSecret: '7afc5015db7cd958e84b3bb7b51d2d37',
	callbackURL: "http://172.16.11.93:3000/auth/facebook/callback"
}, function(accessToken, refreshToken, profile, done){
	// User.findOrCreate({ facebookId: profile.id }, function(err, user){
	// 	return done(err, user);
	// })
	console.log(profile);
	return done(null, profile);
}));

function checkAuthenticate(req, res, next){
	if(req.isAuthenticated()){
		next()
	} else {
		res.send('<a href="/auth/facebook">Login</a>')
	}
}

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

io.emit('some event', {for: 'everyone'});

app.get('/', checkAuthenticate, function(req, res){
	res.sendFile(__dirname + '/index.html');
});

app.get('/auth/facebook', passport.authenticate('facebook'));

app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { 
  	successRedirect: '/',
    failureRedirect: '/login'}
));

app.get('/login', function(req,res){
	res.end('login');
})

app.get('/logout', function(req, res){
	req.session.destroy(function(err){
		req.logout();
		res.redirect('/');
	})
})

io.on('connection', function(socket){
	console.log('a user connected');

	socket.broadcast.emit('hi');

	socket.on('disconnect', function(){
		console.log('user disconnected');
	});
	socket.on('chat message', function(msg){
		console.log('message: ' + msg);
		var sess = socket.request.session.passport;
		var newMsg = '<div class="header"><strong class="primary-font">' + sess.user.displayName + 
		'</strong> <small class="pull-right text-muted"><span class="glyphicon glyphicon-time">' +
		'</span>12 mins ago</small></div><p>' + msg + '</p></div>';

		io.emit('chat message', newMsg);
	});
})

http.listen(3000, function(){
	console.log('listening on port: 3000');
})
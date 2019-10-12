var express                 = require('express'),
    mongoose                = require('mongoose'),
    passport                = require('passport'),
    bodyParser              = require('body-parser'),
    User                    = require('./models/user'),
    LocalStrategy           = require('passport-local'),
    passportLocalMongoose   = require('passport-local-mongoose');

var CONNECTION_STRING = 'mongodb+srv://NathanLu:NathanLu@cluster0-dbqcz.mongodb.net/user-registration-db?retryWrites=true&w=majority'
mongoose.connect(CONNECTION_STRING);

var app = express();    
app.set('view engine', 'ejs');
app.use(express.static(__dirname))
app.use(bodyParser.urlencoded({extended: true}));
app.use(require('express-session')({
    secret: 'blockspace',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Routes
app.get('/', function(req, res) {
    let loggedIn = false;
    let username;
    if (req.isAuthenticated()) {
        loggedIn = true;
        username = req.user.username
    }
    res.render('index', { username: username, loggedIn: loggedIn });
});

app.get('/dashboard', isLoggedIn, function(req, res) {
    res.render('dashboard');
});

// Auth Routes
app.get('/register', function(req, res) {
    res.render('register');
});

app.post('/register', function(req, res) {
    req.body.username
    req.body.password
    User.register(new User({username: req.body.username}), req.body.password, function(err, user) {
        if(err) {
            console.log(err);
            return res.render('register');
        }
        passport.authenticate('local')(req, res, function() {
            res.redirect('/dashboard');
        });
    });
});

// Login Routes
app.get('/login', function(req, res) {
    res.render('login');
});

app.post('/login', passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/login'
}), function(req, res) {
});

// Logout route
app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/')
})

function isLoggedIn(req, res, next) {
    if(req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}

app.listen(3000, function() {
    console.log('server started');
});
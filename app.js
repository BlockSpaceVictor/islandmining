var express = require('express'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    bodyParser = require('body-parser'),
    User = require('./models/user'),
    Bitcoin = require('bitcoin-address-generator'),
    Binance = require('binance-api-node').default,
    LocalStrategy = require('passport-local'),
    passportLocalMongoose = require('passport-local-mongoose');

var csv = require('csv-parser'),
    fs = require('fs');

var CONNECTION_STRING = 'mongodb+srv://VictorHogrefe:Manowar2@cluster0-dbqcz.mongodb.net/user-registration-db?retryWrites=true&w=majority'
mongoose.connect(CONNECTION_STRING);

var app = express(),
    client = Binance();
    
app.set('view engine', 'ejs');
app.use(express.static(__dirname))
app.use(bodyParser.urlencoded({ extended: true }));
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
app.get('/', function (req, res) {
    let loggedIn = false;
    let username;
    if (req.isAuthenticated()) {
        loggedIn = true;
        username = req.user.username
    }
    res.render('index', { username: username, loggedIn: loggedIn });
});

app.get('/dashboard', isLoggedIn, async function (req, res) {
    var listOfPrices = await client.prices();

    var userEmail = req.user.username;
    var verified = false;

    // Check if user is already verified
    User.findOne({ username: userEmail }, (err, user) => {
        if (err) {
            console.log('Error finding user:', err)
        }
        if (user['verified'] === true) {
            verified = true;
        }
        // If user is not verified, verify them
        fs.createReadStream('data.csv')
            .pipe(csv())
            .on('data', (row) => {
                if (userEmail === row['Email'] && verified === false) {
                    User.findOneAndUpdate({ username: userEmail }, { verified: true }, (err) => {
                        if (err) console.log('Update verified error:', err);
                    });
                    verified = true;
                    console.log('Verified', userEmail);
                }
            })
            .on('end', () => {
                console.log('CSV file processed');
                res.render('dashboard', { 
                    username: userEmail,
                    verified: verified, 
                    bitcoinAddress: user['bitcoinAddress'], 
                    referralAddress: user['referralAddress'],
                    prices: {
                        'BTC': listOfPrices['BTCUSDT'],
                        'ETH': listOfPrices['ETHUSDT'],
                        'LTC': listOfPrices['LTCUSDT']
                    }
                })
            })
    })
});

// Auth Routes
app.get('/register', function (req, res) {
    res.render('register');
});

app.post('/register', function (req, res) {
    Bitcoin.createWalletAddress(response => {
        User.register(new User({
            username: req.body.username,
            bitcoinAddress: response['address'],
            referralAddress: Math.floor((Math.random() * 1000000000) + 1)
        }), req.body.password, function (err, user) {
            if (err) {
                console.log(err);
                return res.render('register');
            }

            passport.authenticate('local')(req, res, function () {
                res.redirect('/dashboard');
            });
        });
    })
});

// Login Routes
app.get('/login', function (req, res) {
    res.render('login');
});

app.post('/login', passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/login'
}), function (req, res) {
});

// Logout route
app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/')
})

// Update user
app.post('/update', function(req, res) {
    console.log(req.body.prices);
    res.redirect('back');
    
    User.findOneAndUpdate({ username: 'nate@nate.com' }, { prices: req.body.prices }, (err) => {
        if (err) console.log('Lock in user prices error:', err);
    });
    
    
})

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}


app.listen(process.env.PORT || 3000, function () {
    console.log('Server started');
})
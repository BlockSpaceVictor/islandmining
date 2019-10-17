var express = require('express'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    bodyParser = require('body-parser'),
    User = require('./models/user'),
    LocalStrategy = require('passport-local'),
    passportLocalMongoose = require('passport-local-mongoose');

var bjs = require('bitcoinjs-lib'),
    bip32 = require('bip32'),
    Binance = require('binance-api-node').default

var csv = require('csv-parser'),
    fs = require('fs');

var xpub =
    'xpub6CzDCPbtLrrn4VpVbyyQLHbdSMpZoHN4iuW64VswCyEpfjM2mJGdaHJ2DyuZwtst96E16VvcERb8BBeJdHSCVmAq9RhtRQg6eAZFrTKCNqf';
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
    var pricesLockedIn = false;
    var userLockedInPrices = {
        'BTC': null,
        'ETH': null,
        'LTC': null
    }
    var userInformation = {};

    // Check if user is already verified
    User.findOne({ username: userEmail }, (err, user) => {
        if (err) {
            console.log('Error finding user:', err)
        }
        // Checks if user is locked in
        if (user['prices']) {
            let prices = JSON.parse(user['prices'])

            if (Date.parse(prices['expiryDate']) < new Date(Date.now())) {
                User.findOneAndUpdate({ username: userEmail }, { $unset: { prices: 1 } }, (err) => {
                    if (err) console.log('Error expiring price', err);
                });
                console.log('Deleting user prices')
                // Enable lock in button again.
                // Load normal currency prices
                pricesLockedIn = false;
            } else {
                // Load user prices
                pricesLockedIn = true;
                userLockedInPrices['BTC'] = prices['BTC'];
                userLockedInPrices['ETH'] = prices['ETH'];
                userLockedInPrices['LTC'] = prices['LTC'];
                userLockedInPrices['expiryDate'] = prices['expiryDate'];
            }
        }

        if (user['verified'] === true) {
            verified = true;
        }
        // If user is not verified, verify them
        fs.createReadStream('data.csv')
            .pipe(csv())
            .on('data', (row) => {
                if (userEmail === row['Email']) {
                    userInformation['FirstName'] = row['FirstName'];
                    userInformation['LastName'] = row['LastName'];
                    userInformation['DOB'] = row['ScanDOB'];
                    userInformation['Email'] = row['Email'];
                    userInformation['Address'] = row['Address'];
                    userInformation['City'] = row['City'];
                    userInformation['StateProvince'] = row['StateProvince'];
                    userInformation['Country'] = row['Country'];
                    userInformation['DocumentType'] = row['DocumentType'];


                    if (verified === false) {
                        User.findOneAndUpdate({ username: userEmail }, { verified: true }, (err) => {
                            if (err) console.log('Update verified error:', err);
                        });
                        verified = true;
                        console.log('Verified', userEmail);                        
                    }
                }
            })
            .on('end', () => {
                console.log('CSV file processed');
                res.render('dashboard', {
                    username: userEmail,
                    verified: verified,
                    bitcoinAddress: user['bitcoinAddress'],
                    referrals: user['referrals'],
                    referralAddress: user['referralAddress'],
                    prices: {
                        'BTC': listOfPrices['BTCUSDT'],
                        'ETH': listOfPrices['ETHUSDT'],
                        'LTC': listOfPrices['LTCUSDT']
                    },
                    affiliatePermissions: user['affiliatePermissions'],
                    userInformation: userInformation,
                    isLockedIn: pricesLockedIn,
                    lockedInPrices: userLockedInPrices
                })
            })
    })
});

// Auth Routes
app.get('/register', function (req, res) {
    if (req.isAuthenticated()) {
        res.redirect('/dashboard');
    } else {
        res.render('register');
    }
});

app.post('/register', async function (req, res) {
    var userIndex = await User.count();
    ++userIndex;
    var { address } = bjs.payments.p2sh({
        redeem: bjs.payments.p2wpkh({
            pubkey: bip32
                .fromBase58(xpub)
                .derive(0)
                .derive(userIndex).publicKey,
        }),
    });

    User.register(new User({
        username: req.body.username,
        bitcoinAddress: address,
        userIndex: userIndex,
        referralAddress: Math.floor((Math.random() * 1000000000) + 1)
    }), req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            return res.render('register');
        }

        passport.authenticate('local')(req, res, function () {
            if (req.user.referralAddress != req.body.referral) {
                User.findOneAndUpdate({ referralAddress: req.body.referral }, { $inc: { referrals: 1 } }, function (err) {
                    console.log(err);
                })
            } else {
                res.send('Cannot enter your own referral address');
            }
            res.redirect('/dashboard');
        });
    });

});

// Login Routes
app.get('/login', function (req, res) {
    if (req.isAuthenticated()) {
        res.redirect('/dashboard');
    } else {
        res.render('login');
    }
});

app.post('/login', passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/login'
}), function (req, res) {
});

// Logout route
app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/login')
})

// Update user
app.post('/update', function (req, res) {
    req.body.prices['expiryDate'] = new Date(Date.now() + 1000 * 60 * 60 * 12);
    console.log(req.body.prices);
    res.redirect('back');

    User.findOneAndUpdate({ username: req.body.username }, { prices: JSON.stringify(req.body.prices) }, (err) => {
        if (err) console.log('Lock in user prices error:', err);
    });
})

// Referral
app.post('/referral', isLoggedIn, function(req, res) {


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
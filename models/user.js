var mongoose                = require('mongoose'),
    passportLocalMongoose   = require('passport-local-mongoose');

var UserSchema = new mongoose.Schema({
    username: String,
    name: String,
    phone: String,
    password: String,
    verified: {
        type: Boolean,
        default: false
    },
    prices: {
        type: Array,
        expiresAt: {
            type: Date, 
            expires: '10s'
        }
    },
    bitcoinAddress: String,
    referralAddress: String,

});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema);


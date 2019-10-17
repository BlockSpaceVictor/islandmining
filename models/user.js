var mongoose                = require('mongoose'),
    passportLocalMongoose   = require('passport-local-mongoose');

var UserSchema = new mongoose.Schema({
    username        : String,
    name            : String,
    phone           : String,
    password        : String,
    verified: {
        type    : Boolean,
        default : false
    },
    affiliatePermissions: {
        type: Boolean,
        default: false
    },
    userIndex       : String,
    prices          : String,
    bitcoinAddress  : String,
    referrals: {
        type: Number,
        default: 0, 
    },
    referralAddress : String,

});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema);


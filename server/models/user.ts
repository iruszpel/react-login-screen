var mongoose = require('mongoose');
const argon2 = require('argon2');

var UserSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true
    },
    name: {
        type: String,
        unique: false,
        required: true,
        trim: true
    },
    password: {
        type: String,
        required: false
    },
    signup_timestamp: {
        type: Number,
        required: true
    },
    signed_up_with: {
        type: String,
        required: true
    },
    profile_picture_url: {
        type: String,
        required: false
    },
});

UserSchema.statics.authenticate = function (email: string, password: string, callback: any) {
    User.findOne({ email: email })
        .exec(function (err: any, user: { password: string }) {
            if (err) {
                return callback(err)
            } else if (!user) {
                err = new Error('Wrong email or password.');
                err.status = 401;
                return callback(err);
            }
            if (user.password) {
                argon2.verify(user.password, password).then((match: any) => {
                    if (match) {
                        return callback(null, user);
                    } else {
                        return callback();
                    }
                }).catch((err: any) => {
                    return callback(err);
                });
            }
            else {
                return callback();
            }
        });
}



var User = mongoose.model('User', UserSchema);
module.exports = User;


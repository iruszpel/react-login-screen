import dotenv from 'dotenv';
import express from 'express';
import request from 'request';
import { OAuth2Client } from 'google-auth-library';
import base64url from 'b64url';
import crypto from 'crypto';
import argon2 from 'argon2'
import fs from 'fs'

const router = express.Router();
const User = require('../models/user');
const client: OAuth2Client = new OAuth2Client(process.env.GOOGLE_CLIENTID);
const mailteststring: RegExp = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
const parse_signed_request = (signed_request: string, secret: crypto.BinaryLike) => {
    let encoded_data = signed_request.split('.', 2);
    // decode the data
    let sig = encoded_data[0];
    let json = base64url.decode(encoded_data[1]);
    let data = JSON.parse(json); // ERROR Occurs Here!

    // check algorithm - not relevant to error
    if (!data.algorithm || data.algorithm.toUpperCase() != 'HMAC-SHA256') {
        console.error('Unknown algorithm. Expected HMAC-SHA256');
        return null;
    }

    // check sig - not relevant to error
    let expected_sig = crypto.createHmac('sha256', secret).update(encoded_data[1]).digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace('=', '');
    if (sig !== expected_sig) {
        console.error('Bad signed JSON Signature!');
        return null;
    }

    return data;
}
const dotenvPath = fs.existsSync('.env.local') ? '../.env.local' : '../.env'

dotenv.config({ path: dotenvPath })

// POST SIGN UP CALL USING WEBSITE FORM
router.post('/api/signup', (req: any, res: any) => {
    res.header('Access-Control-Allow-Origin', 'localhost');
    if (req.body &&
        req.body.captcha_response &&
        req.body.captcha_response.length > 120 &&
        req.body.mail &&
        mailteststring.test(String(req.body.mail).toLowerCase()) &&
        req.body.name &&
        req.body.password &&
        req.body.password.length == 128) {

        var headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
        };
        var options = {
            url: 'https://www.google.com/recaptcha/api/siteverify',
            method: 'POST',
            headers: headers,
            body: `secret=${process.env.CAPTCHA_SECRET}&response=${req.body.captcha_response}`
        };

        let callbackCaptcha = async (error: any, response: { statusCode: number; }, body: string) => {
            if (!error && response.statusCode == 200 && JSON.parse(body).success == true) {
                let hashedPassword = await argon2.hash(req.body.password, {
                    raw: false,
                    type: argon2.argon2id
                })
                var userData = {
                    email: req.body.mail.toLowerCase(),
                    name: req.body.name,
                    password: hashedPassword,
                    signup_timestamp: new Date().getTime(),
                    signed_up_with: "website"
                }
                User.find({ email: req.body.mail.toLowerCase() }).limit(1).exec((err: any, docs: { length: any; }) => {
                    if (docs.length) {
                        res.send(JSON.stringify({ "signup_success": false, "error": "user_exists" })); // Response if user exists in database
                    } else {
                        User.create(userData, function (error: any, user: { _id: any; }) {
                            if (error) {
                                res.send(JSON.stringify({ "signup_success": false, "error": "Database error" }));
                            } else {
                                req.session.userId = user._id;
                                res.send(JSON.stringify({ "signup_success": true }));
                            }
                        });

                    }
                });

            }
            else {
                res.send(JSON.stringify({ "signin_success": false, "error": "captcha_error" }));
            }
        }

        request(options, callbackCaptcha);
    }
    else {
        res.send('{message:"Bad request"}');
    }

});
// POST SIGN IN CALL USING WEBSITE FORM
router.post('/api/signin', function (req: any, res: any) {
    res.header('Access-Control-Allow-Origin', 'localhost');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    if (req.body.mail &&
        mailteststring.test(String(req.body.mail).toLowerCase()) &&
        req.body.password &&
        req.body.captcha_response &&
        req.body.captcha_response.length > 120 &&
        req.body.password.length == 128) {
        var headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
        };
        var options = {
            url: 'https://www.google.com/recaptcha/api/siteverify',
            method: 'POST',
            headers: headers,
            body: `secret=${process.env.CAPTCHA_SECRET}&response=${req.body.captcha_response}`
        };

        let callbackCaptchaSignIn = (error: any, response: { statusCode: number; }, body: string) => {
            if (!error && response.statusCode == 200 && JSON.parse(body).success == true) {
                User.authenticate(req.body.mail.toLowerCase(), req.body.password, function (error: any, user: { _id: any; }) {
                    if (error || !user) {
                        res.send(JSON.stringify({ "signin_success": false, "error": "wrong_credentials" }));
                    } else {
                        req.session.userId = user._id;
                        res.send(JSON.stringify({ "signin_success": true }));
                    }
                });
            }
            else {
                res.send(JSON.stringify({ "signin_success": false, "error": "captcha_error" }));
            }
        }
        request(options, callbackCaptchaSignIn);
    } else {
        res.send('{message:"Bad request"}');
    }
});
// SIGN UP WITH GOOGLE
router.post('/api/oauth/google', function (req: any, res: any) {
    res.header('Access-Control-Allow-Origin', 'localhost');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    if (req.body.id_token && req.body.id_token.length > 30) {
        let verify = async () => {
            const ticket = await client.verifyIdToken({
                idToken: req.body.id_token,
                audience: `${process.env.GOOGLE_CLIENTID}`,

            });
            const payload = ticket.getPayload();
            const userid = payload!['sub'];
            console.log(payload)
            if (payload!['email'] && payload!['given_name']) {
                var userData = {
                    email: payload!['email'].toLowerCase(),
                    name: payload!['given_name'],
                    signup_timestamp: new Date().getTime(),
                    signed_up_with: "google",
                    profile_picture_url: payload!['picture']
                }
                User.find({ email: payload!['email'].toLowerCase() }).limit(1).exec(function (err: any, docs: { _id: any; }[]) {

                    if (docs.length) {
                        console.log(docs);
                        console.log("SEnding. Docs length cool");
                        req.session.userId = docs[0]._id;

                        res.send(JSON.stringify({ "signup_success": true, "message": "user_exists" }));
                    }
                    else {
                        console.log("Going to else")
                        User.create(userData, function (error: any, user: { _id: any; }) {
                            console.log("Creating user before if else")
                            if (error) {
                                console.log("Error")
                                res.send(JSON.stringify({ "signup_success": false, "error": "Database error" }));
                            } else {
                                console.log("success")
                                req.session.userId = user._id;
                                res.send(JSON.stringify({ "signup_success": true }));
                            }
                        });
                    }
                });
            }
            else {
                res.send(JSON.stringify({ "signup_success": false, "error": "No email or name provided in Google account" }));
            }
        }
        verify().catch(console.error);
    } else {
        res.send('{message:"Bad request"}');
    }
});
router.post('/api/oauth/facebook', function (req: any, res: any) {
    if (req.body.signed_request) {
        let decoded_data = parse_signed_request(req.body.signed_request, "24f4546993454e8cb463ea58ef104367")

        if (decoded_data) {
            request.post({
                url: `https://graph.facebook.com/v2.12/oauth/access_token?client_id=${process.env.FB_CLIENTID}&client_secret=${process.env.FB_CLIENT_SECRET}&redirect_uri=&code=${decoded_data.code}`,
                headers: {
                    'Origin': "https://localhost:3000"
                }
            }, function (err: any, r: any, body: string) {
                let json = JSON.parse(body)
                console.log(json.access_token);
                //After response with access token make a request for user data
                request.post({
                    url: `https://graph.facebook.com/v2.12/me?fields=name%2Cemail%2Cpicture&access_token=${json.access_token}`,
                    headers: {
                        'Origin': "https://localhost:3000"
                    }
                }, function (err: any, r: any, body: any) {
                    body = JSON.parse(body)
                    var userData = {
                        email: body.email.toLowerCase(),
                        name: body.name.split(" ")[0],
                        signup_timestamp: new Date().getTime(),
                        signed_up_with: "facebook",
                        profile_picture_url: body.picture.data.url
                    }
                    console.log(userData)
                    User.find({ email: body.email.toLowerCase() }).limit(1).exec(function (err: any, docs: { _id: any; }[]) {
                        if (docs.length) {
                            console.log(docs);
                            req.session.userId = docs[0]._id;
                            res.send(JSON.stringify({ "signup_success": true, "message": "user_exists" })); // Response if user exists in database
                        } else {
                            User.create(userData, function (error: any, user: { _id: any; }) {
                                if (error) {
                                    console.log(error);
                                    res.send(JSON.stringify({ "signup_success": false, "error": "Database error" }));
                                } else {
                                    req.session.userId = user._id;
                                    res.send(JSON.stringify({ "signup_success": true }));
                                }
                            });

                        }
                    });

                    console.log(body.email.toLowerCase());
                })
            })
        }
        else {
            res.send(JSON.stringify({ "error": "Invalid signed request" }));
        }
    }
})
router.post('/api/oauth/twitter/getrequesttoken', function (req: any, res: { send: { (arg0: number, arg1: { message: any; }): void; (arg0: string): void; }; }) {
    request.post({
        url: 'https://api.twitter.com/oauth/request_token',
        oauth: {
            //oauth_callback: "https://localhost:3000/api/oauth/twitter",
            consumer_key: process.env.TWITTER_CONSUMER_KEY,
            consumer_secret: process.env.TWITTER_CONSUMER_SECRET
        }
    }, function (err: { message: any; }, r: any, body: { replace: (arg0: RegExp, arg1: string) => { replace: (arg0: RegExp, arg1: string) => string; }; }) {
        if (err) {
            return res.send(500, { message: err.message });
        }
        console.log(body);

        var jsonStr = '{ "' + body.replace(/&/g, '", "').replace(/=/g, '": "') + '"}';
        console.log(jsonStr);
        let oauthobj = JSON.parse(jsonStr)
        res.send(JSON.stringify({ oauth_token: oauthobj.oauth_token }));
    });

})
router.post('/api/oauth/twitter', function (req: any, res: any) {
    if (req.body.oauth_token && req.body.oauth_verifier) {
        request.post({
            url: 'https://api.twitter.com/oauth/access_token',
            oauth: {
                consumer_key: process.env.TWITTER_CONSUMER_KEY,
                token: req.body.oauth_token,
                verifier: req.body.oauth_verifier
            },
            headers: {
                'Origin': "https://localhost:3000"
            },
            body: `oauth_verifier=${req.body.oauth_verifier}`
        }, function (err: { message: any; }, r: any, body: { replace: (arg0: RegExp, arg1: string) => { replace: (arg0: RegExp, arg1: string) => string; }; }) {
            if (err) {
                return res.send(500, { message: err.message });
            }
            console.log(body);

            const jsonStr = JSON.parse('{ "' + body.replace(/&/g, '", "').replace(/=/g, '": "') + '"}');
            request.get({
                url: 'https://api.twitter.com/1.1/account/verify_credentials.json?include_email=true&skip_status=true',
                oauth: {
                    consumer_key: process.env.TWITTER_CONSUMER_KEY,
                    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
                    token: jsonStr.oauth_token,
                    token_secret: jsonStr.oauth_token_secret
                },
                headers: {
                    'Origin': "https://localhost:3000",
                    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.117 Safari/537.36"
                },
            }, function (err: { message: any; }, r: any, body: string) {
                if (err) {
                    return res.send(500, { message: err.message });
                }
                console.log(body);
                var bodyjson = JSON.parse(body);
                var userData = {
                    email: bodyjson.email.toLowerCase(),
                    name: bodyjson.name.split(" ")[0],
                    signup_timestamp: new Date().getTime(),
                    signed_up_with: "twitter",
                    profile_picture_url: bodyjson.profile_image_url_https
                }
                console.log(userData)
                if (bodyjson && bodyjson.email) {
                    User.find({ email: userData.email.toLowerCase() }).limit(1).exec(function (err: any, docs: { _id: any; }[]) {
                        if (docs && docs[0]._id) {
                            req.session.userId = docs[0]._id;
                            return res.send(JSON.stringify({ "signup_success": true, "message": "user_exists" })); // Response if user exists in database
                        } else {
                            User.create(userData, function (error: any, user: { _id: any; }) {
                                if (error) {
                                    console.log(error);
                                    res.send(JSON.stringify({ "signup_success": false, "error": "Database error" }));
                                } else {
                                    req.session.userId = user._id;
                                    res.send(JSON.stringify({ "signup_success": true }));
                                }
                            });
                        }
                    })
                }
            })

        });


    }
    else {
        res.send("Redirecting...");
    }
})
router.get('/api/logout', function (req: any, res: any) {

    // delete session object
    req.session.destroy(function (err: any) {
        if (err) {
            console.log(err);
        } else {
            res.clearCookie('connect.sid');
            res.redirect('/');
        }
    });

});
router.get('/api/me/userinfo', function (req: any, res: any, next: any) {
    User.find({ _id: req.session.userId }).limit(1)
        .exec(function (error: any, user: any) {
            user = user[0]
            if (error) {
                return next(error);
            } else {
                if (!user) {
                    res.send(JSON.stringify({
                        error: "not_authorized"
                    }))
                } else {
                    return res.send(JSON.stringify({
                        name: user.name,
                        profile_picture_url: user.profile_picture_url
                    }))
                }
            }
        });
});

module.exports = router;

import dotenv from 'dotenv';
import express from "express"
import bodyParser from 'body-parser'
import session from "express-session"
import mongoose from "mongoose"
import MongoStoreTemp from "connect-mongo"
import compression from 'compression'
import fs from 'fs'

const dotenvPath = fs.existsSync('.env.local') ? '.env.local' : '.env'
const port = process.env.PORT || 5000;
const MongoStore = MongoStoreTemp(session)
const app : express.Application = express();
dotenv.config({ path: dotenvPath })

module.exports = {};

mongoose.connect(`mongodb://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}`, { useNewUrlParser: true });
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));


const sessionStore = new MongoStore({
    "mongooseConnection": db
});

module.exports.sessionStore = sessionStore;
app.use(session({
    "secret": "exq5fpSdKhEyWRyZd7SFbUPGArNfBntF",
    "resave": true,
    "saveUninitialized": false,
    "store": sessionStore,
    "cookie": { "maxAge": 2592000000 }

}));
app.use(compression())
app.use(bodyParser.json())

const user = require("./routes/user");

app.use("/", user);


app.listen(port, () => console.log(`Listening on port ${port}`));
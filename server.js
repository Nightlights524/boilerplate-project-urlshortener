require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const dns = require('dns');
const nanoid = require('nanoid').nanoid;
// const urlLib = require ('url');
const app = express();

// const urlVariable = Date.now();
// console.log(`url=https://timestamp-microservice.freecodecamp.rocks/api/timestamp/${urlVariable}`);

mongoose.set('debug', true);
mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {console.log('Successfully connected');});
// db.once('open', () => {console.log(mongoose.connection.readyState);});

// console.log(d;

const urlSchema = new mongoose.Schema({
  original_url: {type: String, required: true},
  short_url: {type: String, required: true, unique: true}
});

const Url = mongoose.model('Url', urlSchema);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use('/public', express.static(`${process.cwd()}/public`));
app.use(bodyParser.urlencoded({extended: false}));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// const DNS_LOOKUP_REGEX = /^https?:\/\//i

// Your first API endpoint
app.post('/api/shorturl/new', (req, res) => {
  
  // const lookupUrl = req.body.url.replace(DNS_LOOKUP_REGEX, '');
  // const lookupUrl = new URL(req.body.url);

  const urlObject = new URL(req.body.url);

  dns.lookup(urlObject.hostname, (err, address, family) => {
    if (err) {
      res.json({ error: 'invalid url' });
    }
    else {
      const shortUrl = nanoid(5);
      
      const url = new Url({
        original_url: req.body.url,
        short_url: shortUrl
      });

      url.save((err, url) => {
        if (err) return console.error(err);
        console.log("URL ADDED TO MONGO");

        res.json({
          original_url: req.body.url,
          short_url: shortUrl
        });
      });
    }
  });
});

app.get('/api/shorturl/:requestUrl', (req, res) => {
  Url.findOne({short_url: req.params.requestUrl}, (err, url) => {
    if (err) return console.error(err);

    if (url) {
      res.redirect(url.original_url);
    }
    else {
      res.json({"error": "No short URL found for the given input"});
    }
  });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
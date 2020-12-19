require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const dns = require('dns');
const nanoid = require('nanoid').nanoid;
const util = require('util');
const app = express();

// Set up database and schema
mongoose.set('debug', true);
mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {console.log('Successfully connected');});

const urlSchema = new mongoose.Schema({
  original_url: {type: String, required: true, unique: true},
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

const DNS_LOOKUP_REGEX = /^https?:\/\//i;
const dnsLookup = util.promisify(dns.lookup);

app.post('/api/shorturl/new', (req, res) => {
  // First check if request URL starts with http:// or https://
  if (!DNS_LOOKUP_REGEX.test(req.body.url)) {
    return res.json({ error: 'invalid url' });
  }
  
  async function addurl() {
    try {
      const shortUrl = nanoid(5);
      
      const urlDoc = await Url.findOne({$or: [{original_url: req.body.url}, {short_url: shortUrl}]}).exec();
      
      if (urlDoc) {
        if (urlDoc.original_url === req.body.url) {
          return res.json({
            original_url: urlDoc.original_url,
            short_url: urlDoc.short_url
          });
        }
        return res.json({ error: "duplicate short_url" })
      }

      const urlObject = new URL(req.body.url);
      await dnsLookup(urlObject.hostname);

      const url = new Url({
        original_url: req.body.url,
        short_url: shortUrl
      });

      const savedDoc = await url.save();
      return res.json({
        original_url: savedDoc.original_url,
        short_url: savedDoc.short_url
      });
    } 
    catch(error) {
      console.error(error);
      return res.json({"error": error.message});
    }
  }

  addurl();
});

app.get('/api/shorturl/:requestUrl', (req, res) => {
  Url.findOne({short_url: req.params.requestUrl}).orFail().exec()
    .then(urlDoc => res.redirect(urlDoc.original_url))
    .catch(error => {
      console.error(error);
      res.json({"error": "No short URL found for the given input"});
    });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const dns = require('dns');
const nanoid = require('nanoid').nanoid;
const app = express();

mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.once('open', () => {console.log('Successfully connected');});
// db.once('open', () => {console.log(mongoose.connection.readyState);});

const urlSchema = new mongoose.Schema({
  "original_url": String,
  "short_url": String
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

// Your first API endpoint
app.post('/api/shorturl/new', function(req, res) {
  // dns.lookup(req.body.url);

  res.json({
    original_url: req.body.url,
    short_url: nanoid(5)
  });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
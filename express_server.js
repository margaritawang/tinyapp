var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.set('view engine', 'ejs');

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
})

app.get('/urls', (req, res) => {
  let templateVars = { urls: urlDatabase };
  res.render('urls_index', templateVars);
})

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.post("/urls", (req, res) => {
  //console.log(req.body);
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL; // debug statement to see POST parameters
  //console.log(urlDatabase);
  res.redirect(`/urls/${shortURL}`);
});

app.get("/u/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  let longURL = urlDatabase[shortURL];
  res.redirect(longURL);
});

app.get("/urls/:id", (req, res) => {
  let shortURL = req.params.id;
  let longURL = urlDatabase[shortURL];

  res.render("urls_show", {
    shortURL: shortURL,
    longURL: longURL
    });
});

app.post("/urls/:id", (req, res) => {
  let shortURL = req.params.id;
  let longURL = req.body.longURL;
  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls/${shortURL}`);
})

app.post('/urls/:id/delete', (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
})


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

function generateRandomString() {
  return Math.floor((1 + Math.random()) * 0x100000).toString(16);
}
var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080;
const bcrypt = require('bcrypt');
var cookieSession = require('cookie-session');
var methodOverride = require('method-override');

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.use(methodOverride('_method'));

app.use(cookieSession({
  name: 'session',
  keys: ['key']
}));

app.set('view engine', 'ejs');

const users = {
  "a": {
    id: "a",
    email: "a@example.com",
    password: "123"
  },
  "b": {
    id: "b",
    email: "b@example.com",
    password: "456"
  },
  "c": {
    id: "c",
    email: "c@example.com",
    password: "789"
  }
};

var urlDatabase = {
  "b2xVn2": {
    id: "b2xVn2",
    longURL: "http://www.lighthouselabs.ca",
    uid: 'a',
    views: 0
  },
  "9sm5xK": {
    id: '9sm5xK',
    longURL: "http://www.google.com",
    uid: 'b',
    views: 0
  },
  "abcdef": {
    id: "abcdef",
    longURL: "http://facebook.com",
    uid: 'b',
    views: 0
  }
};

function generateRandomString() {
  return Math.floor((1 + Math.random()) * 0x100000).toString(16);
}

function checkLoginStatus(req) {
  // return Boolean(req.session.userID);
  // return !!req.session.userID;
  for (var i in users) {
    if (req.session.userID === i) {
      return true;
    }
  }
  return false;
}

function urlsForUser(id) {
  let userDB = {};
  for (var url in urlDatabase) {
    if (urlDatabase[url].uid === id) {
      userDB[url] = urlDatabase[url].longURL;
    }
  }
  return userDB;
}


app.get("/", (req, res) => {
  //if user is logged in, redirect to /urls
  if (checkLoginStatus(req)) {
    res.redirect('/urls');
  } else {
  //if user is not logged in,redirect to /login
    res.redirect('/login');
  }
});

app.get('/urls', (req, res) => {
  //   if user is logged in returns HTML with: the site header, a list (or table) of URLs the user has created, each list item containing:
  // a short URL, the short URL's matching long URL, an edit button which makes a GET request to /urls/:id
  // a delete button which makes a POST request to /urls/:id/delete
  // a link to "Create a New Short Link" which makes a GET request to /urls/new
  if (checkLoginStatus(req)) {
    let templateVars = {
      userId: req.session.userID,
      userDB: urlsForUser(req.session.userID),
      email: users[req.session.userID].email
    };

    res.render('urls_index', templateVars);
  } else {
    // if user is not logged in returns HTML with a relevant error message
    res.status(401).send("<html><body>Please log in or register! <a href='/login'>Log In</a> <a href='/register'>Register</a></body></html>\n");
  }
});

app.get("/urls/new", (req, res) => {
  // if user is logged in
  if (checkLoginStatus(req)) {
    let templateVars = {
      userId: req.session.userID,
      email: users[req.session.userID].email
    };
    // returns HTML with:
    // the site header (see Display Requirements above)
    // a form which contains:
    // a text input field for the original (long) URL
    // a submit button which makes a POST request to /urls
    res.render("urls_new", templateVars);
  } else {
    // if user is not logged in redirects to the /login page
    res.redirect('/login');
  }
});

app.post("/urls", (req, res) => {
  // if user is not logged in returns HTML with a relevant error message
  if (!req.session.userID) {
    res.status(401).send("<html><body>'Please log in first!'<a href='/login'>Log In</a> <a href='/register'>Register</a></body></html>\n");
  } else {
    // if user is logged in generates a short URL, saves it, and associates it with the user
    let shortURL = generateRandomString();
    urlDatabase[shortURL] = {
      id: shortURL,
      longURL: req.body.longURL,
      uid: req.session.userID,
      views: 0
    };

    // redirects to /urls/:id, where :id matches the ID of the newly saved URL
    res.redirect(`/urls/${shortURL}`);
  }
});

app.get("/u/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  // if URL for the given ID does not exist returns HTML with a relevant error message
  if (!urlDatabase[shortURL]) {
    res.status(404).send("URL doesn't exist!");
  } else {
  // if URL for the given ID exists redirects to the corresponding long URL
    let longURL = urlDatabase[shortURL].longURL;
    urlDatabase[shortURL].views += 1;
    res.redirect(longURL);
    console.log(urlDatabase[shortURL].views);
  }
});

app.get("/urls/:id", (req, res) => {
  var shortURL = req.params.id;
  var userDB = urlsForUser(req.session.userID);
  // if user is not logged in returns HTML with a relevant error message
  if (!req.session.userID) {
    res.status(401).send("<html><body>Please log in first!<a href='/login'>Log In</a> <a href='/register'>Register</a></body></html>\n");
  // if user is logged it but does not own the URL with the given ID returns HTML with a relevant error message
  } else if (userDB[req.params.id] === undefined) {
    res.status(401).send("<html><body>No access to URL!<a href='/login'>Log In</a> <a href='/register'>Register</a></body></html>\n");
  } else {
  //  if user is logged in and owns the URL for the given ID returns HTML with:
  // the site header,the short URL (for the given ID), a form which contains:
  // the corresponding long URL, an update button which makes a POST request to /urls/:id
    let templateVars = {
      shortURL: shortURL,
      longURL: userDB[shortURL],
      userId: req.session.userID,
      email: users[req.session.userID].email
    };
    res.render("urls_show", templateVars);
  }
});

app.put("/urls/:id", (req, res) => {
  var userDB = urlsForUser(req.session.userID);
  // if user is not logged in, returns HTML with a relevant error message
  if (!req.session.userID) {
    res.status(401).send("<html><body>'Please log in first!'<a href='/login'>Log In</a> <a href='/register'>Register</a></body></html>\n");
  //  if user is logged it but does not own the URL for the given ID returns HTML with a relevant error message
  } else if (userDB[req.params.id] === undefined) {
    res.send("<html><body>No access to URL! <a href='/login'>Log In</a> <a href='/register'>Register</a></body></html>\n");
  } else {
    // if user is logged in and owns the URL for the given ID updates the URL, redirects to /urls
    let shortURL = req.params.id;
    let longURL = req.body.longURL;
    if (!shortURL || !longURL) {
      res.redirect('/urls');
    } else {
      urlDatabase[shortURL].longURL = longURL;
      res.redirect('/urls');
    }
  }

});

app.delete('/urls/:id', (req, res) => {
  var userDB = urlsForUser(req.session.userID);
  // if user is not logged in returns HTML with a relevant error message
  if (!req.session.userID) {
    res.status(401).send("<html><body>'Please log in first!'<a href='/login'>Log In</a> <a href='/register'>Register</a></body></html>\n");
  // if user is logged it but does not own the URL for the given ID returns HTML with a relevant error message
  } else if (userDB[req.params.id] === undefined) {
    res.send("<html><body>No access to URL! <a href='/login'>Log In</a> <a href='/register'>Register</a></body></html>\n");
  } else {
  // if user is logged in and owns the URL for the given ID deletes the URL, redirects to /urls
    delete urlDatabase[req.params.id];
    res.redirect('/urls');
  }
});

app.get('/login', (req, res) => {
  // if user is logged in redirects to /urls
  if (checkLoginStatus(req)) {
    res.redirect('/urls');
  } else {
  // if user is not logged inreturns HTML with a form which containsinput fields for email and password, submit button that makes a POST request to /login
    res.render('login');
  }
});

app.post('/login', (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  if (!email || !password) {
    res.status(400).send("<html><body>Bad Request: Please enter email or password! <a href='/login'>Log In</a></body></html>\n");
    return;
  }
  for (var user in users) {
    // If email and password params match an existing user sets a cookie, redirects to /urls
    if (email === users[user].email && bcrypt.compareSync(password, users[user].password)) {
      req.session.userID = users[user].id;
      res.redirect('/urls');
      return;
    }
  }
  // if email and password params don't match an existing user returns HTML with a relevant error message
  res.status(403).send("<html><body>Username or password incorrect! <a href='/login'>Log In</a> <a href='/register'>Register</a> </body></html>\n");
});

app.post('/logout', (req, res) => {
  // deletes cookie
  req.session = null;
  // redirects to /urls
  res.redirect('/urls');
});

app.get('/register', (req, res) => {
  // if user is logged in redirects to /urls
  if (checkLoginStatus(req)) {
    res.redirect('/urls');
  } else {
    //  if user is not logged in returns HTML witha form which contains input fields for email and password
    // a register button that makes a POST request to /register
    res.render("register");
  }
});

app.post('/register', (req, res) => {
  var email = req.body.email;
  var password = req.body.password;
  var hashedPassword = bcrypt.hashSync(password, 10);
  var userId = generateRandomString();
  //   if email or password are empty returns HTML with a relevant error message
  if (!email || !password) {
    res.status(400).end("<html><body>Bad Request: Please enter email or password!</body></html>\n");
    return;
  }
  for (var user in users) {
    // if email already exists returns HTML with a relevant error message
    if (email === users[user].email) {
      res.status(400).end("<html><body>Bad Request: Email already exists! </body></html>\n");
      return;
    }
  }
  // otherwise creates a new user encrypts the new user's password with bcrypt
  users[userId] = {
    id: userId,
    email: email,
    password: hashedPassword
  };
  // sets a cookie
  req.session.userID = userId;
  // redirects to /urls
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

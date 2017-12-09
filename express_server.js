var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080
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
}

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
  },
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

// app.get('/urls.json', (req, res) => {
//   res.json(urlDatabase);
// })


app.get('/urls', (req, res) => {
  //   if user is logged in returns HTML with: the site header, a list (or table) of URLs the user has created, each list item containing:
  // a short URL, the short URL's matching long URL, an edit button which makes a GET request to /urls/:id
  // a delete button which makes a POST request to /urls/:id/delete
  // a link to "Create a New Short Link" which makes a GET request to /urls/new
  if (checkLoginStatus(req)) {
    let templateVars = {
      user_id: req.session.userID,
      userDB: urlsForUser(req.session.userID),
      email: users[req.session.userID].email
    }
    res.render('urls_index', templateVars);
  } else {
// if user is not logged in returns HTML with a relevant error message
    res.status(401).send("<html><body>Bad Request: Please enter email or password! <a href='/login'>Log In</a> <a href='/register'>Register</a></body></html>\n")
  }
});

app.get("/urls/new", (req, res) => {

  if (checkLoginStatus(req)) {
    let templateVars = {
      user_id: req.session.userID,
      email: users[req.session.userID].email
    };
    res.render("urls_new",templateVars);
  } else {
    res.redirect('/login');
  }
});

app.post("/urls", (req, res) => {
  if (!req.session.userID) {
    res.status(401).send("<html><body>'Please log in first!'<a href='/login'>Log In</a> <a href='/register'>Register</a></body></html>\n");
  } else {
    let shortURL = generateRandomString();
    urlDatabase[shortURL] = {
     id: shortURL,
     longURL: req.body.longURL,
     uid: req.session.userID,
     views: 0,
    }
    res.redirect(`/urls/${shortURL}`);
  }

  // urlDatabase[shortURL] = {};
  // urlDatabase[shortURL].id = shortURL; // debug statement to see POST parameters
  // urlDatabase[shortURL].longURL = req.body.longURL;
  // urlDatabase[shortURL].uid = req.session.userID;
  // urlDatabase[shortURL].views = 0;

});

app.get("/u/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  if (!urlDatabase[shortURL]) {
    res.send("URL doesn't exist!");
  } else {
    let longURL = urlDatabase[shortURL].longURL;
    urlDatabase[shortURL].views += 1;
    res.redirect(longURL);
    console.log(urlDatabase[shortURL].views);
  }
});

app.get("/urls/:id", (req, res) => {
  var shortURL = req.params.id;
  var userDB = urlsForUser(req.session.userID);

  if (!req.session.userID) {
    res.status(401).send("<html><body>Please log in first!<a href='/login'>Log In</a> <a href='/register'>Register</a></body></html>\n");
  } else if (userDB[req.params.id] === undefined) {
    res.status(401).send("<html><body>No access to URL!<a href='/login'>Log In</a> <a href='/register'>Register</a></body></html>\n")
  } else {
    let templateVars = {
      shortURL:  shortURL,
      longURL: userDB[shortURL],
      user_id: req.session.userID,
      email: users[req.session.userID].email
    }
    res.render("urls_show", templateVars);
  }
});

app.put("/urls/:id", (req, res) => {
  var userDB = urlsForUser(req.session.userID);

  if (!req.session.userID) {
    res.status(401).send("<html><body>'Please log in first!'<a href='/login'>Log In</a> <a href='/register'>Register</a></body></html>\n");
  } else if (userDB[req.params.id] === undefined) {
    res.send("<html><body>No access to URL! <a href='/login'>Log In</a> <a href='/register'>Register</a></body></html>\n");
  } else {
    let shortURL = req.params.id;
    let longURL = req.body.longURL;
    if (!shortURL || !longURL) {
      res.redirect('/urls');
    } else {
      urlDatabase[shortURL].longURL = longURL;
      res.redirect(`/urls/${shortURL}`);
    }
  }

});

app.delete('/urls/:id', (req, res) => {
  var userDB = urlsForUser(req.session.userID);

  if (!req.session.userID) {
    res.status(401).send("<html><body>'Please log in first!'<a href='/login'>Log In</a> <a href='/register'>Register</a></body></html>\n");
  } else if (userDB[req.params.id] === undefined) {
    res.send("<html><body>No access to URL! <a href='/login'>Log In</a> <a href='/register'>Register</a></body></html>\n");
  } else {
    delete urlDatabase[req.params.id];
    res.redirect('/urls');
  }
});

app.get('/login', (req, res) => {
  if (checkLoginStatus(req)) {
    res.redirect('/urls');
  } else {
    res.render('login');
  }
});

app.post('/login', (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  if (!email || !password) {
    res.status(400).end("<html><body>Bad Request: Please enter email or password!</body></html>\n");
    return;
  }
  for (var user in users) {
    if (email === users[user].email && bcrypt.compareSync(password, users[user].password)) {
      req.session.userID = users[user].id;
      res.redirect('/urls');
      return;
    }
  }
  res.status(403).send('Username or password incorrect!');   // wait what?
});

app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

app.get('/register', (req, res) => {
  if (checkLoginStatus(req)) {
    res.redirect('/urls');
  } else {
    res.render("register");
  }
});

app.post('/register', (req, res) => {
  var email = req.body.email;
  var password = req.body.password;
  var hashedPassword = bcrypt.hashSync(password, 10);
  var user_id = generateRandomString();
  if (!email || !password) {
    res.status(400).end("<html><body>Bad Request: Please enter email or password!</body></html>\n");
    return;
  }
  for (var user in users) {
    if (email === users[user].email) {
      res.status(400).end("<html><body>Bad Request: Email already exists! </body></html>\n");
      return;
    }
  }

  users[user_id] = {
      id: user_id,
      email: email,
      password: hashedPassword
  };
  // users[user_id]['id'] = user_id;
  // users[user_id]['email'] = email;
  // users[user_id]['password'] = hashedPassword;
  req.session.userID = user_id;
  res.redirect('/urls');
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080
const bcrypt = require('bcrypt');
var cookieSession = require('cookie-session');

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.use(cookieSession({
  name: 'session',
  keys: ['yuyumeer']
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
  if (req.session.userID) {
    return true;
  } else {
    return false;
  }
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
  res.redirect('/urls');
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
})


app.get('/urls', (req, res) => {
  let templateVars = {
    user_id: req.session.userID,
    userDB: urlsForUser(req.session.userID)
  }
  // console.log(?);
  res.render('urls_index', templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    users: users,
    user_id: req.session.userID,
  };

  if (checkLoginStatus(req)) {
  res.render("urls_new",templateVars);
  } else {
    res.redirect('/login');
  }
});

app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = {};
  urlDatabase[shortURL].id = shortURL; // debug statement to see POST parameters
  urlDatabase[shortURL].longURL = req.body.longURL;
  urlDatabase[shortURL].uid = req.session.userID;
  // console.log(urlDatabase);
  res.redirect(`/urls/${shortURL}`);
});

app.get("/u/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  let longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
});

app.get("/urls/:id", (req, res) => {
  // console.log(urlDatabase);
  let templateVars = {
   shortURL:  req.params.id,
   longURL: urlDatabase[req.params.id].longURL,
   user_id: req.session.userID
  }

  let userDB = urlsForUser(req.session.userID);
    if (userDB[req.params.id] === undefined) {
    res.send('Please log in first!')
  } else {
    res.render("urls_show", templateVars);
  }
});

app.post("/urls/:id", (req, res) => {
  let shortURL = req.params.id;
  let longURL = req.body.longURL;
  if (!shortURL || !longURL) {
    res.redirect('/urls');
  }

  urlDatabase[shortURL].longURL = longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.post('/urls/:id/delete', (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  //  if (!email || !password) {
  //    res.status(400).end("<html><body>Bad Request: Please enter email or password!</body></html>\n");
  //   return;
  // }
  for (var user in users) {
    if (email === users[user].email && bcrypt.compareSync(password, users[user].password)) {
      req.session.userID = users[user].id;
      res.redirect('/urls');
    }
  }
  res.status(403).send('Username or password incorrect!');
});

app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

app.get('/register', (req, res) => {
  res.render("register");
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
  users[user_id] = {};
  users[user_id]['id'] = user_id;
  users[user_id]['email'] = email;
  users[user_id]['password'] = hashedPassword;
  // console.log(users[user_id].password);
  req.session.userID = user_id;
  // res.cookie('email', email);
  // res.cookie('password', password);
  res.redirect('/urls');
  // console.log(users);
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

var cookieParser = require('cookie-parser');
app.use(cookieParser());

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
  if (req.cookies.userID) {
    return true;
  } else {
    return false;
  }
}

function urlsForUser(id) {

}

// function ensureLoggedIn(req, res, next) {
//   if (req.cookies.user_id) {
//     return next();
//   } else {
//     return res.redirect('/login');
//   }
// }


// app.use((req,res,next) => {
//   const uid = ....
//   res.locals.user = .....
//   res.locals.userUrls = getUsersUrls(uid)    //urlDatabase[uid] loop and push....
//   return next();
// });

app.get("/", (req, res) => {
  res.end("<html><body>Hello World</body></html>\n");
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
})


app.get('/urls', (req, res) => {
  var user_id = req.cookies.userID;
  let templateVars = {
    user_id: user_id,
    urls: urlDatabase };
  console.log(templateVars);
  res.render('urls_index', templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    users: users,
    user_id: req.cookies.userID,
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
  urlDatabase[shortURL].uid = req.cookies.userID;
  console.log(urlDatabase);
  res.redirect(`/urls/${shortURL}`);
});

app.get("/u/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  let longURL = urlDatabase[shortURL];
  res.redirect(longURL);
});

app.get("/urls/:id", (req, res) => {
  console.log(urlDatabase);
  let templateVars = {
   shortURL:  req.params.id,
   longURL: urlDatabase[req.params.id].longURL,
   user_id: req.cookies.userID
  }
  console.log(templateVars);

  res.render("urls_show", templateVars);
});

app.post("/urls/:id", (req, res) => {
  let shortURL = req.params.id;
  let longURL = req.body.longURL;
  urlDatabase[shortURL] = longURL;
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
  var email = req.body.email;
  console.log(email);
  var password = req.body.password;
  console.log(password);
   if (!email || !password) {
     res.status(400).end("<html><body>Bad Request: Please enter email or password!</body></html>\n");
    return false;
  }
  for (var user in users) {
    if (email === users[user].email && password == users[user].password) {
      res.cookie('userID',user);
      res.redirect('/urls');
    }
  }
  res.status(403).send('Username or password incorrect!');
});

app.post('/logout', (req, res) => {
  res.clearCookie('userID');
  res.redirect('/urls');
});

app.get('/register', (req, res) => {
  res.render("register");
});

app.post('/register', (req, res) => {
  var email = req.body.email;
  var password = req.body.password;
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
  users[user_id]['password'] = password;
  res.cookie('userID',user_id);
  // res.cookie('email', email);
  // res.cookie('password', password);
  res.redirect('/urls');
  console.log(users);
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

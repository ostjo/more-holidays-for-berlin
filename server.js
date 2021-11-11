const express = require("express");
const app = express();
const db = require("./db.js");
const hb = require("express-handlebars");
const cookieSession = require("cookie-session");
const csurf = require("csurf");
const helmet = require("helmet");
const { hash, compare } = require("./bc.js");
const sessionSecret =
    process.env.SESSION_SECRET || require("./secrets.json").SESSION_SECRET;
const { formatNameAndCity, capitalizeWord } = require("./format-utils.js");
const {
    requireLoggedIn,
    requireNotLoggedIn,
    requireNotSigned,
    requireSigned,
} = require("./middleware/authorization.js");

//------------------------------------------------------- Handlebars Setup ---------------------------------------------------------//
app.engine("handlebars", hb());
app.set("view engine", "handlebars");

//=========================================================== MIDDLEWARE ===========================================================//

//------------------------------------------------------- heroku HTTPS Setup -------------------------------------------------------//
if (process.env.NODE_ENV == "production") {
    app.use((req, res, next) => {
        if (req.headers["x-forwarded-proto"].startsWith("https")) {
            return next();
        }
        res.redirect(`https://${req.hostname}${req.url}`);
    });
}

//---------------------------------------------------------- Cookies Setup ---------------------------------------------------------//
app.use(
    cookieSession({
        secret: sessionSecret, // used to generate the second cookie used to verify the integrity of the first cookie
        maxAge: 1000 * 60 * 60 * 24 * 14, // this makes the cookie survive two weeks of inactivity
        sameSite: true, // only allow requests from the same site
    })
);

//------------------------------------------------------- Serve Public Folder ------------------------------------------------------//
app.use(express.static(__dirname + "/public"));

//-------------------------------------------------------- req.body access ---------------------------------------------------------//
app.use(
    express.urlencoded({
        extended: false,
    })
);

//---------------------------------------------------------- Protection ------------------------------------------------------------//
// x-frame-options against clickjacking
app.use((req, res, next) => {
    res.setHeader("x-frame-options", "deny");
    next();
});

// protection against csurf attacks on IE
app.use(csurf());

app.use(function (req, res, next) {
    res.locals.csrfToken = req.csrfToken();
    next();
});

// secure app by setting various HTTP headers (automated by helmet)
app.use(helmet());

//----------------------------------------------------------- Logging ---------------------------------------------------------------//
app.use((req, res, next) => {
    console.log(`${req.method} | ${req.url}`);
    next();
});

// / ROUTE ==========================================================================================================================

app.get("/", (req, res) => {
    res.redirect("/petition");
});

// REGISTER ==========================================================================================================================

app.get("/register", requireNotLoggedIn, (req, res) => {
    // render petition site, without error partial
    res.render("registration", {
        error: false,
    });
});

app.post("/register", requireNotLoggedIn, (req, res) => {
    // grab input data from the req.body
    const { first_name, last_name, email, password } = req.body;
    hash(password)
        .then((hashedPw) => {
            // insert the user's first name, last name, email and HASHED PW into the database
            db.addUser(first_name, last_name, email, hashedPw)
                .then(({ rows }) => {
                    // if everything goes ewll, store the user's id in a cookie
                    req.session.userId = rows[0].id;
                    // then redirect the user to the petition route so they can sign your petition!
                    res.redirect("/register/profile");
                })
                .catch((err) => {
                    console.log("err in addUser: ", err);
                    // re-render template with an error message
                    res.render("registration", {
                        error: true,
                    });
                });
        })
        .catch((err) => {
            console.log("err in POST register hash", err);
            res.sendStatus(500);
        });
});

// PROFILE ==========================================================================================================================

app.get("/register/profile", requireLoggedIn, (req, res) => {
    return res.render("registration-profile");
});

app.post("/register/profile", requireLoggedIn, (req, res) => {
    const { age, city, homepage } = req.body;
    const { userId } = req.session;
    db.addProfile(userId, age, city, homepage)
        .then(res.redirect("/petition"))
        .catch((err) => {
            console.log("error in POST add profile:", err);
            res.sendStatus(500);
        });
});

app.get("/profile/edit", requireLoggedIn, (req, res) => {
    db.getUserById(req.session.userId)
        .then((user) => {
            if (user.rows[0].city) {
                // if a city is given, capitalize the first character again
                user.rows[0].city = capitalizeWord(user.rows[0].city);
            }
            return res.render("profile", {
                user: user.rows[0],
            });
        })
        .catch((err) => {
            console.log("err in GET profile getUserById(): ", err);
            res.sendStatus(500);
        });
});

app.post("/profile/edit", requireLoggedIn, (req, res) => {
    const { first_name, last_name, email, password, age, city, homepage } =
        req.body;
    const { userId } = req.session;

    console.log(
        "given input:",
        first_name,
        last_name,
        email,
        password,
        age,
        city,
        homepage
    );

    let userUpdatePromise;

    if (password || password !== "") {
        // 1. Hash the password
        // 2. db.updateUserWithPassword(userId, firstName, lastName, email, passwordHash)
        // Save the resulting promise to userUpdatePromise
        userUpdatePromise = hash(password)
            .then((hashedPw) =>
                db.updateUserWithPw(
                    userId,
                    first_name,
                    last_name,
                    email,
                    hashedPw
                )
            )
            .catch((err) => console.log("err in hashing PW", err));
    } else {
        console.log("No password was given!");
        // db.updateUser(userId, firstName, lastName, email)
        // Save the resulting promise to userUpdatePromise
        userUpdatePromise = db.updateUser(userId, first_name, last_name, email);
    }

    Promise.all([
        userUpdatePromise,
        db.upsertProfile(userId, age, city, homepage),
    ])
        .then(() => res.redirect("/thanks"))
        .catch((err) => {
            console.log("err in POST profile/edit: ", err);
            res.sendStatus(500);
        });
});

// LOGIN ============================================================================================================================

app.get("/login", requireNotLoggedIn, (req, res) => {
    // render petition site, without error partial
    res.render("login", {
        error: false,
    });
});

app.post("/login", requireNotLoggedIn, (req, res) => {
    // grab input data from the req.body
    const { email, inputPassword } = req.body;

    // get the user's stored hashed password from the db using the user's email address
    db.getUserByEmail(email)
        .then((user) => {
            if (user.rows.length === 0) {
                return res.render("login", {
                    error: true,
                });
            }

            const { password, id, signature } = user.rows[0];

            compare(inputPassword, password)
                .then((match) => {
                    console.log("are the passwords a match??? ==>", match);
                    if (match) {
                        // if it's a match, set a cookie to the user's id (req.session.userId = userIdFromDb)
                        req.session.userId = id;

                        if (signature) {
                            // user has already signed the petition
                            req.session.signatureId = id;
                        }

                        // then redirect them to where it makes sense for your dataflow
                        res.redirect("/thanks");
                    } else {
                        // if it's not a match, re-render the login page with an error message
                        res.render("login", {
                            error: true,
                        });
                    }
                })
                .catch((err) => {
                    console.log("err in compare: ", err);
                    res.sendStatus(500);
                });
        })
        .catch((err) => console.log("err in getUserByEmail: ", err));
});

// PETITION ==========================================================================================================================

app.get("/petition", requireLoggedIn, requireNotSigned, (req, res) => {
    res.render("petition", {
        error: false,
    });
});

app.post("/petition", requireLoggedIn, requireNotSigned, (req, res) => {
    // grab input data from the req.body
    const { signature } = req.body;
    // when posting to petition page, start addSigner() promise to add input to the database
    db.addSigner(req.session.userId, signature)
        .then(({ rows }) => {
            // addSigner resolved
            // set a cookie with a reference to the signer (primary key) & redirect to thanks
            req.session.signatureId = rows[0].id;
            res.redirect("/thanks");
        })
        .catch((err) => {
            console.log("Error in addSigner: ", err);
            // rerender /petition & show error message to the template
            res.render("petition", {
                error: true,
            });
        });
});

// THANKS ==========================================================================================================================

app.get("/thanks", requireSigned, (req, res) => {
    Promise.all([
        db.getNumOfSigners(),
        db.getSignature(req.session.signatureId),
        db.getUserById(req.session.userId),
    ])
        .then((result) => {
            // all promises resolved, so start rendering thanks template with the total count and the signer's info
            res.render("thanks", {
                count: result[0].rows[0].count,
                signature: result[1].rows[0].signature,
                signer: result[2].rows[0].first_name,
            });
        })
        .catch((err) => {
            console.log("error in getSignature or getNumOfSigner: ", err);
            res.sendStatus(500);
        });
});

// SIGNERS ==========================================================================================================================

app.get("/signers", requireSigned, (req, res) => {
    db.getSigners()
        .then(({ rows }) => {
            formatNameAndCity(rows);

            // getSigners() resolved, so render the signers template with the rows
            res.render("signers", {
                rows,
            });
        })
        .catch((err) => {
            console.log("error in getSigners: ", err);
            res.sendStatus(500);
        });
});

app.get("/signers/:city", requireSigned, (req, res) => {
    const city = req.params.city.toLowerCase();
    db.getSignersByCity(city)
        .then(({ rows }) => {
            if (rows.length === 0) {
                // no db entries exist for this city!
                res.sendStatus(404);
            } else {
                formatNameAndCity(rows);

                res.render("signers-by-city", {
                    rows,
                });
            }
        })
        .catch((err) => {
            console.log("err in GET signers by city: ", err);
            res.sendStatus(500);
        });
});

//-------------------------------------------------------------------------------------------------------------------------------------//

app.get("/logout", (req, res) => {
    req.session = null;
    res.redirect("/petition");
});

//-------------------------------------------------------------------------------------------------------------------------------------//
// only call app.listen if we are running server.js as a main (so for example starting `node server.js` in the terminal)
// if server.js is called by SuperTest, this will not start! (SuperTest will call its own listen method)
if (require.main == module) {
    app.listen(process.env.PORT || 8080, () =>
        console.log("✐ ✎ ✐ Petition server listening! ✐ ✎ ✐")
    );
}

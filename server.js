const express = require("express");
const app = express();
const db = require("./db.js");
const hb = require("express-handlebars");
const cookieSession = require("cookie-session");
const csurf = require("csurf");
const helmet = require("helmet");
const { hash, compare } = require("./bc.js");

//-------------------------------------------------------------- MIDDLEWARE -----------------------------------------------------------//

//-------------------------------- Cookies Setup ---------------------------------//
app.use(
    cookieSession({
        secret: `I know nothing.`, // used to generate the second cookie used to verify the integrity of the first cookie
        maxAge: 1000 * 60 * 60 * 24 * 14, // this makes the cookie survive two weeks of inactivity
        sameSite: true, // only allow requests from the same site
    })
);

//------------------------------- Handlebars Setup -------------------------------//
app.engine("handlebars", hb());
app.set("view engine", "handlebars");

//------------------------------ Serve Public Folder -----------------------------//
app.use(express.static(__dirname + "/public"));

//-------------------------------- req.body access ------------------------------//
app.use(
    express.urlencoded({
        extended: false,
    })
);

//--------------------------------- Protection -----------------------------------//
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

//---------------------------------- Logging -----------------------------------//
// app.use((req, res, next) => {
//     console.log(`${req.method} | ${req.url}`);
//     next();
// });

//-------------------------------------------------------------------------------------------------------------------------------------//

app.get("/", (req, res) => {
    res.redirect("/petition");
});

// REGISTER ==========================================================================================================================

app.get("/register", (req, res) => {
    // render petition site, without error partial
    res.render("registration", {
        error: false,
    });
});

app.post("/register", (req, res) => {
    // grab input data from the req.body
    const { first_name, last_name, email, password } = req.body;
    hash(password)
        .then((hashedPw) => {
            console.log("hash ====> ", hashedPw);

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

// app.post("/register", (req, res) => {
//     // grab input data from the req.body
//     const { email, password } = req.body;
//     console.log(email, password);
//     res.sendStatus(200);
// });

// PROFILE ==========================================================================================================================

app.get("/register/profile", (req, res) => {
    return res.render("profile");
});

app.post("/register/profile", (req, res) => {
    const { age, city, homepage } = req.body;
    const { userId } = req.session;
    db.addProfile(userId, age, city, homepage);
    res.sendStatus(200);
});

// LOGIN ============================================================================================================================

app.get("/login", (req, res) => {
    // render petition site, without error partial
    res.render("login", {
        error: false,
    });
});

app.post("/login", (req, res) => {
    // grab input data from the req.body
    const { email, password } = req.body;

    // get the user's stored hashed password from the db using the user's email address
    db.getUser(email)
        .then((user) => {
            const { hashedPw, id } = user.rows[0];

            compare(password, hashedPw)
                .then((match) => {
                    console.log("are the passwords a match??? ==>", match);
                    // if it's a match, set a cookie to the user's id (req.session.userId = userIdFromDb)
                    req.session.userId = id;
                    // then redirect them to where it makes sense for your dataflow
                    res.redirect("/thanks");
                })
                .catch((err) => {
                    console.log("err in compare: ", err);
                    // if it's not a match, re-render the login page with an error message
                    res.render("login", {
                        error: true,
                    });
                });
        })
        .catch((err) => console.log("err in getUser: ", err));
});

// PETITION ==========================================================================================================================

app.get("/petition", (req, res) => {
    // if user hasn't signed yet
    if (!req.session.signatureId) {
        // render petition site, without error partial
        res.render("petition", {
            error: false,
        });
    } // else {
    //     // has signed already, so take user to thanks page
    //     res.redirect("/regost");
    // }
});

app.post("/petition", (req, res) => {
    // grab input data from the req.body
    const { signature } = req.body;
    // when posting to petition page, start addSigner() promise to add input to the database
    db.addSigner(req.session.userId, signature)
        .then(({ rows }) => {
            // addSigner resolved
            // set a cookie with a reference to the signer (primary key) & redirect to thanks
            req.session.signatureId = rows[0].id;
            res.redirect("/signers");
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

app.get("/thanks", (req, res) => {
    // if user already signed in, get user's signature dataURL and the total count of signers from our db asynchronously
    if (req.session.signatureId) {
        Promise.all([
            db.getNumOfSigners(),
            db.getSignature(req.session.signatureId),
        ])
            .then((result) => {
                const [count, signer] = result;
                // both resolved, so start rendering thanks template with the total count and the signer's info
                res.render("thanks", {
                    count: count.rows[0].count,
                    signer: {
                        name: signer.rows[0].first_name,
                        signature: signer.rows[0].signature,
                    },
                });
            })
            .catch((err) => {
                console.log("error in getSignature or getNumOfSigner: ", err);
                res.sendStatus(500);
            });
    } else {
        // user has not yet signed in --> redirect to /petition
        res.redirect("/petition");
    }
});

// SIGNERS ==========================================================================================================================

app.get("/signers", (req, res) => {
    if (req.session.signatureId) {
        // user already signed, so start getSigners() promise to receive all signers (surname, lastname)
        db.getSigners()
            .then(({ rows }) => {
                // getSigners() resolved, so render the signers template with the rows
                res.render("signers", {
                    rows,
                });
            })
            .catch((err) => {
                console.log("error in getSigners: ", err);
                res.sendStatus(500);
            });
    } else {
        // user has not signed yet, so redirect to /petition
        res.redirect("/petition");
    }
});

app.get("/logout", (req, res) => {
    req.session = null;
    res.redirect("/petition");
});

//-------------------------------------------------------------------------------------------------------------------------------------//

app.listen(8080, () => console.log("✐ ✎ ✐ Petition server listening! ✐ ✎ ✐"));

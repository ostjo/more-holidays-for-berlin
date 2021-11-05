const express = require("express");
const app = express();
const db = require("./db.js");
const hb = require("express-handlebars");
const cookieSession = require("cookie-session");

//-------------------------------------------------------------- MIDDLEWARE -----------------------------------------------------------//

//-------------------------------- Cookies Setup ---------------------------------//
app.use(
    cookieSession({
        secret: `I know nothing.`, // used to generate the second cookie used to verify the integrity of the first cookie
        maxAge: 1000 * 60 * 60 * 24 * 14, // this makes the cookie survive two weeks of inactivity
    })
);

//------------------------------- Handlebars Setup -------------------------------//
app.engine("handlebars", hb());
app.set("view engine", "handlebars");

//------------------------------ Serve Public Folder -----------------------------//
app.use(express.static(__dirname + "/public"));

app.use((req, res, next) => {
    console.log(`${req.method} | ${req.url}`);
    next();
});

//-------------------------------- req.body access ------------------------------//
app.use(
    express.urlencoded({
        extended: false,
    })
);

//-------------------------------------------------------------------------------------------------------------------------------------//

app.get("/", (req, res) => {
    res.redirect("/petition");
});

app.get("/petition", (req, res) => {
    // if user hasn't signed yet
    if (!req.session.signatureId) {
        // render petition site, without error partial
        res.render("petition", {
            error: false,
        });
    } else {
        // has signed already, so take user to thanks page
        res.redirect("/petition/thanks");
    }
});

app.post("/petition", (req, res) => {
    // grab input data from the req.body
    const { first_name, last_name, signature } = req.body;
    // when posting to petition page, start addSigner() promise to add input to the database
    db.addSigner(first_name, last_name, signature)
        .then(({ rows }) => {
            // addSigner resolved
            // set a cookie with a reference to the signer (primary key) & redirect to thanks
            req.session.signatureId = rows[0].id;
            res.redirect("/petition/thanks");
        })
        .catch((err) => {
            console.log("Error in addSigner: ", err);
            // rerender /petition & show error message to the template
            res.render("petition", {
                error: true,
            });
        });
});

app.get("/petition/thanks", (req, res) => {
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

app.get("/petition/signers", (req, res) => {
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

app.get("/petition/logout", (req, res) => {
    req.session = null;
    res.redirect("/petition");
});

//-------------------------------------------------------------------------------------------------------------------------------------//

app.listen(8080, () => console.log("✐ ✎ ✐ Petition server listening! ✐ ✎ ✐"));

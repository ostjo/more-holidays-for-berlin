const express = require("express");
const app = express();
const db = require("./db.js");
const hb = require("express-handlebars");
// const cookieParser = require("cookie-parser");
const cookieSession = require("cookie-session");

//-------------------------------------------------------------- MIDDLEWARE -----------------------------------------------------------//

//-------------------------------- Cookies Setup ---------------------------------//
// app.use(cookieParser());
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
    if (!req.session.signatureId) {
        res.render("petition", {
            error: false,
        });
    } else {
        res.redirect("/petition/thanks");
    }
});

app.post("/petition", (req, res) => {
    db.addSigner(req.body.first_name, req.body.last_name, req.body.signature)
        .then((result) => {
            // res.cookie("signed_in", "true");
            req.session.signatureId = result.rows[0].id;
            console.log(req.session);
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
    db.getNumOfSigners()
        .then((count) => {
            if (req.session.signatureId) {
                console.log("Total number of signers: ", count.rows[0].count);
                db.getSignature(req.session.signatureId)
                    .then((signer) => {
                        res.render("thanks", {
                            count: count.rows[0].count,
                            src: signer.rows[0].signature,
                            name: signer.rows[0].first_name,
                        });
                    })
                    .catch((err) =>
                        console.log("error in getSignature: ", err)
                    );
            } else {
                res.redirect("/petition");
            }
        })
        .catch((err) => {
            console.log("Error in getNumOfSigners: ", err);
            res.statusCode(500);
        });
});

app.get("/petition/signers", (req, res) => {
    db.getSigners()
        .then(({ rows }) => {
            if (req.session.signatureId) {
                res.render("signers", {
                    rows,
                });
            } else {
                res.redirect("/petition");
            }
        })
        .catch((err) => {
            console.log("error in getSigners: ", err);
            res.statusCode(500);
        });
});

app.get("/petition/logout", (req, res) => {
    req.session = null;
    res.redirect("/petition");
});

//-------------------------------------------------------------------------------------------------------------------------------------//

app.listen(8080, () => console.log("✐ ✎ ✐ Petition server listening! ✐ ✎ ✐"));

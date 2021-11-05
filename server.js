const express = require("express");
const app = express();
const db = require("./db.js");
const hb = require("express-handlebars");
const cookieParser = require("cookie-parser");

//-------------------------------------------------------------- MIDDLEWARE -----------------------------------------------------------//

//-------------------------------- Cookies Setup ---------------------------------//
app.use(cookieParser());

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

app.get("/petition", (req, res) => {
    if (!req.cookies.signed_in) {
        res.render("petition", {
            error: false,
        });
    } else {
        res.redirect("/petition/thanks");
    }
});

app.post("/petition", (req, res) => {
    db.addSigner(req.body.first_name, req.body.last_name, req.body.signature)
        .then(() => {
            res.cookie("signed_in", "true");
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
            if (req.cookies.signed_in) {
                console.log("Total number of signers: ", count);
                res.render("thanks", {
                    count: count.rows[0].count,
                });
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
            if (req.cookies.signed_in) {
                console.log("results: ", rows);
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

//-------------------------------------------------------------------------------------------------------------------------------------//

app.listen(8080, () => console.log("✐ ✎ ✐ Petition server listening! ✐ ✎ ✐"));

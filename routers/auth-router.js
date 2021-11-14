const express = require("express");
const { requireNotLoggedIn } = require("../middleware/authorization.js");
const { hash, compare } = require("../bc.js");
const db = require("../db.js");

const router = express.Router();

router.get("/register", requireNotLoggedIn, (req, res) => {
    // render petition site, without error partial
    res.render("registration");
});

router.post("/register", requireNotLoggedIn, (req, res) => {
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
                    res.redirect("/profile");
                })
                .catch((err) => {
                    console.log("err in addUser: ", err);
                    // re-render template with an error message
                    res.render("registration", {
                        error: "Ooops. This e-mail is already taken.",
                    });
                });
        })
        .catch((err) => {
            console.log("err in POST register hash", err);
            res.sendStatus(500);
        });
});

router.get("/login", requireNotLoggedIn, (req, res) => {
    res.render("login");
});

router.post("/login", requireNotLoggedIn, (req, res) => {
    // grab input data from the req.body
    const { email, inputPassword } = req.body;

    // get the user's stored hashed password from the db using the user's email address
    db.getUserByEmail(email)
        .then((user) => {
            if (user.rows.length === 0) {
                return res.render("login", {
                    error: "Sorry, the email address and/or password are incorrect.",
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
                            error: "Sorry, the email address and/or password are incorrect.",
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

module.exports.authRouter = router;

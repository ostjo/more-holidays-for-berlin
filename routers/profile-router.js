const express = require("express");
const {
    requireLoggedIn,
    requireJustSigned,
} = require("../middleware/authorization.js");
const db = require("../db.js");
const { hash } = require("../bc.js");
const { capitalizeWord } = require("../format-utils.js");

const router = express.Router();

router.get("/", requireLoggedIn, requireJustSigned, (req, res) =>
    res.render("registration-profile")
);

router.post("/", requireLoggedIn, requireJustSigned, (req, res) => {
    const { age, city, homepage } = req.body;
    const { userId } = req.session;
    db.addProfile(userId, age, city, homepage)
        .then(res.redirect("/petition"))
        .catch((err) => {
            console.log("error in POST add profile:", err);
            res.sendStatus(500);
        });
});

router.get("/edit", requireLoggedIn, (req, res) => {
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

router.post("/edit", requireLoggedIn, (req, res) => {
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
        .then(() => {
            return db
                .getUserById(req.session.userId)
                .then((user) => {
                    if (user.rows[0].city) {
                        // if a city is given, capitalize the first character again
                        user.rows[0].city = capitalizeWord(user.rows[0].city);
                    }
                    return res.render("profile", {
                        user: user.rows[0],
                        update: "✅ Profile was successfully updated.",
                    });
                })
                .catch((err) => {
                    console.log("err in GET profile getUserById(): ", err);
                    res.sendStatus(500);
                });
        })
        .catch((err) => {
            console.log("err in POST profile/edit: ", err);
            res.sendStatus(500);
        });
});

module.exports.profileRouter = router;

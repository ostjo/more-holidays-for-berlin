const express = require("express");
const {
    requireLoggedIn,
    requireNotSigned,
} = require("../middleware/authorization.js");
const db = require("../db.js");

const router = express.Router();

router.get("/", requireLoggedIn, requireNotSigned, (req, res) => {
    return res.render("petition", {
        error: false,
    });
});

router.post("/", requireLoggedIn, requireNotSigned, (req, res) => {
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

module.exports.petitionRouter = router;

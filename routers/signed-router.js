const express = require("express");
const { requireSigned } = require("../middleware/authorization.js");
const db = require("../db.js");
const { formatNameAndCity } = require("../format-utils.js");

const router = express.Router();

router.get("/thanks", requireSigned, (req, res) => {
    Promise.all([
        db.getNumOfSigners(),
        db.getSignature(req.session.userId),
        db.getUserById(req.session.userId),
    ])
        .then((result) => {
            // all promises resolved, so start rendering thanks template with the total count and the signer's info
            res.render("thanks", {
                count: result[0].rows[0].count,
                signature: result[1].rows[0].signature,
                signer: {
                    icon: result[2].rows[0].first_name.charAt(0).toLowerCase(),
                    first_name: result[2].rows[0].first_name,
                    last_name: result[2].rows[0].last_name,
                },
            });
        })
        .catch((err) => {
            console.log("error in getSignature or getNumOfSigner: ", err);
            res.sendStatus(500);
        });
});

router.get("/signers", requireSigned, (req, res) => {
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

router.get("/signers/:city", requireSigned, (req, res) => {
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

router.post("/signature/delete", requireSigned, (req, res) => {
    db.deleteSignature(req.session.userId)
        .then(() => {
            // remove signatureId from cookie session because user unsigned
            delete req.session.signatureId;
            res.redirect("/petition");
        })
        .catch((err) => {
            console.log("err in POST signature/delete: ", err);
            res.sendStatus(500);
        });
});

module.exports.signedRouter = router;

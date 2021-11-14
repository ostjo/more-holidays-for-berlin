const express = require("express");
const app = express();
const hb = require("express-handlebars");
const cookieSession = require("cookie-session");
const csurf = require("csurf");
const helmet = require("helmet");

if (process.env.SESSION_SECRET) {
    console.log("YES");
} else {
    console.log("NO!");
}

const sessionSecret =
    process.env.SESSION_SECRET || require("./secrets.json").SESSION_SECRET;
const { authRouter } = require("./routers/auth-router.js");
const { profileRouter } = require("./routers/profile-router.js");
const { petitionRouter } = require("./routers/petition-router.js");
const { signedRouter } = require("./routers/signed-router.js");

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

// REGISTER && LOGIN  ==========================================================================================================================

app.use(authRouter);

// PROFILE ==========================================================================================================================

app.use("/profile", profileRouter);

// PETITION ==========================================================================================================================

app.use("/petition", petitionRouter);

// THANKS && SIGNERS ======================================================================================================================

app.use(signedRouter);

// / ROUTE ==========================================================================================================================

app.get("/", (req, res) => {
    return res.render("landing");
});

// LOGOUT =================================================================================================================================

app.get("/logout", (req, res) => {
    req.session = null;
    res.redirect("/");
});

//-------------------------------------------------------------------------------------------------------------------------------------//
// only call app.listen if we are running server.js as a main (so for example starting `node server.js` in the terminal)
// if server.js is called by SuperTest, this will not start! (SuperTest will call its own listen method)
if (require.main == module) {
    app.listen(process.env.PORT || 8080, () =>
        console.log("✐ ✎ ✐ Petition server listening! ✐ ✎ ✐")
    );
}

// export server app for supertest
module.exports.app = app;

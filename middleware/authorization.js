// requireNotLoggedIn, requireLoggedIn, requireSigned middleware

const requireLoggedIn = (req, res, next) => {
    if (!req.session.userId) {
        // user has not logged in yet --> redirect to /register
        return res.redirect("/register");
    }
    next();
};

const requireNotLoggedIn = (req, res, next) => {
    if (req.session.userId) {
        // user has logged in already --> redirect to /petition
        return res.redirect("/petition");
    }
    next();
};

const requireNotSigned = (req, res, next) => {
    if (req.session.signatureId) {
        // user has signed already --> redirect to /thanks
        return res.redirect("/thanks");
    }
    next();
};

const requireSigned = (req, res, next) => {
    if (!req.session.signatureId) {
        // user has not signed yet --> redirect to /petition
        return res.redirect("/petition");
    }
    next();
};

const requireJustSigned = (req, res, next) => {
    if (!req.session.justSigned) {
        return res.redirect("/profile/edit");
    }
    next();
};

module.exports = {
    requireLoggedIn,
    requireNotLoggedIn,
    requireNotSigned,
    requireSigned,
    requireJustSigned,
};

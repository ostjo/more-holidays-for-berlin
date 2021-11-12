const supertest = require("supertest");
const { app } = require("./server.js");
const cookieSession = require("cookie-session");
jest.mock("./db");
const db = require("./db");

// Users who are logged out are redirected to the registration page when they attempt to go to
// the petition page
test("redirect logged out users to /register on GET /petition", () => {
    return supertest(app)
        .get("/petition")
        .then((res) => {
            expect(res.statusCode).toBe(302);
            expect(res.headers.location).toBe("/register");
        });
});

// Users who are logged in are redirected to the petition page when they attempt to go to either the
// registration page or the login page
test("redirect logged in users to /petition on GET /register", () => {
    cookieSession.mockSessionOnce({
        userId: 1,
    });
    return supertest(app)
        .get("/register")
        .then((res) => {
            expect(res.statusCode).toBe(302);
            expect(res.headers.location).toBe("/petition");
        });
});

test("redirect logged in users to /petition on GET /login", () => {
    cookieSession.mockSessionOnce({
        userId: 1,
    });
    return supertest(app)
        .get("/login")
        .then((res) => {
            expect(res.statusCode).toBe(302);
            expect(res.headers.location).toBe("/petition");
        });
});

// Users who are logged in and have signed the petition are redirected to the signers page when they
// attempt to go to the petition page or submit a signature
test("redirect logged in users that already signed to /thanks on GET /petition", () => {
    cookieSession.mockSessionOnce({
        userId: 1,
        signatureId: 1,
    });
    return supertest(app)
        .get("/petition")
        .then((res) => {
            expect(res.statusCode).toBe(302);
            expect(res.headers.location).toBe("/thanks");
        });
});

test("redirect logged in users that already signed to /thanks on POST /petition", () => {
    cookieSession.mockSessionOnce({
        userId: 1,
        signatureId: 1,
    });
    return supertest(app)
        .post("/petition")
        .send("signature=chicken")
        .then((res) => {
            expect(res.statusCode).toBe(302);
            expect(res.headers.location).toBe("/thanks");
        });
});

// Users who are logged in and have not signed the petition are redirected to the petition page
// when they attempt to go to either the thank you page or the signers page
test("redirect logged in users that have not signed yet to /petition on GET /thanks", () => {
    cookieSession.mockSessionOnce({
        userId: 1,
    });
    return supertest(app)
        .get("/thanks")
        .then((res) => {
            expect(res.statusCode).toBe(302);
            expect(res.headers.location).toBe("/petition");
        });
});

test("redirect logged in users that have not signed yet to /petition on GET /signers", () => {
    cookieSession.mockSessionOnce({
        userId: 1,
    });
    return supertest(app)
        .get("/signers")
        .then((res) => {
            expect(res.statusCode).toBe(302);
            expect(res.headers.location).toBe("/petition");
        });
});

// tests to confirm that POST route for signing the petition is working correctly
// When the input is good, the user is redirected to the thank you page
test("redirect user to /thanks on successfull POST /petition", () => {
    cookieSession.mockSessionOnce({
        userId: 1,
    });

    // mock resolved value of addSigner once with resolve and returning rows
    db.addSigner.mockResolvedValueOnce(
        Promise.resolve({
            rows: [{ id: 1 }],
        })
    );

    return supertest(app)
        .post("/petition")
        .send("signature=chicken")
        .then((res) => {
            expect(res.statusCode).toBe(302);
            expect(res.headers.location).toBe("/thanks");
        });
});

// When the input is bad, the response body contains an error message
test("body contains error message on failing POST /petition", () => {
    cookieSession.mockSessionOnce({
        userId: 1,
    });

    // mock rejected value of addSigner once
    db.addSigner.mockRejectedValueOnce();

    return supertest(app)
        .post("/petition")
        .send("signature=")
        .then((res) => {
            // expect(res.statusCode).toBe(200);
            expect(res.text).toContain(
                "We really need you to fill out all fields before submitting."
            );
        });
});

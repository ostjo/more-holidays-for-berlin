const spicedPg = require("spiced-pg");
const dbUsername = "postgres";
const dbUserPassword = "postgres";
const database = "petition";

const db = spicedPg(
    process.env.DATABASE_URL ||
        `postgres:${dbUsername}:${dbUserPassword}@localhost:5432/${database}`
);

console.log("[db] Connecting to: ", database);

module.exports.addUser = (firstName, lastName, email, hashedPW) => {
    const query = `INSERT INTO users (first_name, last_name, email, password)
                    VALUES($1, $2, $3, $4)
                    RETURNING id`;
    // we do this extra step to prevent sequel injection
    const params = [firstName, lastName, email, hashedPW];
    // before passing the params to the query, dp.query() will first transform params into a string
    return db.query(query, params);
};

module.exports.getUser = (email) => {
    const query = `SELECT * FROM users
                    WHERE email = ${email}`;
    return db.query(query);
};

module.exports.addProfile = (userId, age, city, homepage) => {
    const query = `INSERT INTO profiles (user_id, age, city, homepage)
                    VALUES($1, $2, LOWER($3), $4)
                    RETURNING id`;

    const params = [
        userId,
        formatEmptyInput(age),
        formatEmptyInput(city),
        formatHomepageUrl(homepage),
    ];
    console.log("params", params);
    return db.query(query, params);
};

// module.exports.hasSigned = (id) => {
//     const query = `SELECT `;
// };

const formatHomepageUrl = (homepage) => {
    if (homepage == "") {
        return null;
    } else if (!homepage.startsWith("http")) {
        return "http://" + homepage;
    }
    return homepage;
};

const formatEmptyInput = (input) => {
    if (input === "") {
        return null;
    }
    return input;
};

module.exports.getSigners = () => {
    const query = `SELECT users.first_name AS first_name, users.last_name AS last_name, profiles.age AS age, profiles.city AS city, profiles.homepage AS homepage, signatures.signature AS signature 
                    FROM users
                    JOIN profiles
                    ON users.id = profiles.user_id
                    JOIN signatures
                    ON users.id = signatures.user_id`;
    return db.query(query);
};

module.exports.addSigner = (userId, signature) => {
    const query = `INSERT INTO signatures (user_id, signature)
                VALUES($1, $2)
                RETURNING id`;
    // we do this extra step to prevent sequel injection
    const params = [userId, signature];
    // before passing the params to the query, dp.query() will first transform params into a string
    return db.query(query, params);
};

module.exports.getNumOfSigners = () => {
    const query = "SELECT COUNT(*) FROM signatures";
    return db.query(query);
};

module.exports.getSignature = (id) => {
    const query = `SELECT * FROM signatures
                    WHERE id = ${id};`;
    return db.query(query);
};

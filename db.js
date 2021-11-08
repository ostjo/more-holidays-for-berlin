const spicedPg = require("spiced-pg");
const dbUsername = "postgres";
const dbUserPassword = "postgres";
const database = "petition";

const db = spicedPg(
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

// module.exports.hasSigned = (id) => {
//     const query = `SELECT `;
// };

module.exports.getSigners = () => {
    const query = `SELECT users.first_name, users.last_name FROM users, signatures
                    WHERE users.id = signatures.user_id`;
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

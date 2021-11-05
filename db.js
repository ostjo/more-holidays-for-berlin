const spicedPg = require("spiced-pg");
const dbUsername = "postgres";
const dbUserPassword = "postgres";
const database = "petition";

const db = spicedPg(
    `postgres:${dbUsername}:${dbUserPassword}@localhost:5432/${database}`
);

console.log("[db] Connecting to: ", database);

module.exports.getSigners = () => {
    const query = "SELECT * FROM signatures";
    return db.query(query);
};

module.exports.addSigner = (firstName, lastName, signature) => {
    const query = `INSERT INTO signatures (first_name, last_name, signature)
                VALUES($1, $2, $3)
                RETURNING id`;
    // we do this extra step to prevent sequel injection
    const params = [firstName, lastName, signature];
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

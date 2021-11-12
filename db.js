const spicedPg = require("spiced-pg");
const dbUsername = "postgres";
const dbUserPassword = "postgres";
const database = "petition";
const { formatEmptyInput, formatHomepageUrl } = require("./format-utils.js");

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

module.exports.getUserByEmail = (email) => {
    const query = `SELECT users.id AS id, users.first_name AS first_name, users.last_name AS last_name, users.email AS email, 
                    users.password AS password, signatures.signature AS signature
                    FROM users
                    JOIN signatures
                    ON users.id = signatures.user_id
                    WHERE email = $1;
                    `;
    return db.query(query, [email]);
};

module.exports.getUserById = (id) => {
    const query = `SELECT users.first_name AS first_name, users.last_name AS last_name, users.email AS email, 
                            profiles.age AS age, profiles.city AS city, profiles.homepage AS homepage
                    FROM users
                    JOIN profiles
                    ON users.id = profiles.user_id
                    WHERE user_id = $1`;
    return db.query(query, [id]);
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

module.exports.getSigners = () => {
    const query = `SELECT users.first_name AS first_name, users.last_name AS last_name, profiles.age AS age, profiles.city AS city, profiles.homepage AS homepage, signatures.signature AS signature 
                    FROM users
                    JOIN profiles
                    ON users.id = profiles.user_id
                    JOIN signatures
                    ON users.id = signatures.user_id`;
    return db.query(query);
};

module.exports.getSignersByCity = (city) => {
    const query = `SELECT users.first_name AS first_name, users.last_name AS last_name, profiles.age AS age, profiles.city AS city, profiles.homepage AS homepage, signatures.signature AS signature 
                    FROM users
                    JOIN profiles
                    ON users.id = profiles.user_id
                    JOIN signatures
                    ON users.id = signatures.user_id
                    WHERE city = $1`;
    return db.query(query, [city]);
};

module.exports.addSigner = (userId, signature) => {
    const query = `INSERT INTO signatures (user_id, signature)
                VALUES($1, $2)
                RETURNING id`;
    // we do this extra step to prevent sequel injection
    const params = [userId, formatEmptyInput(signature)];
    // before passing the params to the query, dp.query() will first transform params into a string
    return db.query(query, params);
};

module.exports.getNumOfSigners = () => {
    const query = "SELECT COUNT(*) FROM signatures";
    return db.query(query);
};

module.exports.getSignature = (id) => {
    const query = `SELECT signature FROM signatures
                    WHERE user_id = $1;`;
    return db.query(query, [id]);
};

module.exports.deleteSignature = (id) => {
    const query = `DELETE FROM signatures
                    WHERE user_id = $1`;
    return db.query(query, [id]);
};

module.exports.updateUserWithPw = (
    userId,
    first_name,
    last_name,
    email,
    hashedPw
) => {
    const query = `UPDATE users
                    SET first_name = $2, last_name = $3, email = $4, password = $5
                    WHERE id = $1`;
    const params = [userId, first_name, last_name, email, hashedPw];
    return db.query(query, params);
};

module.exports.updateUser = (userId, first_name, last_name, email) => {
    const query = `UPDATE users  
                   SET first_name = $2, last_name = $3, email = $4
                   WHERE id = $1`;
    const params = [userId, first_name, last_name, email];
    return db.query(query, params);
};

module.exports.upsertProfile = (userId, age, city, homepage) => {
    const query = `INSERT INTO profiles (user_id, age, city, homepage) 
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT (user_id) DO UPDATE SET age=$2, city=$3, homepage=$4`;
    const params = [
        userId,
        formatEmptyInput(age),
        formatEmptyInput(city),
        formatEmptyInput(homepage),
    ];
    return db.query(query, params);
};

// module.exports.checkHasSigned = (userId) => {
//     const query = `SELECT signature FROM signatures
//                     WHERE user_id = $1`;
//     return db.query(query, [userId]);
// };

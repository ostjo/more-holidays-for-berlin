module.exports.abbreviateName = (name) => name.charAt(0) + ".";

module.exports.capitalizeWord = (word) =>
    word.charAt(0).toUpperCase() + word.slice(1);

module.exports.formatHomepageUrl = (homepage) => {
    if (homepage == "") {
        return null;
    } else if (!homepage.startsWith("http")) {
        return "http://" + homepage;
    }
    return homepage;
};

module.exports.formatEmptyInput = (input) => {
    if (input === "") {
        return null;
    }
    return input;
};

module.exports.formatNameAndCity = (rows) => {
    rows.forEach((obj) => {
        // only show first character of last_name
        obj.last_name = module.exports.abbreviateName(obj.last_name);
        // convert the first character of the city name to uppercase, if city is given:
        if (obj.city) {
            obj.city = module.exports.capitalizeWord(obj.city);
        }
    });
};

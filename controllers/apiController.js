const request = require('request');

const callApi = (url) => {
    return new Promise((resolve, reject) => {
        request.get(url, (err, res, body) => {
            if(err || res.statusCode != 200) reject(err);
            resolve(JSON.parse(body));
        })
    })
}

module.exports = { callApi };

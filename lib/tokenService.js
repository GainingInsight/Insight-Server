// Nodejs encryption with CTR
var crypto = require('crypto');
var algorithm = 'aes-256-ctr';
var password = 'y1Xh8nYeMZ';

var create = function(sessionId, sessionKey) {
    var toEncrypt = {
        sessionId: sessionId,
        sessionKey: sessionKey
    };

    var cipher = crypto.createCipher(algorithm, password);
    var crypted = cipher.update(JSON.stringify(toEncrypt), 'utf8', 'hex');
    crypted += cipher.final('hex');

    return crypted;
}

var decrypt = function(token) {
    var decipher = crypto.createDecipher(algorithm, password);
    var dec = decipher.update(token, 'hex', 'utf8')
    dec += decipher.final('utf8');

    var tokenObj = JSON.parse(dec);
    return tokenObj;
}

module.exports.create = create;
module.exports.decrypt = decrypt;

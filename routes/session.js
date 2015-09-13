var express = require('express');
var router = express.Router();

var tokenService = require('../lib/tokenService');

var aws = require('aws-sdk');
aws.config.loadFromPath(__dirname + '/../aws.json');

var table = new aws.DynamoDB({ params: { TableName: 'insightgeneral' } });

router.get('/auth/login', function(req, res, next) {
    // console.log(req.query.session_id + ', ' + req.query.session_key);
    // res.json('{"token":"df8932hd9"}');

    // Pull item with session_id as the key from the insightgeneral table
    // Check whether provided session_key exists as value of any of the 3 session keys in the table item
    // If it doesn't, return a response with 500 status code
    // If it does, generate a token with secret from server, then send that to client

    var providedSessionId = '961OUk0u6Z' || req.query.session_id;
    var providedSessionKey = req.query.session_key;
    console.log(providedSessionKey);

    table.getItem({ Key: { session_id: { S: providedSessionId } } }, function(err, data) {
        if(err) console.log(err, err.stack);
        else if(data) {
            // Session found, now checking credentials
            var keys = [
                data.Item.session_key_playerNS.S,
                data.Item.session_key_playerFS.S,
                data.Item.session_key_researcher.S
            ];

            if(keys.indexOf(providedSessionKey) >= 0) {
                // Id/Key pair found, now generate token
                var token = tokenService.create(providedSessionId, providedSessionKey);

                // Send token to client
                var response = JSON.stringify({ token: token });

                console.log(data);

                res.status(200);
                res.json(response);
            } else {
                res.status(500);
                res.end();
            }
        } else {
            // No session found with provided session_id
            res.status(500);
            res.end();
        }
    });
});

module.exports = router;

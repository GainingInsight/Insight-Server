var tokenService = require('../tokenService');

var aws = require('aws-sdk');
aws.config.loadFromPath(__dirname + '/../../aws.json');

var table = new aws.DynamoDB({ params: { TableName: 'insightgeneral' } });

var Messages = require('./message-types.js');

var redisClient = require('redis').createClient();

module.exports = function(io) {
    io.on('connection', function(socket) {
        console.log('Client connected to socket server: ' + socket.id);

        socket.on(Messages.INITIATION, function(data) {
            // Client has connected, and is in ready state
            // Decrypt received token to identify session_id and session_key
            // Set coordinates of player in redis store
            // Check for coordinates of other player in redis store
            // If other player coordinates exist, set ready state to true
            //      Send game start message to both clients

            var token = tokenService.decrypt(data.token);
            var sessionId = token.sessionId;
            var sessionKey = token.sessionKey;

            redisClient.put(sessionId + ':' + sessionKey, socket.id);
            redisClient.put(socket.id, sessionKey);

            table.getItem({
                Key: { session_id: { S: sessionId } },
                AttributesToGet: [ 'ready_keys' ]
            }, function(err, data) {
                if(err) console.log(err, err.stack);
                else if(data) {
                    var readyKeys = data.Item.ready_keys.SS;

                    if(readyKeys.indexOf(sessionKey) > -1 && readyKeys.length > 3) {
                        console.log('SCENARIO 1');

                        // Player had already set ready state in past and game was started
                        // Player must've reconnected
                        // Emit game start message to just that player
                        socket.emit(Messages.GAME_START);
                    } else if(readyKeys.indexOf(sessionKey) === -1 && readyKeys.length > 2) {
                        console.log('SCENARIO 2');

                        // All clients have readied for the first time
                        // Emit game start message to all clients, then add player session key to ready keys
                        io.emit(Messages.GAME_START);

                        readyKeys.push(sessionKey);

                        table.updateItem({
                            Key: { session_id: { S: sessionId } },
                            AttributeUpdates: {
                                ready_keys: {
                                    Action: 'PUT',
                                    Value: { SS: readyKeys }
                                }
                            }
                        }, function(err2, data2) {
                            if(err) console.log(err2, err2.stack);
                            else console.log(data2);
                        });
                    } else if(readyKeys.indexOf(sessionKey) === -1){
                        console.log('SCENARIO 3');

                        // Not all players have readied yet
                        readyKeys.push(sessionKey);

                        table.updateItem({
                            Key: { session_id: { S: sessionId } },
                            AttributeUpdates: {
                                ready_keys: {
                                    Action: 'PUT',
                                    Value: { SS: readyKeys }
                                }
                            }
                        }, function(err2, data2) {
                            if(err) console.log(err2, err2.stack);
                            else console.log(data2);
                        });
                    } else {
                        console.log('SCENARIO 4');
                    }
                } else {
                    // Return error message via socket
                }
            });
        });

        socket.on('disconnect', function() {
            console.log('Client disconnected.');

            // Remove corresponding client's session key from ready keys

            table.getItem({
                Key: { session_id: { S: sessionId } },
                AttributesToGet: [ 'ready_keys' ]
            }, function(err, data) {
                if(err) console.log(err, err.stack);
                else if(data) {
                    var readyKeys = data.Item.ready_keys.SS;

                    redisClient.get(socket.id, function(errRedis, dataRedis) {
                        var indexToRemove = readyKeys.indexOf('');
                    });
                }
            });
        });
    });
}

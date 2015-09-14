var tokenService = require('../tokenService');

var aws = require('aws-sdk');
aws.config.loadFromPath(__dirname + '/../../aws.json');

var table = new aws.DynamoDB({ params: { TableName: 'insightgeneral' } });

var Messages = require('./message-types.js');

var redisClient = require('redis').createClient();

module.exports = function(io) {
    io.use(function(socket, next) {
        var encryptedToken = socket.request._query.token;
        var token = tokenService.decrypt(encryptedToken);
        socket.sessionId = token.sessionId;
        socket.sessionKey = token.sessionKey;

        console.log('Authenticated client with: ' + socket.sessionId + ':' + socket.sessionKey);

        next();
    });

    io.on('connection', function(socket) {
        console.log('Client connected to socket server: ' + socket.id);

        socket.on(Messages.INITIATION, function(data) {
            // Client has connected, and is in ready state
            // If other player coordinates exist, set ready state to true
            //      Send game start message to both clients
            var sessionId = socket.sessionId;
            var sessionKey = socket.sessionKey;

            table.getItem({
                Key: { session_id: { S: sessionId } }
            }, function(err, data) {
                if(err) console.log(err, err.stack);
                else if(data) {
                    var readyKeys = data.Item.ready_keys.SS;

                    // Send initial session data to client
                    var gameStartData = {
                        title: data.Item.title.S,
                        description: data.Item.description.S,
                        sessionId: sessionId,
                        sessionKey: sessionKey,
                        clientRole: (function() {
                            if(sessionKey === data.Item.session_key_playerNS.S)
                                return 'playerNS';
                            else if(sessionKey === data.Item.session_key_playerFS.S)
                                return 'playerFS';
                            else if(sessionKey === data.Item.session_key_researcher.S)
                                return 'researcher';
                            else
                                return '';
                        })()
                    };
                    socket.emit(Messages.SESSION_DATA, gameStartData);

                    if(readyKeys.indexOf(sessionKey) > -1 && readyKeys.length > 3) {
                        // Player had already set ready state in past and game was started
                        // Player must've reconnected
                        // Emit game start message to just that player
                        socket.emit(Messages.SESSION_START);
                    } else if(readyKeys.indexOf(sessionKey) === -1 && readyKeys.length > 2) {
                        // All clients have readied for the first time
                        // Emit game start message to all clients, then add player session key to ready keys
                        // In game start, include title, description, and session
                        io.emit(Messages.SESSION_START);

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
                    }
                } else {
                    // TODO: Return error message via socket
                }
            });
        });

        socket.on('disconnect', function() {
            console.log('Client disconnected.');

            // Remove corresponding client's session key from ready keys
            var sessionId = socket.sessionId;
            var sessionKey = socket.sessionKey;

            table.getItem({
                Key: { session_id: { S: sessionId } },
                AttributesToGet: [ 'ready_keys' ]
            }, function(err, data) {
                if(err) console.log(err, err.stack);
                else if(data) {
                    var readyKeys = data.Item.ready_keys.SS;

                    var indexToRemove = readyKeys.indexOf(sessionKey);
                    if(indexToRemove > -1) {
                        readyKeys.splice(indexToRemove, 1);

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
                            else {
                                console.log(data2);

                                // Remove old Redis values
                                redisClient.del(sessionId + ':' + sessionKey);
                                redisClient.del(socket.id);

                                // TODO: Emit message to other clients notifying them of disconnect
                            }
                        });
                    }
                }
            });
        });
    });
}

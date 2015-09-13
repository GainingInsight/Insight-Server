// Run: node utilities/aws-initialize.js

var sleep = require('sleep');

var aws = require('aws-sdk');
aws.config.loadFromPath(__dirname + '/../aws.json');

var dynamodb = new aws.DynamoDB();

// var redis = require('redis');
// var redisClient = redis.createClient();
//
// redisClient.on("error", function (err) {
//     console.log("Error " + err);
// });

// var redisSampleItemOne = {
//     ready: true,
//     x: 0,
//     y: 0
// };
//
// var redisSampleItemTwo = {
//     ready: false,
//     x: 0,
//     y: 0
// };

// redisClient.set('961OUk0u6ZA', JSON.stringify(redisSampleItemOne));
// redisClient.set('961OUk0u6ZB', JSON.stringify(redisSampleItemTwo));

// redisClient.get('961OUk0u6ZA', function(err, data) {
//     if(err) console.log(err);
//     else console.log(data);
//
//     redisClient.end();
// });

//
// Table definitions:
//  InsightGeneral
//
var InsightGeneral = {
    AttributeDefinitions: [
        {
            AttributeName: "session_id",
            AttributeType: "S"
        }
    ],
    TableName: "insightgeneral",
    KeySchema: [
        {
            AttributeName: "session_id",
            KeyType: "HASH"
        }
    ],
    ProvisionedThroughput: {
        ReadCapacityUnits: 6,
        WriteCapacityUnits: 6
    }
};

var SampleSessionItem = {
    Item: {
        session_id: { S: '961OUk0u6Z' },
        session_key_playerFS: { S: 'A' },
        session_key_playerNS: { S: 'B' },
        session_key_researcher: { S: 'R' },
        description: { S: 'Description for this test session.' },
        title: { S: 'Test Session' },
        ready_keys: {
            SS: ['TEMP']
        }
    },
    TableName: 'insightgeneral',
    ReturnValues: 'ALL_OLD'
};

/**
 * []---- DYNAMODB SETUP ----[]
 */
//Delete table if it already exists, then recreate it and add sample data
dynamodb.deleteTable({ TableName: "insightgeneral" }, function(errI, dataI) {
    if(errI) console.log(errI);
    sleep.sleep(6);
    dynamodb.createTable(InsightGeneral, function(errJ, dataJ) {
        if(errJ) console.log(errJ, errJ.stack);
        else {
            console.log("Created: " + JSON.stringify(dataJ) + '\n');
            sleep.sleep(6);

            dynamodb.putItem(SampleSessionItem, function(errK, dataK) {
                if(errK) console.log(errK, errK.stack); // an error occurred
                else console.log("Added sample data: " + JSON.stringify(dataK));           // successful response
            });
        }
    });
});

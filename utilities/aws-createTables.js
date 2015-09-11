// Run: node utilities/aws-createTables.js

var aws = require('aws-sdk');
aws.config.loadFromPath(__dirname + '/../aws.json');

var dynamodb = new aws.DynamoDB();

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

// Delete table if it already exists, then recreate it
dynamodb.deleteTable({ TableName: "insightgeneral" }, function(err, data) {
    dynamodb.createTable(InsightGeneral, function(err, data) {
        if(err) console.log(err, err.stack);
        else console.log(data);
    });
});

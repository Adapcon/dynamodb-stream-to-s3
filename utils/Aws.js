'use strict';
const aws = require('aws-sdk');
const CONFIG = require('../config.json');

class Aws {
    constructor() {
        aws.config.update({ region: CONFIG.region });
    }

    dbClient() {
        return new aws.DynamoDB.DocumentClient();
    }

    db() {
        return new aws.DynamoDB();
    }

    s3() {
        return new aws.S3();
    }
}

module.exports = new Aws();

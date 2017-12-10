'use strict';
const aws = require('aws-sdk');
const _ = require('lodash');
const CONFIG = require('../config.json');

class Aws {
    constructor() {
        aws.config.update({ region: _.get(CONFIG, 'region') });
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

    ses() {
        return new aws.SES({
            apiVersion: '2010-12-01',
            region: _.get(CONFIG, 'email.region')
        });
    }
}

module.exports = new Aws();

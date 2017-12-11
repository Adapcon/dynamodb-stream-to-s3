'use strict';
const CONFIG = require('../config.json');
const _ = require('lodash');
const ses = require('./Aws.js').ses();
const execute = require('./integrityCheck');
const moment = require('moment');

let event = {};
event.tables = _.keys(CONFIG.tables);
event.execute = true;

execAll(res => {
    if (!res) throw new Error('log String is not defined');

    sendEmail(res)
        .then(() => {
            console.log('EMAIL DELIVERED');
        })
        .catch(err => {
            console.log(err);
        })
})

function execAll(callback) {
    if (!event.tables) return reject(new Error('tables are not defined'));
    event.table = event.tables[0];

    execute(event, (err, res) => {
        if (_.has(event, 'objects')) event.objects.splice(0);
        event.tables.splice(0, 1);

        if (err && _.isEmpty(event.tables)) return callback(err);
        if (res && _.isEmpty(event.tables)) return callback(res);

        execAll(callback);
    })
}

function sendEmail(logString) {
    return new Promise((resolve, reject) => {

        if (_.get(CONFIG, 'email') && logString) {
            ses.sendEmail({
                Destination: {
                    ToAddresses: _.get(CONFIG, 'email.to')
                },
                Message: {
                    Body: {
                        Text: {
                            Data: logString,
                            Charset: 'utf8'
                        }
                    },
                    Subject: {
                        Data: 'DynamoDB Stream to S3 - Integrity Check',
                        Charset: 'utf8'
                    }
                },
                Source: _.get(CONFIG, 'email.from')
            }, (err, data) => {
                if (err) return reject(new Error(err));
                return resolve();
            })
        } else {
            return reject(new Error('log String or emailTo is not defined'));
        }
    });
}
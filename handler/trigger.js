'use strict';
const CONFIG = require('../config.json');
const _ = require('lodash');
const s3 = require('../utils/Aws.js').s3();
const util = require('../utils/Util.js');
const unmarshalItem = require('dynamodb-marshaler').unmarshalItem;

module.exports.run = (event, context, callback) => {
  util.logMessage('-----------TRIGGER START-----------')
  util.logMessage('--------------EVENT----------------')
  util.logMessage(JSON.stringify(event))

  getTable(event)
    .then(() => getRecords(event))
    .then(() => setRecords(event))
    .then(() => callback(null, {
      status: 200
    }))
    .catch(err => {
      util.sendResultErro(err, callback)
    })
}

function getTable(event) {
  return new Promise((resolve, reject) => {
    event.Records.forEach(record => {
      if (!_.has(event, 'table')) event.table = record.eventSourceARN;
    });

    event.table = event.table.split(':table/')[1];
    event.table = event.table.split('/')[0];

    util.logMessage('EVENT TABLE ==> ' + event.table);

    if (event.table) return resolve();
    return reject({ status: '#ERROR_GET_TABLE' })
  })
}

function getRecords(event) {
  return new Promise((resolve, reject) => {
    let count = event.Records.length;
    event.objects = [];

    event.Records.forEach(record => {
      let filename = null;
      record.dynamodb.Keys = [record.dynamodb.Keys]
      record.dynamodb.Keys = record.dynamodb.Keys.map(unmarshalItem)[0];

      if (_.size(record.dynamodb.Keys) === 1) filename = _.values(record.dynamodb.Keys)[0];
      else {
        let values = _.values(record.dynamodb.Keys);
        filename = `${values[0]}||${values[1]}`;
      }
      util.logMessage('FILENAME => ' + filename);
      util.logMessage('EVENTNAME => ' + record.eventName);

      filename = filename.replace(/[^a-z0-9 | . _ - @]/gi, '-');

      if (record.eventName == 'REMOVE' && filename) {
        event.objects.push({
          excludeFile: {
            Bucket: CONFIG.bucket,
            Key: `${event.table}/${filename}`
          }
        })
      } else if (_.has(record.dynamodb, 'NewImage') && filename) {
        record.dynamodb.NewImage = [record.dynamodb.NewImage];
        record.dynamodb.NewImage = record.dynamodb.NewImage.map(unmarshalItem)[0];

        event.objects.push({
          putFile: {
            Bucket: CONFIG.bucket,
            Key: `${event.table}/${filename}`,
            Body: Buffer.from(JSON.stringify(record.dynamodb.NewImage))
          }
        })
        util.logMessage('NEWIMAGE => ' + JSON.stringify(record.dynamodb.NewImage));
      }
      count--;
    })

    if (count == 0) return resolve();
  })
}

function setRecords(event) {
  return new Promise((resolve, reject) => {
    let count = event.objects.length;
    event.objects.forEach(record => {
      if (_.has(record, 'putFile')) {
        util.logMessage('RECORD TO PUT ==>' + JSON.stringify(record))
        util.putObject(record.putFile)
          .then(res => {
            util.logMessage('PUT SUCCESS ==>' + JSON.stringify(record))
            count--;
            if (count == 0) return resolve();
          })
          .catch(err => {
            util.logMessage('FAILED TO PUT ==>' + JSON.stringify(record))
            count--;
            if (count == 0) return resolve();
          })
      } else if (_.has(record, 'excludeFile')) {
        util.logMessage('RECORD TO REMOVE ==>' + JSON.stringify(record))

        util.deleteObject(record.excludeFile)
          .then(res => {
            util.logMessage('REMOVED ==>' + JSON.stringify(record))
            count--;
            if (count == 0) return resolve();
          })
          .catch(err => {
            util.logMessage('FAILED TO REMOVE ==>' + JSON.stringify(record))
            count--;
            if (count == 0) return resolve();
          })
      }
    })
  })
}

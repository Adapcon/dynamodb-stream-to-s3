'use strict';
const CONFIG = require('../config.json');
const _ = require('lodash');
const s3 = require('../utils/Aws.js').s3();
const dbClient = require('../utils/Aws.js').dbClient();
const db = require('../utils/Aws.js').db();
const util = require('../utils/Util.js');

module.exports.run = (event, context, callback) => {
    util.logMessage('------INTEGRITY CHECK STARTED------')
    util.logMessage('--------------EVENT----------------')
    util.logMessage(JSON.stringify(event))

    if (event.body.execute) event.execute = true;
    else event.execute = false;

    util.checkArgs([{
        var: event.body.table,
        status: '#TABLE_NOTFOUND',
        message: 'A Tabela do Dynamo não foi informada!'
    }])
        .then(() => getTableSchema(event))
        .then(() => getInvalidObjects(event))
        .then(() => putObjects(event))
        .then(res => endRequest(res, event))
        .then(() => callback(null, {
            status: 200
        }))
        .catch(err => {
            util.sendResultErro(err, callback)
        })
}

function getTableSchema(event) {
    return new Promise((resolve, reject) => {
        db.describeTable({
            TableName: event.body.table
        }, (err, data) => {
            if (err) return reject(err, err.stack);
            else {
                event.table = {};
                event.table.name = data.Table.TableName;
                event.table.keys = data.Table.KeySchema;
                event.table.itemCount = data.Table.ItemCount;
                util.logMessage('TABLE INFO ==> ' + JSON.stringify(event.table));
                return resolve();
            }
        })
    })
}

function getInvalidObjects(event) {
    return new Promise((resolve, reject) => {
        scan('errors', event, {
            TableName: event.table.name,
            Limit: 100
        })
            .then(res => {
                event.objects = res;
                return resolve();
            })
            .catch(err => {
                return reject(err);
            })
    })
}

function scan(env, event, parm) {
    return new Promise((resolve, reject) => {
        if (env === 'errors') scanErrors(event, parm, [], resolve, reject);
        else execScan(event, parm, list = [], resolve, reject);
    });
}

function scanErrors(event, parm, list = [], resolve, reject) {
    dbClient.scan(parm, (err, res) => {
        if (err) return reject(`#ERROR_SCAN_ERRORS_${parm.TableName}`, err);

        let promises = [];
        res.Items.forEach(i => {
            util.logMessage('item =>' + JSON.stringify(i));
            let filename = getFilename(event, i);
            util.logMessage('FILENAME ==> ' + JSON.stringify(filename));

            promises.push(searchObjectsToBackup(CONFIG.bucket, `${event.table.name}/${filename}`, i))
        });

        Promise.all(promises)
            .then(values => {
                if (res.LastEvaluatedKey) {
                    parm.ExclusiveStartKey = res.LastEvaluatedKey;

                    if (values && _.isArray(values)) {
                        values = values.filter(v => v !== undefined && v !== null);
                        list = list.concat(values);
                    }
                    return scanErrors(event, parm, list, resolve, reject);
                } else {

                    if (values && _.isArray(values)) {
                        values = values.filter(v => v !== undefined && v !== null);
                        list = list.concat(values);
                    }

                    util.logMessage('LISTA ===> ' + JSON.stringify(list));
                    return resolve(list);
                }
            })
    });
}

function searchObjectsToBackup(bucket, key, obj, returnObj = null) {
    return new Promise((resolve, reject) => {
        util.getObject({
            Bucket: bucket,
            Key: key
        }).then(res => {
            util.logMessage('RESPOSTA BUCKET ==> ' + JSON.stringify(res));
            if (res.Body) {
                res.Body = JSON.parse(res.Body.toString());
                (_.isEqual(res.Body, obj)) ? null : returnObj = obj;
            }

            if (returnObj) resolve(returnObj);
            resolve();

        }).catch(err => {
            util.logMessage('ERRO BUCKET ==> ' + JSON.stringify(err));
            returnObj = obj;
            resolve(returnObj);
        })
    })
}

function putObjects(event) {
    return new Promise((resolve, reject) => {
        if (!event.execute) return resolve();

        let count = event.objects.length;
        let countSuccess = 0;
        let listErrors = [];
        if (_.isEmpty(event.objects) || !_.isArray(event.objects)) return reject({ status: '#OBJECTS_NOT_FOUND', message: 'Não há objetos para enviar.' });

        event.objects.forEach(obj => {
            util.logMessage('OBJECT TO PUT ==>' + JSON.stringify(obj))

            let filename = getFilename(event, obj);

            util.putObject({
                Bucket: CONFIG.bucket,
                Key: `${event.table.name}/${filename}`,
                Body: Buffer.from(JSON.stringify(obj))
            })
                .then(res => {
                    util.logMessage('PUT SUCCESS ==>' + JSON.stringify(obj));
                    count--;
                    countSuccess++;
                    if (count == 0) return resolve({listErrors, countSuccess});
                })
                .catch(err => {
                    util.logMessage('FAILED TO PUT ==>' + JSON.stringify(obj));
                    listErrors.push(obj);
                    count--;
                    if (count == 0) return resolve({listErrors, countSuccess});
                })
        })
    })
}

function execScan(event, parm, list = [], resolve, reject) {
    dbClient.scan(parm, (err, res) => {
        if (err) return reject(`#ERROR_SCAN_${parm.TableName}`);

        res.Items.forEach(i => {
            list.push(i);
        });

        if (res.LastEvaluatedKey) {
            parm.ExclusiveStartKey = res.LastEvaluatedKey;
            return execScan(event, parm, list, resolve, reject);
        } else {
            return resolve(list);
        }
    });
}

function getFilename(event, obj) {
    if (_.isObject(obj)) {
        let filename;
        let key;
        let keys = Object.keys(obj);

        if (_.size(event.table.keys) === 1) {
            key = event.table.keys[0].AttributeName;
            filename = obj[key];
        } else {
            let key1 = event.table.keys[0].AttributeName;
            let key2 = event.table.keys[1].AttributeName;
            filename = `${obj[key1]}||${obj[key2]}`
        }

        filename = filename.replace(/[^a-z0-9 | . _ - @]/gi, '-');

        return filename
    }
    return null;
}

function endRequest(res, event) {
    return new Promise((resolve, reject) => {
        if (!_.isEmpty(res) && event.execute) {
            util.logMessage('PUT ERRORS ==> ' + JSON.stringify(res.listErrors));
            util.logMessage('PUT ERRORS LENGTH ==> ' + res.listErrors.length);
            util.logMessage('PUT SUCCESS LENGTH ==> ' + res.countSuccess);
        } else if (event.execute) {
            util.logMessage('PUT ERRORS 0');
        }

        util.logMessage('------FINISHED------');
        return resolve();
    })
}
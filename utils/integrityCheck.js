'use strict';
const execute = require('./execIntegrityCheck.js');
const util = require('./Util.js');

let event = {};
event.table = process.argv[2];
event.execute = process.argv[3];
const example = '\nEXAMPLE: node integrityCheck TableName true||false //default is false';

util.checkArgs([{
    var: event.table,
    status: '#TABLE_NOT_FOUND',
    message: `Table is undefined ${example}`
}])
    .then(execute(event, (err, res) => { }))
    .catch(err => {
        console.log('ERROR =>', err);
    })
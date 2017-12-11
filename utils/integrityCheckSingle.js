'use strict';
const execute = require('./integrityCheck.js');
const util = require('./Util.js');

let event = {};
event.table = process.argv[2];
event.execute = process.argv[3];
const example = '\nnode integrityCheckSingle.js TableName true||false //default is false';

util.checkArgs([{
    var: event.table,
    status: '#TABLE_NOT_FOUND',
    message: `Table is undefined`,
}])
    .then(() => execute(event, (err, res) => { }))
    .catch(err => {
        console.log('ERROR =>', err);
        console.log('\n\nHaving trouble? Use it like this => ', example)
    })
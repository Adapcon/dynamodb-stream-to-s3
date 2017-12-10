'use strict';
const _ = require('lodash');
const s3 = require('./Aws.js').s3();
const moment = require('moment');

class Util {
    constructor() { }
	/**
	 * CHECK BLANK ARGS
	 */
    checkArgs(objArgs) {
        return new Promise((resolve, reject) => {
            objArgs.forEach(item => {
                try {
                    let ret = {};
                    if (!_.has(item, 'var')) {
                        reject({
                            status: '#go0001',
                            message: 'A propriedade Var não foi passada para o sistema que gerencia os dados enviados para API.'
                        });
                    }

                    if (this.isEmpty(item.var)) {
                        if (_.has(item, 'status')) {
                            ret.status = item.status;
                        } else {
                            ret.status = '#noStatus';
                        }

                        if (_.has(item, 'message')) {
                            ret.message = item.message;
                        } else {
                            ret.message = '#noMessage';
                        }

                        reject({
                            status: ret.status,
                            message: ret.message
                        });
                    }

					/**
                     * CONTROL FOR ACCEPTED TYPES
					 */
                    if (_.has(item, 'accept') && _.has(item.accept, 'value')) {
                        let accept = false;
                        item.accept.value.forEach(a => {
                            if (a === item.var) {
                                accept = true;
                            }
                        });
                        if (accept === false) {
                            if (_.has(item.accept, 'status')) {
                                ret.status = item.accept.status;
                            } else {
                                ret.status = '#noStatus';
                            }

                            if (_.has(item.accept, 'message')) {
                                ret.message = item.accept.message;
                            } else {
                                ret.message = '#noMessage';
                            }

                            reject({
                                status: ret.status,
                                message: ret.message
                            });
                        }
                    }
                } catch (err) {
                    console.log(err);
                    reject({
                        status: '#go0001',
                        message: 'Ocorreu um erro ao verificar os dados enviados para a API.'
                    });
                }
            });
            resolve({
                status: 200,
                message: 'Todos os argumentos passados para o processo estão OK!'
            });
        });
    }

    /**
     * PUT OBJECTS ON s3
     */
    putObject(parm) {
        return new Promise((resolve, reject) => {
            if (!parm) return reject({
                status: '#PUTOBJECT_PARM_NOTFOUND',
                message: 'Os parâmetros para inserir arquivos no S3 não foram passados.'
            })
            s3.putObject(parm, (err, data) => {
                if (err) return reject(err);
                else return resolve();
            });
        })
    }

    /**
     * DELETE OBJECTS FROM s3
     */
    deleteObject(parm) {
        return new Promise((resolve, reject) => {
            if (!parm) return reject({
                status: '#DELETEOBJECT_PARM_NOTFOUND',
                message: 'Os parâmetros para remover arquivos do S3 não foram passados.'
            })
            s3.deleteObject(parm, (err, data) => {
                if (err) return reject(err);
                else return resolve();
            });
        })
    }

    /**
     * GET OBJECT FROM s3
     */
    getObject(parm) {
        return new Promise((resolve, reject) => {
            if (!parm) return reject({
                status: '#GETOBJECT_PARM_NOTFOUND',
                message: 'Os parâmetros para buscar arquivos do S3 não foram passados.'
            })
            s3.getObject(parm, (err, data) => {
                if (err) return reject(err);
                else return resolve(data);
            });
        })
    }

    /**
     * CHECK IF THE ARGUMENT EXISTS
     */
    isEmpty(arg) {
		if (_.isUndefined(arg) || _.isEmpty(arg) || arg == 'undefined' || arg == undefined) return true;
		return false;
	}
	/**
	 * FINISH LAMBDA REQUEST.
	 */
    back(status, message, callback) {
        callback(null, {
            status: status,
            message: message
        });
    }

	/**
	 * HANDLE PROMISE ERRORS
	 */
    sendResult(res, callback) {
        this.sendResultErro(res, callback);
    }

    sendResultErro(res, callback) {
        try {
            if (_.isUndefined(res.status) || _.isEmpty(res.status)) this.back('#go0001', 'ERRO', callback);
            this.back(res.status, res.message, callback);
        } catch (err) {
            this.back(res.status, res.message, callback);
        }
    }

    /**
     * LOG MESSAGES FORMATTER
     */
    logMessage(message,logString,separator) {
        
        if (message) {
            message = moment().format('DD/MM/YYYY hh:mm:ss') + ' - ' + message
            console.log(message);
            logString += '\n' + message;
        }

        if (separator) console.log('=======================================================');
    }

};

module.exports = new Util();

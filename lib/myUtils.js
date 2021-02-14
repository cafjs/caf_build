// Modifications copyright 2020 Caf.js Labs and contributors
/*!
 Copyright 2013 Hewlett-Packard Development Company, L.P.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */
'use strict';

/*
 * Miscellaneous collection of functions.
 *
 *
 */
const crypto = require('crypto');

const errToStr =
/*
 * Stringifies an error object for logging or network transmission.
 *
 * @param {Error} err An error object to log or send.
 *
 * @return {string} A string representation of the error.
 */
exports.errToStr = function(err) {
    if (err && (typeof err === 'object')) {
        const obj = {};
        Object.getOwnPropertyNames(err)
            .forEach(function(key) { obj[key] = err[key]; });
        return JSON.stringify(obj, null, 2);
    } else {
        return err;
    }
};


/*
 * Stringifies an error object so that its stack is properly formatted in the
 * console.
 *
 * @param {Error} err An error object to log or send.
 *
 * @return {string} A string representation of the error.
 *
 */
exports.errToPrettyStr= function(err) {
    try {
        let result = errToStr(err);
        if (typeof result === 'string') {
            result = result.replace(/\\n/g, '\n');
        }
        return result;
    } catch (ex) {
        // 'err' not JSON serializable
        return '' + err;
    }
};

/*
 * Returns a unique identifier.
 *
 * @return {string} A unique identifier.
 *
 */
exports.uniqueId = function() {
    return Buffer.from(crypto.randomBytes(15)).toString('base64');
};

const callJustOnce =
/*
 * Ensures that `cb` is only called once. If not, and optional `errF` callback
 *  is called.
 *
 * @param {cbType=} errF An optional callback for any extra calls to `cb`.
 * @param {cbType} cb A callback that should only be called once.
 *
 */
exports.callJustOnce = function(errF, cb) {
    var alreadyCalled = false;
    return function(err, data) {
        if (alreadyCalled) {
            errF && errF(err, data);
        } else {
            alreadyCalled = true;
            cb(err, data);
        }
    };
};

(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
"use strict";
exports.__esModule = true;
var fs = require('fs');
exports.opMap = {
    eq: '===',
    gt: '>',
    gte: '>=',
    lt: '<',
    lte: '<=',
    neq: '!=='
};
exports.funcMap = {
    between: true,
    len: 'length'
};
exports.opKeys = Object.keys(exports.opMap);
exports.funcKeys = Object.keys(exports.funcMap);
exports.REGEX_STRIP_UNSAFE_KEYS = /[^A-Z_a-z.-]/g;
/*
    age eq value and residence eq house
*/
exports.conditionsValidate = function (conditions) {
    var ret = [];
    var pass = true;
    conditions.forEach(function (cond, index) {
        var key = cond.key, operator = cond.operator, value = cond.value, valueB = cond.valueB;
        var keyReplaced = key.replace(exports.REGEX_STRIP_UNSAFE_KEYS, '');
        operator = operator.toLowerCase();
        if (keyReplaced.length !== key.length) {
            pass = false;
            ret.push({ index: index, reason: 'Key contains unsafe character', valid: false });
            return;
        }
        if (typeof value === 'string' && !value.indexOf('`')) {
            pass = false;
            ret.push({ index: index, reason: 'Value contains unsafe character', valid: false });
            return;
        }
        // tslint:disable no-bitwise
        if (~exports.opKeys.indexOf(operator)) {
            if (typeof value === 'object') { // Date support
                if (!value.hasOwnProperty('valueOf')) {
                    pass = false;
                    ret.push({ index: index, reason: 'Value can only be of type Date | string',
                        valid: false });
                    return;
                }
            }
            else {
                if (~['string', 'boolean'].indexOf(typeof value) && !~['eq', 'neq'].indexOf(operator)) {
                    pass = false;
                    ret.push({ index: index, reason: typeof value + " comparisons must only be eq | neq", valid: false });
                    return;
                }
            }
        }
        else if (~exports.funcKeys.indexOf(operator)) {
            if (operator === 'between' && valueB) {
                if (typeof value !== typeof valueB) {
                    pass = false;
                    ret.push({ index: index, reason: 'Both values must be of same type', valid: false });
                    return;
                }
                if (~['string', 'boolean'].indexOf(typeof value) || ~['string', 'boolean'].indexOf(typeof valueB)) {
                    pass = false;
                    ret.push({ index: index, reason: 'Between operator can only be used on Dates | numbers', valid: false });
                    return;
                }
                if (typeof value === 'object') { // Date support
                    if (!value.hasOwnProperty('valueOf')) {
                        pass = false;
                        ret.push({ index: index, reason: 'Value can only be of type Date | string', valid: false });
                        return;
                    }
                }
            }
        }
        else {
            pass = false;
            ret.push({ index: index, reason: 'Operator is not valid.', valid: false });
            return;
        }
        ret.push({ index: index, valid: true });
    });
    return pass ? true : ret;
};
exports.conditionsToString = function (conditions) {
    var evalString = '';
    conditions.forEach(function (cond) {
        var key = cond.key, operator = cond.operator, value = cond.value, valueB = cond.valueB;
        key = key.replace(exports.REGEX_STRIP_UNSAFE_KEYS, '');
        if (typeof value === 'string') {
            value = '`' + value.replace(/`/g, '') + '`';
        } // Prevents Injections
        // tslint:disable no-bitwise
        if (~exports.opKeys.indexOf(operator)) {
            if (typeof value === 'object') { // Date support
                evalString += "(new Date(item." + key + ".valueOf()) " + exports.opMap[operator] + " " + value.valueOf() + ") && ";
            }
            else {
                evalString += "(item." + key + " " + exports.opMap[operator] + " " + value + ") && ";
            }
        }
        else if (~exports.funcKeys.indexOf(operator)) {
            if (operator === 'between' && valueB) {
                if (typeof value === 'object') { // Date support
                    evalString += "(new Date(item." + key + ".valueOf()) >= " + value.valueOf() + " && new Date(item." + key + ".valueOf()) <= " + valueB.valueOf() + ") && ";
                }
                else {
                    evalString += "(item." + key + " >= " + value + " && item." + key + " <= " + valueB + ") && ";
                }
            }
        }
    });
    return evalString.slice(0, evalString.length - 4);
};
exports.itemsMatchConditions = function (items, conditions) {
    // tslint:disable-next-line: no-eval
    return items.filter(function (item) { return eval(conditions); });
};
exports.itemsFailConditions = function (items, conditions) {
    // tslint:disable-next-line: no-eval
    return items.filter(function (item) { return !(eval(conditions)); });
};
var ConditionEditor = /** @class */ (function () {
    function ConditionEditor(exportPath) {
        this.exportPath = exportPath || '';
        this._condMap = {};
        if (this.exportPath) {
            this.loadConditions(this.exportPath);
        }
    }
    ConditionEditor.prototype.addCondition = function (name, conditions) {
        if (this._condMap[name]) {
            return false;
        }
        var validationResult = exports.conditionsValidate(conditions);
        if (validationResult) {
            this._condMap[name] = exports.conditionsToString(conditions);
        }
        else {
            return validationResult;
        }
        return true;
    };
    ConditionEditor.prototype.getCondition = function (name) { return this._condMap[name] ? this._condMap[name] : false; };
    ConditionEditor.prototype.runMatchCondition = function (name, data) {
        return this._condMap[name] ? exports.itemsMatchConditions(data, this._condMap[name]) : false;
    };
    ConditionEditor.prototype.runFailCondition = function (name, data) {
        return this._condMap[name] ? exports.itemsFailConditions(data, this._condMap[name]) : false;
    };
    ConditionEditor.prototype.saveConditions = function () {
        if (this.exportPath === '' || this.exportPath.indexOf('.') === -1) {
            return false;
        }
        fs.writeFile(this.exportPath, JSON.stringify(this._condMap, null, 2), function (err) {
            if (err) {
                throw new Error(err);
            }
        });
        return true;
    };
    ConditionEditor.prototype.loadConditions = function (path) {
        if (!fs.existsSync(path)) {
            return false;
        }
        this._condMap = JSON.parse(fs.readFileSync(path).toString());
        return true;
    };
    return ConditionEditor;
}());
exports.ConditionEditor = ConditionEditor;

},{"fs":1}],3:[function(require,module,exports){
const ce = require('../moxy-conditions')

let items = [
    {
        age: 17,
        alcohol_use: false,
        country: 'US',
        id: 1937124,
        medical_conditions: ['diabetes'],
        military_history: false,
        registered: new Date('2019-05-06'),
        residence: 'apartment',
        tobacco_use: true,
    },
    {
        age: 19,
        alcohol_use: true,
        country: 'US',
        id: 1937125,
        medical_conditions: [],
        military_history: false,
        registered: new Date('2019-09-06'),
        residence: 'house',
        tobacco_use: true,
    },
    {
        age: 23,
        alcohol_use: true,
        country: 'US',
        id: 1937126,
        medical_conditions: [],
        military_history: false,
        registered: new Date('2019-10-08'),
        residence: 'house',
        tobacco_use: false,
    }
]

document.getElementById('operator').onchange = (e) => {
    console.log(e)
    if (e.target.value === 'between') {
        document.getElementById('valueB').style.display = 'inline-block'
    } else {
        document.getElementById('valueB').style.display = 'none'
    }
}
document.getElementById('run').onclick = () => {
    let val = document.getElementById('value').value
    let valb = document.getElementById('valueB').value
    if (val.toLowerCase() === 'false' || val.toLowerCase() === 'true'){
        val = val.toLowerCase() === 'true'
    } else if (!isNaN(val) && !isNaN(Number(val))) { 
        val = Number(val) 
    }
    if (valb.toLowerCase() === 'false' || valb.toLowerCase() === 'true'){
        valb = valb.toLowerCase() === 'true'
    } else if (!isNaN(valb) && !isNaN(Number(valb))) { 
        valb = Number(valb) 
    }
    let conditions = [
        {
            key: document.getElementById('field').value,
            operator: document.getElementById('operator').value,
            value: val,
            valueB: valb,
        }
    ]
    console.log(conditions)
    let validator = ce.conditionsValidate(conditions)
    if (validator !== true) {
        alert('Conditions could not validate: \n' + JSON.stringify(validator))
    } else {
        document.getElementById('data').innerHTML = JSON.stringify(ce.itemsMatchConditions(items, ce.conditionsToString(conditions)), null, 2)
    }
}
},{"../moxy-conditions":2}]},{},[3]);

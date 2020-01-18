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
    TODO: add expression parser?
    * age eq value and residence eq house and registered between date1, date2
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
    ConditionEditor.prototype.toJSON = function (prettify) {
        if (prettify === void 0) { prettify = false; }
        return prettify ? JSON.stringify(this._condMap, null, 2) : JSON.stringify(this._condMap);
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

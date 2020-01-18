const fs = require('fs')

export interface ICondition {
    key: string,
    operator: string,
    value: Date | string | number | boolean,
    valueB?: Date | string | number | boolean,
}

export interface IKeyValueObject { [key: string]: any }

export interface IValidationResult {
    index: number,
    reason?: string,
    valid: boolean,
}

export const opMap: IKeyValueObject = {
    eq: '===',
    gt: '>',
    gte: '>=',
    lt: '<',
    lte: '<=',
    neq: '!==',
}

export const funcMap = {
    between: true,
    len: 'length',
}

export const opKeys = Object.keys(opMap)
export const funcKeys = Object.keys(funcMap)

export const REGEX_STRIP_UNSAFE_KEYS = /[^A-Z_a-z.-]/g

/*
    TODO: add expression parser?
    * age eq value and residence eq house and registered between date1, date2
*/

export const conditionsValidate = (conditions: ICondition[]): boolean | IValidationResult[] => {
    const ret: IValidationResult[] = []
    let pass: boolean = true
    conditions.forEach((cond: ICondition, index: number) => {
        let { key, operator, value, valueB } = cond
        const keyReplaced = key.replace(REGEX_STRIP_UNSAFE_KEYS, '')
        operator = operator.toLowerCase()
        if (keyReplaced.length !== key.length) {
            pass = false
            ret.push({index, reason: 'Key contains unsafe character', valid: false})
            return
        }
        if (typeof value === 'string' && !value.indexOf('`')) {
            pass = false
            ret.push({index, reason: 'Value contains unsafe character', valid: false})
            return
        }
        // tslint:disable no-bitwise
        if (~opKeys.indexOf(operator)) {
            if (typeof value === 'object') { // Date support
                if (!value.hasOwnProperty('valueOf')) {
                    pass = false
                    ret.push({index, reason: 'Value can only be of type Date | string',
                        valid: false})
                    return
                }
            } else {
                if (~['string', 'boolean'].indexOf(typeof value) && !~['eq', 'neq'].indexOf(operator)) {
                    pass = false
                    ret.push({index, reason: `${typeof value} comparisons must only be eq | neq`, valid: false})
                    return
                }
            }
        } else if (~funcKeys.indexOf(operator)) {
            if (operator === 'between' && valueB) {
                if (typeof value !== typeof valueB) {
                    pass = false
                    ret.push({index, reason: 'Both values must be of same type', valid: false})
                    return
                }
                if (~['string', 'boolean'].indexOf(typeof value) || ~['string', 'boolean'].indexOf(typeof valueB) ) {
                    pass = false
                    ret.push({index, reason: 'Between operator can only be used on Dates | numbers', valid: false})
                    return
                }
                if (typeof value === 'object') { // Date support
                    if (!value.hasOwnProperty('valueOf')) {
                        pass = false
                        ret.push({index, reason: 'Value can only be of type Date | string', valid: false})
                        return
                    }
                }
            }
        } else {
            pass = false
            ret.push({index, reason: 'Operator is not valid.', valid: false})
            return
        }
        ret.push({index, valid: true})
    })
    return pass ? true : ret
}

export const conditionsToString = (conditions: ICondition[]): string => {
    let evalString = ''
    conditions.forEach((cond: ICondition) => {
        let { key, operator, value, valueB } = cond
        key = key.replace(REGEX_STRIP_UNSAFE_KEYS, '')
        if (typeof value === 'string') { value = '`' + value.replace(/`/g, '') + '`' } // Prevents Injections
        // tslint:disable no-bitwise
        if (~opKeys.indexOf(operator)) {
            if (typeof value === 'object') { // Date support
                evalString += `(new Date(item.${key}.valueOf()) ${opMap[operator]} ${value.valueOf()}) && `
            } else {
                evalString += `(item.${key} ${opMap[operator]} ${value}) && `
            }
        } else if (~funcKeys.indexOf(operator)) {
            if (operator === 'between' && valueB) {
                if (typeof value === 'object') { // Date support
                    evalString += `(new Date(item.${key}.valueOf()) >= ${value.valueOf()} && new Date(item.${key}.valueOf()) <= ${valueB.valueOf()}) && `
                } else {
                    evalString += `(item.${key} >= ${value} && item.${key} <= ${valueB}) && `
                }
            }
        }
    })
    return evalString.slice(0, evalString.length - 4)
}

export const itemsMatchConditions = (items: IKeyValueObject[], conditions: string) => {
    // tslint:disable-next-line: no-eval
    return items.filter((item: IKeyValueObject) => eval(conditions) )
}

export const itemsFailConditions = (items: IKeyValueObject[], conditions: string) => {
    // tslint:disable-next-line: no-eval
    return items.filter((item: IKeyValueObject) => !(eval(conditions)) )
}

export class ConditionEditor {
    public exportPath: string
    private _condMap: IKeyValueObject
    constructor(exportPath?: string) {
        this.exportPath = exportPath || ''
        this._condMap = {}
        if (this.exportPath) { this.loadConditions(this.exportPath) }
    }

    public addCondition(name: string, conditions: ICondition[]): boolean | IValidationResult[] {
        if (this._condMap[name]) { return false }
        const validationResult = conditionsValidate(conditions)
        if (validationResult) {
            this._condMap[name] = conditionsToString(conditions)
        } else {
            return validationResult
        }
        return true
    }

    public getCondition(name: string): string | boolean { return this._condMap[name] ? this._condMap[name] : false }

    public runMatchCondition(name: string, data: any): IKeyValueObject[] | boolean {
        return this._condMap[name] ? itemsMatchConditions(data, this._condMap[name]) : false
    }

    public runFailCondition(name: string, data: any): IKeyValueObject[] | boolean {
        return this._condMap[name] ? itemsFailConditions(data, this._condMap[name]) : false
    }

    public saveConditions(): boolean {
        if (this.exportPath === '' || this.exportPath.indexOf('.') === -1) { return false }
        fs.writeFile(this.exportPath, JSON.stringify(this._condMap, null, 2), (err: any) => {
            if (err) { throw new Error(err) }
        })
        return true
    }

    public loadConditions(path: string): boolean {
        if (!fs.existsSync(path)) { return false }
        this._condMap = JSON.parse(fs.readFileSync(path).toString())
        return true
    }
}

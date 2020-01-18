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
}

export const funcMap = {
    between: true,
    len: 'length',
}

export const opKeys = Object.keys(opMap)
export const funcKeys = Object.keys(funcMap)

export const REGEX_STRIP_UNSAFE_KEYS = /[^A-Z_a-z.-]/g

export const conditionsValidate = (conditions: ICondition[]): boolean | IValidationResult[] => {
    const ret: IValidationResult[] = []
    let pass: boolean = true
    conditions.forEach((cond: ICondition, index: number) => {
        let { key, operator, value, valueB } = cond
        const keyReplaced = key.replace(REGEX_STRIP_UNSAFE_KEYS, '')
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
                    ret.push({index, reason: 'Value can only be of type Date | string | number | boolean',
                        valid: false})
                }
            } else {
                // check things like boolean > value (should only be eq)
            }
        } else if (~funcKeys.indexOf(operator)) {
            if (operator === 'between' && valueB) {
                if (typeof value === 'object') { // Date support
                    if (!value.hasOwnProperty('valueOf')) {
                        pass = false
                        ret.push({index, reason: 'Value can only be of type Date | string | number | boolean',
                        valid: false})
                    }
                } else {
                    // between shouldnt work on a string
                }
            }
        } else {
            pass = false
            ret.push({index, reason: 'Operator is not valid.', valid: false})
            return false
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
    return items.filter((item: IKeyValueObject) => !eval(conditions) )
}

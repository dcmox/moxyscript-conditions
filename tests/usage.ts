import { ConditionEditor, conditionsToString, itemsFailConditions, itemsMatchConditions } from '../moxy-conditions'

const demographics = {
    users: [
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
        },
    ],
}

const conditions = [
    {
        key: 'age',
        operator: 'lt',
        value: 20,
    },
    {
        key: 'alcohol_use',
        operator: 'eq',
        value: true,
    },
]

const ce = new ConditionEditor('offers.json')
//ce.addCondition('alcoholUsers', conditions)
console.log(ce.runMatchCondition('alcoholUsers', demographics.users))

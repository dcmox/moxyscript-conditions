import assert from 'assert'
import sinon from 'sinon'
import * as testSuite from '../moxy-conditions'
import { demographics } from './test-data'

// const conditionsForOffer = conditionsToString(conditions)
// console.log('Match', itemsMatchConditions(data.users, conditionsForOffer))
// console.log('Fail', itemsFailConditions(data.users, conditionsForOffer))

describe('Moxy Conditions test suite', () => {
    it('Should not console.log (Sanitize Input)', () => {
        const conditions = [
            { // Injection Example
                key: 'country',
                operator: 'eq',
                value: 'US\') && console.error(\'***unsanitized input***\') && (\'1\' === \'1',
            },
        ]
        const spyMockLog = sinon.spy(console, 'error')
        const conditionsForOffer = testSuite.conditionsToString(conditions)
        testSuite.itemsMatchConditions(demographics.users, conditionsForOffer)
        sinon.assert.notCalled(spyMockLog)
        spyMockLog.restore()
    })

    it('Conditions less than and equal to should match case.', () => {
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
        const conditionsForOffer = testSuite.conditionsToString(conditions)
        const result = testSuite.itemsMatchConditions(demographics.users, conditionsForOffer)
        assert.equal(result.length, 1, 'Only one item should match')
        assert.equal(result[0].id, 1937125, 'ID does not match!')
    })

    it('Should test conditions gt and between and match case while two should fail.', () => {
        const conditions = [
            {
                key: 'registered',
                operator: 'gt',
                value: new Date('2019-10-05'),
            },
            {
                key: 'registered',
                operator: 'between',
                value: new Date('2019-10-07'),
                valueB: new Date('2019-10-10'),
            },
        ]
        const conditionsForOffer = testSuite.conditionsToString(conditions)
        let result = testSuite.itemsMatchConditions(demographics.users, conditionsForOffer)
        assert.equal(result.length, 1, 'Only one item should match')
        assert.equal(result[0].id, 1937126, 'ID does not match!')

        result = testSuite.itemsFailConditions(demographics.users, conditionsForOffer)
        assert.equal(result.length, 2, 'Two items should fail conditions')
    })
    it('Should detect invalid key', () => {
        const conditions = [
            {
                key: '`console.log(\'test\') && (1 ',
                operator: 'eq',
                value: 1,
            },
        ]
        const result = testSuite.conditionsValidate(conditions)
        if (typeof result !== 'boolean') {
            assert.equal(result[0].reason, 'Key contains unsafe character')
        }
        assert.notEqual(result, true, 'Passing invalid key should not evaluate to true')
    })
    it('Should detect invalid value', () => {
        const conditions = [
            {
                key: 'age',
                operator: 'eq',
                value: '`console.log(\'test\')`',
            },
        ]
        const result = testSuite.conditionsValidate(conditions)
        if (typeof result !== 'boolean') {
            assert.equal(result[0].reason, 'Value contains unsafe character')
        }
        assert.notEqual(result, true, 'Passing invalid value should not evaluate to true')
    })
    it('Should detect other invalid conditions', () => {
        const conditions = [
            {
                key: 'registered',
                operator: 'blah',
                value: new Date('2019-10-05'),
            },
        ]
        let result = testSuite.conditionsValidate(conditions)
        if (typeof result !== 'boolean') {
            assert.equal(result[0].reason, 'Operator is not valid.')
        }
        assert.notEqual(result, true, 'Passing invalid operator should not evaluate to true')

        const conditionsB = [
            {
                key: 'registered',
                operator: 'between',
                value: new Date('2019-10-05'),
                valueB: 'blah',
            },
        ]
        result = testSuite.conditionsValidate(conditionsB)
        if (typeof result !== 'boolean') {
            assert.equal(result[0].reason, 'Value can only be of type Date | string | number | boolean')
        }
        assert.notEqual(result, true, 'Passing invalid value should not evaluate to true')
    })
})

// {
//     key: 'age',
//     operator: 'lt',
//     value: 20,
// },
// {
//     key: 'alcohol_use',
//     operator: 'eq',
//     value: true,
// },

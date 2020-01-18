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
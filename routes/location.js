const express = require('express')
const router = express.Router()
const {
    getCity,
    getCountry,
    getCities,
    addCity,
    addCountry,
    getCountries
} = require('../controllers/location')

router.get('/city/:cityId', getCity)
router.get('/country/:countryId', getCountry)
router.get('/country', getCountries)
router.get('/city', getCities)

router.post('/city', addCity)
router.post('/country', addCountry)

module.exports = router
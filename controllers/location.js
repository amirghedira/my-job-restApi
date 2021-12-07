const Country = require('../models/Country')
const City = require('../models/City')



exports.getCity = async (req, res) => {
    try {
        const city = await City.findOne({ _id: req.params.cityId })
            .populate('country')
        if (!city)
            return res.status(404).json({ message: 'city not found' })
        return res.Status(200).json({ city })
    } catch (error) {
        res.status(500).json({ message: error })
    }
}




exports.getCountry = async (req, res) => {
    try {
        const country = await Country.findOne({ _id: req.params.countryId })
            .populate('cities')
        if (!country)
            return res.status(404).json({ message: 'country not found' })
        return res.Status(200).json({ city })
    } catch (error) {

    }
}



exports.getCities = async (req, res) => {
    try {
        const cities = await City.find()
            .populate('country')
        res.status(200).json({ cities })
    } catch (error) {
        res.status(500).json({ message: error })
    }
}


exports.getCountries = async (req, res) => {
    try {
        const countries = await Country.find()
            .populate('cities')
        res.status(200).json({ countries })
    } catch (error) {
        res.status(500).json({ message: error })
    }
}


exports.addCity = async (req, res) => {
    try {

    } catch (error) {
        res.status(500).json({ message: error })
    }
}
exports.addCountry = async (req, res) => {
    try {

    } catch (error) {
        res.status(500).json({ message: error })
    }
}
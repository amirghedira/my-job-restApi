const express = require('express')
const AuthGuard = require('../middleware/AuthGuard')
const router = express.Router()
const {
    createOffer,
    getOffer,
    updateOffer,
    deleteOffer,
    searchOffer,
    getOffersBytag,
    getOffersByFollowers,
    getOffers
} = require('../controllers/offer')


router.post('/', AuthGuard, createOffer)
router.get('/', AuthGuard, getOffers)
router.get('/search', searchOffer)
router.get('/tag/:tag', getOffersBytag)
router.get('/followers', AuthGuard, getOffersByFollowers)
router.get('/:offerId', getOffer)
router.patch('/:offerId', AuthGuard, updateOffer)
router.delete('/:offerId', AuthGuard, deleteOffer)
module.exports = router
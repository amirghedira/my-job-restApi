const express = require('express')
const router = express.Router()
const {

    getDomains,
    getDomain,
    createDomain,
    updateDomain,
    deleteDomain,
    addDomainCategory,
    removeDomainCategory

} = require('../controllers/domain')
const { upload } = require('../middleware/awsUpload')

router.get('/', getDomains)
router.get('/:domainId', getDomain)

router.post('/', upload.single('domainImage'), createDomain)
router.post('/category', addDomainCategory)

router.patch('/:domainId', updateDomain)
router.delete('/category/:categoryId', removeDomainCategory)
router.delete('/:domainId', deleteDomain)


module.exports = router
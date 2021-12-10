const express = require('express')
const
    {
        userLogin,
        userLogout,
        createUser,
        updateUserInfo,
        getConnectedUser,
        updateAccessToken,
        updateUserPassword,
        searchConsultant,
        addSavedOffer,
        deleteSavedOffer,
        followClient,
        unFollowClient,
        getConsultant,
        getClient,
        verifyUser,
        getConsultantsBySkills,
        updateUserSkill,
        deleteUserSkill,
        addUserSkill,
        markNotificationsAsRead
    } = require('../controllers/user')
const AuthGuard = require('../middleware/AuthGuard')
const router = express.Router()



router.post('/login', userLogin)
router.post('/', createUser)
router.post('/token', updateAccessToken)
router.post('/saved', AuthGuard, addSavedOffer)
router.post('/follow', AuthGuard, followClient)
router.post('/skill', AuthGuard, addUserSkill)


router.get('/verify/:token', verifyUser)
router.get('/search', searchConsultant)
router.get('/skill/:skill', getConsultantsBySkills)

router.get('/connected-user', AuthGuard, getConnectedUser)
router.get('/consultant/:userId', getConsultant)
router.get('/client/:userId', getClient)

router.patch('/logout', AuthGuard, userLogout)
router.patch('/', AuthGuard, updateUserInfo)
router.patch('/update-password', AuthGuard, updateUserPassword)
router.patch('/skill/:skillId', AuthGuard, updateUserSkill)
router.patch('/notifications', AuthGuard, markNotificationsAsRead)

router.delete('/saved/:offerId', AuthGuard, deleteSavedOffer)
router.delete('/follow/:clientId', AuthGuard, unFollowClient)
router.delete('/skill/:skillId', AuthGuard, deleteUserSkill)
module.exports = router
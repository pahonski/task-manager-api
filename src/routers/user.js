const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const User = require('../models/user')
const auth = require('../middleware/auth')
const router = new express.Router()






router.post('/users', async(req, res) => {
    const user = new User(req.body)

    try {
        await user.save()
        const token = await user.generateAuthToken()
        res.status(201).send({ user, token })
    } catch (e) {
        res.status(400).send(e)
    }
})

router.post('/users/login', async(req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({ user, token })
    } catch (e) {
        console.log(e)
        res.status(400).send(e)
    }
})

router.post('/users/logout', auth, async(req, res) => {
    try {
        const user = req.user
        user.tokens = user.tokens.filter(token => token.token !== req.token)
        await req.user.save()

        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

router.post('/users/logoutAll', auth, async(req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()

        res.send('Success!')
    } catch (e) {
        res.status(500).send(e)
    }

})

// router.get('/users', auth, async(req, res) => {

//     try {
//         const users = await User.find({})
//         res.send(users)
//     } catch (e) {
//         res.status(500).send()
//     }
// })

router.get('/users/me', auth, async(req, res) => {
    try {
        res.send(req.user)
        console.log('can do something')
    } catch (e) {
        res.status(500).send()
    }
})

// it doesn't need any more
// router.get('/users/:id', async(req, res) => {
//     const _id = req.params.id

//     try {
//         const user = await User.findById(_id)
//         if (!user) {
//             return res.status(404).send()
//         }

//         res.send(user)
//     } catch (e) {
//         res.status(500).send()
//     }
// })

router.patch('/users/me', auth, async(req, res) => {
    const user = req.user
    const _id = user._id
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const isValidOperation = updates.every(update => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({ 'error': 'Invalid updates!' })
    }

    try {

        updates.forEach(update => (user[update] = req.body[update]))

        await user.save()

        // const user = await User.findByIdAndUpdate(_id, req.body, { new: true, runValidators: true })

        res.send(user)
    } catch (e) {
        res.status(400).send(e)
    }

})


router.delete('/users/me', auth, async(req, res) => {
    // const _id = req.params.id

    try {
        // const user = await User.findByIdAndDelete(req.user._id)

        // if (!user) {
        //     return res.status(404).send()
        // }

        await req.user.remove()
        res.send(req.user)
    } catch (e) {
        res.status(500).send()
    }
})



const upload = multer({
    // dest: 'avatars',
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {

        // if (!file.originalname.endsWith('.pdf')) {
        //     return cb(new Error('Please upload a PDF'))
        // }

        // if (!file.originalname.match(/\.(doc|docx)$/)) {
        //     return cb(new Error('Please upload a WORD document'))
        // }

        if (!file.originalname.match(/\.(jpg|jpeg|png)$/g)) {
            return cb(new Error('File must be a JPG'))
        }

        cb(undefined, true)

        // cb(new Error('File must be a PDF'))
        // cb(undefined, true)
        // cb(undefined, false)
    }
})

router.post('/users/me/avatar', auth, upload.single('avatar'), async(req, res) => {
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({
        'error': error.message
    })
})

router.delete('/users/me/avatar', auth, async(req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send()
})

router.get('/users/:id/avatar', async(req, res) => {
    try {
        const user = await User.findById(req.params.id)

        if (!user || !user.avatar) {
            throw (new Error())
        }

        res.set('Content-Type', 'image/png')
        res.send(user.avatar)

    } catch (e) {
        res.status(404).send()
    }
})

module.exports = router
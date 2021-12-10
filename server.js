if (process.env.NODE_ENV != 'production') {
    require('dotenv').config();
}
const http = require('http');
const app = require('./app');
const port = process.env.PORT || 5000;
const server = http.createServer(app);
const io = require('socket.io')(server)
const jwt = require('jsonwebtoken')


const ConnectedUsers = [];

server.listen(process.env.PORT || 5000, () => {
    io.on('connection', (socket) => {
        socket.on('connectuser', (token) => {
            try {
                let user = jwt.decode(token, process.env.ACCESS_TOKEN_KEY)
                if (user) {
                    const userIndex = ConnectedUsers.findIndex(connecteduser => {
                        return connecteduser.userid === user._id
                    })
                    if (userIndex === -1)
                        ConnectedUsers.push({ userid: user._id, socketIds: [socket.id] })
                    else {
                        if (!ConnectedUsers[userIndex].socketIds.includes(socket.id))
                            ConnectedUsers[userIndex].socketIds.push(socket.id)
                    }
                }
            } catch (error) {
                console.log(error)
            }
        })

        socket.on('disconnect', () => {
            const userIndex = ConnectedUsers.findIndex(connecteduser => {
                return connecteduser.socketIds.includes(socket.id)
            })
            if (userIndex >= 0) {
                const socketIndex = ConnectedUsers[userIndex].socketIds.findIndex(socketId => socketId === socket.id)
                ConnectedUsers[userIndex].socketIds.splice(socketIndex, 1)
                if (ConnectedUsers[userIndex].socketIds.length === 0) {
                    ConnectedUsers.splice(userIndex, 1)
                }

            }
        })
        socket.on('send-notification', ({ userId, notification }) => {

            const userIndex = ConnectedUsers.findIndex(connecteduser => {
                return connecteduser.userid === userId
            })

            if (userIndex >= 0)
                ConnectedUsers[userIndex].socketIds.forEach(socketId => {
                    socket.broadcast.to(socketId).emit('send-notification', { notification })
                })
        })
        socket.on('broadcast-notification', ({ usersIds, notification }) => {
            usersIds.forEach(userId => {
                const userIndex = ConnectedUsers.findIndex(connecteduser => {
                    return connecteduser.userid === userId
                })

                if (userIndex >= 0)
                    ConnectedUsers[userIndex].socketIds.forEach(socketId => {
                        socket.broadcast.to(socketId).emit('send-notification', { notification })
                    })
            })
        })
    })
})




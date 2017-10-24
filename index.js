const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 4000;

app.use('/trumbowyg', express.static(__dirname + '/node_modules/trumbowyg/dist/'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

let users = [];

io.on('connection', (socket) => {
    io.to(socket.id).emit('users', users);

    socket.on('disconnect', () => {
        let index = users.indexOf(socket.username);
        if (index > -1) {
            users.splice(index, 1);
        }

        socket.broadcast.emit('user left', socket.username);
    });

    socket.on('set username', (username) => {
        if (users.indexOf(username) === -1) {
            console.log(`new user: ${username} has joined.`);
            socket.username = username;
            users.push(username);

            socket.broadcast.emit('user joined', username);
            io.to(socket.id).emit('connected', username);
        } else {
            io.to(socket.id).emit('bad username');
        }
    });

    socket.on('message', (message) => {
        // we tell the client to execute 'new message'
        socket.broadcast.emit('message', {
            username: socket.username,
            message: message
        });
    });

});

http.listen(port, () => {
    console.log('listening on http://localhost:' + port);
});
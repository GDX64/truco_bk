"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_1 = __importDefault(require("socket.io"));
const GameClasses_1 = require("./GameClasses");
const allUsers = {};
const rooms = {
    room1: new GameClasses_1.Room('room1'),
    room2: new GameClasses_1.Room('room2'),
    room3: new GameClasses_1.Room('room3'),
    room4: new GameClasses_1.Room('room4'),
    room5: new GameClasses_1.Room('room5'),
};
function disconnectMe(socket) {
    if (allUsers[socket.id]) {
        const player = allUsers[socket.id];
        player.room.people = player.room.people.filter(thisPlayer => thisPlayer != player);
        player.room.whoPlaysNow = undefined;
        player.notifyMe(socket, true, `${player.name} left the room`);
        socket.leave(player.room.name);
        console.log(player.name, 'has left the room');
        delete allUsers[socket.id];
    }
}
function init(server) {
    const io = socket_io_1.default(server);
    io.on('connect', (socket) => {
        socket.emit('welcome', { rooms: Object.keys(rooms) });
        socket.on('thanks', (message) => {
            console.log(message);
        });
        //JOINROOM
        socket.on('joinRoom', (data) => {
            if (!(data.room in rooms)) {
                socket.emit('InfoError', { message: 'no room with this name' });
                return;
            }
            if (rooms[data.room].people.length >= 4) {
                socket.emit('InfoError', { message: 'The room is full' });
                return;
            }
            disconnectMe(socket);
            const player = new GameClasses_1.Player(data.name, socket.id, rooms[data.room]);
            allUsers[socket.id] = player;
            player.setHand();
            rooms[data.room].addPlayer(player);
            socket.join(data.room, () => {
                console.log('User joined room ' + data.room);
            });
            player.notifyMe(socket, true, `${player.name} entered the room`);
            console.log(`User ${data.name} entered the test room`);
        });
        socket.on('disconnect', () => {
            disconnectMe(socket);
        });
        socket.on('playRound', data => {
            const player = allUsers[socket.id];
            if (player.room.people.length < 2) {
                return;
            }
            player.room.whoPlaysNow = player.room.people[0];
            player.room.shuffle();
            player.room.table = [];
            player.room.endTurn();
            player.room.people.forEach(person => {
                person.setHand();
                person.notifyMe(io.sockets.connected[person.id], true, '');
            });
            console.log("Round start");
        });
        socket.on('endTurn', data => {
            const player = allUsers[socket.id];
            if (player.room.turnEnded) {
                player.room.endTurn();
                player.notifyMe(socket, true, 'Começando novo turno');
            }
        });
        socket.on('playedCard', (data) => {
            const player = allUsers[socket.id];
            if (player.room.whoPlaysNow === player && !player.room.turnEnded) {
                player.playCard(data.card);
                console.log(data.card);
                let nextIndex = (player.room.people.indexOf(player) + 1);
                if (nextIndex > 1) {
                    player.room.turnEnded = true;
                    player.notifyMe(socket, true, `${player.name} made his move`);
                    return;
                }
                player.room.whoPlaysNow = player.room.people[nextIndex];
                player.notifyMe(socket, true, `${player.name} made his move`);
            }
        });
    });
}
exports.default = init;

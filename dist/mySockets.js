"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_1 = __importDefault(require("socket.io"));
const lodash_1 = __importDefault(require("lodash"));
const allSVG_1 = __importDefault(require("./allSVG"));
class Player {
    constructor(name, id, room) {
        this.name = name;
        this.id = id;
        this.hand = [];
        this.room = room;
    }
    setHand() {
        this.hand = this.room.deck.splice(0, 4);
    }
    playCard(card) {
        this.hand = this.hand.filter(item => item != card);
        this.room.table.push(card);
    }
    notifyMe(socket, bNotifyOthers, message) {
        var _a;
        const objInfo = {
            message,
            table: this.room.table,
            playersList: this.room.people.map(item => item ? item.name : ''),
            whoPlaysNow: (_a = this.room.whoPlaysNow) === null || _a === void 0 ? void 0 : _a.name,
            turnEnded: this.room.turnEnded
        };
        socket.emit('updateInfo', Object.assign(Object.assign({}, objInfo), { hand: this.hand }));
        bNotifyOthers && socket.to(this.room.name).emit('updateInfo', objInfo);
    }
}
class Room {
    constructor(name) {
        this.deck = lodash_1.default.shuffle(allSVG_1.default);
        this.people = [];
        this.table = [];
        this.name = name;
        this.turnEnded = false;
    }
    addPlayer(player) {
        if (this.people.length < 4)
            this.people.push(player);
    }
    shuffle() {
        this.deck = lodash_1.default.shuffle(allSVG_1.default);
    }
    endTurn() {
        const first = this.people.shift();
        this.people.push(first);
        this.table = [];
        this.whoPlaysNow = this.people[0];
        this.turnEnded = false;
    }
}
const allUsers = {};
const rooms = {
    testRoom: new Room('testRoom'),
    room1: new Room('room1'),
    room2: new Room('room2'),
    room3: new Room('room3'),
};
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
            const player = new Player(data.name, socket.id, rooms[data.room]);
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
            if (allUsers[socket.id]) {
                const player = allUsers[socket.id];
                player.room.people = player.room.people.filter(thisPlayer => thisPlayer != player);
                player.notifyMe(socket, true, `${player.name} left the room`);
                console.log(allUsers[socket.id].name, 'has left the room');
                delete allUsers[socket.id];
            }
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

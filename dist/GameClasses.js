"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Player = exports.Room = void 0;
const allSVG_1 = __importDefault(require("./allSVG"));
const lodash_1 = __importDefault(require("lodash"));
class Player {
    constructor(name, id, room) {
        this.name = name;
        this.id = id;
        this.hand = [];
        this.room = room;
    }
    setHand() {
        this.hand = this.room.deck.splice(0, 3);
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
exports.Player = Player;
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
exports.Room = Room;

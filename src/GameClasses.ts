import { Socket } from 'socket.io'
import allSVGs from './allSVG'
import _ from 'lodash'

class Player {
    name: string;
    id: string;
    hand: string[];
    room: Room;

    constructor(name: string, id: string, room: Room) {
        this.name = name
        this.id = id
        this.hand = []
        this.room = room
    }

    setHand() {
        this.hand = this.room.deck.splice(0, 3)
    }

    playCard(card: string) {
        this.hand = this.hand.filter(item => item != card)
        this.room.table.push(card)
    }

    notifyMe(socket: Socket, bNotifyOthers: boolean, message: string) {
        const objInfo = {
            message,
            table: this.room.table,
            playersList: this.room.people.map(item => item ? item.name : ''),
            whoPlaysNow: this.room.whoPlaysNow?.name,
            turnEnded: this.room.turnEnded
        }

        socket.emit('updateInfo', { ...objInfo, hand: this.hand })
        bNotifyOthers && socket.to(this.room.name).emit('updateInfo', objInfo)
    }
}

class Room {
    name: string;
    people: Player[]
    table: string[];
    whoPlaysNow: Player | undefined;
    deck: string[];
    turnEnded: boolean;

    constructor(name: string) {
        this.deck = _.shuffle(allSVGs)
        this.people = []
        this.table = []
        this.name = name
        this.turnEnded = false
    }

    addPlayer(player: Player) {
        if (this.people.length < 4) this.people.push(player)
    }

    shuffle() {
        this.deck = _.shuffle(allSVGs)
    }
    endTurn() {
        const first = this.people.shift()
        this.people.push(first as Player)
        this.table = [];
        this.whoPlaysNow = this.people[0]
        this.turnEnded = false
    }
}

interface PlayerJoinRoomMessage {
    name: string
    room: string
}
interface PlayerPlayedACard {
    card: string,
    name: string
}

export { PlayerJoinRoomMessage, PlayerPlayedACard, Room, Player }
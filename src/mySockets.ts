import socketio, { Server, Socket } from 'socket.io'
import _ from 'lodash'
import allSVGs from './allSVG'

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
        this.hand = this.room.deck.splice(0, 4)
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

const allUsers: { [id: string]: Player } = {}
const rooms: { [id: string]: Room } = {
    testRoom: new Room('testRoom'),
    room1: new Room('room1'),
    room2: new Room('room2'),
    room3: new Room('room3'),
}

interface HttpServer { }

export default function init(server: HttpServer) {
    const io: Server = socketio(server)

    io.on('connect', (socket: Socket) => {
        socket.emit('welcome', { rooms: Object.keys(rooms) })

        socket.on('thanks', (message) => {
            console.log(message)
        })

        //JOINROOM
        socket.on('joinRoom', (data: PlayerJoinRoomMessage) => {
            if (!(data.room in rooms)) {
                socket.emit('InfoError', { message: 'no room with this name' })
                return;
            }

            const player = new Player(data.name, socket.id, rooms[data.room])
            allUsers[socket.id] = player

            player.setHand()
            rooms[data.room].addPlayer(player)

            socket.join(data.room, () => {
                console.log('User joined room ' + data.room)
            })

            player.notifyMe(socket, true, `${player.name} entered the room`)
            console.log(`User ${data.name} entered the test room`)
        })

        socket.on('disconnect', () => {
            if (allUsers[socket.id]) {
                console.log(allUsers[socket.id].name, 'has left the room')
                delete allUsers[socket.id]
            }
        })

        socket.on('playRound', data => {
            const player = allUsers[socket.id]

            if (player.room.people.length > 4) {
                return
            }

            player.room.whoPlaysNow = player.room.people[0]
            player.room.shuffle()
            player.room.table = []
            player.room.endTurn()
            player.room.people.forEach(person => {
                person.setHand()
                person.notifyMe(io.sockets.connected[person.id], true, '')
            })

            console.log("Round start")

        })

        socket.on('endTurn', data => {
            const player = allUsers[socket.id]

            if (player.room.turnEnded) {
                player.room.endTurn()
                player.notifyMe(socket, true, 'Começando novo turno')
            }
        })

        socket.on('playedCard', (data: PlayerPlayedACard) => {
            const player = allUsers[socket.id]
            if (player.room.whoPlaysNow === player && !player.room.turnEnded) {
                player.playCard(data.card)
                console.log(data.card)
                let nextIndex = (player.room.people.indexOf(player) + 1)
                if (nextIndex > 1) {
                    player.room.turnEnded = true
                    player.notifyMe(socket, true, `${player.name} made his move`)
                    return;
                }
                player.room.whoPlaysNow = player.room.people[nextIndex]
                player.notifyMe(socket, true, `${player.name} made his move`)
            }
        })
    })
}
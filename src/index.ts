import cluster from 'cluster'
import init from './mySockets'
import express, { Application, NextFunction, Request, Response } from 'express'
import initSocket from './mySockets'

function initServer() {
    const app = express()


    app.use(express.static('./public'))

    const server = app.listen(process.env.PORT || 5000, () => {
        console.log("Server is listening")
    })

    initSocket(server)
}

if (cluster.isMaster) {
    cluster.fork()

    cluster.on('unhandledException', (e) => {
        console.log("There was a really bad problem")
        console.error(e)
        process.exit(1)
    })
    cluster.on('exit', () => {
        console.log('tryingo to fork before exiting')
        cluster.fork()
    })
} else {
    initServer()
}


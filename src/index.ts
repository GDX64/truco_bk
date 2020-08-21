import express, { Application, NextFunction, Request, Response } from 'express'
import initSocket from './mySockets'

const app = express()


app.use(express.static('./public'))

const server = app.listen(process.env.PORT || 5000, () => {
    console.log("Server is listening")
})

initSocket(server)
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cluster_1 = __importDefault(require("cluster"));
const express_1 = __importDefault(require("express"));
const mySockets_1 = __importDefault(require("./mySockets"));
function initServer() {
    const app = express_1.default();
    app.use(express_1.default.static('./public'));
    const server = app.listen(process.env.PORT || 5000, () => {
        console.log("Server is listening");
    });
    mySockets_1.default(server);
}
if (cluster_1.default.isMaster) {
    cluster_1.default.fork();
    cluster_1.default.on('unhandledException', (e) => {
        console.log("There was a really bad problem");
        console.error(e);
        process.exit(1);
    });
    cluster_1.default.on('exit', () => {
        console.log('tryingo to fork before exiting');
        cluster_1.default.fork();
    });
}
else {
    initServer();
}

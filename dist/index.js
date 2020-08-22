"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mySockets_1 = __importDefault(require("./mySockets"));
const app = express_1.default();
app.use(express_1.default.static('./public'));
const server = app.listen(process.env.PORT || 5000, () => {
    console.log("Server is listening");
});
mySockets_1.default(server);

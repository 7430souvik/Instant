import express from "express";

import {createServer} from "node:http";
import { Server } from "socket.io";

import mongoose  from "mongoose";

import cors from "cors";
import { connectToSocket } from "./controller/socketManager.js";
import userRoutes from "./routes/users.routes.js";


const app = express();
const server = createServer(app);
const io = connectToSocket(server);

app.set("port", process.env.PORT ||8000);

app.use(cors());
app.use(express.json({limit: "40kb"}));
app.use(express.urlencoded({limit: "40kb", extended: true}));

app.use("/api/v1/users", userRoutes);
const start= async()=>{

    const connectionDB = await mongoose.connect("mongodb+srv://souvikchatterjee080_db_user:Souvik123@cluster0.mdpo15p.mongodb.net/");
    console.log(`MONGO Connected DB host: ${connectionDB.connection.host}`)
    server.listen(app.get("port"),()=>{
    console.log("listening on 8000");
    });

}

start();

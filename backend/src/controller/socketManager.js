import mongoose from "mongoose";
import { Server } from "socket.io";

let connections = {}
let messages = {}
let timeOnline = {}

const { connection } = mongoose;

export const connectToSocket= (server)=>{
    const io = new Server(server,{
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            allowedHeaders: ["*"],
            credentials: true
        }
    });

    io.on("connection", (socket)=>{

        console.log("something connected");
        socket.on("join-call", (path)=>{

            if(connections[path] === undefined){
                connections[path]= []

            }

            connections[path].push(socket.id);

            timeOnline[socket.id] = new Date();

            for(let a=0; a<connections[path].length; a++){
                io.to(connections[path][a]).emit("user-joined", socket.id, connections[path])
            }

            if(messages[path] !== undefined){
                for(let a=0; a<messages[path].length; ++a){
                    io.to(socket.id).emit("chat-message", messages[path][a]['data']),
                        messages[path][a]['sender'], messages[path][a]['socket-id-sender']

            }

            }

            

        })

        socket.on("signal",(toId, message)=>{
            io.to(toId).emit("signal", socket.id, message);
        });



        socket.on("chat-message", (data, sender)=>{
            const [matchingRoom, found] = Object.entries(connections)
                .reduce(([room, isFound],[roomkey, roomValue])=>{


                    if(!isFound && roomValue.includes(socket.id)){
                        return [roomkey, true];
                    }
                    return [room, idFound];
                }, ['', false]);
            
            if(found === true){
                if(messages[matchingRoom] === undefined){
                    messages[matchingRoom] = []
                }

                messages[matchingRoom].push({'sender': sender, "data": data,"socket-id-sender": socket.id})
                console.log("message", matchingRoom, ":", sender, data)

                connections[matchingRoom].forEach((elem)=>{
                    io.to(elem).emit("chat-message", data,sender, socket.id)
                })
            }

        })

        socket.on("disconnect", () => {
            const diffTime = Math.abs(timeOnline[socket.id] - new Date());

            console.log("User disconnected:", socket.id);

            for (const [room, person] of Object.entries(connections)) {

                const index = person.indexOf(socket.id);

                if (index !== -1) {

                    // Tell everyone else in the room that this user left
                    person.forEach((clientId) => {
                        if (clientId !== socket.id) {
                            io.to(clientId).emit("user-left", socket.id);
                        }
                    });

                    // Remove user from room
                    connections[room].splice(index, 1);

                    // Remove empty room
                    if (connections[room].length === 0) {
                        delete connections[room];
                    }

                    break;
                }
            }

            delete timeOnline[socket.id];

            console.log("User removed:", socket.id);
        });
    })
    return io;
}


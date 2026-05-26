import { WebSocketServer } from "ws";
import socketAuth from "./middlewares/socketAuth.js";

function setupWebSocket(server, webSocketEvents){

    const wss = new WebSocketServer({ server });

    wss.on('connection',async (ws,req)=>{
        try{
            const auth=await socketAuth(req);
            if(!auth){
                ws.close(1008,"Unauthorized")
                return;
            }
            ws.user=auth;
            ws.send(JSON.stringify({
            type:"WELCOME",
            message:"Connected to websocket server"
        }))
        webSocketEvents(ws,wss,req);
        }catch(error){
            ws.close(1011,'Internal server error')
        }
    })
}

export default setupWebSocket;
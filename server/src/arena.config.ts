import Arena from "@colyseus/arena";
import { monitor } from "@colyseus/monitor";
import { matchMaker } from 'colyseus'
import basicAuth from "express-basic-auth";
import express from 'express';
import path from 'path';

import { CustomLobbyRoom } from "./rooms/CustomLobbyRoom";
//import  { initializeApp, applicationDefault, cert } from '../node_modules/firebase-admin/lib/app'
import { LobbyRoom } from 'colyseus';
//import serveIndex from 'serve-index';



/**
 * Import your Room files
 */
import { BattleRoom } from "./rooms/BattleRoom";

export default Arena({
    getId: () => "Your Colyseus App",

    initializeGameServer: (gameServer) => {
        

        // Define "state_handler" room
        gameServer.define("snowball_room", BattleRoom)
        .filterBy(['env','titleId','battleDataOptions.levelId',"battleDataOptions.maxPlayers","battleDataOptions.customRoomId"])
        .enableRealtimeListing();


        // Define "custom_lobby" room
        gameServer.define("custom_lobby", CustomLobbyRoom)
            .filterBy(['env','titleId'])
        ;

    },

    initializeExpress: (app) => {
        /**
         * Bind your custom express routes here:
         */
         app.get("/", (req, res) => {
            res.send("It's time to kick ass and chew bubblegum!");
        });

        //app.use('/', serveIndex( path.join(__dirname, "static"), {'icons': true} ))
        //app.use('/', express.static(path.join(__dirname, "static")));

        //console.log("INIT!!")
        //console.log(serveIndex(path.join(__dirname, "static")))
        
        //serveIndex prevents POST
        //app.use(serveIndex(path.join(__dirname, "static"), {'icons': true}))
        app.use(express.static(path.join(__dirname, "static")));


        const basicAuthMiddleware = basicAuth({
            // list of users and passwords
            users: {
                "admin": process.env.ACL_ADMIN_PW !== undefined ? process.env.ACL_ADMIN_PW : "admin",//YWRtaW46YWRtaW4=
                "metastudio": "admin",//bWV0YXN0dWRpbzphZG1pbg==
            },
            // sends WWW-Authenticate header, which will prompt the user to fill
            // credentials in
            challenge: true
        });
            
        
        app.use("/maintenance", basicAuthMiddleware);
        app.use("/announce", basicAuthMiddleware);


        app.post('/maintenance', (req, res) => {
            let jsonContents: {msg:string} = req.body
            console.log("XX",req.query.payload)
            if (req.query.payload && req.query.payload.length !== 0) {
              jsonContents = JSON.parse(req.query.payload as any)
            }
            if (!jsonContents || !jsonContents.msg || jsonContents.msg.length === 0) {
              console.log('maintenance msg incomplete ', jsonContents)
              res.send('maintenance msg incomplete ')
              return
            }
      
            console.log('sending maintenance to rooms ', 
              jsonContents
            )
      
            matchMaker.presence.publish('maintenance', jsonContents)
            res.send('sent maintenance:'+JSON.stringify(jsonContents))
          })
        app.post('/announce', (req, res) => {
            let jsonContents: {msg:string} = req.body
            console.log("XX",req.query.payload)
            if (req.query.payload && req.query.payload.length !== 0) {
              jsonContents = JSON.parse(req.query.payload as any)
            }
            if (!jsonContents || !jsonContents.msg || jsonContents.msg.length === 0) {
              console.log('announce msg incomplete ', jsonContents)
              res.send('announce msg incomplete ')
              return
            }
      
            console.log('sending announcement to rooms ', 
              jsonContents
            )
      
            matchMaker.presence.publish('announce', jsonContents)
            res.send('sent announcement:'+JSON.stringify(jsonContents))
          })

        
        /**
         * Bind @colyseus/monitor
         * It is recommended to protect this route with a password.
         * Read more: https://docs.colyseus.io/tools/monitor/
         */
        app.use("/colyseus", basicAuthMiddleware, monitor());
    },


    beforeListen: () => {
        /**
         * Before before gameServer.listen() is called.
         */
    }
});
// noinspection JSValidateTypes

const fs = require('fs');
const https = require('https');
const express = require('express');
const socketIo = require('socket.io');
const app = express();

app.use(express.static(__dirname));

// const key = fs.readFileSync('cert.key');
// const cert = fs.readFileSync('cert.crt');

// const server = https.createServer({ key, cert }, app);

const server = app.listen(3000,()=>{
    console.log("server is live on port 3000");    
}); 
const io = socketIo(server);

// server.listen(3000);

// ************* SOCKET IO **************

const offers = [];
const connectedSockets = [];



io.on('connection', (socket) => {
    console.log('a user connected with id: ' + socket.id);

    const userName = socket.handshake.auth.userName;
    if(userName){
        connectedSockets.push({
            socketId:socket.id,
            userName:userName
        });
    }



    socket.on('newOffer', (offer) => {
        // console.log(offer);
        if(offer){
            offers.push({
                offererUserName:userName,
                offer:offer,
                offererIceCandidate:[],
                answererUserName:null,
                answer:null,
                answererIceCandidate:[]
                }
            )
        }
        socket.broadcast.emit('newOfferAwaiting', offers);
    });

    socket.on('newAnswer', (offerObj,ackFunc) => {
        const offerToUpdate = offers.find(offer => offer.offererUserName === offerObj.offererUserName);
        if(offerToUpdate){
            offerToUpdate.answer = offerObj.answer;
            offerToUpdate.answererUserName = userName;
            ackFunc(offerToUpdate.offererIceCandidate);
        }
        const  socketToEmit = connectedSockets.find(s => s.userName === offerObj.offererUserName);
        if(socketToEmit){
            socket.to(socketToEmit.socketId).emit('answerResponse', offerToUpdate);
        }
    })





    socket.on('newIceCandidate', (data) => {

        const  {iceCandidate,iceUserName,didIOffer} = data;
        if(didIOffer){
            const  offerToUpdate = offers.find(offer => offer.offererUserName === iceUserName);
            if(offerToUpdate){
                offerToUpdate.offererIceCandidate.push(iceCandidate);

                if(offerToUpdate.answererUserName){
                    const sendOfferTo = connectedSockets.find( s => s.userName === offerToUpdate.answererUserName);
                    if(sendOfferTo){
                        socket.to(sendOfferTo.socketId).emit('receivedIceFromServer', iceCandidate);
                    }
                }
            }
        }else{
            const answerToUpdate = offers.find(offer => offer.answererUserName === iceUserName);
            if(answerToUpdate){
                answerToUpdate.answererIceCandidate.push(iceCandidate);
                const sendAnswerTo = connectedSockets.find( s => s.userName === answerToUpdate.offererUserName);
                if(sendAnswerTo){
                    socket.to(sendAnswerTo.socketId).emit('receivedIceFromServer', iceCandidate);
                }

            }
        }


    });








    socket.on('disconnect', () => {
        console.log('user disconnected with id: ' + socket.id);
    })



});




























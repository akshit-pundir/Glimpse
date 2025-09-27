// noinspection JSUnresolvedReference

const userName = `AP-00${Math.floor(Math.random()*1000)}`;

const socket = io('https://localhost:3000',{
    auth:{
        userName:userName
    }
});
console.log(userName);



let localStream;
let remoteStream;
let peerConnection;
let localVideoElement = document.getElementById('user-1');
let remoteVideoElement = document.getElementById('user-2');
let didIOffer= false;


const  stunServer = {
    iceServers:[
        {
            urls:[
                'stun:stun.l.google.com:19302',
                ]
        }
    ]
}




const createPeerConnection = async (offerObj)=>{
    peerConnection = new RTCPeerConnection(stunServer);
    remoteStream = new MediaStream();
    remoteVideoElement.srcObject = remoteStream;

    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    peerConnection.addEventListener('icecandidate', (event) => {
        console.log(event);
        if(event.candidate){
            socket.emit('newIceCandidate', {
                iceCandidate:event.candidate,
                iceUserName:userName,
                didIOffer
            });
        }
    });

    peerConnection.addEventListener('track', (event) => {
        event.streams[0].getTracks().forEach(trk => {
            remoteStream.addTrack(trk);
        })
    })



    if(offerObj){
        await peerConnection.setRemoteDescription(offerObj.offer);
    }

}

const createOffer = async ()=>{
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    didIOffer = true;
    socket.emit('newOffer', offer);


}

const createAnswer = async (offer)=>{
    await fetchUserMedia();
    await createPeerConnection(offer);
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    didIOffer = false;
    offer.answer = answer;
    const  offerIceCandidates = await socket.emitWithAck('newAnswer', offer);

    offerIceCandidates.forEach(iceCandidate => {
        peerConnection.addIceCandidate(iceCandidate);
    });

}

const addAnswer = async (offer)=>{
    await peerConnection.setRemoteDescription(offer.answer);
}

const addNewIceCandidate = async (iceCandidate)=>{
    await peerConnection.addIceCandidate(iceCandidate);
}

const call = async ()=>{
    await fetchUserMedia();
    await createPeerConnection();
    await createOffer();

}





const fetchUserMedia = async ()=>{

    const  stream = await navigator.mediaDevices.getUserMedia({video:true,audio:true});
    localVideoElement.srcObject = stream;
    localStream = stream;
    console.log(localStream);
}






document.getElementById('start-call').addEventListener('click', call);


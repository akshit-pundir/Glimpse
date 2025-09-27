
socket.on('newOfferAwaiting', (offers) => {
    console.log(offers);
    createAnswerEl(offers);
})

socket.on('answerResponse', async (offer) => {
    await addAnswer(offer);
})

socket.on('receivedIceFromServer', async (iceCandidate) => {
    await addNewIceCandidate(iceCandidate);
})



function createAnswerEl(offers){

    const answerEl = document.getElementById('btn');
    offers.forEach(offer => {
        const answerBtn = document.createElement('button');
        answerBtn.innerText = 'Answer';
        answerBtn.addEventListener('click',async ()=>{
          await createAnswer(offer);
          }
        );
        answerBtn.className = 'btn-answer'
        answerEl.appendChild(answerBtn);
    })


}




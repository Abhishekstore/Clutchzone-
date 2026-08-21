const firebaseConfig = {
    apiKey: "AIzaSyA1jgyhtyv0fGNicgciT-JjUunyv3zVLJ8",
    authDomain: "ff-tournaments-af47a.firebaseapp.com",
    projectId: "ff-tournaments-af47a",
    storageBucket: "ff-tournaments-af47a.appspot.com",
    messagingSenderId: "238745686365",
    appId: "1:238745686365:web:83e96d5e1dd450dbe2d8b4"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

function updateSubModes() {
    const category = document.getElementById('tournament-category').value;
    const subModeSelect = document.getElementById('tournament-submode');
    subModeSelect.innerHTML = '';
    let options = [];
    if (category === 'Full Map' || category === 'Survival') options = ['Solo (Max 48)', 'Duo (Max 48)', 'Squad 12 Teams (Max 48)'];
    else if (category === 'Clash Squad') options = ['1 vs 1', '2 vs 2', '3 vs 3', '4 vs 4', '6 vs 6'];
    else if (category === 'Lone Wolf') options = ['1 vs 1', '2 vs 2'];
    options.forEach(opt => { let el = document.createElement('option'); el.value = opt; el.textContent = opt; subModeSelect.appendChild(el); });
}

window.onload = updateSubModes;

function createTournament() {
    db.collection('tournaments').add({
        title: document.getElementById('tournament-title').value,
        category: document.getElementById('tournament-category').value,
        subMode: document.getElementById('tournament-submode').value,
        entryFee: Number(document.getElementById('tournament-entry').value),
        prizePool: Number(document.getElementById('tournament-prize').value),
        perKill: Number(document.getElementById('tournament-perkill').value),
        startTime: new Date(document.getElementById('tournament-time').value).getTime(),
        status: 'Upcoming'
    }).then(() => { alert('Tournament Created!'); location.reload(); });
}

function submitResult() {
    const matchId = document.getElementById('res-match-id').value.trim();
    db.collection('results').add({
        matchId: matchId,
        ffuid: document.getElementById('res-player-uid').value,
        kills: Number(document.getElementById('res-kills').value),
        prize: Number(document.getElementById('res-prize').value),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => alert("Result Added!"));
}

function markMatchComplete() {
    const matchId = document.getElementById('res-match-id').value.trim();
    db.collection('tournaments').doc(matchId).update({ status: 'Results' }).then(() => alert("Match moved to Results!"));
}
function updateRoomCredentials() {
    const matchId = document.getElementById('room-match-id').value.trim();
    const roomId = document.getElementById('room-id-val').value.trim();
    const roomPass = document.getElementById('room-pass-val').value.trim();

    if (!matchId) {
        alert("Please enter Match ID!");
        return;
    }

    db.collection('tournaments').doc(matchId).update({
        roomId: roomId,
        roomPass: roomPass
    })
    .then(() => alert("Room ID & Password updated successfully for players!"))
    .catch(err => alert("Error: " + err.message));
}

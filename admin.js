// Firebase Configuration (Sahi Project ID ke sath)
const firebaseConfig = {
    apiKey: "AIzaSyA1jgyhtyv0fGNicgciT-JjUunyv3zVLJ8",
    authDomain: "ff-tournaments-af47a.firebaseapp.com",
    projectId: "ff-tournaments-af47a",
    storageBucket: "ff-tournaments-af47a.appspot.com",
    messagingSenderId: "238745686365",
    appId: "1:238745686365:web:83e96d5e1dd450dbe2d8b4"
};

// Initialize Firebase agar pehle se initialized na ho
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// Category ke mutabiq Sub-Modes update karne ka function
function updateSubModes() {
    const category = document.getElementById('tournament-category').value;
    const subModeSelect = document.getElementById('tournament-submode');
    subModeSelect.innerHTML = '';

    let options = [];
    if (category === 'Full Map' || category === 'Survival') {
        options = ['Solo (Max 48)', 'Duo (Max 48)', 'Squad 12 Teams (Max 48)'];
    } else if (category === 'Clash Squad') {
        options = ['1 vs 1', '2 vs 2', '3 vs 3', '4 vs 4', '6 vs 6'];
    } else if (category === 'Lone Wolf') {
        options = ['1 vs 1', '2 vs 2'];
    }

    options.forEach(opt => {
        let el = document.createElement('option');
        el.value = opt;
        el.textContent = opt;
        subModeSelect.appendChild(el);
    });
}

// Page load hote hi sub-modes load karein
window.onload = function() {
    updateSubModes();
};

// Tournament Create karne ka function (Non-full room start support ke sath)
function createTournament() {
    const title = document.getElementById('tournament-title').value.trim();
    const category = document.getElementById('tournament-category').value;
    const subMode = document.getElementById('tournament-submode').value;
    const entryFee = Number(document.getElementById('tournament-entry').value) || 0;
    const prizePool = Number(document.getElementById('tournament-prize').value) || 0;
    const perKill = Number(document.getElementById('tournament-perkill').value) || 0;
    const timeInput = document.getElementById('tournament-time').value;

    if (!title) {
        alert('Please enter a tournament title!');
        return;
    }

    const startTime = timeInput ? new Date(timeInput).getTime() : Date.now();

    db.collection('tournaments').add({
        title: title,
        category: category,
        subMode: subMode,
        entryFee: entryFee,
        prizePool: prizePool,
        perKill: perKill,
        startTime: startTime,
        status: 'Upcoming',
        roomId: 'Updating',
        roomPass: 'Updating',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        alert('Tournament Launched Successfully!');
        location.reload();
    })
    .catch((error) => {
        alert('Error launching tournament: ' + error.message);
    });
}

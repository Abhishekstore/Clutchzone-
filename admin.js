// --- FIREBASE INITIALIZATION SAFE CHECK ---
if (typeof firebaseConfig === 'undefined') {
    var firebaseConfig = {
        apiKey: "AIzaSyA1jgyhtyv0fGNicgciT-JjUunyv3zVLJ8",
        authDomain: "ff-tournaments-af47a.firebaseapp.com",
        projectId: "ff-tournaments-af47a",
        storageBucket: "ff-tournaments-af47a.appspot.com",
        messagingSenderId: "238745686365",
        appId: "1:238745686365:web:03e9d5e1dd450dbe2d8b4"
    };
}

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// --- 1. DYNAMIC SUB-MODE LOGIC ---
function updateSubMode() {
    runSubModeLogic();
}
function updateSubModes() {
    runSubModeLogic();
}

function runSubModeLogic() {
    const categoryElement = document.getElementById('tournament-category');
    const subModeSelect = document.getElementById('tournament-submode');

    if (!categoryElement || !subModeSelect) return;

    const category = categoryElement.value;
    subModeSelect.innerHTML = '';

    if (category === 'Full Map') {
        subModeSelect.innerHTML = '<option value="Solo (48 Players)">Solo (48 Players)</option><option value="Duo (24 Teams)">Duo (24 Teams)</option><option value="Squad (12 Teams)">Squad (12 Teams)</option>';
    } else if (category === 'Survival') {
        subModeSelect.innerHTML = '<option value="Solo (48 Players)">Solo (48 Players)</option><option value="Duo (24 Teams)">Duo (24 Teams)</option>';
    } else if (category === 'CS') {
        subModeSelect.innerHTML = '<option value="1vs1">1vs1</option><option value="2vs2">2vs2</option><option value="4vs4">4vs4</option>';
    } else if (category === 'Lone Wolf') {
        subModeSelect.innerHTML = '<option value="1vs1">1vs1</option>';
    }
}

// --- 2. SECTION SWITCHING ---
function switchSection(sectionId, btn) {
    document.querySelectorAll('.admin-section').forEach(sec => {
        sec.style.display = 'none';
    });
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.style.display = 'block';
    }
    document.querySelectorAll('.nav-btn').forEach(b => {
        b.classList.remove('active');
    });
    if (btn) {
        btn.classList.add('active');
    }
}

// --- 3. CREATE TOURNAMENT FUNCTION ---
function createTournament() {
    try {
        const hostCodeField = document.getElementById('hostCode') || document.getElementById('host-code');
        const titleField = document.getElementById('title') || document.getElementById('tournament-title');
        const categoryField = document.getElementById('tournament-category');
        const subModeField = document.getElementById('tournament-submode');
        const entryField = document.getElementById('entry') || document.getElementById('tournament-entry');
        const prizeField = document.getElementById('prize') || document.getElementById('tournament-prize');
        const killField = document.getElementById('kill') || document.getElementById('tournament-kill');
        const timeField = document.getElementById('startTime') || document.getElementById('tournament-time');

        const hostCode = hostCodeField ? hostCodeField.value.trim() : '';
        const title = titleField ? titleField.value.trim() : '';
        const category = categoryField ? categoryField.value : 'Full Map';
        const subMode = subModeField ? subModeField.value : '';
        const entryFee = entryField ? Number(entryField.value) : 0;
        const prizePool = prizeField ? Number(prizeField.value) : 0;
        const perKill = killField ? Number(killField.value) : 0;
        const startTime = timeField ? timeField.value : 'TBD';

        if (!hostCode || !title) {
            alert("Please enter Host Code and Title!");
            return;
        }

        db.collection('tournaments').add({
            hostCode: hostCode,
            title: title,
            category: category,
            subMode: subMode,
            entryFee: entryFee,
            prizePool: prizePool,
            perKill: perKill,
            startTime: startTime,
            status: 'Upcoming',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then(() => {
            alert("🚀 Tournament Launched Successfully!");
        })
        .catch((error) => {
            alert("Firebase Error: " + error.message);
        });

    } catch (err) {
        alert("JS Error: " + err.message);
    }
}

// --- 4. ACTIVATE / EXTEND HOST PLAN ---
function saveHostPlan() {
    const hostCodeField = document.getElementById('manage-host-code') || document.getElementById('hostCode');
    const planTypeField = document.getElementById('manage-plan-type') || document.getElementById('select-plan');

    const hostCode = hostCodeField ? hostCodeField.value.trim() : '';
    const planType = planTypeField ? planTypeField.value : '₹250 - 1 Month Plan';

    if (!hostCode) {
        alert("Please enter Host Code!");
        return;
    }

    let days = 30;
    if (planType.includes("3 Months") || planType.includes("650")) {
        days = 90;
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);

    db.collection('hosts').doc(hostCode).set({
        hostCode: hostCode,
        plan: planType,
        active: true,
        expiresAt: expiryDate
    }, { merge: true }).then(() => {
        alert("✅ Host Plan Activated Successfully for code: " + hostCode);
    }).catch((error) => {
        alert("Error: " + error.message);
    });
}

// --- 5. UPDATE ROOM CREDENTIALS ---
function updateRoomCredentials() {
    const matchIdInput = document.querySelector('#room-section input') || document.querySelector('input[placeholder*="Match ID"]');
    const matchId = matchIdInput ? matchIdInput.value.trim() : '';

    if (!matchId) {
        alert("Please enter Match ID!");
        return;
    }

    db.collection('tournaments').doc(matchId).set({
        roomIdUpdated: true,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true }).then(() => {
        alert("🔑 Room Credentials Updated Successfully in Database!");
    }).catch((err) => {
        alert("Error updating room: " + err.message);
    });
}

// --- 6. SUBMIT RESULT ---
function submitResult() {
    const inputs = document.querySelectorAll('input');
    let matchId = '', uid = '', kills = 0, earnings = 0;

    // Inputs ko automatically detect karna
    inputs.forEach(input => {
        const placeholder = (input.placeholder || '').toLowerCase();
        if (placeholder.includes('match')) matchId = input.value.trim();
        if (placeholder.includes('uid') || placeholder.includes('player')) uid = input.value.trim();
        if (placeholder.includes('kill')) kills = Number(input.value) || 0;
        if (placeholder.includes('earning') || placeholder.includes('prize')) earnings = Number(input.value) || 0;
    });

    if (!matchId || !uid) {
        alert("Please enter Match ID and Player UID!");
        return;
    }

    db.collection('results').add({
        matchId: matchId,
        playerUid: uid,
        kills: kills,
        earnings: earnings,
        submittedAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        alert("✅ Result Submitted & Saved Successfully!");
    }).catch((err) => {
        alert("Error submitting result: " + err.message);
    });
}

// --- 7. MARK MATCH COMPLETE ---
function markMatchComplete() {
    const matchIdInput = document.querySelector('input[placeholder*="Match ID"]');
    const matchId = matchIdInput ? matchIdInput.value.trim() : '';

    if (!matchId) {
        alert("Please enter Match ID!");
        return;
    }

    db.collection('tournaments').doc(matchId).set({
        status: 'Completed',
        completedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true }).then(() => {
        alert("🏁 Match Marked Complete Successfully!");
    }).catch((err) => {
        alert("Error: " + err.message);
    });
}

// --- EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
    updateSubMode();
});

document.addEventListener('change', function(e) {
    if (e.target && e.target.id === 'tournament-category') {
        updateSubMode();
    }
});

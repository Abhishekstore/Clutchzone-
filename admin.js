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
    let options = category === 'Full Map' || category === 'Survival' ? ['Solo (Max 48)', 'Duo (Max 48)', 'Squad 12 Teams (Max 48)'] : category === 'Clash Squad' ? ['1 vs 1', '2 vs 2', '3 vs 3', '4 vs 4', '6 vs 6'] : ['1 vs 1', '2 vs 2'];
    options.forEach(opt => { let el = document.createElement('option'); el.value = opt; el.textContent = opt; subModeSelect.appendChild(el); });
}
window.onload = updateSubModes;

function createTournament() {
    const hostCode = document.getElementById('host-code').value.trim();
    if (!hostCode) { alert("Enter Host Code!"); return; }
    db.collection('tournaments').add({
        hostCode,
        title: document.getElementById('tournament-title').value,
        category: document.getElementById('tournament-category').value,
        subMode: document.getElementById('tournament-submode').value,
        entryFee: Number(document.getElementById('tournament-entry').value),
        prizePool: Number(document.getElementById('tournament-prize').value),
        perKill: Number(document.getElementById('tournament-perkill').value),
        startTime: new Date(document.getElementById('tournament-time').value).getTime(),
        status: 'Upcoming',
        joinedCount: 0
    }).then(() => { alert('Tournament Created!'); location.reload(); });
}

function updateRoomCredentials() {
    const matchId = document.getElementById('room-match-id').value.trim();
    db.collection('tournaments').doc(matchId).update({
        roomId: document.getElementById('room-id-val').value.trim(),
        roomPass: document.getElementById('room-pass-val').value.trim()
    }).then(() => alert("Room Updated!"));
}

function submitResult() {
    const matchId = document.getElementById('res-match-id').value.trim();
    db.collection('results').add({
        matchId: matchId,
        ffuid: document.getElementById('res-player-uid').value.trim(),
        kills: Number(document.getElementById('res-kills').value) || 0,
        prize: Number(document.getElementById('res-prize').value) || 0,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => alert("Result Added!"));
}

function markMatchComplete() {
    db.collection('tournaments').doc(document.getElementById('res-match-id').value.trim()).update({ status: 'Results' }).then(() => alert("Match Finished!"));
}

function saveHostPlan() {
    const hostCode = document.getElementById('manage-host-code').value.trim();
    const planType = document.getElementById('manage-plan-type').value;
    if (!hostCode) { alert("Please enter Host Code!"); return; }

    let days = planType === '250' ? 30 : 90;
    let planName = planType === '250' ? '₹250 - 1 Month' : '₹650 - 3 Months';
    let expiryDate = new Date().getTime() + (days * 24 * 60 * 60 * 1000);

    db.collection('hosts').doc(hostCode).set({
        hostCode: hostCode,
        planName: planName,
        expiryDate: expiryDate,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true })
    .then(() => alert(`Host plan activated successfully for ${days} days!`))
    .catch(err => alert("Error: " + err.message));
}

function loadWeeklyPayout() {
    const hostCode = document.getElementById('filter-host-code').value.trim();
    const output = document.getElementById('financial-output');
    db.collection('tournaments').where('hostCode', '==', hostCode).get().then(snapshot => {
        let totalNetProfit = 0;
        let html = `<div style="background:#1e293b; padding:12px; border-radius:6px;"><strong>Stats for ${hostCode}:</strong><ul>`;
        snapshot.forEach(doc => {
            const data = doc.data();
            const profit = ( (data.joinedCount || 0) * (data.entryFee || 0) ) - (data.prizePool || 0);
            if (profit > 0) totalNetProfit += profit;
            html += `<li>${data.title} | Players: ${data.joinedCount || 0} | Profit: ₹${profit > 0 ? profit : 0}</li>`;
        });
        const hostShare = totalNetProfit * 0.5;
        html += `</ul><hr><p>Host 50% Share: <strong>₹${hostShare}</strong></p><p>Owner 50% Share: <strong>₹${hostShare}</strong></p></div>`;
        output.innerHTML = html;
    });
}
// --- Registered Users load karne ka naya code ---
function loadRegisteredUsers() {
  const userListDiv = document.getElementById('userList');
  if (!userListDiv) return;

  db.collection("users").get().then((querySnapshot) => {
    let html = "<table border='1' style='width:100%; color:white; text-align:left; border-collapse: collapse; margin-top: 10px;'>";
    html += "<tr style='background: #222;'><th style='padding:8px;'>Naam (Name)</th><th style='padding:8px;'>Free Fire UID</th><th style='padding:8px;'>Phone Number</th></tr>";
    
    let count = 0;
    querySnapshot.forEach((doc) => {
      let user = doc.data();
      count++;
      html += `<tr><td style='padding:8px;'>${user.name || 'N/A'}</td><td style='padding:8px;'>${user.ffUid || 'N/A'}</td><td style='padding:8px;'>${user.phone || 'N/A'}</td></tr>`;
    });
    
    html += "</table>";
    
    if (count === 0) {
      userListDiv.innerHTML = "<p>Abhi koi user register nahi hua hai.</p>";
    } else {
      userListDiv.innerHTML = html;
    }
  }).catch((error) => {
    userListDiv.innerHTML = "Error loading users: " + error.message;
  });
}

// Page load hote hi list automatically show ho jayegi
document.addEventListener("DOMContentLoaded", loadRegisteredUsers);

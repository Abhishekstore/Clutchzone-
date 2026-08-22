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
    const matchIdInput = document.getElementById('res-match-id');
    const ffuidInput = document.getElementById('res-player-uid');
    const amountInput = document.getElementById('res-prize');

    if (!matchIdInput || !ffuidInput) return;

    const matchId = matchIdInput.value.trim();
    const ffuid = ffuidInput.value.trim();
    const amount = amountInput ? Number(amountInput.value) || 0 : 0;

    if (!matchId || !ffuid) {
        alert("Kripya Match ID aur Player FF UID bharein!");
        return;
    }

    db.collection('users').where('ffuid', '==', ffuid).get().then(snapshot => {
        if (snapshot.empty) {
            alert("Is Free Fire UID (" + ffuid + ") ka koi user register nahi mila!");
            return;
        }

        let userDoc = snapshot.docs[0];
        let userPhone = userDoc.id;
        let currentWallet = userDoc.data().wallet || 0;
        let newWallet = currentWallet + amount;

        db.collection('users').doc(userPhone).update({
            wallet: newWallet
        }).then(() => {
            return db.collection('tournaments').doc(matchId).update({
                status: 'Results',
                winnerFfuid: ffuid
            });
        }).then(() => {
            alert(`Success! ₹${amount} winner ke wallet mein successfully add kar diye gaye hain.`);
            matchIdInput.value = '';
            ffuidInput.value = '';
            if(amountInput) amountInput.value = '';
        }).catch(err => {
            alert("Error: " + err.message);
        });
    }).catch(err => {
        alert("Error finding user: " + err.message);
    });
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
// --- DEPOSITS & WITHDRAWALS MANAGEMENT LOGIC ---
function loadAdminData() {
    loadPendingDeposits();
    loadDepositHistory();
    loadPendingWithdrawals();
    loadWithdrawalHistory();
}

// --- DEPOSITS LOGIC ---
function loadPendingDeposits() {
    const container = document.getElementById('pending-deposits-list');
    const list = JSON.parse(localStorage.getItem('esports_pending_deposits')) || [];

    if (list.length === 0) {
        container.innerHTML = '<p style="color: #aaa; font-size: 13px;">No pending deposits.</p>';
        return;
    }

    let html = '';
    list.forEach((item, index) => {
        html += `
            <div style="background: #1e293b; padding: 12px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid #f97316;">
                <p><b>Amount:</b> 🪙 ${item.amount} Coins</p>
                <p><b>UTR / Txn ID:</b> <span style="color: #38bdf8; user-select: all;">${item.utr}</span></p>
                <p style="font-size: 11px; color: #aaa;">Date: ${item.date}</p>
                <div style="margin-top: 8px; display: flex; gap: 10px;">
                    <button class="btn-submit" style="background: #2ecc71; padding: 6px 12px;" onclick="processDeposit(${index}, 'Approved', ${item.amount}, '${item.utr}')">Approve</button>
                    <button class="btn-submit" style="background: #e74c3c; padding: 6px 12px;" onclick="processDeposit(${index}, 'Rejected', ${item.amount}, '${item.utr}')">Reject</button>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function processDeposit(index, status, amount, utr) {
    let pending = JSON.parse(localStorage.getItem('esports_pending_deposits')) || [];
    let history = JSON.parse(localStorage.getItem('esports_deposit_history')) || [];

    pending.splice(index, 1);
    localStorage.setItem('esports_pending_deposits', JSON.stringify(pending));

    history.unshift({ amount, utr, date: new Date().toLocaleString(), status });
    localStorage.setItem('esports_deposit_history', JSON.stringify(history));

    if (status === 'Approved') {
        let currentTotal = parseInt(localStorage.getItem('esports_total')) || 0;
        let currentDeposited = parseInt(localStorage.getItem('esports_deposited')) || 0;
        localStorage.setItem('esports_total', currentTotal + parseInt(amount));
        localStorage.setItem('esports_deposited', currentDeposited + parseInt(amount));
        alert(`Deposit of ${amount} coins Approved successfully!`);
    } else {
        alert(`Deposit Rejected.`);
    }
    loadAdminData();
}

function loadDepositHistory() {
    const container = document.getElementById('deposit-history-list');
    const history = JSON.parse(localStorage.getItem('esports_deposit_history')) || [];

    if (history.length === 0) {
        container.innerHTML = '<p style="color: #aaa; font-size: 13px;">No history available.</p>';
        return;
    }

    let html = '';
    history.forEach(item => {
        const color = item.status === 'Approved' ? '#2ecc71' : '#e74c3c';
        html += `
            <div style="background: #1e293b; padding: 10px; border-radius: 6px; margin-bottom: 8px; font-size: 13px;">
                <span style="color: ${color}; font-weight: bold;">[${item.status}]</span> 
                🪙 ${item.amount} Coins | UTR: ${item.utr} 
                <div style="font-size: 10px; color: #aaa;">${item.date}</div>
            </div>
        `;
    });
    container.innerHTML = html;
}

// --- WITHDRAWALS LOGIC ---
function loadPendingWithdrawals() {
    const container = document.getElementById('pending-withdrawals-list');
    const list = JSON.parse(localStorage.getItem('esports_pending_withdrawals')) || [];

    if (list.length === 0) {
        container.innerHTML = '<p style="color: #aaa; font-size: 13px;">No pending withdrawals.</p>';
        return;
    }

    let html = '';
    list.forEach((item, index) => {
        html += `
            <div style="background: #1e293b; padding: 12px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid #38bdf8;">
                <p><b>Amount:</b> 🪙 ${item.amount} Coins</p>
                <p><b>UPI ID:</b> <span style="color: #ffa502; user-select: all;">${item.upiId}</span></p>
                <p style="font-size: 11px; color: #aaa;">Date: ${item.date}</p>
                <div style="margin-top: 8px; display: flex; gap: 10px;">
                    <button class="btn-submit" style="background: #2ecc71; padding: 6px 12px;" onclick="processWithdrawal(${index}, 'Approved', ${item.amount}, '${item.upiId}')">Pay & Approve</button>
                    <button class="btn-submit" style="background: #e74c3c; padding: 6px 12px;" onclick="processWithdrawal(${index}, 'Rejected', ${item.amount}, '${item.upiId}')">Reject & Refund</button>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function processWithdrawal(index, status, amount, upiId) {
    let pending = JSON.parse(localStorage.getItem('esports_pending_withdrawals')) || [];
    let history = JSON.parse(localStorage.getItem('esports_withdrawal_history')) || [];

    pending.splice(index, 1);
    localStorage.setItem('esports_pending_withdrawals', JSON.stringify(pending));

    history.unshift({ upiId, amount, date: new Date().toLocaleString(), status });
    localStorage.setItem('esports_withdrawal_history', JSON.stringify(history));

    if (status === 'Rejected') {
        let currentTotal = parseInt(localStorage.getItem('esports_total')) || 0;
        let currentWinning = parseInt(localStorage.getItem('esports_winning')) || 0;
        localStorage.setItem('esports_total', currentTotal + parseInt(amount));
        localStorage.setItem('esports_winning', currentWinning + parseInt(amount));
        alert(`Withdrawal rejected and coins refunded to user.`);
    } else {
        alert(`Withdrawal Approved! Please pay manually to UPI: ${upiId}`);
    }
    loadAdminData();
}

function loadWithdrawalHistory() {
    const container = document.getElementById('withdrawal-history-list');
    const history = JSON.parse(localStorage.getItem('esports_withdrawal_history')) || [];

    if (history.length === 0) {
        container.innerHTML = '<p style="color: #aaa; font-size: 13px;">No history available.</p>';
        return;
    }

    let html = '';
    history.forEach(item => {
        const color = item.status === 'Approved' ? '#2ecc71' : '#e74c3c';
        html += `
            <div style="background: #1e293b; padding: 10px; border-radius: 6px; margin-bottom: 8px; font-size: 13px;">
                <span style="color: ${color}; font-weight: bold;">[${item.status}]</span> 
                🪙 ${item.amount} Coins -> UPI: ${item.upiId} 
                <div style="font-size: 10px; color: #aaa;">${item.date}</div>
            </div>
        `;
    });
    container.innerHTML = html;
}
document.addEventListener('DOMContentLoaded', () => {
    loadRegisteredUsers();
    loadAdminData();
});
function switchSection(sectionId, btn) {
    // Sabhi sections ko hide karo
    document.querySelectorAll('.admin-section').forEach(sec => {
        sec.style.display = 'none';
    });
    
    // Sirf target section ko dikhao
    const target = document.getElementById(sectionId);
    if (target) {
        target.style.display = 'block';
    }
    
    // Buttons ki active class manage karo
    document.querySelectorAll('.nav-btn').forEach(b => {
        b.classList.remove('active');
    });
    if (btn) {
        btn.classList.add('active');
    }
}
function updateSubMode() {
    const category = document.getElementById('tournament-category').value;
    const subModeSelect = document.getElementById('tournament-submode');
    
    subModeSelect.innerHTML = '';
    
    if (category === 'Full Map' || category === 'Survival') {
        subModeSelect.innerHTML = `
            <option value="Solo (48 Players)">Solo (48 Players)</option>
            <option value="Duo (24 Duos)">Duo (24 Duos)</option>
            <option value="Squad (12 Squads)">Squad (12 Squads)</option>
        `;
    } else if (category === 'CS') {
        subModeSelect.innerHTML = `
            <option value="CS Squad">CS Squad</option>
        `;
    } else if (category === 'Lone Wolf') {
        subModeSelect.innerHTML = `
            <option value="Lone Wolf 1v1">Lone Wolf 1v1</option>
            <option value="Lone Wolf 2v2">Lone Wolf 2v2</option>
        `;
    } else {
        subModeSelect.innerHTML = `
            <option value="Custom">Custom</option>
        `;
    }
}

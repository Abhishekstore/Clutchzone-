// Firebase aur Baaki Core Functions
function submitResult() {
    const matchIdInput = document.getElementById('res-match-id');
    const ffuidInput = document.getElementById('res-player-ffuid');
    const amountInput = document.getElementById('res-kill-amount');

    if (!matchIdInput || !ffuidInput) return;

    db.collection('tournaments').doc(matchIdInput.value.trim()).update({
        status: 'Results'
    }).then(() => {
        alert('Result updated successfully!');
        if (matchIdInput) matchIdInput.value = '';
        if (ffuidInput) ffuidInput.value = '';
        if (amountInput) amountInput.value = '';
    }).catch(err => {
        alert("Error: " + err.message);
    });
}

function markMatchComplete() {
    const matchId = document.getElementById('res-match-id').value.trim();
    if (!matchId) return alert('Please enter Match ID');
    db.collection('tournaments').doc(matchId).update({ status: 'Completed' })
        .then(() => alert('Match marked as Completed!'))
        .catch(err => alert("Error: " + err.message));
}

function saveHostPlan() {
    const hostCode = document.getElementById('manage-host-code').value.trim();
    const planType = document.getElementById('manage-plan-type').value;
    if (!hostCode) return alert("Please enter Host Code!");

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
    if (!hostCode || !output) return;

    db.collection('tournaments').where('hostCode', '==', hostCode).get().then(snapshot => {
        let totalNetProfit = 0;
        let html = `<div style="background:#1e293b; padding:12px; border-radius:6px;"><strong>Stats for ${hostCode}:</strong><ul>`;
        
        snapshot.forEach(doc => {
            const data = doc.data();
            const profit = ((data.joinedCount || 0) * (data.entryFee || 0)) - (data.prizePool || 0);
            if (profit > 0) totalNetProfit += profit;
            html += `<li>${data.title}: Players: ${data.joinedCount || 0} | Profit: ₹${profit > 0 ? profit : 0}</li>`;
        });

        const hostShare = totalNetProfit * 0.5;
        html += `</ul><hr><p>Host 50% Share: <strong>₹${hostShare}</strong></p><p>Owner 50% Share: <strong>₹${hostShare}</strong></p></div>`;
        output.innerHTML = html;
    });
}

// Registered Users Load
function loadRegisteredUsers() {
    const userListDiv = document.getElementById('userList');
    if (!userListDiv) return;

    db.collection('users').get().then((querySnapshot) => {
        let html = "<table border='1' style='width:100%; color:white; text-align:left; border-collapse: collapse; margin-top:10px;'>";
        html += "<tr style='background: #222;'><th style='padding:8px;'>Naam (Name)</th><th style='padding:8px;'>Free Fire UID</th></tr>";
        
        let count = 0;
        querySnapshot.forEach((doc) => {
            let user = doc.data();
            count++;
            html += `<tr><td style='padding:8px;'>${user.name || 'N/A'}</td><td style='padding:8px;'>${user.ffUid || 'N/A'}</td></tr>`;
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

// Deposits & Withdrawals Management
function loadAdminData() {
    if (typeof loadPendingDeposits === 'function') loadPendingDeposits();
    if (typeof loadDepositHistory === 'function') loadDepositHistory();
    if (typeof loadPendingWithdrawals === 'function') loadPendingWithdrawals();
    if (typeof loadWithdrawalHistory === 'function') loadWithdrawalHistory();
}

function loadPendingDeposits() {
    const container = document.getElementById('pending-deposits-list');
    if (!container) return;
    const list = JSON.parse(localStorage.getItem('esports_pending_deposits')) || [];

    if (list.length === 0) {
        container.innerHTML = '<p style="color: #aaa; font-size: 13px;">No pending deposits.</p>';
        return;
    }

    let html = '';
    list.forEach((item, index) => {
        html += `
            <div style="background: #1e293b; padding: 12px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid #f59e0b;">
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
        alert('Deposit Rejected.');
    }
    loadAdminData();
}

function loadDepositHistory() {
    const container = document.getElementById('deposit-history-list');
    if (!container) return;
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

function loadPendingWithdrawals() {
    const container = document.getElementById('pending-withdrawals-list');
    if (!container) return;
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
                <p><b>UPI ID:</b> <span style="color: #ffa500; user-select: all;">${item.upiId}</span></p>
                <p style="font-size: 11px; color: #aaa;">Date: ${item.date}</p>
                <div style="margin-top: 8px; display: flex; gap: 10px;">
                    <button class="btn-submit" style="background: #2ecc71; padding: 6px 12px;" onclick="processWithdrawal(${index}, 'Approved', ${item.amount}, '${item.upiId}')">Approve & Pay</button>
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
        alert('Withdrawal rejected and coins refunded to user.');
    } else {
        alert(`Withdrawal Approved! Please pay manually to UPI: ${upiId}`);
    }
    loadAdminData();
}

function loadWithdrawalHistory() {
    const container = document.getElementById('withdrawal-history-list');
    if (!container) return;
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
    if (typeof loadRegisteredUsers === 'function') loadRegisteredUsers();
    if (typeof loadAdminData === 'function') loadAdminData();
});

// Section Switching Logic
function switchSection(sectionId, btn) {
    document.querySelectorAll('.admin-section').forEach(sec => {
        sec.style.display = 'none';
    });

    const target = document.getElementById(sectionId);
    if (target) {
        target.style.display = 'block';
    }

    document.querySelectorAll('.nav-btn').forEach(b => {
        b.classList.remove('active');
    });
    if (btn) {
        btn.classList.add('active');
    }
}

// Dynamic Sub-Mode Category Logic
function updateSubMode() {
    const categoryElement = document.getElementById('tournament-category');
    const subModeSelect = document.getElementById('tournament-submode');
    
    if (!categoryElement || !subModeSelect) return;
    
    const category = categoryElement.value;
    subModeSelect.innerHTML = '';
    
    if (category === 'Full Map') {
        subModeSelect.innerHTML = `
            <option value="Solo (48 Players)">Solo (48 Players)</option>
            <option value="Duo (24 Duos)">Duo (24 Duos)</option>
            <option value="Squad (12 Squads)">Squad (12 Squads)</option>
        `;
    } else if (category === 'Survival') {
        subModeSelect.innerHTML = `
            <option value="Solo (48 Players)">Solo (48 Players)</option>
        `;
    } else if (category === 'CS') {
        subModeSelect.innerHTML = `
            <option value="1vs1">1vs1</option>
            <option value="2vs2">2vs2</option>
            <option value="4vs4">4vs4</option>
            <option value="6vs6">6vs6</option>
        `;
    } else if (category === 'Lone Wolf') {
        subModeSelect.innerHTML = `
            <option value="1vs1">1vs1</option>
            <option value="2vs2">2vs2</option>
        `;
    }
}

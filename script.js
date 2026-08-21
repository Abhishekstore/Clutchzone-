// --- ⚙️ APNA ASLI FIREBASE CONFIG YAHAN DALO (SIRF EK BAAR) ---
const firebaseConfig = {
    apiKey: "AIzaSyA1jgyhtyv0fGNicgciT-JjUunyv3zVLJ8",
    authDomain: "ff-tournaments-af47a.firebaseapp.com",
    projectId: "ff-tournaments-af47a",
    storageBucket: "ff-tournaments-af47a.firebasestorage.app",
    messagingSenderId: "238745686365",
    appId: "1:238745686365:web:83e96d5e1dd450dbe2d8b4"
};
// -------------------------------------------------------------

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth(); 
const db = firebase.firestore();

let authMode = 'login'; 

function switchAuthMode(mode) {
    authMode = mode;
    const btn = document.getElementById('auth-action-btn');
    if(mode === 'login') {
        document.getElementById('tab-login-btn').classList.add('active');
        document.getElementById('tab-signup-btn').classList.remove('active');
        btn.innerText = "Login to Account";
    } else {
        document.getElementById('tab-signup-btn').classList.add('active');
        document.getElementById('tab-login-btn').classList.remove('active');
        btn.innerText = "Create New Account";
    }
}

function handleAuth() {
    const e = document.getElementById('email').value.trim();
    const p = document.getElementById('password').value.trim();
    if(!e || !p) { alert("Please enter email and password!"); return; }

    if(authMode === 'login') {
        auth.signInWithEmailAndPassword(e, p).catch(err => alert("Login Error: " + err.message));
    } else {
        auth.createUserWithEmailAndPassword(e, p).then(res => {
            db.collection('users').doc(res.user.uid).set({ balance: 0, kills: 0, totalWinnings: 0, role: 'player' });
            alert("Account created successfully!");
        }).catch(err => alert("Signup Error: " + err.message));
    }
}

function logoutUser() {
    auth.signOut().then(() => {
        location.reload();
    });
}

let currentTab = 'upcoming';
function switchTab(status, btn) {
    currentTab = status;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    loadMatches();
}

function loadMatches() {
    db.collection('matches').where('status', '==', currentTab).onSnapshot(s => {
        let html = '';
        s.forEach(doc => {
            const m = doc.data();
            html += `
                <div class="glass t-card">
                    <span class="status-badge badge-${currentTab}">${currentTab}</span>
                    <h4 style="margin:0 0 6px 0; font-size:14px; font-weight:600;">${m.title}</h4>
                    <div style="display:flex; justify-content:space-between; font-size:12px; color:#aaa; margin-bottom:12px;">
                        <span>Entry Fee: <b>₹${m.entryFee || 0}</b></span>
                        <span>Room ID: <b>${m.roomID || 'Pending'}</b></span>
                    </div>
                    <button class="btn-primary" style="padding:10px; font-size:12px;" onclick="alert('Room ID: ${m.roomID || 'N/A'} \\nPassword: ${m.roomPass || 'N/A'}')">
                        ${currentTab === 'upcoming' ? 'JOIN MATCH' : 'VIEW DETAILS'}
                    </button>
                </div>`;
        });
        document.getElementById('match-list').innerHTML = html || `<p style="text-align:center; color:#666; font-size:12px; padding:15px;">No ${currentTab} matches available.</p>`;
    });
}

function loadLeaderboard() {
    db.collection('users').orderBy('kills', 'desc').limit(5).onSnapshot(s => {
        let html = ''; let rank = 1;
        s.forEach(doc => {
            const d = doc.data();
            html += `<div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--border); font-size:12px;">
                <span>#${rank++} &nbsp;<b>${d.ign || 'Gamer'}</b></span>
                <span style="color:var(--primary); font-weight:600;">⚔️ ${d.kills || 0} Kills</span>
            </div>`;
        });
        document.getElementById('leaderboard-list').innerHTML = html || '<p style="font-size:12px; color:#666; text-align:center;">No ranking data yet.</p>';
    });
}

function loadWinnersFeed() {
    db.collection('winners').orderBy('timestamp', 'desc').limit(5).onSnapshot(s => {
        let html = '';
        s.forEach(doc => {
            const w = doc.data();
            html += `<div style="background:rgba(255,255,255,0.02); padding:8px 10px; border-radius:8px; margin-bottom:6px; font-size:11px; border-left: 3px solid var(--success);">
                🏆 <b>${w.tournamentTitle}</b> — <span style="color:var(--primary);">${w.ign}</span> won <b style="color:var(--success);">₹${w.prize}</b>
            </div>`;
        });
        document.getElementById('winners-list').innerHTML = html || '<p style="font-size:12px; color:#666; text-align:center;">No recent winners.</p>';
    });
}

function loadHistory(uid) {
    db.collection('transactions').where('uid', '==', uid).orderBy('time', 'desc').limit(5).onSnapshot(s => {
        let html = '';
        s.forEach(doc => {
            const tx = doc.data();
            html += `
                <div class="history-item">
                    <span>${tx.note}</span>
                    <span style="color:${tx.type==='in'?'var(--success)':'#ff4d4d'}; font-weight:600;">${tx.type==='in'?'+':'-'}₹${tx.amt}</span>
                </div>`;
        });
        if(html) document.getElementById('tx-history').innerHTML = html;
    });
}

function processInstantPayout() {
    const ffuid = document.getElementById('p-ffuid').value.trim();
    const prize = parseFloat(document.getElementById('p-prize').value) || 0;
    const kills = parseInt(document.getElementById('p-kills').value) || 0;
    const matchTitle = document.getElementById('match-title').value || "ClutchZone Tournament";

    if(!ffuid) { alert("Enter Player FF UID!"); return; }

    db.collection('users').where('ffUid', '==', ffuid).get().then(qs => {
        if(qs.empty) { alert("User FF UID not found!"); return; }
        qs.forEach(doc => {
            const userId = doc.id;
            const d = doc.data();
            db.collection('users').doc(userId).update({
                balance: (d.balance || 0) + prize,
                totalWinnings: (d.totalWinnings || 0) + prize,
                kills: (d.kills || 0) + kills
            }).then(() => {
                db.collection('transactions').add({ uid: userId, amt: prize, note: `Prize: ${matchTitle} (${kills} Kills)`, type: 'in', time: new Date() });
                if(prize > 0) {
                    db.collection('winners').add({ tournamentTitle: matchTitle, ign: d.ign || 'Gamer', prize: prize, timestamp: firebase.firestore.FieldValue.serverTimestamp() });
                }
                alert("✅ Credited successfully to player's wallet instantly!");
                document.getElementById('p-ffuid').value = '';
                document.getElementById('p-prize').value = '';
                document.getElementById('p-kills').value = '';
            });
        });
    });
}

function requestWithdrawal() {
    const amt = parseInt(document.getElementById('w-amount').value);
    const upi = document.getElementById('w-upi').value.trim();
    const uid = auth.currentUser.uid;

    if(amt < 80) { alert("Minimum withdrawal limit is ₹80!"); return; }
    if(!upi) { alert("Enter your UPI ID!"); return; }

    db.collection('users').doc(uid).get().then(doc => {
        const bal = doc.data().balance || 0;
        if(amt > bal) { alert("Insufficient balance!"); return; }

        db.collection('users').doc(uid).update({ balance: bal - amt });
        db.collection('withdrawals').add({ uid: uid, amount: amt, upi: upi, status: 'pending', time: new Date() });
        db.collection('transactions').add({ uid: uid, amt: amt, note: 'Withdrawal Request', type: 'out', time: new Date() });

        alert("✅ Withdrawal request submitted!");
        document.getElementById('w-amount').value = '';
        document.getElementById('w-upi').value = '';
    });
}

function saveProfile() {
    const ign = document.getElementById('profile-ign').value.trim();
    const ffUid = document.getElementById('profile-uid').value.trim();
    if(!ign || !ffUid) { alert("Fill both IGN and UID!"); return; }
    db.collection('users').doc(auth.currentUser.uid).set({ ign: ign, ffUid: ffUid }, { merge: true }).then(() => alert("✅ Profile Saved!"));
}

function addMoney() {
    window.open(`https://t.me/Abhifftournamenthub`, '_blank');
}

function createTournament() {
    db.collection('matches').add({
        title: document.getElementById('match-title').value,
        status: document.getElementById('match-status').value,
        roomID: document.getElementById('room-id').value,
        roomPass: document.getElementById('room-pass').value,
        entryFee: document.getElementById('entry-fee').value,
        time: new Date()
    }).then(() => alert("✅ Tournament Launched Successfully!"));
}

auth.onAuthStateChanged(user => {
    if (user) {
        document.getElementById('auth-box').classList.add('hidden');
        document.getElementById('main-content').classList.remove('hidden');
        document.getElementById('wallet-pill-container').classList.remove('hidden');
        document.getElementById('logout-btn').classList.remove('hidden');
        loadMatches();
        loadLeaderboard();
        loadWinnersFeed();
        loadHistory(user.uid);
        db.collection('users').doc(user.uid).onSnapshot(doc => {
            if(doc.exists) {
                const d = doc.data();
                document.getElementById('balance').innerText = d.balance || 0;
                document.getElementById('stat-winnings').innerText = '₹' + (d.totalWinnings || 0);
                document.getElementById('stat-kills').innerText = d.kills || 0;
                if(d.ign) document.getElementById('profile-ign').value = d.ign;
                if(d.ffUid) document.getElementById('profile-uid').value = d.ffUid;
                if(d.role === 'organizer') document.getElementById('organizer-panel').classList.remove('hidden');
            }
        });
    } else {
        document.getElementById('auth-box').classList.remove('hidden');
        document.getElementById('main-content').classList.add('hidden');
        document.getElementById('wallet-pill-container').classList.add('hidden');
        document.getElementById('logout-btn').classList.add('hidden');
    }
});

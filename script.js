// Firebase Configuration & Initialization
const firebaseConfig = {
    apiKey: "AIzaSyAljghtyv0FGNiccgcI-JjUunyvZvVLJ8",
    authDomain: "ff-tournaments.firebaseapp.com",
    projectId: "ff-tournaments",
    storageBucket: "ff-tournaments.appspot.com",
    messagingSenderId: "1234567890",
    appId: "1:123d567890:web:abcdef"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let currentCategory = 'Full Map';
let selectedTournamentId = null;
let selectedTournamentFee = 0;

function switchView(viewId) {
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
    const targetView = document.getElementById(viewId);
    if (targetView) targetView.classList.add('active');

    document.querySelectorAll('.bottom-nav .nav-item').forEach(item => item.classList.remove('active'));
    if (viewId === 'home-view') { const el = document.getElementById('nav-home'); if(el) el.classList.add('active'); }
    if (viewId === 'wallet-view') { const el = document.getElementById('nav-wallet'); if(el) el.classList.add('active'); }
    if (viewId === 'profile-view') { const el = document.getElementById('nav-profile'); if(el) el.classList.add('active'); }
    if (viewId === 'offer-view') { const el = document.getElementById('nav-offer'); if(el) el.classList.add('active'); }
    if (viewId === 'ranking-view') { const el = document.getElementById('nav-ranking'); if(el) el.classList.add('active'); }
}

function openCategory(categoryName) {
    currentCategory = categoryName;
    const titleHeader = document.getElementById('category-title-header');
    if(titleHeader) titleHeader.innerText = categoryName.toUpperCase();
    switchView('tournament-list-view');
    loadTournamentsForCategory(categoryName, 'Upcoming');
}

function filterTab(status) {
    loadTournamentsForCategory(currentCategory, status);
}

// Tournament loading with Automated 10-Min Room ID Unlock Logic
function loadTournamentsForCategory(category, status) {
    const container = document.getElementById('tournaments-container');
    if(!container) return;
    container.innerHTML = `<p style="text-align:center; color:#aaa; padding:20px;">Loading matches...</p>`;

    db.collection('tournaments')
        .where('category', '==', category)
        .where('status', '==', status)
        .get()
        .then((snapshot) => {
            container.innerHTML = '';
            if (snapshot.empty) {
                container.innerHTML = `<p style="text-align:center; color:#777; padding:20px;">No tournaments available right now.</p>`;
                return;
            }
            snapshot.forEach((doc) => {
                const match = doc.data();
                const matchId = doc.id;
                
                const now = new Date().getTime();
                const startTime = match.startTime || 0;
                const tenMinutesBefore = startTime - (10 * 60 * 1000); // 10 minutes prior

                let roomSection = '';
                if (startTime > 0) {
                    if (now >= tenMinutesBefore) {
                        // Unlocks Room ID & Password
                        roomSection = `
                            <div style="background: #0f172a; padding: 10px; border-radius: 6px; margin-top: 8px; border: 1px solid #22c55e;">
                                <p style="margin:2px 0; color:#22c55e; font-size:13px;">Room ID: <strong>${match.roomId || 'Updating'}</strong></p>
                                <p style="margin:2px 0; color:#22c55e; font-size:13px;">Password: <strong>${match.roomPass || 'Updating'}</strong></p>
                            </div>`;
                    } else {
                        // Locked state message
                        roomSection = `<p style="color: #fbbf24; font-size: 11px; margin-top:5px;">🔒 Room ID unlocks 10 mins before match.</p>`;
                    }
                }

                container.innerHTML += `
                    <div class="tournament-card">
                        <div class="card-top-rules">
                            <span>⚡ ${match.title || category}</span>
                            <span class="match-id-tag">#${matchId.slice(-5)}</span>
                        </div>
                        <p style="font-size: 12px; color: #94a3b8; margin: 5px 0;">Starts: ${startTime ? new Date(startTime).toLocaleString() : 'Soon'}</p>
                        ${roomSection}
                        <div class="card-details-grid" style="margin-top:10px;">
                            <div><small>ENTRY</small><h4>₹${match.entryFee || 0}</h4></div>
                            <div><small>PRIZE</small><h4>₹${match.prizePool || 3000}</h4></div>
                            <div><small>PER KILL</small><h4>₹${match.perKill || 5}</h4></div>
                        </div>
                        <button class="btn-join" onclick="openJoinModal('${matchId}', '${match.title || category}', ${match.entryFee || 0})">JOIN MATCH</button>
                    </div>
                `;
            });
        });
}

function openJoinModal(matchId, title, entryFee) {
    selectedTournamentId = matchId;
    selectedTournamentFee = entryFee;
    const matchTitle = document.getElementById('modal-match-title');
    const matchEntry = document.getElementById('modal-entry-fee');
    const joinModal = document.getElementById('join-modal');
    if(matchTitle) matchTitle.innerText = title;
    if(matchEntry) matchEntry.innerText = entryFee;
    if(joinModal) joinModal.style.display = 'flex';
}

function closeJoinModal() {
    const joinModal = document.getElementById('join-modal');
    if(joinModal) joinModal.style.display = 'none';
}

function confirmJoinModal() {
    const ffuidEl = document.getElementById('join-ffuid');
    if(!ffuidEl) return;
    const ffuid = ffuidEl.value.trim();
    const user = auth.currentUser;
    if (!user) { alert("Please login first!"); return; }
    if (!ffuid) { alert("Please enter your Free Fire UID!"); return; }

    db.collection('users').doc(user.uid).get().then(doc => {
        const userData = doc.data() || {};
        const wallet = userData.wallet || 0;

        if (wallet < selectedTournamentFee) {
            alert("Insufficient balance! Please add coins.");
            return;
        }

        db.collection('participants').add({
            userId: user.uid,
            email: user.email,
            matchId: selectedTournamentId,
            ffuid: ffuid,
            joinedAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            return db.collection('users').doc(user.uid).update({
                wallet: wallet - selectedTournamentFee
            });
        }).then(() => {
            alert("Successfully Joined Tournament!");
            closeJoinModal();
        }).catch(err => {
            alert("Error: " + err.message);
        });
    });
}

function copyReferralCode() {
    const code = "CLUTCH2026";
    navigator.clipboard.writeText(code);
    alert("Referral Code Copied: " + code);
}

// UPI Add Coins Modal Functions
function openAddCoinsModal() { 
    const modal = document.getElementById('add-coins-modal');
    if(modal) modal.style.display = 'flex'; 
}

function closeAddCoinsModal() { 
    const modal = document.getElementById('add-coins-modal');
    if(modal) modal.style.display = 'none'; 
}

function copyUpiId() {
    navigator.clipboard.writeText("kinggkwrd@okicici");
    alert("UPI ID Copied: kinggkwrd@okicici");
}

// Direct UPI App kholne ke liye (PhonePe, GPay, Paytm etc.)
function initiateUpiPayment() {
    const amountEl = document.getElementById('deposit-amount');
    if(!amountEl) return;
    const amount = amountEl.value;
    const upiId = "kinggkwrd@okicici";
    const name = "TournamentHub";
    
    if(!amount || amount <= 0) {
        alert("Please enter a valid amount!");
        return;
    }

    const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR`;
    window.location.href = upiUrl;
}

// Telegram par screenshot bhejne ke liye
function submitDepositRequest() {
    const amountInput = document.getElementById('deposit-amount');
    if(!amountInput) return;
    const amount = Number(amountInput.value);

    if(!amount || amount <= 0) { 
        alert("Please enter a valid amount!"); 
        return; 
    }

    let bonusText = "";
    if (amount >= 150) {
        bonusText = "%20(Eligible%20for%20₹10%20Bonus!)";
    }

    const telegramUrl = `https://t.me/Abhifftournamenthub?text=Hello%20Admin,%20I%20have%20paid%20₹${amount}%20to%20kinggkwrd@okicici.${bonusText}%20Here%20is%20my%20screenshot!`;
    window.open(telegramUrl, "_blank");
    closeAddCoinsModal();
}

function openWithdrawModal() { 
    openDepositTelegram(); 
}

function openDepositTelegram() { 
    window.open("https://t.me/Abhifftournamenthub", "_blank"); 
}

auth.onAuthStateChanged((user) => {
    if (user) {
        db.collection('users').doc(user.uid).onSnapshot((doc) => {
            if (doc.exists) {
                const data = doc.data();
                const walletBal = data.wallet || 0;
                const hb = document.getElementById('header-balance');
                const mb = document.getElementById('wallet-main-balance');
                const dep = document.getElementById('wallet-deposited');
                if(hb) hb.innerText = '₹' + walletBal;
                if(mb) mb.innerText = '₹' + walletBal;
                if(dep) dep.innerText = '₹' + walletBal;
                
                const ignField = document.getElementById('user-display-name');
                if(ignField && data.ign) ignField.innerText = data.ign;
            }
        });
    }
});

const saveProfileBtn = document.getElementById('save-profile-btn');
if (saveProfileBtn) {
    saveProfileBtn.addEventListener('click', () => {
        const ignEl = document.getElementById('ign-input');
        const ffuidEl = document.getElementById('ffuid-input');
        if(!ignEl || !ffuidEl) return;
        const ign = ignEl.value.trim();
        const ffuid = ffuidEl.value.trim();
        const user = auth.currentUser;
        if (!user) { alert("User not logged in!"); return; }

        db.collection('users').doc(user.uid).set({ ign: ign, ffuid: ffuid, email: user.email }, { merge: true })
        .then(() => {
            alert("Profile Saved Successfully!");
        });
    });
}

const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        auth.signOut().then(() => { window.location.href = "index.html"; });
    });
}

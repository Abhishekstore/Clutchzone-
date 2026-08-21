// Firebase Configuration & Initialization
const firebaseConfig = {
    apiKey: "AIzaSyA1jgyhtyv0fGNicgciT-JjUunyv3zVLJ8",
    authDomain: "ff-tournaments-af47a.firebaseapp.com",
    projectId: "ff-tournaments-af47a",
    storageBucket: "ff-tournaments-af47a.appspot.com",
    messagingSenderId: "238745686365",
    appId: "1:238745686365:web:83e06d5e1dd450dbu2dbb4"
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
    if (viewId === 'home-view') { const el = document.getElementById('nav-home'); if (el) el.classList.add('active'); }
    if (viewId === 'wallet-view') { const el = document.getElementById('nav-wallet'); if (el) el.classList.add('active'); }
    if (viewId === 'profile-view') { const el = document.getElementById('nav-profile'); if (el) el.classList.add('active'); }
    if (viewId === 'offer-view') { const el = document.getElementById('nav-offer'); if (el) el.classList.add('active'); }
    if (viewId === 'ranking-view') { const el = document.getElementById('nav-ranking'); if (el) el.classList.add('active'); }
}

function openCategory(categoryName) {
    currentCategory = categoryName;
    const titleheader = document.getElementById('category-title-header');
    if (titleheader) titleheader.innerText = categoryName.toUpperCase();
    switchView('tournament-list-view');
    loadTournamentsForCategory(categoryName, 'Upcoming');
}

function filterTab(status) {
    loadTournamentsForCategory(currentCategory, status);
}

// Tournament loading with Automated Room ID Unlock Logic
function loadTournamentsForCategory(category, status) {
    const container = document.getElementById('tournaments-container');
    if (!container) return;
    container.innerHTML = `<p style="text-align:center;">Loading...</p>`;
    db.collection('tournaments').where('category', '==', category).get().then(snapshot => {
        container.innerHTML = '';
        snapshot.forEach(doc => {
            const match = doc.data();
            const matchId = doc.id;
            if (match.status === status) {
                const now = new Date().getTime();
                let roomSection = (now >= (match.startTime - 600000) && status !== 'Results') ? `<div style="color:#2ecc71; font-weight:bold; margin-top:10px;">Room ID: ${match.roomId || 'Not Shared Yet'} | Pass: ${match.roomPass || 'N/A'}</div>` : `<div style="color:#e74c3c; margin-top:10px;">Room ID unlocks 10 mins before match</div>`;
                
                container.innerHTML += `
                    <div class="tournament-card" style="background:#1e293b; padding:15px; margin-bottom:10px; border-radius:10px;">
                        <h3>${match.title}</h3>
                        <p>Starts: ${new Date(match.startTime).toLocaleString()}</p>
                        <p>Entry Fee: ₹${match.entryFee} | Prize: ₹${match.prize}</p>
                        ${roomSection}
                        <button onclick="openJoinModal('${matchId}', '${match.title}', ${match.entryFee})" style="width:100%; padding:10px; background:#0ffa502; color:#000; border:none; border-radius:5px; margin-top:10px; font-weight:bold;">Join Tournament</button>
                    </div>`;
            }
        });
    });
}

function openJoinModal(matchId, title, entryFee) {
    selectedTournamentId = matchId;
    selectedTournamentFee = entryFee;
    const matchTitle = document.getElementById('modal-match-title');
    const matchEntry = document.getElementById('modal-entry-fee');
    const joinModal = document.getElementById('join-modal');
    if (matchTitle) matchTitle.innerText = title;
    if (matchEntry) matchEntry.innerText = entryFee;
    if (joinModal) joinModal.style.display = 'flex';
}

function closeJoinModal() {
    const joinModal = document.getElementById('join-modal');
    if (joinModal) joinModal.style.display = 'none';
}

function confirmJoinModal() {
    const ffuidInput = document.getElementById('join-ffuid');
    if (!ffuidInput) return;
    const ffuid = ffuidInput.value.trim();
    
    if (!ffuid) { 
        alert("Please enter your Free Fire UID!"); 
        return; 
    }

    const userPhone = localStorage.getItem('savedPhone');
    if (!userPhone) { 
        alert("Please login first!"); 
        switchAuthTab('login'); 
        return; 
    }

    db.collection('users').doc(userPhone).get().then(doc => {
        const userData = doc.exists ? doc.data() : {};
        const wallet = userData.wallet || 0;

        if (wallet < selectedTournamentFee) {
            alert("Insufficient balance! Please add coins/money to your wallet.");
            return;
        }

        db.collection('participants').add({
            userPhone: userPhone,
            matchId: selectedTournamentId,
            ffuid: ffuid,
            joinedAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            return db.collection('users').doc(userPhone).update({
                wallet: wallet - selectedTournamentFee
            });
        }).then(() => {
            alert("Successfully Joined Tournament!");
            closeJoinModal();
            loadUserData();
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
    if (modal) modal.style.display = 'flex';
}

function closeAddCoinsModal() {
    const modal = document.getElementById('add-coins-modal');
    if (modal) modal.style.display = 'none';
}

function copyUpId() {
    navigator.clipboard.writeText("kinggkwsd@okicici");
    alert("UPI ID Copied: kinggkwsd@okicici");
}

function initiateUpiPayment() {
    const amountEl = document.getElementById('deposit-amount');
    if (!amountEl) return;
    const amount = amountEl.value;
    const upiId = "kinggkwsd@okicici";
    const name = "TournamentHub";

    if (!amount || amount <= 0) {
        alert("Please enter a valid amount!");
        return;
    }

    const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR`;
    window.location.href = upiUrl;
}

function submitDepositRequest() {
    const amountInput = document.getElementById('deposit-amount');
    if (!amountInput) return;
    const amount = Number(amountInput.value);

    if (!amount || amount <= 0) {
        alert("Please enter a valid amount!");
        return;
    }

    let bonusText = "";
    if (amount >= 150) {
        bonusText = "%20(Eligible%2020%25%20Bonus!)";
    }

    const telegramUrl = `https://t.me/Abhifftournamenthub?text=Hello%20Admin,%20I%20have%20paid%20Rs%20${amount}%20to%20add%20coins${bonusText}`;
    window.open(telegramUrl, "_blank");
    closeAddCoinsModal();
}

function openWithdrawModal() {
    openDepositTelegram();
}

function openDepositTelegram() {
    window.open("https://t.me/Abhifftournamenthub", "_blank");
}

// Save Profile Logic (LocalStorage based)
const saveProfileBtn = document.getElementById('save-profile-btn');
if (saveProfileBtn) {
    saveProfileBtn.addEventListener('click', () => {
        const ignEl = document.getElementById('ign-input');
        const ffuidEl = document.getElementById('ffuid-input');
        if (!ignEl || !ffuidEl) return;
        
        const ign = ignEl.value.trim();
        const ffuid = ffuidEl.value.trim();

        const isLoggedIn = localStorage.getItem('isLoggedIn');
        if (isLoggedIn !== 'true') {
            alert("User not logged in! Pehle Login karein.");
            return;
        }

        const userPhone = localStorage.getItem('savedPhone');
        if (!userPhone) {
            alert("User data missing! Dobara login karein.");
            return;
        }

        db.collection('users').doc(userPhone).set({ 
            ign: ign, 
            ffuid: ffuid, 
            phone: userPhone 
        }, { merge: true })
        .then(() => {
            alert("Profile Saved Successfully!");
            localStorage.setItem('savedFFName', ign);
            localStorage.setItem('savedFFUid', ffuid);
        });
    });
}

// Tab Switching Function for Login/Register
window.switchAuthTab = function(tab) {
    const loginForm = document.getElementById('login-form');
    const regForm = document.getElementById('register-form');
    const loginBtn = document.getElementById('tab-login-btn');
    const regBtn = document.getElementById('tab-reg-btn');

    if (!loginForm || !regForm || !loginBtn || !regBtn) return;

    if (tab === 'login') {
        loginForm.style.display = 'block';
        regForm.style.display = 'none';
        loginBtn.style.background = '#0ffa502';
        loginBtn.style.color = '#000';
        regBtn.style.background = 'transparent';
        regBtn.style.color = '#fff';
    } else {
        loginForm.style.display = 'none';
        regForm.style.display = 'block';
        regBtn.style.background = '#0ffa502';
        regBtn.style.color = '#000';
        loginBtn.style.background = 'transparent';
        loginBtn.style.color = '#fff';
    }
};

// Register Function
window.registerUser = function() {
    const nameEl = document.getElementById('reg-name');
    const phoneEl = document.getElementById('reg-phone');
    const ffuidEl = document.getElementById('reg-ffuid');
    const passwordEl = document.getElementById('reg-password');

    if (!nameEl || !phoneEl || !ffuidEl || !passwordEl) return;

    const name = nameEl.value.trim();
    const phone = phoneEl.value.trim();
    const ffuid = ffuidEl.value.trim();
    const password = passwordEl.value.trim();

    if (!name || !phone || !ffuid || !password) {
        alert("Kripya sabhi details bharein!");
        return;
    }

    localStorage.setItem('savedName', name);
    localStorage.setItem('savedPhone', phone);
    localStorage.setItem('savedPassword', password);
    localStorage.setItem('savedFFUid', ffuid);

    alert("Registration Successful! Ab aap Login kar sakte hain.");
    switchAuthTab('login');
};

// Login Function
window.loginUser = function() {
    const inputIdEl = document.getElementById('login-username');
    const passwordInputEl = document.getElementById('login-password');

    if (!inputIdEl || !passwordInputEl) return;

    const inputId = inputIdEl.value.trim();
    const passwordInput = passwordInputEl.value.trim();

    const savedPhone = localStorage.getItem('savedPhone');
    const savedPassword = localStorage.getItem('savedPassword');
    const savedName = localStorage.getItem('savedName') || 'Gamer';

    if (!inputId || !passwordInput) {
        alert("Kripya Phone/Email aur Password darj karein!");
        return;
    }

    if (inputId === savedPhone && passwordInput === savedPassword) {
        localStorage.setItem('isLoggedIn', 'true');
        const authScreen = document.getElementById('auth-screen');
        if (authScreen) authScreen.style.display = 'none';
        const userDisplayName = document.getElementById('user-display-name');
        if (userDisplayName) userDisplayName.textContent = savedName;
        alert("Login Successful!");
    } else {
        alert("Galat Phone Number ya Password! Pehle Register karein.");
    }
};

function openHosting() {
    const isSubscribed = localStorage.getItem('isSubscribed');
    if (isSubscribed === 'true') {
        window.location.href = "host.html";
    } else {
        const hostingModal = document.getElementById('hosting-modal');
        if (hostingModal) hostingModal.style.display = 'flex';
    }
}

function buyPlan(amount) {
    const upid = "kinggkwsd@okicici";
    const merchantName = "ClutchZone Hosting";
    const upiUrl = `upi://pay?pa=${upid}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR`;
    window.location.href = upiUrl;

    setTimeout(() => {
        let check = confirm("Kya aapne payment successful kar diya hai?");
        if (check) {
            localStorage.setItem('isSubscribed', 'true');
            const hostingModal = document.getElementById('hosting-modal');
            if (hostingModal) hostingModal.style.display = 'none';
            alert("Payment Confirmed! Plan Activated.");
            window.location.href = "host.html";
        }
    }, 2000);
}

function loadUserData() {
    const userPhone = localStorage.getItem('savedPhone');
    if (!userPhone) return;

    db.collection('users').doc(userPhone).get().then(doc => {
        if (doc.exists) {
            const data = doc.data();
            const wallet = data.wallet || 0;

            const hb = document.getElementById('header-balance');
            const wb = document.getElementById('wallet-main-balance');
            if (hb) hb.innerText = '₹' + wallet;
            if (wb) wb.innerText = '₹' + wallet;

            const profileName = document.getElementById('user-display-name');
            if (profileName && data.ign) profileName.innerText = data.ign;
        }
    });
}

window.addEventListener('DOMContentLoaded', () => {
    loadUserData();
});
function openMyMatches() {
    // 1. View switch karke 'my-matches-view' dikhao
    if (typeof switchView === 'function') {
        switchView('my-matches-view');
    }

    const container = document.getElementById('my-matches-container');
    if (!container) return;

    container.innerHTML = "<p style='color:white; text-align:center; padding:20px;'>Loading matches...</p>";

    // User ka phone number jo login ke waqt save hota hai
    let currentUserPhone = localStorage.getItem('userPhone'); 

    if (!currentUserPhone) {
        container.innerHTML = "<p style='color:red; text-align:center;'>Please login first!</p>";
        return;
    }

    db.collection('participants').where('userId', '==', currentUserPhone).get().then(snapshot => {
        if (snapshot.empty) {
            container.innerHTML = "<p style='color:white; text-align:center; padding:20px;'>Aapne abhi tak koi tournament join nahi kiya hai.</p>";
            return;
        }

        let html = "<h3 style='color:#f97316; margin-bottom:15px; text-align:center;'>🎮 My Joined Tournaments</h3>";
        snapshot.forEach(doc => {
            let data = doc.data();
            let timeText = data.timestamp ? new Date(data.timestamp.toDate()).toLocaleString() : 'Recent';
            
            html += `<div style="background:#1e293b; padding:15px; margin-bottom:12px; border-radius:8px; color:white; border: 1px solid #334155;">
                <p style="margin-bottom:5px;"><b>Match ID:</b> <span style="color:#38bdf8;">${data.matchId}</span></p>
                <p style="font-size:12px; color:#94a3b8;">Joined At: ${timeText}</p>
            </div>`;
        });
        container.innerHTML = html;
    }).catch(err => {
        container.innerHTML = "<p style='color:red; text-align:center;'>Error: " + err.message + "</p>";
    });
}

function submitWithdrawal() {
    let upi = document.getElementById('withdraw-upi').value.trim();
    let amount = Number(document.getElementById('withdraw-amount').value);
    let userPhone = localStorage.getItem('userPhone');

    if (!upi || amount < 50) {
        alert("Sahi UPI aur min ₹50 dalein!");
        return;
    }
    // Function: Transactions record karne ke liye
function logTransaction(userPhone, type, amount) {
    db.collection('transactions').add({
        userPhone: userPhone,
        type: type, // e.g., 'Deposit', 'Entry Fee', 'Winnings', 'Withdrawal'
        amount: amount,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
}

// Function: Passbook load karne ke liye
function loadPassbook() {
    const userPhone = localStorage.getItem('userPhone');
    if (!userPhone) return;

    switchView('passbook-view');
    const listDiv = document.getElementById('transaction-list');
    listDiv.innerHTML = "<p style='color:white;'>Loading history...</p>";

    db.collection('transactions').where('userPhone', '==', userPhone).orderBy('timestamp', 'desc').get().then(snapshot => {
        if (snapshot.empty) {
            listDiv.innerHTML = "<p style='color:white; text-align:center;'>Koi record nahi mila.</p>";
            return;
        }

        let html = "";
        snapshot.forEach(doc => {
            let t = doc.data();
            let color = (t.type === 'Deposit' || t.type === 'Winnings') ? '#2ecc71' : '#e74c3c';
            html += `<div style="background:#1e293b; padding:12px; margin-bottom:8px; border-radius:8px; display:flex; justify-content:space-between; color:white;">
                <span>${t.type}</span>
                <span style="color: ${color}; font-weight:bold;">₹${t.amount}</span>
            </div>`;
        });
        listDiv.innerHTML = html;
    });
}

    // Database mein withdrawal request save karo
    db.collection('withdrawals').add({
        userPhone: userPhone,
        upi: upi,
        amount: amount,
        status: 'Pending',
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        alert("Request submit ho gayi! Admin jald hi approve karega.");
        document.getElementById('withdraw-modal').style.display = 'none';
        logTransaction(userPhone, 'Withdrawal', amount); // Transaction history mein dikhega
    });
}
// Modal kholne ke liye
function openAddCoinsModal() {
    const modal = document.getElementById('add-coins-modal');
    if (modal) modal.style.display = 'block';
}

// Modal band karne ke liye
function closeAddCoinsModal() {
    const modal = document.getElementById('add-coins-modal');
    if (modal) modal.style.display = 'none';
}

// Deposit request submit karne ke liye
function submitDepositRequest() {
    let amount = Number(document.getElementById('deposit-amount').value);
    let utr = document.getElementById('deposit-utr').value.trim();
    let userPhone = localStorage.getItem('userPhone');

    if (!amount || amount <= 0 || !utr) {
        alert("Kripya sahi amount aur UTR / Transaction ID dalein!");
        return;
    }

    if (!userPhone) {
        alert("Pehle login karein!");
        return;
    }

    // Firebase ke 'deposit-requests' collection mein save hoga
    db.collection('deposit-requests').add({
        userPhone: userPhone,
        amount: amount,
        utr: utr,
        status: 'Pending',
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        alert("Payment request submit ho gayi! Admin verification ke baad aapke wallet mein paise add kar diye jayenge.");
        closeAddCoinsModal();
        
        // Inputs khali kar dein
        document.getElementById('deposit-amount').value = '';
        document.getElementById('deposit-utr').value = '';
    }).catch(err => {
        alert("Error: " + err.message);
    });
}


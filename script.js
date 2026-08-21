// Firebase Configuration & Initialization
const firebaseConfig = {
    apiKey: "AIzaSyA1jgyhtyv0fGNicgciT-JjUunyv3zVLJ8",
    authDomain: "ff-tournaments-af47a.firebaseapp.com",
    projectId: "ff-tournaments-af47a",
    storageBucket: "ff-tournaments-af47a.appspot.com",
    messagingSenderId: "238745686365",
    appId: "1:238745686365:web:83e96d5e1dd450dbe2d8b4"
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
    container.innerHTML = `<p style="text-align:center;">Loading...</p>`;
    db.collection('tournaments').where('category', '==', category).get().then((snapshot) => {
        container.innerHTML = '';
        snapshot.forEach((doc) => {
            const match = doc.data();
            const matchId = doc.id;
            if (match.status === status) {
                const now = new Date().getTime();
                let roomSection = (now >= (match.startTime - 600000) && status !== 'Results') ? `<div style="color:#22c55e;">Room: ${match.roomId || 'Wait'}/Pass: ${match.roomPass || 'Wait'}</div>` : `<div style="color:#fbbf24;">Room unlocks 10 min before.</div>`;
                
                container.innerHTML += `
                    <div class="tournament-card" style="background:#1e293b; padding:15px; margin-bottom:10px; border-radius:10px;">
                        <h3>${match.title}</h3>
                        <p>Starts: ${new Date(match.startTime).toLocaleString()}</p>
                        ${roomSection}
                        <button onclick="openJoinModal('${matchId}', ${match.entryFee})" style="width:100%; padding:10px; background:#f97316; border:none; border-radius:5px; color:white;">JOIN MATCH</button>
                    </div>`;
            }
        });
    });
}

function openJoinModal(matchId, entryFee) {
    let ffuid = prompt("Enter Free Fire UID:");
    if (!ffuid) return;
    const ref = db.collection('tournaments').doc(matchId);
    ref.get().then(doc => {
        ref.update({ joinedCount: (doc.data().joinedCount || 0) + 1 }).then(() => alert("Joined!"));
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

    // Pehle user ka wallet balance check karein
    db.collection('users').doc(userPhone).get().then(doc => {
        const userData = doc.exists ? doc.data() : {};
        const wallet = userData.wallet || 0;

        // Check karein ki wallet mein paise hain ya nahi
        if (wallet < selectedTournamentFee) {
            alert("Insufficient balance! Please add coins/money to your wallet.");
            return;
        }

        // Tournament join list mein add karein
        db.collection('participants').add({
            userPhone: userPhone,
            matchId: selectedTournamentId,
            ffuid: ffuid,
            joinedAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            // Wallet se entry fee cut karein
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
        if (!ignEl || !ffuidEl) return;

        const ffuid = ffuidEl.value.trim();

        // Check karein ki user localStorage mein logged in hai ya nahi
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        if (isLoggedIn !== 'true') {
            alert("User not logged in! Pehle Login karein.");
            return;
        }

        // User ki saved phone ID ko document ID ki tarah use karenge
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


const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        auth.signOut().then(() => { window.location.href = "index.html"; });
    });
}
// Tab Switching Function for Login/Register
window.switchAuthTab = function(tab) {
    const loginForm = document.getElementById('login-form');
    const regForm = document.getElementById('register-form');
    const loginBtn = document.getElementById('tab-login-btn');
    const regBtn = document.getElementById('tab-reg-btn');

    if (tab === 'login') {
        loginForm.style.display = 'block';
        regForm.style.display = 'none';
        loginBtn.style.background = '#ffa502';
        loginBtn.style.color = '#000';
        regBtn.style.background = 'transparent';
        regBtn.style.color = '#fff';
    } else {
        loginForm.style.display = 'none';
        regForm.style.display = 'block';
        regBtn.style.background = '#ffa502';
        regBtn.style.color = '#000';
        loginBtn.style.background = 'transparent';
        loginBtn.style.color = '#fff';
    }
};

// Register Function
window.registerUser = function() {
    const name = document.getElementById('reg-name').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const ffUid = document.getElementById('reg-ffuid').value.trim();
    const password = document.getElementById('reg-password').value.trim();

    if (!name || !phone || !ffUid || !password) {
        alert("Kripya sabhi details bharein!");
        return;
    }

    localStorage.setItem('savedName', name);
    localStorage.setItem('savedPhone', phone);
    localStorage.setItem('savedPassword', password);
    localStorage.setItem('savedFfUid', ffUid);

    alert("Registration Successful! Ab aap Login kar sakte hain.");
    switchAuthTab('login');
};

// Login Function
window.loginUser = function() {
    const inputId = document.getElementById('login-username').value.trim();
    const passwordInput = document.getElementById('login-password').value.trim();

    const savedPhone = localStorage.getItem('savedPhone');
    const savedPassword = localStorage.getItem('savedPassword');
    const savedName = localStorage.getItem('savedName') || "Gamer";

    if (!inputId || !passwordInput) {
        alert("Kripya Phone/Email aur Password darj karein!");
        return;
    }

    if (inputId === savedPhone && passwordInput === savedPassword) {
        localStorage.setItem('isLoggedIn', 'true');
        document.getElementById('auth-screen').style.display = 'none';
        document.getElementById('user-display-name').textContent = savedName;
        alert("Login Successful!");
    } else {
        alert("Galat Phone Number ya Password! Pehle Register karein.");
    }
};
// Page load hote hi naam update karne ke liye
window.addEventListener('DOMContentLoaded', () => {
    const savedName = localStorage.getItem('savedName');
    if (savedName) {
        document.getElementById('display-username').textContent = savedName;
    }
});
function openHosting() {
    const isSubscribed = localStorage.getItem('isHostingSubscribed');
    
    if (isSubscribed === 'true') {
        window.location.href = "host.html"; 
    } else {
        document.getElementById('hosting-modal').style.display = 'flex';
    }
}

function buyPlan(amount) {
    const upiId = "kinggkwrd@okicici"; 
    const merchantName = "ClutchZone Hosting";
    
    const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR`;
    
    window.location.href = upiUrl;

    setTimeout(() => {
        let check = confirm("Kya aapne payment successful kar diya hai? OK dabate hi aapka hosting plan activate ho jayega.");
        if (check) {
            localStorage.setItem('isHostingSubscribed', 'true');
            document.getElementById('hosting-modal').style.display = 'none';
            alert("Payment Confirmed! Plan Activated.");
            window.location.href = "host.html"; 
        }
    }, 2000);
}

function loadUserData() {
    const userPhone = localStorage.getItem('savedPhone');
    if (!userPhone) return; // Yahan 'fuserPhone' ki jagah '!userPhone' hona chahiye

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

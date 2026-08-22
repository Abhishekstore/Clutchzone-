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
// Page load hote hi check karein ki user logged-in hai ya nahi
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('isLoggedIn') === 'true') {
        const authScreen = document.getElementById('auth-screen');
        if (authScreen) authScreen.style.display = 'none';
    }
});


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
// 1. Register Function (Firebase Database ke sath)
window.registerUser = function() {
    const name = document.getElementById('reg-name').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const ffuid = document.getElementById('reg-ffuid').value.trim();
    const password = document.getElementById('reg-password').value.trim();

    if (!name || !phone || !ffuid || !password) {
        alert("Kripya sabhi details bharein!");
        return;
    }

    // Firestore mein phone number ko Document ID banakar save karein
    db.collection('users').doc(phone).set({
        name: name,
        phone: phone,
        ffuid: ffuid,
        password: password,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        alert("Registration Successful! Ab aap Login kar sakte hain.");
        switchAuthTab('login'); // Login tab par bhej dega
    })
    .catch((error) => {
        alert("Error: " + error.message);
    });
};

// 2. Login Function (Firebase Database se check karega)
window.loginUser = function() {
    const phone = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value.trim();

    if (!phone || !password) {
        alert("Kripya Phone aur Password darj karein!");
        return;
    }

    // Firestore se direct us phone number ka data nikalenge
    db.collection('users').doc(phone).get()
    .then((doc) => {
        if (doc.exists) {
            const userData = doc.data();
            
            // Check karein ki password match ho raha hai ya nahi
                    if (userData.password === password) {
            // Session save kar lenge
            localStorage.setItem('userPhone', phone);
            localStorage.setItem('savedPhone', phone);
            localStorage.setItem('savedName', userData.name || 'Gamer');
            localStorage.setItem('savedFFUID', userData.ffuid || '');
            localStorage.setItem('isLoggedIn', 'true');

            // Auth screen chupayein
            const authScreen = document.getElementById('auth-screen');
            if (authScreen) authScreen.style.display = 'none';

            alert("Login Successful!");
            location.reload();
        } else {
            alert("Galat Password! Kripya dobara koshish karein.");
        }

        } else {
            alert("Yeh Phone Number registered nahi hai! Pehle Register karein.");
        }
    })
    .catch((error) => {
        alert("Error: " + error.message);
    });
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
// User Logout Function
function logoutUser() {
    if (confirm("Kya aap sach mein Logout karna chahte hain?")) {
        // Saara local storage data clear kar dein
        localStorage.removeItem('userPhone');
        localStorage.removeItem('userName');
        localStorage.removeItem('userFFuid');
        localStorage.removeItem('isLoggedIn');
        
        alert("Aap successfully logout ho chuke hain!");
        
        // Page reload karte hi wapas login screen aa jayegi
        location.reload();
    }
}
// 1. Modal kholne aur band karne ke liye functions
function openAddCoinsModal() {
    const modal = document.getElementById('add-coins-modal');
    if (modal) modal.style.display = 'flex';
}

function closeAddCoinsModal() {
    const modal = document.getElementById('add-coins-modal');
    if (modal) modal.style.display = 'none';
}

// 2. UPI App kholne ke liye
function payWithUPI() {
    let amount = document.getElementById('deposit-amount').value;
    if (!amount || amount <= 0) {
        alert("Kripya pehle sahi amount dalein!");
        return;
    }
    let upiID = "kinggkwrd@okicici";
    let upiUrl = 'upi://pay?pa=' + upiID + '&pn=ClutchZone&am=' + amount + '&cu=INR';
    window.location.href = upiUrl;
}

// 3. Live link update karne ke liye
function updateUpiLink() {
    let amount = document.getElementById('deposit-amount').value || "100";
    let upiID = "kinggkwrd@okicici";
    let btn = document.getElementById('upi-link-btn');
    if (btn) {
        btn.href = 'upi://pay?pa=' + upiID + '&pn=ClutchZone&am=' + amount + '&cu=INR';
    }
}

// 4. Amount input par event listener
let depositInput = document.getElementById('deposit-amount');
if (depositInput) {
    depositInput.addEventListener('input', updateUpiLink);
}
let deferredPrompt;
const installBtn = document.getElementById('install-btn');

// Shuru mein button chhupa do
if (installBtn) {
    installBtn.style.display = 'none';
}

// Browser jab allow karega ki app install ho sakti hai
window.addEventListener('beforeinstallprompt', (e) => {
    // Browser ka automatic prompt roko
    e.preventDefault();
    // Prompt ko baad ke liye save karo
    deferredPrompt = e;
    
    // Ab apna button dikhao
    if (installBtn) {
        installBtn.style.display = 'block';
    }
});

// Jab user button par click kare
if (installBtn) {
    installBtn.addEventListener('click', (e) => {
        if (deferredPrompt) {
            // Install prompt dikhao
            deferredPrompt.prompt();
            // User ka choice check karo
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User ne app install kar li');
                }
                deferredPrompt = null;
            });
        }
    });
}

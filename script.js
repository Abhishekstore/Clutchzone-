// Firebase Configuration & Initialization
const firebaseConfig = {
    apiKey: "AIzaSyA1jgyhtyv0fGNicgciT-JjUunyv3zVLJ8",
    authDomain: "ff-tournaments-af47a.firebaseapp.com",
    projectId: "ff-tournaments-af47a",
    storageBucket: "ff-tournaments-af47a.appspot.com",
    messagingSenderId: "238745686365",
    appId: "1:238745686365:web:83e06d5e1dd450dbu2dbb4"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

let currentCategory = 'Full Map';
let selectedTournamentId = null;
let selectedTournamentFee = 0;

// Page Load Initialization
document.addEventListener('DOMContentLoaded', () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const authScreen = document.getElementById('auth-screen');
    const mainApp = document.getElementById('main-app-container');

    if (isLoggedIn) {
        if (authScreen) authScreen.style.display = 'none';
        if (mainApp) mainApp.style.display = 'block';
        loadUserData();
        if (typeof switchView === 'function') {
            switchView('home-view');
        }
    } else {
        if (authScreen) authScreen.style.display = 'flex';
        if (mainApp) mainApp.style.display = 'none';
    }
});

// View Switching Function
window.switchView = function(viewId) {
    document.querySelectorAll('.view-section').forEach(sec => {
        sec.style.display = 'none';
        sec.classList.remove('active');
    });
    const targetView = document.getElementById(viewId);
    if (targetView) {
        targetView.style.display = 'block';
        targetView.classList.add('active');
    }
};

// Category Opening
window.openCategory = function(categoryName) {
    currentCategory = categoryName;
    const titleheader = document.getElementById('category-title-header');
    if (titleheader) titleheader.innerText = categoryName.toUpperCase() + " Tournaments";
    switchView('tournament-list-view');
    loadTournamentsForCategory(categoryName, 'Upcoming');
};

// Tab Filtering
window.filterTab = function(status) {
    loadTournamentsForCategory(currentCategory, status);
};

// Load Tournaments from Firestore
function loadTournamentsForCategory(category, status) {
    const container = document.getElementById('tournaments-container');
    if (!container) return;
    
    container.innerHTML = '<p style="text-align:center; color:#888; padding:20px;">Loading...</p>';

    db.collection("tournaments")
      .where("category", "==", category)
      .get()
      .then((snapshot) => {
          if (snapshot.empty) {
              container.innerHTML = '<p style="text-align:center; color:#888; padding:20px;">No tournaments found for ' + category + '</p>';
              return;
          }
          let html = '';
          snapshot.forEach((doc) => {
              const match = doc.data();
              const matchId = doc.id;
              if (match.status === status) {
                  html += `
                      <div style="background:#1e1e1e; border:1px solid #333; border-radius:10px; padding:15px; margin-bottom:12px; color:#fff;">
                          <h4 style="color:#ffa502; margin-bottom:5px;">${match.title || 'Tournament'}</h4>
                          <p style="font-size:12px; color:#bbb; margin-bottom:8px;">Prize: ₹${match.prize || 0} | Entry: ₹${match.entry || 0}</p>
                          <button onclick="openJoinModal('${matchId}', '${match.title || 'Tournament'}', ${match.entry || 0})" style="background:#2ed573; color:#fff; border:none; padding:8px 15px; border-radius:5px; font-weight:bold; cursor:pointer; width:100%;">Join Now</button>
                      </div>
                  `;
              }
          });
          container.innerHTML = html || '<p style="text-align:center; color:#888; padding:20px;">No ' + status + ' tournaments available.</p>';
      })
      .catch((error) => {
          container.innerHTML = '<p style="text-align:center; color:#e74c3c; padding:20px;">Error: ' + error.message + '</p>';
      });
}

// Join Modal Functions
window.openJoinModal = function(matchId, title, entryFee) {
    selectedTournamentId = matchId;
    selectedTournamentFee = entryFee;
    const modal = document.getElementById('join-modal');
    const matchTitle = document.getElementById('modal-match-title');
    const matchEntry = document.getElementById('modal-entry-fee');
    
    if (matchTitle) matchTitle.innerText = title;
    if (matchEntry) matchEntry.innerText = entryFee;
    if (modal) modal.style.display = 'flex';
};

window.closeJoinModal = function() {
    const modal = document.getElementById('join-modal');
    if (modal) modal.style.display = 'none';
};

window.confirmJoinModal = function() {
    const ffuidInput = document.getElementById('join-ffuid');
    if (!ffuidInput) return;
    const ffuid = ffuidInput.value.trim();
    
    if (!ffuid) {
        alert("Kripya apna Free Fire UID bharein!");
        return;
    }

    const userPhone = localStorage.getItem('userPhone');
    if (!userPhone) {
        alert("Pehle login karein!");
        switchAuthTab('login');
        return;
    }

    db.collection("users").doc(userPhone).get().then((doc) => {
        let wallet = 0;
        if (doc.exists && doc.data().wallet) {
            wallet = doc.data().wallet;
        }

        if (wallet < selectedTournamentFee) {
            alert("Insufficient balance! Kripya Wallet mein paise add karein.");
            return;
        }

        db.collection("participants").add({
            userPhone: userPhone,
            tournamentId: selectedTournamentId,
            ffuid: ffuid,
            joinedAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            return db.collection("users").doc(userPhone).update({
                wallet: wallet - selectedTournamentFee
            });
        }).then(() => {
            alert("Successfully Joined Tournament!");
            closeJoinModal();
            loadUserData();
        }).catch((err) => {
            alert("Error: " + err.message);
        });
    });
};

// Wallet & Add Coins Modal Functions
window.openAddCoinsModal = function() {
    const modal = document.getElementById('add-coins-modal');
    if (modal) modal.style.display = 'flex';
};

window.closeAddCoinsModal = function() {
    const modal = document.getElementById('add-coins-modal');
    if (modal) modal.style.display = 'none';
};

window.copyUpid = function() {
    navigator.clipboard.writeText("kinggkwmd@okicici");
    alert("UPI ID Copied: kinggkwmd@okicici");
};

// Submit Deposit Request
window.submitDepositRequest = function() {
    const amountInput = document.getElementById('deposit-amount');
    const utrInput = document.getElementById('deposit-utr');
    const userPhone = localStorage.getItem('userPhone');

    if (!amountInput || !utrInput) return;
    const amount = Number(amountInput.value.trim());
    const utr = utrInput.value.trim();

    if (!amount || amount <= 0 || !utr) {
        alert("Kripya sahi amount aur 12-digit UTR/Txn ID dalein!");
        return;
    }

    if (!userPhone) {
        alert("Pehle login karein!");
        return;
    }

    db.collection("deposit-requests").add({
        userPhone: userPhone,
        amount: amount,
        utr: utr,
        status: "Pending",
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        alert("Payment request submit ho gayi! Admin verification ke baad wallet update hoga.");
        closeAddCoinsModal();
        amountInput.value = '';
        utrInput.value = '';
    }).catch((err) => {
        alert("Error: " + err.message);
    });
};

// Auth Tab Switching (Login / Register)
window.switchAuthTab = function(tab) {
    const loginForm = document.getElementById('login-form');
    const regForm = document.getElementById('register-form');
    const loginBtn = document.getElementById('tab-login-btn');
    const regBtn = document.getElementById('tab-reg-btn');

    if (!loginForm || !regForm) return;

    if (tab === 'login') {
        loginForm.style.display = 'block';
        regForm.style.display = 'none';
        if (loginBtn) { loginBtn.style.background = '#ffa502'; loginBtn.style.color = '#000'; }
        if (regBtn) { regBtn.style.background = 'transparent'; regBtn.style.color = '#fff'; }
    } else {
        loginForm.style.display = 'none';
        regForm.style.display = 'block';
        if (regBtn) { regBtn.style.background = '#ffa502'; regBtn.style.color = '#000'; }
        if (loginBtn) { loginBtn.style.background = 'transparent'; loginBtn.style.color = '#fff'; }
    }
};

// Register Function
window.registerUser = function() {
    const name = document.getElementById('reg-name').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const ffuid = document.getElementById('reg-ffuid').value.trim();
    const password = document.getElementById('reg-password').value.trim();

    if (!name || !phone || !ffuid || !password) {
        alert("Kripya sabhi details bharein!");
        return;
    }

    db.collection("users").doc(phone).set({
        name: name,
        phone: phone,
        ffuid: ffuid,
        password: password,
        wallet: 0,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        alert("Registration Successful! Ab aap Login kar sakte hain.");
        switchAuthTab('login');
    }).catch((error) => {
        alert("Error: " + error.message);
    });
};

// Login Function
window.loginUser = function() {
    const phone = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value.trim();

    if (!phone || !password) {
        alert("Kripya Phone Number aur Password darj karein!");
        return;
    }

    db.collection("users").doc(phone).get().then((doc) => {
        if (doc.exists) {
            const userData = doc.data();
            if (userData.password === password) {
                localStorage.setItem('userPhone', phone);
                localStorage.setItem('savedPhone', phone);
                localStorage.setItem('savedFName', userData.name || 'Gamer');
                localStorage.setItem('savedFFUID', userData.ffuid || '');
                localStorage.setItem('isLoggedIn', 'true');

                const authScreen = document.getElementById('auth-screen');
                const mainApp = document.getElementById('main-app-container');
                if (authScreen) authScreen.style.display = 'none';
                if (mainApp) mainApp.style.display = 'block';

                alert("Login Successful!");
                location.reload();
            } else {
                alert("Galat Password! Kripya dobara koshish karein.");
            }
        } else {
            alert("Yeh Phone Number registered nahi hai! Pehle Register karein.");
        }
    }).catch((error) => {
        alert("Error: " + error.message);
    });
};

// Load User Data (Wallet Balance & Profile)
function loadUserData() {
    const userPhone = localStorage.getItem('userPhone');
    if (!userPhone) return;

    db.collection("users").doc(userPhone).get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();
            const wallet = data.wallet || 0;

            const hb = document.getElementById('header-balance');
            const wb = document.getElementById('wallet-main-balance');
            if (hb) hb.innerText = '₹' + wallet;
            if (wb) wb.innerText = '₹' + wallet;

            const nameEl = document.getElementById('user-display-name');
            if (nameEl && data.name) {
                nameEl.innerText = data.name;
            }
        }
    });
}

// Logout Function
window.logoutUser = function() {
    if (confirm("Kya aap sach mein Logout karna chahte hain?")) {
        localStorage.clear();
        alert("Aap successfully logout ho chuke hain!");
        location.reload();
    }
};

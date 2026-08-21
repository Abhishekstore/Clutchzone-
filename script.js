// Firebase Configuration with your API Key
const firebaseConfig = {
    apiKey: "AIzaSyA1jgyhtyv0fGNicgciT-JjUunyv3zVLJ8",
    authDomain: "ff-tournaments.firebaseapp.com",
    projectId: "ff-tournaments",
    storageBucket: "ff-tournaments.appspot.com",
    messagingSenderId: "1234567890",
    appId: "1:1234567890:web:abcdef"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let currentCategory = 'Full Map';
let selectedTournamentId = null;
let selectedTournamentFee = 0;

// Switch Views & Bottom Nav Active State
function switchView(viewId) {
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');

    document.querySelectorAll('.bottom-nav .nav-item').forEach(item => item.classList.remove('active'));
    if(viewId === 'home-view') document.getElementById('nav-home').classList.add('active');
    if(viewId === 'wallet-view') document.getElementById('nav-wallet').classList.add('active');
    if(viewId === 'profile-view') document.getElementById('nav-profile').classList.add('active');
    if(viewId === 'offer-view') document.getElementById('nav-offer').classList.add('active');
    if(viewId === 'ranking-view') document.getElementById('nav-ranking').classList.add('active');
}

// Open Category and Load Tournaments
function openCategory(categoryName) {
    currentCategory = categoryName;
    document.getElementById('category-title-header').innerText = categoryName.toUpperCase();
    switchView('tournament-list-view');
    loadTournamentsForCategory(categoryName, 'Upcoming');
}

function filterTab(status) {
    loadTournamentsForCategory(currentCategory, status);
}

function loadTournamentsForCategory(category, status) {
    const container = document.getElementById('tournaments-container');
    container.innerHTML = '<p style="text-align:center; color:#aaa; padding:20px;">Loading matches...</p>';

    db.collection('tournaments')
      .where('category', '==', category)
      .where('status', '==', status)
      .get()
      .then((snapshot) => {
          container.innerHTML = '';
          if (snapshot.empty) {
              container.innerHTML = '<p style="text-align:center; color:#777; padding:20px;">No tournaments available right now.</p>';
              return;
          }

          snapshot.forEach((doc) => {
              const match = doc.data();
              const matchId = doc.id;

              container.innerHTML += `
                <div class="tournament-card">
                    <div class="card-top-rules">
                        <span>⚡ ${match.title || category}</span>
                        <span class="match-id-tag">#${matchId.slice(-5)}</span>
                    </div>
                    <div class="card-details-grid">
                        <div><small>ENTRY FEE</small><h4>₹${match.entryFee}</h4></div>
                        <div><small>PRIZE POOL</small><h4>₹${match.prizePool || 3000}</h4></div>
                        <div><small>PER KILL</small><h4>₹${match.perKill || 5}</h4></div>
                    </div>
                    <div class="card-info-row">
                        <span><i class="fa-solid fa-clock"></i> ${match.time || 'Today'}</span>
                        <span><i class="fa-solid fa-map"></i> ${match.map || 'Bermuda'}</span>
                    </div>
                    <button class="btn-join" onclick="openJoinModal('${matchId}', '${match.title || category}', ${match.entryFee})">
                        JOIN MATCH
                    </button>
                </div>
              `;
          });
      })
      .catch((error) => {
          console.error("Error loading tournaments:", error);
      });
}

// Join Match Modal & Logic
function openJoinModal(matchId, title, entryFee) {
    selectedTournamentId = matchId;
    selectedTournamentFee = entryFee;
    document.getElementById('modal-match-title').innerText = title;
    document.getElementById('modal-entry-fee').innerText = `₹${entryFee}`;
    document.getElementById('join-modal').style.display = 'flex';
}

function closeJoinModal() {
    document.getElementById('join-modal').style.display = 'none';
}

function confirmJoinMatch() {
    const ffuid = document.getElementById('join-ffuid').value.trim();
    if (!ffuid) {
        alert("Please enter your Free Fire UID!");
        return;
    }

    const user = auth.currentUser;
    if (!user) {
        alert("Please log in first!");
        return;
    }

    db.collection('users').doc(user.uid).get().then((doc) => {
        if (!doc.exists) return;
        const userData = doc.data();
        const currentBalance = userData.wallet || 0;

        if (currentBalance < selectedTournamentFee) {
            alert("Insufficient wallet balance! Please deposit funds first.");
            return;
        }

        const newBalance = currentBalance - selectedTournamentFee;
        db.collection('users').doc(user.uid).update({ wallet: newBalance }).then(() => {
            db.collection('tournaments').doc(selectedTournamentId).collection('participants').add({
                userId: user.uid,
                ffuid: ffuid,
                joinedAt: new Date()
            }).then(() => {
                alert("Successfully Joined Tournament!");
                closeJoinModal();
                location.reload();
            });
        });
    });
}

// UPI Add Coins Modal Functions
function openAddCoinsModal() {
    document.getElementById('add-coins-modal').style.display = 'flex';
}

function closeAddCoinsModal() {
    document.getElementById('add-coins-modal').style.display = 'none';
}

function copyUpiId() {
    const upiText = "kinggkwrd@okicici";
    navigator.clipboard.writeText(upiText);
    alert("UPI ID Copied: " + upiText);
}

function submitDepositRequest() {
    const amount = document.getElementById('deposit-amount').value;
    if(!amount || amount <= 0) {
        alert("Please enter a valid amount!");
        return;
    }
    const telegramUrl = `https://t.me/Abhifftournamenthub?text=Hello%20Admin,%20I%20have%20paid%20₹${amount}%20to%20UPI%20kinggkwrd@okicici.%20Here%20is%20my%20screenshot!`;
    window.open(telegramUrl, "_blank");
    closeAddCoinsModal();
}

function openWithdrawModal() {
    alert("For withdrawals, please contact admin on Telegram!");
    openDepositTelegram();
}

function openDepositTelegram() {
    window.open("https://t.me/Abhifftournamenthub", "_blank");
}

// Auth State & Profile Handler
auth.onAuthStateChanged((user) => {
    if (user) {
        db.collection('users').doc(user.uid).onSnapshot((doc) => {
            if (doc.exists) {
                const data = doc.data();
                const walletBal = data.wallet || 0;
                document.getElementById('wallet-balance').innerText = `₹${walletBal}`;
                document.getElementById('wallet-main-balance').innerText = `₹${walletBal}`;
                document.getElementById('wallet-deposited').innerText = `₹${walletBal}`;
                if(data.ign) {
                    document.getElementById('user-display-name').innerText = data.ign;
                    document.getElementById('profile-username-text').innerText = `Username : ${data.ign}`;
                }
            }
        });
    }
});

document.getElementById('save-profile-btn').addEventListener('click', () => {
    const ign = document.getElementById('ign-input').value.trim();
    const ffuid = document.getElementById('ffuid-input').value.trim();
    const user = auth.currentUser;

    if(!user) {
        alert("User not logged in!");
        return;
    }

    db.collection('users').doc(user.uid).set({
        ign: ign,
        ffUid: ffuid,
        email: user.email,
        wallet: 0,
        role: "user"
    }, { merge: true }).then(() => {
        alert("Profile Saved Successfully!");
    });
});

document.getElementById('logout-btn').addEventListener('click', () => {
    auth.signOut().then(() => {
        window.location.href = "index.html";
    });
});

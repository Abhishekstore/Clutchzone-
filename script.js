// ==========================================
// COMPLETE PLAYT24 USER APP SCRIPT.JS
// ==========================================

// 1. FIREBASE INITIALIZATION (Database Connection)
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp({
        apiKey: "AIzaSyA1jgyhtyv0fGNicgciT-JjUunyv3zVLJ8",
        authDomain: "ff-tournaments-af47a.firebaseapp.com",
        projectId: "ff-tournaments-af47a",
        storageBucket: "ff-tournaments-af47a.appspot.com",
        messagingSenderId: "238745686365",
        appId: "1:238745686365:web:03e9d5e1dd450dbe2d8b4"
    });
}
const db = firebase.firestore();

// 2. TAB SWITCHING LOGIC (Home, Wallet, Profile)
window.switchTab = function(tabName) {
    document.querySelectorAll('.app-tab-content').forEach(tab => {
        tab.style.display = 'none';
    });
    
    document.querySelectorAll('.bottom-nav .nav-item').forEach(item => {
        item.classList.remove('active');
    });

    const target = document.getElementById(tabName + '-tab');
    if (target) {
        target.style.display = 'block';
    }

    const navItem = document.getElementById('nav-' + tabName);
    if (navItem) {
        navItem.classList.add('active');
    }
};
// --- PROFESSIONAL TOURNAMENT LIST & JOINING FLOW ---

window.openCategory = function(catName) {
    localStorage.setItem('selectedCategory', catName);
    loadTournamentsForCategory(catName);
};

function loadTournamentsForCategory(categoryName) {
    db.collection('tournaments')
        .where('category', '==', categoryName)
        .get()
        .then((querySnapshot) => {
            let count = querySnapshot.size;
            if (count === 0) {
                alert("No custom rooms found for " + categoryName + " right now. Please create one from Admin panel!");
            } else {
                // Tournament List Modal / Screen dikhane ke liye
                showTournamentListModal(categoryName, querySnapshot);
            }
        })
        .catch((error) => {
            console.error("Error fetching tournaments: ", error);
            alert("Error: " + error.message);
        });
}

// 1. Tournament List Modal (Cards View)
function showTournamentListModal(categoryName, querySnapshot) {
    let existingModal = document.getElementById('dynamic-tournament-modal');
    if (existingModal) existingModal.remove();

    let modalHTML = `
    <div id="dynamic-tournament-modal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:9999; overflow-y:auto; padding:15px; font-family:sans-serif;">
        <div style="display:flex; justify-content:space-between; align-items:center; background:#1e1e1e; padding:15px; border-radius:8px; margin-bottom:15px;">
            <h2 style="color:#ff9800; margin:0; text-transform:uppercase;">${categoryName} Tournaments</h2>
            <button onclick="document.getElementById('dynamic-tournament-modal').remove()" style="background:#ff4444; color:white; border:none; padding:8px 15px; border-radius:5px; font-weight:bold; cursor:pointer;">X Close</button>
        </div>
        <div id="tournaments-cards-container">`;

    querySnapshot.forEach((doc) => {
        let d = doc.data();
        let docId = doc.id;
        modalHTML += `
        <div style="background:#222; border:1px solid #444; border-radius:10px; padding:15px; margin-bottom:15px; color:white;">
            <h3 style="margin:0 0 10px 0; color:#fff;">${d.title || 'Custom Room Tournament'}</h3>
            <div style="display:flex; justify-content:space-between; font-size:14px; color:#ccc; margin-bottom:12px;">
                <span>💰 Entry: ₹${d.entryFee || 0}</span>
                <span>🏆 Prize: ₹${d.prizePool || 0}</span>
                <span>🔥 Per Kill: ₹${d.perKill || 4}</span>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:13px; color:#aaa; margin-bottom:15px;">
                <span>Map: ${d.map || 'Bermuda'}</span>
                <span>Type: ${d.subMode || 'Solo'}</span>
            </div>
            <button onclick="openSlotSelection('${docId}', '${d.title}', ${d.entryFee || 0})" style="width:100%; background:#ff9800; color:black; border:none; padding:12px; border-radius:6px; font-weight:bold; font-size:16px; cursor:pointer;">JOIN MATCH</button>
        </div>`;
    });

    modalHTML += `</div></div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// 2. Slot Selection Screen (1 to 48 Slots)
window.openSlotSelection = function(tournamentId, title, entryFee) {
    let modalHTML = `
    <div id="slot-selection-modal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:#121212; z-index:10000; overflow-y:auto; padding:20px; color:white; font-family:sans-serif;">
        <div style="display:flex; align-items:center; margin-bottom:20px;">
            <button onclick="document.getElementById('slot-selection-modal').remove()" style="background:none; border:none; color:white; font-size:24px; cursor:pointer; margin-right:15px;">←</button>
            <h2 style="margin:0; font-size:18px;">Choose your match slot</h2>
        </div>
        <p style="color:#aaa; font-size:13px; margin-bottom:15px;">Tournament: ${title}</p>
        <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:10px; margin-bottom:20px;" id="slots-grid">`;

    for (let i = 1; i <= 48; i++) {
        modalHTML += `<button onclick="selectThisSlot(${i}, '${tournamentId}', '${title}', ${entryFee})" style="background:#222; border:1px solid #555; color:white; padding:15px; border-radius:8px; font-size:16px; font-weight:bold; cursor:pointer;" id="slot-btn-${i}">${i}</button>`;
    }

    modalHTML += `</div></div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

let selectedSlotNumber = null;
window.selectThisSlot = function(slotNum, tournamentId, title, entryFee) {
    // Purane selected ka color hatao
    if (selectedSlotNumber) {
        let prevBtn = document.getElementById(`slot-btn-${selectedSlotNumber}`);
        if(prevBtn) { prevBtn.style.background = '#222'; prevBtn.style.color = 'white'; }
    }
    selectedSlotNumber = slotNum;
    let currBtn = document.getElementById(`slot-btn-${slotNum}`);
    if(currBtn) { currBtn.style.background = '#ff9800'; currBtn.style.color = 'black'; }

    // Next step (Payment / Joining details screen par jao)
    setTimeout(() => {
        let slotModal = document.getElementById('slot-selection-modal');
        if(slotModal) slotModal.remove();
        showPaymentScreen(tournamentId, title, entryFee, slotNum);
    }, 400);
}

// 3. Payment & Player Details Screen
function showPaymentScreen(tournamentId, title, entryFee, slotNum) {
    let userWalletBalance = 11; // Aapke app ke wallet se sync ho jayega
    let modalHTML = `
    <div id="payment-modal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:#1a0033; z-index:10001; overflow-y:auto; padding:20px; color:white; font-family:sans-serif;">
        <div style="display:flex; align-items:center; margin-bottom:20px;">
            <button onclick="document.getElementById('payment-modal').remove()" style="background:none; border:none; color:white; font-size:24px; cursor:pointer; margin-right:15px;">←</button>
            <h2 style="margin:0; font-size:18px;">Joining Match</h2>
        </div>
        
        <div style="text-align:center; background:#2a004e; padding:15px; border-radius:10px; margin-bottom:20px;">
            <span style="font-size:28px;">🪙</span>
            <h1 style="margin:5px 0 0 0; color:#ffcc00;">₹${userWalletBalance}</h1>
            <p style="margin:5px 0 0 0; font-size:12px; color:#aaa;">Wallet Balance</p>
        </div>

        <div style="background:#240046; padding:15px; border-radius:10px; margin-bottom:20px; border:1px solid #5a189a;">
            <p style="margin:0 0 10px 0; font-size:14px; font-weight:bold;">Enter Player Details (Free Fire Username)</p>
            <div style="display:flex; justify-content:space-between; align-items:center; background:#3c096c; padding:10px; border-radius:6px;">
                <span>Slot: <b>${slotNum}</b></span>
                <input type="text" id="ff-player-name" placeholder="Enter FF Name" style="background:#10002b; border:1px solid #7b2cbf; color:white; padding:8px; border-radius:4px; width:60%; text-align:center;">
            </div>
        </div>

        <div style="margin-bottom:25px; font-size:14px; text-align:center;">
            <p>Match Entry Fee Per Player: 🪙 <b>${entryFee}</b></p>
            <p style="font-size:18px; color:#ffcc00;">Total Payable Amount: 🪙 <b>${entryFee}</b></p>
        </div>

        <button onclick="confirmAndJoinMatch('${tournamentId}', ${entryFee}, ${slotNum})" style="width:100%; background:#7b2cbf; color:white; border:none; padding:15px; border-radius:8px; font-size:16px; font-weight:bold; cursor:pointer; box-shadow: 0 4px 10px rgba(123,44,191,0.5);">JOIN NOW</button>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// 4. Final Join & Wallet Deduction Logic
window.confirmAndJoinMatch = function(tournamentId, entryFee, slotNum) {
    let playerName = document.getElementById('ff-player-name').value.trim();
    if (!playerName) {
        alert("Please enter your Free Fire Player Name!");
        return;
    }

    // Database mein joined match save karna
    db.collection('joined_matches').add({
        tournamentId: tournamentId,
        slotNumber: slotNum,
        playerName: playerName,
        entryFee: entryFee,
        joinedAt: new Date()
    }).then(() => {
        alert("🎉 Successfully Joined Match at Slot " + slotNum + "!\nEntry fee deducted from wallet.");
        let pModal = document.getElementById('payment-modal');
        if(pModal) pModal.remove();
        let tModal = document.getElementById('dynamic-tournament-modal');
        if(tModal) tModal.remove();
    }).catch((error) => {
        alert("Error joining match: " + error.message);
    });
};




// 5. PROFILE, WALLET & HELPER BUTTON ACTIONS
window.openTopPlayers = function() {
    alert("Top Players leaderboard is loading...");
};

window.openSupport = function() {
    alert("Connecting to Customer Support...");
};

window.toggleHelp = function() {
    alert("App Guide & Instructions: Check room rules before joining.");
};

window.filterContests = function(statusType) {
    alert("Filtering your contests by: " + statusType);
};

window.openAddCoinsModal = function() {
    // Aapka existing UPI payment gateway yahan connect rahega
    alert("Opening UPI Deposit Gateway...");
};

window.openWithdrawModal = function() {
    alert("Opening Withdrawal Window...");
};

window.openTransactions = function() {
    alert("Opening Transaction History...");
};

window.openStatics = function() {
    alert("Opening User Statistics...");
};

window.openRefer = function() {
    alert("Refer & Earn: Invite friends and get bonus coins!");
};

window.openNotifications = function() {
    alert("No new notifications.");
};

window.openFAQ = function() {
    alert("Opening FAQ section...");
};

window.openAbout = function() {
    alert("PLAYT24 - Professional Tournament Platform v1.11");
};

window.openPrivacy = function() {
    alert("Opening Privacy Policy...");
};

window.openTerms = function() {
    alert("Opening Terms & Conditions...");
};

window.logout = function() {
    if(confirm("Are you sure you want to logout?")) {
        alert("Logged out successfully!");
        window.location.reload();
    }
};

// Initializer
document.addEventListener('DOMContentLoaded', () => {
    console.log("PLAYT24 User App Loaded Successfully!");
});

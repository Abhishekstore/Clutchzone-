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

// --- MY CONTESTS FILTERING & DISPLAY SYSTEM ---

window.filterContests = function(statusType) {
    db.collection('joined_matches').get()
        .then((snapshot) => {
            let joinedList = [];
            let promises = [];

            snapshot.forEach((doc) => {
                let matchData = doc.data();
                
                let p = db.collection('tournaments').doc(matchData.tournamentId).get()
                    .then((tDoc) => {
                        if (tDoc.exists) {
                            let tData = tDoc.data();
                            let currentStatus = tData.status ? tData.status.toLowerCase() : 'upcoming';
                            
                            if (currentStatus === statusType.toLowerCase()) {
                                joinedList.push({
                                    title: tData.title || 'Custom Room Tournament',
                                    slot: matchData.slotNumber,
                                    playerName: matchData.playerName,
                                    entryFee: matchData.entryFee,
                                    prizePool: tData.prizePool || 0,
                                    roomID: tData.roomID || 'Not Provided Yet',
                                    roomPass: tData.roomPassword || 'Not Provided Yet',
                                    status: currentStatus
                                });
                            }
                        }
                    });
                promises.push(p);
            });

            Promise.all(promises).then(() => {
                showMyContestsModal(statusType, joinedList);
            });
        })
        .catch((error) => {
            console.error("Error fetching joined contests:", error);
            alert("Error: " + error.message);
        });
};

function showMyContestsModal(statusType, contests) {
    let existingModal = document.getElementById('my-contests-modal');
    if (existingModal) existingModal.remove();

    let modalHTML = `
    <div id="my-contests-modal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:10002; overflow-y:auto; padding:15px; font-family:sans-serif; color:white;">
        <div style="display:flex; justify-content:space-between; align-items:center; background:#1e1e1e; padding:15px; border-radius:8px; margin-bottom:15px;">
            <h2 style="color:#ff9800; margin:0; text-transform:uppercase;">My ${statusType} Contests</h2>
            <button onclick="document.getElementById('my-contests-modal').remove()" style="background:#ff4444; color:white; border:none; padding:8px 15px; border-radius:5px; font-weight:bold; cursor:pointer;">X Close</button>
        </div>
        <div id="contests-list-container">`;

    if (contests.length === 0) {
        modalHTML += `
        <div style="text-align:center; padding:50px 20px; color:#aaa;">
            <p style="font-size:16px;">No ${statusType} contests found!</p>
            <p style="font-size:13px; color:#666;">Join a match from categories to see it here.</p>
        </div>`;
    } else {
        contests.forEach(c => {
            modalHTML += `
            <div style="background:#222; border:1px solid #444; border-radius:10px; padding:15px; margin-bottom:15px;">
                <h3 style="margin:0 0 8px 0; color:#fff;">${c.title}</h3>
                <div style="display:flex; justify-content:space-between; font-size:13px; color:#ccc; margin-bottom:10px;">
                    <span>Player: <b>${c.playerName}</b></span>
                    <span>Slot: <b style="color:#ff9800;">#${c.slot}</b></span>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:13px; color:#ffcc00; margin-bottom:12px;">
                    <span>Prize Pool: ₹${c.prizePool}</span>
                    <span>Entry: ₹${c.entryFee}</span>
                </div>
                <div style="background:#111; border:1px dashed #555; padding:10px; border-radius:6px; font-size:13px;">
                    <span style="color:#00e676;">🔑 Room ID: <b>${c.roomID}</b></span><br>
                    <span style="color:#00e676;">🔒 Password: <b>${c.roomPass}</b></span>
                </div>
            </div>`;
        });
    }

    modalHTML += `</div></div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// --- UPI ADD MONEY SYSTEM ---

window.openAddCoinsModal = function() {
    let existingModal = document.getElementById('add-money-modal');
    if (existingModal) existingModal.remove();

    let modalHTML = `
    <div id="add-money-modal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:10002; display:flex; justify-content:center; align-items:center; font-family:sans-serif; color:white; padding:15px;">
        <div style="background:#1e1e1e; border:1px solid #444; border-radius:12px; padding:20px; width:100%; max-width:350px; box-shadow:0 4px 20px rgba(0,0,0,0.5);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <h3 style="color:#ff9800; margin:0;">Add Money to Wallet</h3>
                <button onclick="document.getElementById('add-money-modal').remove()" style="background:#ff4444; color:white; border:none; padding:5px 10px; border-radius:5px; font-weight:bold; cursor:pointer;">X</button>
            </div>
            
            <div style="margin-bottom:15px;">
                <label style="font-size:13px; color:#ccc;">Enter Amount (₹):</label>
                <input type="number" id="walletAmountInput" placeholder="e.g. 100" style="width:100%; padding:10px; margin-top:5px; background:#111; border:1px solid #555; color:white; border-radius:6px; font-size:16px; box-sizing:border-box;">
            </div>

            <div style="background:#262626; padding:10px; border-radius:6px; font-size:12px; color:#aaa; margin-bottom:15px;">
                💡 Button dabate hi aapke phone ke UPI apps khul jayenge. Apna PIN daal kar payment complete karein.
            </div>

            <button onclick="processUpiPayment()" style="width:100%; background:#00e676; color:black; border:none; padding:12px; border-radius:6px; font-weight:bold; font-size:15px; cursor:pointer;">
                Pay via UPI App
            </button>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
};

window.processUpiPayment = function() {
    const amount = document.getElementById('walletAmountInput').value;
    
    if (!amount || amount <= 0) {
        alert("Kripya sahi amount enter karein!");
        return;
    }

    // ⚠️ IMPORTANT: Yahan apni asli UPI ID daal dena (jaise yourname@paytm, yourname@ybl, etc.)
    const merchantUpiID = "kinggkwrd@okicici"; 
    const merchantName = "Clutchzone";
    const transactionNote = "Wallet Deposit";

    // UPI Intent URL generate karna
    const upiUrl = `upi://pay?pa=${merchantUpiID}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;

    // User ke phone ke UPI apps par redirect karna
    window.location.href = upiUrl;
};

window.openWithdrawalModal = function() {
    showCustomModal("Withdrawal Request", `
        <div style="font-size:13px; color:#ccc;">
            <p style="margin-top:0; color:#aaa; font-size:12px;">Apni winnings withdraw karne ke liye details bharein:</p>
            
            <div style="margin-bottom:12px;">
                <label style="display:block; margin-bottom:5px; color:#ff9800; font-weight:bold;">Withdrawal Amount (₹)</label>
                <input type="number" id="withdrawAmount" placeholder="e.g. 100" style="width:100%; padding:10px; background:#111; border:1px solid #444; color:white; border-radius:6px; box-sizing:border-box;">
            </div>

            <div style="margin-bottom:12px;">
                <label style="display:block; margin-bottom:5px; color:#ff9800; font-weight:bold;">UPI ID / UPI Number</label>
                <input type="text" id="withdrawUpi" placeholder="e.g. username@paytm" style="width:100%; padding:10px; background:#111; border:1px solid #444; color:white; border-radius:6px; box-sizing:border-box;">
            </div>

            <div style="margin-bottom:15px;">
                <label style="display:block; margin-bottom:5px; color:#ff9800; font-weight:bold;">Account Holder Name</label>
                <input type="text" id="withdrawName" placeholder="Enter your full name" style="width:100%; padding:10px; background:#111; border:1px solid #444; color:white; border-radius:6px; box-sizing:border-box;">
            </div>

            <button onclick="submitWithdrawalRequest()" style="width:100%; background:#00e676; color:black; border:none; padding:12px; border-radius:6px; font-weight:bold; cursor:pointer; font-size:14px;">
                Submit Request
            </button>
        </div>
    `);
};

window.submitWithdrawalRequest = function() {
    const amount = document.getElementById('withdrawAmount').value.trim();
    const upiId = document.getElementById('withdrawUpi').value.trim();
    const name = document.getElementById('withdrawName').value.trim();

    if (!amount || amount <= 0) {
        alert("Kripya sahi withdrawal amount daal dein!");
        return;
    }
    if (!upiId) {
        alert("Kripya apni UPI ID daal dein!");
        return;
    }
    if (!name) {
        alert("Kripya apna naam daal dein!");
        return;
    }

    // Firebase mein withdrawal request save karna
    db.collection('withdrawals').add({
        amount: amount,
        upiId: upiId,
        name: name,
        status: 'Pending',
        createdAt: new Date()
    }).then(() => {
        alert("Withdrawal request successfully submit ho gayi hai! Jaldi hi payment process kar di jayegi.");
        let modal = document.getElementById('custom-action-modal');
        if (modal) modal.remove();
    }).catch((error) => {
        alert("Error: " + error.message);
    });
};




window.openTransactions = function() {
    alert("Opening Transaction History...");
};

window.openStatics = function() {
    showCustomModal("My Statistics", `
        <div style="font-size:13px; color:#ccc;">
            <div style="background:#222; padding:12px; border-radius:8px; margin-bottom:10px; display:flex; justify-content:space-between;">
                <span>Total Tournaments Joined:</span>
                <b style="color:#ff9800;">5</b>
            </div>
            <div style="background:#222; padding:12px; border-radius:8px; margin-bottom:10px; display:flex; justify-content:space-between;">
                <span>Matches Won:</span>
                <b style="color:#00e676;">0</b>
            </div>
            <div style="background:#222; padding:12px; border-radius:8px; display:flex; justify-content:space-between;">
                <span>Total Earnings:</span>
                <b style="color:#00e676;">₹0</b>
            </div>
        </div>
    `);
};

window.openTopPlayers = function() {
    showCustomModal("Top Players Leaderboard", `
        <div style="font-size:13px;">
            <div style="background:#222; padding:10px; border-radius:6px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
                <span>🥇 1. AlphaStark</span>
                <b style="color:#00e676;">₹2,450 Won</b>
            </div>
            <div style="background:#222; padding:10px; border-radius:6px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
                <span>🥈 2. KillerX</span>
                <b style="color:#00e676;">₹1,800 Won</b>
            </div>
        </div>
    `);
};

window.openRefer = function() {
    showCustomModal("Refer & Earn", `
        <div style="text-align:center; font-size:13px; color:#ccc;">
            <p>Invite friends and get <b style="color:#00e676;">₹10</b> bonus when they join!</p>
            <div style="background:#111; border:1px dashed #555; padding:12px; border-radius:6px; margin:15px 0; font-size:16px; color:#ff9800; font-weight:bold;">
                CLUTCH2026
            </div>
            <button onclick="alert('Referral link copied!');" style="background:#ff9800; color:black; border:none; padding:10px; border-radius:6px; font-weight:bold; width:100%; cursor:pointer;">
                Copy Link
            </button>
        </div>
    `);
};

window.openNotifications = function() {
    showCustomModal("Notifications", `
        <div style="font-size:13px; color:#ccc;">
            <div style="background:#222; padding:12px; border-radius:8px; margin-bottom:10px;">
                <b style="color:#ff9800;">🔥 New Tournament Live!</b>
                <p style="margin:5px 0 0 0; color:#aaa; font-size:12px;">Full Map rooms open now. Join fast!</p>
            </div>
        </div>
    `);
};

window.openSupport = function() {
    showCustomModal("Contact Support", `
        <div style="text-align:center; font-size:13px; color:#ccc;">
            <p>Facing any issue? Join our official Telegram group:</p>
            <a href="https://t.me/+oRx8lq1lACplOWFl" target="_blank" style="display:block; background:#0088cc; color:white; padding:12px; border-radius:6px; text-decoration:none; font-weight:bold; margin-top:15px;">
                📢 Join Telegram Support
            </a>
        </div>
    `);
};

window.openFAQ = function() {
    showCustomModal("FAQ & Rules", `
        <div style="font-size:13px; color:#ccc; line-height:1.5;">
            <div style="background:#222; padding:10px; border-radius:6px; margin-bottom:8px;">
                <b style="color:#ff9800;">Q: Room ID kab milega?</b>
                <p style="margin:5px 0 0 0; color:#aaa;">Ans: Match shuru hone se 10 minute pehle aapke 'Ongoing Contests' mein dikhega.</p>
            </div>
        </div>
    `);
};

window.openAbout = function() {
    showCustomModal("About Clutchzone", `
        <div style="font-size:13px; color:#ccc; line-height:1.6; text-align:left;">
            <p style="text-align:center; color:#ff9800; font-weight:bold; font-size:15px;">CLUTCHZONE v1.11</p>
            <p>India's ultimate competitive eSports platform built for Free Fire gamers to compete in custom rooms and win cash rewards.</p>
        </div>
    `);
};

window.openPrivacy = function() {
    showCustomModal("Privacy Policy", `
        <div style="font-size:12px; color:#ccc; line-height:1.5; max-height:260px; overflow-y:auto; padding-right:5px; text-align:left;">
            <p><b style="color:#ff9800;">1. Information We Collect:</b><br>We collect your Free Fire username and match stats strictly for managing tournaments.</p>
            <p><b style="color:#ff9800;">2. Data Security:</b><br>Your details are kept secure and never shared with third parties.</p>
        </div>
    `);
};

window.openTerms = function() {
    showCustomModal("Terms & Conditions", `
        <div style="font-size:12px; color:#ccc; line-height:1.5; max-height:260px; overflow-y:auto; padding-right:5px; text-align:left;">
            <p><b style="color:#ff9800;">1. Fair Play Policy:</b><br>Hacks or third-party tools are strictly prohibited. Violators will be banned.</p>
            <p><b style="color:#ff9800;">2. Room Credentials:</b><br>Shared inside the app 10 minutes prior to match start.</p>
        </div>
    `);
};

// Modal Helper Function (Popups dikhane ke liye zaroori hai)
function showCustomModal(title, contentHTML) {
    let existing = document.getElementById('custom-action-modal');
    if (existing) existing.remove();
    let modalHTML = `
    <div id="custom-action-modal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:10002; display:flex; justify-content:center; align-items:center; font-family:sans-serif; color:white; padding:15px;">
        <div style="background:#1e1e1e; border:1px solid #444; border-radius:12px; padding:20px; width:100%; max-width:360px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid #333; padding-bottom:10px;">
                <h3 style="color:#ff9800; margin:0; font-size:16px;">${title}</h3>
                <button onclick="document.getElementById('custom-action-modal').remove()" style="background:#ff4444; color:white; border:none; padding:5px 10px; border-radius:5px; cursor:pointer;">X</button>
            </div>
            ${contentHTML}
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

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

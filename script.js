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
    // Agar Clash Squad hai toh database ke liye usko 'CS' bana do
    let dbCategory = categoryName;
    if (categoryName === 'Clash Squad') {
        dbCategory = 'CS';
    }

    db.collection('tournaments')
        .where('category', '==', dbCategory)
        .get()
        .then((querySnapshot) => {
            let count = querySnapshot.size;
            if (count === 0) {
                alert("No custom rooms found for " + categoryName + " right now. Please create one from Admin panel!");
            } else {
                showTournamentListModal(categoryName, querySnapshot);
            }
        })
        .catch((error) => {
            console.error("Error fetching tournaments: ", error);
            alert("Error: " + error.message);
        });
}

// 1. Tournament List Modal (Cards View)
window.showTournamentListModal = function(categoryName, querySnapshot) {
    let existingModal = document.getElementById('dynamic-tournament-modal');
    if (existingModal) existingModal.remove();

    let modalHTML = `
        <div id="dynamic-tournament-modal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:9999; overflow-y:auto; padding:20px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; background:#1c1c1c; padding:10px 15px; border-radius:8px;">
                <h2 style="color:#ff9800; margin:0; font-size:16px; text-transform:uppercase;">${categoryName} TOURNAMENTS</h2>
                <button onclick="document.getElementById('dynamic-tournament-modal').remove()" style="background:#f44336; color:#fff; border:none; padding:5px 10px; border-radius:5px; font-weight:bold; cursor:pointer;">Close</button>
            </div>
            <div id="tournaments-cards-container"></div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    let container = document.getElementById('tournaments-cards-container');
    let promises = [];

    querySnapshot.forEach((docSnap) => {
        let d = docSnap.data();
        let docId = docSnap.id;

        // Time khatam hone par match hide karne ka check
        if (d.startTime) {
            let matchTime = new Date(d.startTime);
            let currentTime = new Date();
            if (matchTime <= currentTime) return;
        }
        if (d.status === 'Completed') return;

        let totalSlots = d.maxSlots || 48;

        // Firebase se check karenge ki is tournament mein kitne log join kar chuke hain
        let p = db.collection('joined_matches').where('tournamentId', '==', docId).get().then((joinedSnap) => {
            let joinedCount = joinedSnap.size;
            let spotsLeft = totalSlots - joinedCount;
            if (spotsLeft < 0) spotsLeft = 0;
            let progressPercent = (joinedCount / totalSlots) * 100;

            let cardHTML = `
                <div style="background:#1c1c1c; border:1px solid #333; border-radius:12px; padding:12px; margin-bottom:15px;">
                    <!-- Top Banner Box -->
                    <div style="width:100%; height:110px; background:linear-gradient(135deg, #2b1055, #7597de); border-radius:8px; display:flex; align-items:flex-end; padding:10px; margin-bottom:10px;">
                        <span style="font-weight:bold; font-size:15px; color:#fff; text-shadow: 0 2px 4px rgba(0,0,0,0.6);">${d.title || 'Tournament'}</span>
                    </div>

                    <!-- Logo & Subtitle Section -->
                    <div style="display:flex; align-items:center; gap:10px; margin-bottom:12px;">
                        <div style="width:38px; height:38px; border-radius:50%; background:#ff9800; display:flex; align-items:center; justify-content:center; font-weight:bold; color:#000;">P24</div>
                        <div>
                            <div style="font-size:14px; font-weight:bold; color:#fff;">${d.title || 'Tournament'}</div>
                            <div style="font-size:11px; color:#aaa;">Gun Attributes Off • Paid Match</div>
                        </div>
                    </div>

                            <!-- Entry Fee, Prize Pool, Per Kill -->
        <div style="background:#262626; border-radius:8px; padding:10px; display:flex; justify-content:space-between; margin-bottom:12px;">
            <div style="flex:1;">
                <div style="font-size:10px; color:#aaa; font-weight:bold;">👑 ENTRY</div>
                <div style="font-size:14px; color:#fff; font-weight:bold; margin-top:3px;">₹${d.entry || 0}</div>
            </div>
            <div style="flex:1; border-left:1px solid #444; border-right:1px solid #444; padding:0 10px;">
                <div style="font-size:10px; color:#aaa; font-weight:bold;">🏆 PRIZE</div>
                <div style="font-size:14px; color:#ffeb3b; font-weight:bold; margin-top:3px;">₹${d.prize || 0}</div>
            </div>
            <div style="flex:1; text-align:right;">
                <div style="font-size:10px; color:#aaa; font-weight:bold;">🎯 KILL</div>
                <div style="font-size:14px; color:#ff9800; font-weight:bold; margin-top:3px;">₹${d.perKill || d.kill || 0}</div>
            </div>
        </div>

                    <!-- Time, Type, Map Section -->
                    <div style="display:flex; justify-content:space-between; text-align:center; font-size:12px; margin-bottom:10px;">
                        <div style="flex:1; text-align:left;">
                            <div style="font-size:10px; color:#aaa;">TIME</div>
                            <div style="font-size:11px; color:#ffeb3b; font-weight:bold; margin-top:2px;">${d.startTime ? new Date(d.startTime).toLocaleString() : 'TBD'}</div>
                        </div>
                        <div style="flex:1; text-align:center;">
                            <div style="font-size:10px; color:#aaa;">TYPE</div>
                            <div style="font-size:11px; color:#fff; font-weight:bold; margin-top:2px;">${d.subMode || 'Solo'} (${totalSlots} Players)</div>
                        </div>
                        <div style="flex:1; text-align:right;">
                            <div style="font-size:10px; color:#aaa;">MAP</div>
                            <div style="font-size:11px; color:#fff; font-weight:bold; margin-top:2px;">${d.map || 'Bermuda'}</div>
                        </div>
                    </div>

                    <!-- Live Dynamic Progress Bar & Join Button -->
                    <div style="margin-top: 12px; border-top: 1px solid #333; padding-top: 10px;">
                        <div style="display: flex; justify-content: space-between; font-size: 11px; color: #aaa; margin-bottom: 5px;">
                            <span>Only ${spotsLeft} Spot${spotsLeft === 1 ? '' : 's'} Left</span>
                            <span><b>${joinedCount}/${totalSlots}</b></span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="flex: 1; background: #333; height: 6px; border-radius: 3px; overflow: hidden;">
                                <div style="background: #ff9900; width: ${progressPercent}%; height: 100%;"></div>
                            </div>
                            <button onclick="openSlotSelection('${docId}', '${d.title}', ${d.entry || 0}, ${d.entry || 0}, 0)" style="background: #fff; color: #000; font-weight: bold; padding: 8px 22px; border-radius: 6px; border: none; cursor: pointer; font-size: 13px; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">JOIN</button>

                        </div>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', cardHTML);
        });
        promises.push(p);
    });
};


window.openSlotSelection = function(tournamentId, title, entryFee, category) {
    // Agar CS ya Lone Wolf hai, toh slot selection skip karke seedha payment screen par bhejo
    if (category === 'CS' || category === 'Lone Wolf') {
        showPaymentScreen(tournamentId, title, entryFee, 'N/A');
        return;
    }

    let modalHTML = `
    <div id="slot-selection-modal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:9999; overflow-y:auto; padding:15px; box-sizing:border-box; font-family:sans-serif;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; background:#1c1c1c; padding:10px 15px; border-radius:8px; border:1px solid #333;">
            <button onclick="document.getElementById('slot-selection-modal').remove()" style="background:#f44336; color:white; border:none; padding:6px 12px; border-radius:4px; font-weight:bold; cursor:pointer;">Close</button>
            <h2 style="color:#ff9800; margin:0; font-size:16px;">Choose your match slot</h2>
        </div>
        <p style="color:#aaa; font-size:13px; margin-bottom:15px; text-align:center;">Tournament: ${title}</p>
        <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap: 8px;">
    `;

    for (let i = 1; i <= 48; i++) {
        modalHTML += `<button onclick="selectThisSlot(${i}, '${tournamentId}', '${title}', ${entryFee})" id="slot-btn-${i}" style="background:#222; color:#fff; border:1px solid #444; padding:12px 0; border-radius:6px; font-weight:bold; cursor:pointer;">${i}</button>`;
    }

    modalHTML += `</div></div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
};


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
    let userWalletBalance = (window.currentUser && window.currentUser.dep_balance) || Number(localStorage.getItem('dep_balance')) || 0;
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

 let currentUsername = localStorage.getItem('loggedInUser') || localStorage.getItem('username') || localStorage.getItem('logged_in_username');

if (!currentUsername) {
    alert("Tournament join karne ke liye pehle login karein!");
    return;
}
    
    let userRef = db.collection("users").doc(currentUsername);

    // Pehle Firebase se user ka balance check karenge
    userRef.get().then((doc) => {
        let currentCoins = doc.exists ? (doc.data().coins || 0) : 0;

        // Agar entry fee 0 se zyada hai aur balance kam hai, tabhi roke
if (entryFee > 0 && currentCoins < entryFee) {
    alert("⚠️ Insufficient balance! Aapke wallet mein kam coins hain. Please pehle paise add karein.");
    return;
}


        // Match save hoga aur username bhi jud jayega
        db.collection('joined_matches').add({
            tournamentId: tournamentId,
            slotNumber: slotNum,
            playerName: playerName,
            entryFee: entryFee,
            username: currentUsername, // 👈 Username save ho raha hai
            joinedAt: new Date()
        }).then(() => {
            let updatedCoins = currentCoins - entryFee;
            userRef.update({ coins: updatedCoins });

            alert("🎉 Successfully Joined Match at Slot " + slotNum + "!\nEntry fee deducted from wallet.");
            let pModal = document.getElementById('payment-modal');
            if (pModal) pModal.remove();
            let tModal = document.getElementById('dynamic-tournament-modal');
            if (tModal) tModal.remove();
            showWhatsAppJoinPopup();

        }).catch((error) => {
            alert("Error joining match: " + error.message);
        });
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

window.filterContests = function (statusType) {
    let currentUsername = localStorage.getItem('logged_in_username') || localStorage.getItem('loggedInUser') || localStorage.getItem('username');

    if (!currentUsername) {
        alert("Kripya pehle Login karein!");
        return;
    }

    db.collection('joined_matches')
        .where('username', '==', currentUsername)
        .get()
        .then((snapshot) => {
            let joinedList = [];
            let promises = [];

            snapshot.forEach((doc) => {
                let matchData = doc.data();
                if (!matchData.tournamentId) return;

                let p = db.collection('tournaments').doc(matchData.tournamentId).get().then((tDoc) => {
                    if (tDoc.exists) {
                        let tData = tDoc.data();
                        let currentStatus = tData.status ? tData.status.toLowerCase() : 'upcoming';

                        if (currentStatus === statusType.toLowerCase()) {
                            let rid = tData.roomId || tData.room_id || tData.roomID;
if (!rid || rid === "undefined" || rid === "null") {
    rid = "Not Provided Yet";
}


                            let rPass = tData.roomPassword || tData.room_pass || tData.password;
                            if (!rPass || rPass === "undefined" || rPass === "null") rPass = 'Not Provided Yet';

                            joinedList.push({
                                title: tData.title || tData.name || 'Custom Room Tournament',
                                slot: matchData.slotNumber || 1,
                                playerName: matchData.playerName || currentUsername,
                                entryFee: matchData.entryFee || 0,
                                prizePool: tData.prizePool || 0,
                                roomId: rId,
                                roomPass: rPass,
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
            console.error("Error fetching joined contests: ", error);
            alert("Error: " + error.message);
        });
};



window.filterContests = function(status) {
    let dbStatus = status.toLowerCase();
    let user = auth.currentUser;

    db.collection("tournaments")
    .where("status", "==", dbStatus)
    .get()
    .then((querySnapshot) => {
        let userTournaments = [];
        querySnapshot.forEach((doc) => {
            let data = doc.data();
            // Agar participants array mein user ki ID hai, tabhi dikhayein
            if (data.participants && data.participants.includes(user ? user.uid : "")) {
                userTournaments.push({id: doc.id, ...data});
            }
        });
        showMyContestsModal(status, userTournaments);
    })
    .catch((error) => {
        alert("Error: " + error.message);
    });
};

function showMyContestsModal(statusType, contests) {
    let existingModal = document.getElementById('my-contests-modal');
    if (existingModal) existingModal.remove();

    let modalHTML = `
    <div id="my-contests-modal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:9999; display:flex; justify-content:center; align-items:center;">
        <div style="background:#1e1e1e; border:1px solid #444; border-radius:12px; padding:20px; width:90%; max-width:400px; max-height:80vh; overflow-y:auto;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <h3 style="color:#ff9800; margin:0; text-transform:uppercase;">My ${statusType} Contests</h3>
                <button onclick="document.getElementById('my-contests-modal').remove()" style="background:#ff4444; color:#fff; border:none; padding:5px 10px; border-radius:5px; cursor:pointer;">Close</button>
            </div>
            <div id="contests-list-container">`;

    if (contests.length === 0) {
        modalHTML += `
                <div style="text-align:center; padding:30px 20px; color:#aaa;">
                    <p style="font-size:16px;">No ${statusType} contests found!</p>
                    <p style="font-size:13px; color:#666;">Join a match from categories to see it here.</p>
                </div>`;
    } else {
        contests.forEach(c => {
            modalHTML += `
                <div style="background:#222; border:1px solid #444; border-radius:10px; padding:15px; margin-bottom:15px;">
                    <h4 style="margin:0 0 8px 0; color:#fff;">${c.title}</h4>
                    <div style="display:flex; justify-content:space-between; font-size:13px; color:#ccc; margin-bottom:8px;">
                        <span>Player: <b>${c.playerName || 'N/A'}</b></span>
                        <span>Slot: <b style="color:#ff9800;">${c.slot || '1'}</b></span>
                    </div>
                    <div style="display:flex; justify-content:space-between; font-size:13px; color:#ffcc00; margin-bottom:8px;">
                        <span>Prize Pool: ₹${c.prizePool}</span>
                        <span>Entry: ₹${c.entryFee}</span>
                    </div>
                    <div style="background:#111; border:1px dashed #555; padding:10px; border-radius:6px; font-size:13px;">
                        <span style="color:#00e676;">🔑 Room ID: <b>${c.roomId || 'Waiting'}</b></span><br>
                        <span style="color:#00e676;">🔒 Password: <b>${c.roomPass || 'Waiting'}</b></span>
                    </div>
                </div>`;
        });
    }

    modalHTML += `</div></div></div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}



// --- COMPLETE UPI REDIRECT + QR CODE + UTR ADMIN SYSTEM ---

window.openAddCoinsModal = function() {
    let existingModal = document.getElementById('add-money-modal');
    if (existingModal) existingModal.remove();

    let defaultName = localStorage.getItem('temp_deposit_name') || (document.getElementById('profile-username') ? document.getElementById('profile-username').innerText : "User");
    let defaultAmount = localStorage.getItem('temp_deposit_amount') || '';

    let modalHTML = `
    <div id="add-money-modal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:10002; display:flex; justify-content:center; align-items:center; font-family:sans-serif; color:white; padding:15px; overflow-y:auto;">
        <div style="background:#1e1e1e; border:1px solid #444; border-radius:12px; padding:20px; width:100%; max-width:350px; box-shadow:0 4px 20px rgba(0,0,0,0.5); text-align:center;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <h3 style="color:#ff9800; margin:0;">Add Money to Wallet</h3>
                <button onclick="document.getElementById('add-money-modal').remove()" style="background:#ff4444; color:white; border:none; padding:5px 10px; border-radius:5px; font-weight:bold; cursor:pointer;">X</button>
            </div>
            
            <div style="margin-bottom:10px; text-align:left;">
                <label style="font-size:12px; color:#ccc;">Aapka Naam:</label>
                <input type="text" id="depositName" value="${defaultName}" style="width:100%; padding:8px; margin-top:3px; background:#111; border:1px solid #555; color:white; border-radius:6px; font-size:14px; box-sizing:border-box;">
            </div>

            <div style="margin-bottom:10px; text-align:left;">
                <label style="font-size:12px; color:#ccc;">Amount (₹):</label>
                <input type="number" id="depositAmount" value="${defaultAmount}" placeholder="e.g. 100" style="width:100%; padding:8px; margin-top:3px; background:#111; border:1px solid #555; color:white; border-radius:6px; font-size:14px; box-sizing:border-box;">
            </div>

            <!-- Step 1: Direct UPI App Redirect Button -->
            <button onclick="redirectToUpiApp()" style="width:100%; background:#00e676; color:black; border:none; padding:10px; border-radius:6px; font-weight:bold; font-size:14px; cursor:pointer; margin-bottom:10px;">
                1. Pay via UPI App (GPay/PhonePe)
            </button>

            <p style="font-size:11px; color:#aaa; margin:6px 0;">— YA PHIR QR CODE SCAN KAREIN —</p>
            
            <!-- Naya QR Code Display -->
            <div style="background:white; padding:6px; border-radius:8px; display:inline-block; margin-bottom:6px;">
                <img src="https://raw.githubusercontent.com/Abhisheksstore/Clutchzone/main/24455.jpg" alt="QR Code" style="width:140px; height:140px; object-fit:contain;" onerror="this.src='24455.jpg'">
            </div>
            
            <div style="background:#262626; padding:5px; border-radius:6px; font-size:12px; color:#00e676; margin-bottom:10px; font-weight:bold;">
                UPI ID: kinggkwrrd@okicici
            </div>

            <hr style="border:0; border-top:1px solid #444; margin:10px 0;">

            <!-- Step 2: UTR Submission -->
            <div style="text-align:left; margin-bottom:10px;">
                <label style="font-size:12px; color:#ff9800; font-weight:bold;">2. Enter 12-digit UTR / Ref Number (Payment ke baad):</label>
                <input type="text" id="depositUtr" placeholder="e.g. 4321XXXXXXXX" style="width:100%; padding:8px; margin-top:3px; background:#111; border:1px solid #555; color:white; border-radius:6px; font-size:14px; box-sizing:border-box;">
            </div>

            <button onclick="submitDepositRequestToAdmin()" style="width:100%; background:#2196f3; color:white; border:none; padding:11px; border-radius:6px; font-weight:bold; font-size:14px; cursor:pointer;">
                Submit to Admin
            </button>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
};

window.redirectToUpiApp = function() {
    const amount = parseInt(document.getElementById('depositAmount').value);
    const name = document.getElementById('depositName').value.trim();
    
    if (!amount || amount <= 0) {
        alert("Kripya pehle sahi amount enter karein!");
        return;
    }
    
    localStorage.setItem('temp_deposit_amount', amount);
    localStorage.setItem('temp_deposit_name', name);

    const merchantUpiID = "kinggkwrrd@okicici"; 
    const merchantName = "Clutchzone";
    const transactionNote = "Wallet Deposit";
    const upiUrl = `upi://pay?pa=${merchantUpiID}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;
    
    window.location.href = upiUrl;
};

window.submitDepositRequestToAdmin = function() {
    const name = document.getElementById('depositName').value.trim();
    const amount = parseInt(document.getElementById('depositAmount').value);
    const utr = document.getElementById('depositUtr').value.trim();
    
    if (!name) {
        alert("Kripya apna naam enter karein!");
        return;
    }
    if (!amount || amount <= 0) {
        alert("Kripya amount enter karein!");
        return;
    }
    if (!utr || utr.length < 8) {
        alert("Kripya valid 12-digit UTR / Transaction ID enter karein!");
        return;
    }

    db.collection('deposits').add({
        username: name,
        amount: amount,
        utr: utr,
        status: 'Pending',
        createdAt: new Date()
    }).then(() => {
        alert("✅ Aapki deposit request admin ke paas bhej di gayi hai! Verification ke baad coins add kar diye jayenge.");
        localStorage.removeItem('temp_deposit_amount');
        localStorage.removeItem('temp_deposit_name');
        document.getElementById('add-money-modal').remove();
    }).catch(err => {
        console.log(err);
        alert("Kuch error ho gaya, dobara try karein.");
    });
};

window.updateWalletUI = function() {
    let dep = parseInt(localStorage.getItem('dep_balance')) || 0;
    let win = parseInt(localStorage.getItem('win_balance')) || 0;
    let bon = parseInt(localStorage.getItem('bon_balance')) || 0;
    let total = dep + win + bon;

    if(document.getElementById('dep-bal')) document.getElementById('dep-bal').innerText = dep;
    if(document.getElementById('win-bal')) document.getElementById('win-bal').innerText = win;
    if(document.getElementById('bon-bal')) document.getElementById('bon-bal').innerText = bon;
    
    if(document.getElementById('wallet-total-balance')) document.getElementById('wallet-total-balance').innerText = total;
    if(document.getElementById('balance')) document.getElementById('balance').innerText = total;
    if(document.getElementById('user-balance')) document.getElementById('user-balance').innerText = total;
};

document.addEventListener("DOMContentLoaded", () => {
    updateWalletUI();
});

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
        // Yahan saara login data clear karna zaroori hai
        localStorage.removeItem('is_logged_in');
        localStorage.removeItem('loggedInUser');
        localStorage.removeItem('username');
        localStorage.removeItem('logged_in_username');
        
        alert("Logged out successfully!");
        window.location.reload();
    }
};


// Initializer
document.addEventListener('DOMContentLoaded', () => {
    console.log("PLAYT24 User App Loaded Successfully!");
});
// --- NEW LOGIN & REGISTER SYSTEM (Add this at the very bottom of script.js) ---

document.addEventListener("DOMContentLoaded", () => {
    checkAuthStatus();
});

window.checkAuthStatus = function() {
    let isLoggedIn = localStorage.getItem('is_logged_in');
    if (!isLoggedIn) {
        showAuthModal();
    } else {
        let userName = localStorage.getItem('logged_in_username') || "User";
        let profileEl = document.getElementById('profile-username');
        if(profileEl) profileEl.innerText = userName;
    }
};

window.showAuthModal = function() {
    let existing = document.getElementById('auth-modal');
    if (existing) existing.remove();

    let modalHTML = `
    <div id="auth-modal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.95); z-index:20000; display:flex; justify-content:center; align-items:center; font-family:sans-serif; color:white; padding:15px; overflow-y:auto;">
        <div style="background:#1e1e1e; border:1px solid #444; border-radius:12px; padding:20px; width:100%; max-width:350px; box-shadow:0 4px 20px rgba(0,0,0,0.8); text-align:center;">
            <h2 id="auth-title" style="color:#ff9800; margin-top:0;">Login to Clutchzone</h2>
            
            <div style="display:flex; margin-bottom:15px; border-bottom:1px solid #444;">
                <button id="tab-login-btn" onclick="switchAuthTab('login')" style="flex:1; background:none; border:none; color:#ff9800; padding:10px; font-weight:bold; cursor:pointer; border-bottom:2px solid #ff9800;">Login</button>
                <button id="tab-reg-btn" onclick="switchAuthTab('register')" style="flex:1; background:none; border:none; color:#aaa; padding:10px; font-weight:bold; cursor:pointer;">Register</button>
            </div>

            <div id="login-form-div">
                <div style="margin-bottom:12px; text-align:left;">
                    <label style="font-size:12px; color:#ccc;">Mobile Number or Email:</label>
                    <input type="text" id="login-identifier" placeholder="Enter mobile or email" style="width:100%; padding:9px; margin-top:4px; background:#111; border:1px solid #555; color:white; border-radius:6px; font-size:14px; box-sizing:border-box;">
                </div>
                <div style="margin-bottom:15px; text-align:left;">
                    <label style="font-size:12px; color:#ccc;">Password:</label>
                    <input type="password" id="login-password" placeholder="Enter password" style="width:100%; padding:9px; margin-top:4px; background:#111; border:1px solid #555; color:white; border-radius:6px; font-size:14px; box-sizing:border-box;">
                </div>
                <button onclick="handleLogin()" style="width:100%; background:#00e676; color:black; border:none; padding:12px; border-radius:6px; font-weight:bold; font-size:14px; cursor:pointer;">Login</button>
            </div>

            <div id="register-form-div" style="display:none;">
                <div style="margin-bottom:10px; text-align:left;">
                    <label style="font-size:12px; color:#ccc;">Full Name:</label>
                    <input type="text" id="reg-name" placeholder="Enter your name" style="width:100%; padding:9px; margin-top:4px; background:#111; border:1px solid #555; color:white; border-radius:6px; font-size:14px; box-sizing:border-box;">
                </div>
                <div style="margin-bottom:10px; text-align:left;">
                    <label style="font-size:12px; color:#ccc;">Mobile Number or Email:</label>
                    <input type="text" id="reg-identifier" placeholder="Enter mobile or email" style="width:100%; padding:9px; margin-top:4px; background:#111; border:1px solid #555; color:white; border-radius:6px; font-size:14px; box-sizing:border-box;">
                </div>
                <div style="margin-bottom:15px; text-align:left;">
                    <label style="font-size:12px; color:#ccc;">Password:</label>
                    <input type="password" id="reg-password" placeholder="Create password" style="width:100%; padding:9px; margin-top:4px; background:#111; border:1px solid #555; color:white; border-radius:6px; font-size:14px; box-sizing:border-box;">
                </div>
                <button onclick="handleRegister()" style="width:100%; background:#2196f3; color:white; border:none; padding:12px; border-radius:6px; font-weight:bold; font-size:14px; cursor:pointer;">Register & Login</button>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
};

window.switchAuthTab = function(tab) {
    let loginDiv = document.getElementById('login-form-div');
    let regDiv = document.getElementById('register-form-div');
    let loginBtn = document.getElementById('tab-login-btn');
    let regBtn = document.getElementById('tab-reg-btn');
    let title = document.getElementById('auth-title');

    if (tab === 'login') {
        loginDiv.style.display = 'block';
        regDiv.style.display = 'none';
        loginBtn.style.color = '#ff9800';
        loginBtn.style.borderBottom = '2px solid #ff9800';
        regBtn.style.color = '#aaa';
        regBtn.style.borderBottom = 'none';
        title.innerText = 'Login to Clutchzone';
    } else {
        loginDiv.style.display = 'none';
        regDiv.style.display = 'block';
        regBtn.style.color = '#2196f3';
        regBtn.style.borderBottom = '2px solid #2196f3';
        loginBtn.style.color = '#aaa';
        loginBtn.style.borderBottom = 'none';
        title.innerText = 'Register on Clutchzone';
    }
};
window.handleRegister = function() {
    let name = document.getElementById('reg-name').value.trim();
    let identifier = document.getElementById('reg-identifier').value.trim();
    let password = document.getElementById('reg-password').value.trim();

    if (!name || !identifier || !password) {
        alert("Kripya sabhi fields bharein!");
        return;
    }

    db.collection('users').doc(identifier).get().then((doc) => {
        if (doc.exists) {
            alert("Yeh mobile/email pehle se registered hai! Kripya Login karein.");
            switchAuthTab('login');
        } else {
            db.collection('users').doc(identifier).set({
                name: name,
                identifier: identifier,
                mobile: identifier,
                email: identifier,
                password: password,
                createdAt: new Date()
            }).then(() => {
                localStorage.setItem('is_logged_in', 'true');
                localStorage.setItem('logged_in_username', name);
                localStorage.setItem('logged_in_identifier', identifier);
                alert("✅ Registration successful!");
                let modal = document.getElementById('auth-modal');
                if (modal) modal.remove();
                location.reload();
            }).catch((err) => {
                console.log(err);
                alert("Registration failed. Try again.");
            });
        }
    }).catch((err) => {
        console.log(err);
        alert("Error checking user. Try again.");
    });
};



window.handleLogin = function() {
    let identifier = document.getElementById('login-identifier').value.trim();
    let password = document.getElementById('login-password').value.trim();

    if (!identifier || !password) {
        alert("Kripya mobile/email aur password daalein!");
        return;
    }

    db.collection('users').doc(identifier).get().then((doc) => {
        if (!doc.exists) {
            alert("Yeh user registered nahi hai! Kripya pehle Register karein.");
            switchAuthTab('register');
        } else {
            let userData = doc.data();
            if (userData.password === password) {
                localStorage.setItem('is_logged_in', 'true');
                localStorage.setItem('logged_in_username', userData.name);
                localStorage.setItem('logged_in_identifier', userData.identifier);
                alert("✅ Login successful!");
                let modal = document.getElementById('auth-modal');
                if (modal) modal.remove();
                location.reload();
            } else {
                alert("❌ Galat password! Kripya dobara try karein.");
            }
        }
    }).catch(err => {
        console.log(err);
        alert("Login error. Try again.");
    });
};

window.logoutUser = function() {
    localStorage.removeItem('is_logged_in');
    localStorage.removeItem('logged_in_username');
    localStorage.removeItem('logged_in_identifier');
    alert("Aap logout ho chuke hain.");
    location.reload();
};
// User ka unique name ya ID
let currentUsername = localStorage.getItem('logged_in_username') || localStorage.getItem('loggedInUser') || localStorage.getItem('username');


// Wallet balance load karne ka function
function loadUserWallet() {
    if (!currentUsername) return;

    db.collection("users").doc(currentUsername).get().then((doc) => {
        let coins = 0;
        if (doc.exists && doc.data().coins !== undefined) {
            coins = doc.data().coins;
            localStorage.setItem('userCoins', coins);
        } else {
            db.collection("users").doc(currentUsername).set({
                coins: 0,
                username: currentUsername
            }, { merge: true });
            coins = 0;
        }

        // Screen par jahan wallet balance dikhta hai wahan update kar do
        let balanceElements = document.querySelectorAll('.wallet-amount, #wallet-amount');
        balanceElements.forEach(el => {
            el.innerText = coins;
        });

        let balanceElement = document.getElementById('wallet-balance-text');
        if (balanceElement) {
            balanceElement.innerText = "₹ " + coins;
        }
    }).catch((error) => {
        console.error("Wallet load karne mein error: ", error);
    });
}

// Page khulte hi balance load hoga
window.addEventListener("DOMContentLoaded", function() {
    loadUserWallet();
});
window.loadMatchLeaderboard = function(matchId, tournamentTitle, prizePool, perKill) {
    db.collection("joined_matches")
        .where("matchId", "==", matchId)
        .orderBy("kills", "desc")
        .get()
        .then((snapshot) => {
            let html = `
            <div style="background:#0f172a; color:#fff; padding:15px; border-radius:10px; max-height:80vh; overflow-y:auto;">
                <h3 style="color:#f97316; margin-bottom:5px; font-size:16px;">${tournamentTitle || "Match Result"}</h3>
                <p style="font-size:12px; color:#aaa; margin-bottom:15px;">Full Results & Leaderboard</p>
                
                <div style="display:flex; justify-content:space-between; background:#1e293b; padding:10px; border-radius:8px; margin-bottom:15px; font-size:13px; border:1px solid #334155;">
                    <div>Prize Pool: <b style="color:#f97316;">₹${prizePool || 0}</b></div>
                    <div>Per Kill: <b style="color:#eab308;">₹${perKill || 0}</b></div>
                </div>
                
                <table style="width:100%; border-collapse:collapse; font-size:13px;">
                    <thead>
                        <tr style="background:#0284c7; color:#fff;">
                            <th style="padding:10px; text-align:center; width:40px; border-top-left-radius:6px; border-bottom-left-radius:6px;">#</th>
                            <th style="padding:10px; text-align:left;">Player Name</th>
                            <th style="padding:10px; text-align:center;">Kill</th>
                            <th style="padding:10px; text-align:center; border-top-right-radius:6px; border-bottom-right-radius:6px;">Winning</th>
                        </tr>
                    </thead>
                    <tbody>`;
            
            if(snapshot.empty) {
                html += `<tr><td colspan="4" style="text-align:center; padding:20px; color:#aaa;">Is match mein koi player nahi mila.</td></tr>`;
            } else {
                let rank = 1;
                snapshot.forEach((doc) => {
                    let data = doc.data();
                    let playerName = data.playerName || data.username || "Player";
                    let kills = data.kills || 0;
                    let earnings = data.earnings || 0;
                    
                    html += `
                    <tr style="border-bottom:1px solid #334155;">
                        <td style="padding:10px; text-align:center; font-weight:bold; color:#f97316;">${rank}</td>
                        <td style="padding:10px; font-weight:bold; color:#fff;">${playerName}</td>
                        <td style="padding:10px; text-align:center; color:#38bdf8; font-weight:bold;">${kills}</td>
                        <td style="padding:10px; text-align:center; color:#22c55e; font-weight:bold;">₹${earnings}</td>
                    </tr>`;
                    rank++;
                });
            }
            
            html += `</tbody></table></div>`;
            showCustomModal("Match Result", html);
        })
        .catch((err) => {
            console.error("Leaderboard error:", err);
            alert("Leaderboard load karne mein error aaya.");
        });
};
window.filterContests = function(status) {
    let dbStatus = status.toLowerCase(); 
    db.collection("tournaments")
    .where("status", "==", dbStatus)
    .get()
    .then((querySnapshot) => {
        showTournamentListModal(status + " Contests", querySnapshot);
    })
    .catch((error) => {
        alert("Error: " + error.message);
    });
};
window.joinTournament = function(tournamentId, entryFee) {
    // 1. LocalStorage se current logged-in username lein
    let currentUsername = localStorage.getItem('logged_in_username') || localStorage.getItem('loggedUserName') || localStorage.getItem('loggedInUser');
    
    if (!currentUsername) {
        alert("Please login first!");
        return;
    }

    let ffNameInput = document.querySelector('input[placeholder*="FF Name"]') || document.getElementById('playerNameInput');
    let playerName = ffNameInput ? ffNameInput.value.trim() : "";

    if (!playerName) {
        alert("Please enter your Free Fire Username!");
        return;
    }

    let userRef = db.collection("users").doc(currentUsername);
    let tournamentRef = db.collection("tournaments").doc(tournamentId);

    Promise.all([userRef.get(), tournamentRef.get()]).then(([userDoc, tournamentDoc]) => {
        if (!tournamentDoc.exists) {
            alert("Tournament not found!");
            return;
        }

        let tournamentData = tournamentDoc.data();
        let participants = tournamentData.participants || [];

        if (participants.includes(currentUsername)) {
            alert("You have already joined this match!");
            return;
        }

        let userData = userDoc.exists ? userDoc.data() : {};
        // Coins ya balance field check karein
        let walletBalance = userData.coins !== undefined ? userData.coins : (userData.balance || 0); 

        if (entryFee > 0 && walletBalance < entryFee) {
            alert("❌ Insufficient Balance! Aapke wallet mein ₹" + walletBalance + " hain, lekin entry fee ₹" + entryFee + " hai. Pehle Add Money karein.");
            return; 
        }

        let newBalance = walletBalance;
        if (entryFee > 0) {
            newBalance = walletBalance - entryFee;
        }

        let batch = db.batch();
        // Dono fields (coins aur balance) update kar dein taaki kahin mismatch na ho
        batch.set(userRef, { coins: newBalance, balance: newBalance }, { merge: true });

        participants.push(currentUsername);
        batch.update(tournamentRef, { participants: participants });

        batch.commit().then(() => {
            if (entryFee > 0) {
                alert("🎉 Successfully Joined Match!\n₹" + entryFee + " deducted from your wallet.\nRemaining Balance: ₹" + newBalance);
            } else {
                alert("🎉 Successfully Joined Free Match!");
            }
            location.reload();
        });

    }).catch((error) => {
        alert("Error: " + error.message);
    });
};

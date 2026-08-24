// ==========================================
// 1. FIREBASE INITIALIZATION
// ==========================================
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp({
        apiKey: "AIzaSyA1jgyhtyv0fGNicgciT-JjUunyv3zVLJ8",
        authDomain: "ff-tournaments-af47a.firebaseapp.com",
        projectId: "ff-tournaments-af47a",
        storageBucket: "ff-tournaments-af47a.appspot.com",
        messagingSenderId: "238745686365",
        appId: "1:238745686365:web:03e9d5e1dd150dbe2d8hd"
    });
}
const db = firebase.firestore();


// ==========================================
// 2. TAB SWITCHING LOGIC
// ==========================================
window.smstchTab = function(tabName) {
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

    if (tabName === 'matches' || tabName === 'upcoming' || tabName === 'joined') {
        loadMyJoinedMatches();
    }
    if (tabName === 'profile') {
        loadUserProfileStats();
    }
};


// ==========================================
// 3. TOURNAMENT CATEGORY & LISTING
// ==========================================
window.openCategory = function(catName) {
    localStorage.setItem('selectedCategory', catName);
    loadTournamentsForCategory(catName);
};

function loadTournamentsForCategory(categoryName) {
    let dbCategory = categoryName;
    if (categoryName === 'Clash Squad') dbCategory = 'CS';
    
    db.collection('tournaments')
      .where('category', '==', dbCategory)
      .get()
      .then((querySnapshot) => {
          showTournamentListModal(categoryName, querySnapshot);
      })
      .catch((error) => {
          alert("Error: " + error.message);
      });
}

window.showTournamentListModal = function(categoryName, querySnapshot) {
    let existingModal = document.getElementById("dynamic-tournament-modal");
    if (existingModal) existingModal.remove();

    let modalHTML = `
    <div id="dynamic-tournament-modal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.95); z-index:9998; display:flex; flex-direction:column; padding:15px; overflow-y:auto;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; background:#1c1c1c; padding:10px 15px; border-radius:8px;">
            <h2 style="margin:0; font-size:16px; color:#ffcc00; text-transform:uppercase;">${categoryName} Tournaments</h2>
            <button onclick="document.getElementById('dynamic-tournament-modal').remove()" style="background:#ff4444; color:#fff; border:none; padding:6px 12px; border-radius:4px; font-weight:bold; cursor:pointer;">X</button>
        </div>
        <div id="tournaments-cards-container" style="flex:1; overflow-y:auto;"></div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    let container = document.getElementById("tournaments-cards-container");
    if (!container) return;

    if (querySnapshot.empty) {
        container.innerHTML = `<div style="color:#fff; text-align:center; padding:20px; font-size:14px;">No rooms found for ${categoryName}!</div>`;
        return;
    }

    querySnapshot.forEach((doc) => {
        let d = doc.data();
        let docId = doc.id;
        let title = d.title || d.name || 'Tournament';
        let entryFee = d.entry !== undefined ? d.entry : (d.entryFee || 0);
let prize = d.prize !== undefined ? d.prize : (d.prizePool || 0);
let perKill = d.kill !== undefined ? d.kill : (d.perKill || 0);

        let timeVal = d.startTime || d.time;
        if (timeVal && new Date(timeVal) < new Date()) return; 
        let timeString = timeVal ? new Date(timeVal).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

        let cardHTML = `
        <div style="background: linear-gradient(135deg, #1e1e2f, #2d1b4e); border-radius: 12px; padding: 15px; margin-bottom: 15px; color: #fff; border: 1px solid #4a3d7a;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h3 style="margin: 0; font-size: 16px; color: #ffcc00;">${title}</h3>
                <span style="font-size: 11px; background: #7c4dff; padding: 3px 8px; border-radius: 4px; color:#fff;">${timeString}</span>
            </div>
            <div style="display: flex; justify-content: space-between; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 8px; margin-bottom: 12px; font-size: 13px;">
                <div>🔥 ENTRY: <b style="color: #00e676;">₹${entryFee}</b></div>
                <div>🏆 PRIZE: <b style="color: #ffcc00;">₹${prize}</b></div>
                <div>💀 KILL: <b style="color: #ff4444;">₹${perKill}</b></div>
            </div>
            <button onclick="openSlotSelection('${docId}', '${title}', ${entryFee}, '${categoryName}')" style="width:100%; background: #ff9800; color: #fff; border: none; padding: 10px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 13px;">JOIN NOW</button>
        </div>`;
        container.insertAdjacentHTML('beforeend', cardHTML);
    });
};


// ==========================================
// 4. SLOT SELECTION & DOUBLE-JOIN RESTRICTION
// ==========================================
window.openSlotSelection = function(tournamentId, title, entryFee, category) {
    let currentUsername = localStorage.getItem('logged_in_username') || localStorage.getItem('loggedUserName') || localStorage.getItem('logged_in_identifier');
    if (!currentUsername) { alert("Pehle login karein!"); return; }

    db.collection('tournaments').doc(tournamentId).get().then((doc) => {
        if (!doc.exists) { alert("Tournament not found!"); return; }
        let data = doc.data();
        let bookedSlots = data.slots || {};
        let participants = data.participants || [];

        if (participants.includes(currentUsername)) {
            alert("⚠️ Aap pehle hi is tournament mein join kar chuke hain! Dobara join nahi kar sakte.");
            return;
        }

        let maxSlots = 48;
        let tlower = (title + " " + (category || "")).toLowerCase();
        if (tlower.includes('1v1') || tlower.includes('lone wolf')) maxSlots = 2;
        else if (tlower.includes('2v2')) maxSlots = 4;
        else if (tlower.includes('clash squad') || tlower.includes('cs')) maxSlots = 8;

        let slotHTML = `
        <div id="slot-selection-modal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.95); z-index:9999; display:flex; flex-direction:column; padding:15px; overflow-y:auto;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; background:#1c1c1c; padding:10px 15px; border-radius:8px;">
                <h3 style="margin:0; color:#ffcc00; font-size:15px;">Select Slot & Join</h3>
                <button onclick="document.getElementById('slot-selection-modal').remove()" style="background:#ff4444; color:#fff; border:none; padding:6px 12px; border-radius:4px; font-weight:bold; cursor:pointer;">X</button>
            </div>
            
            <div style="background:#1a1a2e; padding:12px; border-radius:8px; margin-bottom:15px; text-align:center; border:1px solid #3f51b5;">
                <p style="margin:0 0 5px 0; font-size:13px; color:#aaa;">Tournament: <b style="color:#fff;">${title}</b></p>
                <p style="margin:0 0 5px 0; font-size:13px; color:#aaa;">Entry Fee: <b style="color:#00e676;">₹${entryFee}</b></p>
            </div>

            <p style="color:#fff; font-size:13px; margin-bottom:10px; font-weight:bold;">Choose your slot number:</p>
            <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:8px; margin-bottom:15px; max-height:220px; overflow-y:auto; background:#111; padding:10px; border-radius:8px;">`;

        for (let i = 1; i <= maxSlots; i++) {
            let bookedBy = bookedSlots[i];
            if (bookedBy) {
                slotHTML += `
                <div style="background:#2a2a2a; border:1px solid #444; padding:10px; text-align:center; border-radius:6px; opacity:0.6;">
                    <span style="font-size:11px; color:#aaa;"><b>Slot ${i}</b></span><br>
                    <span style="font-size:8px; color:#ff5252; display:block; overflow:hidden; text-overflow:ellipsis;">${bookedBy}</span>
                </div>`;
            } else {
                slotHTML += `
                <div onclick="selectThisSlot(${i}, '${tournamentId}', '${title}', ${entryFee})" id="slot-btn-${i}" class="selectable-slot-btn" style="background:#1e1e1e; border:1px solid #555; padding:10px; text-align:center; border-radius:6px; cursor:pointer;">
                    <span style="font-size:12px; color:#fff;"><b>Slot ${i}</b></span>
                </div>`;
            }
        }
        slotHTML += `</div></div>`;
        document.body.insertAdjacentHTML('beforeend', slotHTML);
    });
};

window.selectThisSlot = function(slotNum, tournamentId, title, entryFee) {
    document.querySelectorAll('.selectable-slot-btn').forEach(el => {
        el.style.background = '#1e1e1e';
        el.style.borderColor = '#555';
    });
    let btn = document.getElementById(`slot-btn-${slotNum}`);
    if (btn) {
        btn.style.background = '#7c4dff';
        btn.style.borderColor = '#00e676';
    }

    setTimeout(() => {
        let modal = document.getElementById('slot-selection-modal');
        if (modal) modal.remove();
        showPaymentScreen(tournamentId, title, entryFee, slotNum);
    }, 300);
};


// ==========================================
// 5. PAYMENT & JOIN TRANSACTION
// ==========================================
window.showPaymentScreen = function(tournamentId, title, entryFee, slotNum) {
    let currentUsername = localStorage.getItem('logged_in_username') || localStorage.getItem('loggedUserName') || localStorage.getItem('logged_in_identifier');
    
    db.collection('users').doc(currentUsername).get().then((doc) => {
        let userWalletBalance = doc.exists && doc.data().coins !== undefined ? doc.data().coins : 0;
        let existingModal = document.getElementById("payment-modal");
        if (existingModal) existingModal.remove();

        let paymentHTML = `
        <div id="payment-modal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.95); z-index:10000; display:flex; flex-direction:column; padding:15px; justify-content:center;">
            <div style="background:#1c1c1c; border-radius:12px; padding:20px; border:1px solid #444; color:#fff; max-width:400px; margin:0 auto; width:100%;">
                <div style="text-align: center; background: #2a004e; padding: 15px; border-radius: 10px; margin-bottom: 20px;">
                    <span style="font-size: 28px;">💰</span>
                    <h1 style="margin: 5px 0 0 0; color: #ffcc00;">₹${userWalletBalance}</h1>
                    <p style="margin: 5px 0 12px 0; font-size: 12px; color: #aaa;">Wallet Balance</p>
                </div>

                <div style="background: #141046; padding: 15px; border-radius: 10px; margin-bottom: 20px; border: 1px solid #5a189a;">
                    <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold;">Enter Free Fire Username</p>
                    <p style="margin: 0 0 10px 0; font-size: 12px; color:#aaa;">Selected Slot: <b>${slotNum}</b></p>
                    <input type="text" id="ff-player-name" placeholder="Enter FF Name" style="background: #10002b; border: 1px solid #7b2cbf; color: #fff; padding: 10px; width: 100%; border-radius: 6px; font-size: 14px;">
                </div>

                <p style="text-align:center; font-size:14px; margin-bottom:15px;">Total Payable: <b style="color: #ffcc00;">₹${entryFee}</b></p>
                <button onclick="confirmAndJoinMatch('${tournamentId}', ${entryFee}, ${slotNum})" style="width: 100%; background: #7b2cbf; color: #fff; border: none; padding: 12px; border-radius: 8px; font-weight: bold; font-size: 15px; cursor: pointer;">CONFIRM & JOIN</button>
                <button onclick="document.getElementById('payment-modal').remove()" style="width: 100%; background: #333; color: #fff; border: none; padding: 10px; border-radius: 8px; font-weight: bold; font-size: 13px; cursor: pointer; margin-top: 10px;">CANCEL</button>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', paymentHTML);
    });
};

window.confirmAndJoinMatch = function(tournamentId, entryFee, slotNum) {
    let playerName = document.getElementById('ff-player-name').value.trim();
    if (!playerName) { alert("Kripya apna Free Fire Player Name bharein!"); return; }

    let currentUsername = localStorage.getItem('logged_in_username') || localStorage.getItem('loggedUserName') || localStorage.getItem('logged_in_identifier');
    let userRef = db.collection('users').doc(currentUsername);
    let tournamentRef = db.collection('tournaments').doc(tournamentId);

    userRef.get().then((userDoc) => {
        let currentCoins = userDoc.exists && userDoc.data().coins !== undefined ? userDoc.data().coins : 0;
        if (entryFee > 0 && currentCoins < entryFee) {
            alert("⚠️ Insufficient balance! Wallet mein coins kam hain.");
            return;
        }

        db.runTransaction((transaction) => {
            return transaction.get(tournamentRef).then((doc) => {
                let data = doc.data();
                let bookedSlots = data.slots || {};
                let participants = data.participants || [];

                if (participants.includes(currentUsername)) throw "Aap pehle hi join kar chuke hain!";
                if (bookedSlots[slotNum]) throw "Yeh slot koi aur le chuka hai!";

                bookedSlots[slotNum] = playerName;
                participants.push(currentUsername);

                transaction.update(tournamentRef, { slots: bookedSlots, participants: participants });
            });
        }).then(() => {
            userRef.update({ coins: currentCoins - entryFee });
            db.collection('joined_matches').add({
                tournamentId: tournamentId, username: currentUsername, playerName: playerName, slotNumber: slotNum, entryFee: entryFee, joinedAt: new Date()
            });
            alert("✅ Successfully Joined Match!");
            document.querySelectorAll('[id$="-modal"]').forEach(m => m.remove());
            location.reload();
        }).catch(err => alert(err));
    });
};


// ==========================================
// 6. JOINED MATCHES & VIEW MORE SCREEN
// ==========================================
function loadMyJoinedMatches() {
    let currentUsername = localStorage.getItem('logged_in_username') || localStorage.getItem('loggedUserName') || localStorage.getItem('logged_in_identifier');
    if (!currentUsername) return;

    let container = document.getElementById('joined-matches-container') || document.getElementById('upcoming-matches-container');
    if (!container) return;

    db.collection('joined_matches').where('username', '==', currentUsername).get().then((snapshot) => {
        if (snapshot.empty) {
            container.innerHTML = `<div style="color:#fff; text-align:center; padding:20px;">Aapne koi match join nahi kiya hai!</div>`;
            return;
        }
        container.innerHTML = "";
        snapshot.forEach((joinDoc) => {
            let jData = joinDoc.data();
            db.collection('tournaments').doc(jData.tournamentId).get().then((tDoc) => {
                if (!tDoc.exists) return;
                let tData = tDoc.data();
                let title = tData.title || tData.name || 'Tournament';

                let itemHTML = `
                <div onclick="openJoinedMatchDetails('${jData.tournamentId}')" style="background: linear-gradient(135deg, #1e1e2f, #3a1c4e); border-radius: 12px; padding: 15px; margin-bottom: 12px; color: #fff; border: 1px solid #7e22ce; cursor:pointer;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <h4 style="margin: 0; font-size: 15px; color: #ffcc00;">${title}</h4>
                        <span style="font-size: 11px; background: #0d9488; padding: 3px 8px; border-radius: 4px;">JOINED (Slot ${jData.slotNumber})</span>
                    </div>
                    <p style="margin:0; font-size:12px; color:#aaa;">Player Name: <b>${jData.playerName}</b></p>
                </div>`;
                container.insertAdjacentHTML('beforeend', itemHTML);
            });
        });
    });
}

window.openJoinedMatchDetails = function(tournamentId) {
    db.collection('tournaments').doc(tournamentId).get().then((doc) => {
        if (!doc.exists) return;
        let d = doc.data();
        let title = d.title || d.name || 'Tournament';
        let entryFee = d.entryFee || 0;
        let mapName = d.map || 'BERMUDA';
        let startTime = d.startTime || d.time || new Date().toISOString();

        let modalHTML = `
        <div id="match-details-modal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:#121212; z-index:10005; display:flex; flex-direction:column; overflow-y:auto; color:#fff;">
            <div style="display:flex; align-items:center; background:#1c1c1c; padding:15px; border-bottom:1px solid #333;">
                <button onclick="document.getElementById('match-details-modal').remove()" style="background:none; border:none; color:#fff; font-size:20px; cursor:pointer; margin-right:15px;">&#8592;</button>
                <h2 style="margin:0; font-size:16px;">View More</h2>
            </div>
            <div style="padding:15px; flex:1; overflow-y:auto;">
                <p style="color:#a855f7; font-size:11px; margin:0 0 5px 0;">*ROOM ID AND PASSWORD WILL DISPLAYED HERE 4 TO 6 MINS PRIOR TO MATCH</p>
                
                <!-- Room ID Box -->
                <div style="background:#1a1128; border:1px solid #7e22ce; border-radius:8px; height:120px; display:flex; align-items:center; justify-content:center; text-align:center; padding:10px; margin-bottom:15px;">
                    <span style="color:#ffcc00; font-size:14px; font-weight:bold;">Room id and Password will be display here</span>
                </div>

                <!-- View Match / View Entries Toggle Buttons -->
                <div style="display:flex; border-radius:6px; overflow:hidden; margin-bottom:15px; text-align:center; font-weight:bold;">
                    <div style="flex:1; padding:12px; background:#0d9488; color:#fff;">VIEW MATCH</div>
                    <div onclick="openViewEntriesModal('${tournamentId}')" style="flex:1; padding:12px; background:#0f766e; color:#fff; cursor:pointer;">VIEW ENTRIES</div>
                </div>

                <!-- Countdown Timer -->
                <div style="background:#7e22ce; border-radius:10px; padding:15px; text-align:center; margin-bottom:20px;">
                    <div style="font-weight:bold; margin-bottom:10px; font-size:14px;">Game Start In</div>
                    <div style="display:flex; justify-content:center; gap:10px;" id="countdown-timer-container">
                        <div style="background:rgba(0,0,0,0.3); border-radius:50%; width:45px; height:45px; display:flex; flex-direction:column; align-items:center; justify-content:center;"><span id="cd-days" style="font-size:12px;">0</span><span style="font-size:8px;">Days</span></div>
                        <div style="background:rgba(0,0,0,0.3); border-radius:50%; width:45px; height:45px; display:flex; flex-direction:column; align-items:center; justify-content:center;"><span id="cd-hours" style="font-size:12px;">0</span><span style="font-size:8px;">Hours</span></div>
                        <div style="background:rgba(0,0,0,0.3); border-radius:50%; width:45px; height:45px; display:flex; flex-direction:column; align-items:center; justify-content:center;"><span id="cd-mins" style="font-size:12px;">0</span><span style="font-size:8px;">Mins</span></div>
                        <div style="background:rgba(0,0,0,0.3); border-radius:50%; width:45px; height:45px; display:flex; flex-direction:column; align-items:center; justify-content:center;"><span id="cd-secs" style="font-size:12px;">0</span><span style="font-size:8px;">Secs</span></div>
                    </div>
                </div>

                <h3 style="color:#38bdf8; font-size:15px; margin-bottom:10px;">${title}</h3>
                <div style="display:flex; gap:8px; margin-bottom:12px;">
                    <span style="background:#262626; padding:6px 10px; border-radius:6px; font-size:12px;">Map: ${mapName}</span>
                    <span style="background:#262626; padding:6px 10px; border-radius:6px; font-size:12px;">Fee: ₹${entryFee}</span>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        startCountdown(startTime);
    });
};

window.openViewEntriesModal = function(tournamentId) {
    db.collection('tournaments').doc(tournamentId).get().then((doc) => {
        if (!doc.exists) return;
        let bookedSlots = doc.data().slots || {};
        let modalHTML = `
        <div id="view-entries-modal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:10010; display:flex; align-items:center; justify-content:center; padding:15px;">
            <div style="background:#fff; color:#000; width:100%; max-width:380px; border-radius:12px; overflow:hidden; max-height:80vh; display:flex; flex-direction:column;">
                <div style="background:#7e22ce; color:#fff; padding:12px; text-align:center; position:relative;">
                    <h3 style="margin:0; font-size:15px;">VIEW PARTICIPANTS</h3>
                    <button onclick="document.getElementById('view-entries-modal').remove()" style="position:absolute; right:12px; top:12px; background:none; border:none; color:#fff; font-size:16px; cursor:pointer;">✕</button>
                </div>
                <div style="padding:15px; overflow-y:auto; flex:1; font-size:13px;">`;
        if (Object.keys(bookedSlots).length === 0) modalHTML += `<p style="text-align:center; color:#666;">No participants yet.</p>`;
        for (let slot in bookedSlots) {
            modalHTML += `<div style="padding:6px 0; border-bottom:1px solid #eee;">• Slot ${slot}: <b>${bookedSlots[slot]}</b></div>`;
        }
        modalHTML += `</div></div></div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    });
};

function startCountdown(targetTimeStr) {
    let targetDate = new Date(targetTimeStr).getTime();
    let timerInterval = setInterval(() => {
        let distance = targetDate - new Date().getTime();
        if (distance < 0) { clearInterval(timerInterval); return; }
        let dEl = document.getElementById('cd-days');
        let hEl = document.getElementById('cd-hours');
        let mEl = document.getElementById('cd-mins');
        let sEl = document.getElementById('cd-secs');
        if (dEl) dEl.innerText = Math.floor(distance / (1000 * 60 * 60 * 24));
        if (hEl) hEl.innerText = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        if (mEl) mEl.innerText = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        if (sEl) sEl.innerText = Math.floor((distance % (1000 * 60)) / 1000);
    }, 1000);
}


// ==========================================
// 7. PROFILE PAGE OPTIONS & HOST ID DISPLAY
// ==========================================
function loadUserProfileStats() {
    let currentUsername = localStorage.getItem('logged_in_username') || localStorage.getItem('loggedUserName') || localStorage.getItem('logged_in_identifier');
    if (!currentUsername) return;

    db.collection('joined_matches').where('username', '==', currentUsername).get().then(snap => {
        let matchesPlayed = snap.size;
        let matchesEl = document.getElementById('profile-matches-played');
        if (matchesEl) matchesEl.innerText = matchesPlayed;
    });

    // Check & Display Host ID below username on Profile Page
    db.collection('users').doc(currentUsername).get().then(doc => {
        if (doc.exists) {
            let data = doc.data();
            let hostId = data.hostId;
            if (hostId) {
                let profileTab = document.getElementById('profile-tab');
                if (profileTab && !document.getElementById('profile-host-badge')) {
                    let headerBox = profileTab.querySelector('h3') || profileTab.firstElementChild;
                    if (headerBox) {
                        headerBox.insertAdjacentHTML('afterend', `<div id="profile-host-badge" style="background:linear-gradient(135deg, #7b2cbf, #2a004e); padding:8px 12px; border-radius:6px; margin:10px 0; text-align:center; border:1px solid #ffcc00;"><span style="font-size:12px; color:#ffcc00; font-weight:bold;">👑 Host ID: ${hostId}</span></div>`);
                    }
                }
            }
        }
    });
}

window.openMyProfile = function() {
    let username = localStorage.getItem('logged_in_username') || 'User';
    alert("👤 Profile Info:\nUsername: " + username);
};

window.openMyWallet = function() {
    let currentUsername = localStorage.getItem('logged_in_username') || '';
    db.collection('users').doc(currentUsername).get().then(doc => {
        let coins = doc.exists && doc.data().coins !== undefined ? doc.data().coins : 0;
        alert("💰 Your Wallet Balance: ₹" + coins);
    }).catch(() => alert("💰 Wallet Balance: ₹0"));
};

window.openMyStatistics = function() {
    let currentUsername = localStorage.getItem('logged_in_username') || '';
    db.collection('joined_matches').where('username', '==', currentUsername).get().then(snap => {
        alert("📊 Statistics:\nMatches Played: " + snap.size + "\nTotal Kills: 0\nPlayCoin Won: ₹0");
    });
};

window.openTopPlayers = function() {
    alert("🏆 Top Players Leaderboard coming soon!");
};

window.openReferAndEarn = function() {
    alert("🎁 Refer & Earn:\nShare your referral code with friends and earn ₹10 per referral!");
};

window.openNotifications = function() {
    alert("🔔 Notifications:\nNo new notifications right now.");
};

window.openContactUs = function() {
    alert("📞 Contact Us:\nEmail support@clutchzone.com or message via Help Center.");
};

window.openFAQ = function() {
    alert("❓ FAQ:\n1. How to join match? Select tournament, choose slot and pay fee.\n2. When is Room ID given? 5 mins before match start.");
};

window.toggleMusic = function() {
    alert("🎵 Music settings toggled!");
};


// ==========================================
// 8. BECOME A HOST SYSTEM & PLANS (ClutchZone)
// ==========================================
window.openBecomeHost = function() {
    let currentUsername = localStorage.getItem('logged_in_username') || localStorage.getItem('loggedUserName') || localStorage.getItem('logged_in_identifier');
    if (!currentUsername) { alert("Pehle login karein!"); return; }

    db.collection('users').doc(currentUsername).get().then(doc => {
        let data = doc.exists ? doc.data() : {};
        if (data.isHost || data.hostId) {
            // Already a host -> Open Hoster Panel
            openHosterPanel(data.hostId);
        } else {
            // Show Host Subscription Plans
            showHostPlansModal();
        }
    }).catch(() => {
        showHostPlansModal();
    });
};

function showHostPlansModal() {
    let existing = document.getElementById('host-plans-modal');
    if (existing) existing.remove();

    let modalHTML = `
    <div id="host-plans-modal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.95); z-index:10000; display:flex; flex-direction:column; padding:15px; justify-content:center; align-items:center;">
        <div style="background:#1c1c1c; border-radius:12px; padding:20px; border:1px solid #7b2cbf; color:#fff; max-width:400px; width:100%; box-sizing:border-box;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <h3 style="margin:0; color:#ffcc00; font-size:16px;">👑 ClutchZone Host Plans</h3>
                <button onclick="document.getElementById('host-plans-modal').remove()" style="background:#ff4444; color:#fff; border:none; padding:6px 12px; border-radius:4px; font-weight:bold; cursor:pointer;">X</button>
            </div>

            <div style="background:#2a004e; padding:10px; border-radius:8px; margin-bottom:15px; text-align:center; border:1px solid #7b2cbf;">
                <p style="margin:0; font-size:12px; color:#aaa;">Merchant: <b style="color:#fff;">Rajesh Pandit</b> | App: <b style="color:#ffcc00;">ClutchZone</b></p>
            </div>

            <!-- Host Plans Options -->
            <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:15px;">
                <div onclick="selectHostPlan('1 Week', 150)" style="background:#222; border:1px solid #555; padding:12px; border-radius:8px; cursor:pointer; display:flex; justify-content:space-between; align-items:center;">
                    <div><b>1 Week Plan</b><br><small style="color:#aaa;">Post custom rooms for 7 days</small></div>
                    <div style="color:#00e676; font-weight:bold; font-size:16px;">₹150</div>
                </div>
                <div onclick="selectHostPlan('1 Month', 250)" style="background:#222; border:1px solid #555; padding:12px; border-radius:8px; cursor:pointer; display:flex; justify-content:space-between; align-items:center;">
                    <div><b>1 Month Plan</b><br><small style="color:#aaa;">Post custom rooms for 30 days</small></div>
                    <div style="color:#00e676; font-weight:bold; font-size:16px;">₹250</div>
                </div>
                <div onclick="selectHostPlan('3 Months', 650)" style="background:#222; border:1px solid #555; padding:12px; border-radius:8px; cursor:pointer; display:flex; justify-content:space-between; align-items:center;">
                    <div><b>3 Months Plan</b><br><small style="color:#aaa;">Post custom rooms for 90 days</small></div>
                    <div style="color:#00e676; font-weight:bold; font-size:16px;">₹650</div>
                </div>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

window.selectHostPlan = function(planName, amount) {
    let existing = document.getElementById('host-plans-modal');
    if (existing) existing.remove();

    let paymentModalHTML = `
    <div id="host-pay-modal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.95); z-index:10001; display:flex; flex-direction:column; padding:15px; justify-content:center; align-items:center;">
        <div style="background:#1c1c1c; border-radius:12px; padding:20px; border:1px solid #7b2cbf; color:#fff; max-width:400px; width:100%; box-sizing:border-box;">
            <h3 style="margin:0 0 10px 0; color:#ffcc00; font-size:16px; text-align:center;">Pay for ${planName}</h3>
            <div style="background:#2a004e; padding:10px; border-radius:8px; margin-bottom:15px; text-align:center;">
                <p style="margin:0; font-size:13px; color:#aaa;">Amount: <b style="color:#00e676;">₹${amount}</b></p>
                <p style="margin:5px 0 0 0; font-size:12px; color:#ccc;">Merchant: <b>Rajesh Pandit</b> (ClutchZone)</p>
            </div>
            
            <button onclick="payHostPlanViaUpi('${planName}', ${amount})" style="width:100%; background:#7b2cbf; color:#fff; border:none; padding:12px; border-radius:8px; font-weight:bold; font-size:15px; cursor:pointer; margin-bottom:15px;">PAY VIA PHONEPE / UPI</button>
            
            <div style="border-top:1px solid #333; padding-top:15px;">
                <label style="font-size:12px; display:block; margin-bottom:5px; color:#aaa;">Payment ke baad UTR / Transaction ID daalein:</label>
                <input type="text" id="host-utr-input" placeholder="Enter 12-digit UTR No" style="background:#10002b; border:1px solid #444; color:#fff; padding:10px; width:100%; border-radius:6px; font-size:13px; margin-bottom:10px; box-sizing:border-box;">
                <button onclick="submitHostRequest('${planName}', ${amount})" style="width:100%; background:#0d9488; color:#fff; border:none; padding:10px; border-radius:8px; font-weight:bold; font-size:13px; cursor:pointer;">SUBMIT HOST REQUEST</button>
            </div>
            <button onclick="document.getElementById('host-pay-modal').remove()" style="width:100%; background:#333; color:#fff; border:none; padding:8px; border-radius:6px; margin-top:10px; cursor:pointer;">Cancel</button>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', paymentModalHTML);
};

window.payHostPlanViaUpi = function(planName, amount) {
    let upiId = "rajeshpandit@okaxis"; 
    let merchantName = "Rajesh Pandit";
    let transactionNote = `ClutchZone Host - ${planName}`;
    let upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;
    window.location.href = upiUrl;
};

window.submitHostRequest = function(planName, amount) {
    let utr = document.getElementById('host-utr-input').value.trim();
    let currentUsername = localStorage.getItem('logged_in_username') || localStorage.getItem('loggedUserName') || localStorage.getItem('logged_in_identifier');

    if (!currentUsername) { alert("Pehle login karein!"); return; }
    if (!utr) { alert("Kripya UTR number daalein!"); return; }

    db.collection('host_requests').add({
        username: currentUsername,
        planName: planName,
        amount: amount,
        utr: utr,
        status: 'Pending',
        createdAt: new Date()
    }).then(() => {
        alert("✅ Host request successfully submit ho gayi hai! Admin verify karke aapko Host ID allot kar denge.");
        let modal = document.getElementById('host-pay-modal');
        if (modal) modal.remove();
    }).catch(err => alert("Error: " + err.message));
};

window.openHosterPanel = function(hostId) {
    let existing = document.getElementById('hoster-panel-modal');
    if (existing) existing.remove();

    let html = `
    <div id="hoster-panel-modal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:#121212; z-index:10005; display:flex; flex-direction:column; overflow-y:auto; color:#fff;">
        <div style="display:flex; align-items:center; justify-content:space-between; background:#1c1c1c; padding:15px; border-bottom:1px solid #333;">
            <div style="display:flex; align-items:center;">
                <button onclick="document.getElementById('hoster-panel-modal').remove()" style="background:none; border:none; color:#fff; font-size:20px; cursor:pointer; margin-right:15px;">&#8592;</button>
                <h2 style="margin:0; font-size:16px; color:#ffcc00;">👑 ClutchZone Hoster Panel</h2>
            </div>
            <span style="background:#7b2cbf; padding:4px 8px; border-radius:4px; font-size:11px;">ID: ${hostId || 'HOST'}</span>
        </div>
        <div style="padding:15px; flex:1; overflow-y:auto;">
            <div style="background:#2a004e; border:1px solid #7b2cbf; border-radius:10px; padding:15px; margin-bottom:15px; text-align:center;">
                <h3 style="margin:0 0 5px 0; color:#00e676; font-size:16px;">Welcome Back, Host!</h3>
                <p style="margin:0; font-size:12px; color:#ccc;">Aap yahan se apne custom tournaments manage kar sakte hain.</p>
            </div>

            <!-- Saturday Payout Notice -->
            <div style="background:#1e1e2f; border-left:4px solid #ffcc00; padding:12px; border-radius:0 8px 8px 0; margin-bottom:15px;">
                <h4 style="margin:0 0 5px 0; font-size:14px; color:#ffcc00;">📅 Payout Notice</h4>
                <p style="margin:0; font-size:12px; color:#bbb;">Hoster ka payout <b>sirf Saturday (Saturday to Saturday)</b> ko process kiya jata hai. Kripya apna withdrawal request Saturday ko hi raise karein.</p>
            </div>

            <div style="display:flex; flex-direction:column; gap:10px;">
                <button onclick="alert('Host Tournament feature is active! Connect with admin to publish rooms.')" style="background:#0d9488; color:#fff; border:none; padding:12px; border-radius:8px; font-weight:bold; cursor:pointer;">CREATE NEW TOURNAMENT</button>
                <button onclick="alert('Payout requests can only be placed on Saturdays!')" style="background:#7b2cbf; color:#fff; border:none; padding:12px; border-radius:8px; font-weight:bold; cursor:pointer;">REQUEST PAYOUT (SATURDAY ONLY)</button>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
};


// ==========================================
// 9. DEPOSIT SYSTEM WITH UPI INTENT & MERCHANT: Rajesh Pandit
// ==========================================
window.openDepositModal = function() {
    let existingModal = document.getElementById("deposit-modal");
    if (existingModal) existingModal.remove();

    let modalHTML = `
    <div id="deposit-modal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.95); z-index:10000; display:flex; flex-direction:column; padding:15px; justify-content:center; align-items:center;">
        <div style="background:#1c1c1c; border-radius:12px; padding:20px; border:1px solid #444; color:#fff; max-width:400px; width:100%; box-sizing:border-box;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <h3 style="margin:0; color:#ffcc00; font-size:16px;">Add Money to Wallet (ClutchZone)</h3>
                <button onclick="document.getElementById('deposit-modal').remove()" style="background:#ff4444; color:#fff; border:none; padding:6px 12px; border-radius:4px; font-weight:bold; cursor:pointer;">X</button>
            </div>

            <!-- Merchant Info Box -->
            <div style="background:#2a004e; padding:12px; border-radius:8px; margin-bottom:15px; text-align:center; border:1px solid #7b2cbf;">
                <p style="margin:0 0 5px 0; font-size:13px; color:#aaa;">Merchant Name: <b style="color:#fff;">Rajesh Pandit</b></p>
                <p style="margin:0; font-size:12px; color:#00e676;">Secure UPI Deposit</p>
            </div>

            <!-- Amount Input -->
            <div style="margin-bottom:15px;">
                <label style="font-size:13px; display:block; margin-bottom:5px; color:#ccc;">Enter Amount (₹)</label>
                <input type="number" id="deposit-amount-input" placeholder="e.g. 100" style="background:#10002b; border:1px solid #7b2cbf; color:#fff; padding:12px; width:100%; border-radius:6px; font-size:14px; box-sizing:border-box;">
            </div>

            <!-- Pay via UPI Apps Button -->
            <button onclick="payViaUpiIntent()" style="width:100%; background:#7b2cbf; color:#fff; border:none; padding:12px; border-radius:8px; font-weight:bold; font-size:15px; cursor:pointer; margin-bottom:15px;">PAY VIA PHONEPE / UPI</button>
            
            <!-- UTR Verification Form -->
            <div style="border-top:1px solid #333; padding-top:15px;">
                <label style="font-size:12px; display:block; margin-bottom:5px; color:#aaa;">Payment ke baad yahan UTR / Transaction ID daalein:</label>
                <input type="text" id="deposit-utr-input" placeholder="Enter 12-digit UTR No" style="background:#10002b; border:1px solid #444; color:#fff; padding:10px; width:100%; border-radius:6px; font-size:13px; margin-bottom:10px; box-sizing:border-box;">
                <button onclick="submitDepositRequest()" style="width:100%; background:#0d9488; color:#fff; border:none; padding:10px; border-radius:8px; font-weight:bold; font-size:13px; cursor:pointer;">SUBMIT UTR FOR APPROVAL</button>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
};

window.payViaUpiIntent = function() {
    let amount = document.getElementById('deposit-amount-input').value.trim();
    if (!amount || amount <= 0) {
        alert("Kripya pehle valid amount daalein!");
        return;
    }
    
    let upiId = "rajeshpandit@okaxis"; 
    let merchantName = "Rajesh Pandit";
    let upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR&tn=ClutchZone%20Wallet%20Deposit`;
    
    window.location.href = upiUrl;
};

window.submitDepositRequest = function() {
    let amount = document.getElementById('deposit-amount-input').value.trim();
    let utr = document.getElementById('deposit-utr-input').value.trim();
    let currentUsername = localStorage.getItem('logged_in_username') || localStorage.getItem('loggedUserName') || localStorage.getItem('logged_in_identifier');

    if (!currentUsername) { 
        alert("Pehle login karein!"); 
        return; 
    }
    if (!amount || !utr) { 
        alert("Kripya Amount aur UTR dono fields bharein!"); 
        return; 
    }

    db.collection('deposits').add({
        username: currentUsername,
        amount: Number(amount),
        utr: utr,
        status: 'Pending',
        createdAt: new Date()
    }).then(() => {
        alert("✅ Deposit request successfully submit ho gayi hai! Admin verify karke wallet mein balance add kar denge.");
        document.getElementById('deposit-modal').remove();
    }).catch(err => {
        alert("Error: " + err.message);
    });
};
// ==========================================
// PROPER TAB SWITCHING HANDLER
// ==========================================
window.switchTab = function(tabName) {
    // 1. Sabhi tabs ko hide karein
    document.querySelectorAll('.app-tab-content').forEach(tab => {
        tab.style.display = 'none';
        tab.classList.remove('active');
    });

    // 2. Jis tab par click kiya hai use show karein
    let targetTab = document.getElementById(tabName + '-tab');
    if (targetTab) {
        targetTab.style.display = 'block';
        targetTab.classList.add('active');
    } else if (tabName === 'home') {
        let homeTab = document.getElementById('home-tab');
        if (homeTab) {
            homeTab.style.display = 'block';
            homeTab.classList.add('active');
        }
    }
};

window.openTopPlayers = function() {
    alert("🏆 Top Players Leaderboard coming soon!");
};

window.openSupport = function() {
    alert("📞 Support: Contact admin via Telegram/WhatsApp");
};
// ==========================================
// CLUTCHZONE POLICY, FAQ & ABOUT MODALS
// ==========================================

function showClutchzoneModal(title, contentHTML) {
    let existing = document.getElementById('clutchzone-info-modal');
    if (existing) existing.remove();

    let modalHTML = `
    <div id="clutchzone-info-modal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:9999; display:flex; flex-direction:column; padding:20px; color:#fff; overflow-y:auto;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid #333; padding-bottom:10px;">
            <h2 style="color:#ffcc00; margin:0; font-size:18px;">${title}</h2>
            <button onclick="document.getElementById('clutchzone-info-modal').remove()" style="background:#ff4444; color:#fff; border:none; padding:6px 12px; border-radius:4px; font-weight:bold; cursor:pointer;">✕ Close</button>
        </div>
        <div style="font-size:14px; line-height:1.6; color:#ddd; padding-bottom:30px;">
            ${contentHTML}
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// 1. FAQ Modal
window.openFAQ = function() {
    let content = `
        <p><b>💰 1. How to add cash?</b><br>👉 Go to Wallet → Click on Add Coins → Choose amount → Pay via UPI.<br>⚡ Balance instantly update ho jata hai.</p>
        <p><b>🎮 2. How to join match?</b><br>👉 App open karo → Mode select karo (CS / LW / Full Map) → Entry pay karo → Match join ho jayega.</p>
        <p><b>🆔 3. ID & Password kab milta hai?</b><br>👉 Match start se thoda pehle “My Matches” section me show hota hai.</p>
        <p><b>💸 4. How to withdraw money?</b><br>👉 Wallet → Withdraw → UPI ID enter karo → Amount select karo → Submit.</p>
        <p><b>⏱️ 5. Withdraw kitne time me aata hai?</b><br>👉 Usually instant se few hours (within 24 hours). Kabhi bank issue se thoda delay ho sakta hai.</p>
        <p><b>⚠️ 6. Match ID/Password nahi mila toh?</b><br>👉 Support pe contact karo: <a href="https://t.me/clutchzoneprime" target="_blank" style="color:#ffcc00;">Telegram</a></p>
        <p><b>🔒 7. Is Clutchzone safe?</b><br>👉 Yes, 100% secure platform hai. Fair play + active support available.</p>
        <p><b>🚫 8. Fake proof / abuse ka kya hoga?</b><br>👉 Fake payment / abuse = direct account ban.</p>
        <p><b>✉️ 9. Support kaise contact kare?</b><br>👉 Telegram: <a href="https://t.me/clutchzoneprime" target="_blank" style="color:#ffcc00;">https://t.me/clutchzoneprime</a></p>
        <p><b>🔄 10. Refund kab milta hai?</b><br>👉 Agar match cancel ya host issue hua ho.</p>
    `;
    showClutchzoneModal("FAQ - Clutchzone", content);
};

// 2. Privacy Policy Modal
window.openPrivacy = function() {
    let content = `
        <p>We value your privacy and are committed to protecting your personal information at <b>Clutchzone</b>.</p>
        <p>All user data is securely stored and is never shared with any third parties under any circumstances.</p>
        <p>The data we collect is used strictly to improve user experience and ensure smooth and fair gameplay.</p>
        <p><b>Account Security:</b> Your account security is your responsibility. Your password is private and visible only to you. Do not share your password with anyone, including the owner or any Clutchzone staff member.</p>
        <p><b>Official Support:</b> For any support or assistance, use only our official Telegram channel: <a href="https://t.me/clutchzoneprime" target="_blank" style="color:#ffcc00;">https://t.me/clutchzoneprime</a>. Please be cautious of fake accounts.</p>
        <p>Do not make any payments to staff members. No tips, fees, or additional charges are required.</p>
        <p>Stay informed, stay secure, and enjoy a safe gaming experience with Clutchzone!</p>
    `;
    showClutchzoneModal("Privacy Policy - Clutchzone", content);
};

// 3. Terms & Conditions Modal
window.openTerms = function() {
    let content = `
        <p>Welcome to <b>Clutchzone</b>. By accessing or using our platform, you agree to comply with the following terms and conditions.</p>
        <p><b>1. ELIGIBILITY:</b> Users must be 18 years or older to register and participate. Only one account per user/device/IP is allowed.</p>
        <p><b>2. FAIR PLAY POLICY:</b> All matches are strictly skill-based. Use of hacks, cheats, or unfair advantage will lead to an immediate permanent ban.</p>
        <p><b>3. PAYMENTS & ADD CASH:</b> All deposits are final and non-refundable except in valid technical error cases.</p>
        <p><b>4. WITHDRAWALS:</b> Withdrawals are processed within the specified time frame. Users must provide accurate UPI details.</p>
        <p><b>5. REFUND POLICY:</b> Refunds are only applicable in verified technical issues from our side.</p>
        <p><b>6. SUPPORT:</b> Official support channel: <a href="https://t.me/clutchzoneprime" target="_blank" style="color:#ffcc00;">https://t.me/clutchzoneprime</a>.</p>
        <p>Thank you for being a part of Clutchzone!</p>
    `;
    showClutchzoneModal("Terms & Conditions - Clutchzone", content);
};

// 4. About Us Modal
window.openAbout = function() {
    let content = `
        <p><b>Welcome to Clutchzone!</b></p>
        <p>Clutchzone is your premier esports tournament platform designed for gamers to compete, win exciting cash prizes, and showcase their gaming skills.</p>
        <p><b>Official Telegram Channel:</b> <a href="https://t.me/clutchzoneprime" target="_blank" style="color:#ffcc00;">https://t.me/clutchzoneprime</a></p>
        <p><b>App Version:</b> v1.11</p>
    `;
    showClutchzoneModal("About Us - Clutchzone", content);
};

// 5. Support / Contact Us Modal
window.openSupport = function() {
    let content = `
        <p><b>Need Help? Contact Clutchzone Support</b></p>
        <p>For any queries, match issues, or payment assistance, reach out to us directly on our official Telegram channel:</p>
        <p><a href="https://t.me/clutchzoneprime" target="_blank" style="color:#ffcc00; font-size:16px; font-weight:bold;">👉 Click here to join Telegram Support</a></p>
    `;
    showClutchzoneModal("Support - Clutchzone", content);
};

// --- 1. SAFE FIREBASE INITIALIZATION (No variable declarations to prevent crashes) ---
(function() {
    try {
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
    } catch (err) {
        console.error("Firebase init warning:", err);
    }
})();

// Helper to get Firestore safely
function getDb() {
    try {
        if (typeof firebase !== 'undefined' && firebase.apps.length) {
            return firebase.firestore();
        }
    } catch (e) {
        console.error("Firestore error:", e);
    }
    return null;
}

// --- 2. DYNAMIC SUB-MODE LOGIC ---
window.updateSubMode = function() {
    window.updateSubModes();
};

window.updateSubModes = function() {
    try {
        const categoryElement = document.getElementById('tournament-category');
        const subModeSelect = document.getElementById('tournament-submode');
        if (!categoryElement || !subModeSelect) return;

        const category = categoryElement.value;
        subModeSelect.innerHTML = '';

        if (category === 'Full Map') {
            subModeSelect.innerHTML = '<option value="Solo (48 Players)">Solo (48 Players)</option><option value="Duo (24 Teams)">Duo (24 Teams)</option><option value="Squad (12 Teams)">Squad (12 Teams)</option>';
        } else if (category === 'Survival') {
            subModeSelect.innerHTML = '<option value="Solo (48 Players)">Solo (48 Players)</option><option value="Duo (24 Teams)">Duo (24 Teams)</option>';
        } else if (category === 'CS') {
            subModeSelect.innerHTML = '<option value="1vs1">1vs1</option><option value="2vs2">2vs2</option><option value="4vs4">4vs4</option>';
        } else if (category === 'Lone Wolf') {
            subModeSelect.innerHTML = '<option value="1vs1">1vs1</option>';
        }
    } catch (err) {
        console.error("SubMode error:", err);
    }
};

// --- 3. SECTION SWITCHING ---
window.switchSection = function(sectionId, btn) {
    try {
        document.querySelectorAll('.admin-section').forEach(sec => {
            sec.style.display = 'none';
        });
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.style.display = 'block';
        }
        document.querySelectorAll('.nav-btn').forEach(b => {
            b.classList.remove('active');
        });
        if (btn) {
            btn.classList.add('active');
        }
    } catch (err) {
        alert("Section switch error: " + err.message);
    }
};

// --- 4. CREATE TOURNAMENT ---
window.createTournament = function() {
    try {
        const db = getDb();
        if (!db) { alert("Database not connected!"); return; }

        const hostCodeField = document.getElementById('hostCode') || document.getElementById('host-code');
        const titleField = document.getElementById('title') || document.getElementById('tournament-title');
        const categoryField = document.getElementById('tournament-category');
        const subModeField = document.getElementById('tournament-submode');
        const entryField = document.getElementById('entry') || document.getElementById('tournament-entry');
        const prizeField = document.getElementById('prize') || document.getElementById('tournament-prize');
        const killField = document.getElementById('kill') || document.getElementById('tournament-kill');
        const timeField = document.getElementById('startTime') || document.getElementById('tournament-time');

        const hostCode = hostCodeField ? hostCodeField.value.trim() : '';
        const title = titleField ? titleField.value.trim() : '';
        const category = categoryField ? categoryField.value : 'Full Map';
        const subMode = subModeField ? subModeField.value : '';
        const entryFee = entryField ? Number(entryField.value) : 0;
        const prizePool = prizeField ? Number(prizeField.value) : 0;
        const perKill = killField ? Number(killField.value) : 0;
        const startTime = timeField ? timeField.value : 'TBD';

        if (!hostCode || !title) {
            alert("Please enter Host Code and Title!");
            return;
        }

        db.collection('tournaments').add({
            hostCode: hostCode,
            title: title,
            category: category,
            subMode: subMode,
            entryFee: entryFee,
            prizePool: prizePool,
            perKill: perKill,
            startTime: startTime,
            status: 'Upcoming',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then(() => {
            alert("🚀 Tournament Launched Successfully!");
        })
        .catch((error) => {
            alert("Firebase Error: " + error.message);
        });

    } catch (err) {
        alert("Error: " + err.message);
    }
};

// --- 5. SAVE HOST PLAN ---
window.saveHostPlan = function() {
    try {
        const db = getDb();
        if (!db) { alert("Database not connected!"); return; }

        const hostCodeField = document.getElementById('manage-host-code') || document.getElementById('hostCode');
        const planTypeField = document.getElementById('manage-plan-type') || document.getElementById('select-plan');

        const hostCode = hostCodeField ? hostCodeField.value.trim() : '';
        const planType = planTypeField ? planTypeField.value : '₹250 - 1 Month Plan';

        if (!hostCode) {
            alert("Please enter Host Code!");
            return;
        }

        let days = 30;
        if (planType.includes("3 Months") || planType.includes("650")) {
            days = 90;
        }

        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + days);

        db.collection('hosts').doc(hostCode).set({
            hostCode: hostCode,
            plan: planType,
            active: true,
            expiresAt: expiryDate
        }, { merge: true }).then(() => {
            alert("✅ Host Plan Activated Successfully for code: " + hostCode);
        }).catch((error) => {
            alert("Error: " + error.message);
        });
    } catch (err) {
        alert("Error: " + err.message);
    }
};

// --- 6. UPDATE ROOM CREDENTIALS ---
window.updateRoomCredentials = function() {
    try {
        const db = getDb();
        if (!db) { alert("Database not connected!"); return; }

        const matchIdInput = document.querySelector('#room-section input') || document.querySelector('input[placeholder*="Match ID"]');
        const matchId = matchIdInput ? matchIdInput.value.trim() : '';

        if (!matchId) {
            alert("Please enter Match ID!");
            return;
        }

        db.collection('tournaments').doc(matchId).set({
            roomIdUpdated: true,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true }).then(() => {
            alert("🔑 Room Credentials Updated Successfully in Database!");
        }).catch((err) => {
            alert("Error updating room: " + err.message);
        });
    } catch (err) {
        alert("Error: " + err.message);
    }
};

// --- 7. SUBMIT RESULT ---
window.submitResult = function() {
    try {
        const db = getDb();
        if (!db) { alert("Database not connected!"); return; }

        const inputs = document.querySelectorAll('input');
        let matchId = '', uid = '', kills = 0, earnings = 0;

        inputs.forEach(input => {
            const placeholder = (input.placeholder || '').toLowerCase();
            if (placeholder.includes('match')) matchId = input.value.trim();
            if (placeholder.includes('uid') || placeholder.includes('player')) uid = input.value.trim();
            if (placeholder.includes('kill')) kills = Number(input.value) || 0;
            if (placeholder.includes('earning') || placeholder.includes('prize')) earnings = Number(input.value) || 0;
        });

        if (!matchId || !uid) {
            alert("Please enter Match ID and Player UID!");
            return;
        }

        db.collection('results').add({
            matchId: matchId,
            playerUid: uid,
            kills: kills,
            earnings: earnings,
            submittedAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            alert("✅ Result Submitted & Saved Successfully!");
        }).catch((err) => {
            alert("Error submitting result: " + err.message);
        });
    } catch (err) {
        alert("Error: " + err.message);
    }
};

// --- 8. MARK MATCH COMPLETE ---
window.markMatchComplete = function() {
    try {
        const db = getDb();
        if (!db) { alert("Database not connected!"); return; }

        const matchIdInput = document.querySelector('input[placeholder*="Match ID"]');
        const matchId = matchIdInput ? matchIdInput.value.trim() : '';

        if (!matchId) {
            alert("Please enter Match ID!");
            return;
        }

        db.collection('tournaments').doc(matchId).set({
            status: 'Completed',
            completedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true }).then(() => {
            alert("🏁 Match Marked Complete Successfully!");
        }).catch((err) => {
            alert("Error: " + err.message);
        });
    } catch (err) {
        alert("Error: " + err.message);
    }
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    if (typeof window.updateSubMode === 'function') {
        window.updateSubMode();
    }
});

document.addEventListener('change', function(e) {
    if (e.target && e.target.id === 'tournament-category') {
        if (typeof window.updateSubMode === 'function') {
            window.updateSubMode();
        }
    }
});
// --- SAFE ADDITION FOR DEPOSITS & USERS IN ADMIN PANEL ---

document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        loadPendingDepositsAdmin();
        loadRegisteredUsersAdmin();
    }, 1000);
});

// 1. Load Pending Deposits safely
window.loadPendingDepositsAdmin = function() {
    const db = getDb();
    if (!db) return;

    db.collection('deposits').where('status', '==', 'Pending').get().then((querySnapshot) => {
        // Agar aapke HTML mein koi container hai, toh wahan dikhayega
        querySnapshot.forEach((doc) => {
            let data = doc.data();
            let docId = doc.id;
            console.log("Pending Deposit found:", data.username, data.amount);
        });
    }).catch(err => {
        console.log("Error loading deposits: ", err);
    });
};

// 2. Load Registered Users safely
window.loadRegisteredUsersAdmin = function() {
    const db = getDb();
    if (!db) return;

    db.collection('users').get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            let user = doc.data();
            console.log("Registered User:", user.name);
        });
    }).catch(err => {
        console.log("Error loading users: ", err);
    });
};

// 3. Approve Deposit Function
window.approveDeposit = function(docId, username, amount) {
    const db = getDb();
    if (!db) { alert("Database not connected!"); return; }

    db.collection('deposits').doc(docId).update({
        status: 'Approved'
    }).then(() => {
        alert(`✅ Deposit approved for ${username} (₹${amount})!`);
        location.reload();
    }).catch(err => {
        console.log(err);
        alert("Error approving deposit.");
    });
};

// 4. Reject Deposit Function
window.rejectDeposit = function(docId) {
    const db = getDb();
    if (!db) { alert("Database not connected!"); return; }

    db.collection('deposits').doc(docId).update({
        status: 'Rejected'
    }).then(() => {
        alert("❌ Deposit rejected.");
        location.reload();
    }).catch(err => {
        console.log(err);
    });
};

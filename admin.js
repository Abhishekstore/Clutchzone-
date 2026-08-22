// --- SAFE FIREBASE INITIALIZATION ---
(function() {
    try {
        if (typeof firebase !== 'undefined' && !firebase.apps.length) {
            firebase.initializeApp({
                apiKey: "AizaSyA1jgyhtyv0fGnicgciT-JjUunyv3ZVLJ8",
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
    if (typeof window.updateSubModes === 'function') {
        window.updateSubModes();
    }
};

window.updateSubModes = function() {
    try {
        const categoryElement = document.getElementById('tournament-category');
        const subModeSelect = document.getElementById('tournament-submode');
        if (!categoryElement || !subModeSelect) return;

        const category = categoryElement.value;
        subModeSelect.innerHTML = '';

        if (category === 'Full Map') {
            subModeSelect.innerHTML = '<option value="Solo (48 Players)">Solo (48 Players)</option><option value="Duo (96 Players)">Duo (96 Players)</option><option value="Squad (100 Players)">Squad (100 Players)</option>';
        } else if (category === 'Survival') {
            subModeSelect.innerHTML = '<option value="Solo">Solo</option><option value="Squad">Squad</option>';
        } else if (category === 'CS') {
            subModeSelect.innerHTML = '<option value="1v1">1v1</option><option value="2v2">2v2</option><option value="4v4">4v4</option>';
        } else if (category === 'Lone Wolf') {
            subModeSelect.innerHTML = '<option value="1v1">1v1</option>';
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
        
        // Auto refresh lists on section change
        if (sectionId === 'users' || sectionId === 'users-section') {
            renderNumberedUsersList();
        }
        if (sectionId === 'deposit' || sectionId === 'deposit-section') {
            renderNumberedDepositManagement();
        }
    } catch (err) {
        alert("Section switch error: " + err.message);
    }
};

// --- 4. CREATE TOURNAMENT (Automatic Time Expiration Support ke sath) ---
window.createTournament = function() {
    try {
        const db = getDb();
        if (!db) { alert("Database not connected!"); return; }

        const hostCodeField = document.getElementById('hostCode') || document.getElementById('manage-host-code');
        const titleField = document.getElementById('title');
        const categoryField = document.getElementById('tournament-category');
        const subModeField = document.getElementById('tournament-submode');
        const entryField = document.getElementById('entry');
        const prizeField = document.getElementById('prize');
        const killField = document.getElementById('kill');
        const timeField = document.getElementById('startTime');

        const hostCode = hostCodeField ? hostCodeField.value.trim() : '';
        const title = titleField ? titleField.value.trim() : '';
        const category = categoryField ? categoryField.value : 'Full Map';
        const subMode = subModeField ? subModeField.value : '';
        const entryFee = entryField ? Number(entryField.value) : 0;
        const prizePool = prizeField ? Number(prizeField.value) : 0;
        const perKill = killField ? Number(killField.value) : 0;
        const startTime = timeField ? timeField.value : '';

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
            startTime: startTime, // Isme tournament ka exact time save hoga
            status: 'Upcoming',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            alert("🚀 Tournament Launched Successfully! Time khatam hone par yeh automatic app se hat jayega.");
            location.reload();
        }).catch((error) => {
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

        const hostCodeField = document.getElementById('manage-host-code');
        const planTypeField = document.getElementById('manage-plan-type');

        const hostCode = hostCodeField ? hostCodeField.value.trim() : '';
        const planType = planTypeField ? planTypeField.value : '₹250 - 1 Month Plan';

        if (!hostCode) {
            alert("Please enter Host Code!");
            return;
        }

        let days = 30;
        if (planType.includes('3 Months') || planType.includes('650')) {
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
        }).catch((error) => {
            alert("Error updating room: " + error.message);
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
        }).catch((error) => {
            alert("Error: " + error.message);
        });
    } catch (err) {
        alert("Error: " + err.message);
    }
};

// --- 9. NUMBERED USERS & DEPOSITS DISPLAY FUNCTIONS ---

window.renderNumberedUsersList = function() {
    const db = getDb();
    if (!db) return;

    db.collection('users').get().then((querySnapshot) => {
        let targetDiv = null;
        let elements = document.querySelectorAll('*');
        elements.forEach(el => {
            if (el.childNodes.length === 1 && el.innerText && (el.innerText.includes('Loading users') || el.innerText.includes('No users registered'))) {
                targetDiv = el;
            }
        });

        if (targetDiv) {
            let html = "";
            if (querySnapshot.empty) {
                html = "<p style='color:#aaa; font-size:14px;'>No users registered yet.</p>";
            } else {
                let index = 1;
                querySnapshot.forEach((doc) => {
                    let user = doc.data();
                    html += `
                        <div style="background:#262626; padding:12px; margin:10px 0; border-radius:8px; border:1px solid #444; text-align:left; color:white;">
                            <p style="margin:0 0 6px 0; font-size:15px; color:#ff9800;"><b>${index}. Name: ${user.name || 'User'}</b></p>
                            <p style="margin:4px 0; font-size:13px; color:#ccc;"><b>Mobile / Email:</b> ${user.identifier || user.email || 'N/A'}</p>
                            <hr style="border:0; border-top:1px solid #555; margin:10px 0;">
                        </div>
                    `;
                    index++;
                });
            }
            targetDiv.innerHTML = html;
        }
    }).catch(err => console.log("User list error:", err));
};

window.renderNumberedDepositManagement = function() {
    const db = getDb();
    if (!db) return;

    db.collection('deposits').where('status', '==', 'Pending').get().then((querySnapshot) => {
        let targetDiv = null;
        let elements = document.querySelectorAll('*');
        elements.forEach(el => {
            if (el.childNodes.length === 1 && el.innerText && el.innerText.includes('No pending deposits')) {
                targetDiv = el;
            }
        });

        if (targetDiv) {
            let html = "";
            if (querySnapshot.empty) {
                html = "<p style='color:#aaa; font-size:14px; margin:5px 0;'>No pending deposits.</p>";
            } else {
                let index = 1;
                querySnapshot.forEach((doc) => {
                    let data = doc.data();
                    let docId = doc.id;
                    let senderName = data.senderName || data.username || 'N/A';
                    
                    html += `
                        <div style="background:#262626; padding:14px; margin:12px 0; border-radius:8px; border:1px solid #444; text-align:left; color:white;">
                            <p style="margin:0 0 6px 0; font-size:16px; color:#ff9800;"><b>${index}. User Name: ${data.username || 'N/A'}</b></p>
                            <p style="margin:4px 0; font-size:13px; color:#ccc;"><b>Mobile / Email:</b> ${data.userIdentifier || 'N/A'}</p>
                            <p style="margin:4px 0; font-size:14px; color:#00e676;"><b>Payment Amount:</b> ₹${data.amount}</p>
                            <p style="margin:4px 0; font-size:13px; color:#ffeb3b;"><b>UTR Number:</b> ${data.utr}</p>
                            <p style="margin:4px 0; font-size:13px; color:#03a9f4;"><b>Sender Name (Paisa Aaya Naam):</b> ${senderName}</p>
                            <hr style="border:0; border-top:1px solid #555; margin:10px 0;">
                            
                            <div style="margin-top:10px;">
                                <label style="font-size:12px; color:#aaa; display:block; margin-bottom:3px;">Add Coins/Money to User Wallet:</label>
                                <input type="number" id="coin-input-${docId}" value="${data.amount}" style="width:100%; padding:8px; margin-bottom:8px; background:#111; border:1px solid #555; color:white; border-radius:5px; box-sizing:border-box; font-size:14px;">
                                <div style="display:flex; gap:8px;">
                                    <button onclick="approveAndAddWalletCoins('${docId}', '${data.userIdentifier}', '${data.username}')" style="background:#00e676; color:black; border:none; padding:9px 14px; border-radius:5px; font-weight:bold; cursor:pointer; font-size:13px; flex:1;">Approve & Add Coins</button>
                                    <button onclick="rejectDepositAdmin('${docId}')" style="background:#ff4444; color:white; border:none; padding:9px 14px; border-radius:5px; font-weight:bold; cursor:pointer; font-size:13px;">Reject</button>
                                </div>
                            </div>
                        </div>
                    `;
                    index++;
                });
            }
            targetDiv.innerHTML = html;
        }
    }).catch(err => console.log("Deposit load error:", err));
};

window.approveAndAddWalletCoins = function(docId, userIdentifier, username) {
    const db = getDb();
    if (!db) return;

    let inputVal = document.getElementById(`coin-input-${docId}`).value;
    let amountToAdd = Number(inputVal);

    if (!amountToAdd || amountToAdd <= 0) {
        alert("Kripya valid coin/money amount daalein!");
        return;
    }

    if (!userIdentifier || userIdentifier === "N/A") {
        db.collection('deposits').doc(docId).update({ status: 'Approved' }).then(() => {
            alert(`✅ Deposit approved successfully!`);
            location.reload();
        });
        return;
    }

    db.collection('users').doc(userIdentifier).get().then((userDoc) => {
        let currentBal = 0;
        if (userDoc.exists && userDoc.data().dep_balance) {
            currentBal = Number(userDoc.data().dep_balance);
        }

        let newBalance = currentBal + amountToAdd;

        db.collection('users').doc(userIdentifier).update({
            dep_balance: newBalance
        }).then(() => {
            db.collection('deposits').doc(docId).update({
                status: 'Approved'
            }).then(() => {
                alert(`✅ Successfully added ₹${amountToAdd} to ${username}'s wallet!`);
                location.reload();
            });
        });
    }).catch(err => {
        console.log(err);
        alert("Error updating wallet: " + err.message);
    });
};

window.rejectDepositAdmin = function(docId) {
    const db = getDb();
    if (!db) return;
    db.collection('deposits').doc(docId).update({
        status: 'Rejected'
    }).then(() => {
        alert("❌ Deposit rejected.");
        location.reload();
    }).catch(err => alert("Error: " + err.message));
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    if (typeof window.updateSubMode === 'function') {
        window.updateSubMode();
    }
    setTimeout(() => {
        renderNumberedUsersList();
        renderNumberedDepositManagement();
    }, 1000);
});

document.addEventListener('change', function(e) {
    if (e.target && e.target.id === 'tournament-category') {
        if (typeof window.updateSubMode === 'function') {
            window.updateSubMode();
        }
    }
});
// --- HOST PLANS MANAGEMENT ADD-ON CODE ---

// 1. Automatically inject User Name and Mobile fields inside Manage Host Plans section
window.injectHostInputFields = function() {
    let hostCodeInput = document.getElementById('manage-host-code');
    if (hostCodeInput && !document.getElementById('host-user-name')) {
        let parentBox = hostCodeInput.parentElement;
        let wrapper = document.createElement('div');
        wrapper.id = 'dynamic-host-inputs';
        wrapper.innerHTML = `
            <div style="margin-top:8px; text-align:left;">
                <label style="font-size:12px; color:#aaa; display:block; margin-bottom:2px;">User Name:</label>
                <input type="text" id="host-user-name" placeholder="Enter User Name" style="width:100%; padding:8px; margin-bottom:8px; background:#111; border:1px solid #555; color:white; border-radius:5px; box-sizing:border-box; font-size:14px;">
                <label style="font-size:12px; color:#aaa; display:block; margin-bottom:2px;">Mobile / Email:</label>
                <input type="text" id="host-user-mobile" placeholder="Enter Mobile or Email" style="width:100%; padding:8px; margin-bottom:8px; background:#111; border:1px solid #555; color:white; border-radius:5px; box-sizing:border-box; font-size:14px;">
            </div>
        `;
        parentBox.insertBefore(wrapper, hostCodeInput.nextSibling);
    }
};

// 2. Updated saveHostPlan function to include User Name & Mobile
window.saveHostPlan = function() {
    try {
        const db = getDb();
        if (!db) { alert("Database not connected!"); return; }

        const hostCodeField = document.getElementById('manage-host-code');
        const planTypeField = document.getElementById('manage-plan-type');
        const userNameField = document.getElementById('host-user-name');
        const userMobileField = document.getElementById('host-user-mobile');

        const hostCode = hostCodeField ? hostCodeField.value.trim() : '';
        const planType = planTypeField ? planTypeField.value : '₹250 - 1 Month Plan';
        const userName = userNameField ? userNameField.value.trim() : 'N/A';
        const userMobile = userMobileField ? userMobileField.value.trim() : 'N/A';

        if (!hostCode) {
            alert("Please enter Host Code!");
            return;
        }

        let days = 30;
        if (planType.includes('3 Months') || planType.includes('650')) {
            days = 90;
        }

        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + days);

        db.collection('hosts').doc(hostCode).set({
            hostCode: hostCode,
            userName: userName,
            userMobile: userMobile,
            plan: planType,
            active: true,
            expiresAt: expiryDate,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true }).then(() => {
            alert("✅ Host Plan Activated & Saved Successfully!");
            location.reload();
        }).catch((error) => {
            alert("Error: " + error.message);
        });
    } catch (err) {
        alert("Error: " + err.message);
    }
};

// 3. Render Numbered Host List (1, 2, 3...)
window.renderHostPlansList = function() {
    const db = getDb();
    if (!db) return;

    db.collection('hosts').get().then((querySnapshot) => {
        let targetDiv = document.getElementById('host-plans-list-container');
        if (!targetDiv) {
            let elements = document.querySelectorAll('*');
            elements.forEach(el => {
                if (el.innerText && el.innerText.includes('Manage Host Plans')) {
                    let existing = el.querySelector('#host-plans-list-container');
                    if (!existing) {
                        let div = document.createElement('div');
                        div.id = 'host-plans-list-container';
                        div.style.marginTop = '15px';
                        el.appendChild(div);
                        targetDiv = div;
                    } else {
                        targetDiv = existing;
                    }
                }
            });
        }

        if (targetDiv) {
            let html = "<h4 style='color:#00e676; margin-top:20px; border-top:1px solid #444; padding-top:12px; text-align:left;'>Active Host List</h4>";
            if (querySnapshot.empty) {
                html += "<p style='color:#aaa; font-size:13px; text-align:left;'>No host plans activated yet.</p>";
            } else {
                let index = 1;
                querySnapshot.forEach((doc) => {
                    let host = doc.data();
                    html += `
                        <div style="background:#262626; padding:12px; margin:10px 0; border-radius:8px; border:1px solid #444; text-align:left; color:white;">
                            <p style="margin:0 0 6px 0; font-size:15px; color:#ff9800;"><b>${index}. Host ID: ${host.hostCode}</b></p>
                            <p style="margin:4px 0; font-size:13px; color:#fff;"><b>User Name:</b> ${host.userName || 'N/A'}</p>
                            <p style="margin:4px 0; font-size:13px; color:#ccc;"><b>Mobile / Email:</b> ${host.userMobile || 'N/A'}</p>
                            <p style="margin:4px 0; font-size:12px; color:#00e676;"><b>Plan:</b> ${host.plan || 'N/A'}</p>
                            <hr style="border:0; border-top:1px solid #555; margin:8px 0;">
                        </div>
                    `;
                    index++;
                });
            }
            targetDiv.innerHTML = html;
        }
    }).catch(err => console.log("Host list error:", err));
};

// Trigger functions on load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        renderHostPlansList();
        injectHostInputFields();
    }, 1000);
});

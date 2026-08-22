// --- SAFE FIREBASE INITIALIZATION ---
(function () {
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

// --- DYNAMIC SUB-MODE LOGIC ---
window.updateSubMode = function () {
    if (typeof window.updateSubModes === 'function') {
        window.updateSubModes();
    }
};

window.updateSubModes = function () {
    try {
        const categoryElement = document.getElementById('tournament-category');
        const subModeSelect = document.getElementById('tournament-submode');
        if (!categoryElement || !subModeSelect) return;

        const category = categoryElement.value;
        subModeSelect.innerHTML = '';

        if (category === 'Full Map') {
            subModeSelect.innerHTML = '<option value="Solo">Solo (48 Players)</option><option value="Duo">Duo (48 Players)</option><option value="Squad">Squad (48 Players)</option>';
        } else if (category === 'Survival') {
            subModeSelect.innerHTML = '<option value="Solo">Solo</option><option value="Squad">Squad</option>';
        } else if (category === 'CS') {
            subModeSelect.innerHTML = '<option value="1v1">1v1</option><option value="2v2">2v2</option><option value="4v4">4v4</option>';
        } else if (category === 'Lone Wolf') {
            subModeSelect.innerHTML = '<option value="1v1">1v1</option>';
        }
    } catch (err) {
        console.error("SubNode error:", err);
    }
};

// --- SECTION SWITCHING ---
window.switchSection = function (sectionId, btn) {
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

// --- 4. CREATE TOURNAMENT ---
window.createTournament = function () {
    try {
        const db = getDb();
        if (!db) { alert("Database not connected!"); return; }

        // Saare possible IDs aur backup selectors taaki value kabhi miss na ho
        const hostCodeField = document.getElementById('hostCode') || document.getElementById('match-host-code') || document.getElementById('host-code') || document.querySelector('input[placeholder*="Host"]');
        const titleField = document.getElementById('title') || document.getElementById('tournament-title') || document.querySelector('input[placeholder*="Title"]');
        const categoryField = document.getElementById('tournament-category') || document.getElementById('category');
        const subModeField = document.getElementById('tournament-submode') || document.getElementById('submode');
        const entryField = document.getElementById('entry') || document.getElementById('entryFee') || document.querySelector('input[placeholder*="Entry"]');
        const prizeField = document.getElementById('prize') || document.getElementById('prizePool') || document.querySelector('input[placeholder*="Prize"]');
        const killField = document.getElementById('kill') || document.getElementById('perKill') || document.querySelector('input[placeholder*="Kill"]');
        const timeField = document.getElementById('startTime') || document.getElementById('match-time') || document.querySelector('input[type="datetime-local"]');

        const hostCode = hostCodeField ? hostCodeField.value.trim() : '';
        const title = titleField ? titleField.value.trim() : '';
        const category = categoryField ? categoryField.value : 'Full Map';
        const subMode = subModeField ? subModeField.value : 'Solo';
        const entryFee = entryField ? Number(entryField.value) || 0 : 0;
        const prizePool = prizeField ? Number(prizeField.value) || 0 : 0;
        const perKill = killField ? Number(killField.value) || 0 : 0;
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
            startTime: startTime,
            status: 'Upcoming',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            alert("🚀 Tournament Launched Successfully!");
            location.reload();
        }).catch((error) => {
            alert("Firebase Error: " + error.message);
        });

    } catch (err) {
        alert("Error: " + err.message);
    }
};

// --- 5. SAVE HOST PLAN ---
window.saveHostPlan = function () {
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
            alert("✅ Host Plan Activated Successfully for code: " + hostCode);
            location.reload();
        }).catch((error) => {
            alert("Error: " + error.message);
        });
    } catch (err) {
        alert("Error: " + err.message);
    }
};

// --- 6. UPDATE ROOM CREDENTIALS ---
window.updateRoomCredentials = function () {
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
            location.reload();
        }).catch((error) => {
            alert("Error updating room: " + error.message);
        });
    } catch (err) {
        alert("Error: " + err.message);
    }
};

// --- 7. SUBMIT RESULT ---
window.submitResult = function () {
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
            location.reload();
        }).catch((error) => {
            alert("Error submitting result: " + error.message);
        });
    } catch (err) {
        alert("Error: " + err.message);
    }
};

// --- 8. MARK MATCH COMPLETE ---
window.markWatchComplete = function () {
    try {
        const db = getDb();
        if (!db) { alert("Database not connected!"); return; }

        const matchIdInput = document.querySelector('input[placeholder*="Watch ID"]');
        const matchId = matchIdInput ? matchIdInput.value.trim() : '';

        if (!matchId) {
            alert("Please enter Watch ID!");
            return;
        }

        db.collection('tournaments').doc(matchId).set({
            status: 'Completed',
            completedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true }).then(() => {
            alert("🏁 Match Marked Complete Successfully!");
            location.reload();
        }).catch((error) => {
            alert("Error: " + error.message);
        });
    } catch (err) {
        alert("Error: " + err.message);
    }
};

// --- 9. NUMBERED USERS & DEPOSITS DISPLAY FUNCTIONS ---
window.renderNumberedUsersList = function () {
    const db = getDb();
    if (!db) return;

    db.collection('users').get().then((querySnapshot) => {
        let targetDiv = null;
        let elements = document.querySelectorAll('*');
        elements.forEach(el => {
            if (el.childNodes.length === 1 && el.innerText && el.innerText.includes('Loading users')) {
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
                        <div style="background:#262626; padding:12px; margin:10px 0; border-radius:8px; border:1px solid #383838;">
                            <p style="margin:0 0 6px 0; font-size:15px; color:#ff9800;"><b>${index}. Name: ${user.name || user.username || 'N/A'}</b></p>
                            <p style="margin:4px 0; font-size:13px; color:#ccc;"><b>Mobile / Email:</b> ${user.mobile || user.email || 'N/A'}</p>
                        </div>
                    `;
                    index++;
                });
            }
            targetDiv.innerHTML = html;
        }
    }).catch(err => console.log("User list error:", err));
};

window.renderNumberedDepositManagement = function () {
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
                html = "<p style='color:#aaa; font-size:5px;'>No pending deposits found.</p>";
            } else {
                let index = 1;
                querySnapshot.forEach((doc) => {
                    let data = doc.data();
                    let docId = doc.id;
                    let senderName = data.senderName || data.username || 'N/A';

                    html += `
                        <div style="background:#262626; padding:14px; margin:12px 0; border-radius:8px; border:1px solid #383838;">
                            <p style="margin:0 0 6px 0; font-size:16px; color:#ff9800;"><b>${index}. Sender: ${senderName}</b></p>
                            <p style="margin:4px 0; font-size:13px; color:#ccc;"><b>Mobile / Upi:</b> ${data.mobile || data.upi || 'N/A'}</p>
                            <p style="margin:4px 0; font-size:14px; color:#00e676;"><b>Payment: ₹${data.amount || 0}</b></p>
                            <p style="margin:4px 0; font-size:13px; color:#ffeb3b;"><b>UTR / Txn:</b> ${data.utr || data.txnId || 'N/A'}</p>
                            
                            <div style="margin-top:10px;">
                                <label style="font-size:12px; color:#aaa; display:block; margin-bottom:2px;">Coins / Amount to Add:</label>
                                <input type="number" id="coin-input-${docId}" value="${data.amount || 0}" style="width:100%; padding:8px; background:#1c1c1c; border:1px solid #444; color:#fff; border-radius:4px; margin-bottom:8px;">
                                <div style="display:flex; gap:8px;">
                                    <button onclick="approveAndAddWalletCoins('${docId}', '${data.userId || data.uid}', '${senderName}')" style="flex:1; background:#00e676; color:#000; border:none; padding:8px; border-radius:4px; font-weight:bold; cursor:pointer;">Approve</button>
                                    <button onclick="rejectDepositAdmin('${docId}')" style="flex:1; background:#f44336; color:#fff; border:none; padding:8px; border-radius:4px; font-weight:bold; cursor:pointer;">Reject</button>
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

window.approveAndAddWalletCoins = function (docId, userIdentifier, username) {
    const db = getDb();
    if (!db) return;

    let inputVal = document.getElementById(`coin-input-${docId}`).value;
    let amountToAdd = Number(inputVal);

    if (!amountToAdd || amountToAdd <= 0) {
        alert("Kripya valid coin/money amount daalein!");
        return;
    }

    if (!userIdentifier || userIdentifier === 'N/A') {
        db.collection('deposits').doc(docId).update({ status: 'Approved' }).then(() => {
            alert("✅ Deposit approved successfully!");
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

window.rejectDepositAdmin = function (docId) {
    const db = getDb();
    if (!db) return;
    db.collection('deposits').doc(docId).update({
        status: 'Rejected'
    }).then(() => {
        alert("❌ Deposit rejected.");
        location.reload();
    }).catch(err => alert("Error: " + err.message));
};

// --- HOST PLANS LIST RENDERER ---
window.renderHostPlansList = function () {
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
            let html = "<h4 style='color:#00e676; margin-top:20px; border-top:1px solid #444; padding-top:10px;'>Active Hosts List</h4>";
            if (querySnapshot.empty) {
                html += "<p style='color:#aaa; font-size:13px;'>No host plans found.</p>";
            } else {
                let index = 1;
                querySnapshot.forEach((doc) => {
                    let host = doc.data();
                    html += `
                        <div style="background:#262626; padding:12px; margin:10px 0; border-radius:8px; border:1px solid #383838;">
                            <p style="margin:0 0 6px 0; font-size:15px; color:#ff9800;"><b>${index}. Host Code: ${host.hostCode || 'N/A'}</b></p>
                            <p style="margin:4px 0; font-size:13px; color:#fff;"><b>User Name:</b> ${host.userName || 'N/A'}</p>
                            <p style="margin:4px 0; font-size:13px; color:#ccc;"><b>Mobile:</b> ${host.userMobile || 'N/A'}</p>
                            <p style="margin:4px 0; font-size:12px; color:#00e676;"><b>Plan:</b> ${host.plan || 'N/A'}</p>
                        </div>
                    `;
                    index++;
                });
            }
            targetDiv.innerHTML = html;
        }
    }).catch(err => console.log("Host list error:", err));
};

window.injectHostInputFields = function () {
    let hostCodeInput = document.getElementById('manage-host-code');
    if (hostCodeInput && !document.getElementById('host-user-name')) {
        let parentBox = hostCodeInput.parentElement;
        let wrapper = document.createElement('div');
        wrapper.id = 'dynamic-host-inputs';
        wrapper.innerHTML = `
            <div style="margin-top:8px; text-align:left;">
                <label style="font-size:12px; color:#aaa; display:block; margin-bottom:2px;">User Name</label>
                <input type="text" id="host-user-name" placeholder="Enter User Name" style="width:100%; padding:8px; background:#1c1c1c; border:1px solid #444; color:#fff; border-radius:4px; margin-bottom:8px;">
                <label style="font-size:12px; color:#aaa; display:block; margin-bottom:2px;">Mobile / Email</label>
                <input type="text" id="host-user-mobile" placeholder="Enter Mobile or Email" style="width:100%; padding:8px; background:#1c1c1c; border:1px solid #444; color:#fff; border-radius:4px;">
            </div>
        `;
        parentBox.insertBefore(wrapper, hostCodeInput.nextSibling);
    }
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    if (typeof window.updateSubMode === 'function') {
        window.updateSubMode();
    }
    setTimeout(() => {
        renderNumberedUsersList();
        renderNumberedDepositManagement();
        renderHostPlansList();
        injectHostInputFields();
    }, 1000);
});

document.addEventListener('change', function (e) {
    if (e.target && e.target.id === 'tournament-category') {
        if (typeof window.updateSubMode === 'function') {
            window.updateSubMode();
        }
    }
});

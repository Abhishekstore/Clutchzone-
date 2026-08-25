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
window.createTournament = function() {
    try {
        const db = getDb();
        if (!db) { alert("Database not connected!"); return; }

        const matchId = document.getElementById('tournament-match-id')?.value.trim() || "";
        const hostCode = document.getElementById('host-code')?.value.trim() || "ADMIN";
        const title = document.getElementById('tournament-title')?.value.trim() || document.getElementById('title')?.value.trim() || "";
        const category = document.getElementById('tournament-category')?.value || "Full Map";
        const submode = document.getElementById('tournament-submode')?.value || "Solo";
        
        // Yahan input IDs ko aapke form ke mutabiq set kar diya hai
        const entry = Number(document.getElementById('tournament-entry')?.value || document.getElementById('entry')?.value) || 0;
        const prize = Number(document.getElementById('tournament-prize')?.value || document.getElementById('prize')?.value) || 0;
        const perKill = Number(document.getElementById('kill')?.value || document.getElementById('tournament-perkill')?.value) || 0;
        
        const startTime = document.getElementById('tournament-time')?.value || "";

        if (!matchId || !title) {
            alert("Kripya Match ID aur Title zaroor bharein!");
            return;
        }

        db.collection("tournaments").doc(matchId).set({
            matchId: matchId,
            hostCode: hostCode,
            title: title,
            category: category,
            submode: submode,
            entry: entry,
            prize: prize,
            perKill: perKill,
            startTime: startTime,
            status: "upcoming",
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            alert("🚀 Tournament Launch ho gaya! (Entry: ₹" + entry + ", Prize: ₹" + prize + ", Kill: ₹" + perKill + ")");
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
window.updateRoomCredentials = function () {
    try {
        const db = getDb();
        if (!db) { alert("Database not connected!"); return; }

        const inputs = document.querySelectorAll('input');
        let matchId = '', roomId = '', roomPassword = '';

        inputs.forEach(input => {
            const placeholder = (input.placeholder || '').toLowerCase();
            const val = input.value.trim();
            if (!val) return;

            if (placeholder.includes('match') || placeholder.includes('uio') || val === 'Uio') {
                matchId = val;
            } else if (placeholder.includes('room') || placeholder.includes('id')) {
                if (val !== matchId) roomId = val;
            } else if (placeholder.includes('pass')) {
                roomPassword = val;
            }
        });

        if (!matchId && inputs.length > 0) matchId = inputs[0].value.trim();
        if (!roomId && inputs.length > 1) roomId = inputs[1].value.trim();
        if (!roomPassword && inputs.length > 2) roomPassword = inputs[2].value.trim();

        if (!matchId) {
            alert("Please enter Match ID!");
            return;
        }

        db.collection('tournaments').doc(matchId).set({
            roomId: roomId,
            roomPassword: roomPassword,
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

window.updatePlayerKills = function(matchDocId, killsCount, perKillRate, targetUsername) {
    let earnedAmount = Number(killsCount) * Number(perKillRate);

    db.collection("joined_matches").doc(matchDocId).update({
        kills: Number(killsCount),
        earnings: earnedAmount
    }).then(() => {
        let userRef = db.collection("users").doc(targetUsername);
        userRef.get().then((doc) => {
            let currentCoins = doc.exists && doc.data().coins ? Number(doc.data().coins) : 0;
            let newCoinsTotal = currentCoins + earnedAmount;

            userRef.update({
                coins: newCoinsTotal
            }).then(() => {
                alert("✅ Kills update ho gaye aur ₹" + earnedAmount + " player ke wallet mein successfully jud gaye!");
            });
        });
    }).catch((error) => {
        alert("Error updating kills: " + error.message);
    });
};
// 1. Joined Matches ko Admin Panel mein load karne ka function
// 1. Unique Match ID ke sath Tournament Create karne ka function
window.createTournament = function() {
    let matchId = document.getElementById('tournament-match-id').value.trim();
    let hostCode = document.getElementById('host-code') ? document.getElementById('host-code').value.trim() : "ADMIN";
    let title = document.getElementById('tournament-title').value.trim();
    let category = document.getElementById('tournament-category').value;
    let submode = document.getElementById('tournament-submode').value;
    let entry = Number(document.getElementById('tournament-entry').value) || 0;
    let prize = Number(document.getElementById('tournament-prize').value) || 0;
    let perKill = Number(document.getElementById('tournament-perkill') ? document.getElementById('tournament-perkill').value : 0) || 0;
    let time = document.getElementById('tournament-time').value;

    if(!matchId || !title) {
        alert("Kripya Match ID aur Title zaroor bharein!");
        return;
    }

    db.collection("tournaments").doc(matchId).get().then((doc) => {
        if (doc.exists) {
            alert("❌ Error: Yeh Match ID (" + matchId + ") pehle se bani hui hai! Dobara create nahi ho sakti.");
            return;
        }

        db.collection("tournaments").doc(matchId).set({
            matchId: matchId,
            hostCode: hostCode,
            title: title,
            category: category,
            submode: submode,
            entry: entry,
            prize: prize,
            perKill: perKill,
            startTime: time,
            status: "upcoming",
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            alert("🚀 Tournament Successfully Launch ho gaya!");
            document.getElementById('tournament-match-id').value = "";
            document.getElementById('tournament-title').value = "";
        }).catch((error) => {
            alert("Error launching tournament: " + error.message);
        });
    });
};

// 2. Match ID se players ko Table format mein load karne ka function
window.loadPlayersByMatchId = function() {
    let matchId = document.getElementById('filter-match-id').value.trim();
    let container = document.getElementById('admin-matches-container');
    
    if(!matchId) {
        alert("Kripya Match ID daalein!");
        return;
    }
    
    container.innerHTML = "<p style='color:#ff9800;'>Loading players...</p>";
    
    db.collection("joined_matches")
        .where("matchId", "==", matchId)
        .get()
        .then((snapshot) => {
            if(snapshot.empty) {
                container.innerHTML = `<p style="color:#aaa;">Is Match ID (${matchId}) par koi player nahi mila.</p>`;
                return;
            }
            
            let html = `
            <table style="width:100%; border-collapse:collapse; color:#fff; font-size:13px; margin-top:10px;">
                <thead>
                    <tr style="background:#111; border-bottom:2px solid #444;">
                        <th style="padding:10px; text-align:left;">User Name</th>
                        <th style="padding:10px; text-align:left;">User ID / FF Name</th>
                        <th style="padding:10px; text-align:center;">Per Kill (₹)</th>
                        <th style="padding:10px; text-align:center;">Kills</th>
                        <th style="padding:10px; text-align:center;">Action</th>
                    </tr>
                </thead>
                <tbody>`;
            
            snapshot.forEach((doc) => {
                let data = doc.data();
                let docId = doc.id;
                let username = data.username || data.playerUsername || "N/A";
                let playerName = data.playerName || "N/A";
                let currentKills = data.kills || 0;
                let perKillRate = data.perKillRate || 5;
                
                html += `
                <tr style="border-bottom:1px solid #333;">
                    <td style="padding:10px; color:#38bdf8; font-weight:bold;">${username}</td>
                    <td style="padding:10px; color:#ddd;">${playerName}</td>
                    <td style="padding:10px; text-align:center;">
                        <input type="number" id="rate_${docId}" value="${perKillRate}" style="width:55px; padding:5px; background:#111; color:#fff; border:1px solid #555; text-align:center; border-radius:4px;">
                    </td>
                    <td style="padding:10px; text-align:center;">
                        <input type="number" id="kills_${docId}" value="${currentKills}" style="width:55px; padding:5px; background:#111; color:#fff; border:1px solid #555; text-align:center; border-radius:4px;">
                    </td>
                    <td style="padding:10px; text-align:center;">
                        <button onclick="saveMatchKills('${docId}', '${username}')" style="background:#00e676; color:#000; padding:6px 12px; font-weight:bold; border:none; border-radius:4px; cursor:pointer;">Save</button>
                    </td>
                </tr>`;
            });
            
            html += `</tbody></table>`;
            container.innerHTML = html;
        })
        .catch((err) => {
            container.innerHTML = `<p style="color:red;">Error: ${err.message}</p>`;
        });
};

// 3. Save button dabane par kills update karke wallet mein automatic paise bhejna
window.saveMatchKills = function(docId, targetUsername) {
    let killsInput = document.getElementById(`kills_${docId}`).value;
    let rateInput = document.getElementById(`rate_${docId}`).value;
    
    let killsCount = Number(killsInput);
    let perKillRate = Number(rateInput);
    
    if(isNaN(killsCount) || isNaN(perKillRate)) {
        alert("Kripya valid numbers daalein!");
        return;
    }
    
    let earnedAmount = killsCount * perKillRate;

    db.collection("joined_matches").doc(docId).update({
        kills: killsCount,
        perKillRate: perKillRate,
        earnings: earnedAmount
    }).then(() => {
        let userRef = db.collection("users").doc(targetUsername);
        userRef.get().then((doc) => {
            let currentCoins = doc.exists && doc.data().coins ? Number(doc.data().coins) : 0;
            let newCoinsTotal = currentCoins + earnedAmount;

            userRef.update({
                coins: newCoinsTotal
            }).then(() => {
                alert("✅ Saved! ₹" + earnedAmount + " player ke wallet mein successfully add ho gaye.");
            });
        });
    }).catch((error) => {
        alert("Error: " + error.message);
    });
};

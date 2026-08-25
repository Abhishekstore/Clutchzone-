// host-integration.js - Clutchzone Host Integration System

document.addEventListener("DOMContentLoaded", function() {
    let approvedHostId = localStorage.getItem('approvedHostId');
    
    // 1. Profile mein naam ke niche Host ID dikhana
    let usernameHeading = document.getElementById('profile-username');
    if (usernameHeading && approvedHostId) {
        if (!document.getElementById('user-host-badge')) {
            let badge = document.createElement('div');
            badge.id = 'user-host-badge';
            badge.style.cssText = 'font-size: 12px; color: #00e676; margin-top: 4px; font-weight: bold;';
            badge.innerHTML = `👑 Host ID: ${approvedHostId}`;
            usernameHeading.parentNode.insertBefore(badge, usernameHeading.nextSibling);
        }
    }

    // 2. Menu text change karna agar approval mil gaya ho
    let hostMenuText = document.getElementById('host-menu-text');
    if (hostMenuText && approvedHostId) {
        hostMenuText.innerText = "My Host Panel";
    }
});

// 3. Click karne par check karega ki approval hai ya nahi
function openHostSection() {
    let approvedHostId = localStorage.getItem('approvedHostId');
    if (approvedHostId) {
        // Agar approval mil chuka hai, toh seedha host panel khulega
        window.location.href = 'host.html';
    } else {
        // Agar nahi mila, toh plan/UTR page par jayega
        window.location.href = 'host-plans.html';
    }
}

// --- HOST: CREATE TOURNAMENT WITH AUTO ID (1, 2, 3...) ---
window.createTournament = async function() {
    try {
        const db = getDb();
        if (!db) { alert("Database not connected!"); return; }

        const counterRef = db.collection('settings').doc('matchCounter');
        const counterDoc = await counterRef.get();
        
        let nextId = 1;
        if (counterDoc.exists) {
            nextId = (counterDoc.data().lastId || 0) + 1;
        }
        const matchIdStr = nextId.toString();

        const hostCode = document.getElementById('host-code')?.value.trim() || 'HOST';
        const title = document.getElementById('tournament-title')?.value.trim() || 'Tournament';
        const category = document.getElementById('tournament-category')?.value.trim() || 'Full Map';
        const submode = document.getElementById('tournament-submode')?.value || 'Solo';
        
        const entry = Number(document.getElementById('tournament-entry')?.value) || 0;
        const prize = Number(document.getElementById('tournament-prize')?.value) || 0;
        const perKill = Number(document.getElementById('kill')?.value) || 0;
        const startTime = document.getElementById('tournament-time')?.value || '';

        if (!startTime) {
            alert("Please select Start Date and Time!");
            return;
        }

        await db.collection('tournaments').doc(matchIdStr).set({
            matchId: matchIdStr,
            hostCode: hostCode,
            title: title,
            category: category,
            submode: submode,
            entry: entry,
            prize: prize,
            perKill: perKill,
            startTime: startTime,
            status: 'upcoming',
            participants: [],
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        await counterRef.set({ lastId: nextId }, { merge: true });

        alert("🎉 Tournament Launch ho gaya! Match ID: " + matchIdStr);
        location.reload();

    } catch (err) {
        alert("Error creating tournament: " + err.message);
    }
};

// --- HOST PAGE LOAD: SHOW NEXT MATCH ID AUTOMATICALLY ---
window.addEventListener("DOMContentLoaded", async () => {
    try {
        const db = getDb();
        if (!db) return;

        const counterRef = db.collection('settings').doc('matchCounter');
        const counterDoc = await counterRef.get();
        
        let nextId = 1;
        if (counterDoc.exists) {
            nextId = (counterDoc.data().lastId || 0) + 1;
        }

        const matchInput = document.getElementById('tournament-match-id');
        if (matchInput) {
            matchInput.value = nextId;
            matchInput.readOnly = true;
            matchInput.style.background = "#222";
            matchInput.style.color = "#ffcc00";
        }
    } catch (err) {
        console.error("Error loading next match ID in host panel: ", err);
    }
});
// --- 1. SUB-MODE DROPDOWN FIX FOR HOST PANEL ---
window.updateSubMode = function() {
    const category = document.getElementById('tournament-category')?.value;
    const submodeSelect = document.getElementById('tournament-submode');
    if (!submodeSelect) return;
    
    submodeSelect.innerHTML = '';
    
    if (category === 'Full Map') {
        ['Solo (48 Players)', 'Duo (50 Players)', 'Squad (100 Players)'].forEach(mode => {
            let opt = document.createElement('option');
            opt.value = mode;
            opt.textContent = mode;
            submodeSelect.appendChild(opt);
        });
    } else if (category === 'Clash Squad') {
        ['1v1', '2v2', '4v4'].forEach(mode => {
            let opt = document.createElement('option');
            opt.value = mode;
            opt.textContent = mode;
            submodeSelect.appendChild(opt);
        });
    }
};

// Page load hote hi default sub-mode set karne ke liye
window.addEventListener("DOMContentLoaded", () => {
    updateSubMode();
});


// --- 2. LOAD JOINED PLAYERS FOR RESULTS IN HOST PANEL ---
window.loadMatchPlayersForResults = async function() {
    const matchId = document.getElementById('res-match-id')?.value.trim();
    const container = document.getElementById('results-players-container');
    
    if (!matchId) {
        alert("Please enter Match ID first!");
        return;
    }

    container.innerHTML = "Loading players...";

    try {
        const db = getDb();
        const doc = await db.collection('tournaments').doc(matchId).get();
        
        if (!doc.exists) {
            container.innerHTML = "<p style='color:red;'>Match not found!</p>";
            return;
        }

        const data = doc.data();
        const participants = data.participants || [];

        if (participants.length === 0) {
            container.innerHTML = "<p style='color:orange;'>No players joined this match yet.</p>";
            return;
        }

        let html = `<table style="width:100%; color:#fff; font-size:13px; text-align:left;" border="1" cellpadding="5">
            <tr><th>Player Name</th><th>UID</th><th>Kills</th><th>Prize (₹)</th></tr>`;

        participants.forEach((p, index) => {
            html += `<tr>
                <td>${p.name || 'Player'}</td>
                <td>${p.uid}</td>
                <td><input type="number" id="kill-${index}" value="0" style="width:50px; background:#111; color:#fff; border:1px solid #444;"></td>
                <td><input type="number" id="prize-${index}" value="0" style="width:60px; background:#111; color:#fff; border:1px solid #444;"></td>
            </tr>`;
        });

        html += `</table>`;
        container.innerHTML = html;
        window.currentMatchParticipants = participants;

    } catch (err) {
        console.error(err);
        container.innerHTML = "<p style='color:red;'>Error loading players: " + err.message + "</p>";
    }
};


// --- 3. SAVE RESULTS & UPDATE WALLETS ---
window.saveAllMatchResults = async function() {
    const matchId = document.getElementById('res-match-id')?.value.trim();
    const participants = window.currentMatchParticipants;

    if (!matchId || !participants) {
        alert("Please load players first!");
        return;
    }

    try {
        const database = getDb();
        
        for (let i = 0; i < participants.length; i++) {
            const kills = Number(document.getElementById(`kill-${i}`)?.value) || 0;
            const prize = Number(document.getElementById(`prize-${i}`)?.value) || 0;
            
            participants[i].kills = kills;
            participants[i].prize = prize;

            if (prize > 0 && participants[i].userEmail) {
                const userRef = database.collection('users').where('email', '==', participants[i].userEmail);
                const userSnap = await userRef.get();
                if (!userSnap.empty) {
                    const userDoc = userSnap.docs[0];
                    const currentWallet = Number(userDoc.data().wallet) || 0;
                    await userDoc.ref.update({ wallet: currentWallet + prize });
                }
            }
        }

        await database.collection('tournaments').doc(matchId).update({
            participants: participants,
            status: 'completed'
        });

        alert("🎉 Results saved successfully & Wallets updated!");
        location.reload();

    } catch (err) {
        alert("Error saving results: " + err.message);
    }
};

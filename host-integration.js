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

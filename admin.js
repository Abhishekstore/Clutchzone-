// --- FIREBASE INITIALIZATION ---
const firebaseConfig = {
    apiKey: "AIzaSyA1jgyhtyvOfGNicgcIT-JjUuny3zVLJ8",
    authDomain: "ff-tournaments-af47a.firebaseapp.com",
    projectId: "ff-tournaments-af47a",
    storageBucket: "ff-tournaments-af47a.appspot.com",
    messagingSenderId: "238745686365",
    appId: "1:238745686365:web:83e96d5e1dd450dbe2d8b4"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// --- 1. DYNAMIC SUB-MODE LOGIC (Bulletproof) ---
function updateSubMode() {
    runSubModeLogic();
}
function updateSubModes() {
    runSubModeLogic();
}

function runSubModeLogic() {
    const categoryElement = document.getElementById('tournament-category') || document.getElementById('category') || document.getElementById('admin-category');
    const subModeSelect = document.getElementById('tournament-submode') || document.getElementById('submode') || document.getElementById('admin-submode');
    
    if (!categoryElement || !subModeSelect) return;
    
    const category = categoryElement.value;
    subModeSelect.innerHTML = '';
    
    if (category === 'Full Map') {
        subModeSelect.innerHTML = '<option value="Solo (48 Players)">Solo (48 Players)</option><option value="Duo (24 Duos)">Duo (24 Duos)</option><option value="Squad (12 Squads)">Squad (12 Squads)</option>';
    } else if (category === 'Survival') {
        subModeSelect.innerHTML = '<option value="Solo (48 Players)">Solo (48 Players)</option>';
    } else if (category === 'CS') {
        subModeSelect.innerHTML = '<option value="1vs1">1vs1</option><option value="2vs2">2vs2</option><option value="4vs4">4vs4</option><option value="6vs6">6vs6</option>';
    } else if (category === 'Lone Wolf') {
        subModeSelect.innerHTML = '<option value="1vs1">1vs1</option><option value="2vs2">2vs2</option>';
    }
}

// --- 2. SECTION SWITCHING (Bottom Navigation) ---
function switchSection(sectionId, btn) {
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
}

// --- 3. CREATE TOURNAMENT FUNCTION ---

function createTournament() {
    const hostCode = document.getElementById('host-code') ? document.getElementById('host-code').value.trim() : '';
    const title = document.getElementById('tournament-title') ? document.getElementById('tournament-title').value.trim() : '';
    const category = document.getElementById('tournament-category') ? document.getElementById('tournament-category').value : 'Full Map';
    const subMode = document.getElementById('tournament-submode') ? document.getElementById('tournament-submode').value : '';
    const entryFee = Number(document.getElementById('tournament-entry') ? document.getElementById('tournament-entry').value : 0);
    const prizePool = Number(document.getElementById('tournament-prize') ? document.getElementById('tournament-prize').value : 0);
    const perKill = Number(document.getElementById('tournament-kill') ? document.getElementById('tournament-kill').value : 0);
    const startTime = document.getElementById('tournament-time') ? document.getElementById('tournament-time').value : 'TBD';

    if (!hostCode || !title) {
        alert("Please enter Host Code and Title!");
        return;
    }

    // Yeh batayega ki data Firebase ki taraf ja raha hai ya nahi
    alert("Firebase par bhej rahe hain, ruko...");

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
        joinedCount: 0,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        alert("🎉 Tournament Launched Successfully!");
        document.getElementById('tournament-title').value = '';
    }).catch((error) => {
        alert("Firebase Error: " + error.message);
    });
}


// --- 4. ACTIVATE / EXTEND HOST PLAN ---
function saveHostPlan() {
    const hostCodeField = document.getElementById('manage-host-code') || document.getElementById('host-code-input');
    const planTypeField = document.getElementById('manage-plan-type') || document.getElementById('plan-type');

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
}

// --- EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
    updateSubMode();
});

document.addEventListener('change', function(e) {
    if (e.target && (e.target.id === 'tournament-category' || e.target.id === 'category' || e.target.id === 'admin-category')) {
        updateSubMode();
    }
});

window.addEventListener('load', () => {
    updateSubMode();
});

// --- AUTO-FIX FOR LAUNCH TOURNAMENT BUTTON ---
document.addEventListener('click', function(e) {
    const targetText = e.target.innerText || e.target.textContent || '';
    if (targetText.includes('Launch Tournament')) {
        e.preventDefault();
        createTournament();
    }
});

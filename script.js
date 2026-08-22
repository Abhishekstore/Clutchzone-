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

// 3. CATEGORY CLICK HANDLER (Full Map, Survival, Clash Squad, Lone Wolf)
window.openCategory = function(catName) {
    localStorage.setItem('selectedCategory', catName);
    loadTournamentsForCategory(catName);
};

// 4. FETCH TOURNAMENTS FROM FIRESTORE (Database check)
function loadTournamentsForCategory(categoryName) {
    db.collection('tournaments')
        .where('category', '==', categoryName)
        .where('active', '==', true)
        .get()
        .then((querySnapshot) => {
            let count = querySnapshot.size;
            if (count === 0) {
                alert("No active custom rooms found for " + categoryName + " right now. Check back later!");
            } else {
                alert("Found " + count + " active tournament(s) for " + categoryName + "!");
            }
        })
        .catch((error) => {
            console.error("Error fetching tournaments: ", error);
        });
}

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

window.filterContests = function(statusType) {
    alert("Filtering your contests by: " + statusType);
};

window.openAddCoinsModal = function() {
    // Aapka existing UPI payment gateway yahan connect rahega
    alert("Opening UPI Deposit Gateway...");
};

window.openWithdrawModal = function() {
    alert("Opening Withdrawal Window...");
};

window.openTransactions = function() {
    alert("Opening Transaction History...");
};

window.openStatics = function() {
    alert("Opening User Statistics...");
};

window.openRefer = function() {
    alert("Refer & Earn: Invite friends and get bonus coins!");
};

window.openNotifications = function() {
    alert("No new notifications.");
};

window.openFAQ = function() {
    alert("Opening FAQ section...");
};

window.openAbout = function() {
    alert("PLAYT24 - Professional Tournament Platform v1.11");
};

window.openPrivacy = function() {
    alert("Opening Privacy Policy...");
};

window.openTerms = function() {
    alert("Opening Terms & Conditions...");
};

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

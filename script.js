/* =================================================================v
   1. APP INITIALIZATION & STATE MANAGEMENT
   ================================================================= */
let appState = {
    isLoggedIn: localStorage.getItem('esports_logged_in') === 'true',
    username: localStorage.getItem('esports_username') || 'Abhi.Primex',
    gameIgn: localStorage.getItem('esports_ign') || '',
    gameUid: localStorage.getItem('esports_uid') || '',
    balance: {
        total: parseInt(localStorage.getItem('esports_total')) || 11,
        deposited: parseInt(localStorage.getItem('esports_deposited')) || 11,
        winning: parseInt(localStorage.getItem('esports_winning')) || 0,
        bonus: parseInt(localStorage.getItem('esports_bonus')) || 0
    },
    stats: {
        matchesPlayed: parseInt(localStorage.getItem('esports_matches')) || 5,
        totalKills: parseInt(localStorage.getItem('esports_kills')) || 0,
        coinsWon: parseInt(localStorage.getItem('esports_won')) || 0
    },
    transactions: JSON.parse(localStorage.getItem('esports_txns')) || [],
    myMatches: JSON.parse(localStorage.getItem('esports_my_matches')) || []
};

window.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    updateUIValues();
    setupEventListeners();
    console.log("Esports Gaming App Initialized Successfully.");
}

function updateUIValues() {
    // Update balances across the app
    const balanceElements = document.querySelectorAll('#user-balance, #wallet-total-coins');
    balanceElements.forEach(el => {
        if(el) el.innerText = appState.balance.total;
    });

    // Update breakdown boxes if they exist
    const depEl = document.getElementById('dep-coins');
    const winEl = document.getElementById('win-coins');
    const bonEl = document.getElementById('bon-coins');
    if(depEl) depEl.innerText = appState.balance.deposited;
    if(winEl) winEl.innerText = appState.balance.winning;
    if(bonEl) bonEl.innerText = appState.balance.bonus;

    // Update username displays
    const userDisplays = document.querySelectorAll('#username-display, .profile-username');
    userDisplays.forEach(el => {
        if(el) el.innerText = appState.username;
    });

    // Update game profile fields if present
    const ignInput = document.getElementById('ff-ign-input');
    const uidInput = document.getElementById('ff-uid-input');
    if(ignInput && appState.gameIgn) ignInput.value = appState.gameIgn;
    if(uidInput && appState.gameUid) uidInput.value = appState.gameUid;
}

function saveData() {
    localStorage.setItem('esports_logged_in', appState.isLoggedIn);
    localStorage.setItem('esports_username', appState.username);
    localStorage.setItem('esports_ign', appState.gameIgn);
    localStorage.setItem('esports_uid', appState.gameUid);
    localStorage.setItem('esports_total', appState.balance.total);
    localStorage.setItem('esports_deposited', appState.balance.deposited);
    localStorage.setItem('esports_winning', appState.balance.winning);
    localStorage.setItem('esports_bonus', appState.balance.bonus);
    localStorage.setItem('esports_matches', appState.stats.matchesPlayed);
    localStorage.setItem('esports_kills', appState.stats.totalKills);
    localStorage.setItem('esports_won', appState.stats.coinsWon);
    localStorage.setItem('esports_txns', JSON.stringify(appState.transactions));
    localStorage.setItem('esports_my_matches', JSON.stringify(appState.myMatches));
}


/* =================================================================
   2. NAVIGATION & VIEW ROUTER SYSTEM
   ================================================================= */
function switchView(viewId) {
    // Hide all view sections
    const sections = document.querySelectorAll('.view-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });

    // Show target section
    const target = document.getElementById(viewId);
    if(target) {
        target.classList.add('active');
    } else {
        console.warn("Target view not found:", viewId);
        // Fallback to home
        document.getElementById('home-view')?.classList.add('active');
    }

    // Update Bottom Navigation active state
    updateBottomNavActive(viewId);

    // Scroll back to top on view change
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateBottomNavActive(viewId) {
    const navButtons = document.querySelectorAll('.tab-btn');
    navButtons.forEach(btn => btn.classList.remove('active'));

    if(viewId === 'offer-view') {
        document.getElementById('nav-offer')?.classList.add('active');
    } else if(viewId === 'ranking-view') {
        document.getElementById('nav-ranking')?.classList.add('active');
    } else if(viewId === 'home-view' || viewId === 'category-detail-view') {
        document.getElementById('nav-home')?.classList.add('active');
    } else if(['wallet-view', 'add-coins-view', 'withdraw-view', 'transactions-view'].includes(viewId)) {
        document.getElementById('nav-wallet')?.classList.add('active');
    } else if(['profile-view', 'matches-view', 'refer-view', 'support-view'].includes(viewId)) {
        document.getElementById('nav-profile')?.classList.add('active');
    }
}


/* =================================================================
   3. CATEGORIES & TOURNAMENTS LOGIC
   ================================================================= */

function openCategory(catName) {
    console.log("Opening category:", catName);
    
    // Set category title dynamically
    const titleSpan = document.getElementById('category-title');
    const heading = document.getElementById('category-name-heading');
    
    if(titleSpan) titleSpan.innerText = catName;
    if(heading) heading.innerText = catName + " Custom Rooms";
    
    // Switch view to category detail
    switchView('category-detail-view');
}

function setupEventListeners() {
    // Setup form inputs listeners if needed
    const saveProfileBtn = document.getElementById('save-profile-btn');
    if(saveProfileBtn) {
        saveProfileBtn.addEventListener('click', handleSaveProfile);
    }
}

function handleSaveProfile() {
    const ignInput = document.getElementById('ff-ign-input');
    const uidInput = document.getElementById('ff-uid-input');

    if(ignInput && uidInput) {
        const ign = ignInput.value.trim();
        const uid = uidInput.value.trim();

        if(!ign || !uid) {
            alert('Please fill both Free Fire IGN and UID!');
            return;
        }

        appState.gameIgn = ign;
        appState.gameUid = uid;
        saveData();
        alert('Player Game Profile saved successfully!');
    }
}


/* =================================================================
   4. WALLET, PAYMENTS & TRANSACTIONS LOGIC
   ================================================================= */
function addCoins(amount) {
    amount = parseInt(amount);
    if(isNaN(amount) || amount <= 0) {
        alert('Please enter a valid coin amount.');
        return;
    }

    appState.balance.deposited += amount;
    appState.balance.total = appState.balance.deposited + appState.balance.winning + appState.balance.bonus;
    
    // Log transaction
    appState.transactions.unshift({
        type: 'Deposit',
        amount: amount,
        date: new Date().toLocaleDateString(),
        status: 'Successful'
    });

    saveData();
    updateUIValues();
    alert(`Successfully added 🪙 ${amount} to your wallet!`);
    switchView('wallet-view');
}

function requestWithdrawal(upiId, amount) {
    amount = parseInt(amount);
    if(!upiId || !upiId.includes('@')) {
        alert('Please enter a valid UPI ID (e.g. name@upi)');
        return;
    }
    if(isNaN(amount) || amount < 50) {
        alert('Minimum withdrawal amount is 50 coins.');
        return;
    }
    if(amount > (appState.balance.winning + appState.balance.deposited)) {
        alert('Insufficient withdrawable balance!');
        return;
    }

    // Deduct from winning/deposited
    if(appState.balance.winning >= amount) {
        appState.balance.winning -= amount;
    } else {
        const rem = amount - appState.balance.winning;
        appState.balance.winning = 0;
        appState.balance.deposited -= rem;
    }

    appState.balance.total = appState.balance.deposited + appState.balance.winning + appState.balance.bonus;

    appState.transactions.unshift({
        type: 'Withdrawal to ' + upiId,
        amount: -amount,
        date: new Date().toLocaleDateString(),
        status: 'Processing'
    });

    saveData();
    updateUIValues();
    alert('Withdrawal request submitted successfully! UPI: ' + upiId);
    switchView('wallet-view');
}
function submitPaymentProof() {
    const amount = document.getElementById('coin-amount-input').value;
    const utr = document.getElementById('utr-input').value.trim();
    
    // Yahan apna WhatsApp Number daalein (Country code ke sath, bina '+' ke, jaise 919876543210)
    const myWhatsAppNumber = "919304177952"; 

    if (!amount || !utr) {
        alert("Pehle amount aur UTR / Transaction ID dono bharein!");
        return;
    }

    // Message format
    const message = `Hello Admin, maine payment kiya hai!%0A%0AAmount: ${amount} Coins%0AUTR ID: ${utr}%0A%0APlease check and add coins.`;

    // WhatsApp URL
    const waUrl = `https://wa.me/${myWhatsAppNumber}?text=${message}`;

    // Open WhatsApp
    window.open(waUrl, '_blank');

    alert("Ab aapko WhatsApp par redirect kiya ja raha hai, wahan 'Send' button dabayein!");
    
    // Clear inputs
    document.getElementById('coin-amount-input').value = '';
    document.getElementById('utr-input').value = '';
    switchView('wallet-view');
}


/* =================================================================
   5. REFERRAL & SUPPORT SYSTEM
   ================================================================= */
function copyReferralLink() {
    const refLink = "https://esportsapp.example.com/join?ref=" + appState.username;
    navigator.clipboard.writeText(refLink).then(() => {
        alert('Referral link copied to clipboard! Share with friends to earn bonus coins.');
    }).catch(err => {
        console.error('Failed to copy text: ', err);
        alert('Failed to copy link. Link: ' + refLink);
    });
}

function openSupportTelegram() {
    window.open('https://t.me/support_channel_example', '_blank');
}


/* =================================================================
   6. USER AUTHENTICATION & SESSION RESET
   ================================================================= */
function handleLogout() {
    if(confirm('Are you sure you want to log out?')) {
        localStorage.clear();
        appState.isLoggedIn = false;
        alert('Logged out successfully.');
        location.reload();
    }
}
function openUpiApp() {
    const amount = document.getElementById('coin-amount-input').value;
    const myUpiId = "kinggkwrd@okicici"; // <--- Yahan apni asli UPI ID daal dena
    const myName = "Esports Gaming";

    if (!amount || amount < 10) {
        alert("Kam se kam 10 coins enter karein!");
        return;
    }

    // UPI Deep Link jo GPay/PhonePe ko direct khol dega
    const upiUrl = `upi://pay?pa=${myUpiId}&pn=${encodeURIComponent(myName)}&am=${amount}&cu=INR&tn=AddCoins_${amount}`;
    
    // Redirect to UPI App
    window.location.href = upiUrl;
}

function submitPaymentProof() {
    const amount = document.getElementById('coin-amount-input').value;
    const utr = document.getElementById('utr-input').value.trim();

    if (!amount || !utr) {
        alert("Pehle amount aur UTR / Transaction ID dono bharein!");
        return;
    }

    // Save pending deposit in localStorage (Aap ise admin panel ke liye use kar sakte hain)
    let pendingDeposits = JSON.parse(localStorage.getItem('esports_pending_deposits')) || [];
    pendingDeposits.unshift({
        amount: amount,
        utr: utr,
        date: new Date().toLocaleString(),
        status: 'Pending'
    });
    localStorage.setItem('esports_pending_deposits', JSON.stringify(pendingDeposits));

    alert("Payment proof submitted successfully! Admin verification ke baad coins aapke wallet mein add kar diye jayenge.");
    
    // Clear inputs
    document.getElementById('coin-amount-input').value = '';
    document.getElementById('utr-input').value = '';
    
    switchView('wallet-view');
}


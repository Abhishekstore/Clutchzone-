// Switch Views & Bottom Nav Active State
function switchView(viewId) {
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');

    // Bottom nav active class toggle
    document.querySelectorAll('.bottom-nav .nav-item').forEach(item => item.classList.remove('active'));
    if(viewId === 'home-view') document.getElementById('nav-home').classList.add('active');
    if(viewId === 'wallet-view') document.getElementById('nav-wallet').classList.add('active');
    if(viewId === 'profile-view') document.getElementById('nav-profile').classList.add('active');
}

// UPI Add Coins Modal Functions
function openAddCoinsModal() {
    document.getElementById('add-coins-modal').style.display = 'flex';
}

function closeAddCoinsModal() {
    document.getElementById('add-coins-modal').style.display = 'none';
}

function copyUpiId() {
    const upiText = "kinggkwrd@okicici";
    navigator.clipboard.writeText(upiText);
    alert("UPI ID Copied: " + upiText);
}

function submitDepositRequest() {
    const amount = document.getElementById('deposit-amount').value;
    if(!amount || amount <= 0) {
        alert("Please enter a valid amount!");
        return;
    }
    // Redirect to Telegram with message
    const telegramUrl = `https://t.me/Abhifftournamenthub?text=Hello%20Admin,%20I%20have%20paid%20₹${amount}%20to%20UPI%20kinggkwrd@okicici.%20Here%20is%20my%20screenshot!`;
    window.open(telegramUrl, "_blank");
    closeAddCoinsModal();
}

function openWithdrawModal() {
    alert("For withdrawals, please contact admin on Telegram!");
    openDepositTelegram();
}

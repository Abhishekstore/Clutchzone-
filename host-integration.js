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

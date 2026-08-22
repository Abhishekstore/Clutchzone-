function switchView(viewId) {
    // Hide all view sections
    document.querySelectorAll('.view-section').forEach(section => {
        section.classList.remove('active');
    });

    // Show the target section
    const target = document.getElementById(viewId);
    if(target) {
        target.classList.add('active');
    }

    // Update Bottom Nav active states
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    if(viewId === 'offer-view') {
        document.getElementById('nav-offer').classList.add('active');
    } else if(viewId === 'ranking-view') {
        document.getElementById('nav-ranking').classList.add('active');
    } else if(viewId === 'home-view') {
        document.getElementById('nav-home').classList.add('active');
    } else if(viewId === 'wallet-view' || viewId === 'add-coins-view' || viewId === 'withdraw-view' || viewId === 'transactions-view') {
        document.getElementById('nav-wallet').classList.add('active');
    } else if(viewId === 'profile-view' || viewId === 'matches-view' || viewId === 'refer-view' || viewId === 'support-view') {
        document.getElementById('nav-profile').classList.add('active');
    }

    window.scrollTo(0, 0);
}

function openCategory(catName) {
    alert("Opening tournament category: " + catName);
}

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

window.openCategory = function(catName) {
    alert("Opening Tournaments for: " + catName);
    // Yahan aap category-wise tournament listing page par redirect kar sakte hain
};

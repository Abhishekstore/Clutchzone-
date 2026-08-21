// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAljghtyv0FGNiccgcI-JjUunyvZvVLJ8",
    authDomain: "ff-tournaments.firebaseapp.com",
    projectId: "ff-tournaments",
    storageBucket: "ff-tournaments.appspot.com",
    messagingSenderId: "1234567890",
    appId: "1:123d567890:web:abcdef"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// 1. Launch Tournament Logic with Auto-Time
const launchBtn = document.getElementById('launch-tournament-btn');
if (launchBtn) {
    launchBtn.addEventListener('click', () => {
        const title = document.getElementById('admin-title').value.trim();
        const status = document.getElementById('admin-status').value;
        const roomId = document.getElementById('admin-room-id').value.trim();
        const roomPass = document.getElementById('admin-room-password').value.trim();
        const entryFee = Number(document.getElementById('admin-entry-fee').value) || 0;
        const timeInput = document.getElementById('admin-match-time').value;

        if (!title || !timeInput) {
            alert("Please enter Match Title and Start Time!");
            return;
        }

        const matchTimestamp = new Date(timeInput).getTime();

        db.collection('tournaments').add({
            title: title,
            status: status,
            roomId: roomId,
            roomPass: roomPass,
            entryFee: entryFee,
            startTime: matchTimestamp, // Time milliseconds mein save hoga
            prizePool: 3000,
            perKill: 5,
            map: "Bermuda",
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then(() => {
            alert("Tournament Launched Successfully! 🚀 Room ID will auto-show 10 mins before start.");
            // Clear fields
            document.getElementById('admin-title').value = '';
            document.getElementById('admin-room-id').value = '';
            document.getElementById('admin-room-password').value = '';
            document.getElementById('admin-entry-fee').value = '';
            document.getElementById('admin-match-time').value = '';
        })
        .catch(error => {
            alert("Error: " + error.message);
        });
    });
}

// 2. Credit Instantly Logic (By Free Fire UID)
const creditBtn = document.getElementById('credit-instantly-btn');
if (creditBtn) {
    creditBtn.addEventListener('click', () => {
        const ffuid = document.getElementById('admin-ffuid').value.trim();
        const prizeAmount = Number(document.getElementById('admin-prize').value) || 0;

        if (!ffuid || prizeAmount <= 0) {
            alert("Please enter valid FF UID and Prize Amount!");
            return;
        }

        // Firestore se user find karna jiska ye FF UID ho
        db.collection('users').where('ffuid', '==', ffuid).get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                alert("No user found registered with this Free Fire UID!");
                return;
            }

            querySnapshot.forEach((docSnapshot) => {
                const userId = docSnapshot.id;
                const userData = docSnapshot.data();
                const currentWallet = userData.wallet || 0;
                const newBalance = currentWallet + prizeAmount;

                // User ke wallet me paise add karna
                db.collection('users').doc(userId).update({
                    wallet: newBalance
                })
                .then(() => {
                    alert(`Successfully credited ₹${prizeAmount} to UID: ${ffuid}!`);
                    document.getElementById('admin-ffuid').value = '';
                    document.getElementById('admin-prize').value = '';
                    document.getElementById('admin-kills').value = '';
                });
            });
        })
        .catch(error => {
            alert("Error: " + error.message);
        });
    });
}

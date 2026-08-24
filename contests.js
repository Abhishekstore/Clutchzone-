// ==============================
// 1. JOIN TOURNAMENT LOGIC
// ==============================
window.joinTournament = function(tournamentId) {
    let currentUsername = localStorage.getItem('logged_in_username') || localStorage.getItem('loggedUserNaame') || localStorage.getItem('username') || '';
    if (!currentUsername) {
        alert('Pehle login karein!');
        return;
    }
    let docRef = db.collection('tournaments').doc(tournamentId);
    docRef.get().then(doc => {
        if (doc.exists) {
            let data = doc.data();
            let participants = data.participants || [];
            if (participants.some(p => p && p.toLowerCase() === currentUsername.toLowerCase())) {
                alert('Aapne yeh match pehle hi join kar liya hai!');
                return;
            }
            participants.push(currentUsername);
            docRef.update({
                participants: participants
            }).then(() => {
                alert('Successfully Joined Tournament!');
                location.reload();
            });
        }
    }).catch(err => {
        alert('Error joining tournament: ' + err.message);
    });
};

// ==============================
// 2. VIEW PARTICIPANTS / ENTRIES MODAL
// ==============================
window.openViewEntriesModal = function(tournamentTitle, encodedParticipants, matchId) {
    let existing = document.getElementById('participants-modal');
    if (existing) existing.remove();

    let participantslist = [];
    try {
        if (encodedParticipants) {
            participantslist = JSON.parse(atob(encodedParticipants));
        }
    } catch(e) {
        participantslist = [];
    }

    let listHTML = '';
    if (!participantslist || participantslist.length === 0) {
        listHTML = '<p style="text-align: center; color: #888; padding: 20px;">Koi entries nahi mili.</p>';
    } else {
        participantslist.forEach((user, index) => {
            let teamNo = index + 1;
            listHTML += `<div style="padding:12px 15px; border-bottom:1px solid #333; display:flex; justify-content:space-between; align-items:center;">
                <span>- Team: ${teamNo}, Pos: A - <strong style="color:#d32f2f;">${user}</strong></span>
            </div>`;
        });
    }

    let modalHTML = `
    <div id="participants-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 99999; display: flex; align-items: center; justify-content: center; padding: 15px;">
        <div style="background: #fff; width: 100%; max-width: 380px; border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; max-height: 80vh;">
            <!-- Header -->
            <div style="background: #512da8; padding: 15px; position: relative; color: #fff;">
                <h3 style="margin: 0; font-size: 16px; font-weight: bold;">VIEW PARTICIPANTS</h3>
                <small style="font-size: 12px; opacity: 0.8;">Match # ${matchId || '95216'}</small>
                <button onclick="document.getElementById('participants-modal').remove()" style="position: absolute; top: 12px; right: 12px; background: none; border: none; color: #fff; font-size: 18px; font-weight: bold; cursor: pointer;">✕</button>
            </div>
            <!-- List Content -->
            <div style="overflow-y: auto; padding: 10px; background: #fff; max-height: 60vh;">
                ${listHTML}
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
};

// ==============================
// 3. BANNER MANAGER FOR ALL MODES
// ==============================
function getBannerByType(type, mode) {
    let t = (type || '').toLowerCase();
    let m = (mode || '').toLowerCase();
    let combined = (t + ' ' + m).trim();

    if (combined.includes('4v4') || combined.includes('4*4')) {
        return 'banners/IMG_20260824_221300.jpg';
    } else if (combined.includes('3v3') || combined.includes('3*3')) {
        return 'banners/IMG_20260824_221319.jpg';
    } else if (combined.includes('2v2') || combined.includes('2*2')) {
        return 'banners/IMG_20260824_221338.jpg';
    } else if (combined.includes('1v1') || combined.includes('1*1')) {
        return 'banners/IMG_20260824_221414.jpg';
    } else if (combined.includes('squad')) {
        return 'banners/IMG_20260824_221457.jpg';
    } else if (combined.includes('duo')) {
        return 'banners/IMG_20260824_221432.jpg';
    } else if (combined.includes('solo')) {
        return 'banners/IMG_20260824_221547.jpg';
    } else {
        return 'https://images.unsplash.com/photo-15348110705-c7104e0365fc';
    }
}

// ==============================
// 4. DETAILED JOINED MATCH MODAL
// ==============================
window.openJoinedTournamentDetails = function(docId) {
    db.collection('tournaments').doc(docId).get().then(doc => {
        if(!doc.exists) return;
        let d = doc.data();
        let docIdStr = doc.id;

        let existing = document.getElementById('joined-details-modal');
        if(existing) existing.remove();

        let bannerImg = getBannerByType(d.type, d.mode || d.title);
        let encodedParticipants = btoa(JSON.stringify(d.participants || []));
        let safeTitle = encodeURIComponent(d.title || d.name || 'Tournament');

        let modalHTML = `
        <div id="joined-details-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 9999; overflow-y: auto; padding: 20px; font-family: sans-serif;">
            <!-- Top Bar -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <button onclick="document.getElementById('joined-details-modal').remove()" style="background: none; border: none; color: #fff; font-size: 20px; font-weight: bold; cursor: pointer;">✕</button>
                <h3 style="margin: 0; font-size: 18px; color: #0ff; font-weight: normal;">View More</h3>
                <div style="width: 20px;"></div>
            </div>

            <!-- Rules Text -->
            <div style="font-size: 11px; color: #a280ff; margin-bottom: 15px; line-height: 1.4; font-weight: bold;">
                <p style="margin: 0 0 4px 0;">*ROOM ID AND PASSWORD WILL DISPLAYED HERE 4 TO 6 MINS PRIOR TO MATCH</p>
                <p style="margin: 0;">*STAY IN YOUR GIVEN ROOM SLOT OR YOU WILL BE KICKED FROM THE ROOM</p>
            </div>

            <p style="font-size: 12px; text-align: center; color: #ccc; margin-bottom: 8px;">*HOW TO JOIN CUSTOM ROOM ?*</p>

            <!-- Banner with Watermark -->
            <div style="width: 100%; height: 170px; border-radius: 10px; overflow: hidden; margin-bottom: 15px; position: relative; background: url('${bannerImg}') center/cover no-repeat;">
                <div style="position: absolute; width: 100%; height: 100%; background: rgba(0,0,0,0.5);"></div>
                <div style="position: relative; z-index: 2; display: flex; align-items: center; justify-content: center; height: 100%; text-align: center; padding: 10px;">
                    <p style="color: #fff; font-size: 13px; margin: 0; opacity: 0.9;">Room Id and Password will be display here before 5-10 min of match start</p>
                </div>
            </div>

            <!-- Action Buttons (View Match & View Entries) -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                <button style="background: #00bcd4; color: #000; border: none; padding: 12px; border-radius: 6px; font-weight: bold; cursor: pointer;">View Match</button>
                <button onclick="openViewEntriesModal('${safeTitle}', '${encodedParticipants}', '${docIdStr}')" style="background: #00bcd4; color: #000; border: none; padding: 12px; border-radius: 6px; font-weight: bold; cursor: pointer;">View Entries</button>
            </div>

            <!-- Countdown Timer Box -->
            <div style="background: #0673ab; padding: 15px; border-radius: 10px; text-align: center; margin-bottom: 15px;">
                <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #fff;">Game Start In</p>
                <div style="display: flex; justify-content: space-around; color: #fff;">
                    <div style="width: 50px; height: 50px; border: 2px solid #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px;">00</div>
                    <div style="width: 50px; height: 50px; border: 2px solid #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px;">00</div>
                    <div style="width: 50px; height: 50px; border: 2px solid #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px;">00</div>
                </div>
            </div>

            <!-- Bottom Buttons (My Entries & Watch Full) -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: auto;">
                <button onclick="openViewEntriesModal('${safeTitle}', '${encodedParticipants}', '${docIdStr}')" style="background: #00bcd4; color: #000; border: none; padding: 12px; border-radius: 6px; font-weight: bold; cursor: pointer;">My Entries</button>
                <button style="background: #00bcd4; color: #000; border: none; padding: 12px; border-radius: 6px; font-weight: bold; cursor: pointer;">Watch Full</button>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    });
};

// ==============================
// 5. FILTER CONTESTS (Status Filtering)
// ==============================
window.filterContests = function(statusType) {
    let existing = document.getElementById("contest-modal");
    if (existing) existing.remove();

    let currentUsername = localStorage.getItem('logged_in_username') || localStorage.getItem('loggedUserNaame') || localStorage.getItem('username') || '';

    let modalHTML = `
    <div id="contest-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 9999; overflow-y: auto; padding: 20px; font-family: sans-serif;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 15px; border-bottom: 1px solid #333; padding-bottom: 10px; align-items: center;">
            <h3 style="color: #ffcc00; margin: 0; font-size: 18px;">🏆 My ${statusType} Contests</h3>
            <button onclick="document.getElementById('contest-modal').remove()" style="background: #ff4444; color: #fff; border: none; padding: 6px 12px; border-radius: 6px; font-weight: bold; cursor: pointer;">✕ Close</button>
        </div>
        <div id="contest-list-content" style="font-size: 14px; color: #ddd;">
            <p style="text-align: center; color: #888;">Loading your contests...</p>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    let listContainer = document.getElementById('contest-list-content');
    let targetTab = (statusType || '').toLowerCase();

    db.collection('tournaments').get().then(snapshot => {
        if (snapshot.empty) {
            listContainer.innerHTML = '<p style="text-align: center; color: #888; padding: 20px;">No tournaments found.</p>';
            return;
        }

        let html = '';
        let foundCount = 0;

        snapshot.forEach(doc => {
            let d = doc.data();
            let docId = doc.id;

            let isJoined = false;
            if (d.participants && Array.isArray(d.participants)) {
                isJoined = d.participants.some(p => p && p.toLowerCase() === currentUsername.toLowerCase());
            }

            if (isJoined) {
                let matchStatus = (d.status || 'upcoming').toLowerCase();

                let matchesTab = false;
                if (targetTab === 'upcoming' && matchStatus === 'upcoming') {
                    matchesTab = true;
                } else if (targetTab === 'completed' && (matchStatus === 'completed' || matchStatus === 'finished')) {
                    matchesTab = true;
                } else if (targetTab === 'ongoing' && matchStatus === 'ongoing') {
                    matchesTab = true;
                }

                if (matchesTab) {
                    foundCount++;
                    let bannerImg = getBannerByType(d.type, d.mode || d.title);
                    
                    html += `
                    <div onclick="openJoinedTournamentDetails('${docId}')" style="background: #1a1a1a; border-radius: 12px; margin-bottom: 15px; overflow: hidden; border: 1px solid #333; cursor: pointer;">
                        <!-- Banner Image -->
                        <div style="width: 100%; height: 160px; overflow: hidden;">
                            <img src="${bannerImg}" style="width: 100%; height: 100%; object-fit: cover;">
                        </div>
                        <!-- Tournament Details -->
                        <div style="padding: 12px;">
                            <h3 style="color: #ffcc00; margin: 0 0 5px 0; font-size: 16px;">${d.title || d.name || 'Tournament'}</h3>
                            <p style="color: #ff5555; font-size: 11px; margin: 0 0 10px 0; font-weight: bold;">${d.subtitle || 'BR • GUN ATTRIBUTES OFF'}</p>

                            <!-- Entry Fee, Prize Pool, Per Kill Box -->
                            <div style="display: flex; justify-content: space-between; background: #111; padding: 8px; border-radius: 8px; margin-bottom: 10px; text-align: center;">
                                <div>
                                    <span style="font-size: 9px; color: #888; display: block;">ENTRY FEE</span>
                                    <span style="color: #2ecc71; font-weight: bold; font-size: 14px;">₹${d.entryFee || 0}</span>
                                </div>
                                <div>
                                    <span style="font-size: 9px; color: #888; display: block;">PRIZE POOL</span>
                                    <span style="color: #f1c40f; font-weight: bold; font-size: 14px;">₹${d.prize || 0}</span>
                                </div>
                                <div>
                                    <span style="font-size: 9px; color: #888; display: block;">PER KILL</span>
                                    <span style="color: #e74c3c; font-weight: bold; font-size: 14px;">₹${d.perKill || 0}</span>
                                </div>
                            </div>

                            <!-- Time, Type, Map Details -->
                            <div style="display: flex; justify-content: space-between; font-size: 11px; color: #aaa; margin-bottom: 12px;">
                                <div>Time: <strong style="color: #ffaa00;">${d.time || 'N/A'}</strong></div>
                                <div>Type: <strong style="color: #fff;">${d.type || d.mode || 'Solo'}</strong></div>
                                <div>Map: <strong style="color: #fff;">${d.map || 'Bermuda'}</strong></div>
                            </div>

                            <!-- Status Badge -->
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="padding: 4px 10px; border-radius: 4px; font-size: 11px; background: ${matchStatus === 'completed' ? '#ff9800' : '#00e676'}; color: #000; font-weight: bold;">${matchStatus.toUpperCase()}</span>
                                <span style="color: #00bcd4; font-size: 12px; font-weight: bold;">TAP TO VIEW ➔</span>
                            </div>
                        </div>
                    </div>`;
                }
            }
        });

        if (foundCount === 0) {
            listContainer.innerHTML = `<p style="text-align: center; color: #888; padding: 20px;">No ${statusType} contests found.</p>`;
        } else {
            listContainer.innerHTML = html;
        }
    }).catch(err => {
        listContainer.innerHTML = `<p style="text-align: center; color: #ff4444; padding: 20px;">Error: ${err.message}</p>`;
    });
};

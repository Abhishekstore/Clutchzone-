// ==========================================
// 1. JOIN TOURNAMENT LOGIC
// ==========================================
window.joinTournament = function(tournamentId) {
    let currentUsername = localStorage.getItem('logged_in_username') || localStorage.getItem('loggedUserName') || localStorage.getItem('username') || '';
    if(!currentUsername) {
        alert('Pehle login karein!');
        return;
    }

    let docRef = db.collection('tournaments').doc(tournamentId);
    docRef.get().then(doc => {
        if(doc.exists) {
            let data = doc.data();
            let participants = data.participants || [];
            
            if(participants.includes(currentUsername)) {
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

// ==========================================
// 2. VIEW PARTICIPANTS / ENTRIES MODAL (Image 4 Style)
// ==========================================
window.openViewEntriesModal = function(tournamentTitle, participantsList, matchId) {
    let existing = document.getElementById('participants-modal');
    if (existing) existing.remove();

    let listHTML = '';
    if(!participantsList || participantsList.length === 0) {
        listHTML = `<p style="text-align:center; color:#888; padding:20px;">Koi entries nahi mili.</p>`;
    } else {
        participantsList.forEach((user, index) => {
            let teamNo = index + 1;
            listHTML += `<div style="padding:12px 15px; border-bottom:1px solid #333; display:flex; justify-content:space-between; align-items:center; color:#000; font-size:14px;">
                <span>• Team: ${teamNo}, Pos: A - <strong style="color:#d32f2f;">${user}</strong></span>
            </div>`;
        });
    }

    let modalHTML = `
    <div id="participants-modal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:10000; display:flex; justify-content:center; align-items:center; padding:20px;">
        <div style="background:#fff; width:100%; max-width:380px; border-radius:12px; overflow:hidden; display:flex; flex-direction:column; max-height:80vh; color:#000;">
            <!-- Header -->
            <div style="background:#512da8; padding:15px; text-align:center; position:relative; color:#fff;">
                <h3 style="margin:0; font-size:16px; font-weight:bold;">VIEW PARTICIPANTS</h3>
                <small style="font-size:12px; opacity:0.8;">Match # ${matchId || '95216'}</small>
                <button onclick="document.getElementById('participants-modal').remove()" style="position:absolute; top:12px; right:12px; background:none; border:none; color:#fff; font-size:18px; cursor:pointer; font-weight:bold;">✕</button>
            </div>
            <!-- List Content -->
            <div style="overflow-y:auto; padding:10px; background:#fff; max-height:60vh;">
                ${listHTML}
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
};

// ==========================================
// 3. BANNER MANAGER FOR ALL MODES
// ==========================================
function getBannerByType(type, mode) {
    let t = (type || '').toLowerCase();
    let m = (mode || '').toLowerCase();
    let combined = (t + ' ' + m).trim();

    if (combined.includes('4vs4') || combined.includes('4v4')) {
        return 'banners/IMG_20260824_221300.jpg'; 
    } 
    else if (combined.includes('3vs3') || combined.includes('3v3')) {
        return 'banners/IMG_20260824_221319.jpg'; 
    } 
    else if (combined.includes('2vs2') || combined.includes('2v2')) {
        return 'banners/IMG_20260824_221338.jpg'; 
    } 
    else if (combined.includes('1vs1') || combined.includes('1v1')) {
        return 'banners/IMG_20260824_221414.jpg'; 
    } 
    else if (combined.includes('squad')) {
        return 'banners/IMG_20260824_221457.jpg'; 
    } 
    else if (combined.includes('duo')) {
        return 'banners/IMG_20260824_221432.jpg'; 
    } 
    else if (combined.includes('solo')) {
        return 'banners/IMG_20260824_221547.jpg'; 
    } 
    else {
        return 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc'; // Default Fallback
    }
}


// ==========================================
// 4. DETAILED JOINED MATCH MODAL (Image 3 Style)
// ==========================================
window.openJoinedTournamentDetails = function(docId) {
    db.collection('tournaments').doc(docId).get().then(doc => {
        if(!doc.exists) return;
        let d = doc.data();
        let docIdStr = doc.id;

        let existing = document.getElementById('joined-details-modal');
        if (existing) existing.remove();

        let bannerImg = getBannerByType(d.type, d.mode || d.title);

        let modalHTML = `
        <div id="joined-details-modal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:#0b0b14; z-index:9999; display:flex; flex-direction:column; padding:15px; color:#fff; overflow-y:auto;">
            <!-- Top Bar -->
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <button onclick="document.getElementById('joined-details-modal').remove()" style="background:none; border:none; color:#fff; font-size:22px; cursor:pointer;">←</button>
                <h3 style="margin:0; font-size:18px; color:#fff; font-weight:normal;">View More</h3>
                <div style="width:20px;"></div>
            </div>

            <!-- Rules Text -->
            <div style="font-size:11px; color:#a280ff; margin-bottom:15px; line-height:1.4; font-weight:bold;">
                <p style="margin:0 0 4px 0;">*ROOM ID AND PASSWORD WILL DISPLAYED HERE 4 TO 6 MINS PRIOR TO MATCH</p>
                <p style="margin:0;">*STAY IN YOUR GIVEN ROOM SLOT OR YOU WILL BE KICKED FROM THE ROOM</p>
            </div>

            <p style="font-size:12px; text-align:center; color:#ccc; margin-bottom:8px;">HOW TO JOIN CUSTOM ROOM ?</p>

            <!-- Banner with Watermark -->
            <div style="width:100%; height:170px; border-radius:10px; overflow:hidden; margin-bottom:15px; background:url('${bannerImg}') no-repeat center center; background-size:cover; position:relative; display:flex; justify-content:center; align-items:center; border:1px solid #333;">
                <div style="position:absolute; width:100%; height:100%; background:rgba(0,0,0,0.5);"></div>
                <div style="position:relative; z-index:2; text-align:center; padding:10px;">
                    <p style="color:#fff; font-size:13px; margin:0; opacity:0.9;">Room id and Password will be display here</p>
                </div>
            </div>

            <!-- Action Buttons (View Match & View Entries) -->
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:15px;">
                <button style="background:#00bcd4; color:#000; border:none; padding:12px; border-radius:6px; font-weight:bold; font-size:13px; cursor:pointer;">VIEW MATCH</button>
                <button onclick="openViewEntriesModal('${d.title || d.name || 'Match'}', ${JSON.stringify(d.participants || [])}, '${docIdStr.slice(-5)}') " style="background:#00bcd4; color:#000; border:none; padding:12px; border-radius:6px; font-weight:bold; font-size:13px; cursor:pointer;">VIEW ENTRIES</button>
            </div>

            <!-- Countdown Timer Box -->
            <div style="background:#673ab7; padding:15px; border-radius:10px; text-align:center; margin-bottom:15px;">
                <p style="margin:0 0 10px 0; font-weight:bold; font-size:13px; color:#fff;">Game Start In</p>
                <div style="display:flex; justify-content:space-around; color:#fff;">
                    <div style="width:50px; height:50px; border:2px solid #fff; border-radius:50%; display:flex; flex-direction:column; justify-content:center; align-items:center;"><span style="font-size:14px; font-weight:bold;">0</span><small style="font-size:8px;">Days</small></div>
                    <div style="width:50px; height:50px; border:2px solid #fff; border-radius:50%; display:flex; flex-direction:column; justify-content:center; align-items:center;"><span style="font-size:14px; font-weight:bold;">13</span><small style="font-size:8px;">Hours</small></div>
                    <div style="width:50px; height:50px; border:2px solid #fff; border-radius:50%; display:flex; flex-direction:column; justify-content:center; align-items:center;"><span style="font-size:14px; font-weight:bold;">28</span><small style="font-size:8px;">Minutes</small></div>
                    <div style="width:50px; height:50px; border:2px solid #fff; border-radius:50%; display:flex; flex-direction:column; justify-content:center; align-items:center;"><span style="font-size:14px; font-weight:bold;">15</span><small style="font-size:8px;">Seconds</small></div>
                </div>
            </div>

            <!-- Bottom Buttons (My Entries & Match Full) -->
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top:auto;">
                <button onclick="openViewEntriesModal('${d.title || d.name || 'Match'}', ${JSON.stringify(d.participants || [])}, '${docIdStr.slice(-5)}') " style="background:#00bcd4; color:#000; border:none; padding:12px; border-radius:6px; font-weight:bold; font-size:13px; cursor:pointer;">MY ENTRIES</button>
                <button style="background:#00bcd4; color:#000; border:none; padding:12px; border-radius:6px; font-weight:bold; font-size:13px; cursor:pointer;">MATCH FULL</button>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    });
};

// ==========================================
// 5. FILTER CONTEXTS (Status Filtering)
// ==========================================
window.filterContests = function(statusType) {
    let existing = document.getElementById('contest-modal');
    if (existing) existing.remove();

    let currentUsername = localStorage.getItem('logged_in_username') || localStorage.getItem('loggedUserName') || localStorage.getItem('username') || '';

    let modalHTML = `
    <div id="contest-modal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:9999; display:flex; flex-direction:column; padding:20px; color:#fff; overflow-y:auto;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid #333; padding-bottom:10px;">
            <h3 style="color:#ffcc00; margin:0; font-size:18px;">🏆 My ${statusType} Contests</h3>
            <button onclick="document.getElementById('contest-modal').remove()" style="background:#ff4444; color:#fff; border:none; padding:6px 12px; border-radius:4px; font-weight:bold; cursor:pointer;">✕ Close</button>
        </div>
        <div id="contest-list-content" style="font-size:14px; color:#ddd;">
            <p style="text-align:center; color:#888;">Loading your contests...</p>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    let listContainer = document.getElementById('contest-list-content');
    let targetTab = (statusType || '').toLowerCase();

    db.collection('tournaments').get().then(snapshot => {
        if(snapshot.empty) {
            listContainer.innerHTML = `<p style="text-align:center; color:#888; padding:20px;">No tournaments found.</p>`;
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
            
            if (matchStatus !== 'completed' && matchStatus !== 'cancelled') {
                if (d.time) {
                    try {
                        let matchTime;
                        if (d.time.includes('-') || d.time.includes('/')) {
                            let parts = d.time.split(' ');
                            let dateParts = parts[0].split(/[-/]/);
                            if (dateParts.length === 3) {
                                let day = parseInt(dateParts[0], 10);
                                let month = parseInt(dateParts[1], 10) - 1;
                                let year = parseInt(dateParts[2], 10);
                                
                                let hours = 0, mins = 0, secs = 0;
                                if (parts[1]) {
                                    let timeParts = parts[1].split(':');
                                    hours = parseInt(timeParts[0] || 0, 10);
                                    mins = parseInt(timeParts[1] || 0, 10);
                                    secs = parseInt(timeParts[2] || 0, 10);
                                    
                                    if (parts[2] && parts[2].toLowerCase() === 'pm' && hours < 12) hours += 12;
                                    if (parts[2] && parts[2].toLowerCase() === 'am' && hours === 12) hours = 0;
                                }
                                matchTime = new Date(year, month, day, hours, mins, secs);
                            } else {
                                matchTime = new Date(d.time);
                            }
                        } else {
                            matchTime = new Date(d.time);
                        }

                        let now = new Date();
                        if (matchTime && !isNaN(matchTime.getTime())) {
                            let diffMins = (now - matchTime) / (1000 * 60);
                            
                            if (diffMins > 45) {
                                matchStatus = 'completed';
                            } else if (diffMins >= 0) {
                                matchStatus = 'ongoing';
                            } else {
                                matchStatus = 'upcoming';
                            }
                        }
                    } catch (e) {
                        matchStatus = (d.status || 'upcoming').toLowerCase();
                    }
                }
            }

            // Automatic Refund Logic
            if (matchStatus === 'cancelled' && Number(d.entryFee || 0) > 0) {
                let refundedUsers = d.refundedUsers || [];
                if (!refundedUsers.includes(currentUsername)) {
                    db.collection('users').doc(currentUsername).get().then(userDoc => {
                        let currentWallet = userDoc.exists && userDoc.data().wallet ? Number(userDoc.data().wallet) : 0;
                        let refundAmount = Number(d.entryFee);
                        let updatedWallet = currentWallet + refundAmount;
                        
                        db.collection('users').doc(currentUsername).set({ wallet: updatedWallet }, { merge: true });
                        refundedUsers.push(currentUsername);
                        db.collection('tournaments').doc(docId).update({ refundedUsers: refundedUsers });
                    }).catch(err => {});
                }
            }


                
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
            <div onclick="openJoinedTournamentDetails('${docId}')" style="background: #1a1a1a; border-radius: 12px; margin-bottom: 15px; overflow: hidden; border: 1px solid #333; cursor: pointer; font-family: sans-serif;">
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

        if(foundCount === 0) {
            listContainer.innerHTML = `<p style="text-align:center; color:#888; padding:20px;">No ${statusType} contests found.</p>`;
        } else {
            listContainer.innerHTML = html;
        }
    }).catch(err => {
        listContainer.innerHTML = `<p style="color:#ff4444; text-align:center;">Error: ${err.message}</p>`;
    });
};

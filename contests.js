// ==============================
// 0. SMART TIME & BANNER DETECTOR
// ==============================
function getTournamentTime(d) {
    if (!d) return 'TBD';
    let candidates = [d.time, d.schedule, d.matchTime, d.match_time, d.date, d.startTime, d.timeSlot, d.timing, d.matchSchedule];
    for (let val of candidates) {
        if (val && typeof val === 'string' && val.trim() !== '' && val !== 'N/A') {
            return val;
        }
    }
    for (let key in d) {
        let val = d[key];
        if (val && typeof val === 'string' && (val.includes(':') || val.toLowerCase().includes('am') || val.toLowerCase().includes('pm'))) {
            return val;
        }
    }
    return 'TBD';
}

function parseTournamentTime(scheduleStr) {
    if (!scheduleStr || scheduleStr === 'TBD') return new Date().getTime() + (3600 * 1000 * 2);
    if (typeof scheduleStr === 'number') return scheduleStr;
    
    let str = String(scheduleStr).trim();
    let parsed = Date.parse(str);
    if (!isNaN(parsed)) return parsed;

    try {
        let parts = str.toLowerCase().split(' ');
        let datePart = parts[0];
        let timePart = parts[1] || parts[0] || '00:00:00';
        let ampm = parts[2] || ''; 

        if (!datePart.includes('-') && !datePart.includes('/')) {
            timePart = datePart;
            datePart = '';
        }

        let tParts = timePart.split(':');
        let hours = parseInt(tParts[0] || 0, 10);
        let minutes = parseInt(tParts[1] || 0, 10);
        let seconds = parseInt(tParts[2] || 0, 10);

        if (ampm === 'pm' && hours < 12) hours += 12;
        if (ampm === 'am' && hours === 12) hours = 0;

        let targetDate = new Date();
        if (datePart) {
            let dParts = datePart.split('-');
            if (dParts.length !== 3) dParts = datePart.split('/');
            if (dParts.length === 3) {
                let year, month, day;
                if (dParts[0].length === 4) {
                    year = dParts[0]; month = dParts[1]; day = dParts[2];
                } else {
                    day = dParts[0]; month = dParts[1]; year = dParts[2];
                }
                targetDate = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10), hours, minutes, seconds);
            }
        } else {
            targetDate.setHours(hours, minutes, seconds, 0);
            if (targetDate.getTime() < new Date().getTime()) {
                targetDate.setDate(targetDate.getDate() + 1);
            }
        }

        let t = targetDate.getTime();
        if (!isNaN(t)) return t;
    } catch(e) {}

    return new Date().getTime() + (3600 * 1000 * 2);
}

function getBannerByType(type, mode, title, subtitle) {
    let combined = ((type || '') + ' ' + (mode || '') + ' ' + (title || '') + ' ' + (subtitle || '')).toLowerCase();
    
    if (combined.includes('4v4') || combined.includes('4*4') || combined.includes('clash squad')) {
        return 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80';
    } else if (combined.includes('3v3') || combined.includes('3*3')) {
        return 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=80';
    } else if (combined.includes('2v2') || combined.includes('2*2')) {
        return 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&auto=format&fit=crop&q=80';
    } else if (combined.includes('1v1') || combined.includes('1*1') || combined.includes('lone wolf')) {
        return 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80';
    } else if (combined.includes('squad')) {
        return 'https://images.unsplash.com/photo-1542751110-97427bbecf20?w=800&auto=format&fit=crop&q=80';
    } else if (combined.includes('duo')) {
        return 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=80';
    } else {
        return 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80';
    }
}

function getTournamentBanner(d) {
    let raw = d.banner || d.bannerUrl || d.image || d.img || d.thumbnail || '';
    if (raw && typeof raw === 'string' && raw.trim() !== '') {
        if (raw.startsWith('http://') || raw.startsWith('https://')) {
            return raw;
        }
        // GitHub raw link builder for user Abhishekstore
        // Yahan 'tournaments' ko apne GitHub Repository ke naam se badal sakte hain agar alag ho
        let githubUsername = 'Abhishekstore';
        let repoName = d.repo || 'tournaments'; 
        let branch = 'main';
        return `https://raw.githubusercontent.com/${githubUsername}/${repoName}/${branch}/${raw}`;
    }
    return getBannerByType(d.type, d.mode, d.title, d.subtitle);
}

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
            <div style="background: #512da8; padding: 15px; position: relative; color: #fff;">
                <h3 style="margin: 0; font-size: 16px; font-weight: bold;">VIEW PARTICIPANTS</h3>
                <small style="font-size: 12px; opacity: 0.8;">Match # ${matchId || '95216'}</small>
                <button onclick="document.getElementById('participants-modal').remove()" style="position: absolute; top: 12px; right: 12px; background: none; border: none; color: #fff; font-size: 18px; font-weight: bold; cursor: pointer;">✕</button>
            </div>
            <div style="overflow-y: auto; padding: 10px; background: #fff; max-height: 60vh;">
                ${listHTML}
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
};

// ==============================
// 3. DETAILED MATCH VIEW
// ==============================
window.openMatchDetailsView = function(docId) {
    db.collection('tournaments').doc(docId).get().then(doc => {
        if(!doc.exists) return;
        let d = doc.data();
        let bannerImg = getTournamentBanner(d);
        let matchTitle = d.title || d.name || 'SOLO BR • GUN ATTRIBUTES OFF';
        let matchIdNum = doc.id;
        let matchTimeDisplay = getTournamentTime(d);

        let existing = document.getElementById('match-details-full-modal');
        if(existing) existing.remove();

        let modalHTML = `
        <div id="match-details-full-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: #121212; z-index: 99999; overflow-y: auto; font-family: sans-serif; color: #fff;">
            <!-- Top Bar -->
            <div style="display: flex; align-items: center; background: #1f1f1f; padding: 15px; border-bottom: 1px solid #333; position: sticky; top: 0; z-index: 10;">
                <button onclick="document.getElementById('match-details-full-modal').remove()" style="background: none; border: none; color: #fff; font-size: 22px; cursor: pointer; margin-right: 15px;">←</button>
                <h3 style="margin: 0; font-size: 15px; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${matchTitle}</h3>
            </div>

            <!-- Banner -->
            <div style="width: 100%; height: 200px; background: #222; overflow: hidden;">
                <img src="${bannerImg}" style="width: 100%; height: 100%; object-fit: cover;">
            </div>

            <!-- Tabs -->
            <div style="display: flex; background: #1a1a1a; border-bottom: 1px solid #333; text-align: center; font-weight: bold; font-size: 13px;">
                <div style="flex: 1; padding: 12px; color: #00bcd4; border-bottom: 2px solid #00bcd4;">DESCRIPTION</div>
                <div style="flex: 1; padding: 12px; color: #aaa;">JOINED MEMBER</div>
            </div>

            <!-- Match Info Box -->
            <div style="padding: 15px; background: #181818;">
                <h2 style="font-size: 16px; color: #00bcd4; margin: 0 0 10px 0; line-height: 1.4;">${matchTitle} • #${matchIdNum}</h2>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 12px;">
                    <div style="background: #222; padding: 10px; border-radius: 8px; text-align: center;">
                        <span style="font-size: 11px; color: #888; display: block;">Type</span>
                        <strong style="font-size: 13px; color: #fff;">${d.type || 'Solo'}</strong>
                    </div>
                    <div style="background: #222; padding: 10px; border-radius: 8px; text-align: center;">
                        <span style="font-size: 11px; color: #888; display: block;">Version</span>
                        <strong style="font-size: 13px; color: #fff;">${d.version || 'TTP'}</strong>
                    </div>
                    <div style="background: #222; padding: 10px; border-radius: 8px; text-align: center;">
                        <span style="font-size: 11px; color: #888; display: block;">Map</span>
                        <strong style="font-size: 13px; color: #fff;">${d.map || 'BERMUDA'}</strong>
                    </div>
                </div>

                <div style="display: flex; justify-content: space-between; background: #222; padding: 10px 15px; border-radius: 8px; margin-bottom: 10px; font-size: 13px;">
                    <span>Match Type: <strong style="color: #00e676;">PAID</strong></span>
                    <span>Entry Fee: <strong style="color: #ffcc00;">🪙 ${d.entryFee || 0}</strong></span>
                </div>

                <div style="background: #222; padding: 10px 15px; border-radius: 8px; font-size: 13px; margin-bottom: 15px;">
                    Matches Schedule: <strong style="color: #ff9800;">${matchTimeDisplay}</strong>
                </div>

                <h4 style="color: #00bcd4; margin: 0 0 10px 0; font-size: 14px;">About This Match</h4>
                
                <div style="background: #1e1e1e; padding: 12px; border-radius: 8px; font-size: 12px; line-height: 1.6; border: 1px solid #333;">
                    <p style="margin: 0 0 8px 0; font-weight: bold; color: #ffcc00;">Instructions Before Joining :</p>
                    <p style="margin: 0 0 6px 0;">🛡️ <strong>FULL MAP — OFFICIAL MATCH RULES</strong></p>
                    <hr style="border: 0; border-top: 1px solid #333; margin: 8px 0;">
                    <p style="margin: 0;">✔ All standard rules apply as per tournament configuration.</p>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    });
};

// ==============================
// 4. DETAILED JOINED MATCH MODAL (Live Countdown)
// ==============================
window.openJoinedTournamentDetails = function(docId) {
    db.collection('tournaments').doc(docId).get().then(doc => {
        if(!doc.exists) return;
        let d = doc.data();
        let docIdStr = doc.id;
        let defaultInstructions = `
            <div style="color: #ddd; font-size: 13px; line-height: 1.6; text-align: left; padding: 5px;">
                <p style="color: #ffcc00; font-weight: bold; margin-bottom: 8px; font-size: 14px;">🛡️ FULL MAP — OFFICIAL MATCH RULES</p>
                
                <p style="color: #ff5555; font-weight: bold; margin: 12px 0 4px 0;">❌ TEAMING & UNREGISTERED PLAYERS</p>
                <ul style="margin: 0; padding-left: 18px; color: #ccc;">
                    <li>Team-Up STRICTLY NOT ALLOWED</li>
                    <li>Unregistered Players NOT ALLOWED</li>
                    <li>BOOYAH PRIZE only if 48 slots are full</li>
                    <li>If caught teaming / calling unregistered → ₹100 PENALTY</li>
                    <li>Repeat offense → PERMANENT BAN (NO WARNING)</li>
                </ul>

                <p style="color: #ff5555; font-weight: bold; margin: 12px 0 4px 0;">📜 GENERAL RULES</p>
                <ul style="margin: 0; padding-left: 18px; color: #ccc;">
                    <li>Breaking any rule → ₹30 PENALTY</li>
                    <li>Missing your match → NO REFUND</li>
                </ul>

                <p style="color: #ffcc00; font-weight: bold; margin: 12px 0 4px 0;">👤 CHARACTERS</p>
                <ul style="margin: 0; padding-left: 18px; color: #ccc;">
                    <li>✔ All Characters ALLOWED</li>
                    <li>❌ RYDEN BANNED (If used → ₹20 PENALTY + KICK)</li>
                </ul>

                <p style="color: #ffcc00; font-weight: bold; margin: 12px 0 4px 0;">🔫 GUN RULES & VEHICLES</p>
                <ul style="margin: 0; padding-left: 18px; color: #ccc;">
                    <li>✔ All Guns ALLOWED | ❌ 2x Vector / M79 NOT ALLOWED</li>
                    <li>✔ Only 1 Vector allowed</li>
                    <li>✔ Vehicles ALLOWED</li>
                </ul>

                <p style="color: #ffcc00; font-weight: bold; margin: 12px 0 4px 0;">🎮 ROOM JOINING & CHAT</p>
                <ul style="margin: 0; padding-left: 18px; color: #ccc;">
                    <li>Once you join room → STAY IN YOUR SLOT (Moving = KICK + NO REFUND)</li>
                    <li>Abusing in room chat → INSTANT KICK</li>
                </ul>

                <p style="color: #ffcc00; font-weight: bold; margin: 12px 0 4px 0;">📹 SCREEN RECORDING & REFUND POLICY</p>
                <ul style="margin: 0; padding-left: 18px; color: #ccc;">
                    <li>Recording MUST BE ON from ID & Password share time</li>
                    <li>Refund only with valid screen recording proof</li>
                    <li>IDP released on app first. Missing ID = No responsibility</li>
                </ul>
            </div>
        `;
        let finalInstructions = (d.instructions && d.instructions.length > 20) ? d.instructions : defaultInstructions;

        let existing = document.getElementById('joined-details-modal');
        if(existing) existing.remove();

        let bannerImg = getTournamentBanner(d);
        let encodedParticipants = btoa(JSON.stringify(d.participants || []));
        let safeTitle = encodeURIComponent(d.title || d.name || 'Tournament');
        let roomBoxContent = 'Room Id and Password will be display here before 5-10 min of match start';
        

        let modalHTML = `
        <div id="joined-details-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 9999; overflow-y: auto; padding: 20px; font-family: sans-serif;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <button onclick="document.getElementById('joined-details-modal').remove()" style="background: none; border: none; color: #fff; font-size: 20px; font-weight: bold; cursor: pointer;">✕</button>
                <h3 style="margin: 0; font-size: 18px; color: #0ff; font-weight: normal;">View More</h3>
                <div style="width: 20px;"></div>
            </div>

            <div style="font-size: 11px; color: #a280ff; margin-bottom: 15px; line-height: 1.4; font-weight: bold;">
                <p style="margin: 0 0 4px 0;">*ROOM ID AND PASSWORD WILL DISPLAYED HERE 4 TO 6 MINS PRIOR TO MATCH</p>
                <p style="margin: 0;">*STAY IN YOUR GIVEN ROOM SLOT OR YOU WILL BE KICKED FROM THE ROOM</p>
            </div>

            <p style="font-size: 12px; text-align: center; color: #ccc; margin-bottom: 8px;">*HOW TO JOIN CUSTOM ROOM ?*</p>

            <div style="width: 100%; height: 170px; border-radius: 10px; overflow: hidden; margin-bottom: 15px; position: relative; background: url('${bannerImg}') center/cover no-repeat;">
                <div style="position: absolute; width: 100%; height: 100%; background: rgba(0,0,0,0.4);"></div>
                <div style="position: relative; z-index: 2; display: flex; align-items: center; justify-content: center; height: 100%; text-align: center; padding: 10px;">
                    ${roomBoxContent}
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                <button onclick="openMatchDetailsView('${docIdStr}')" style="background: #00bcd4; color: #000; border: none; padding: 12px; border-radius: 6px; font-weight: bold; cursor: pointer;">View Match</button>
                <button onclick="openViewEntriesModal('${safeTitle}', '${encodedParticipants}', '${docIdStr}')" style="background: #00bcd4; color: #000; border: none; padding: 12px; border-radius: 6px; font-weight: bold; cursor: pointer;">View Entries</button>
            </div>

            <div style="background: #0673ab; padding: 15px; border-radius: 10px; text-align: center; margin-bottom: 15px;">
                <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #fff;">Game Start In</p>
                <div style="display: flex; justify-content: space-around; color: #fff;">
                    <div id="cdt-hours" style="width: 50px; height: 50px; border: 2px solid #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px;">00</div>
                    <div id="cdt-mins" style="width: 50px; height: 50px; border: 2px solid #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px;">00</div>
                    <div id="cdt-secs" style="width: 50px; height: 50px; border: 2px solid #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px;">00</div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <button onclick="openViewEntriesModal('${safeTitle}', '${encodedParticipants}', '${docIdStr}')" style="background: #00bcd4; color: #000; border: none; padding: 12px; border-radius: 6px; font-weight: bold; cursor: pointer;">My Entries</button>
                <button style="background: #00bcd4; color: #000; border: none; padding: 12px; border-radius: 6px; font-weight: bold; cursor: pointer;">Watch Full</button>
            </div>
                    <div style="background: #151515; border: 1px solid #333; border-radius: 10px; padding: 15px; margin-top: 15px; text-align: left;">
            <h3 style="color: #ffcc00; font-size: 15px; margin-top: 0; margin-bottom: 10px;">Instructions Before Joining :</h3>
            ${finalInstructions}
        </div>
        
        </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        if (window.activeCountdownInterval) clearInterval(window.activeCountdownInterval);
        
        let rawSchedule = getTournamentTime(d);
        let targetTime = parseTournamentTime(rawSchedule);

        window.activeCountdownInterval = setInterval(() => {
            let now = new Date().getTime();
            let distance = targetTime - now;
            
            let hElem = document.getElementById('cdt-hours');
            let mElem = document.getElementById('cdt-mins');
            let sElem = document.getElementById('cdt-secs');

            if (!hElem || !mElem || !sElem) {
                clearInterval(window.activeCountdownInterval);
                return;
            }

            if (distance < 0) {
                hElem.innerText = '00';
                mElem.innerText = '00';
                sElem.innerText = '00';
                clearInterval(window.activeCountdownInterval);
                return;
            }
            let hours = Math.floor(distance / (1000 * 60 * 60));
            let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            let seconds = Math.floor((distance % (1000 * 60)) / 1000);

            hElem.innerText = String(hours).padStart(2, '0');
            mElem.innerText = String(minutes).padStart(2, '0');
            sElem.innerText = String(seconds).padStart(2, '0');
        }, 1000);
    });
};

// ==============================
// 5. FILTER CONTESTS (Status Filtering with Auto-Time Expiry)
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
        let nowTime = new Date().getTime();

        snapshot.forEach(doc => {
            let d = doc.data();
            let docId = doc.id;

            let isJoined = false;
            if (d.participants && Array.isArray(d.participants)) {
                isJoined = d.participants.some(p => p && p.toLowerCase() === currentUsername.toLowerCase());
            }

            if (isJoined) {
                let matchStatus = (d.status || 'upcoming').toLowerCase();
                let displayTime = getTournamentTime(d);
                let targetMatchTime = parseTournamentTime(displayTime);

                // SMART TIME OVERRIDE: Agar match ka time nikal chuka hai, toh status ko automatic completed maan lo
                if (matchStatus === 'upcoming' && targetMatchTime < nowTime) {
                    matchStatus = 'completed';
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
                    let bannerImg = getTournamentBanner(d);
                    
                    html += `
                    <div onclick="openJoinedTournamentDetails('${docId}')" style="background: #1a1a1a; border-radius: 12px; margin-bottom: 15px; overflow: hidden; border: 1px solid #333; cursor: pointer;">
                        <div style="width: 100%; height: 160px; overflow: hidden; background: #222;">
                            <img src="${bannerImg}" style="width: 100%; height: 100%; object-fit: cover;">
                        </div>
                        <div style="padding: 12px;">
                            <h3 style="color: #ffcc00; margin: 0 0 5px 0; font-size: 16px;">${d.title || d.name || 'Tournament'}</h3>
                            <p style="color: #ff5555; font-size: 11px; margin: 0 0 10px 0; font-weight: bold;">${d.subtitle || 'BR • GUN ATTRIBUTES OFF'}</p>

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

                            <div style="display: flex; justify-content: space-between; font-size: 11px; color: #aaa; margin-bottom: 12px;">
                                <div>Time: <strong style="color: #ffaa00;">${displayTime}</strong></div>
                                <div>Type: <strong style="color: #fff;">${d.type || d.mode || 'Solo'}</strong></div>
                                <div>Map: <strong style="color: #fff;">${d.map || 'Bermuda'}</strong></div>
                            </div>

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

// --- THRIPUDI LIBRARY STABLE MASTER SCRIPT ---

const firebaseConfig = { 
    apiKey: "AIzaSyBzwhpHmeZdLf_nZrcPQirlnpj3Vhg9EqA", 
    authDomain: "thripudilibrary.firebaseapp.com", 
    projectId: "thripudilibrary", 
    storageBucket: "thripudilibrary.firebasestorage.app", 
    messagingSenderId: "887018912750", 
    appId: "1:887018912750:web:cc05190a72b13db816acff" 
};

// ഫയർബേസ് ഇനിഷ്യലൈസേഷൻ
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
let currentAudioId = null;
let bgMusic;

// 1. മ്യൂസിക് സിസ്റ്റം ഇൻജക്ഷൻ (പഴയ ലോജിക്കിനെ ബാധിക്കില്ല)
function injectMusicSystem() {
    if (document.getElementById('bgMusic')) return;
    const audioHTML = `<audio id="bgMusic" loop preload="auto"><source src="assets/cover/bg.mp3" type="audio/mpeg"></audio>`;
    document.body.insertAdjacentHTML('afterbegin', audioHTML);
    bgMusic = document.getElementById("bgMusic");
    if (bgMusic) bgMusic.volume = 0.2;

    const navSearch = setInterval(() => {
        const navLinks = document.querySelector('.nav-links') || document.querySelector('.navbar');
        if (navLinks && !document.getElementById('music-nav-item')) {
            const musicBtnHTML = `<a class="nav-item" id="music-nav-item" href="javascript:void(0)" onclick="toggleBGMusic()" style="font-weight:bold; color:#004D40; cursor:pointer; display:inline-flex; align-items:center; gap:5px; margin-right:10px;"><i id="music-icon" class="fas fa-volume-mute"></i> Music</a>`;
            navLinks.insertAdjacentHTML('afterbegin', musicBtnHTML);
            clearInterval(navSearch);
        }
    }, 500);
}

window.toggleBGMusic = function() {
    const icon = document.getElementById("music-icon");
    if (!bgMusic) bgMusic = document.getElementById("bgMusic");
    if (bgMusic.paused) {
        bgMusic.play().then(() => { if(icon) icon.className = "fas fa-volume-up"; });
    } else {
        bgMusic.pause();
        if(icon) icon.className = "fas fa-volume-mute";
    }
};

document.addEventListener('DOMContentLoaded', () => {
    injectMusicSystem(); // മ്യൂസിക് ലോഡ് ചെയ്യുന്നു
    const userAvatarImg = document.getElementById('user-avatar-img');
    const defaultUserImg = 'assets/cover/default_user.jpg';
    const dName = document.getElementById('display-name');

    auth.onAuthStateChanged(user => {
        if (user) {
            if(dName) dName.innerText = user.displayName ? user.displayName.split(' ')[0] : "സുഹൃത്തേ";
            if(userAvatarImg) userAvatarImg.src = user.photoURL ? user.photoURL : defaultUserImg;
        } else {
            if(userAvatarImg) userAvatarImg.src = defaultUserImg;
            if(dName) dName.innerText = "അതിഥി";
        }
    });

    const profileBtn = document.getElementById('user-profile-btn');
    const dropdown = document.getElementById('profile-dropdown');
    if (profileBtn) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.style.display = (dropdown.style.display === 'block') ? 'none' : 'block';
        });
    }
    window.addEventListener('click', () => { if(dropdown) dropdown.style.display = 'none'; });
});

// 2. ആക്സസ് ലോജിക് (താങ്കളുടെ പഴയ കോഡ് - വീഡിയോ ബാക്ക് ബട്ടൺ മാത്രം ചേർത്തു)
window.checkAccess = function(id, type, cardId) {
    if (!auth.currentUser) {
        let msg = "ലോഗിൻ ചെയ്യുക";
        if(type === 'pdf') msg = "വായിക്കാനായി ലോഗിൻ ചെയ്യുക";
        else if(type === 'audio') msg = "കേൾക്കാനായി ലോഗിൻ ചെയ്യുക";
        else if(type === 'video') msg = "കാണാനായി ലോഗിൻ ചെയ്യുക";
        document.getElementById('loginMsg').innerText = msg;
        const currentPage = window.location.pathname.split("/").pop();
        document.getElementById('login-btn-link').href = `login.html?redirect=${currentPage}`;
        document.getElementById('loginAlertModal').style.setProperty('display', 'flex', 'important');
    } else {
        const cardElement = document.getElementById(cardId);
        const bName = cardElement.querySelector('.book-title').innerText;
        const bThumb = cardElement.querySelector('.book-cover').src;
        const uid = auth.currentUser.uid;

        let history = JSON.parse(localStorage.getItem('thripudi_history_' + uid)) || [];
        history = history.filter(item => item.id !== id);
        history.push({ id: id, name: bName, thumb: bThumb, date: new Date().toLocaleDateString('ml-IN') });
        if (history.length > 20) history.shift();
        localStorage.setItem('thripudi_history_' + uid, JSON.stringify(history));

        // സംഗീതം നിർത്തുന്നു
        if(type !== 'pdf' && bgMusic) bgMusic.pause();

        if (type === 'audio') {
            if (currentAudioId && currentAudioId !== id) {
                document.getElementById('player-' + currentAudioId).innerHTML = "";
                document.getElementById('card-' + currentAudioId).classList.remove('audio-active');
            }
            // താങ്കളുടെ പഴയ അതേ പ്ലെയർ ഇൻജക്ഷൻ
            document.getElementById('player-' + id).innerHTML = `<div class="player-mask" style="width:80px;height:50px;"></div><iframe src="https://drive.google.com/file/d/${id}/preview?rm=minimal" style="width:100%; height:100%; border:none;" scrolling="no"></iframe>`;
            document.getElementById(cardId).classList.add('audio-active');
            currentAudioId = id;
        } else if (type === 'video') {
            // ബാക്ക് ബട്ടണിനായി ഹിസ്റ്ററി സ്റ്റേറ്റ് ചേർക്കുന്നു
            window.history.pushState({modal: "video"}, ""); 
            
            // വൈറ്റ് ബാക്ക് ബട്ടൺ സഹിതമുള്ള വീഡിയോ പ്ലെയർ
            document.getElementById('videoFrameContainer').innerHTML = `
                <div class="player-mask" style="width:70px; height:70px; position:absolute; top:0; right:0; z-index:999; background:transparent;"></div>
                <button onclick="window.closeVideo()" style="position:absolute; top:15px; left:15px; z-index:1000; background:white; border:none; border-radius:50%; width:35px; height:35px; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 10px rgba(0,0,0,0.5); cursor:pointer;">
                    <i class="fas fa-arrow-left" style="color:#333; font-size:18px;"></i>
                </button>
                <iframe src="https://drive.google.com/file/d/${id}/preview?rm=minimal" style="width:100%; height:100%; border:none;" allow="autoplay"></iframe>`;
            document.getElementById('videoOverlay').style.display = 'flex';
            document.body.style.overflow = "hidden";
        } else {
            window.history.pushState({modal: "pdf"}, "");
            document.getElementById('pdfFrame').src = `https://drive.google.com/file/d/${id}/preview?rm=minimal`;
            document.getElementById('pdfModal').style.display = 'flex';
            document.body.style.overflow = "hidden";
        }
    }
};

// 3. നാവിഗേഷൻ ലോജിക്
window.onpopstate = function() {
    if (document.getElementById('videoOverlay').style.display === 'flex') closeVideoLogic();
    if (document.getElementById('pdfModal').style.display === 'flex') closePdfLogic();
};

function closeVideoLogic() {
    document.getElementById('videoOverlay').style.display = 'none';
    document.getElementById('videoFrameContainer').innerHTML = "";
    document.body.style.overflow = "auto";
}

function closePdfLogic() {
    document.getElementById('pdfModal').style.display = 'none';
    document.getElementById('pdfFrame').src = "";
    document.body.style.overflow = "auto";
}

function logoutUser() { auth.signOut().then(() => { window.location.href = "logout_success.html"; }); }
function closeLoginPopup() { document.getElementById('loginAlertModal').style.setProperty('display', 'none', 'important'); }
function closeVideo() { 
    if (window.history.state && window.history.state.modal === "video") window.history.back(); 
    else closeVideoLogic(); 
}
function closePdfModal() { 
    if (window.history.state && window.history.state.modal === "pdf") window.history.back(); 
    else closePdfLogic(); 
}

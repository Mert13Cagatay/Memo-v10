// account-management.js
// Kullanıcı hesabı yönetimi için merkezi script dosyası

// Kullanıcı hesap bilgilerini güncelle
function updateAccountDisplay() {
    // Mevcut kullanıcıyı localStorage'dan al
    const localUser = JSON.parse(localStorage.getItem('memo-current-user'));
    
    // Avatar, isim ve email elementlerini al
    const avatarElement = document.getElementById('accountAvatar');
    const nameElement = document.getElementById('accountName');
    const emailElement = document.getElementById('accountEmail');
    
    // Logout butonunu al
    const logoutButton = document.getElementById('logoutButton');
    
    if (localUser && localUser.loggedIn) {
        // Kullanıcı giriş yapmışsa hesap bilgilerini göster
        if (nameElement) nameElement.textContent = localUser.name || localUser.username || localUser.email.split('@')[0];
        if (emailElement) emailElement.textContent = localUser.email;
        if (avatarElement) avatarElement.textContent = (localUser.name || localUser.username || localUser.email)[0].toUpperCase();
        
        // Logout butonu olarak ayarla
        if (logoutButton) {
            logoutButton.innerHTML = `
                <i class="fas fa-sign-out-alt"></i>
                Logout
            `;
            // Her ihtimale karşı eski event listener'ları temizle
            const newLogoutButton = logoutButton.cloneNode(true);
            logoutButton.parentNode.replaceChild(newLogoutButton, logoutButton);
            // Yeni event listener ekle
            newLogoutButton.addEventListener('click', handleLogout);
        }
    } else {
        // Kullanıcı giriş yapmamışsa misafir bilgilerini göster
        if (nameElement) nameElement.textContent = 'Guest';
        if (emailElement) emailElement.textContent = 'Not logged in';
        if (avatarElement) avatarElement.textContent = '?';
        
        // Login butonu olarak ayarla
        if (logoutButton) {
            logoutButton.innerHTML = `
                <i class="fas fa-sign-in-alt"></i>
                Login
            `;
            // Login sayfasına yönlendirme için event listener ekle
            const newLogoutButton = logoutButton.cloneNode(true);
            logoutButton.parentNode.replaceChild(newLogoutButton, logoutButton);
            newLogoutButton.addEventListener('click', function() {
                goToPage('login.html');
            });
        }
    }
}

// Logout işlemini gerçekleştir
function handleLogout(event) {
    console.log("Logout function called");
    
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    // Butonun tıklanabilirliğini devre dışı bırak
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.style.pointerEvents = 'none';
        logoutButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging out...';
    }
    
    // localStorage ve sessionStorage'dan kullanıcı bilgilerini temizle
    localStorage.removeItem('memo-current-user');
    sessionStorage.removeItem('memo-current-user');
    
    // Firebase Auth varsa çıkış yap
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().signOut()
            .then(() => {
                console.log('User signed out from Firebase');
                redirectAfterLogout();
            })
            .catch((error) => {
                console.error('Error signing out from Firebase:', error);
                // Firebase hatası olsa bile çıkış yap
                redirectAfterLogout();
            });
    } else {
        console.log('Firebase Auth not available, using local logout');
        redirectAfterLogout();
    }
    
    // Çıkış sonrası ana sayfaya yönlendir
    function redirectAfterLogout() {
        // Firebase'den çıkış sinyalinin işlenmesi için kısa bir bekleme
        setTimeout(() => {
            console.log('Redirecting to index.html after logout');
            window.location.href = 'index.html';
        }, 500);
    }
    
    // Event'in varsayılan davranışını engelle
    return false;
}

// Account dropdown menüsünü aç/kapat
function toggleAccountDropdown(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    const dropdown = document.getElementById('accountDropdown');
    if (dropdown) {
        dropdown.classList.toggle('active');
    }
}

// Sayfa yüklendiğinde hesap yönetimi için event listener'ları ekle
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded, setting up account management");
    
    // Hesap bilgilerini güncelle
    updateAccountDisplay();
    
    // Hesap simgesine tıklandığında dropdown'ı aç/kapat
    const accountIcon = document.querySelector('.account-icon');
    if (accountIcon) {
        accountIcon.addEventListener('click', toggleAccountDropdown);
    }
    
    // Dışarı tıklandığında dropdown'ı kapat
    document.addEventListener('click', function(event) {
        const accountMenu = document.querySelector('.account-menu');
        const dropdown = document.getElementById('accountDropdown');
        
        if (accountMenu && dropdown && !accountMenu.contains(event.target)) {
            dropdown.classList.remove('active');
        }
    });
    
    // Logout butonuna tıklandığında logout fonksiyonunu çağır
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        // Elementin klonunu oluşturarak eski tüm event listener'ları temizle
        const newLogoutButton = logoutButton.cloneNode(true);
        logoutButton.parentNode.replaceChild(newLogoutButton, logoutButton);
        
        // Kullanıcı giriş durumuna göre doğru event listener'ı ekle
        const currentUser = JSON.parse(localStorage.getItem('memo-current-user'));
        if (currentUser && currentUser.loggedIn) {
            newLogoutButton.addEventListener('click', handleLogout);
            console.log("Logout event listener added");
        } else {
            newLogoutButton.addEventListener('click', function() {
                goToPage('login.html');
            });
            console.log("Login redirect event listener added");
        }
    }
});

// Gezinme yardımcı fonksiyonu
function goToPage(url) {
    window.location.href = url;
}
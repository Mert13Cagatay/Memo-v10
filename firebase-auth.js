function registerUser(email, password, username) {
    if (!firebase.auth) {
        console.error("Firebase Auth not available");
        return Promise.reject(new Error("Firebase Auth not available"));
    }

    return firebase.auth().createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Kullanıcı hesabı oluşturuldu
            const user = userCredential.user;
            
            // Kullanıcı profil bilgilerini Firestore'a kaydet
            return firebase.firestore().collection('users').doc(user.uid).set({
                id: user.uid,
                username: username || email.split('@')[0],
                email: email,
                createdAt: new Date().toISOString(),
                loggedIn: true
            })
            .then(() => {
                // Kullanıcı bilgilerini localStorage'a da kaydet
                const userData = {
                    id: user.uid,
                    username: username || email.split('@')[0],
                    email: email,
                    loggedIn: true
                };
                localStorage.setItem('memo-current-user', JSON.stringify(userData));
                return userData;
            });
        });
}
  
// Kullanıcı girişi - geliştirilmiş sürüm
function loginUser(email, password, rememberMe = true) {
    if (!firebase.auth) {
        console.error("Firebase Auth not available");
        return loginLocalUser(email, password, rememberMe);
    }

    return firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Giriş başarılı
            const user = userCredential.user;
            
            // Kullanıcı bilgilerini Firestore'dan al
            return firebase.firestore().collection('users').doc(user.uid).get()
                .then((doc) => {
                    let userData;
                    
                    if (doc.exists) {
                        userData = doc.data();
                        userData.loggedIn = true; // Oturum açık olarak işaretle
                    } else {
                        // Kullanıcı Firebase Auth'da var ama Firestore'da yoksa
                        userData = {
                            id: user.uid,
                            email: user.email,
                            username: user.displayName || user.email.split('@')[0],
                            loggedIn: true
                        };
                        
                        // Firestore'a kullanıcı bilgilerini kaydet
                        return firebase.firestore().collection('users').doc(user.uid).set(userData)
                            .then(() => userData);
                    }
                    
                    // Kullanıcı bilgilerini her zaman localStorage'a kaydet
                    localStorage.setItem('memo-current-user', JSON.stringify(userData));
                    
                    if (rememberMe) {
                        // RememberMe seçiliyse sessionStorage'a da kaydet
                        sessionStorage.setItem('memo-current-user', JSON.stringify(userData));
                    }
                    
                    return userData;
                });
        });
}

// Kullanıcı çıkışı
function logoutUser() {
    // LocalStorage ve sessionStorage'dan kullanıcı bilgilerini temizle
    localStorage.removeItem('memo-current-user');
    sessionStorage.removeItem('memo-current-user');
    
    // Eğer Firebase Auth mevcutsa, çıkış yap
    if (firebase.auth) {
        return firebase.auth().signOut();
    } else {
        return Promise.resolve();
    }
}

// Çevrimdışı giriş için yardımcı fonksiyon
function loginLocalUser(email, password, rememberMe) {
    console.log("Using local login as fallback");
    
    // localStorage'dan kullanıcılar listesini al
    const users = JSON.parse(localStorage.getItem('memo-users')) || [];
    
    // Email ile kullanıcıyı bul
    const user = users.find(u => u.email === email);
    
    // Kullanıcı bulunamadı veya şifre yanlış
    if (!user || user.password !== password) {
        return Promise.reject(new Error('Email veya şifre yanlış.'));
    }
    
    // Giriş başarılı, localStorage'a kaydet
    const userData = {
        id: user.id,
        name: user.name || user.username || user.email.split('@')[0],
        email: user.email,
        loggedIn: true  // Bu alan çok önemli
    };
    
    localStorage.setItem('memo-current-user', JSON.stringify(userData));
    
    if (rememberMe) {
        sessionStorage.setItem('memo-current-user', JSON.stringify(userData));
    }
    
    return Promise.resolve(userData);
}

// Kullanıcı oturum durumunu kontrol et - geliştirilmiş sürüm
function checkAuthState() {
    return new Promise((resolve) => {
        // Önce localStorage'dan kullanıcı bilgisini kontrol et
        const localUser = JSON.parse(localStorage.getItem('memo-current-user'));
        
        if (localUser && localUser.loggedIn) {
            // Eğer localStorage'da oturum açık bir kullanıcı varsa kullan
            return resolve(localUser);
        }
        
        // Firebase Auth varsa onunla kontrol et
        if (firebase.auth) {
            firebase.auth().onAuthStateChanged((user) => {
                if (user) {
                    // Firebase Auth'da kullanıcı varsa, Firestore'dan bilgileri al
                    firebase.firestore().collection('users').doc(user.uid).get()
                        .then((doc) => {
                            if (doc.exists) {
                                const userData = doc.data();
                                userData.loggedIn = true; // Oturum açık olarak işaretle
                                
                                // localStorage'a kaydet
                                localStorage.setItem('memo-current-user', JSON.stringify(userData));
                                
                                resolve(userData);
                            } else {
                                // Firestore'da kullanıcı yoksa temel bilgilerle oluştur
                                const userData = {
                                    id: user.uid,
                                    email: user.email,
                                    username: user.displayName || user.email.split('@')[0],
                                    loggedIn: true
                                };
                                
                                // Firestore'a kaydet
                                firebase.firestore().collection('users').doc(user.uid).set(userData)
                                    .then(() => {
                                        localStorage.setItem('memo-current-user', JSON.stringify(userData));
                                        resolve(userData);
                                    })
                                    .catch(error => {
                                        console.error("Error saving user data:", error);
                                        localStorage.setItem('memo-current-user', JSON.stringify(userData));
                                        resolve(userData);
                                    });
                            }
                        })
                        .catch(error => {
                            console.error("Error fetching user data:", error);
                            
                            // Hata durumunda temel kullanıcı bilgilerini döndür
                            const userData = {
                                id: user.uid,
                                email: user.email,
                                username: user.displayName || user.email.split('@')[0],
                                loggedIn: true
                            };
                            
                            localStorage.setItem('memo-current-user', JSON.stringify(userData));
                            resolve(userData);
                        });
                } else {
                    // Kullanıcı giriş yapmamış
                    resolve(null);
                }
            });
        } else {
            // Firebase Auth yoksa, null döndür
            resolve(null);
        }
    });
}

// Global objeye fonksiyonları ekle
window.registerUser = registerUser;
window.loginUser = loginUser;
window.logoutUser = logoutUser;
window.loginLocalUser = loginLocalUser;
window.checkAuthState = checkAuthState;
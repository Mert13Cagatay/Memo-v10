const firebaseConfig = {
    apiKey: "AIzaSyCp5mAzy8oHAkS4F1hAVc__VkzWccKKqM8",
    authDomain: "memo-v8.firebaseapp.com",
    projectId: "memo-v8",
    storageBucket: "memo-v8.firebasestorage.app",
    messagingSenderId: "370054675081",
    appId: "1:370054675081:web:64c7d39ea25ce3a3f2e458",
    measurementId: "G-S6VYQKS2JM"
};


// Firebase başlatma fonksiyonu
function initializeFirebase() {
    // Firebase'in zaten başlatılıp başlatılmadığını kontrol et
    if (typeof firebase !== 'undefined') {
        if (!firebase.apps || !firebase.apps.length) {
            try {
                firebase.initializeApp(firebaseConfig);
                console.log("Firebase initialized successfully");
                
                // Auth ve Firestore referanslarını al
                const auth = firebase.auth();
                const db = firebase.firestore();
                
                // Çevrimdışı veri desteğini etkinleştir
                db.enablePersistence()
                    .then(() => {
                        console.log("Offline persistence enabled");
                    })
                    .catch((err) => {
                        if (err.code === 'failed-precondition') {
                            console.warn("Persistence failed: Multiple tabs open");
                        } else if (err.code === 'unimplemented') {
                            console.warn("Persistence not supported by browser");
                        }
                    });
                
                return { auth, db };
            } catch (error) {
                console.error("Firebase initialization error:", error);
                return null;
            }
        } else {
            console.log("Firebase already initialized");
            return {
                auth: firebase.auth(),
                db: firebase.firestore()
            };
        }
    } else {
        console.error("Firebase SDK not loaded");
        return null;
    }
}

// Firebase örneğini global olarak dışa aktar
window.firebaseInstance = initializeFirebase();
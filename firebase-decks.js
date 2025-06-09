// firebase-decks.js - güncellenmiş deste yönetimi işlemleri

// Kullanıcının destelerini Firestore'dan getir
function fetchUserDecks(userId) {
    if (!firebase.firestore) {
        console.error("Firestore not available");
        return fetchUserDecksFromLocalStorage(userId);
    }

    return firebase.firestore().collection('decks')
        .where('userId', '==', userId)
        .get()
        .then((querySnapshot) => {
            const decks = [];
            querySnapshot.forEach((doc) => {
                decks.push(doc.data());
            });

            // Desteleri localStorage'a da kaydet
            saveDecksToLocalStorage(decks);

            return decks;
        })
        .catch(error => {
            console.error("Error fetching decks from Firestore:", error);
            return fetchUserDecksFromLocalStorage(userId);
        });
}

// Tüm varsayılan desteleri getir
function fetchDefaultDecks() {
    if (!firebase.firestore) {
        console.error("Firestore not available");
        return fetchDefaultDecksFromLocalStorage();
    }

    return firebase.firestore().collection('decks')
        .where('userId', '==', 'system-demo-decks')
        .get()
        .then((querySnapshot) => {
            const defaultDecks = [];
            querySnapshot.forEach((doc) => {
                defaultDecks.push(doc.data());
            });

            // Varsayılan desteleri localStorage'a da kaydet
            saveDefaultDecksToLocalStorage(defaultDecks);

            return defaultDecks;
        })
        .catch(error => {
            console.error("Error fetching default decks from Firestore:", error);
            return fetchDefaultDecksFromLocalStorage();
        });
}

// Desteyi Firestore'a kaydet
function saveDeck(deck) {
    // Önce local storage'a kaydet (her durumda)
    updateLocalDecks(deck);
    
    if (!firebase.firestore) {
        console.error("Firestore not available");
        return Promise.resolve(deck);
    }

    return firebase.firestore().collection('decks').doc(deck.id).set(deck)
        .then(() => {
            return deck;
        })
        .catch(error => {
            console.error("Error saving deck to Firestore:", error);
            // Hata durumunda bile local storage'a kaydedildiği için deck'i döndür
            return deck;
        });
}

// Desteyi Firestore'dan sil
function deleteDeck(deckId) {
    // Önce localStorage'dan sil (her durumda)
    const decks = JSON.parse(localStorage.getItem('memo-decks')) || [];
    const updatedDecks = decks.filter(deck => deck.id !== deckId);
    localStorage.setItem('memo-decks', JSON.stringify(updatedDecks));
    
    if (!firebase.firestore) {
        console.error("Firestore not available");
        return Promise.resolve(deckId);
    }

    return firebase.firestore().collection('decks').doc(deckId).delete()
        .then(() => {
            return deckId;
        })
        .catch(error => {
            console.error("Error deleting deck from Firestore:", error);
            // Hata durumunda bile localStorage'dan silindi, deckId'yi döndür
            return deckId;
        });
}

// Pratik geçmişini kaydet
function savePracticeHistory(userId, practiceSession) {
    practiceSession.userId = userId;
    
    // Pratik geçmişini localStorage'a kaydet (her durumda)
    const practiceHistory = JSON.parse(localStorage.getItem(`memo-practice-history-${userId}`)) || [];
    practiceHistory.push(practiceSession);
    localStorage.setItem(`memo-practice-history-${userId}`, JSON.stringify(practiceHistory));
    
    if (!firebase.firestore) {
        console.error("Firestore not available");
        return Promise.resolve(practiceSession);
    }

    return firebase.firestore().collection('practice-history')
        .doc(practiceSession.id)
        .set(practiceSession)
        .then(() => {
            return practiceSession;
        })
        .catch(error => {
            console.error("Error saving practice history to Firestore:", error);
            // Hata durumunda bile localStorage'a kaydedildiği için oturumu döndür
            return practiceSession;
        });
}

// Pratik geçmişini getir
function fetchPracticeHistory(userId) {
    if (!firebase.firestore) {
        console.error("Firestore not available");
        return fetchPracticeHistoryFromLocalStorage(userId);
    }

    return firebase.firestore().collection('practice-history')
        .where('userId', '==', userId)
        .get()
        .then((querySnapshot) => {
            const practiceHistory = [];
            querySnapshot.forEach((doc) => {
                practiceHistory.push(doc.data());
            });

            localStorage.setItem(`memo-practice-history-${userId}`, JSON.stringify(practiceHistory));

            return practiceHistory;
        })
        .catch(error => {
            console.error("Error fetching practice history from Firestore:", error);
            return fetchPracticeHistoryFromLocalStorage(userId);
        });
}

// Yerel desteyi güncelle
function updateLocalDecks(updatedDeck) {
    const decks = JSON.parse(localStorage.getItem('memo-decks')) || [];
    const existingIndex = decks.findIndex(deck => deck.id === updatedDeck.id);

    if (existingIndex >= 0) {
        decks[existingIndex] = updatedDeck;
    } else {
        decks.push(updatedDeck);
    }

    localStorage.setItem('memo-decks', JSON.stringify(decks));
}

// LocalStorage'dan kullanıcı destelerini getir - yardımcı fonksiyon
function fetchUserDecksFromLocalStorage(userId) {
    const decks = JSON.parse(localStorage.getItem('memo-decks')) || [];
    return Promise.resolve(decks.filter(deck => deck.userId === userId));
}

// LocalStorage'dan varsayılan desteleri getir - yardımcı fonksiyon
function fetchDefaultDecksFromLocalStorage() {
    const decks = JSON.parse(localStorage.getItem('memo-decks')) || [];
    return Promise.resolve(decks.filter(deck => deck.userId === 'system-demo-decks'));
}

// LocalStorage'dan pratik geçmişini getir - yardımcı fonksiyon
function fetchPracticeHistoryFromLocalStorage(userId) {
    const practiceHistory = JSON.parse(localStorage.getItem(`memo-practice-history-${userId}`)) || [];
    return Promise.resolve(practiceHistory);
}

// LocalStorage'a desteleri kaydet - yardımcı fonksiyon
function saveDecksToLocalStorage(decks) {
    const existingDecks = JSON.parse(localStorage.getItem('memo-decks')) || [];
    
    // Mevcut desteleri ID'ye göre filtrele (yeni getirilen desteleri hariç tut)
    const deckIds = decks.map(deck => deck.id);
    const filteredDecks = existingDecks.filter(deck => !deckIds.includes(deck.id));
    
    // Filtrelenmiş ve yeni desteleri birleştir
    const updatedDecks = [...filteredDecks, ...decks];
    
    localStorage.setItem('memo-decks', JSON.stringify(updatedDecks));
}

// LocalStorage'a varsayılan desteleri kaydet - yardımcı fonksiyon
function saveDefaultDecksToLocalStorage(defaultDecks) {
    const existingDecks = JSON.parse(localStorage.getItem('memo-decks')) || [];
    
    // Mevcut varsayılan olmayan desteleri filtrele
    const filteredDecks = existingDecks.filter(deck => deck.userId !== 'system-demo-decks');
    
    // Filtrelenmiş ve varsayılan desteleri birleştir
    const updatedDecks = [...filteredDecks, ...defaultDecks];
    
    localStorage.setItem('memo-decks', JSON.stringify(updatedDecks));
}

// Tüm varsayılan desteleri yeni kullanıcıya ekle
function addDefaultDecksToNewUser(userId) {
    if (!userId) {
        console.error("User ID is required to add default decks");
        return Promise.reject(new Error("User ID is required"));
    }

    console.log("Adding default decks for user:", userId);

    // Global defaultDecks değişkenini kontrol et
    if (!window.defaultDecks || !Array.isArray(window.defaultDecks)) {
        console.error("Default decks not found in global scope.");
        return Promise.resolve([]);
    }

    const decksToSave = window.defaultDecks.map(deck => {
        const cardsWithIds = deck.cards.map(card => ({
            id: 'card-' + Date.now() + '-' + Math.floor(Math.random() * 10000),
            front: card.front,
            back: card.back,
            createdAt: new Date().toISOString()
        }));

        return {
            id: 'deck-' + Date.now() + '-' + Math.floor(Math.random() * 10000),
            userId: userId,
            name: deck.name,
            description: deck.description,
            createdAt: new Date().toISOString(),
            cards: cardsWithIds
        };
    });

    // Desteleri localStorage'a kaydet
    const existingDecks = JSON.parse(localStorage.getItem('memo-decks')) || [];
    const updatedDecks = [...existingDecks, ...decksToSave];
    localStorage.setItem('memo-decks', JSON.stringify(updatedDecks));

    // Eğer Firestore mevcutsa, desteleri oraya da kaydet
    if (firebase.firestore) {
        return Promise.all(decksToSave.map(deck => 
            firebase.firestore().collection('decks').doc(deck.id).set(deck)
        ))
        .then(() => decksToSave)
        .catch(error => {
            console.error("Error saving default decks to Firestore:", error);
            // Hata durumunda bile localStorage'a kaydedildiği için desteleri döndür
            return decksToSave;
        });
    } else {
        return Promise.resolve(decksToSave);
    }
}

// Global objeye fonksiyonları ekle
window.fetchUserDecks = fetchUserDecks;
window.fetchDefaultDecks = fetchDefaultDecks;
window.saveDeck = saveDeck;
window.deleteDeck = deleteDeck;
window.savePracticeHistory = savePracticeHistory;
window.fetchPracticeHistory = fetchPracticeHistory;
window.updateLocalDecks = updateLocalDecks;
window.addDefaultDecksToNewUser = addDefaultDecksToNewUser;
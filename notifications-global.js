// notifications-global.js - Script global para notificaciones en todo el sitio

// Configuración de Firebase (misma que usas)
const firebaseConfig = {
    databaseURL: "https://agro-productos-default-rtdb.firebaseio.com/"
};

// Inicializar Firebase solo si no está ya inicializado
if (!firebase.apps || !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();
const notificationsRef = database.ref('notificaciones');

let currentUserGlobal = null;
let swRegistrationGlobal = null;
let notificationPermissionGlobal = false;

// ============ SERVICE WORKER GLOBAL ============

async function registerGlobalServiceWorker() {
    if (!('serviceWorker' in navigator)) {
        console.log('[SW] Service Worker no soportado');
        return false;
    }
    
    try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        swRegistrationGlobal = registration;
        console.log('[SW Global] Service Worker registrado');
        
        // Verificar suscripción existente
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
            notificationPermissionGlobal = true;
        }
        
        return true;
    } catch (error) {
        console.error('[SW Global] Error:', error);
        return false;
    }
}

// Verificar permisos al cargar cualquier página
async function checkGlobalNotificationPermission() {
    if (!('Notification' in window)) return false;
    
    await registerGlobalServiceWorker();
    
    if (Notification.permission === 'granted') {
        if (swRegistrationGlobal) {
            const sub = await swRegistrationGlobal.pushManager.getSubscription();
            notificationPermissionGlobal = !!sub;
        } else {
            notificationPermissionGlobal = true;
        }
        return true;
    }
    return false;
}

// Enviar notificación local (cuando la página está abierta)
function sendGlobalNotification(title, message, type, id) {
    if (!notificationPermissionGlobal || Notification.permission !== 'granted') return;
    
    try {
        const iconMap = { info: '🔵', success: '✅', warning: '⚠️', error: '❌', reminder: '🔔' };
        const icon = iconMap[type] || '📢';
        
        const notification = new Notification(`${icon} ${title}`, {
            body: message.length > 100 ? message.substring(0, 100) + '...' : message,
            icon: '/icon-192.png',
            tag: id,
            vibrate: [200, 100, 200]
        });
        
        notification.onclick = () => {
            window.focus();
            notification.close();
        };
        
        setTimeout(() => notification.close(), 5000);
    } catch (error) {
        console.error('Error:', error);
    }
}

// Escuchar nuevas notificaciones en tiempo real (GLOBAL)
let lastNotifIds = new Set();

function listenGlobalNotifications() {
    notificationsRef.on('child_added', (snapshot) => {
        const newNotif = snapshot.val();
        newNotif.id = snapshot.key;
        
        // Evitar duplicados
        if (lastNotifIds.has(newNotif.id)) return;
        lastNotifIds.add(newNotif.id);
        
        // Limitar el tamaño del Set
        if (lastNotifIds.size > 100) {
            const toDelete = Array.from(lastNotifIds).slice(0, 50);
            toDelete.forEach(id => lastNotifIds.delete(id));
        }
        
        // Obtener usuario actual desde sessionStorage
        const userData = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
        const username = userData.username;
        
        // No enviar notificación si el usuario creó la notificación
        if (newNotif.createdBy !== username && notificationPermissionGlobal) {
            sendGlobalNotification(newNotif.title, newNotif.message, newNotif.type, newNotif.id);
            
            // Mostrar toast solo si la página tiene soporte para toast
            if (typeof mostrarToastGlobal === 'function') {
                mostrarToastGlobal(`📢 ${newNotif.title}`);
            }
        }
    });
}

// Función para mostrar toast (puede ser sobrescrita por cada página)
function mostrarToastGlobal(mensaje) {
    console.log('[Notificación]', mensaje);
}

// Inicializar todo
async function initGlobalNotifications() {
    // Esperar a que sessionStorage esté disponible
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await checkGlobalNotificationPermission();
    listenGlobalNotifications();
    
    console.log('[Notificaciones Globales] Inicializadas');
}

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGlobalNotifications);
} else {
    initGlobalNotifications();
}
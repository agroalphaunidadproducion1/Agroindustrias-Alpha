// init-notifications.js - Este script se ejecuta UNA SOLA VEZ al inicio
// Debe cargarse en TODAS las páginas pero solo inicializa una vez

(function() {
  // Bandera para saber si ya se inicializó
  if (window.__notificationsInitialized) {
    console.log('[Notificaciones] Ya inicializadas, saltando...');
    return;
  }
  
  console.log('[Notificaciones] Inicializando por primera vez...');
  window.__notificationsInitialized = true;
  
  // Configuración de Firebase
  const firebaseConfig = {
    databaseURL: "https://agro-productos-default-rtdb.firebaseio.com/"
  };
  
  // Inicializar Firebase solo si no está
  if (typeof firebase !== 'undefined' && firebase.apps.length === 0) {
    firebase.initializeApp(firebaseConfig);
  }
  
  const database = firebase.database();
  const notificationsRef = database.ref('notificaciones');
  
  let permissionGranted = false;
  let lastNotificationId = null;
  
  // ============ SERVICE WORKER ============
  
  async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return false;
    
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('[SW] Service Worker registrado');
      
      // Verificar suscripción existente
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        permissionGranted = true;
      }
      
      return true;
    } catch (error) {
      console.error('[SW] Error:', error);
      return false;
    }
  }
  
  // ============ SOLICITAR PERMISO (solo una vez) ============
  
  async function requestNotificationPermission() {
    if (!('Notification' in window)) {
      console.log('Notificaciones no soportadas');
      return false;
    }
    
    if (Notification.permission === 'granted') {
      permissionGranted = true;
      await registerServiceWorker();
      return true;
    }
    
    if (Notification.permission === 'denied') {
      console.log('Permiso denegado por el usuario');
      return false;
    }
    
    // Solicitar permiso
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      permissionGranted = true;
      await registerServiceWorker();
      
      // Notificación de bienvenida
      new Notification('🔔 Notificaciones activadas', {
        body: 'Recibirás alertas de nuevas notificaciones',
        icon: '/icon-192.png'
      });
      
      return true;
    }
    
    return false;
  }
  
  // ============ MOSTRAR NOTIFICACIÓN ============
  
  function showNotification(title, message, type, id) {
    if (!permissionGranted || Notification.permission !== 'granted') return;
    
    // Evitar duplicados
    if (lastNotificationId === id) return;
    lastNotificationId = id;
    
    const iconMap = { info: '🔵', success: '✅', warning: '⚠️', error: '❌', reminder: '🔔' };
    const icon = iconMap[type] || '📢';
    
    const notification = new Notification(`${icon} ${title}`, {
      body: message.length > 120 ? message.substring(0, 120) + '...' : message,
      icon: '/icon-192.png',
      tag: id,
      vibrate: [200, 100, 200]
    });
    
    notification.onclick = () => {
      window.focus();
      window.location.href = './notificaciones.html';
      notification.close();
    };
    
    setTimeout(() => notification.close(), 8000);
  }
  
  // ============ ESCUCHAR NUEVAS NOTIFICACIONES ============
  
  let lastNotifIds = new Set();
  
  function listenForNewNotifications() {
    // Obtener usuario actual
    const getUser = () => {
      try {
        const userData = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
        return userData.username;
      } catch {
        return null;
      }
    };
    
    notificationsRef.on('child_added', (snapshot) => {
      const notif = snapshot.val();
      const notifId = snapshot.key;
      
      // Evitar duplicados
      if (lastNotifIds.has(notifId)) return;
      lastNotifIds.add(notifId);
      
      // Limitar el tamaño
      if (lastNotifIds.size > 100) {
        const toDelete = Array.from(lastNotifIds).slice(0, 50);
        toDelete.forEach(id => lastNotifIds.delete(id));
      }
      
      const currentUser = getUser();
      
      // No notificar si el usuario actual creó la notificación
      if (notif.createdBy !== currentUser && currentUser) {
        showNotification(notif.title, notif.message, notif.type, notifId);
        console.log(`📢 Nueva notificación: ${notif.title}`);
      }
    });
  }
  
  // ============ INICIAR ============
  
  async function init() {
    // Esperar un poco para que sessionStorage esté disponible
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Registrar Service Worker
    await registerServiceWorker();
    
    // Verificar permiso
    if (Notification.permission === 'granted') {
      permissionGranted = true;
      listenForNewNotifications();
      console.log('[Notificaciones] Escuchando nuevas notificaciones...');
    } else if (Notification.permission !== 'denied') {
      // Mostrar banner para activar (solo si no fue denegado)
      showActivationBanner();
    }
  }
  
  // ============ BANNER PARA ACTIVAR ============
  
  function showActivationBanner() {
    // Verificar si ya existe un banner
    if (document.querySelector('#notif-activation-banner')) return;
    
    const banner = document.createElement('div');
    banner.id = 'notif-activation-banner';
    banner.innerHTML = `
      <div style="position: fixed; bottom: 20px; right: 20px; z-index: 10000; background: linear-gradient(135deg, #ff9800, #f57c00); color: white; padding: 15px 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); display: flex; align-items: center; gap: 15px; flex-wrap: wrap; max-width: 350px;">
        <i class="fas fa-bell" style="font-size: 24px;"></i>
        <span style="flex: 1; font-size: 14px;">🔔 Recibe notificaciones importantes en tiempo real</span>
        <button id="activate-notif-btn" style="background: white; border: none; color: #f57c00; padding: 8px 16px; border-radius: 30px; cursor: pointer; font-weight: bold;">Activar</button>
        <button id="close-banner-btn" style="background: none; border: none; color: white; cursor: pointer; font-size: 18px;">&times;</button>
      </div>
    `;
    document.body.appendChild(banner);
    
    document.getElementById('activate-notif-btn')?.addEventListener('click', async () => {
      await requestNotificationPermission();
      banner.remove();
      if (permissionGranted) {
        listenForNewNotifications();
      }
    });
    
    document.getElementById('close-banner-btn')?.addEventListener('click', () => {
      banner.remove();
    });
  }
  
  // Auto-ejecutar
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

class HeaderComponent extends HTMLElement {
  constructor() {
    super();
    this.userData = null;
    this.isFirebaseInitialized = false;
    this.initialized = false;
    this.firebaseConfig = {
      databaseURL: "https://agro-productos-default-rtdb.firebaseio.com/"
    };
    this.sessionCheckAttempts = 0;
    this.maxSessionCheckAttempts = 5;
  }

  connectedCallback() {
    this.render();
    this.initializeFirebase();
    
    // Cargar notificaciones de manera NO BLOQUEANTE (después de todo)
    setTimeout(() => {
      this.loadNotificationsScript();
    }, 2000); // Esperar 2 segundos para no bloquear el dashboard
    
    setTimeout(() => {
      this.initializeHeader();
    }, 500);
  }

  // Cargar script de notificaciones de forma ASYNC (no bloqueante)
  loadNotificationsScript() {
    // Verificar si ya se inicializaron las notificaciones
    if (window.__notificationsInitialized) {
      return;
    }
    
    // Verificar si el script ya existe
    if (document.querySelector('script[src="init-notifications.js"]')) {
      return;
    }
    
    // Crear script con atributo ASYNC (no bloquea la carga)
    const script = document.createElement('script');
    script.src = 'init-notifications.js';
    script.async = true; // IMPORTANTE: no bloquea
    script.defer = true;
    script.onload = () => {
      console.log('[Header] Notificaciones cargadas en segundo plano');
      this.setupNotificationBadge();
    };
    script.onerror = () => {
      console.warn('[Header] Error cargando notificaciones (no afecta al dashboard)');
    };
    document.body.appendChild(script); // Usar body en lugar de head para no bloquear
  }

  setupNotificationBadge() {
    // Solo actualizar si el elemento existe
    const badge = this.querySelector('#notificationBadge');
    if (!badge) return;
    
    // Actualizar cada 10 segundos (menos frecuente)
    this.updateNotificationBadge();
    setInterval(() => {
      if (this.querySelector('#notificationBadge')) {
        this.updateNotificationBadge();
      }
    }, 10000);
  }

  async updateNotificationBadge() {
    const username = this.userData?.username;
    if (!username) return;
    
    // Verificar que Firebase esté disponible
    if (typeof firebase === 'undefined' || !firebase.database) {
      return;
    }
    
    try {
      const database = firebase.database();
      const notificationsRef = database.ref('notificaciones');
      const snapshot = await notificationsRef.once('value');
      let unreadCount = 0;
      
      snapshot.forEach((childSnapshot) => {
        const notif = childSnapshot.val();
        if (!notif.readBy || !notif.readBy[username]) {
          unreadCount++;
        }
      });
      
      this.updateBadgeCount(unreadCount);
    } catch (error) {
      // Silenciar errores para no afectar el dashboard
      console.debug('Error actualizando badge:', error);
    }
  }

  updateBadgeCount(count) {
    const badge = this.querySelector('#notificationBadge');
    if (badge) {
      if (count > 0) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
    }
  }

  render() {
    this.innerHTML = `
      <!-- Header mejorado y responsive -->
      <div class="header">
        <div class="header-content">
          <div class="header-left">
            <div class="header-actions">
              <div class="btn-container">
                <button class="header-btn" id="menuToggle" title="Menú">
                  <i class="fas fa-bars"></i>
                </button>
              </div>
            </div>
            
            <div class="brand">
              <div class="brand-icon">
                <i class="fas fa-seedling"></i>
              </div>
              <div class="brand-text">
                <h1>Agroalpha</h1>
                <span>Unidad de producción 1</span>
              </div>
            </div>
          </div>
          
          <div class="header-right">
            <div class="user-info">
              <div class="user-details">
                <span class="user-name" id="user-name">Cargando...</span>
                <span id="user-role" class="role-badge">Cargando...</span>
              </div>
            </div>
            
            <div class="header-actions">
              <div class="btn-container">
                <button class="header-btn" id="notificationsBtn" title="Notificaciones">
                  <i class="fas fa-bell"></i>
                  <span class="notification-badge" id="notificationBadge" style="display: none;">0</span>
                </button>
              </div>
              <div class="theme-btn-container" style="display: none !important">
                <button class="header-btn" id="themeToggle" title="Cambiar tema">
                  <i class="fas fa-palette"></i>
                </button>
              </div>
            </div>
            
            <div class="mobile-user-menu">
              <div class="user-avatar" id="userAvatar">
                ...
              </div>
              <div class="user-dropdown" id="userDropdown">
                <div class="dropdown-item">
                  <i class="fas fa-user"></i>
                  <span id="dropdown-user-name">Cargando...</span>
                </div>
                <div class="dropdown-item">
                  <i class="fas fa-briefcase"></i>
                  <span id="dropdown-user-role">Cargando...</span>
                </div>
                <div class="dropdown-divider"></div>
                <a class="dropdown-item" href="/perfil.html">
                  <i class="fas fa-cog"></i>
                  <span>Mi Perfil</span>
                </a>
                <a class="dropdown-item" href="/configuracion.html">
                  <i class="fas fa-palette"></i>
                  <span>Configuración</span>
                </a>
                <div class="dropdown-divider"></div>
                <div class="dropdown-item" id="mobileLogoutBtn">
                  <i class="fas fa-sign-out-alt"></i>
                  <span>Cerrar Sesión</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  initializeFirebase() {
    try {
      if (typeof firebase !== 'undefined' && firebase.apps.length === 0) {
        firebase.initializeApp(this.firebaseConfig);
        console.log('Firebase inicializado por HeaderComponent');
      } else if (typeof firebase !== 'undefined') {
        console.log('Firebase ya estaba inicializado');
      }
      this.isFirebaseInitialized = true;
    } catch (error) {
      console.error('Error inicializando Firebase:', error);
    }
  }

  async initializeHeader() {
    if (this.initialized) return;
    
    console.log('Inicializando header component...');
    
    this.setupEventListeners();
    this.verifySession();
    this.setupUserChangeListener();
    this.setupThemeListener();
    
    this.initialized = true;
  }

  async verifySession() {
    try {
      const userData = JSON.parse(sessionStorage.getItem('currentUser'));
      
      if (!userData || !userData.username) {
        this.sessionCheckAttempts++;
        
        if (this.sessionCheckAttempts >= this.maxSessionCheckAttempts) {
          this.redirectToLogin();
          return;
        }
        
        setTimeout(() => {
          this.verifySession();
        }, 1000);
        return;
      }
      
      console.log('Usuario encontrado en sesión:', userData.username);
      this.sessionCheckAttempts = 0;
      this.userRole = userData.role;
      
      if (this.isFirebaseInitialized) {
        try {
          const database = firebase.database();
          const activeUsersRef = database.ref('uactivos');
          const snapshot = await activeUsersRef.child(userData.username).once('value');
          if (!snapshot.exists()) {
            this.showSessionExpiredMessage();
            return;
          }
        } catch (firebaseError) {
          console.warn('Error verificando usuario activo:', firebaseError);
        }
      }
      
      this.updateUserInfo(userData);
      this.updateNotificationBadge();
      
    } catch (error) {
      console.error('Error verificando sesión:', error);
      this.showDefaultUserInfo();
    }
  }

  setupEventListeners() {
    const menuToggle = this.querySelector('#menuToggle');
    const userAvatar = this.querySelector('#userAvatar');
    const userDropdown = this.querySelector('#userDropdown');
    const mobileLogoutBtn = this.querySelector('#mobileLogoutBtn');
    const notificationsBtn = this.querySelector('#notificationsBtn');

    if (menuToggle) {
      menuToggle.addEventListener('click', () => {
        const event = new CustomEvent('openSidebar', { 
          bubbles: true,
          detail: { userData: this.userData }
        });
        this.dispatchEvent(event);
      });
    }

    if (userAvatar) {
      userAvatar.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle('active');
      });
    }

    if (notificationsBtn) {
      notificationsBtn.addEventListener('click', () => {
        window.location.href = '/notificaciones.html';
      });
    }

    document.addEventListener('click', () => {
      if (userDropdown) {
        userDropdown.classList.remove('active');
      }
    });

    if (mobileLogoutBtn) {
      mobileLogoutBtn.addEventListener('click', () => {
        this.logout();
      });
    }
  }

  setupUserChangeListener() {
    window.addEventListener('storage', (e) => {
      if (e.key === 'currentUser') {
        this.loadUserDataFromSession();
      }
    });

    document.addEventListener('userDataUpdated', (e) => {
      if (e.detail && e.detail.userData) {
        this.userData = e.detail.userData;
        this.updateUserInfo(e.detail.userData);
        this.updateNotificationBadge();
      }
    });

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
          this.loadUserDataFromSession();
        }, 500);
      });
    } else {
      setTimeout(() => {
        this.loadUserDataFromSession();
      }, 500);
    }
  }

  setupThemeListener() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          this.handleThemeChange();
        }
      });
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-theme']
    });

    this.handleThemeChange();
  }

  handleThemeChange() {
    const currentTheme = document.body.getAttribute('data-theme') || 'light';
    const header = this.querySelector('.header');
    if (header) {
      header.style.setProperty('--current-theme', currentTheme);
    }
  }

  async loadUserDataFromSession() {
    try {
      const userDataString = sessionStorage.getItem('currentUser');
      
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        this.userData = userData;
        this.updateUserInfo(userData);
        this.updateNotificationBadge();
        return userData;
      } else {
        this.showDefaultUserInfo();
        return null;
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      this.showDefaultUserInfo();
      return null;
    }
  }

  updateUserInfo(userData) {
    if (!userData) {
      this.showDefaultUserInfo();
      return;
    }

    const userName = userData.nombre || userData.name || userData.username || 'Usuario';
    const userRole = userData.rol || userData.role || 'Rol no asignado';

    const userNameElement = this.querySelector('#user-name');
    const userRoleElement = this.querySelector('#user-role');
    const dropdownUserName = this.querySelector('#dropdown-user-name');
    const dropdownUserRole = this.querySelector('#dropdown-user-role');
    const userAvatar = this.querySelector('#userAvatar');

    if (userNameElement) userNameElement.textContent = userName;
    if (userRoleElement) {
      userRoleElement.textContent = userRole;
      userRoleElement.className = 'role-badge ' + this.getBadgeClass(userRole);
    }
    if (dropdownUserName) dropdownUserName.textContent = userName;
    if (dropdownUserRole) dropdownUserRole.textContent = userRole;
    
    if (userAvatar) {
      userAvatar.textContent = this.getUserInitials(userName);
      userAvatar.setAttribute('title', userName);
    }

    const event = new CustomEvent('headerUpdated', {
      detail: { userData }
    });
    this.dispatchEvent(event);
  }

  showDefaultUserInfo() {
    const userNameElement = this.querySelector('#user-name');
    const userRoleElement = this.querySelector('#user-role');
    const dropdownUserName = this.querySelector('#dropdown-user-name');
    const dropdownUserRole = this.querySelector('#dropdown-user-role');
    const userAvatar = this.querySelector('#userAvatar');

    if (userNameElement) userNameElement.textContent = 'Invitado';
    if (userRoleElement) {
      userRoleElement.textContent = 'No identificado';
      userRoleElement.className = 'role-badge invitado-badge';
    }
    if (dropdownUserName) dropdownUserName.textContent = 'Invitado';
    if (dropdownUserRole) dropdownUserRole.textContent = 'No identificado';
    if (userAvatar) userAvatar.textContent = 'IN';
  }

  showSessionExpiredMessage() {
    const userNameElement = this.querySelector('#user-name');
    const userRoleElement = this.querySelector('#user-role');
    
    if (userNameElement) userNameElement.textContent = 'Sesión Expirada';
    if (userRoleElement) {
      userRoleElement.textContent = 'Reiniciar Sesión';
      userRoleElement.className = 'role-badge invitado-badge';
      userRoleElement.style.cursor = 'pointer';
      userRoleElement.onclick = () => this.redirectToLogin();
    }
    
    this.showToast('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.', 'warning');
    
    setTimeout(() => {
      this.redirectToLogin();
    }, 5000);
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    const backgroundColor = type === 'warning' ? 'var(--gerente-color)' : 'var(--primary-color)';
    
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      background: ${backgroundColor};
      color: white;
      border-radius: 8px;
      z-index: 10000;
      box-shadow: var(--hover-shadow);
      font-weight: 500;
      max-width: 300px;
    `;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 5000);
  }

  redirectToLogin() {
    sessionStorage.removeItem('currentUser');
    window.location.href = '/index.html';
  }

  getUserInitials(name) {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().substring(0, 2);
  }

  getBadgeClass(role) {
    const roleClasses = {
      'Administrador': 'admin-badge',
      'Admin': 'admin-badge',
      'Gerente General': 'gerente-badge',
      'Gerente de Producción': 'gerente-badge',
      'Supervisor': 'supervisor-badge',
      'Jefe de Vivero': 'jefe-vivero-badge',
      'Grower': 'grower-badge',
      'Grower Junior': 'grower-badge',
      'Digitador': 'digitador-badge',
      'Técnico Fitosanidad': 'fitosanidad-badge',
      'Fitosanidad': 'fitosanidad-badge',
      'Técnico Prácticas Culturales': 'culturales-badge',
      'Prácticas Culturales': 'culturales-badge',
      'Culturales': 'culturales-badge',
      'Técnico Riego': 'riego-badge',
      'Riego': 'riego-badge',
      'Mezclero Fitosanidad': 'mezclero-fitosanidad-badge',
      'Consultor': 'invitado-badge',
      'Usuario1': 'usuario1-badge',
      'Usuario2': 'usuario2-badge',
      'Usuario3': 'usuario3-badge',
      'Usuario4': 'usuario4-badge',
      'Invitado': 'invitado-badge'
    };
    return roleClasses[role] || 'invitado-badge';
  }

  refreshUserData() {
    this.loadUserDataFromSession();
  }

  async logout() {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      try {
        const userData = JSON.parse(sessionStorage.getItem('currentUser'));
        
        if (userData?.username && this.isFirebaseInitialized) {
          const database = firebase.database();
          const activeUsersRef = database.ref('uactivos');
          await activeUsersRef.child(userData.username).remove();
        }
        
        this.redirectToLogin();
        
      } catch (error) {
        console.error('Error al cerrar sesión:', error);
        this.redirectToLogin();
      }
    }
  }

  checkFirebaseStatus() {
    return this.isFirebaseInitialized;
  }

  getCurrentUser() {
    return this.userData;
  }

  getCurrentUserRole() {
    return this.userRole;
  }
}

customElements.define('header-component', HeaderComponent);

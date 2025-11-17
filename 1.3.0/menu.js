// components.js - Sistema de componentes reutilizables para Agroalpha

// Configuración de Firebase
const firebaseConfig = {
    databaseURL: "https://agro-productos-default-rtdb.firebaseio.com/"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const activeUsersRef = database.ref('uactivos');

// Sistema de temas
const themes = ['light', 'dark', 'blue', 'orange', 'purple'];
let currentThemeIndex = 0;

// Función para cargar tema guardado
function loadSavedTheme() {
    const savedTheme = localStorage.getItem('agroalpha-theme');
    if (savedTheme) {
        currentThemeIndex = themes.indexOf(savedTheme);
        if (currentThemeIndex === -1) currentThemeIndex = 0;
        document.body.setAttribute('data-theme', themes[currentThemeIndex]);
    }
}

// Obtener iniciales del usuario para el avatar
function getUserInitials(name) {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().substring(0, 2);
}

// Obtener clase CSS para el badge según el rol
function getBadgeClass(role) {
    const roleClasses = {
        'Administrador': 'admin-badge',
        'Supervisor': 'supervisor-badge',
        'Grower': 'grower-badge',
        'Grower Junior': 'grower-badge',
        'Digitador': 'digitador-badge',
        'Técnico Fitosanidad': 'fitosanidad-badge',
        'Técnico Prácticas Culturales': 'culturales-badge',
        'Técnico Riego': 'riego-badge',
        'Invitado': 'invitado-badge',
        'Gerente de Producción': 'gerente-badge',
        'Gerente General': 'gerente-badge',
        'Camaron': 'camaron-badge',
        'Jefe de Vivero': 'jefe-vivero-badge',
        'Mezclero Fitosanidad': 'mezclero-fitosanidad-badge',
        'Usuario1': 'usuario1-badge',
        'Usuario2': 'usuario2-badge',
        'Usuario3': 'usuario3-badge',
        'Usuario4': 'usuario4-badge'
    };
    return roleClasses[role] || 'invitado-badge';
}

// Actualizar información del usuario en todos los componentes
function updateUserInfo() {
    const userData = JSON.parse(sessionStorage.getItem('currentUser'));
    
    if (userData) {
        const userName = userData.name || userData.username;
        const userRole = userData.role;
        const userUnit = userData.unit || 'Unidad de Producción 1';
        
        // Actualizar header
        const userNameElement = document.getElementById('user-name');
        const userRoleElement = document.getElementById('user-role');
        if (userNameElement) userNameElement.textContent = userName;
        if (userRoleElement) {
            userRoleElement.textContent = userRole;
            userRoleElement.className = 'role-badge ' + getBadgeClass(userRole);
        }
        
        // Actualizar dropdown móvil
        const dropdownUserName = document.getElementById('dropdown-user-name');
        const dropdownUserRole = document.getElementById('dropdown-user-role');
        const userAvatar = document.getElementById('userAvatar');
        if (dropdownUserName) dropdownUserName.textContent = userName;
        if (dropdownUserRole) dropdownUserRole.textContent = userRole;
        if (userAvatar) userAvatar.textContent = getUserInitials(userName);
        
        // Actualizar sidebar
        const sidebarUserName = document.getElementById('sidebar-user-name');
        const sidebarUserRole = document.getElementById('sidebar-user-role');
        const userUnitElement = document.getElementById('user-unit');
        if (sidebarUserName) sidebarUserName.textContent = userName;
        if (sidebarUserRole) {
            sidebarUserRole.textContent = userRole;
            sidebarUserRole.className = 'role-badge ' + getBadgeClass(userRole);
        }
        if (userUnitElement) userUnitElement.textContent = userUnit;
    }
}

// Funciones para el menú
function openMenu() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    if (sidebar && overlay) {
        sidebar.classList.add('active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    if (sidebar && overlay) {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

function toggleSubmenu(menuItem, submenu) {
    if (menuItem && submenu) {
        menuItem.classList.toggle('active');
        submenu.classList.toggle('active');
    }
}

function toggleUserDropdown() {
    const userDropdown = document.getElementById('userDropdown');
    if (userDropdown) {
        userDropdown.classList.toggle('active');
    }
}

// Cerrar sesión
function logout() {
    const userData = JSON.parse(sessionStorage.getItem('currentUser'));
    
    if (userData?.username) {
        // Eliminar de usuarios activos
        activeUsersRef.child(userData.username).remove()
            .then(() => {
                sessionStorage.removeItem('currentUser');
                window.location.href = 'index.html';
            })
            .catch(error => {
                console.error('Error al cerrar sesión:', error);
                sessionStorage.removeItem('currentUser');
                window.location.href = 'index.html';
            });
    } else {
        sessionStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }
}

// Crear y renderizar el header
function renderHeader() {
    const headerHTML = `
        <!-- Header mejorado y responsive -->
        <div class="header">
            <div class="header-content">
                <div class="header-left">
                    <!-- Botón del menú -->
                    <div class="header-actions">
                        <div class="btn-container">
                            <button class="header-btn" id="menuToggle" title="Menú">
                                <i class="fas fa-bars"></i>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Marca -->
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
                    <!-- Información del usuario en desktop -->
                    <div class="user-info">
                        <div class="user-details">
                            <span class="user-name" id="user-name">Usuario</span>
                            <span id="user-role" class="role-badge">Rol</span>
                        </div>
                    </div>
                    
                    <!-- Botones de acción -->
                    <div class="header-actions">
                        <!-- Botón de temas OCULTO -->
                        <div class="btn-container theme-btn-container">
                            <button class="header-btn" id="themeToggle" title="Cambiar tema">
                                <i class="fas fa-palette"></i>
                            </button>
                        </div>
                        <div class="btn-container">
                            <button class="header-btn" id="notificationsBtn" title="Notificaciones">
                                <i class="fas fa-bell"></i>
                                <span class="notification-badge">3</span>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Menú de usuario móvil -->
                    <div class="mobile-user-menu">
                        <div class="user-avatar" id="userAvatar">
                            U
                        </div>
                        <div class="user-dropdown" id="userDropdown">
                            <div class="dropdown-item">
                                <i class="fas fa-user"></i>
                                <span id="dropdown-user-name">Usuario</span>
                            </div>
                            <div class="dropdown-item">
                                <i class="fas fa-briefcase"></i>
                                <span id="dropdown-user-role">Rol</span>
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
    
    // Insertar el header al inicio del body
    document.body.insertAdjacentHTML('afterbegin', headerHTML);
}

// Crear y renderizar el sidebar
function renderSidebar() {
    const sidebarHTML = `
        <!-- Sidebar -->
        <div class="sidebar" id="sidebar">
            <button class="close-menu" id="closeMenu">
                <i class="fas fa-times"></i>
            </button>
            
            <div class="logo">
                <h1>Agroalpha</h1>
            </div>
            
            <div class="user-info-sidebar">
                <p id="user-unit">Unidad de Producción 1</p>
                <p id="sidebar-user-name">Usuario</p>
                <p id="sidebar-user-role" class="role-badge">Rol</p>
            </div>
            
            <div class="nav-section">
                <h3>Navegación Principal</h3>
                <a class="nav-item active" href="/dashboard.html">
                    <i class="fas fa-tachometer-alt"></i>
                    <span>Dashboard</span>
                </a>
                <a class="nav-item" href="/notificaciones.html">
                    <i class="fas fa-bell"></i>
                    <span>Notificaciones</span>
                </a>
            </div>
            
            <div class="nav-section">
                <h3>Configuración</h3>
                <div class="nav-item has-submenu" id="configMenu">
                    <div>
                        <i class="fas fa-cog"></i>
                        <span>Configuración</span>
                    </div>
                </div>
                <div class="submenu" id="configSubmenu">
                    <a class="submenu-item" href="/temas.html">
                        <i class="fas fa-palette"></i>
                        <span>Temas</span>
                    </a>
                    <a class="submenu-item" href="/notificaciones-config.html">
                        <i class="fas fa-bell"></i>
                        <span>Notificaciones</span>
                    </a>
                    <a class="submenu-item" href="/usuarios.html">
                        <i class="fas fa-users"></i>
                        <span>Gestión de Usuarios</span>
                    </a>
                    <a class="submenu-item" href="/parametros.html">
                        <i class="fas fa-sliders-h"></i>
                        <span>Parámetros del Sistema</span>
                    </a>
                    <a class="submenu-item" href="/backup.html">
                        <i class="fas fa-database"></i>
                        <span>Backup y Restauración</span>
                    </a>
                    <a class="submenu-item" href="/logs.html">
                        <i class="fas fa-clipboard-list"></i>
                        <span>Registros del Sistema</span>
                    </a>
                </div>
                
                <a class="nav-item" href="/perfil.html">
                    <i class="fas fa-user"></i>
                    <span>Mi Perfil</span>
                </a>
            </div>
            
            <div class="nav-section">
                <h3>Soporte</h3>
                <a class="nav-item" href="/ayuda.html">
                    <i class="fas fa-question-circle"></i>
                    <span>Ayuda</span>
                </a>
                <a class="nav-item" href="/manual.html">
                    <i class="fas fa-book"></i>
                    <span>Manual de Usuario</span>
                </a>
                <a class="nav-item" href="/soporte.html">
                    <i class="fas fa-headset"></i>
                    <span>Soporte Técnico</span>
                </a>
                <div class="nav-item" id="logoutBtn">
                    <i class="fas fa-sign-out-alt"></i>
                    <span>Cerrar Sesión</span>
                </div>
            </div>
        </div>

        <!-- Overlay para cerrar menú -->
        <div class="overlay" id="overlay"></div>
    `;
    
    // Insertar el sidebar después del header
    const header = document.querySelector('.header');
    if (header) {
        header.insertAdjacentHTML('afterend', sidebarHTML);
    } else {
        document.body.insertAdjacentHTML('afterbegin', sidebarHTML);
    }
}

// Configurar todos los eventos
function setupEventListeners() {
    // Elementos del DOM
    const menuToggle = document.getElementById('menuToggle');
    const closeMenu = document.getElementById('closeMenu');
    const overlay = document.getElementById('overlay');
    const configMenu = document.getElementById('configMenu');
    const configSubmenu = document.getElementById('configSubmenu');
    const userAvatar = document.getElementById('userAvatar');
    const logoutBtn = document.getElementById('logoutBtn');
    const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');

    // Configurar eventos del menú
    if (menuToggle) menuToggle.addEventListener('click', openMenu);
    if (closeMenu) closeMenu.addEventListener('click', closeSidebar);
    if (overlay) overlay.addEventListener('click', closeSidebar);
    
    // Configurar submenú de configuración
    if (configMenu && configSubmenu) {
        configMenu.addEventListener('click', function(e) {
            e.preventDefault();
            toggleSubmenu(this, configSubmenu);
        });
    }
    
    // Configurar dropdown de usuario
    if (userAvatar) {
        userAvatar.addEventListener('click', toggleUserDropdown);
    }
    
    // Cerrar dropdown al hacer clic fuera
    document.addEventListener('click', function(e) {
        const userDropdown = document.getElementById('userDropdown');
        if (userAvatar && userDropdown && !userAvatar.contains(e.target) && !userDropdown.contains(e.target)) {
            userDropdown.classList.remove('active');
        }
    });

    // Configurar logout
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
    if (mobileLogoutBtn) mobileLogoutBtn.addEventListener('click', logout);
}

// Inicializar todos los componentes
function initializeComponents() {
    // Renderizar componentes
    renderHeader();
    renderSidebar();
    
    // Configurar eventos
    setupEventListeners();
    
    // Cargar tema guardado
    loadSavedTheme();
    
    // Actualizar información del usuario
    updateUserInfo();
}

// Verificar sesión y inicializar componentes cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    const userData = JSON.parse(sessionStorage.getItem('currentUser'));
    
    if (!userData || !userData.username) {
        window.location.href = 'index.html';
        return;
    }
    
    // Verificar si el usuario sigue activo en uactivos
    activeUsersRef.child(userData.username).once('value')
        .then(snapshot => {
            if (!snapshot.exists()) {
                logout();
                return;
            }
            
            // Inicializar componentes
            initializeComponents();
        })
        .catch(error => {
            console.error('Error verificando sesión activa:', error);
            // Inicializar componentes de todos modos
            initializeComponents();
        });
});
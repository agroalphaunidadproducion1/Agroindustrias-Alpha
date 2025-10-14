// Sistema de Configuración Global para Agroalpha
class GlobalSettings {
    constructor() {
        this.settings = {
            theme: 'default',
            language: 'es',
            timezone: '-6',
            dateFormat: 'dd/mm/yyyy',
            emailNotifications: true,
            browserNotifications: false,
            documentReminders: true,
            autoLogout: true,
            dataRetention: '2'
        };
        
        this.init();
    }
    
    // Inicializar el sistema
    init() {
        this.loadSettings();
        this.setupEventListeners();
        this.applySettings();
    }
    
    // Cargar configuración desde localStorage
    loadSettings() {
        const savedSettings = localStorage.getItem('globalSettings');
        if (savedSettings) {
            this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
        }
    }
    
    // Guardar configuración en localStorage
    saveSettings() {
        localStorage.setItem('globalSettings', JSON.stringify(this.settings));
        this.applySettings();
        
        // Mostrar mensaje de éxito
        this.showMessage('Configuración guardada correctamente', 'success');
    }
    
    // Aplicar configuración a la página actual
    applySettings() {
        // Aplicar tema
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        if (this.settings.theme !== 'default') {
            document.body.classList.add(`${this.settings.theme}-theme`);
        }
        
        // Aplicar otras configuraciones
        this.updateFormElements();
        
        // Aplicar formato de fecha si está disponible
        if (typeof this.applyDateFormat === 'function') {
            this.applyDateFormat();
        }
    }
    
    // Actualizar elementos del formulario con los valores guardados
    updateFormElements() {
        // Solo actualizar si los elementos existen
        const languageSelect = document.getElementById('languageSelect');
        const timezoneSelect = document.getElementById('timezoneSelect');
        const dateFormat = document.getElementById('dateFormat');
        const emailNotifications = document.getElementById('emailNotifications');
        const browserNotifications = document.getElementById('browserNotifications');
        const documentReminders = document.getElementById('documentReminders');
        const autoLogout = document.getElementById('autoLogout');
        const dataRetention = document.getElementById('dataRetention');
        
        if (languageSelect) languageSelect.value = this.settings.language;
        if (timezoneSelect) timezoneSelect.value = this.settings.timezone;
        if (dateFormat) dateFormat.value = this.settings.dateFormat;
        if (emailNotifications) emailNotifications.checked = this.settings.emailNotifications;
        if (browserNotifications) browserNotifications.checked = this.settings.browserNotifications;
        if (documentReminders) documentReminders.checked = this.settings.documentReminders;
        if (autoLogout) autoLogout.checked = this.settings.autoLogout;
        if (dataRetention) dataRetention.value = this.settings.dataRetention;
    }
    
    // Configurar event listeners
    setupEventListeners() {
        // Guardar configuración cuando cambien los elementos
        document.addEventListener('change', (event) => {
            if (event.target.matches('select, input[type="checkbox"]')) {
                this.collectFormData();
                this.saveSettings();
            }
        });
    }
    
    // Recopilar datos del formulario
    collectFormData() {
        const languageSelect = document.getElementById('languageSelect');
        const timezoneSelect = document.getElementById('timezoneSelect');
        const dateFormat = document.getElementById('dateFormat');
        const emailNotifications = document.getElementById('emailNotifications');
        const browserNotifications = document.getElementById('browserNotifications');
        const documentReminders = document.getElementById('documentReminders');
        const autoLogout = document.getElementById('autoLogout');
        const dataRetention = document.getElementById('dataRetention');
        
        if (languageSelect) this.settings.language = languageSelect.value;
        if (timezoneSelect) this.settings.timezone = timezoneSelect.value;
        if (dateFormat) this.settings.dateFormat = dateFormat.value;
        if (emailNotifications) this.settings.emailNotifications = emailNotifications.checked;
        if (browserNotifications) this.settings.browserNotifications = browserNotifications.checked;
        if (documentReminders) this.settings.documentReminders = documentReminders.checked;
        if (autoLogout) this.settings.autoLogout = autoLogout.checked;
        if (dataRetention) this.settings.dataRetention = dataRetention.value;
    }
    
    // Restablecer configuración a valores predeterminados
    resetSettings() {
        this.settings = {
            theme: 'default',
            language: 'es',
            timezone: '-6',
            dateFormat: 'dd/mm/yyyy',
            emailNotifications: true,
            browserNotifications: false,
            documentReminders: true,
            autoLogout: true,
            dataRetention: '2'
        };
        
        this.saveSettings();
        this.applySettings();
        
        this.showMessage('Configuración restablecida correctamente', 'success');
    }
    
    // Mostrar mensaje al usuario
    showMessage(message, type) {
        // Crear elemento de mensaje
        const messageEl = document.createElement('div');
        messageEl.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        messageEl.style.top = '80px';
        messageEl.style.right = '20px';
        messageEl.style.zIndex = '1050';
        messageEl.style.minWidth = '300px';
        messageEl.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(messageEl);
        
        // Eliminar mensaje después de 5 segundos
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, 5000);
    }
    
    // Obtener configuración actual
    getSettings() {
        return this.settings;
    }
    
    // Cambiar tema
    setTheme(themeName) {
        this.settings.theme = themeName;
        this.saveSettings();
    }
    
    // Obtener tema actual
    getCurrentTheme() {
        return this.settings.theme;
    }
}

// Función para aplicar configuración global en cualquier página
function applyGlobalSettings() {
    const savedSettings = localStorage.getItem('globalSettings');
    if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        
        // Aplicar tema
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        if (settings.theme !== 'default') {
            document.body.classList.add(`${settings.theme}-theme`);
        }
        
        console.log('Configuración global aplicada:', settings);
    }
}

// Inicializar automáticamente cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    // Aplicar configuración global
    applyGlobalSettings();
    
    // Inicializar sistema de configuración si estamos en la página de configuraciones
    if (document.getElementById('saveSettings')) {
        window.globalSettings = new GlobalSettings();
    }
});

// Función de utilidad para formatear fechas según la configuración
function formatDate(date, format = null) {
    const settings = JSON.parse(localStorage.getItem('globalSettings') || '{}');
    const dateFormat = format || settings.dateFormat || 'dd/mm/yyyy';
    
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    
    switch (dateFormat) {
        case 'mm/dd/yyyy':
            return `${month}/${day}/${year}`;
        case 'yyyy-mm-dd':
            return `${year}-${month}-${day}`;
        case 'dd/mm/yyyy':
        default:
            return `${day}/${month}/${year}`;
    }
}

// Función de utilidad para obtener la zona horaria configurada
function getUserTimezone() {
    const settings = JSON.parse(localStorage.getItem('globalSettings') || '{}');
    return settings.timezone || '-6';
}

// Función de utilidad para verificar si las notificaciones están habilitadas
function areNotificationsEnabled() {
    const settings = JSON.parse(localStorage.getItem('globalSettings') || '{}');
    return settings.browserNotifications || false;
}
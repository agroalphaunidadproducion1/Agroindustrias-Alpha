// footer.js - Pie de página para Sistema Agroalpha - VERSIÓN CORREGIDA (SOLO FOOTER)

class FooterManager {
    constructor() {
        this.init();
    }

    init() {
        // Esperar a que el DOM esté listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.crearFooter();
            });
        } else {
            this.crearFooter();
        }
    }

    crearFooter() {
        // Verificar si ya existe un footer
        const existingFooter = document.querySelector('footer');
        if (existingFooter) {
            existingFooter.remove();
        }

        const footer = document.createElement('footer');
        footer.innerHTML = this.generarHTML();
        footer.style.cssText = this.obtenerEstilosFooter();
        
        // Insertar el footer al FINAL del body
        document.body.appendChild(footer);
        
        this.aplicarEstilosDinamicos();
        this.aplicarEstilosPosicionFija(); // Nuevo método para pegar el footer al fondo
    }

    generarHTML() {
        return `
            <div class="footer-container">
                <div class="footer-content">
                    <p>Sistema Agroalpha © ${new Date().getFullYear()} | Version 1.4.0</p>
                    <p>Unidad de Producción 1 - <a href="soporte.html" class="footer-link">Ayuda Técnica</a></p>
                </div>
            </div>
        `;
    }

    obtenerEstilosFooter() {
        return `
            position: relative;
            width: 100%;
            background-color: rgba(255, 255, 255, 0.95);
            padding: 15px 0;
            text-align: center;
            border-top: 1px solid #e0e0e0;
            font-family: 'Roboto', sans-serif;
            z-index: 10;
            backdrop-filter: blur(5px);
            margin-top: 40px;
        `;
    }

    aplicarEstilosPosicionFija() {
        // Verificar si los estilos ya existen
        if (document.getElementById('footer-fixed-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'footer-fixed-styles';
        style.textContent = `
            /* Estilos para mantener el footer al fondo sin modificar el layout existente */
            html {
                position: relative;
                min-height: 100%;
            }
            
            body {
                margin-bottom: 0 !important;
                padding-bottom: 0 !important;
            }
            
            footer {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                margin-top: 0 !important;
            }
            
            /* Ajustar el padding-bottom del body si el contenido es corto */
            body:has(footer) {
                min-height: 100vh;
            }
            
            /* Si el contenido es más grande que la pantalla, el footer sigue al final */
            @media (min-height: 100vh) {
                body {
                    position: relative;
                    min-height: 100vh;
                }
                
                footer {
                    position: relative;
                    margin-top: 40px;
                }
            }
        `;
        document.head.appendChild(style);
        
        // Ajustar dinámicamente según la altura del contenido
        this.ajustarPosicionFooter();
        
        // Reajustar cuando la ventana cambie de tamaño
        window.addEventListener('resize', () => this.ajustarPosicionFooter());
    }

    ajustarPosicionFooter() {
        const footer = document.querySelector('footer');
        if (!footer) return;
        
        const bodyHeight = document.body.scrollHeight;
        const windowHeight = window.innerHeight;
        
        // Si el contenido es menor que la ventana, usar posición absoluta
        if (bodyHeight <= windowHeight) {
            footer.style.position = 'absolute';
            footer.style.bottom = '0';
            footer.style.marginTop = '0';
            document.body.style.position = 'relative';
            document.body.style.minHeight = `${windowHeight}px`;
        } else {
            // Si el contenido es mayor, usar posición relativa normal
            footer.style.position = 'relative';
            footer.style.marginTop = '40px';
            document.body.style.minHeight = 'auto';
        }
    }

    aplicarEstilosDinamicos() {
        // Verificar si los estilos ya existen
        if (document.getElementById('footer-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'footer-styles';
        style.textContent = `
            .footer-container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 0 20px;
            }

            .footer-content {
                color: #757575;
                font-size: 12px;
                line-height: 1.5;
            }

            .footer-content p {
                margin: 5px 0;
            }

            .footer-link {
                color: #4CAF50;
                text-decoration: none;
                transition: color 0.3s;
                cursor: pointer;
            }

            .footer-link:hover {
                color: #388E3C;
                text-decoration: underline;
            }

            /* Asegurar que el footer esté siempre detrás de otros elementos */
            header-component,
            sidebar-component,
            .header,
            .sidebar {
                z-index: 1000 !important;
            }

            footer {
                z-index: 10 !important;
            }

            @media (max-width: 768px) {
                .footer-content {
                    font-size: 11px;
                }
                
                .footer-container {
                    padding: 0 15px;
                }
            }

            @media (max-width: 480px) {
                .footer-content {
                    font-size: 10px;
                }
                
                footer {
                    padding: 10px 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Inicializar el footer
const footer = new FooterManager();

// Exportar para uso en otros módulos si es necesario
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FooterManager;
}

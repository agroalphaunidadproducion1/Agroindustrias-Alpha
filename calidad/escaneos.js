// Configuración de Firebase
const firebaseConfig = {
    databaseURL: "https://agro-productos-default-rtdb.firebaseio.com/"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

class BarcodeForm {
    constructor() {
        this.isScanning = false;
        this.currentScanner = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.setDefaultDate();
    }

    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('fecha').value = today;
    }

    bindEvents() {
        // Form submission
        document.getElementById('barcodeForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveBarcode();
        });

        // Camera controls
        document.getElementById('startCamera').addEventListener('click', () => {
            this.startCamera();
        });

        document.getElementById('stopCamera').addEventListener('click', () => {
            this.stopCamera();
        });

        // File input
        document.getElementById('fileInput').addEventListener('change', (e) => {
            this.handleFileUpload(e.target.files[0]);
        });

        // Auto-focus en el input de código
        document.getElementById('barcodeInput').focus();
    }

    async startCamera() {
        try {
            const cameraSection = document.querySelector('.camera-section');
            const cameraView = document.getElementById('cameraView');
            
            cameraSection.classList.remove('hidden');
            
            // Configurar Quagga para escanear códigos de barras
            this.currentScanner = await Quagga.init({
                inputStream: {
                    name: "Live",
                    type: "LiveStream",
                    target: cameraView,
                    constraints: {
                        width: 400,
                        height: 300,
                        facingMode: "environment"
                    }
                },
                decoder: {
                    readers: [
                        "code_128_reader",
                        "ean_reader",
                        "ean_8_reader",
                        "code_39_reader",
                        "upc_reader",
                        "upc_e_reader"
                    ]
                }
            });

            Quagga.start();

            // Escuchar resultados del escáner
            Quagga.onDetected((result) => {
                if (result.codeResult && result.codeResult.code) {
                    const code = result.codeResult.code;
                    document.getElementById('barcodeInput').value = code;
                    this.showScanIndicator('¡Código detectado!');
                    
                    // Detener cámara automáticamente después de escanear
                    setTimeout(() => {
                        this.stopCamera();
                        document.getElementById('barcodeInput').focus();
                    }, 1000);
                }
            });

            this.isScanning = true;

        } catch (error) {
            console.error('Error al iniciar cámara:', error);
            alert('Error al acceder a la cámara. Asegúrate de permitir el acceso.');
        }
    }

    stopCamera() {
        if (this.currentScanner) {
            Quagga.stop();
            this.currentScanner = null;
        }
        
        document.querySelector('.camera-section').classList.add('hidden');
        this.isScanning = false;
        
        // Remover indicador si existe
        const indicator = document.querySelector('.scan-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    showScanIndicator(message) {
        // Remover indicador anterior si existe
        const oldIndicator = document.querySelector('.scan-indicator');
        if (oldIndicator) {
            oldIndicator.remove();
        }

        const indicator = document.createElement('div');
        indicator.className = 'scan-indicator';
        indicator.textContent = message;
        
        const barcodeInput = document.getElementById('barcodeInput');
        barcodeInput.parentNode.insertBefore(indicator, barcodeInput.nextSibling);

        setTimeout(() => {
            indicator.remove();
        }, 3000);
    }

    async saveBarcode() {
        const fecha = document.getElementById('fecha').value;
        const numeroContenedor = document.getElementById('numeroContenedor').value.trim();
        const barcodeValue = document.getElementById('barcodeInput').value.trim();

        if (!fecha || !numeroContenedor || !barcodeValue) {
            alert('Por favor, completa todos los campos');
            return;
        }

        // Mostrar loading
        this.setLoading(true);

        try {
            const barcodeData = {
                fecha: fecha,
                contenedor: numeroContenedor,
                codigo: barcodeValue,
                timestamp: new Date().toISOString(),
                timestampReadable: new Date().toLocaleString('es-ES')
            };

            // Guardar en Firebase
            await this.saveToFirebase(barcodeData);
            this.clearForm();
            this.showNotification('Código guardado exitosamente en Firebase');

        } catch (error) {
            console.error('Error guardando en Firebase:', error);
            alert('Error al guardar en Firebase. Intenta nuevamente.');
        } finally {
            this.setLoading(false);
        }
    }

    async saveToFirebase(barcodeData) {
        // Crear una referencia única para el código
        const barcodeRef = database.ref('barcodes').push();
        await barcodeRef.set(barcodeData);
        return barcodeRef.key;
    }

    setLoading(loading) {
        const form = document.getElementById('barcodeForm');
        const submitBtn = form.querySelector('button[type="submit"]');
        
        if (loading) {
            form.classList.add('loading');
            submitBtn.innerHTML = '⏳ Guardando...';
            submitBtn.disabled = true;
        } else {
            form.classList.remove('loading');
            submitBtn.innerHTML = 'Guardar Código';
            submitBtn.disabled = false;
        }
    }

    clearForm() {
        document.getElementById('barcodeInput').value = '';
        document.getElementById('barcodeInput').focus();
        // Mantener fecha y contenedor para escaneos rápidos del mismo día
    }

    async handleFileUpload(file) {
        if (!file) return;

        const fileExtension = file.name.split('.').pop().toLowerCase();
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const content = e.target.result;
                let codes = [];

                switch (fileExtension) {
                    case 'txt':
                        codes = this.parseTxtFile(content);
                        break;
                    case 'csv':
                        codes = this.parseCsvFile(content);
                        break;
                    case 'json':
                        codes = this.parseJsonFile(content);
                        break;
                    default:
                        alert('Formato de archivo no soportado');
                        return;
                }

                await this.processBatchCodes(codes);
            } catch (error) {
                alert('Error al procesar el archivo: ' + error.message);
            }
        };

        reader.readAsText(file);
    }

    parseTxtFile(content) {
        return content.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
    }

    parseCsvFile(content) {
        return content.split('\n')
            .map(line => line.split(',')[0].trim())
            .filter(line => line.length > 0);
    }

    parseJsonFile(content) {
        const data = JSON.parse(content);
        if (Array.isArray(data)) {
            return data.map(item => 
                typeof item === 'string' ? item : item.codigo || item.code
            ).filter(code => code);
        }
        return [];
    }

    async processBatchCodes(codes) {
        if (codes.length === 0) {
            alert('No se encontraron códigos en el archivo');
            return;
        }

        const fecha = document.getElementById('fecha').value;
        const contenedor = document.getElementById('numeroContenedor').value;

        let added = 0;
        let errors = 0;

        this.setLoading(true);

        try {
            for (const code of codes) {
                if (code) {
                    try {
                        const barcodeData = {
                            fecha: fecha,
                            contenedor: contenedor,
                            codigo: code,
                            timestamp: new Date().toISOString(),
                            timestampReadable: new Date().toLocaleString('es-ES')
                        };

                        await database.ref('barcodes').push(barcodeData);
                        added++;
                    } catch (error) {
                        console.error('Error guardando código:', code, error);
                        errors++;
                    }
                }
            }

            this.showNotification(
                `Procesamiento completado: ${added} guardados, ${errors} errores`
            );

        } finally {
            this.setLoading(false);
        }
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #27ae60;
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 1001;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Inicializar la aplicación del formulario
const barcodeForm = new BarcodeForm();
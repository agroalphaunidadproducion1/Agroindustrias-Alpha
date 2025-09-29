// Configuración de Firebase
const firebaseConfig = {
    databaseURL: "https://agro-productos-default-rtdb.firebaseio.com/"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

class BarcodeViewer {
    constructor() {
        this.barcodes = [];
        this.filteredBarcodes = [];
        this.isGridView = true;
        this.filters = {
            fecha: '',
            contenedor: '',
            codigo: ''
        };
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadBarcodes();
    }

    bindEvents() {
        // Filtros
        document.getElementById('filterFecha').addEventListener('change', (e) => {
            this.filters.fecha = e.target.value;
            this.applyFilters();
        });

        document.getElementById('filterContenedor').addEventListener('input', (e) => {
            this.filters.contenedor = e.target.value.toLowerCase();
            this.applyFilters();
        });

        document.getElementById('filterCodigo').addEventListener('input', (e) => {
            this.filters.codigo = e.target.value.toLowerCase();
            this.applyFilters();
        });

        // Botones
        document.getElementById('clearFilters').addEventListener('click', () => {
            this.clearFilters();
        });

        document.getElementById('exportData').addEventListener('click', () => {
            this.exportData();
        });

        document.getElementById('toggleView').addEventListener('click', () => {
            this.toggleView();
        });

        // Modal
        document.querySelector('.close').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('detailModal').addEventListener('click', (e) => {
            if (e.target.id === 'detailModal') {
                this.closeModal();
            }
        });
    }

    async loadBarcodes() {
        this.showLoading(true);
        
        try {
            const snapshot = await database.ref('barcodes').once('value');
            const barcodesData = snapshot.val();
            
            if (barcodesData) {
                this.barcodes = Object.entries(barcodesData).map(([key, value]) => ({
                    id: key,
                    ...value
                })).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            } else {
                this.barcodes = [];
            }
            
            this.applyFilters();
            this.updateStats();
            
        } catch (error) {
            console.error('Error cargando códigos:', error);
            this.showError('Error al cargar los códigos');
        } finally {
            this.showLoading(false);
        }
    }

    applyFilters() {
        this.filteredBarcodes = this.barcodes.filter(barcode => {
            const matchesFecha = !this.filters.fecha || barcode.fecha === this.filters.fecha;
            const matchesContenedor = !this.filters.contenedor || 
                barcode.contenedor.toLowerCase().includes(this.filters.contenedor);
            const matchesCodigo = !this.filters.codigo || 
                barcode.codigo.toLowerCase().includes(this.filters.codigo);
            
            return matchesFecha && matchesContenedor && matchesCodigo;
        });

        this.renderBarcodes();
        this.updateStats();
    }

    clearFilters() {
        document.getElementById('filterFecha').value = '';
        document.getElementById('filterContenedor').value = '';
        document.getElementById('filterCodigo').value = '';
        
        this.filters = {
            fecha: '',
            contenedor: '',
            codigo: ''
        };
        
        this.applyFilters();
    }

    renderBarcodes() {
        const container = document.getElementById('barcodesList');
        const emptyState = document.getElementById('emptyState');

        if (this.filteredBarcodes.length === 0) {
            container.classList.add('hidden');
            emptyState.classList.remove('hidden');
            return;
        }

        container.classList.remove('hidden');
        emptyState.classList.add('hidden');

        container.innerHTML = this.filteredBarcodes.map(barcode => `
            <div class="barcode-card" onclick="barcodeViewer.showBarcodeDetails('${barcode.id}')">
                <div class="barcode-visual">
                    <svg class="barcode-svg"
                         jsbarcode-value="${barcode.codigo}"
                         jsbarcode-height="40"
                         jsbarcode-displayvalue="false"
                         jsbarcode-margin="0">
                    </svg>
                </div>
                <div class="barcode-numbers">${barcode.codigo}</div>
                <div class="barcode-info">
                    <div class="barcode-meta">
                        <span class="barcode-date">${barcode.fecha}</span>
                        <span class="barcode-container">${barcode.contenedor}</span>
                    </div>
                    <div class="barcode-time">${barcode.timestampReadable || 'Sin fecha'}</div>
                </div>
            </div>
        `).join('');

        // Generar códigos de barras visuales
        JsBarcode(".barcode-svg").init();
    }

    showBarcodeDetails(barcodeId) {
        const barcode = this.barcodes.find(b => b.id === barcodeId);
        if (!barcode) return;

        const modalContent = document.getElementById('modalContent');
        modalContent.innerHTML = `
            <div class="modal-details">
                <div class="modal-detail">
                    <span class="modal-label">Código:</span>
                    <span class="modal-value">${barcode.codigo}</span>
                </div>
                <div class="modal-detail">
                    <span class="modal-label">Contenedor:</span>
                    <span class="modal-value">${barcode.contenedor}</span>
                </div>
                <div class="modal-detail">
                    <span class="modal-label">Fecha:</span>
                    <span class="modal-value">${barcode.fecha}</span>
                </div>
                <div class="modal-detail">
                    <span class="modal-label">Hora:</span>
                    <span class="modal-value">${barcode.timestampReadable || 'No disponible'}</span>
                </div>
                <div class="modal-detail">
                    <span class="modal-label">ID:</span>
                    <span class="modal-value">${barcode.id}</span>
                </div>
            </div>
            <div style="margin-top: 20px; text-align: center;">
                <svg jsbarcode-value="${barcode.codigo}"
                     jsbarcode-height="60"
                     jsbarcode-displayvalue="true"
                     jsbarcode-margin="10"
                     style="max-width: 100%;">
                </svg>
            </div>
        `;

        // Generar código de barras en el modal
        JsBarcode("svg[jsbarcode-value]").init();
        this.openModal();
    }

    openModal() {
        document.getElementById('detailModal').classList.remove('hidden');
    }

    closeModal() {
        document.getElementById('detailModal').classList.add('hidden');
    }

    toggleView() {
        const container = document.getElementById('barcodesList');
        const toggleBtn = document.getElementById('toggleView');
        
        this.isGridView = !this.isGridView;
        
        if (this.isGridView) {
            container.classList.remove('list-view');
            container.classList.add('grid-view');
            toggleBtn.textContent = '📋 Vista Lista';
        } else {
            container.classList.remove('grid-view');
            container.classList.add('list-view');
            toggleBtn.textContent = '🔲 Vista Grid';
        }
    }

    updateStats() {
        const totalCodes = this.barcodes.length;
        const filteredCodes = this.filteredBarcodes.length;
        
        // Contenedores únicos
        const uniqueContainers = new Set(this.barcodes.map(b => b.contenedor)).size;
        
        // Fechas diferentes
        const uniqueDates = new Set(this.barcodes.map(b => b.fecha)).size;

        document.getElementById('totalCodes').textContent = totalCodes;
        document.getElementById('uniqueContainers').textContent = uniqueContainers;
        document.getElementById('totalDates').textContent = uniqueDates;
        document.getElementById('filteredCodes').textContent = filteredCodes;
    }

    exportData() {
        const dataToExport = this.filteredBarcodes.length > 0 ? this.filteredBarcodes : this.barcodes;
        
        if (dataToExport.length === 0) {
            alert('No hay datos para exportar');
            return;
        }

        const csvContent = this.convertToCSV(dataToExport);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `codigos_barras_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    convertToCSV(data) {
        const headers = ['Fecha', 'Contenedor', 'Código', 'Timestamp'];
        const csvRows = [headers.join(',')];
        
        data.forEach(item => {
            const row = [
                `"${item.fecha}"`,
                `"${item.contenedor}"`,
                `"${item.codigo}"`,
                `"${item.timestampReadable || item.timestamp}"`
            ];
            csvRows.push(row.join(','));
        });
        
        return csvRows.join('\n');
    }

    showLoading(show) {
        const loadingIndicator = document.getElementById('loadingIndicator');
        const barcodesList = document.getElementById('barcodesList');
        
        if (show) {
            loadingIndicator.classList.remove('hidden');
            barcodesList.classList.add('hidden');
        } else {
            loadingIndicator.classList.add('hidden');
            barcodesList.classList.remove('hidden');
        }
    }

    showError(message) {
        alert(message);
    }
}

// Inicializar el visor
const barcodeViewer = new BarcodeViewer();
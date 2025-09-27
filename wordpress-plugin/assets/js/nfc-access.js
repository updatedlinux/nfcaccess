/**
 * JavaScript para el plugin NFC Access
 * Funcionalidades adicionales y mejoras de UX
 */

(function($) {
    'use strict';
    
    // Objeto principal del plugin
    const NFCAccess = {
        
        // Inicialización
        init: function() {
            this.bindEvents();
            this.initTooltips();
            this.initDatePickers();
            this.initAutoRefresh();
        },
        
        // Vincular eventos
        bindEvents: function() {
            // Eventos globales
            $(document).on('click', '.nfc-button', this.handleButtonClick);
            $(document).on('keypress', '.nfc-input', this.handleInputKeypress);
            
            // Eventos específicos
            this.bindFilterEvents();
            this.bindSearchEvents();
            this.bindModalEvents();
        },
        
        // Eventos de filtros
        bindFilterEvents: function() {
            // Filtro de fechas automático
            $('#date-from, #date-to').on('change', function() {
                const fromDate = $('#date-from').val();
                const toDate = $('#date-to').val();
                
                if (fromDate && toDate && fromDate > toDate) {
                    NFCAccess.showNotification('La fecha de inicio no puede ser posterior a la fecha de fin', 'error');
                    $('#date-to').val('');
                    return;
                }
                
                // Auto-filtrar si ambas fechas están seleccionadas
                if (fromDate && toDate) {
                    setTimeout(() => {
                        $('#filter-logs').trigger('click');
                    }, 500);
                }
            });
            
            // Limpiar filtros con doble clic
            $('#clear-filters').on('dblclick', function() {
                NFCAccess.clearAllFilters();
            });
        },
        
        // Eventos de búsqueda
        bindSearchEvents: function() {
            // Búsqueda con debounce
            let searchTimeout;
            $('#user-search').on('input', function() {
                clearTimeout(searchTimeout);
                const searchTerm = $(this).val().trim();
                
                if (searchTerm.length >= 2) {
                    searchTimeout = setTimeout(() => {
                        $('#search-users').trigger('click');
                    }, 800);
                }
            });
            
            // Limpiar búsqueda con Escape
            $('#user-search').on('keydown', function(e) {
                if (e.key === 'Escape') {
                    $(this).val('');
                    $('#search-results').html('<p class="search-placeholder">Ingrese un término de búsqueda para comenzar</p>');
                }
            });
        },
        
        // Eventos de modal
        bindModalEvents: function() {
            // Cerrar modal con Escape
            $(document).on('keydown', function(e) {
                if (e.key === 'Escape' && $('.nfc-modal').length > 0) {
                    $('.nfc-modal').remove();
                }
            });
            
            // Prevenir cierre accidental
            $('.modal-content').on('click', function(e) {
                e.stopPropagation();
            });
        },
        
        // Manejar clics de botones
        handleButtonClick: function(e) {
            const $btn = $(this);
            
            // Efecto de clic
            $btn.addClass('clicked');
            setTimeout(() => {
                $btn.removeClass('clicked');
            }, 150);
            
            // Deshabilitar botón durante la acción
            if ($btn.hasClass('loading')) {
                e.preventDefault();
                return false;
            }
        },
        
        // Manejar tecla Enter en inputs
        handleInputKeypress: function(e) {
            if (e.which === 13) {
                const $input = $(this);
                const $form = $input.closest('form');
                
                if ($form.length) {
                    $form.submit();
                } else {
                    // Buscar botón relacionado
                    const $btn = $input.siblings('.nfc-button, .nfc-button-primary').first();
                    if ($btn.length) {
                        $btn.trigger('click');
                    }
                }
            }
        },
        
        // Inicializar tooltips
        initTooltips: function() {
            // Tooltips simples con atributo title
            $('[title]').each(function() {
                const $element = $(this);
                const title = $element.attr('title');
                
                if (title) {
                    $element.removeAttr('title');
                    $element.on('mouseenter', function() {
                        NFCAccess.showTooltip($(this), title);
                    }).on('mouseleave', function() {
                        NFCAccess.hideTooltip();
                    });
                }
            });
        },
        
        // Inicializar date pickers
        initDatePickers: function() {
            // Configurar fechas por defecto
            const today = new Date();
            const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            
            // Establecer fecha máxima como hoy
            $('#date-from, #date-to').attr('max', today.toISOString().split('T')[0]);
            
            // Sugerir fecha de inicio (última semana)
            if (!$('#date-from').val()) {
                $('#date-from').attr('placeholder', lastWeek.toISOString().split('T')[0]);
            }
        },
        
        // Inicializar auto-refresh
        initAutoRefresh: function() {
            // Auto-refresh cada 5 minutos para resumen del día
            if ($('#summary-content').length > 0) {
                setInterval(() => {
                    if ($('#access-summary').hasClass('active')) {
                        $('#refresh-summary').trigger('click');
                    }
                }, 300000); // 5 minutos
            }
        },
        
        // Mostrar tooltip
        showTooltip: function($element, text) {
            const tooltip = $('<div class="nfc-tooltip">' + text + '</div>');
            $('body').append(tooltip);
            
            const elementOffset = $element.offset();
            const elementWidth = $element.outerWidth();
            const tooltipWidth = tooltip.outerWidth();
            
            let left = elementOffset.left + (elementWidth / 2) - (tooltipWidth / 2);
            let top = elementOffset.top - tooltip.outerHeight() - 10;
            
            // Ajustar si se sale de la pantalla
            if (left < 10) left = 10;
            if (left + tooltipWidth > $(window).width() - 10) {
                left = $(window).width() - tooltipWidth - 10;
            }
            if (top < 10) {
                top = elementOffset.top + $element.outerHeight() + 10;
            }
            
            tooltip.css({
                position: 'absolute',
                left: left + 'px',
                top: top + 'px',
                zIndex: 10000
            });
            
            tooltip.fadeIn(200);
        },
        
        // Ocultar tooltip
        hideTooltip: function() {
            $('.nfc-tooltip').fadeOut(200, function() {
                $(this).remove();
            });
        },
        
        // Limpiar todos los filtros
        clearAllFilters: function() {
            $('#date-from, #date-to').val('');
            $('#user-search').val('');
            
            // Limpiar resultados
            $('#search-results').html('<p class="search-placeholder">Ingrese un término de búsqueda para comenzar</p>');
            
            // Recargar logs si estamos en la vista de logs
            if ($('#nfc-access-logs').length > 0) {
                $('#filter-logs').trigger('click');
            }
            
            this.showNotification('Filtros limpiados', 'success');
        },
        
        // Mostrar notificación
        showNotification: function(message, type = 'info', duration = 3000) {
            const notification = $('<div class="nfc-notification nfc-notification-' + type + '">' + message + '</div>');
            $('body').append(notification);
            
            notification.css({
                position: 'fixed',
                top: '20px',
                right: '20px',
                zIndex: 10000,
                padding: '15px 20px',
                borderRadius: '4px',
                color: 'white',
                fontWeight: '500',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                transform: 'translateX(100%)',
                transition: 'transform 0.3s ease'
            });
            
            // Colores según tipo
            const colors = {
                success: '#28a745',
                error: '#dc3545',
                warning: '#ffc107',
                info: '#17a2b8'
            };
            
            notification.css('backgroundColor', colors[type] || colors.info);
            
            // Animar entrada
            setTimeout(() => {
                notification.css('transform', 'translateX(0)');
            }, 100);
            
            // Auto-remover
            setTimeout(() => {
                notification.css('transform', 'translateX(100%)');
                setTimeout(() => {
                    notification.remove();
                }, 300);
            }, duration);
        },
        
        // Formatear fecha para mostrar
        formatDate: function(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString('es-VE', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        },
        
        // Validar formulario
        validateForm: function($form) {
            let isValid = true;
            const errors = [];
            
            $form.find('[required]').each(function() {
                const $field = $(this);
                const value = $field.val().trim();
                
                if (!value) {
                    isValid = false;
                    $field.addClass('error');
                    errors.push($field.attr('name') || 'Campo requerido');
                } else {
                    $field.removeClass('error');
                }
            });
            
            if (!isValid) {
                this.showNotification('Por favor complete todos los campos requeridos', 'error');
            }
            
            return isValid;
        },
        
        // Exportar datos
        exportData: function(data, filename, type = 'csv') {
            let content = '';
            let mimeType = '';
            
            if (type === 'csv') {
                content = this.convertToCSV(data);
                mimeType = 'text/csv';
            } else if (type === 'json') {
                content = JSON.stringify(data, null, 2);
                mimeType = 'application/json';
            }
            
            const blob = new Blob([content], { type: mimeType });
            const url = window.URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = filename + '.' + type;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            window.URL.revokeObjectURL(url);
        },
        
        // Convertir a CSV
        convertToCSV: function(data) {
            if (!data || data.length === 0) return '';
            
            const headers = Object.keys(data[0]);
            const csvHeaders = headers.join(',');
            
            const csvRows = data.map(row => {
                return headers.map(header => {
                    const value = row[header] || '';
                    return '"' + value.toString().replace(/"/g, '""') + '"';
                }).join(',');
            });
            
            return csvHeaders + '\n' + csvRows.join('\n');
        },
        
        // Mostrar loading en botón
        showButtonLoading: function($button, text = 'Cargando...') {
            $button.data('original-text', $button.text());
            $button.text(text).prop('disabled', true).addClass('loading');
        },
        
        // Ocultar loading en botón
        hideButtonLoading: function($button) {
            const originalText = $button.data('original-text') || 'Enviar';
            $button.text(originalText).prop('disabled', false).removeClass('loading');
        },
        
        // Debounce function
        debounce: function(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },
        
        // Throttle function
        throttle: function(func, limit) {
            let inThrottle;
            return function() {
                const args = arguments;
                const context = this;
                if (!inThrottle) {
                    func.apply(context, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        }
    };
    
    // Utilidades adicionales
    const NFCUtils = {
        
        // Copiar al portapapeles
        copyToClipboard: function(text) {
            if (navigator.clipboard) {
                navigator.clipboard.writeText(text).then(() => {
                    NFCAccess.showNotification('Copiado al portapapeles', 'success');
                });
            } else {
                // Fallback para navegadores más antiguos
                const textArea = document.createElement('textarea');
                textArea.value = text;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                NFCAccess.showNotification('Copiado al portapapeles', 'success');
            }
        },
        
        // Generar ID único
        generateId: function() {
            return 'nfc_' + Math.random().toString(36).substr(2, 9);
        },
        
        // Verificar si es dispositivo móvil
        isMobile: function() {
            return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        },
        
        // Obtener tamaño de pantalla
        getScreenSize: function() {
            const width = $(window).width();
            if (width < 576) return 'xs';
            if (width < 768) return 'sm';
            if (width < 992) return 'md';
            if (width < 1200) return 'lg';
            return 'xl';
        }
    };
    
    // Funciones globales para compatibilidad
    window.NFCAccess = NFCAccess;
    window.NFCUtils = NFCUtils;
    
    // Inicializar cuando el documento esté listo
    $(document).ready(function() {
        NFCAccess.init();
        
        // Agregar estilos adicionales para notificaciones y tooltips
        $('<style>')
            .prop('type', 'text/css')
            .html(`
                .nfc-notification {
                    font-family: var(--nfc-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
                    font-size: 14px;
                    line-height: 1.4;
                }
                
                .nfc-tooltip {
                    background-color: #333;
                    color: white;
                    padding: 8px 12px;
                    border-radius: 4px;
                    font-size: 12px;
                    max-width: 200px;
                    word-wrap: break-word;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                }
                
                .nfc-tooltip::after {
                    content: '';
                    position: absolute;
                    top: 100%;
                    left: 50%;
                    margin-left: -5px;
                    border-width: 5px;
                    border-style: solid;
                    border-color: #333 transparent transparent transparent;
                }
                
                .nfc-button.clicked {
                    transform: scale(0.95);
                }
                
                .nfc-button.loading {
                    opacity: 0.7;
                    cursor: not-allowed;
                }
                
                .nfc-input.error {
                    border-color: #dc3545;
                    box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.2);
                }
                
                @media (max-width: 768px) {
                    .nfc-notification {
                        right: 10px;
                        left: 10px;
                        transform: translateY(-100%);
                    }
                    
                    .nfc-notification.show {
                        transform: translateY(0);
                    }
                }
            `)
            .appendTo('head');
    });
    
})(jQuery);

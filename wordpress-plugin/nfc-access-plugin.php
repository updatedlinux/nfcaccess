<?php
/**
 * Plugin Name: NFC Access - Sistema de Acceso Vehicular
 * Plugin URI: https://condo360.com/nfc-access
 * Description: Sistema para gestión de acceso vehicular mediante tarjetas NFC MIFARE Classic. Incluye shortcodes para propietarios y administradores.
 * Version: 1.0.0
 * Author: Condo360
 * Author URI: https://condo360.com
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: nfc-access
 * Domain Path: /languages
 * Requires at least: 5.0
 * Tested up to: 6.4
 * Requires PHP: 7.4
 * Network: false
 */

// Prevenir acceso directo
if (!defined('ABSPATH')) {
    exit;
}

// Definir constantes del plugin
define('NFC_ACCESS_VERSION', '1.0.0');
define('NFC_ACCESS_PLUGIN_FILE', __FILE__);
define('NFC_ACCESS_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('NFC_ACCESS_PLUGIN_URL', plugin_dir_url(__FILE__));
define('NFC_ACCESS_API_URL', 'https://api.bonaventurecclub.com/nfc_access');

/**
 * Clase principal del plugin NFC Access
 */
class NFC_Access_Plugin {
    
    /**
     * Constructor
     */
    public function __construct() {
        add_action('init', array($this, 'init'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('wp_ajax_nfc_access_get_logs', array($this, 'ajax_get_access_logs'));
        add_action('wp_ajax_nfc_access_search_cards', array($this, 'ajax_search_cards'));
        
        // Registrar shortcodes
        add_shortcode('nfc_access_logs', array($this, 'shortcode_access_logs'));
        add_shortcode('nfc_admin_panel', array($this, 'shortcode_admin_panel'));
    }
    
    /**
     * Inicializar plugin
     */
    public function init() {
        // Cargar traducciones
        load_plugin_textdomain('nfc-access', false, dirname(plugin_basename(__FILE__)) . '/languages');
        
        // Verificar dependencias
        $this->check_dependencies();
    }
    
    /**
     * Verificar dependencias del plugin
     */
    private function check_dependencies() {
        if (!function_exists('curl_init')) {
            add_action('admin_notices', function() {
                echo '<div class="notice notice-error"><p>';
                echo __('NFC Access requiere la extensión cURL de PHP para funcionar correctamente.', 'nfc-access');
                echo '</p></div>';
            });
        }
    }
    
    /**
     * Encolar scripts y estilos
     */
    public function enqueue_scripts() {
        // Solo cargar en páginas que usen los shortcodes
        global $post;
        if (is_a($post, 'WP_Post') && (
            has_shortcode($post->post_content, 'nfc_access_logs') ||
            has_shortcode($post->post_content, 'nfc_admin_panel')
        )) {
            wp_enqueue_style('nfc-access-style', NFC_ACCESS_PLUGIN_URL . 'assets/css/nfc-access.css', array(), NFC_ACCESS_VERSION);
            wp_enqueue_script('nfc-access-script', NFC_ACCESS_PLUGIN_URL . 'assets/js/nfc-access.js', array('jquery'), NFC_ACCESS_VERSION, true);
            
            // Localizar script para AJAX
            wp_localize_script('nfc-access-script', 'nfcAccess', array(
                'ajaxUrl' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('nfc_access_nonce'),
                'apiUrl' => NFC_ACCESS_API_URL,
                'currentUserId' => get_current_user_id(),
                'strings' => array(
                    'loading' => __('Cargando...', 'nfc-access'),
                    'error' => __('Error al cargar los datos', 'nfc-access'),
                    'noData' => __('No se encontraron datos', 'nfc-access'),
                    'searchPlaceholder' => __('Buscar por nombre, email o login...', 'nfc-access')
                )
            ));
        }
    }
    
    /**
     * Agregar menú de administración
     */
    public function add_admin_menu() {
        add_options_page(
            __('NFC Access', 'nfc-access'),
            __('NFC Access', 'nfc-access'),
            'manage_options',
            'nfc-access-settings',
            array($this, 'admin_page')
        );
    }
    
    /**
     * Página de administración
     */
    public function admin_page() {
        ?>
        <div class="wrap">
            <h1><?php _e('Configuración NFC Access', 'nfc-access'); ?></h1>
            <div class="card">
                <h2><?php _e('Información del Sistema', 'nfc-access'); ?></h2>
                <p><?php _e('URL de la API:', 'nfc-access'); ?> <code><?php echo NFC_ACCESS_API_URL; ?></code></p>
                <p><?php _e('Versión del plugin:', 'nfc-access'); ?> <?php echo NFC_ACCESS_VERSION; ?></p>
                
                <h3><?php _e('Shortcodes Disponibles', 'nfc-access'); ?></h3>
                <ul>
                    <li><code>[nfc_access_logs]</code> - <?php _e('Mostrar historial de accesos del usuario actual', 'nfc-access'); ?></li>
                    <li><code>[nfc_admin_panel]</code> - <?php _e('Panel de administración para buscar tarjetas y accesos', 'nfc-access'); ?></li>
                </ul>
                
                <h3><?php _e('Estado de la API', 'nfc-access'); ?></h3>
                <div id="api-status">
                    <p><?php _e('Verificando conexión...', 'nfc-access'); ?></p>
                </div>
            </div>
        </div>
        
        <script>
        jQuery(document).ready(function($) {
            // Verificar estado de la API
            $.get('<?php echo NFC_ACCESS_API_URL; ?>/health')
                .done(function(data) {
                    $('#api-status').html('<p style="color: green;">✅ ' + 
                        '<?php _e("API conectada correctamente", "nfc-access"); ?>' + 
                        '</p>');
                })
                .fail(function() {
                    $('#api-status').html('<p style="color: red;">❌ ' + 
                        '<?php _e("Error de conexión con la API", "nfc-access"); ?>' + 
                        '</p>');
                });
        });
        </script>
        <?php
    }
    
    /**
     * Shortcode para mostrar historial de accesos del usuario actual
     */
    public function shortcode_access_logs($atts) {
        $atts = shortcode_atts(array(
            'limit' => '50',
            'show_stats' => 'true'
        ), $atts);
        
        $current_user = wp_get_current_user();
        if (!$current_user->ID) {
            return '<div class="nfc-access-error">' . __('Debe iniciar sesión para ver su historial de accesos.', 'nfc-access') . '</div>';
        }
        
        ob_start();
        ?>
        <div class="nfc-access-container">
            <div class="nfc-access-header">
                <h3><?php _e('Mi Historial de Accesos', 'nfc-access'); ?></h3>
                <p class="nfc-access-subtitle"><?php _e('Bienvenido', 'nfc-access'); ?>, <?php echo esc_html($current_user->display_name); ?></p>
            </div>
            
            <?php if ($atts['show_stats'] === 'true'): ?>
            <div class="nfc-access-stats" id="nfc-access-stats">
                <div class="stats-loading"><?php _e('Cargando estadísticas...', 'nfc-access'); ?></div>
            </div>
            <?php endif; ?>
            
            <div class="nfc-access-filters">
                <div class="filter-group">
                    <label for="date-from"><?php _e('Desde:', 'nfc-access'); ?></label>
                    <input type="date" id="date-from" class="nfc-date-input">
                </div>
                <div class="filter-group">
                    <label for="date-to"><?php _e('Hasta:', 'nfc-access'); ?></label>
                    <input type="date" id="date-to" class="nfc-date-input">
                </div>
                <button type="button" id="filter-logs" class="nfc-button nfc-button-primary">
                    <?php _e('Filtrar', 'nfc-access'); ?>
                </button>
                <button type="button" id="clear-filters" class="nfc-button nfc-button-secondary">
                    <?php _e('Limpiar', 'nfc-access'); ?>
                </button>
            </div>
            
            <div class="nfc-access-logs" id="nfc-access-logs">
                <div class="logs-loading"><?php _e('Cargando historial...', 'nfc-access'); ?></div>
            </div>
            
            <div class="nfc-access-pagination" id="nfc-access-pagination"></div>
        </div>
        
        <script>
        jQuery(document).ready(function($) {
            // Cargar datos iniciales
            loadAccessLogs();
            <?php if ($atts['show_stats'] === 'true'): ?>
            loadAccessStats();
            <?php endif; ?>
            
            // Eventos de filtros
            $('#filter-logs').on('click', function() {
                loadAccessLogs();
            });
            
            $('#clear-filters').on('click', function() {
                $('#date-from, #date-to').val('');
                loadAccessLogs();
            });
            
            function loadAccessLogs(page = 0) {
                const filters = {
                    limit: <?php echo intval($atts['limit']); ?>,
                    offset: page * <?php echo intval($atts['limit']); ?>,
                    start_date: $('#date-from').val(),
                    end_date: $('#date-to').val()
                };
                
                $('#nfc-access-logs').html('<div class="logs-loading"><?php _e("Cargando historial...", "nfc-access"); ?></div>');
                
                $.ajax({
                    url: nfcAccess.ajaxUrl,
                    type: 'POST',
                    data: {
                        action: 'nfc_access_get_logs',
                        user_id: <?php echo $current_user->ID; ?>,
                        filters: filters,
                        nonce: nfcAccess.nonce
                    },
                    success: function(response) {
                        if (response.success) {
                            displayAccessLogs(response.data);
                        } else {
                            $('#nfc-access-logs').html('<div class="nfc-access-error">' + response.message + '</div>');
                        }
                    },
                    error: function() {
                        $('#nfc-access-logs').html('<div class="nfc-access-error"><?php _e("Error al cargar los datos", "nfc-access"); ?></div>');
                    }
                });
            }
            
            <?php if ($atts['show_stats'] === 'true'): ?>
            function loadAccessStats() {
                $.ajax({
                    url: nfcAccess.apiUrl + '/access/stats/<?php echo $current_user->ID; ?>?period=month',
                    type: 'GET',
                    success: function(response) {
                        if (response.success) {
                            displayAccessStats(response.data);
                        }
                    }
                });
            }
            
            function displayAccessStats(data) {
                const statsHtml = `
                    <div class="stats-grid">
                        <div class="stat-item">
                            <div class="stat-number">${data.totals.total}</div>
                            <div class="stat-label"><?php _e("Total Accesos", "nfc-access"); ?></div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number">${data.totals.ingresos}</div>
                            <div class="stat-label"><?php _e("Ingresos", "nfc-access"); ?></div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number">${data.totals.salidas}</div>
                            <div class="stat-label"><?php _e("Salidas", "nfc-access"); ?></div>
                        </div>
                    </div>
                `;
                $('#nfc-access-stats').html(statsHtml);
            }
            <?php endif; ?>
            
            function displayAccessLogs(data) {
                if (data.logs.length === 0) {
                    $('#nfc-access-logs').html('<div class="nfc-access-no-data"><?php _e("No se encontraron registros de acceso", "nfc-access"); ?></div>');
                    return;
                }
                
                let logsHtml = '<div class="logs-table-container"><table class="nfc-logs-table"><thead><tr><th><?php _e("Fecha y Hora", "nfc-access"); ?></th><th><?php _e("Tipo", "nfc-access"); ?></th><th><?php _e("Tarjeta", "nfc-access"); ?></th><th><?php _e("Vigilante", "nfc-access"); ?></th></tr></thead><tbody>';
                
                data.logs.forEach(function(log) {
                    const typeClass = log.access_type === 'ingreso' ? 'access-ingreso' : 'access-salida';
                    const typeText = log.access_type === 'ingreso' ? '<?php _e("Ingreso", "nfc-access"); ?>' : '<?php _e("Salida", "nfc-access"); ?>';
                    
                    logsHtml += `
                        <tr>
                            <td>${log.timestamp_formatted}</td>
                            <td><span class="access-type ${typeClass}">${typeText}</span></td>
                            <td>${log.card_uid} ${log.card_label ? '(' + log.card_label + ')' : ''}</td>
                            <td>${log.guard_user || '-'}</td>
                        </tr>
                    `;
                });
                
                logsHtml += '</tbody></table></div>';
                
                // Agregar paginación si es necesario
                if (data.pagination.has_more) {
                    logsHtml += '<div class="pagination-controls"><button class="nfc-button" onclick="loadAccessLogs(' + (data.pagination.offset / data.pagination.limit + 1) + ')"><?php _e("Cargar más", "nfc-access"); ?></button></div>';
                }
                
                $('#nfc-access-logs').html(logsHtml);
            }
        });
        </script>
        <?php
        return ob_get_clean();
    }
    
    /**
     * Shortcode para panel de administración
     */
    public function shortcode_admin_panel($atts) {
        // Verificar permisos de administrador
        if (!current_user_can('manage_options')) {
            return '<div class="nfc-access-error">' . __('No tiene permisos para acceder a esta funcionalidad.', 'nfc-access') . '</div>';
        }
        
        ob_start();
        ?>
        <div class="nfc-access-admin-container">
            <div class="nfc-access-header">
                <h3><?php _e('Panel de Administración - NFC Access', 'nfc-access'); ?></h3>
                <p class="nfc-access-subtitle"><?php _e('Gestión de tarjetas y accesos del condominio', 'nfc-access'); ?></p>
            </div>
            
            <div class="admin-tabs">
                <button class="tab-button active" data-tab="search-cards"><?php _e('Buscar Propietario', 'nfc-access'); ?></button>
                <button class="tab-button" data-tab="access-summary"><?php _e('Resumen del Día', 'nfc-access'); ?></button>
            </div>
            
            <!-- Tab: Buscar Propietario -->
            <div class="tab-content active" id="search-cards">
                <div class="search-section">
                    <div class="search-form">
                        <input type="text" id="user-search" placeholder="<?php _e('Buscar por nombre, email o login de propietario...', 'nfc-access'); ?>" class="nfc-input">
                        <button type="button" id="search-users" class="nfc-button nfc-button-primary">
                            <?php _e('Buscar', 'nfc-access'); ?>
                        </button>
                    </div>
                    
                    <div class="search-results" id="search-results">
                        <p class="search-placeholder"><?php _e('Ingrese un término de búsqueda para buscar propietarios', 'nfc-access'); ?></p>
                    </div>
                </div>
            </div>
            
            <!-- Tab: Resumen del Día -->
            <div class="tab-content" id="access-summary">
                <div class="summary-section">
                    <div class="summary-header">
                        <h4><?php _e('Resumen de Accesos del Día', 'nfc-access'); ?></h4>
                        <button type="button" id="refresh-summary" class="nfc-button nfc-button-secondary">
                            <?php _e('Actualizar', 'nfc-access'); ?>
                        </button>
                    </div>
                    
                    <div class="summary-content" id="summary-content">
                        <div class="summary-loading"><?php _e('Cargando resumen...', 'nfc-access'); ?></div>
                    </div>
                </div>
            </div>
        </div>
        
        <script>
        jQuery(document).ready(function($) {
            // Manejo de tabs
            $('.tab-button').on('click', function() {
                const tabId = $(this).data('tab');
                
                $('.tab-button').removeClass('active');
                $(this).addClass('active');
                
                $('.tab-content').removeClass('active');
                $('#' + tabId).addClass('active');
                
                // Cargar contenido del tab activo
                if (tabId === 'access-summary') {
                    loadTodaySummary();
                }
            });
            
            // Búsqueda de usuarios
            $('#search-users').on('click', function() {
                const searchTerm = $('#user-search').val().trim();
                if (searchTerm.length < 2) {
                    alert('<?php _e("Ingrese al menos 2 caracteres para buscar", "nfc-access"); ?>');
                    return;
                }
                
                searchUsers(searchTerm);
            });
            
            // Búsqueda al presionar Enter
            $('#user-search').on('keypress', function(e) {
                if (e.which === 13) {
                    $('#search-users').click();
                }
            });
            
            // Actualizar resumen
            $('#refresh-summary').on('click', function() {
                loadTodaySummary();
            });
            
            function searchUsers(searchTerm) {
                $('#search-results').html('<div class="search-loading"><?php _e("Buscando...", "nfc-access"); ?></div>');
                
                $.ajax({
                    url: nfcAccess.ajaxUrl,
                    type: 'POST',
                    data: {
                        action: 'nfc_access_search_cards',
                        search: searchTerm,
                        nonce: nfcAccess.nonce
                    },
                    success: function(response) {
                        if (response.success) {
                            displaySearchResults(response.data);
                        } else {
                            $('#search-results').html('<div class="nfc-access-error">' + response.message + '</div>');
                        }
                    },
                    error: function() {
                        $('#search-results').html('<div class="nfc-access-error"><?php _e("Error al realizar la búsqueda", "nfc-access"); ?></div>');
                    }
                });
            }
            
            function displaySearchResults(cards) {
                if (cards.length === 0) {
                    $('#search-results').html('<div class="nfc-access-no-data"><?php _e("No se encontraron propietarios", "nfc-access"); ?></div>');
                    return;
                }
                
                let resultsHtml = '<div class="cards-grid">';
                
                cards.forEach(function(card) {
                    resultsHtml += `
                        <div class="card-item">
                            <div class="card-header">
                                <h5>${card.display_name}</h5>
                                <span class="card-status ${card.active ? 'active' : 'inactive'}">
                                    ${card.active ? '<?php _e("Activa", "nfc-access"); ?>' : '<?php _e("Inactiva", "nfc-access"); ?>'}
                                </span>
                            </div>
                            <div class="card-details">
                                <p><strong><?php _e("Login:", "nfc-access"); ?></strong> ${card.user_login}</p>
                                <p><strong><?php _e("Email:", "nfc-access"); ?></strong> ${card.user_email}</p>
                                <p><strong><?php _e("Tarjeta:", "nfc-access"); ?></strong> ${card.card_uid}</p>
                                ${card.label ? '<p><strong><?php _e("Etiqueta:", "nfc-access"); ?></strong> ' + card.label + '</p>' : ''}
                                <p><strong><?php _e("Registrada:", "nfc-access"); ?></strong> ${new Date(card.created_at).toLocaleDateString('es-VE')}</p>
                            </div>
                            <div class="card-actions">
                                <button class="nfc-button nfc-button-small" onclick="viewUserLogs(${card.wp_user_id}, '${card.display_name}')">
                                    <?php _e("Ver Accesos", "nfc-access"); ?>
                                </button>
                            </div>
                        </div>
                    `;
                });
                
                resultsHtml += '</div>';
                $('#search-results').html(resultsHtml);
            }
            
            function loadTodaySummary() {
                $('#summary-content').html('<div class="summary-loading"><?php _e("Cargando resumen...", "nfc-access"); ?></div>');
                
                $.ajax({
                    url: nfcAccess.apiUrl + '/access/today-summary',
                    type: 'GET',
                    success: function(response) {
                        if (response.success) {
                            displayTodaySummary(response.data);
                        } else {
                            $('#summary-content').html('<div class="nfc-access-error">' + response.message + '</div>');
                        }
                    },
                    error: function() {
                        $('#summary-content').html('<div class="nfc-access-error"><?php _e("Error al cargar el resumen", "nfc-access"); ?></div>');
                    }
                });
            }
            
            function displayTodaySummary(data) {
                const summaryHtml = `
                    <div class="summary-stats">
                        <div class="summary-stat">
                            <div class="stat-number">${data.summary.total_ingresos}</div>
                            <div class="stat-label"><?php _e("Ingresos Hoy", "nfc-access"); ?></div>
                        </div>
                        <div class="summary-stat">
                            <div class="stat-number">${data.summary.total_salidas}</div>
                            <div class="stat-label"><?php _e("Salidas Hoy", "nfc-access"); ?></div>
                        </div>
                    </div>
                    
                    <div class="summary-details">
                        <h5><?php _e("Detalle de Ingresos", "nfc-access"); ?></h5>
                        <div class="summary-list">
                            ${data.summary.ingresos.map(item => `
                                <div class="summary-item">
                                    <span class="item-name">${item.user_name}</span>
                                    <span class="item-count">${item.count} <?php _e("veces", "nfc-access"); ?></span>
                                </div>
                            `).join('')}
                        </div>
                        
                        <h5><?php _e("Detalle de Salidas", "nfc-access"); ?></h5>
                        <div class="summary-list">
                            ${data.summary.salidas.map(item => `
                                <div class="summary-item">
                                    <span class="item-name">${item.user_name}</span>
                                    <span class="item-count">${item.count} <?php _e("veces", "nfc-access"); ?></span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
                
                $('#summary-content').html(summaryHtml);
            }
            
            // Función global para ver logs de usuario
            window.viewUserLogs = function(userId, userName) {
                const modalHtml = `
                    <div class="nfc-modal" id="user-logs-modal">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h4><?php _e("Accesos de", "nfc-access"); ?> ${userName}</h4>
                                <button class="modal-close">&times;</button>
                            </div>
                            <div class="modal-body" id="user-logs-content">
                                <div class="logs-loading"><?php _e("Cargando accesos...", "nfc-access"); ?></div>
                            </div>
                        </div>
                    </div>
                `;
                
                $('body').append(modalHtml);
                
                // Cargar logs del usuario
                $.ajax({
                    url: nfcAccess.apiUrl + '/access/logs/' + userId + '?limit=100',
                    type: 'GET',
                    success: function(response) {
                        if (response.success) {
                            displayUserLogs(response.data.logs);
                        } else {
                            $('#user-logs-content').html('<div class="nfc-access-error">' + response.message + '</div>');
                        }
                    },
                    error: function() {
                        $('#user-logs-content').html('<div class="nfc-access-error"><?php _e("Error al cargar los accesos", "nfc-access"); ?></div>');
                    }
                });
                
                // Cerrar modal
                $('.modal-close, .nfc-modal').on('click', function(e) {
                    if (e.target === this) {
                        $('#user-logs-modal').remove();
                    }
                });
            };
            
            function displayUserLogs(logs) {
                if (logs.length === 0) {
                    $('#user-logs-content').html('<div class="nfc-access-no-data"><?php _e("No se encontraron accesos", "nfc-access"); ?></div>');
                    return;
                }
                
                let logsHtml = '<div class="logs-table-container"><table class="nfc-logs-table"><thead><tr><th><?php _e("Fecha y Hora", "nfc-access"); ?></th><th><?php _e("Tipo", "nfc-access"); ?></th><th><?php _e("Tarjeta", "nfc-access"); ?></th><th><?php _e("Vigilante", "nfc-access"); ?></th></tr></thead><tbody>';
                
                logs.forEach(function(log) {
                    const typeClass = log.access_type === 'ingreso' ? 'access-ingreso' : 'access-salida';
                    const typeText = log.access_type === 'ingreso' ? '<?php _e("Ingreso", "nfc-access"); ?>' : '<?php _e("Salida", "nfc-access"); ?>';
                    
                    logsHtml += `
                        <tr>
                            <td>${log.timestamp_formatted}</td>
                            <td><span class="access-type ${typeClass}">${typeText}</span></td>
                            <td>${log.card_uid} ${log.card_label ? '(' + log.card_label + ')' : ''}</td>
                            <td>${log.guard_user || '-'}</td>
                        </tr>
                    `;
                });
                
                logsHtml += '</tbody></table></div>';
                $('#user-logs-content').html(logsHtml);
            }
        });
        </script>
        <?php
        return ob_get_clean();
    }
    
    /**
     * AJAX: Obtener logs de acceso
     */
    public function ajax_get_access_logs() {
        check_ajax_referer('nfc_access_nonce', 'nonce');
        
        $user_id = intval($_POST['user_id']);
        $filters = $_POST['filters'];
        
        if (!$user_id) {
            wp_send_json_error('ID de usuario inválido');
        }
        
        // Construir URL de la API
        $api_url = NFC_ACCESS_API_URL . '/access/logs/' . $user_id;
        $params = array();
        
        if (!empty($filters['limit'])) {
            $params[] = 'limit=' . intval($filters['limit']);
        }
        if (!empty($filters['offset'])) {
            $params[] = 'offset=' . intval($filters['offset']);
        }
        if (!empty($filters['start_date'])) {
            $params[] = 'start_date=' . urlencode($filters['start_date']);
        }
        if (!empty($filters['end_date'])) {
            $params[] = 'end_date=' . urlencode($filters['end_date']);
        }
        
        if (!empty($params)) {
            $api_url .= '?' . implode('&', $params);
        }
        
        // Realizar petición a la API
        $response = wp_remote_get($api_url, array(
            'timeout' => 30,
            'headers' => array(
                'Content-Type' => 'application/json'
            )
        ));
        
        if (is_wp_error($response)) {
            wp_send_json_error('Error de conexión con la API: ' . $response->get_error_message());
        }
        
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        
        if (!$data) {
            wp_send_json_error('Respuesta inválida de la API');
        }
        
        wp_send_json($data);
    }
    
    /**
     * AJAX: Buscar tarjetas
     */
    public function ajax_search_cards() {
        check_ajax_referer('nfc_access_nonce', 'nonce');
        
        $search = sanitize_text_field($_POST['search']);
        
        if (strlen($search) < 2) {
            wp_send_json_error('Término de búsqueda muy corto');
        }
        
        // Construir URL de la API
        $api_url = NFC_ACCESS_API_URL . '/cards/search?search=' . urlencode($search);
        
        // Realizar petición a la API
        $response = wp_remote_get($api_url, array(
            'timeout' => 30,
            'headers' => array(
                'Content-Type' => 'application/json'
            )
        ));
        
        if (is_wp_error($response)) {
            wp_send_json_error('Error de conexión con la API: ' . $response->get_error_message());
        }
        
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        
        if (!$data) {
            wp_send_json_error('Respuesta inválida de la API');
        }
        
        wp_send_json($data);
    }
}

// Inicializar el plugin
new NFC_Access_Plugin();

// Hook de activación
register_activation_hook(__FILE__, function() {
    // Verificar que las tablas existen
    global $wpdb;
    
    $tables_exist = true;
    
    // Verificar tabla de tarjetas
    $cards_table = $wpdb->get_var("SHOW TABLES LIKE 'condo360_nfc_cards'");
    if (!$cards_table) {
        $tables_exist = false;
    }
    
    // Verificar tabla de logs
    $logs_table = $wpdb->get_var("SHOW TABLES LIKE 'condo360_access_logs'");
    if (!$logs_table) {
        $tables_exist = false;
    }
    
    if (!$tables_exist) {
        deactivate_plugins(plugin_basename(__FILE__));
        wp_die(
            __('El plugin NFC Access requiere que las tablas de la base de datos estén creadas. Por favor, ejecute el script SQL proporcionado antes de activar el plugin.', 'nfc-access'),
            __('Error de Activación', 'nfc-access'),
            array('back_link' => true)
        );
    }
});

// Hook de desactivación
register_deactivation_hook(__FILE__, function() {
    // Limpiar opciones si es necesario
    delete_option('nfc_access_settings');
});

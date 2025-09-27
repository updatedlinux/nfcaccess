=== NFC Access - Sistema de Acceso Vehicular ===
Contributors: condo360
Tags: nfc, access, condominio, vehicular, tarjetas
Requires at least: 5.0
Tested up to: 6.4
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Sistema completo para gestión de acceso vehicular mediante tarjetas NFC MIFARE Classic.

== Description ==

El plugin NFC Access permite gestionar el acceso vehicular de un condominio mediante tarjetas NFC MIFARE Classic. Incluye shortcodes para propietarios y administradores, con diseño responsive compatible con el tema Astra.

= Características Principales =

* Gestión completa de tarjetas NFC MIFARE Classic
* Registro de eventos de ingreso y salida vehicular
* Integración con usuarios de WordPress
* Panel de administración para junta de condominio
* Historial de accesos para propietarios
* Diseño responsive compatible con tema Astra
* Zona horaria GMT-4 (Venezuela)
* Sin restricciones de acceso (registra todo)

= Shortcodes Disponibles =

**Para Propietarios:**
`[nfc_access_logs limit="50" show_stats="true"]`
- Muestra el historial de accesos del usuario actual
- Parámetros: limit (número de registros), show_stats (mostrar estadísticas)

**Para Administradores:**
`[nfc_admin_panel]`
- Panel completo de administración
- Búsqueda de tarjetas por usuario
- Resumen de accesos del día
- Visualización de historial de cualquier propietario

= Requisitos del Sistema =

* WordPress 5.0 o superior
* PHP 7.4 o superior
* MySQL 8.0.43 o superior
* Extensión cURL de PHP
* Backend API NFC Access funcionando
* Tema Astra (recomendado)

= Instalación =

1. Subir la carpeta del plugin a `/wp-content/plugins/`
2. Activar el plugin desde el panel de administración
3. Verificar que las tablas de base de datos estén creadas
4. Configurar la URL de la API en el código del plugin
5. Usar los shortcodes en páginas o posts

= Configuración =

El plugin se configura automáticamente, pero puedes verificar:

1. **Estado de la API**: Ir a Configuración > NFC Access
2. **Permisos**: Solo administradores pueden usar `[nfc_admin_panel]`
3. **Estilos**: Compatible con tema Astra por defecto

= Uso =

**Para Propietarios:**
1. Usar el shortcode `[nfc_access_logs]` en cualquier página
2. Filtrar fechas para buscar períodos específicos
3. Ver estadísticas mensuales de ingresos y salidas

**Para Administradores:**
1. Usar `[nfc_admin_panel]` para gestionar el sistema
2. Buscar tarjetas por nombre, email o login
3. Ver resumen de todos los accesos del día actual
4. Consultar historial de cualquier propietario

= Personalización =

El plugin incluye estilos CSS que se pueden personalizar:
- Variables CSS para colores y espaciado
- Compatible con temas oscuros
- Responsive design para móviles
- Animaciones y transiciones suaves

= Solución de Problemas =

**Plugin No Se Activa:**
- Verificar que las tablas existan en MySQL
- Verificar permisos de archivos
- Revisar logs de WordPress

**Estilos No Se Aplican:**
- Verificar que el tema Astra esté activo
- Limpiar caché del navegador
- Verificar que el CSS se esté cargando

**API No Responde:**
- Verificar que el backend esté funcionando
- Verificar configuración de URL de API
- Revisar logs del servidor

= Soporte =

Para soporte técnico:
- Email: soporte@condo360.com
- Documentación: Ver README.md del proyecto
- Issues: Usar el sistema de issues de GitHub

= Changelog =

= 1.0.0 =
* Versión inicial completa
* Shortcodes para propietarios y administradores
* Compatibilidad con tema Astra
* Diseño responsive
* Integración con backend API
* Sistema de logs completo

== Upgrade Notice ==

= 1.0.0 =
Versión inicial del plugin NFC Access. Instalar solo si el backend API está configurado y funcionando.

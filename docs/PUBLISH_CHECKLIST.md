# Lista de Verificación para Publicar en Chrome Web Store

## 1. Preparación de Archivos

- [ ] **Generar ZIP**: Ejecuta `npm run package`. El archivo se creará en `release/citador-la-catedra-v1.0.1.zip`.
- [ ] **Verificar Manifest**: Asegúrate de que `manifest.json` tenga la versión correcta (`1.0.1`) y descripción ≤132 caracteres.
- [ ] **Política de Privacidad**: Sube el archivo `PRIVACY_POLICY.md` a una URL pública (p. ej. GitHub Gist o GitHub Pages). Copia el enlace.

## 2. Crear Assets Visuales

Necesitas crear las siguientes imágenes y guardarlas en una carpeta `store-assets` (no se incluye en el ZIP):

- [ ] **Icono de la Tienda**: 128x128 px (PNG). Puedes usar `public/icons/icon128.png` pero asegúrate de que tenga padding (96px de contenido + 16px de margen transparente).
- [ ] **Captura de Pantalla 1**: 1280x800 px o 640x400 px (PNG/JPEG). Muestra la extensión abierta generando una cita.
- [ ] **Captura de Pantalla 2 (Opcional)**: Muestra la pestaña de "Editar".
- [ ] **Promo Tile Pequeño**: 440x280 px (PNG/JPEG). Imagen promocional con el logo y nombre.
- [ ] **Marquee (Opcional)**: 1400x560 px.

## 3. Subir al Dashboard

1. Ve a [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole).
2. Haz clic en **"Nuevo elemento"** (New Item).
3. Sube el archivo `release/citador-la-catedra-v1.0.1.zip`.

## 4. Completar Información de la Tienda

### Pestaña: Ficha de la tienda (Store Listing)
- **Descripción**: Copia la descripción corta del manifest.
- **Descripción detallada**:
  > Citador La Cátedra es una herramienta académica diseñada para estudiantes e investigadores. Permite generar citas bibliográficas en formato APA 7ma edición automáticamente desde cualquier página web.
  >
  > **Características principales:**
  > * Generación automática de citas APA 7ma edición.
  > * Detección inteligente de autores (personas y organizaciones).
  > * Edición manual de metadatos (título, fecha, nombre del sitio).
  > * Copiado rápido al portapapeles.
  > * Privacidad total: los datos se procesan localmente en su navegador.
- **Categoría**: Productividad / Herramientas de búsqueda (Search Tools) o Noticias y clima (News & Weather) -> Académico si existe.
- **Idioma**: Español.
- **Imágenes**: Sube el icono, capturas de pantalla y promo tile creados en el paso 2.

### Pestaña: Prácticas de privacidad (Privacy practices)
- **Propósito único**: "Generar citas bibliográficas en formato APA 7ma edición a partir de los metadatos de la página web activa."
- **Permisos**:
  - **activeTab**: "Necesario para leer el título y URL de la página actual al hacer clic en la extensión."
  - **scripting**: "Necesario para inyectar el script que busca metadatos (autores, fechas) en la página."
  - **storage**: "Necesario para guardar la preferencia del usuario sobre el formato de autor (Persona vs Organización)."
- **Uso de código remoto**: Selecciona **"No"**.
- **Datos recopilados**:
  - Marca **"Web History"** (Historial web) -> Solo si te obliga por `activeTab`, pero aclara que NO se guarda ni envía. Generalmente, si solo usas `activeTab` y no `tabs` permission general, puedes marcar que NO recopilas historial.
  - Marca **"User Activity"** -> No.
  - Si te pregunta por datos de usuario, marca que NO recopilas datos personales.
- **Certificación**: Marca las casillas de cumplimiento.
- **Política de Privacidad**: Pega el enlace a tu `PRIVACY_POLICY.md` (URL pública).

### Pestaña: Distribución (Distribution)
- **Visibilidad**: Pública.
- **Regiones**: Todas o selecciona países de habla hispana.

## 5. Enviar a Revisión
- Haz clic en **"Enviar a revisión"** (Submit for Review).
- La revisión puede tardar desde unas horas hasta varios días.

## 6. Actualizaciones Futuras
- Incrementa la versión en `manifest.json` y `package.json`.
- Ejecuta `npm run package`.
- Sube el nuevo ZIP al dashboard.

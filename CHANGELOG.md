# Changelog

Todos los cambios notables del proyecto se documentan en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).

---

## [Unreleased] - 2026-02-23

### Añadido

- **Soporte multi-formato de citas**: Se implementó la selección entre distintos estilos de cita (APA, Vancouver, etc.) en CitationGenerator y en la interfaz.
- **Componente AuthorToggle**: Nuevo componente para seleccionar el modo de autor (Persona vs Organización) integrado en la App.
- **Prop rightContent**: Añadido al CitationBlock y CiteView para mejorar el layout y la disposición del contenido.
- **Puntuación de fiabilidad (reliability score)**: Algoritmo en el extractor que evalúa la credibilidad de la fuente mediante análisis de URL, meta tags académicos (DOI, etc.), dominios editoriales y heurísticas del DOM.
- **Indicador visual de fiabilidad**: Indicador con colores (verde/amarillo/rojo) y tooltip en PageInfo para mostrar el nivel de confiabilidad de la fuente.
- **Razones del score de fiabilidad**: CiteView muestra las razones detalladas que justifican la puntuación de fiabilidad, facilitando la comprensión al usuario.
- **Reconocimiento de dominios académicos**: Lista ampliada de dominios académicos y editoriales para mejorar el análisis de URLs en el cálculo de fiabilidad.

### Cambiado

- **CitationBlock**: Aumentado el tamaño de fuente del texto de cita y del botón para mejor legibilidad.
- **CitationBlock**: Mejora del formateo HTML al copiar al portapapeles; estilos CSS actualizados para tipografía consistente y renderizado correcto de cursivas.
- **CitationBlock**: Refactor de layout y estilos; reemplazo de elementos `button` por wrappers `span` para mejor accesibilidad.
- **Selector de formato**: Interfaz de selección de formato actualizada para una mejor experiencia de usuario.
- **AuthorToggle**: Refactor del layout y estilos; reemplazo de elementos `button` por wrappers `span` para mejor accesibilidad y consistencia visual.
- **CiteView y CitationBlock**: Ajustes de layout y estilos para mayor consistencia con el nuevo AuthorToggle.
- **CiteView y PageInfo**: Mejora en la presentación y manejo del score de fiabilidad; CiteView ahora recibe y muestra la información de fiabilidad desde App.
- **Cálculo de fiabilidad**: Lógica refinada con razones detalladas, límites de puntuación académica y mensajes más claros para la evaluación de fuentes.

### Corregido

- **Formateo de autores en citas**: Ajuste en Apa7Strategy, UneIso690Strategy e Iso690Strategy para puntuación correcta de nombres de autores y evitar puntos dobles al final.

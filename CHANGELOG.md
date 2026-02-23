# Changelog

Todos los cambios notables del proyecto se documentan en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).

---

## [Unreleased] - 2026-02-23

### Añadido

- **Soporte multi-formato de citas**: Se implementó la selección entre distintos estilos de cita (APA, Vancouver, etc.) en CitationGenerator y en la interfaz.
- **Componente AuthorToggle**: Nuevo componente para seleccionar el modo de autor (Persona vs Organización) integrado en la App.
- **Prop rightContent**: Añadido al CitationBlock y CiteView para mejorar el layout y la disposición del contenido.

### Cambiado

- **CitationBlock**: Aumentado el tamaño de fuente del texto de cita y del botón para mejor legibilidad.
- **CitationBlock**: Mejora del formateo HTML al copiar al portapapeles; estilos CSS actualizados para tipografía consistente y renderizado correcto de cursivas.
- **Selector de formato**: Interfaz de selección de formato actualizada para una mejor experiencia de usuario.
- **AuthorToggle**: Refactor del layout y estilos; reemplazo de elementos `button` por wrappers `span` para mejor accesibilidad y consistencia visual.
- **CiteView y CitationBlock**: Ajustes de layout y estilos para mayor consistencia con el nuevo AuthorToggle.

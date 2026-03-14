# Propuesta 001: Refactorización Global de Código Limpio

## Intent
Aplicar las habilidades de "Clean Code" para mejorar la legibilidad, mantenibilidad y estructura general del código base, alineándose con los estándares de arquitectura hexagonal y DDD establecidos en el proyecto.

## Scope
- **Global:** Aplicar principios de Clean Code a todo el código fuente en `src/`.
- **Específico:**
    1.  Eliminar código duplicado (detección de componentes y contextos repetidos).
    2.  Asegurar nombres significativos y funciones pequeñas.
    3.  Mantener la separación de responsabilidades (Domain vs Infrastructure).
    4.  Revisar y corregir formatos y estructuras verticales.

## Approach
1.  **Análisis Estructural:** Identificar archivos duplicados y violaciones de arquitectura.
2.  **Aplicación de Principios:**
    -   **Meaningful Names:** Renombrar variables, funciones y clases ambiguas.
    -   **Functions:** Refactorizar funciones largas en unidades más pequeñas y puras.
    -   **Formatting:** Organizar imports, secciones y espaciado vertical.
    -   **Remoción de Duplicación:** Consolidar componentes y contextos duplicados.
3.  **Validación:** Ejecutar TypeScript y linters (si existen) para asegurar que los cambios no rompan el sistema.

## Affected Areas
- `src/components/auth/` (posible eliminación o consolidación)
- `src/modules/auth/` (reestructuración)
- `src/contexts/` (migración a módulos específicos)
- `src/infrastructure/repositories/` (revisión de nomenclatura)

## Risks
-   **Breaking Changes:** Mover archivos podría romper imports existentes. Se debe verificar cada cambio.
-   **Tiempo:** Revisar todo el código es una tarea extensa. Se priorizará el código crítico primero.

## Success Criteria
1.  Cero archivos duplicados (ej. LoginModal o AuthContext).
2.  Todas las funciones cumplen con el principio de una sola responsabilidad.
3.  Código fuente es legible y auto-documentado (sin comentarios redundantes).
4.  Pasa verificación de tipos de TypeScript.

# 🤖 AGENTS.md - Lumen Social Ecosystem

## 🎯 Role & Persona
Actúa como un **Staff Software Engineer** experto en el ecosistema TypeScript. Tu objetivo es construir "Lumen", una plataforma social de tracking de media (películas, series, videojuegos) escalable, con feedback instantáneo y arquitectura de alto nivel. Debes usar el preset Gentleman. Tienes acceso a herramientas avanzadas vía MCP (Engram para memoria a largo plazo y Context7 para indexación semántica). Es obligatorio consultar estas herramientas antes de realizar cambios estructurales."

## 🏗️ Architecture & Engineering Standards
- **Pattern:** Arquitectura Hexagonal (Ports & Adapters) + DDD.
  - No mezclar lógica de infraestructura (Supabase) con lógica de dominio.
- **State Management:** TanStack Query para caché asíncrona y sincronización de servidor.
- **Data Flow:** Implementar **Optimistic Updates** en todas las acciones de tracking (favoritos, vistos) para latencia cero percibida.
- **Code Quality:** Clean Code, SOLID y Type Safety estricto (no `any`).

## 🛠️ Tech Stack & Advanced Tooling
- **Frontend:** Next.js (App Router) + TypeScript + Tailwind + Shadcn/UI.
- **Backend:** Supabase (Auth, Postgres, Storage).
- **Compute:** Supabase Edge Functions para lógica pesada (cálculo de rankings y estadísticas globales).
- **External Data:** Integración vía **MCPs (Model Context Protocol)** con TMDB (Cine/TV) e IGDB (Juegos). 
  - *Regla:* No duplicar metadatos extensos en DB; persistir solo IDs de referencia y estados de usuario.
- **Automation & CI/CD:** GitHub Actions para la ejecución de flujos de trabajo automatizados.
- **Security Audit:** claude-code-security-review (GitHub Action oficial de Anthropic) para el análisis automático de vulnerabilidades (inyecciones SQL, secretos expuestos, etc.) en cada Pull Request.
- **Versioning:** release-please (de Google) para automatizar el versionado semántico y la creación de Release Notes profesionales tras cada merge en main.

## 📋 Project Scope & Features
1. **Media Tracking:** Status (Favorito, Visto, Pendiente) con visualización de horas consumidas.
2. **Social Graph:** Sistema de amigos, perfiles públicos/privados y visibilidad de listas.
3. **Gamification (Achievements):** Sistema de "Badges" basado en hitos (ej. "Cinéfilo de Platino").
4. **Rankings:** Top global de horas por categoría, procesado en servidor.
5. **Auth:** Supabase Auth (Email + Google OAuth).

## 🚦 Unified Workflow: The Lumen Proposal Pattern

1. **Proposal-First Development (PFD):** Antes de modificar código, esquemas de DB o lógica de negocio compleja, es **obligatorio** crear un nuevo documento en `docs/proposals/XXX-feature-name.md`.
    - **Formato:** Los archivos deben ser incrementales y numerados (ej. `002-auth-and-profiles.md`). 
    - **Inmutabilidad:** Prohibido sobrescribir o borrar propuestas anteriores; son el historial de decisiones del proyecto.
    - **Estructura Requerida:** Cada propuesta debe incluir obligatoriamente: *Intent, Scope, Approach, Affected Areas, Risks y Success Criteria*.

2. **Spec-Driven Implementation:** Una vez aprobada la propuesta, la implementación debe seguir fielmente el *Approach* definido. Cualquier desviación detectada durante el desarrollo debe reflejarse en una actualización de la propuesta o en una nueva.

3. **Feature Documentation:** Tras completar la implementación, se debe generar un archivo en `docs/features/` que actúe como manual técnico, explicando el "porqué" de las decisiones finales y cómo interactúa la feature con el resto del sistema.

4. **Skill Registry:** Las lógicas complejas, transformadores de datos (ej. mappers de tiempo) o validadores de seguridad deben registrarse como archivos `.md` en `.gentle-ai/skills/` para ser reutilizados por el agente.

5. **Atomic & Semantic Commits:** Uso estricto de **Conventional Commits** (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`) para asegurar un historial de Git legible y profesional.

6. **Safety-First Branching:** Está prohibido realizar push directo a la rama main. Todo cambio debe desarrollarse en una rama de característica (`feat/...`, `fix/...`).

7. **Quality Gate Local:** Antes de abrir un PR, el agente debe ejecutar obligatoriamente pnpm test localmente. Si el código generado afecta a lógica crítica (`Auth`, `Domain`, `Integración`) y no tiene tests, el agente debe proponer su creación antes de continuar.

8. **Pull Request (PR) Protocol:** Al abrir un PR hacia main, el agente debe esperar a que los GHub Actions confirmen que el Lint, el Build y los Tests están en verde.

9. **Automated Security Review:** En cada PR, el agente debe invocar la revisión de seguridad de Claude para validar que no se introduzcan riesgos sistémicos.

10. **Semantic Release Cycle:** Una vez fusionado el código en main, release-please generará un PR de release. El agente debe verificar que las notas de versión (Release Notes) generadas con IA reflejen el valor técnico y de negocio aportado.

## 🧠 Memory & Context
- Recuerda siempre consultar las interfaces de dominio en `src/modules/shared/domain` antes de implementar nuevos servicios para asegurar la consistencia de los tipos de datos de las estadísticas.

## 🛡️ Critical Constraints (Anti-Error)
- **Zero Pollution:** No logic from Supabase/External APIs can leak into `src/modules/shared/domain`.
- **Media Mapping:** Always map external API responses to our internal Domain Entities before they reach the UI.
- **Privacy First:** Every data fetch regarding social features must check the `is_public` flag at the Infrastructure level (RLS in Supabase).
- **Rollback Strategy:** Any failed Optimistic Update must restore the previous cache state immediately to ensure UI consistency.
- **No Test, No Merge:** El código generado por IA sin tests es deuda técnica inaceptable; ninguna funcionalidad crítica llega a producción sin validación automatizada.
- **Director del Proceso (HITL):** El agente es el ejecutor, pero el usuario es el director. El agente debe solicitar aprobación humana explícita antes de realizar despliegues o cambios en la infraestructura de Vercel.
- **Environment Parity:** Todo cambio debe validarse primero en el Preview Deployment generado por Vercel en el PR antes de considerarse listo para el merge final.

## 🧠 Knowledge & Skills (Agent Context)
- **Primary Source:** Carpeta `.gentle-ai/skills/`.
- **Memory Retrieval:** Antes de empezar, consulta **Engram** con: "What are the latest architectural decisions for Lumen?".
- **Code Intelligence:** Si el usuario pregunta por lógica dispersa, usa **Context7** para mapear el flujo de datos entre módulos.

  ## 🔌 MCP Tooling Usage
- **Context7:** Úsalo para `@search` y `@ask` sobre el código base cuando la búsqueda nativa de Cursor no sea suficiente para entender la lógica de negocio.
- **Engram:** Úsalo para persistir el "Contexto de Staff Engineer". Guarda aquí:
  - Decisiones sobre el esquema de base de datos.
  - Reglas de negocio críticas (ej. cómo se calculan exactamente las horas de juego).
- **Supabase MCP:** Úsalo para verificar esquemas de tablas y políticas RLS en tiempo real antes de proponer cambios en `Infrastructure`.
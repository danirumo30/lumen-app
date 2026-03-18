# 021 - Mobile Responsive Design

## Intent
Implementar diseño responsive completo para todas las vistas de la aplicación, corrigiendo problemas de accesibilidad y diseño en dispositivos móviles.

## Scope
- Header: Menú hamburguesa para móvil
- ProfileHeader: Adaptación completa del banner, avatar y botones
- LoginModal: Mejor UX en pantallas pequeñas
- MediaGrid: Grid responsivo para todos los dispositivos

## Approach
1. **Header:**
   - Agregar menú hamburguesa para móviles
   - Cambiar dropdown de hover a click/tap para touch devices
   - Mantener UX de escritorio sin cambios

2. **ProfileHeader:**
   - Reducir altura de banner en móvil (h-48 → h-32)
   - Reducir tamaño de avatar (w-28 → w-20)
   - Mover botones de acción debajo del nombre en móvil
   - Usar flex-wrap para ajustar layout

3. **LoginModal:**
   - Agregar scroll interno cuando sea necesario
   - Reducir padding en móvil
   - Mejorar tamaños de touch targets

4. **MediaGrid:**
   - 1 columna móvil, 2 tablet, 3-4 desktop

## Affected Areas
- `src/components/layout/Header.tsx`
- `src/components/profile/ProfileHeader.tsx`
- `src/components/profile/MediaGrid.tsx`
- `src/modules/auth/ui/components/LoginModal.tsx`

## Risks
- Cambios en Header pueden afectar UX de desktop
- Breaking changes en selectores existentes

## Success Criteria
- [ ] No hay overflow horizontal en ninguna vista
- [ ] Todos los botones son tocables (min 44px)
- [ ] Navegación accesible desde móvil
- [ ] Tests E2E de responsividad pasan

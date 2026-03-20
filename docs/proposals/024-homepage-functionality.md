# Proposal: 024 - Homepage Functionality Fixes

## Intent

Corregir problemas de UX en los carruseles de la homepage (scrollbars) y definir接下来的 funcionalidad adicional pendiente para mejorar la experiencia de usuario.

## Scope

### In Scope
- **Scrollbar Fix**: El thumb de color sobrepasa la flecha derecha de navegación — debe detenerse justo antes de la flecha
- **Scrollbar Interaction**: El área de arrastre empieza desde arriba del carrusel cuando debería empezar desde "justo encima" del thumb visible
- **Gap Visual**: Agregar espaciado correcto entre el área de scroll y la scrollbar para que no se vean pegados

### Out of Scope
- Nuevas features de tracking o sociales
- Refactor de componentes fuera de `Carousel.tsx`

## Approach

### Scrollbar Fixes

1. **Separación visual thumb-flecha**:
   - Agregar `mb-4` (o valor correcto) al container del scroll para crear gap con la scrollbar
   - Opcionalmente ajustar `pb-4` del scroll container para que el thumb respete el espacio

2. **Área de arrastre**:
   - Crear un div "track" invisible entre el scroll container y la scrollbar que capture los eventos de mouse
   - El track debe empezar desde donde termina el thumb visualmente
   - Calcular posición del mouse relativa al track para hacer scroll proporcional

3. **Thumb width/position limits**:
   - Limitar el `right` del thumb para que no sobrepase el límite visual
   - Calcular: `maxRight = 100% - (espacio para la flecha)`

### Alternativa Simple

Si el approach complejo no funciona bien:
- Mover la scrollbar 8-12px más abajo con `mt-4` o `mt-5`
- Esto ya separa visualmente el thumb de las flechas

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/components/home/Carousel.tsx` | Modified | Scrollbar positioning y interaction fix |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Scroll drag interaction feels laggy | Low | Usar CSS scroll-snap correctamente, no JS para cada pixel |
| Thumb se mueve fuera del track en ciertos tamaños | Medium | Testear con diferentes cantidades de items |

## Rollback Plan

```bash
git checkout HEAD~1 -- src/components/home/Carousel.tsx
```

## Dependencies

- Ninguna dependencia externa

## Success Criteria

- [ ] El thumb de la scrollbar NO sobrepasa visualmente la flecha de scroll right
- [ ] El área de click/drag de la scrollbar está delimitada correctamente
- [ ] El espaciado entre el carrusel y la scrollbar es consistente
- [ ] El hover effect de la scrollbar sigue funcionando

# ABM - Lineamientos de Diseño

## Grillas (DataTables)

### Componentes Recomendados
- **Vue 3**: `<DataTable>` personalizado o librerías como PrimeVue DataTable
- **Alternativas**: AG-Grid, Vue Good Table, Quasar Table

### Estructura Base
```vue
<template>
  <div class="data-table-container">
    <DataTable
      :value="items"
      :loading="loading"
      :paginator="true"
      :rows="10"
      :rowsPerPageOptions="[10, 25, 50]"
      sortMode="multiple"
      filterDisplay="menu"
      responsiveLayout="scroll"
    >
      <Column field="id" header="ID" sortable></Column>
      <Column field="nombre" header="Nombre" sortable></Column>
      <Column header="Acciones">
        <template #body="slotProps">
          <Button icon="pi pi-pencil" @click="editar(slotProps.data)" />
          <Button icon="pi pi-trash" @click="eliminar(slotProps.data)" />
        </template>
      </Column>
    </DataTable>
  </div>
</template>
```

### Lineamientos de Diseño

#### 1. Paginación
- **Obligatoria** para tablas con más de 25 registros
- Opciones: 10, 25, 50 registros por página
- Mostrar total de registros

#### 2. Filtros
- Filtro global (búsqueda general)
- Filtros por columna para campos principales
- Filtros de fecha con rangos
- Filtros de estado (activo/inactivo)

#### 3. Ordenamiento
- Permitir ordenamiento múltiple
- Indicadores visuales claros
- Ordenamiento por defecto en campos relevantes (fecha, ID)

#### 4. Acciones
- **Columna fija** a la derecha
- Iconos consistentes:
  - Editar: `pi-pencil`
  - Eliminar: `pi-trash`
  - Ver: `pi-eye`
  - Duplicar: `pi-copy`

#### 5. Responsive
- Scroll horizontal en móviles
- Ocultar columnas secundarias en pantallas pequeñas
- Priorizar columnas de identificación y acciones

---

## Formularios (Forms)

### Componentes Base
- **Validación**: Vee-Validate + Yup/Zod
- **UI**: PrimeVue InputText, Dropdown, Calendar, etc.
- **Layout**: CSS Grid o Flexbox

### Estructura Base
```vue
<template>
  <form @submit="onSubmit" class="form-container">
    <div class="form-grid">
      <div class="form-field">
        <label for="nombre">Nombre *</label>
        <InputText
          id="nombre"
          v-model="nombre"
          :class="{ 'p-invalid': errors.nombre }"
        />
        <small class="p-error">{{ errors.nombre }}</small>
      </div>
      
      <div class="form-field">
        <label for="email">Email *</label>
        <InputText
          id="email"
          v-model="email"
          type="email"
          :class="{ 'p-invalid': errors.email }"
        />
        <small class="p-error">{{ errors.email }}</small>
      </div>
    </div>
    
    <div class="form-actions">
      <Button type="button" label="Cancelar" class="p-button-secondary" />
      <Button type="submit" label="Guardar" :loading="loading" />
    </div>
  </form>
</template>
```

### Lineamientos de Diseño

#### 1. Layout y Estructura
- **Grid responsivo**: 2 columnas en desktop, 1 en móvil
- **Agrupación lógica**: Secciones con fieldsets
- **Espaciado consistente**: 16px entre campos, 24px entre secciones

#### 2. Campos de Entrada

##### Tipos de Input
- **Texto**: `InputText` para strings cortos
- **Textarea**: Para textos largos (descripción, comentarios)
- **Números**: `InputNumber` con validación numérica
- **Fechas**: `Calendar` con formato dd/mm/yyyy
- **Selección**: `Dropdown` para opciones predefinidas
- **Múltiple**: `MultiSelect` para selección múltiple
- **Booleanos**: `Checkbox` o `ToggleButton`

##### Validaciones Obligatorias
```javascript
// Esquema de validación con Yup
const schema = yup.object({
  nombre: yup.string().required('Nombre es obligatorio').min(2, 'Mínimo 2 caracteres'),
  email: yup.string().email('Email inválido').required('Email es obligatorio'),
  telefono: yup.string().matches(/^[0-9+\-\s]+$/, 'Formato de teléfono inválido'),
  precio: yup.number().positive('Debe ser un número positivo').required('Precio es obligatorio')
});
```

#### 3. Estados Visuales
- **Campo requerido**: Asterisco (*) en el label
- **Error**: Borde rojo + mensaje de error
- **Éxito**: Borde verde (opcional)
- **Deshabilitado**: Opacidad 0.6 + cursor not-allowed

#### 4. Botones de Acción
- **Posición**: Parte inferior derecha
- **Orden**: Cancelar (secundario) + Guardar (primario)
- **Estados**: Loading, disabled según validación
- **Confirmación**: Modal para acciones destructivas

#### 5. Mensajes y Feedback
- **Errores**: Inline bajo cada campo
- **Éxito**: Toast notification
- **Loading**: Spinner en botón + overlay opcional
- **Confirmaciones**: Modal con opciones claras

---

## Componentes Específicos por Módulo

### Productos
- **Imagen**: Upload con preview
- **Categoría**: Dropdown con búsqueda
- **Precio**: InputNumber con formato moneda
- **Stock**: InputNumber con validación mínima

### Pedidos/Pre-pedidos
- **Cliente**: AutoComplete con búsqueda
- **Productos**: DataTable editable inline
- **Fechas**: Calendar con restricciones
- **Estado**: Dropdown con colores

### Ofertas
- **Vigencia**: DateRange picker
- **Descuento**: InputNumber con porcentaje
- **Productos**: MultiSelect con filtros

---

## Estilos CSS Base

```css
/* Contenedores */
.form-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* Labels */
.form-field label {
  font-weight: 600;
  color: var(--text-color);
  font-size: 14px;
}

/* Acciones */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 24px;
  border-top: 1px solid var(--surface-border);
}

/* Responsive */
@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column-reverse;
  }
}
```

---

## Checklist de Implementación

### Grillas ✓
- [ ] Paginación configurada
- [ ] Filtros implementados
- [ ] Ordenamiento funcional
- [ ] Acciones con confirmación
- [ ] Responsive design
- [ ] Loading states

### Formularios ✓
- [ ] Validación client-side
- [ ] Mensajes de error claros
- [ ] Estados visuales correctos
- [ ] Botones con loading
- [ ] Responsive layout
- [ ] Accesibilidad (labels, ARIA)

### Performance ✓
- [ ] Lazy loading para tablas grandes
- [ ] Debounce en filtros
- [ ] Memoización de componentes
- [ ] Optimización de re-renders

---

## Librerías Recomendadas

```json
{
  "dependencies": {
    "primevue": "^3.x",
    "primeicons": "^6.x",
    "vee-validate": "^4.x",
    "yup": "^1.x",
    "@vueuse/core": "^10.x"
  }
}
```

Este documento debe ser la referencia principal para mantener consistencia en toda la aplicación.
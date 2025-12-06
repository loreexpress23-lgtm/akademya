# Akademya - Sistema de Gestión de Notas

Una aplicación móvil desarrollada con React Native y Expo para gestionar materias, evaluaciones y seguimiento académico.

## Características

### Gestión de Materias
- Crear materias con información completa:
  - Nombre de la materia
  - Nombre del profesor
  - Nota mínima para aprobar
  - Nota máxima
  - Color personalizado para identificación visual
- Editar materias existentes
- Visualización de nota actual y porcentaje acumulado

### Sistema de Evaluaciones
- Agregar evaluaciones para cada materia con:
  - Nombre de la evaluación
  - Fecha de realización
  - Porcentaje de la evaluación en la nota final
  - Calificación obtenida
- Editar y eliminar evaluaciones
- Cálculo automático de la nota actual basada en las evaluaciones registradas
- Visualización del porcentaje total evaluado

### Panel de Resumen
- Promedio general de todas las materias
- Contador de materias en riesgo
- Próximas evaluaciones

## Tecnologías Utilizadas

- React Native con Expo
- TypeScript
- Supabase (Base de datos y autenticación)
- Expo Router (Navegación)
- Lucide React Native (Iconos)

## Estructura de la Base de Datos

### Tabla: subjects
- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key)
- `name`: Nombre de la materia
- `professor`: Nombre del profesor
- `min_passing_grade`: Nota mínima para aprobar
- `max_grade`: Nota máxima
- `color`: Color de identificación
- `current_grade`: Nota actual calculada
- `accumulated_points`: Porcentaje total evaluado

### Tabla: evaluations
- `id`: UUID (Primary Key)
- `subject_id`: UUID (Foreign Key)
- `name`: Nombre de la evaluación
- `date`: Fecha de la evaluación
- `percentage`: Porcentaje en la nota final
- `score_obtained`: Calificación obtenida
- `max_points`: Nota máxima posible

## Cálculo de Notas

La nota actual de cada materia se calcula automáticamente con la siguiente fórmula:

```
nota_actual = (Σ(calificación_obtenida / nota_máxima) × porcentaje_evaluación) / porcentaje_total_evaluado × nota_máxima_materia
```

## Pantallas

1. **Resumen**: Vista general del rendimiento académico
2. **Materias**: Lista de todas las materias con opción de agregar/editar
3. **Evaluaciones**: Detalle de evaluaciones por materia
4. **Progreso**: Seguimiento del progreso académico
5. **Ajustes**: Configuración de la aplicación

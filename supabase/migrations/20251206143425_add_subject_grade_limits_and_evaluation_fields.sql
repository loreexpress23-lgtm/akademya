/*
  # Agregar límites de notas a materias y mejorar evaluaciones

  1. Cambios en la tabla `subjects`
    - Agregar `min_passing_grade` (nota mínima para aprobar)
    - Agregar `max_grade` (nota máxima posible)
  
  2. Cambios en la tabla `evaluations`
    - Agregar `percentage` (porcentaje de la evaluación en la nota final)
    - Agregar `score_obtained` (calificación obtenida por el estudiante)
    - Renombrar `grade` a `max_score` para claridad
    
  3. Notas importantes
    - Los valores por defecto permiten retrocompatibilidad
    - Se mantienen todas las políticas RLS existentes
*/

-- Agregar campos a la tabla subjects
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subjects' AND column_name = 'min_passing_grade'
  ) THEN
    ALTER TABLE subjects ADD COLUMN min_passing_grade numeric DEFAULT 10;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subjects' AND column_name = 'max_grade'
  ) THEN
    ALTER TABLE subjects ADD COLUMN max_grade numeric DEFAULT 20;
  END IF;
END $$;

-- Actualizar tabla evaluations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'evaluations' AND column_name = 'percentage'
  ) THEN
    ALTER TABLE evaluations ADD COLUMN percentage numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'evaluations' AND column_name = 'score_obtained'
  ) THEN
    ALTER TABLE evaluations ADD COLUMN score_obtained numeric DEFAULT 0;
  END IF;
END $$;
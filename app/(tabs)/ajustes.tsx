import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { supabase } from '@/lib/supabase';

export default function AjustesScreen() {
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState('');
  const [section, setSection] = useState('');
  const [periodName, setPeriodName] = useState('');
  const [evaluationPercentage, setEvaluationPercentage] = useState('');
  const [maxGrade, setMaxGrade] = useState('');
  const [minPassingGrade, setMinPassingGrade] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from('student_profile')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileData) {
        setStudentName(profileData.name);
        setSection(profileData.section);
      }

      const { data: periodData } = await supabase
        .from('academic_period')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (periodData) {
        setPeriodName(periodData.name);
      }

      const { data: settingsData } = await supabase
        .from('settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (settingsData) {
        setEvaluationPercentage(settingsData.evaluation_percentage.toString());
        setMaxGrade(settingsData.max_grade.toString());
        setMinPassingGrade(settingsData.min_passing_grade.toString());
      } else {
        setEvaluationPercentage('100');
        setMaxGrade('20');
        setMinPassingGrade('10');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: existingProfile } = await supabase
        .from('student_profile')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingProfile) {
        await supabase
          .from('student_profile')
          .update({
            name: studentName,
            section: section,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);
      } else {
        await supabase.from('student_profile').insert({
          user_id: user.id,
          name: studentName,
          section: section,
        });
      }

      const { data: existingPeriod } = await supabase
        .from('academic_period')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (existingPeriod) {
        await supabase
          .from('academic_period')
          .update({
            name: periodName,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingPeriod.id);
      } else {
        await supabase.from('academic_period').insert({
          user_id: user.id,
          name: periodName,
          is_active: true,
        });
      }

      const { data: existingSettings } = await supabase
        .from('settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      const settingsData = {
        evaluation_percentage: parseFloat(evaluationPercentage) || 100,
        max_grade: parseFloat(maxGrade) || 20,
        min_passing_grade: parseFloat(minPassingGrade) || 10,
        updated_at: new Date().toISOString(),
      };

      if (existingSettings) {
        await supabase
          .from('settings')
          .update(settingsData)
          .eq('user_id', user.id);
      } else {
        await supabase.from('settings').insert({
          ...settingsData,
          user_id: user.id,
        });
      }

      Alert.alert('Éxito', 'Configuración guardada correctamente');
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'No se pudo guardar la configuración');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>ajustes</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.description}>
            personaliza tus datos personales y valores por defecto
          </Text>
          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>perfil de estudiante</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>tu nombre</Text>
              <TextInput
                style={styles.input}
                value={studentName}
                onChangeText={setStudentName}
                placeholder="Ingresa tu nombre"
                placeholderTextColor="#94a3b8"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>seccion, curso</Text>
              <TextInput
                style={styles.input}
                value={section}
                onChangeText={setSection}
                placeholder="Ej: 5to año, Sección A"
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>periodo academico</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>nombre del periodo</Text>
              <TextInput
                style={styles.input}
                value={periodName}
                onChangeText={setPeriodName}
                placeholder="Ej: Primer Lapso"
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>valores predeterminados</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>porcentaje de evaluaciones</Text>
              <TextInput
                style={styles.input}
                value={evaluationPercentage}
                onChangeText={setEvaluationPercentage}
                placeholder="100"
                keyboardType="numeric"
                placeholderTextColor="#94a3b8"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>nota maxima de evaluaciones</Text>
              <TextInput
                style={styles.input}
                value={maxGrade}
                onChangeText={setMaxGrade}
                placeholder="20"
                keyboardType="numeric"
                placeholderTextColor="#94a3b8"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>nota minima para aprobar</Text>
              <TextInput
                style={styles.input}
                value={minPassingGrade}
                onChangeText={setMinPassingGrade}
                placeholder="10"
                keyboardType="numeric"
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Guardar Configuración</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e293b',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    backgroundColor: '#a855f7',
    marginHorizontal: 16,
    marginTop: 60,
    marginBottom: 20,
    paddingVertical: 20,
    borderRadius: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  content: {
    paddingHorizontal: 16,
  },
  description: {
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 12,
  },
  divider: {
    height: 2,
    backgroundColor: '#ffffff',
    marginBottom: 24,
  },
  section: {
    backgroundColor: '#e2e8f0',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#0f172a',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  saveButton: {
    backgroundColor: '#a855f7',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { Pencil, Plus, ChevronDown } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';

interface Subject {
  id: string;
  name: string;
  professor: string;
  accumulated_points: number;
  current_grade: number;
  color: string;
  min_passing_grade: number;
  max_grade: number;
}

const AVAILABLE_COLORS = [
  { name: 'Verde', value: '#22c55e' },
  { name: 'Azul', value: '#3b82f6' },
  { name: 'Morado', value: '#a855f7' },
  { name: 'Rosa', value: '#ec4899' },
  { name: 'Naranja', value: '#f97316' },
  { name: 'Amarillo', value: '#eab308' },
  { name: 'Rojo', value: '#ef4444' },
  { name: 'Cyan', value: '#06b6d4' },
];

export default function MateriasScreen() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentSubject, setCurrentSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    professor: '',
    min_passing_grade: '10',
    max_grade: '20',
    color: '#22c55e',
  });

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('subjects')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (data) {
        setSubjects(data);
      }
    } catch (error) {
      console.error('Error loading subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIndicatorColor = (grade: number, minPassing: number) => {
    if (grade >= minPassing + 3) return '#22c55e';
    if (grade >= minPassing) return '#eab308';
    return '#ef4444';
  };

  const openAddModal = () => {
    setEditMode(false);
    setCurrentSubject(null);
    setFormData({
      name: '',
      professor: '',
      min_passing_grade: '10',
      max_grade: '20',
      color: '#22c55e',
    });
    setModalVisible(true);
  };

  const openEditModal = (subject: Subject) => {
    setEditMode(true);
    setCurrentSubject(subject);
    setFormData({
      name: subject.name,
      professor: subject.professor,
      min_passing_grade: subject.min_passing_grade.toString(),
      max_grade: subject.max_grade.toString(),
      color: subject.color,
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'El nombre de la materia es requerido');
      return;
    }

    if (!formData.professor.trim()) {
      Alert.alert('Error', 'El nombre del profesor es requerido');
      return;
    }

    const minGrade = parseFloat(formData.min_passing_grade);
    const maxGrade = parseFloat(formData.max_grade);

    if (isNaN(minGrade) || isNaN(maxGrade)) {
      Alert.alert('Error', 'Las notas deben ser números válidos');
      return;
    }

    if (minGrade >= maxGrade) {
      Alert.alert('Error', 'La nota mínima debe ser menor que la nota máxima');
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: periodData } = await supabase
        .from('academic_period')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      let periodId = periodData?.id;

      if (!periodId) {
        const { data: newPeriod } = await supabase
          .from('academic_period')
          .insert({
            user_id: user.id,
            name: 'Primer Lapso',
            is_active: true,
          })
          .select()
          .single();
        periodId = newPeriod?.id;
      }

      const subjectData = {
        name: formData.name,
        professor: formData.professor,
        accumulated_points: 0,
        current_grade: 0,
        color: formData.color,
        min_passing_grade: minGrade,
        max_grade: maxGrade,
        user_id: user.id,
        period_id: periodId,
      };

      if (editMode && currentSubject) {
        await supabase
          .from('subjects')
          .update(subjectData)
          .eq('id', currentSubject.id);
      } else {
        await supabase.from('subjects').insert(subjectData);
      }

      setModalVisible(false);
      loadSubjects();
    } catch (error) {
      console.error('Error saving subject:', error);
      Alert.alert('Error', 'No se pudo guardar la materia');
    }
  };

  const navigateToEvaluations = (subject: Subject) => {
    router.push({
      pathname: '/evaluations',
      params: {
        subjectId: subject.id,
        subjectName: subject.name,
        subjectColor: subject.color,
        minGrade: subject.min_passing_grade.toString(),
        maxGrade: subject.max_grade.toString(),
      },
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>materias</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.description}>
            gestiona tus materias y sus notas especificas
          </Text>
          <View style={styles.divider} />

          <View style={styles.filterRow}>
            <TouchableOpacity style={styles.filterButton}>
              <Text style={styles.filterText}>todas las materias</Text>
              <ChevronDown size={20} color="#0f172a" strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addButton}
              onPress={openAddModal}>
              <Plus size={24} color="#0f172a" strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <View style={styles.subjectsList}>
            {subjects.map((subject) => (
              <View
                key={subject.id}
                style={[
                  styles.subjectCard,
                  { borderColor: subject.color, borderWidth: 3 },
                ]}>
                <View style={styles.subjectHeader}>
                  <Text style={styles.subjectName}>{subject.name}</Text>
                  <TouchableOpacity
                    onPress={() => openEditModal(subject)}
                    style={styles.editButton}>
                    <Pencil size={20} color="#0f172a" strokeWidth={2} />
                  </TouchableOpacity>
                </View>
                <View style={styles.subjectInfo}>
                  <View style={styles.subjectDetails}>
                    <Text style={styles.professorLabel}>profesor</Text>
                    <Text style={styles.professorName}>
                      {subject.professor || 'Sin asignar'}
                    </Text>
                    <Text style={styles.pointsLabel}>
                      nota para aprobar: {subject.min_passing_grade.toFixed(1)}
                    </Text>
                    <Text style={styles.pointsLabel}>
                      nota máxima: {subject.max_grade.toFixed(1)}
                    </Text>
                  </View>
                  <View style={styles.gradeCircle}>
                    <Text style={styles.gradeValue}>
                      {subject.current_grade.toFixed(1)}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.evaluationsButton}
                  onPress={() => navigateToEvaluations(subject)}>
                  <Text style={styles.evaluationsText}>evaluaciones</Text>
                  <View
                    style={[
                      styles.statusIndicator,
                      {
                        backgroundColor: getIndicatorColor(
                          subject.current_grade,
                          subject.min_passing_grade
                        ),
                      },
                    ]}
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {editMode ? 'Editar Materia' : 'Nueva Materia'}
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Nombre de la materia"
                placeholderTextColor="#64748b"
                value={formData.name}
                onChangeText={(text) =>
                  setFormData({ ...formData, name: text })
                }
              />

              <TextInput
                style={styles.input}
                placeholder="Nombre del profesor"
                placeholderTextColor="#64748b"
                value={formData.professor}
                onChangeText={(text) =>
                  setFormData({ ...formData, professor: text })
                }
              />

              <TextInput
                style={styles.input}
                placeholder="Nota mínima para aprobar"
                placeholderTextColor="#64748b"
                keyboardType="numeric"
                value={formData.min_passing_grade}
                onChangeText={(text) =>
                  setFormData({ ...formData, min_passing_grade: text })
                }
              />

              <TextInput
                style={styles.input}
                placeholder="Nota máxima"
                placeholderTextColor="#64748b"
                keyboardType="numeric"
                value={formData.max_grade}
                onChangeText={(text) =>
                  setFormData({ ...formData, max_grade: text })
                }
              />

              <Text style={styles.colorLabel}>Color de la materia</Text>
              <View style={styles.colorGrid}>
                {AVAILABLE_COLORS.map((color) => (
                  <TouchableOpacity
                    key={color.value}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color.value },
                      formData.color === color.value &&
                        styles.selectedColor,
                    ]}
                    onPress={() =>
                      setFormData({ ...formData, color: color.value })
                    }>
                    {formData.color === color.value && (
                      <View style={styles.checkMark} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleSave}>
                  <Text style={styles.saveButtonText}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
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
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  filterButton: {
    flex: 1,
    backgroundColor: '#e2e8f0',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  filterText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  addButton: {
    backgroundColor: '#e2e8f0',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subjectsList: {
    gap: 16,
  },
  subjectCard: {
    backgroundColor: '#bfdbfe',
    borderRadius: 20,
    padding: 16,
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subjectName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    flex: 1,
  },
  editButton: {
    padding: 4,
  },
  subjectInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subjectDetails: {
    flex: 1,
  },
  professorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  professorName: {
    fontSize: 16,
    color: '#0f172a',
    marginBottom: 4,
  },
  pointsLabel: {
    fontSize: 14,
    color: '#0f172a',
  },
  gradeCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#ffffff',
    borderWidth: 3,
    borderColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradeValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  evaluationsButton: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  evaluationsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  statusIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: '#e2e8f0',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#0f172a',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  colorLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 12,
    marginTop: 8,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  colorOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedColor: {
    borderWidth: 4,
    borderColor: '#0f172a',
  },
  checkMark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#64748b',
  },
  saveButton: {
    backgroundColor: '#a855f7',
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

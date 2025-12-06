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
import { ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useRouter, useLocalSearchParams } from 'expo-router';

interface Evaluation {
  id: string;
  name: string;
  date: string;
  percentage: number;
  score_obtained: number;
  max_points: number;
}

export default function EvaluationsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const subjectId = params.subjectId as string;
  const subjectName = params.subjectName as string;
  const subjectColor = params.subjectColor as string;
  const minGrade = parseFloat(params.minGrade as string);
  const maxGrade = parseFloat(params.maxGrade as string);

  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentEvaluation, setCurrentEvaluation] = useState<Evaluation | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    percentage: '',
    score_obtained: '',
  });

  useEffect(() => {
    loadEvaluations();
  }, []);

  const loadEvaluations = async () => {
    try {
      const { data } = await supabase
        .from('evaluations')
        .select('*')
        .eq('subject_id', subjectId)
        .order('date', { ascending: true });

      if (data) {
        setEvaluations(data);
        updateSubjectGrade(data);
      }
    } catch (error) {
      console.error('Error loading evaluations:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSubjectGrade = async (evals: Evaluation[]) => {
    const totalPercentage = evals.reduce((sum, e) => sum + e.percentage, 0);
    const weightedScore = evals.reduce(
      (sum, e) => sum + (e.score_obtained / e.max_points) * e.percentage,
      0
    );

    const currentGrade = totalPercentage > 0 ? (weightedScore / totalPercentage) * maxGrade : 0;

    await supabase
      .from('subjects')
      .update({
        current_grade: currentGrade,
        accumulated_points: totalPercentage,
      })
      .eq('id', subjectId);
  };

  const openAddModal = () => {
    setEditMode(false);
    setCurrentEvaluation(null);
    setFormData({
      name: '',
      date: new Date().toISOString().split('T')[0],
      percentage: '',
      score_obtained: '',
    });
    setModalVisible(true);
  };

  const openEditModal = (evaluation: Evaluation) => {
    setEditMode(true);
    setCurrentEvaluation(evaluation);
    setFormData({
      name: evaluation.name,
      date: evaluation.date,
      percentage: evaluation.percentage.toString(),
      score_obtained: evaluation.score_obtained.toString(),
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'El nombre de la evaluación es requerido');
      return;
    }

    if (!formData.date.trim()) {
      Alert.alert('Error', 'La fecha es requerida');
      return;
    }

    const percentage = parseFloat(formData.percentage);
    const scoreObtained = parseFloat(formData.score_obtained);

    if (isNaN(percentage) || percentage <= 0 || percentage > 100) {
      Alert.alert('Error', 'El porcentaje debe estar entre 0 y 100');
      return;
    }

    if (isNaN(scoreObtained) || scoreObtained < 0 || scoreObtained > maxGrade) {
      Alert.alert('Error', `La nota debe estar entre 0 y ${maxGrade}`);
      return;
    }

    try {
      const evaluationData = {
        subject_id: subjectId,
        name: formData.name,
        date: formData.date,
        percentage,
        score_obtained: scoreObtained,
        max_points: maxGrade,
      };

      if (editMode && currentEvaluation) {
        await supabase
          .from('evaluations')
          .update(evaluationData)
          .eq('id', currentEvaluation.id);
      } else {
        await supabase.from('evaluations').insert(evaluationData);
      }

      setModalVisible(false);
      loadEvaluations();
    } catch (error) {
      console.error('Error saving evaluation:', error);
      Alert.alert('Error', 'No se pudo guardar la evaluación');
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Eliminar evaluación',
      '¿Estás seguro de que quieres eliminar esta evaluación?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.from('evaluations').delete().eq('id', id);
              loadEvaluations();
            } catch (error) {
              console.error('Error deleting evaluation:', error);
              Alert.alert('Error', 'No se pudo eliminar la evaluación');
            }
          },
        },
      ]
    );
  };

  const totalPercentage = evaluations.reduce((sum, e) => sum + e.percentage, 0);
  const currentGrade = evaluations.reduce(
    (sum, e) => sum + (e.score_obtained / e.max_points) * e.percentage,
    0
  );
  const finalGrade = totalPercentage > 0 ? (currentGrade / totalPercentage) * maxGrade : 0;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}>
        <View style={[styles.header, { backgroundColor: subjectColor }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}>
            <ArrowLeft size={24} color="#ffffff" strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{subjectName}</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.description}>
            plan de evaluación y seguimiento de notas
          </Text>
          <View style={styles.divider} />

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Porcentaje evaluado:</Text>
              <Text style={styles.summaryValue}>{totalPercentage.toFixed(1)}%</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Nota actual:</Text>
              <Text style={styles.summaryValue}>{finalGrade.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Nota para aprobar:</Text>
              <Text style={styles.summaryValue}>{minGrade.toFixed(1)}</Text>
            </View>
          </View>

          <View style={styles.addButtonContainer}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={openAddModal}>
              <Plus size={20} color="#ffffff" strokeWidth={2} />
              <Text style={styles.addButtonText}>Agregar Evaluación</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.evaluationsList}>
            {evaluations.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  No hay evaluaciones registradas
                </Text>
                <Text style={styles.emptyStateSubtext}>
                  Agrega tu primera evaluación para empezar a hacer seguimiento
                </Text>
              </View>
            ) : (
              evaluations.map((evaluation) => {
                const scorePercentage = (evaluation.score_obtained / evaluation.max_points) * 100;
                return (
                  <View
                    key={evaluation.id}
                    style={[styles.evaluationCard, { borderColor: subjectColor }]}>
                    <View style={styles.evaluationHeader}>
                      <View style={styles.evaluationInfo}>
                        <Text style={styles.evaluationName}>{evaluation.name}</Text>
                        <Text style={styles.evaluationDate}>
                          {new Date(evaluation.date).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </Text>
                      </View>
                      <View style={styles.evaluationActions}>
                        <TouchableOpacity
                          onPress={() => openEditModal(evaluation)}
                          style={styles.actionButton}>
                          <Pencil size={18} color="#0f172a" strokeWidth={2} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDelete(evaluation.id)}
                          style={styles.actionButton}>
                          <Trash2 size={18} color="#ef4444" strokeWidth={2} />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={styles.evaluationDetails}>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Porcentaje:</Text>
                        <Text style={styles.detailValue}>{evaluation.percentage}%</Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Nota obtenida:</Text>
                        <Text style={styles.detailValue}>
                          {evaluation.score_obtained.toFixed(2)} / {evaluation.max_points}
                        </Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Rendimiento:</Text>
                        <Text
                          style={[
                            styles.detailValue,
                            {
                              color:
                                scorePercentage >= 70
                                  ? '#22c55e'
                                  : scorePercentage >= 50
                                  ? '#eab308'
                                  : '#ef4444',
                            },
                          ]}>
                          {scorePercentage.toFixed(1)}%
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editMode ? 'Editar Evaluación' : 'Nueva Evaluación'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Nombre de la evaluación"
              placeholderTextColor="#64748b"
              value={formData.name}
              onChangeText={(text) =>
                setFormData({ ...formData, name: text })
              }
            />

            <TextInput
              style={styles.input}
              placeholder="Fecha (YYYY-MM-DD)"
              placeholderTextColor="#64748b"
              value={formData.date}
              onChangeText={(text) =>
                setFormData({ ...formData, date: text })
              }
            />

            <TextInput
              style={styles.input}
              placeholder="Porcentaje de la evaluación (0-100)"
              placeholderTextColor="#64748b"
              keyboardType="numeric"
              value={formData.percentage}
              onChangeText={(text) =>
                setFormData({ ...formData, percentage: text })
              }
            />

            <TextInput
              style={styles.input}
              placeholder={`Nota obtenida (0-${maxGrade})`}
              placeholderTextColor="#64748b"
              keyboardType="numeric"
              value={formData.score_obtained}
              onChangeText={(text) =>
                setFormData({ ...formData, score_obtained: text })
              }
            />

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
    marginHorizontal: 16,
    marginTop: 60,
    marginBottom: 20,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
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
  summaryCard: {
    backgroundColor: '#e2e8f0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 16,
    color: '#0f172a',
    fontWeight: 'bold',
  },
  addButtonContainer: {
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: '#a855f7',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  evaluationsList: {
    gap: 16,
  },
  emptyState: {
    backgroundColor: '#e2e8f0',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  evaluationCard: {
    backgroundColor: '#bfdbfe',
    borderRadius: 16,
    padding: 16,
    borderWidth: 3,
  },
  evaluationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  evaluationInfo: {
    flex: 1,
  },
  evaluationName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  evaluationDate: {
    fontSize: 14,
    color: '#64748b',
  },
  evaluationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  evaluationDetails: {
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#e2e8f0',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
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

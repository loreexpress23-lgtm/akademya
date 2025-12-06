import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { AlertTriangle, Calendar, ChevronDown } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

interface Subject {
  id: string;
  name: string;
  current_grade: number;
  color: string;
  accumulated_points: number;
}

interface Evaluation {
  id: string;
  name: string;
  date: string;
  subject_id: string;
}

export default function ResumenScreen() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [period, setPeriod] = useState<string>('Primer Lapso');
  const [minPassingGrade, setMinPassingGrade] = useState<number>(10);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
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

      if (periodData) {
        setPeriod(periodData.name);
      }

      const { data: settingsData } = await supabase
        .from('settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (settingsData) {
        setMinPassingGrade(settingsData.min_passing_grade);
      }

      const { data: subjectsData } = await supabase
        .from('subjects')
        .select('*')
        .eq('user_id', user.id);

      if (subjectsData) {
        setSubjects(subjectsData);
      }

      const { data: evaluationsData } = await supabase
        .from('evaluations')
        .select('*, subjects!inner(user_id)')
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (evaluationsData) {
        setEvaluations(evaluationsData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateGeneralAverage = () => {
    if (subjects.length === 0) return 0;
    const sum = subjects.reduce(
      (acc, subject) => acc + subject.current_grade,
      0
    );
    return (sum / subjects.length).toFixed(1);
  };

  const getSubjectsAtRisk = () => {
    return subjects.filter((subject) => subject.current_grade < minPassingGrade)
      .length;
  };

  const getUpcomingEvaluations = () => {
    return evaluations.length;
  };

  const generalAverage = calculateGeneralAverage();
  const subjectsAtRisk = getSubjectsAtRisk();
  const upcomingEvaluations = getUpcomingEvaluations();
  const accumulatedPoints = subjects.reduce(
    (acc, subject) => acc + subject.accumulated_points,
    0
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Resumen de notas</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.periodLabel}>periodo: {period}</Text>
          <View style={styles.divider} />

          <View style={styles.averageCard}>
            <View style={styles.averageContent}>
              <View>
                <Text style={styles.averageLabel}>promedio general</Text>
                <Text style={styles.pointsLabel}>
                  puntos acumulados {accumulatedPoints.toFixed(1)}
                </Text>
              </View>
              <View style={styles.averageCircle}>
                <Text style={styles.averageValue}>{generalAverage}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.riskCard}>
            <View style={styles.cardContent}>
              <Text style={styles.cardLabel}>materias en riesgo</Text>
              <View style={styles.cardRight}>
                <Text style={styles.cardValue}>{subjectsAtRisk}</Text>
                <AlertTriangle size={24} color="#0f172a" strokeWidth={2} />
                <ChevronDown size={20} color="#0f172a" strokeWidth={2} />
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.evaluationsCard}>
            <View style={styles.cardContent}>
              <Text style={styles.cardLabel}>proximas evaluaciones</Text>
              <View style={styles.cardRight}>
                <Text style={styles.cardValue}>{upcomingEvaluations}</Text>
                <Calendar size={24} color="#0f172a" strokeWidth={2} />
                <ChevronDown size={20} color="#0f172a" strokeWidth={2} />
              </View>
            </View>
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
  periodLabel: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: 8,
  },
  divider: {
    height: 2,
    backgroundColor: '#ffffff',
    marginBottom: 24,
  },
  averageCard: {
    backgroundColor: '#bfdbfe',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  averageContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  averageLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  pointsLabel: {
    fontSize: 14,
    color: '#0f172a',
  },
  averageCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ffffff',
    borderWidth: 3,
    borderColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  averageValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  riskCard: {
    backgroundColor: '#bfdbfe',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  evaluationsCard: {
    backgroundColor: '#bfdbfe',
    borderRadius: 16,
    padding: 20,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    flex: 1,
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
  },
});

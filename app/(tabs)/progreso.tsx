import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { supabase } from '@/lib/supabase';

interface Subject {
  id: string;
  name: string;
  current_grade: number;
  accumulated_points: number;
  color: string;
}

export default function ProgresoScreen() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [maxGrade, setMaxGrade] = useState<number>(20);
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

      const { data: settingsData } = await supabase
        .from('settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (settingsData) {
        setMaxGrade(settingsData.max_grade);
      }

      const { data: subjectsData } = await supabase
        .from('subjects')
        .select('*')
        .eq('user_id', user.id)
        .order('current_grade', { ascending: false });

      if (subjectsData) {
        setSubjects(subjectsData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBarHeight = (grade: number) => {
    return (grade / maxGrade) * 200;
  };

  const getProgressWidth = (points: number) => {
    return (points / maxGrade) * 100;
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>progreso</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.description}>
            compara tu rendimiento entre cada materia y observa tu promedio
            actual
          </Text>
          <View style={styles.divider} />

          <View style={styles.chartCard}>
            <Text style={styles.cardTitle}>promedio por cada materia</Text>
            <View style={styles.chartContainer}>
              <View style={styles.barsContainer}>
                {subjects.map((subject) => (
                  <View key={subject.id} style={styles.barWrapper}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: getBarHeight(subject.current_grade),
                          backgroundColor: subject.color,
                        },
                      ]}>
                      <Text style={styles.barValue}>
                        {subject.current_grade.toFixed(1)}
                      </Text>
                    </View>
                    <Text style={styles.barLabel} numberOfLines={1}>
                      {subject.name}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.pointsCard}>
            <Text style={styles.cardTitle}>puntos acumulados</Text>
            <View style={styles.progressContainer}>
              {subjects.map((subject) => (
                <View key={subject.id} style={styles.progressRow}>
                  <View style={styles.progressBarBg}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${getProgressWidth(subject.accumulated_points)}%`,
                          backgroundColor: subject.color,
                        },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>
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
    lineHeight: 20,
  },
  divider: {
    height: 2,
    backgroundColor: '#ffffff',
    marginBottom: 24,
  },
  chartCard: {
    backgroundColor: '#e2e8f0',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 20,
  },
  chartContainer: {
    height: 280,
    justifyContent: 'flex-end',
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 250,
  },
  barWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
    marginHorizontal: 4,
  },
  bar: {
    width: '100%',
    maxWidth: 60,
    borderRadius: 12,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 8,
    minHeight: 40,
  },
  barValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  barLabel: {
    fontSize: 10,
    color: '#0f172a',
    marginTop: 8,
    textAlign: 'center',
    width: '100%',
  },
  pointsCard: {
    backgroundColor: '#e2e8f0',
    borderRadius: 20,
    padding: 20,
  },
  progressContainer: {
    gap: 12,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarBg: {
    flex: 1,
    height: 32,
    backgroundColor: '#cbd5e1',
    borderRadius: 16,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 16,
  },
});

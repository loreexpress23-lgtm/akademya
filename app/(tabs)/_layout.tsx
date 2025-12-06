import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { LayoutGrid, TrendingUp, BookOpen, Settings } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#a855f7',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabBarLabel,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'resumen',
          tabBarIcon: ({ size, color }) => (
            <View style={styles.iconContainer}>
              <LayoutGrid size={size} color={color} strokeWidth={2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="progreso"
        options={{
          title: 'progreso',
          tabBarIcon: ({ size, color }) => (
            <View style={styles.iconContainer}>
              <TrendingUp size={size} color={color} strokeWidth={2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="materias"
        options={{
          title: 'materias',
          tabBarIcon: ({ size, color }) => (
            <View style={styles.iconContainer}>
              <BookOpen size={size} color={color} strokeWidth={2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="ajustes"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ size, color }) => (
            <View style={styles.iconContainer}>
              <Settings size={size} color={color} strokeWidth={2} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#0f172a',
    borderTopWidth: 0,
    paddingTop: 8,
    paddingBottom: 8,
    height: 70,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

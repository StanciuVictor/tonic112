import { useQuery } from '@tanstack/react-query';
import { StyleSheet, Text, View } from 'react-native';
import { fetchHealth } from '../lib/health-client';

export default function HealthScreen() {
  const { data, error, isPending } = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>112 & Tonic</Text>
      {isPending && <Text>Checking API connection…</Text>}
      {error && <Text style={styles.error}>{error.message}</Text>}
      {data && (
        <View>
          <Text>API status: {data.status}</Text>
          <Text>Checked at: {data.timestamp}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
  error: {
    color: '#dc2626',
  },
});

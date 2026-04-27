import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { useRouter } from 'expo-router';
import api from '../../src/api';
import { Ionicons } from '@expo/vector-icons';

interface Event {
  id: number;
  title: string;
  price: number;
  event_type: string;
  mode: string;
  start_time: string;
  category: string;
}

export default function ExploreScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchEvents = async () => {
    try {
      const response = await api.get('/events');
      setEvents(response.data);
    } catch (err) {
      console.error('Failed to fetch events:', err);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Curated Experiences</Text>
        <Text style={styles.headerSubtitle}>Discover small-group social events.</Text>
      </View>

      <View style={styles.feed}>
        {events.map((event) => (
          <TouchableOpacity 
            key={event.id} 
            style={styles.card}
            activeOpacity={0.9}
            onPress={() => router.push(`/listing/${event.id}`)}
          >
            {/* Visual Header / Placeholder */}
            <View style={styles.cardVisual}>
              <View style={styles.badgeWrapper}>
                <Text style={styles.badgeText}>{event.event_type}</Text>
              </View>
              <View style={[styles.badgeWrapper, { marginLeft: 8 }]}>
                 <Text style={styles.badgeText}>{event.mode}</Text>
              </View>
            </View>

            <View style={styles.cardBody}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <View style={styles.cardRow}>
                <Ionicons name="time-outline" size={16} color="#666" />
                <Text style={styles.dateText}>
                  {new Date(event.start_time).toLocaleString()}
                </Text>
              </View>
              
              <View style={[styles.cardRow, { justifyContent: 'space-between', marginTop: 12 }]}>
                <Text style={styles.priceText}>${event.price.toFixed(2)}</Text>
                <TouchableOpacity style={styles.cardButton} onPress={() => router.push(`/listing/${event.id}`)}>
                  <Text style={styles.cardButtonText}>View Details</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {events.length === 0 && (
          <Text style={{ textAlign: 'center', marginTop: 40, color: '#A0A0A0' }}>
            No events found. Pull to refresh.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  feed: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  cardVisual: {
    height: 140,
    backgroundColor: '#E5E7EB', // Placeholder gray
    flexDirection: 'row',
    padding: 16,
    alignItems: 'flex-end',
  },
  badgeWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  cardBody: {
    padding: 20,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
  },
  priceText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4E46E5', // Primary brand
  },
  cardButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  cardButtonText: {
    fontWeight: '600',
    color: '#1A1A1A',
  }
});

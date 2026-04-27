import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, SafeAreaView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../src/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ListingDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [existingBookingId, setExistingBookingId] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch Event details
        const eventsRes = await api.get('/events');
        const found = eventsRes.data.find((e: any) => e.id.toString() === id);
        
        if (!found) {
            Alert.alert("Error", "Event not found");
            router.back();
            return;
        }
        setEvent(found);

        // 2. Fetch User Bookings to evaluate CTA Button context securely
        const token = await AsyncStorage.getItem('user_token');
        if (token && found) {
          try {
            const bookingsRes = await api.get('/users/me/bookings');
            const existing = bookingsRes.data.find((b: any) => b.event_id === found.id);
            if (existing) {
              setExistingBookingId(existing.id);
            }
          } catch (bErr) { 
              // Ignore 401s if the user just isn't logged in yet
          } 
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading || !event) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#4E46E5" />
      </View>
    );
  }

  // Handle CTA Click safely
  const handleCTA = () => {
      if (existingBookingId) {
          // Send to ticket view (MVP stub)
          Alert.alert("Development MVP", `Navigating to specific Booking ID: ${existingBookingId}`);
          // router.push(`/my-bookings/${existingBookingId}`);
      } else {
          router.push(`/listing/book/${event.id}`);
      }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* Placeholder Graphic Header */}
        <View style={styles.heroImageContainer}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
            </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{event.title}</Text>
          
          <View style={styles.tagRow}>
            <View style={styles.badge}><Text style={styles.badgeText}>{event.event_type}</Text></View>
            <View style={styles.badge}><Text style={styles.badgeText}>{event.mode}</Text></View>
            <View style={[styles.badge, { backgroundColor: '#F3E8FF' }]}><Text style={[styles.badgeText, { color: '#7E22CE' }]}>{event.category}</Text></View>
          </View>

          <View style={styles.detailBox}>
              <View style={styles.detailRow}>
                  <Ionicons name="calendar-outline" size={20} color="#4E46E5" />
                  <Text style={styles.detailText}>{new Date(event.start_time).toLocaleString()}</Text>
              </View>
              <View style={styles.detailRow}>
                  <Ionicons name="time-outline" size={20} color="#4E46E5" />
                  <Text style={styles.detailText}>{event.duration_minutes} minutes</Text>
              </View>
          </View>

          <Text style={styles.sectionTitle}>About this Session</Text>
          <Text style={styles.descriptionText}>
            {event.description}
          </Text>

          <Text style={styles.sectionTitle}>About the Host</Text>
          <View style={styles.hostBox}>
             <View style={styles.hostAvatar}><Ionicons name="person" size={24} color="#A0A0A0" /></View>
             <View>
                 <Text style={styles.hostName}>Host Profile Placeholder</Text>
                 <Text style={styles.hostSubtitle}>Expert in {event.category}</Text>
             </View>
          </View>
          
        </View>
      </ScrollView>

      {/* Floating Action Checkout Bar */}
      <View style={styles.bottomBar}>
          <View>
              <Text style={styles.priceLabel}>Total Price</Text>
              <Text style={styles.priceValue}>${event.price.toFixed(2)}</Text>
          </View>
          
          <TouchableOpacity 
              style={[styles.checkoutBtn, existingBookingId && { backgroundColor: '#E5E7EB' }]}
              onPress={handleCTA}
          >
              <Text style={[styles.checkoutBtnText, existingBookingId && { color: '#1A1A1A' }]}>
                  {existingBookingId ? 'See My Booking' : 'Book Now'}
              </Text>
          </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  heroImageContainer: {
    height: 250,
    backgroundColor: '#E5E7EB',
    justifyContent: 'flex-start',
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  badge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  detailBox: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: 32,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailText: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#4B5563',
    marginBottom: 32,
  },
  hostBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#FAFAFA',
    padding: 16,
    borderRadius: 12,
  },
  hostAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hostName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  hostSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  priceValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  checkoutBtn: {
    backgroundColor: '#4E46E5', // Primary
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  checkoutBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  }
});

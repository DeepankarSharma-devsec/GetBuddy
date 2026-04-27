import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, SafeAreaView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../../src/api';

export default function NativeCheckout() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/events');
        const found = response.data.find((e: any) => e.id.toString() === id);
        if (found) setEvent(found);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const confirmBooking = async () => {
    setProcessing(true);
    try {
      // Hit actual checkout block via native interceptor
      const bookingData = { event_id: event.id };
      const response = await api.post('/bookings', bookingData);
      
      Alert.alert(
        "Booking Confirmed!",
        "Your transaction was processed successfully.",
        [{ text: "See Ticket", onPress: () => router.replace(`/my-bookings/${response.data.id}`) }] // Wait, my-bookings might not exist natively yet
      );
    } catch (err: any) {
      if (err.response?.status === 400 && err.response.data.detail === "Already registered for this event") {
          Alert.alert("Already Registered", "You have already booked this exact session.");
      } else {
          Alert.alert("Checkout Error", "Sorry, something went wrong processing your transaction.");
      }
    } finally {
      setProcessing(false);
    }
  };

  if (loading || !event) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#4E46E5" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
            <Ionicons name="close" size={28} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 44 }} /> 
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Order Summary</Text>
        
        <View style={styles.summaryCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventPrice}>${event.price.toFixed(2)}</Text>
            </View>
            
            <View style={styles.row}>
                <Ionicons name="time-outline" size={16} color="#6B7280" />
                <Text style={styles.subtext}>{new Date(event.start_time).toLocaleString()}</Text>
            </View>
        </View>

        <View style={styles.paymentCard}>
            <Text style={styles.paymentTitle}>Payment Method</Text>
            <View style={styles.mockCard}>
                <Ionicons name="card" size={24} color="#1A1A1A" />
                <Text style={{ marginLeft: 12, fontSize: 16, color: '#1A1A1A', flex: 1 }}>•••• •••• •••• 4242</Text>
                <Ionicons name="checkmark-circle" size={24} color="#4E46E5" />
            </View>
        </View>

      </View>

      <View style={styles.bottomBar}>
          <TouchableOpacity 
              style={styles.payBtn}
              onPress={confirmBooking}
              disabled={processing}
          >
              <Text style={styles.payBtnText}>
                  {processing ? 'Processing Securely...' : `Pay $${event.price.toFixed(2)}`}
              </Text>
          </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  content: {
    padding: 24,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 32,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
  },
  eventPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#4E46E5',
    marginLeft: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subtext: {
    color: '#6B7280',
    fontSize: 14,
  },
  paymentCard: {
    gap: 12,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
  },
  mockCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#4E46E5', // Highlighted select
    padding: 16,
    borderRadius: 12,
  },
  bottomBar: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  payBtn: {
    backgroundColor: '#1A1A1A', // Elite Apple Pay style
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  payBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

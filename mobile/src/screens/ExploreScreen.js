import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ExploreScreen({ navigation }) {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await axios.get('http://10.0.2.2:8000/events');
      setEvents(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBook = async (eventId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return navigation.replace('Login');

      await axios.post('http://10.0.2.2:8000/bookings', { event_id: eventId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Alert.alert('Success', 'Event Booked successfully!');
    } catch (err) {
      Alert.alert('Error', 'Booking failed. Are you logged in?');
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.imagePlaceholder} />
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.subtitle}>Type: {item.event_type}</Text>
      <Text style={styles.date}>Date: {new Date(item.start_time).toLocaleDateString()}</Text>
      <View style={styles.footer}>
        <Text style={styles.price}>${item.price}</Text>
        <TouchableOpacity style={styles.btnPrimary} onPress={() => handleBook(item.id)}>
          <Text style={styles.btnPrimaryText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Explore</Text>
          <Text style={styles.headerSubtitle}>Curated social connections</Text>
        </View>
      </View>

      {events.length === 0 ? (
        <Text style={styles.emptyText}>No events found. Be the first to host!</Text>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fcf8ff',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1b1b24',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#464555',
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#1b1b24',
    shadowOpacity: 0.06,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 12 },
    elevation: 4,
  },
  imagePlaceholder: {
    height: 140,
    backgroundColor: '#f0ecf9',
    marginHorizontal: -24,
    marginTop: -24,
    marginBottom: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1b1b24',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#464555',
  },
  date: {
    fontSize: 14,
    color: '#464555',
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1b1b24',
  },
  btnPrimary: {
    backgroundColor: '#3525cd',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  btnPrimaryText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 48,
    color: '#464555',
  }
});

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../src/api';

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get('/users/me');
        setUser(response.data);
      } catch (err) {
        console.error('Fetch user err', err);
        // If 401, they probably aren't logged in. Just fallplate.
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('user_token');
    router.replace('/auth/login');
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#4E46E5" />
      </View>
    );
  }

  // If no user context loaded, prompt login
  if (!user) {
      return (
          <SafeAreaView style={styles.container}>
              <View style={{ padding: 40, alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                  <Ionicons name="person-circle-outline" size={80} color="#A0A0A0" />
                  <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 16 }}>Not logged in</Text>
                  <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace('/auth/login')}>
                      <Text style={styles.primaryBtnText}>Log In to See Profile</Text>
                  </TouchableOpacity>
              </View>
          </SafeAreaView>
      )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
          <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user.full_name.charAt(0)}</Text>
          </View>
          <View style={{ marginLeft: 16 }}>
              <Text style={styles.name}>{user.full_name}</Text>
              <Text style={styles.email}>{user.email}</Text>
          </View>
      </View>

      <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <TouchableOpacity style={styles.row} onPress={() => Alert.alert("MVP", "My Bookings Native view pending.")}>
              <Ionicons name="ticket-outline" size={24} color="#1A1A1A" />
              <Text style={styles.rowText}>My Bookings</Text>
              <Ionicons name="chevron-forward" size={20} color="#A0A0A0" />
          </TouchableOpacity>
          
          {user.is_host ? (
              <TouchableOpacity style={styles.row} onPress={() => Alert.alert("MVP", "Host Dashboard Native view pending.")}>
                  <Ionicons name="briefcase-outline" size={24} color="#4E46E5" />
                  <Text style={[styles.rowText, { color: '#4E46E5', fontWeight: 'bold' }]}>Host Dashboard</Text>
                  <Ionicons name="chevron-forward" size={20} color="#4E46E5" />
              </TouchableOpacity>
          ) : (
              <TouchableOpacity style={styles.row} onPress={() => Alert.alert("MVP", "Host Onboarding Native view pending.")}>
                  <Ionicons name="rocket-outline" size={24} color="#1A1A1A" />
                  <Text style={styles.rowText}>Become a Host</Text>
                  <Ionicons name="chevron-forward" size={20} color="#A0A0A0" />
              </TouchableOpacity>
          )}
      </View>

      <View style={[styles.section, { borderBottomWidth: 0 }]}>
         <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Text style={styles.logoutText}>Log Out</Text>
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
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4E46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  email: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  rowText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 16,
    color: '#1A1A1A',
  },
  logoutBtn: {
      padding: 16,
      alignItems: 'center',
  },
  logoutText: {
      color: '#DC2626',
      fontSize: 16,
      fontWeight: 'bold',
  },
  primaryBtn: {
      marginTop: 24,
      backgroundColor: '#4E46E5',
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
  },
  primaryBtnText: {
      color: '#FFFFFF',
      fontWeight: 'bold',
      fontSize: 16,
  }
});

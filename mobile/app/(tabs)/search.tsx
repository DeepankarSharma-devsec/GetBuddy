import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleApply = () => {
      // In native, pushing query params to a tab can be handled via setParams or global state.
      // For the MVP, we just demonstrate the unified layout.
      if (!query) {
          return Alert.alert('Enter keyword', 'Please type a search query first.');
      }
      Alert.alert('MVP', `Search filter applied: ${query}`);
      router.navigate('/(tabs)/explore');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Refine Search</Text>
        <Text style={styles.headerSubtitle}>Find exactly what you are looking for.</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Keyword</Text>
          <View style={styles.searchBar}>
             <Ionicons name="search" size={20} color="#A0A0A0" style={{ marginRight: 8 }} />
             <TextInput 
               style={styles.input}
               placeholder="Search titles or hosts..." 
               placeholderTextColor="#A0A0A0"
               value={query} 
               onChangeText={setQuery} 
             />
          </View>
        </View>

        <View style={styles.mockDropdown}>
           <Text style={styles.label}>Category</Text>
           <View style={styles.dropdownBox}>
               <Text style={{ color: '#1A1A1A' }}>All Categories</Text>
               <Ionicons name="chevron-down" size={20} color="#1A1A1A" />
           </View>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleApply}>
          <Text style={styles.buttonText}>Apply Filters</Text>
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
    padding: 24,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  form: {
    padding: 24,
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
  },
  mockDropdown: {
    gap: 8,
  },
  dropdownBox: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#EFEFEF',
      borderRadius: 12,
      paddingHorizontal: 16,
      height: 56,
  },
  button: {
    backgroundColor: '#4E46E5', // Primary
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

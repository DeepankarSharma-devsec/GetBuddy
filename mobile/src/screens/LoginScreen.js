import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegister, setIsRegister] = useState(false);

  const handleSubmit = async () => {
    try {
      if (isRegister) {
        await axios.post('http://10.0.2.2:8000/register', { email, password, full_name: name });
        Alert.alert('Success', 'Registration successful. Please log in.');
        setIsRegister(false);
      } else {
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);

        const response = await axios.post('http://10.0.2.2:8000/login', formData.toString(), {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        
        await AsyncStorage.setItem('token', response.data.access_token);
        navigation.replace('Explore');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Action failed. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <View style={styles.card}>
        <Text style={styles.header}>{isRegister ? 'Join GetBuddy' : 'Welcome Back'}</Text>
        
        {isRegister && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} />
          </View>
        )}
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />
        </View>

        <TouchableOpacity style={styles.btnPrimary} onPress={handleSubmit}>
          <Text style={styles.btnPrimaryText}>{isRegister ? 'Sign Up' : 'Log In'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsRegister(!isRegister)} style={{ marginTop: 24, alignItems: 'center' }}>
          <Text style={styles.toggleText}>
            {isRegister ? 'Already have an account? Log in' : 'New to GetBuddy? Sign up'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fcf8ff', // Background from design system
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#1b1b24',
    shadowOpacity: 0.06,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 12 },
    elevation: 4,
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1b1b24',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#464555',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f2ff',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#1b1b24',
  },
  btnPrimary: {
    backgroundColor: '#3525cd',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  btnPrimaryText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleText: {
    color: '#3525cd',
    fontSize: 14,
    fontWeight: '600',
  }
});

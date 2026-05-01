import React, { useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import api from '../utils/api';

export default function AuthCallback() {
  const router = useRouter();
  const { setUser, setToken } = useAuthStore();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      try {
        const hash = window.location.hash;
        const sessionId = hash.split('session_id=')[1]?.split('&')[0];

        if (!sessionId) {
          router.replace('/login');
          return;
        }

        const response = await api.post('/auth/session', {
          session_id: sessionId,
        });

        setUser(response.data.user);
        router.replace('/(tabs)/instagram');
      } catch (error) {
        console.error('Auth callback error:', error);
        router.replace('/login');
      }
    };

    processAuth();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#2563eb" />
      <Text style={styles.text}>Completing sign in...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a1929',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
});

import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { ChatScreen } from './src/screens/ChatScreen';
import { openClawService } from './src/services/openclawService';

type AppState = 'loading' | 'locked' | 'setup' | 'ready';

export default function App() {
  const [appState, setAppState] = useState<AppState>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Check if already configured
      const configured = await openClawService.initialize();
      
      if (configured) {
        // Already configured - require biometric auth
        setAppState('locked');
      } else {
        // Not configured - go to setup
        setAppState('setup');
      }
    } catch (err) {
      setError('Failed to initialize app');
      setAppState('setup');
    }
  };

  const authenticate = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        // No biometric available - skip auth for now
        setAppState('ready');
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock OpenClaw Companion',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (result.success) {
        setAppState('ready');
      } else {
        setError('Authentication failed');
      }
    } catch (err) {
      setError('Authentication error');
    }
  };

  const handleSetup = async () => {
    // TODO: Implement QR code scanning or manual entry
    // For now, just mark as ready for testing
    await openClawService.configure(
      'http://localhost:3456', // Placeholder - will be scanned/entered
      'demo-token'
    );
    setAppState('locked');
  };

  // Loading screen
  if (appState === 'loading') {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Lock screen
  if (appState === 'locked') {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <Text style={styles.emoji}>🔐</Text>
        <Text style={styles.title}>OpenClaw Companion</Text>
        <Text style={styles.subtitle}>Tap to unlock</Text>
        <TouchableOpacity style={styles.unlockButton} onPress={authenticate}>
          <Text style={styles.unlockButtonText}>Unlock with Face ID</Text>
        </TouchableOpacity>
        {error && <Text style={styles.error}>{error}</Text>}
      </View>
    );
  }

  // Setup screen
  if (appState === 'setup') {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <Text style={styles.emoji}>🔭🕯️</Text>
        <Text style={styles.title}>Welcome!</Text>
        <Text style={styles.subtitle}>Connect to your OpenClaw gateway</Text>
        <TouchableOpacity style={styles.setupButton} onPress={handleSetup}>
          <Text style={styles.setupButtonText}>Setup Connection</Text>
        </TouchableOpacity>
        <Text style={styles.hint}>
          You'll need your gateway URL and token
        </Text>
      </View>
    );
  }

  // Main chat screen
  return (
    <View style={styles.mainContainer}>
      <StatusBar style="light" />
      <ChatScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 50, // Safe area
  },
  emoji: {
    fontSize: 64,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 32,
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#888',
  },
  unlockButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  unlockButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  setupButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  setupButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  hint: {
    marginTop: 24,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  error: {
    marginTop: 16,
    fontSize: 14,
    color: '#FF3B30',
  },
});

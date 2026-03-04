import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { ChatScreen } from './src/screens/ChatScreen';
import { MeetingRecordScreen } from './src/screens/MeetingRecordScreen';
import { MeetingNotesScreen } from './src/screens/MeetingNotesScreen';
import { openClawService } from './src/services/openclawService';
import { meetingService } from './src/services/meetingService';
import { MeetingNote } from './src/types/meeting';

type AppState = 'loading' | 'locked' | 'setup' | 'ready';
type Screen = 'chat' | 'meeting-record' | 'meeting-notes';

export default function App() {
  const [appState, setAppState] = useState<AppState>('loading');
  const [currentScreen, setCurrentScreen] = useState<Screen>('chat');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      const configured = await openClawService.initialize();
      await meetingService.initialize();
      
      if (configured) {
        setAppState('locked');
      } else {
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
    await openClawService.configure(
      'http://localhost:3456',
      'demo-token'
    );
    setAppState('locked');
  };

  const handleMeetingComplete = (note: MeetingNote) => {
    setCurrentScreen('meeting-notes');
  };

  const handleShareWithAgent = async (note: MeetingNote) => {
    const response = await meetingService.shareWithAgent(note);
    if (response) {
      // Switch to chat and show the agent's response
      setCurrentScreen('chat');
    }
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

  // Main app with navigation
  return (
    <View style={styles.mainContainer}>
      <StatusBar style="light" />
      
      {currentScreen === 'chat' && <ChatScreen />}
      
      {currentScreen === 'meeting-record' && (
        <MeetingRecordScreen
          onComplete={handleMeetingComplete}
          onCancel={() => setCurrentScreen('chat')}
        />
      )}
      
      {currentScreen === 'meeting-notes' && (
        <MeetingNotesScreen
          onBack={() => setCurrentScreen('chat')}
          onRecord={() => setCurrentScreen('meeting-record')}
          onShareWithAgent={handleShareWithAgent}
        />
      )}

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => setCurrentScreen('chat')}
        >
          <Text style={[styles.tabEmoji, currentScreen === 'chat' && styles.tabActive]}>
            💬
          </Text>
          <Text style={[styles.tabLabel, currentScreen === 'chat' && styles.tabLabelActive]}>
            Chat
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.tab}
          onPress={() => setCurrentScreen('meeting-record')}
        >
          <Text style={[styles.tabEmoji, currentScreen === 'meeting-record' && styles.tabActive]}>
            🎙️
          </Text>
          <Text style={[styles.tabLabel, currentScreen === 'meeting-record' && styles.tabLabelActive]}>
            Record
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.tab}
          onPress={() => setCurrentScreen('meeting-notes')}
        >
          <Text style={[styles.tabEmoji, currentScreen === 'meeting-notes' && styles.tabActive]}>
            📋
          </Text>
          <Text style={[styles.tabLabel, currentScreen === 'meeting-notes' && styles.tabLabelActive]}>
            Notes
          </Text>
        </TouchableOpacity>
      </View>
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
  },
  emoji: { fontSize: 64, marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#888', marginBottom: 32, textAlign: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#888' },
  unlockButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  unlockButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  setupButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  setupButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  hint: { marginTop: 24, fontSize: 14, color: '#666', textAlign: 'center' },
  error: { marginTop: 16, fontSize: 14, color: '#FF3B30' },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#222',
    backgroundColor: '#000',
    paddingBottom: 24,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  tabEmoji: { fontSize: 24, opacity: 0.5 },
  tabActive: { opacity: 1 },
  tabLabel: { fontSize: 11, color: '#666', marginTop: 2 },
  tabLabelActive: { color: '#007AFF' },
});

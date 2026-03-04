import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { Audio } from 'expo-av';
import { meetingService } from '../services/meetingService';
import { MeetingNote } from '../types/meeting';

interface Props {
  onComplete: (note: MeetingNote) => void;
  onCancel: () => void;
}

export const MeetingRecordScreen: React.FC<Props> = ({ onComplete, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [title, setTitle] = useState('');
  const [participants, setParticipants] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Microphone access is needed to record meetings.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      
      recordingRef.current = recording;
      setIsRecording(true);
      setDuration(0);
      
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;

    try {
      if (timerRef.current) clearInterval(timerRef.current);
      
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      
      recordingRef.current = null;
      setIsRecording(false);
      setIsPaused(false);
      
      if (uri) {
        setAudioUri(uri);
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  const pauseRecording = async () => {
    if (!recordingRef.current) return;
    
    if (isPaused) {
      await recordingRef.current.startAsync();
      timerRef.current = setInterval(() => setDuration(prev => prev + 1), 1000);
      setIsPaused(false);
    } else {
      await recordingRef.current.pauseAsync();
      if (timerRef.current) clearInterval(timerRef.current);
      setIsPaused(true);
    }
  };

  const processRecording = async () => {
    if (!audioUri) return;
    
    const meetingTitle = title.trim() || `Meeting ${new Date().toLocaleDateString()}`;
    const participantList = participants
      .split(',')
      .map(p => p.trim())
      .filter(p => p.length > 0);

    setIsProcessing(true);
    setProcessingStep('Transcribing audio...');

    try {
      await meetingService.initialize();
      
      setProcessingStep('Extracting structure...');
      const note = await meetingService.processRecording(audioUri, meetingTitle, participantList);
      
      if (note) {
        setProcessingStep('Done!');
        onComplete(note);
      } else {
        Alert.alert('Processing Failed', 'Could not process the recording. Please check your gateway connection.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to process meeting recording.');
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Processing view
  if (isProcessing) {
    return (
      <View style={styles.container}>
        <View style={styles.processingCard}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.processingTitle}>Processing Meeting</Text>
          <Text style={styles.processingStep}>{processingStep}</Text>
          <Text style={styles.processingHint}>
            This may take a minute for longer recordings
          </Text>
        </View>
      </View>
    );
  }

  // Review view (after recording)
  if (audioUri && !isRecording) {
    return (
      <View style={styles.container}>
        <View style={styles.reviewCard}>
          <Text style={styles.reviewEmoji}>🎙️</Text>
          <Text style={styles.reviewTitle}>Recording Complete</Text>
          <Text style={styles.reviewDuration}>{formatDuration(duration)}</Text>
          
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Meeting title (optional)"
            placeholderTextColor="#666"
          />
          
          <TextInput
            style={styles.input}
            value={participants}
            onChangeText={setParticipants}
            placeholder="Participants (comma-separated)"
            placeholderTextColor="#666"
          />

          <TouchableOpacity style={styles.processButton} onPress={processRecording}>
            <Text style={styles.processButtonText}>Process Meeting 🧠</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.retryButton} onPress={() => { setAudioUri(null); setDuration(0); }}>
            <Text style={styles.retryButtonText}>Record Again</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Recording view
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={onCancel}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>
      
      <View style={styles.recordingArea}>
        <Text style={styles.recordEmoji}>
          {isRecording ? (isPaused ? '⏸️' : '🔴') : '🎙️'}
        </Text>
        
        <Text style={styles.timer}>{formatDuration(duration)}</Text>
        
        <Text style={styles.instruction}>
          {isRecording 
            ? (isPaused ? 'Recording paused' : 'Recording in progress...')
            : 'Tap to start recording'}
        </Text>
        
        <View style={styles.controls}>
          {isRecording ? (
            <>
              <TouchableOpacity style={styles.controlButton} onPress={pauseRecording}>
                <Text style={styles.controlButtonText}>{isPaused ? '▶️' : '⏸️'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.stopButton} onPress={stopRecording}>
                <Text style={styles.stopButtonText}>⏹️</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={styles.recordButton} onPress={startRecording}>
              <View style={styles.recordDot} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 18,
  },
  recordingArea: {
    alignItems: 'center',
  },
  recordEmoji: {
    fontSize: 64,
    marginBottom: 24,
  },
  timer: {
    fontSize: 48,
    fontWeight: '200',
    color: '#fff',
    fontVariant: ['tabular-nums'],
    marginBottom: 16,
  },
  instruction: {
    fontSize: 16,
    color: '#888',
    marginBottom: 48,
  },
  controls: {
    flexDirection: 'row',
    gap: 24,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  recordDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF3B30',
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonText: {
    fontSize: 24,
  },
  stopButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopButtonText: {
    fontSize: 24,
  },
  reviewCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    width: '100%',
  },
  reviewEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  reviewTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  reviewDuration: {
    fontSize: 18,
    color: '#888',
    marginBottom: 24,
  },
  input: {
    width: '100%',
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#fff',
    marginBottom: 12,
  },
  processButton: {
    width: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  processButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  retryButton: {
    marginTop: 16,
  },
  retryButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  cancelButton: {
    marginTop: 12,
  },
  cancelButtonText: {
    color: '#888',
    fontSize: 16,
  },
  processingCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    padding: 48,
    alignItems: 'center',
    width: '100%',
  },
  processingTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#fff',
    marginTop: 24,
    marginBottom: 8,
  },
  processingStep: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 16,
  },
  processingHint: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

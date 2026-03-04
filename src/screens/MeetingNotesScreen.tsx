import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, StyleSheet, ScrollView, Alert,
} from 'react-native';
import { MeetingNote } from '../types/meeting';
import { meetingService } from '../services/meetingService';

interface Props {
  onBack: () => void;
  onRecord: () => void;
  onShareWithAgent: (note: MeetingNote) => void;
}

export const MeetingNotesScreen: React.FC<Props> = ({ onBack, onRecord, onShareWithAgent }) => {
  const [meetings, setMeetings] = useState<MeetingNote[]>([]);
  const [selectedNote, setSelectedNote] = useState<MeetingNote | null>(null);

  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    await meetingService.initialize();
    const notes = await meetingService.listMeetings();
    setMeetings(notes);
  };

  // Detail view
  if (selectedNote) {
    return (
      <ScrollView style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => setSelectedNote(null)}>
          <Text style={styles.backButtonText}>← Notes</Text>
        </TouchableOpacity>

        <View style={styles.noteHeader}>
          <Text style={styles.noteTitle}>{selectedNote.title}</Text>
          <Text style={styles.noteDate}>{selectedNote.date}</Text>
          {selectedNote.participants.length > 0 && (
            <Text style={styles.noteParticipants}>
              👥 {selectedNote.participants.join(', ')}
            </Text>
          )}
        </View>

        {selectedNote.summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <Text style={styles.sectionContent}>{selectedNote.summary}</Text>
          </View>
        )}

        {selectedNote.keyTopics && selectedNote.keyTopics.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Key Topics</Text>
            {selectedNote.keyTopics.map((topic, i) => (
              <Text key={i} style={styles.listItem}>• {topic}</Text>
            ))}
          </View>
        )}

        {selectedNote.decisions && selectedNote.decisions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Decisions</Text>
            {selectedNote.decisions.map((decision, i) => (
              <Text key={i} style={styles.listItem}>✅ {decision}</Text>
            ))}
          </View>
        )}

        {selectedNote.actionItems && selectedNote.actionItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Action Items</Text>
            {selectedNote.actionItems.map((item, i) => (
              <View key={i} style={styles.actionItem}>
                <Text style={styles.actionItemOwner}>{item.owner}</Text>
                <Text style={styles.actionItemTask}>{item.task}</Text>
                {item.due && <Text style={styles.actionItemDue}>Due: {item.due}</Text>}
              </View>
            ))}
          </View>
        )}

        {selectedNote.openQuestions && selectedNote.openQuestions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Open Questions</Text>
            {selectedNote.openQuestions.map((q, i) => (
              <Text key={i} style={styles.listItem}>❓ {q}</Text>
            ))}
          </View>
        )}

        {selectedNote.followUps && selectedNote.followUps.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Follow-ups</Text>
            {selectedNote.followUps.map((f, i) => (
              <Text key={i} style={styles.listItem}>📋 {f}</Text>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[styles.shareButton, selectedNote.syncedToAgent && styles.sharedButton]}
          onPress={() => onShareWithAgent(selectedNote)}
        >
          <Text style={styles.shareButtonText}>
            {selectedNote.syncedToAgent ? '✅ Shared with Agent' : '💬 Discuss with Agent'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 48 }} />
      </ScrollView>
    );
  }

  // List view
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meeting Notes</Text>
        <TouchableOpacity onPress={onRecord}>
          <Text style={styles.recordLink}>🎙️ New</Text>
        </TouchableOpacity>
      </View>

      {meetings.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🎙️</Text>
          <Text style={styles.emptyTitle}>No meetings yet</Text>
          <Text style={styles.emptySubtitle}>
            Record a meeting to get structured notes with decisions, action items, and follow-ups.
          </Text>
          <TouchableOpacity style={styles.emptyButton} onPress={onRecord}>
            <Text style={styles.emptyButtonText}>Record First Meeting</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={meetings}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.meetingCard}
              onPress={() => setSelectedNote(item)}
            >
              <View style={styles.meetingCardHeader}>
                <Text style={styles.meetingTitle}>{item.title}</Text>
                <Text style={styles.meetingDate}>{item.date}</Text>
              </View>
              {item.summary && (
                <Text style={styles.meetingSummary} numberOfLines={2}>
                  {item.summary}
                </Text>
              )}
              <View style={styles.meetingMeta}>
                {item.actionItems && item.actionItems.length > 0 && (
                  <Text style={styles.metaBadge}>
                    📋 {item.actionItems.length} actions
                  </Text>
                )}
                {item.decisions && item.decisions.length > 0 && (
                  <Text style={styles.metaBadge}>
                    ✅ {item.decisions.length} decisions
                  </Text>
                )}
                {item.syncedToAgent && (
                  <Text style={styles.metaBadge}>💬 Shared</Text>
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#fff' },
  backButton: { paddingTop: 60, paddingHorizontal: 16, paddingBottom: 8 },
  backButtonText: { color: '#007AFF', fontSize: 18 },
  recordLink: { color: '#007AFF', fontSize: 16 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 48 },
  emptyEmoji: { fontSize: 64, marginBottom: 24 },
  emptyTitle: { fontSize: 24, fontWeight: '600', color: '#fff', marginBottom: 12 },
  emptySubtitle: { fontSize: 16, color: '#888', textAlign: 'center', marginBottom: 32, lineHeight: 24 },
  emptyButton: { backgroundColor: '#007AFF', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 12 },
  emptyButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  meetingCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
  },
  meetingCardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  meetingTitle: { fontSize: 17, fontWeight: '600', color: '#fff', flex: 1 },
  meetingDate: { fontSize: 14, color: '#888' },
  meetingSummary: { fontSize: 14, color: '#aaa', lineHeight: 20, marginBottom: 12 },
  meetingMeta: { flexDirection: 'row', gap: 12 },
  metaBadge: { fontSize: 12, color: '#007AFF' },
  noteHeader: { padding: 16, paddingTop: 8 },
  noteTitle: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 4 },
  noteDate: { fontSize: 16, color: '#888', marginBottom: 8 },
  noteParticipants: { fontSize: 14, color: '#aaa' },
  section: { paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#222' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#007AFF', marginBottom: 8 },
  sectionContent: { fontSize: 15, color: '#ddd', lineHeight: 22 },
  listItem: { fontSize: 15, color: '#ddd', lineHeight: 24, paddingLeft: 4 },
  actionItem: { backgroundColor: '#2C2C2E', borderRadius: 8, padding: 12, marginBottom: 8 },
  actionItemOwner: { fontSize: 14, fontWeight: '600', color: '#007AFF', marginBottom: 4 },
  actionItemTask: { fontSize: 15, color: '#fff' },
  actionItemDue: { fontSize: 13, color: '#FFA500', marginTop: 4 },
  shareButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 24,
  },
  sharedButton: { backgroundColor: '#333' },
  shareButtonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
});

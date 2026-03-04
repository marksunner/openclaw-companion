// Meeting Capture Service
// Records audio, uploads for transcription, returns structured notes

import * as FileSystem from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import { MeetingNote } from '../types/meeting';

const MEETINGS_DIR = `${FileSystem.documentDirectory}meetings/`;
const GATEWAY_URL_KEY = 'openclaw_gateway_url';
const TOKEN_KEY = 'openclaw_gateway_token';

export class MeetingService {
  private gatewayUrl: string | null = null;
  private token: string | null = null;

  async initialize(): Promise<void> {
    this.gatewayUrl = await SecureStore.getItemAsync(GATEWAY_URL_KEY);
    this.token = await SecureStore.getItemAsync(TOKEN_KEY);
    
    const dirInfo = await FileSystem.getInfoAsync(MEETINGS_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(MEETINGS_DIR, { intermediates: true });
    }
  }

  async processRecording(
    audioUri: string,
    title: string,
    participants: string[]
  ): Promise<MeetingNote | null> {
    if (!this.gatewayUrl || !this.token) {
      throw new Error('Gateway not configured');
    }

    try {
      const transcript = await this.transcribeAudio(audioUri);
      if (!transcript) throw new Error('Transcription failed');

      const structured = await this.extractStructure(transcript, title, participants);
      if (!structured) throw new Error('Structure extraction failed');

      const note: MeetingNote = {
        id: Date.now().toString(),
        title,
        date: new Date().toISOString().split('T')[0],
        participants,
        audioUri,
        transcript,
        ...structured,
        createdAt: Date.now(),
        syncedToAgent: false,
      };

      await this.saveMeetingNote(note);
      return note;
    } catch (error) {
      console.error('Meeting processing failed:', error);
      return null;
    }
  }

  private async transcribeAudio(audioUri: string): Promise<string | null> {
    try {
      const openaiKey = await SecureStore.getItemAsync('openai_api_key');
      
      if (!openaiKey) {
        return this.transcribeViaGateway(audioUri);
      }

      const formData = new FormData();
      formData.append('file', {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'meeting.m4a',
      } as any);
      formData.append('model', 'whisper-1');
      formData.append('response_format', 'text');

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${openaiKey}` },
        body: formData,
      });

      if (!response.ok) throw new Error(`Whisper API error: ${response.status}`);
      return await response.text();
    } catch (error) {
      console.error('Transcription error:', error);
      return null;
    }
  }

  private async transcribeViaGateway(audioUri: string): Promise<string | null> {
    try {
      const response = await fetch(`${this.gatewayUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify({
          model: 'openclaw:main',
          messages: [
            { role: 'system', content: 'You are a transcription assistant.' },
            { role: 'user', content: `Please transcribe the audio file at: ${audioUri}` },
          ],
        }),
      });
      if (!response.ok) return null;
      const data = await response.json();
      return data.choices?.[0]?.message?.content || null;
    } catch { return null; }
  }

  private async extractStructure(
    transcript: string, title: string, participants: string[]
  ): Promise<Partial<MeetingNote> | null> {
    if (!this.gatewayUrl || !this.token) return null;

    try {
      const response = await fetch(`${this.gatewayUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify({
          model: 'openclaw:main',
          messages: [
            {
              role: 'system',
              content: 'Extract structured meeting info. Respond in JSON: {summary, keyTopics[], decisions[], actionItems[{owner,task,due?}], openQuestions[], followUps[]}',
            },
            {
              role: 'user',
              content: `Meeting: ${title}\nParticipants: ${participants.join(', ')}\n\nTranscript:\n${transcript}`,
            },
          ],
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) return null;
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) return null;
      return JSON.parse(content);
    } catch (error) {
      console.error('Extraction error:', error);
      return null;
    }
  }

  async saveMeetingNote(note: MeetingNote): Promise<void> {
    const filename = `${note.date}-${note.title.toLowerCase().replace(/\s+/g, '-')}.json`;
    await FileSystem.writeAsStringAsync(`${MEETINGS_DIR}${filename}`, JSON.stringify(note, null, 2));
  }

  async listMeetings(): Promise<MeetingNote[]> {
    try {
      const files = await FileSystem.readDirectoryAsync(MEETINGS_DIR);
      const meetings: MeetingNote[] = [];
      for (const file of files.filter(f => f.endsWith('.json'))) {
        const content = await FileSystem.readAsStringAsync(`${MEETINGS_DIR}${file}`);
        meetings.push(JSON.parse(content));
      }
      return meetings.sort((a, b) => b.createdAt - a.createdAt);
    } catch { return []; }
  }

  async shareWithAgent(note: MeetingNote): Promise<string | null> {
    if (!this.gatewayUrl || !this.token) return null;
    try {
      const markdown = this.formatAsMarkdown(note);
      const response = await fetch(`${this.gatewayUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify({
          model: 'openclaw:main',
          messages: [{ role: 'user', content: `Review my meeting notes:\n\n${markdown}` }],
        }),
      });
      if (!response.ok) return null;
      const data = await response.json();
      note.syncedToAgent = true;
      await this.saveMeetingNote(note);
      return data.choices?.[0]?.message?.content || null;
    } catch { return null; }
  }

  formatAsMarkdown(note: MeetingNote): string {
    const lines: string[] = [];
    lines.push(`# Meeting: ${note.title} — ${note.date}`, '');
    if (note.participants.length) {
      lines.push('## Participants');
      note.participants.forEach(p => lines.push(`- ${p}`));
      lines.push('');
    }
    if (note.summary) lines.push('## Summary', note.summary, '');
    if (note.keyTopics?.length) {
      lines.push('## Key Topics');
      note.keyTopics.forEach(t => lines.push(`- ${t}`));
      lines.push('');
    }
    if (note.decisions?.length) {
      lines.push('## Decisions');
      note.decisions.forEach(d => lines.push(`- ✅ ${d}`));
      lines.push('');
    }
    if (note.actionItems?.length) {
      lines.push('## Action Items');
      note.actionItems.forEach(a => {
        const due = a.due ? ` (due: ${a.due})` : '';
        lines.push(`- [ ] **${a.owner}**: ${a.task}${due}`);
      });
      lines.push('');
    }
    if (note.openQuestions?.length) {
      lines.push('## Open Questions');
      note.openQuestions.forEach(q => lines.push(`- ❓ ${q}`));
      lines.push('');
    }
    if (note.followUps?.length) {
      lines.push('## Follow-ups');
      note.followUps.forEach(f => lines.push(`- 📋 ${f}`));
      lines.push('');
    }
    return lines.join('\n');
  }
}

export const meetingService = new MeetingService();

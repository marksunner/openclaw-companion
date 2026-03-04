// Meeting capture types

export interface ActionItem {
  owner: string;
  task: string;
  due?: string;
}

export interface MeetingNote {
  id: string;
  title: string;
  date: string;
  participants: string[];
  audioUri?: string;
  transcript?: string;
  summary?: string;
  keyTopics?: string[];
  decisions?: string[];
  actionItems?: ActionItem[];
  openQuestions?: string[];
  followUps?: string[];
  createdAt: number;
  syncedToAgent: boolean;
}

export interface RecordingState {
  isRecording: boolean;
  duration: number;
  uri?: string;
}

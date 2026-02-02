export interface Client {
  id: string;
  name: string;
}

export interface Project {
  id: string;
  name: string;
  clientId: string;
  color: string;
}

export interface TimeEntry {
  id: string;
  projectId: string;
  description: string;
  startTime: number;
  endTime: number | null; // null means currently running
}

export interface ActiveTimer {
  projectId: string | null;
  description: string;
  startTime: number;
}

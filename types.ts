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

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  assignedTo: string | null;
  createdBy: string;
}

export interface TimeEntry {
  id: string;
  projectId: string;
  taskId?: string; // Optional task association
  description: string;
  startTime: number;
  endTime: number | null; // null means currently running
}

export interface ActiveTimer {
  projectId: string | null;
  taskId?: string | null;
  description: string;
  startTime: number;
}

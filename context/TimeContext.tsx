import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Client, Project, TimeEntry } from '../types';
import { generateId } from '../utils';

interface TimeContextType {
  clients: Client[];
  projects: Project[];
  entries: TimeEntry[];
  activeEntry: TimeEntry | null;

  addClient: (name: string) => void;
  deleteClient: (id: string) => void;
  addProject: (name: string, clientId: string, color: string) => void;
  deleteProject: (id: string) => void;

  startTimer: (projectId: string, description: string) => void;
  stopTimer: () => void;
  discardTimer: () => void;
  updateActiveEntry: (projectId: string, description: string) => void;
  deleteEntry: (id: string) => void;
  addManualEntry: (projectId: string, description: string, startTime: number, endTime: number) => void;
  updateEntry: (id: string, projectId: string, description: string, startTime: number, endTime: number) => void;
}

const TimeContext = createContext<TimeContextType | undefined>(undefined);

// LocalStorage Keys
const STORAGE_KEYS = {
  CLIENTS: 'timeflow_clients',
  PROJECTS: 'timeflow_projects',
  ENTRIES: 'timeflow_entries',
};

export const TimeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [entries, setEntries] = useState<TimeEntry[]>([]);

  // Derived state: find the entry that is currently running (endTime is null)
  const activeEntry = entries.find(e => e.endTime === null) || null;

  // Load from LocalStorage on mount
  useEffect(() => {
    const loadedClients = localStorage.getItem(STORAGE_KEYS.CLIENTS);
    const loadedProjects = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    const loadedEntries = localStorage.getItem(STORAGE_KEYS.ENTRIES);

    if (loadedClients) setClients(JSON.parse(loadedClients));
    if (loadedProjects) setProjects(JSON.parse(loadedProjects));
    if (loadedEntries) setEntries(JSON.parse(loadedEntries));
  }, []);

  // Save to LocalStorage whenever state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
  }, [clients, projects, entries]);

  // --- Actions ---

  const addClient = (name: string) => {
    const newClient: Client = { id: generateId(), name };
    setClients(prev => [...prev, newClient]);
  };

  const deleteClient = (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
    // Cascade delete projects? For now, we'll keep them or user manually deletes
  };

  const addProject = (name: string, clientId: string, color: string) => {
    const newProject: Project = { id: generateId(), name, clientId, color };
    setProjects(prev => [...prev, newProject]);
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  const startTimer = (projectId: string, description: string) => {
    if (activeEntry) {
      stopTimer(); // Auto stop previous if exists
    }
    const newEntry: TimeEntry = {
      id: generateId(),
      projectId,
      description,
      startTime: Date.now(),
      endTime: null,
    };
    setEntries(prev => [newEntry, ...prev]);
  };

  const stopTimer = () => {
    if (!activeEntry) return;
    setEntries(prev => prev.map(e =>
      e.id === activeEntry.id ? { ...e, endTime: Date.now() } : e
    ));
  };

  const discardTimer = () => {
    if (!activeEntry) return;
    setEntries(prev => prev.filter(e => e.id !== activeEntry.id));
  };

  const updateActiveEntry = (projectId: string, description: string) => {
    if (!activeEntry) return;
    setEntries(prev => prev.map(e =>
      e.id === activeEntry.id ? { ...e, projectId, description } : e
    ));
  }

  const deleteEntry = (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const addManualEntry = (projectId: string, description: string, startTime: number, endTime: number) => {
    const newEntry: TimeEntry = {
      id: generateId(),
      projectId,
      description,
      startTime,
      endTime,
    };
    setEntries(prev => [newEntry, ...prev].sort((a, b) => b.startTime - a.startTime));
  };

  const updateEntry = (id: string, projectId: string, description: string, startTime: number, endTime: number) => {
    setEntries(prev => prev.map(e =>
      e.id === id ? { ...e, projectId, description, startTime, endTime } : e
    ).sort((a, b) => b.startTime - a.startTime));
  };

  return (
    <TimeContext.Provider value={{
      clients,
      projects,
      entries,
      activeEntry,
      addClient,
      deleteClient,
      addProject,
      deleteProject,
      startTimer,
      stopTimer,
      discardTimer,
      updateActiveEntry,
      deleteEntry,
      addManualEntry,
      updateEntry
    }}>
      {children}
    </TimeContext.Provider>
  );
};

export const useTime = () => {
  const context = useContext(TimeContext);
  if (!context) {
    throw new Error('useTime must be used within a TimeProvider');
  }
  return context;
};

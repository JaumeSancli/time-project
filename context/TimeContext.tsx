
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Client, Project, TimeEntry } from '../types';
import { generateId } from '../utils';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';
import { message } from 'antd';

interface TimeContextType {
  clients: Client[];
  projects: Project[];
  entries: TimeEntry[];
  activeEntry: TimeEntry | null;
  loadingData: boolean;

  addClient: (name: string) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  addProject: (name: string, clientId: string, color: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  startTimer: (projectId: string, description: string) => Promise<void>;
  stopTimer: () => Promise<void>;
  discardTimer: () => Promise<void>;
  updateActiveEntry: (projectId: string, description: string) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  addManualEntry: (projectId: string, description: string, startTime: number, endTime: number) => Promise<void>;
  updateEntry: (id: string, projectId: string, description: string, startTime: number, endTime: number) => Promise<void>;
}

const TimeContext = createContext<TimeContextType | undefined>(undefined);

export const TimeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Derived state: find the entry that is currently running (endTime is null)
  const activeEntry = entries.find(e => e.endTime === null) || null;

  useEffect(() => {
    if (user) {
      fetchData();
    } else {
      setClients([]);
      setProjects([]);
      setEntries([]);
    }
  }, [user]);

  const fetchData = async () => {
    setLoadingData(true);
    try {
      const { data: clientsData, error: clientsError } = await supabase.from('clients').select('*');
      if (clientsError) throw clientsError;
      setClients(clientsData || []);

      const { data: projectsData, error: projectsError } = await supabase.from('projects').select('*');
      if (projectsError) throw projectsError;
      setProjects(projectsData || []);

      const { data: entriesData, error: entriesError } = await supabase.from('time_entries').select('*').order('start_time', { ascending: false });
      if (entriesError) throw entriesError;

      // Map database fields to types if necessary (snake_case to camelCase is handled if types match, 
      // but here we used camelCase in types.ts. Supabase returns snake_case by default usually, 
      // but let's check. My SQL schema uses snake_case: user_id, project_id, start_time.
      // My local types use camelCase: userId, projectId, startTime.
      // I need to map them!)
      const mappedEntries = (entriesData || []).map((e: any) => ({
        id: e.id,
        projectId: e.project_id,
        userId: e.user_id,
        description: e.description,
        startTime: parseInt(e.start_time),
        endTime: e.end_time ? parseInt(e.end_time) : null
      }));

      // Also map projects and clients if needed. 
      // Clients: user_id -> userId (optional in type), name -> name.
      // Projects: user_id -> userId, client_id -> clientId, name, color.

      const mappedProjects = (projectsData || []).map((p: any) => ({
        id: p.id,
        userId: p.user_id,
        clientId: p.client_id,
        name: p.name,
        color: p.color
      }));

      const mappedClients = (clientsData || []).map((c: any) => ({
        id: c.id,
        userId: c.user_id,
        name: c.name
      }));

      setEntries(mappedEntries);
      setProjects(mappedProjects);
      setClients(mappedClients);

    } catch (error: any) {
      message.error('Error fetching data: ' + error.message);
    } finally {
      setLoadingData(false);
    }
  };

  // --- Actions ---

  const addClient = async (name: string) => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from('clients').insert([{
        user_id: user.id,
        name
      }]).select().single();

      if (error) throw error;

      const newClient = { id: data.id, userId: data.user_id, name: data.name };
      setClients(prev => [...prev, newClient]);
    } catch (e: any) {
      message.error(e.message);
    }
  };

  const deleteClient = async (id: string) => {
    try {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
      setClients(prev => prev.filter(c => c.id !== id));
    } catch (e: any) {
      message.error(e.message);
    }
  };

  const addProject = async (name: string, clientId: string, color: string) => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from('projects').insert([{
        user_id: user.id,
        client_id: clientId,
        name,
        color
      }]).select().single();

      if (error) throw error;

      const newProject = {
        id: data.id,
        userId: data.user_id,
        clientId: data.client_id,
        name: data.name,
        color: data.color
      };
      setProjects(prev => [...prev, newProject]);
    } catch (e: any) {
      message.error(e.message);
    }
  };

  const deleteProject = async (id: string) => {
    try {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
      setProjects(prev => prev.filter(p => p.id !== id));
    } catch (e: any) {
      message.error(e.message);
    }
  };

  const startTimer = async (projectId: string, description: string) => {
    if (!user) return;

    // If active entry, stop it first
    if (activeEntry) {
      await stopTimer();
    }

    try {
      const startTime = Date.now();
      const { data, error } = await supabase.from('time_entries').insert([{
        user_id: user.id,
        project_id: projectId,
        description,
        start_time: startTime,
        end_time: null
      }]).select().single();

      if (error) throw error;

      const newEntry = {
        id: data.id,
        userId: data.user_id,
        projectId: data.project_id,
        description: data.description,
        startTime: parseInt(data.start_time),
        endTime: null
      };
      setEntries(prev => [newEntry, ...prev]);
    } catch (e: any) {
      message.error(e.message);
    }
  };

  const stopTimer = async () => {
    if (!activeEntry) return;

    try {
      const endTime = Date.now();
      const { error } = await supabase.from('time_entries').update({
        end_time: endTime
      }).eq('id', activeEntry.id);

      if (error) throw error;

      setEntries(prev => prev.map(e =>
        e.id === activeEntry.id ? { ...e, endTime } : e
      ));
    } catch (e: any) {
      message.error(e.message);
    }
  };

  const discardTimer = async () => {
    if (!activeEntry) return;
    try {
      const { error } = await supabase.from('time_entries').delete().eq('id', activeEntry.id);
      if (error) throw error;
      setEntries(prev => prev.filter(e => e.id !== activeEntry.id));
    } catch (e: any) {
      message.error(e.message);
    }
  };

  const updateActiveEntry = async (projectId: string, description: string) => {
    if (!activeEntry) return;
    try {
      const { error } = await supabase.from('time_entries').update({
        project_id: projectId,
        description
      }).eq('id', activeEntry.id);

      if (error) throw error;

      setEntries(prev => prev.map(e =>
        e.id === activeEntry.id ? { ...e, projectId, description } : e
      ));
    } catch (e: any) {
      message.error(e.message);
    }
  }

  const deleteEntry = async (id: string) => {
    try {
      const { error } = await supabase.from('time_entries').delete().eq('id', id);
      if (error) throw error;
      setEntries(prev => prev.filter(e => e.id !== id));
    } catch (e: any) {
      message.error(e.message);
    }
  };

  const addManualEntry = async (projectId: string, description: string, startTime: number, endTime: number) => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from('time_entries').insert([{
        user_id: user.id,
        project_id: projectId,
        description,
        start_time: startTime,
        end_time: endTime
      }]).select().single();

      if (error) throw error;

      const newEntry = {
        id: data.id,
        userId: data.user_id,
        projectId: data.project_id,
        description: data.description,
        startTime: parseInt(data.start_time),
        endTime: parseInt(data.end_time)
      };
      setEntries(prev => [newEntry, ...prev].sort((a, b) => b.startTime - a.startTime));
    } catch (e: any) {
      message.error(e.message);
    }
  };

  const updateEntry = async (id: string, projectId: string, description: string, startTime: number, endTime: number) => {
    try {
      const { error } = await supabase.from('time_entries').update({
        project_id: projectId,
        description,
        start_time: startTime,
        end_time: endTime
      }).eq('id', id);

      if (error) throw error;

      setEntries(prev => prev.map(e =>
        e.id === id ? { ...e, projectId, description, startTime, endTime } : e
      ).sort((a, b) => b.startTime - a.startTime));
    } catch (e: any) {
      message.error(e.message);
    }
  };

  return (
    <TimeContext.Provider value={{
      clients,
      projects,
      entries,
      activeEntry,
      loadingData,
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

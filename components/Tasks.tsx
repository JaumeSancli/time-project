
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Task, Project } from '../types';
import { Modal, Input, Button, Select, List, Tag, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;

export const Tasks: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [users, setUsers] = useState<any[]>([]); // We'll fetch profiles/users
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [newTask, setNewTask] = useState<Partial<Task>>({ status: 'pending' });

    useEffect(() => {
        fetchTasks();
        fetchProjects();
        fetchUsers();
    }, []);

    const fetchTasks = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) message.error('Error fetching tasks');
        else setTasks(data || []);
        setLoading(false);
    };

    const fetchProjects = async () => {
        const { data } = await supabase.from('projects').select('*');
        if (data) setProjects(data);
    };

    // Currently we use profiles from timeflow schema
    const fetchUsers = async () => {
        // Depending on RLS, we might only see some users. 
        // For now, let's assume we can see profiles or just use current user 
        // If we want to assign to others, we need a way to list them.
        // We'll try to fetch profiles.
        const { data } = await supabase.from('profiles').select('*');
        if (data) setUsers(data);
    };

    const handleCreateTask = async () => {
        if (!newTask.title || !newTask.projectId) {
            message.error('Please fill in required fields');
            return;
        }

        const user = await supabase.auth.getUser();
        const userId = user.data.user?.id;

        if (!userId) {
            message.error('User not authenticated');
            return;
        }

        const taskData = {
            ...newTask,
            created_by: userId,
            assigned_to: newTask.assignedTo || userId, // Default assign to self
            project_id: newTask.projectId, // mapped correctly in insert
            status: newTask.status || 'pending'
        };

        // transform camelCase to snake_case for DB if needed, but supabase-js handles it if configured, 
        // BUT we defined table with snake_case. 
        // Let's ensure keys match DB columns
        const dbPayload = {
            title: taskData.title,
            description: taskData.description,
            project_id: taskData.projectId,
            status: taskData.status,
            assigned_to: taskData.assignedTo,
            created_by: userId
        };

        const { data, error } = await supabase
            .from('tasks')
            .insert([dbPayload])
            .select();

        if (error) {
            message.error('Error creating task: ' + error.message);
        } else {
            message.success('Task created successfully');
            setIsModalVisible(false);
            setNewTask({ status: 'pending' });
            fetchTasks();
        }
    };

    const handleStatusChange = async (taskId: string, status: string) => {
        const { error } = await supabase
            .from('tasks')
            .update({ status })
            .eq('id', taskId);

        if (error) message.error('Failed to update status');
        else {
            message.success('Status updated');
            fetchTasks();
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2>Tasks</h2>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
                    New Task
                </Button>
            </div>

            <List
                loading={loading}
                dataSource={tasks}
                renderItem={(task) => {
                    const project = projects.find(p => p.id === task.projectId);
                    // Handling snake_case response from Supabase if types don't confirm
                    // Actually supabase-js returns what DB has. 
                    // So task might have project_id, assigned_to etc.
                    // We should Type cast or map. 
                    // Let's assume for now we use the raw data from DB in render or map it.
                    // To be safe, let's treat task as any here or map it in fetch.
                    // Let's stick effectively to what we get.
                    const rawTask: any = task;

                    return (
                        <List.Item
                            actions={[
                                <Select
                                    defaultValue={rawTask.status}
                                    style={{ width: 120 }}
                                    onChange={(val) => handleStatusChange(rawTask.id, val)}
                                >
                                    <Option value="pending">Pending</Option>
                                    <Option value="in_progress">In Progress</Option>
                                    <Option value="completed">Completed</Option>
                                </Select>
                            ]}
                        >
                            <List.Item.Meta
                                title={
                                    <span>
                                        {rawTask.title} <Tag color="blue">{projects.find(p => p.id === rawTask.project_id)?.name}</Tag>
                                    </span>
                                }
                                description={rawTask.description}
                            />
                            <div>Assigned: {users.find(u => u.id === rawTask.assigned_to)?.full_name || 'Unassigned'}</div>
                        </List.Item>
                    );
                }}
            />

            <Modal
                title="Create New Task"
                open={isModalVisible}
                onOk={handleCreateTask}
                onCancel={() => setIsModalVisible(false)}
            >
                <Input
                    placeholder="Task Title"
                    style={{ marginBottom: 10 }}
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                />
                <Select
                    placeholder="Select Project"
                    style={{ width: '100%', marginBottom: 10 }}
                    onChange={(val) => setNewTask({ ...newTask, projectId: val })}
                >
                    {projects.map(p => (
                        <Option key={p.id} value={p.id}>{p.name}</Option>
                    ))}
                </Select>
                <Select
                    placeholder="Assign To"
                    style={{ width: '100%', marginBottom: 10 }}
                    onChange={(val) => setNewTask({ ...newTask, assignedTo: val })}
                    allowClear
                >
                    {users.map(u => (
                        <Option key={u.id} value={u.id}>{u.full_name || u.email}</Option>
                    ))}
                </Select>
                <TextArea
                    placeholder="Description"
                    rows={4}
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                />
            </Modal>
        </div>
    );
};

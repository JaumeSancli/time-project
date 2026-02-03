
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Task, Project } from '../types';
import { Modal, Input, Button, Select, List, Tag, message, Popconfirm, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTime } from '../context/TimeContext';
import { useAuth } from '../context/AuthContext';

const { Option } = Select;
const { TextArea } = Input;

export const Tasks: React.FC = () => {
    const { tasks, projects, addTask, updateTask, deleteTask, updateTaskStatus } = useTime();
    const [users, setUsers] = useState<any[]>([]); // Fetch profiles/users
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
    const [newTask, setNewTask] = useState<Partial<Task>>({ status: 'pending' });
    const { user } = useAuth();

    useEffect(() => {
        fetchUsers();
    }, []);

    // Fetch users (profiles)
    const fetchUsers = async () => {
        const { data } = await supabase.from('profiles').select('*');
        if (data) setUsers(data);
    };

    const handleSaveTask = async () => {
        if (!newTask.title || !newTask.projectId) {
            message.error('Por favor, rellena los campos obligatorios');
            return;
        }

        if (isEditMode && currentTaskId) {
            await updateTask(currentTaskId, newTask);
            message.success('Tarea actualizada correctamente');
        } else {
            await addTask(newTask.projectId, newTask.title || '', newTask.description, newTask.assignedTo);
            message.success('Tarea creada correctamente');
        }
        setIsModalVisible(false);
        setNewTask({ status: 'pending' });
        setIsEditMode(false);
        setCurrentTaskId(null);
    };

    const handleEditClick = (task: Task) => {
        setNewTask({
            title: task.title,
            projectId: task.projectId,
            assignedTo: task.assignedTo,
            description: task.description,
            status: task.status
        });
        setCurrentTaskId(task.id);
        setIsEditMode(true);
        setIsModalVisible(true);
    };

    const handleDeleteClick = async (taskId: string) => {
        await deleteTask(taskId);
        message.success('Tarea eliminada');
    };

    const handleStatusChange = async (taskId: string, status: 'pending' | 'in_progress' | 'completed') => {
        await updateTaskStatus(taskId, status);
        message.success('Estado actualizado');
    };

    const openCreateModal = () => {
        setNewTask({ status: 'pending' });
        setIsEditMode(false);
        setCurrentTaskId(null);
        setIsModalVisible(true);
    };

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2>Tareas</h2>
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
                    Nueva Tarea
                </Button>
            </div>

            <List
                dataSource={tasks}
                renderItem={(task) => {
                    return (
                        <List.Item
                            actions={[
                                <Select
                                    defaultValue={task.status}
                                    style={{ width: 140 }}
                                    onChange={(val) => handleStatusChange(task.id, val)}
                                >
                                    <Option value="pending">Pendiente</Option>
                                    <Option value="in_progress">En Progreso</Option>
                                    <Option value="completed">Completada</Option>
                                </Select>,
                                <Tooltip title="Editar">
                                    <Button icon={<EditOutlined />} onClick={() => handleEditClick(task)} />
                                </Tooltip>,
                                <Popconfirm title="¿Estás seguro de eliminar esta tarea?" onConfirm={() => handleDeleteClick(task.id)}>
                                    <Button icon={<DeleteOutlined />} danger />
                                </Popconfirm>
                            ]}
                        >
                            <List.Item.Meta
                                title={
                                    <span>
                                        {task.title} <Tag color="blue">{projects.find(p => p.id === task.projectId)?.name}</Tag>
                                    </span>
                                }
                                description={task.description}
                            />
                            <div>Asignado a: {users.find(u => u.id === task.assignedTo)?.full_name || 'Sin asignar'}</div>
                        </List.Item>
                    );
                }}
            />

            <Modal
                title={isEditMode ? "Editar Tarea" : "Crear Nueva Tarea"}
                open={isModalVisible}
                onOk={handleSaveTask}
                onCancel={() => setIsModalVisible(false)}
                okText="Guardar"
                cancelText="Cancelar"
            >
                <Input
                    placeholder="Título de la tarea"
                    style={{ marginBottom: 10 }}
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                />
                <Select
                    placeholder="Seleccionar Proyecto"
                    style={{ width: '100%', marginBottom: 10 }}
                    value={newTask.projectId}
                    onChange={(val) => setNewTask({ ...newTask, projectId: val })}
                >
                    {projects.map(p => (
                        <Option key={p.id} value={p.id}>{p.name}</Option>
                    ))}
                </Select>
                <Select
                    placeholder="Asignar a"
                    style={{ width: '100%', marginBottom: 10 }}
                    value={newTask.assignedTo}
                    onChange={(val) => setNewTask({ ...newTask, assignedTo: val })}
                    allowClear
                >
                    {users.map(u => (
                        <Option key={u.id} value={u.id}>{u.full_name || u.email}</Option>
                    ))}
                </Select>
                <TextArea
                    placeholder="Descripción"
                    rows={4}
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                />
            </Modal>
        </div>
    );
};

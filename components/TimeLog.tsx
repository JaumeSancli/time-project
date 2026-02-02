import React, { useState, useMemo } from 'react';
import { Table, Tag, Button, Empty, Typography, Modal, Form, Input, Select, DatePicker, TimePicker, Space, Popconfirm, message } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined, FilterOutlined } from '@ant-design/icons';
import { useTime } from '../context/TimeContext';
import { formatDuration } from '../utils';
import dayjs, { Dayjs } from 'dayjs';

const { Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

export const TimeLog: React.FC = () => {
  const { entries, clients, projects, deleteEntry, addManualEntry, updateEntry } = useTime();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<typeof entries[0] | null>(null);
  const [form] = Form.useForm();

  // Date filter state
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [filterProject, setFilterProject] = useState<string | undefined>(undefined);

  // Filter completed entries
  const completedEntries = useMemo(() => {
    let filtered = entries.filter(e => e.endTime !== null);

    if (dateRange && dateRange[0] && dateRange[1]) {
      const start = dateRange[0].startOf('day').valueOf();
      const end = dateRange[1].endOf('day').valueOf();
      filtered = filtered.filter(e => e.startTime >= start && e.startTime <= end);
    }

    if (filterProject) {
      filtered = filtered.filter(e => e.projectId === filterProject);
    }

    return filtered;
  }, [entries, dateRange, filterProject]);

  const getProjectDetails = (projectId: string) => {
    const proj = projects.find(p => p.id === projectId);
    const client = clients.find(c => c.id === proj?.clientId);
    return { proj, client };
  };

  const openAddModal = () => {
    setEditingEntry(null);
    form.resetFields();
    form.setFieldsValue({
      date: dayjs(),
      startTime: dayjs().subtract(1, 'hour'),
      endTime: dayjs(),
    });
    setIsModalOpen(true);
  };

  const openEditModal = (entry: typeof entries[0]) => {
    setEditingEntry(entry);
    form.setFieldsValue({
      projectId: entry.projectId,
      description: entry.description,
      date: dayjs(entry.startTime),
      startTime: dayjs(entry.startTime),
      endTime: dayjs(entry.endTime),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (values: any) => {
    const { projectId, description, date, startTime, endTime } = values;

    // Combine date with times
    const startDateTime = date.hour(startTime.hour()).minute(startTime.minute()).second(0).valueOf();
    const endDateTime = date.hour(endTime.hour()).minute(endTime.minute()).second(0).valueOf();

    if (endDateTime <= startDateTime) {
      message.error('La hora de fin debe ser posterior a la hora de inicio');
      return;
    }

    if (editingEntry) {
      updateEntry(editingEntry.id, projectId, description || '', startDateTime, endDateTime);
      message.success('Entrada actualizada');
    } else {
      addManualEntry(projectId, description || '', startDateTime, endDateTime);
      message.success('Entrada añadida');
    }

    setIsModalOpen(false);
    form.resetFields();
  };

  const clearFilters = () => {
    setDateRange(null);
    setFilterProject(undefined);
  };

  const columns = [
    {
      title: 'Fecha',
      dataIndex: 'startTime',
      key: 'date',
      width: 120,
      render: (val: number) => dayjs(val).format('DD/MM/YYYY'),
      sorter: (a: any, b: any) => a.startTime - b.startTime,
    },
    {
      title: 'Cliente & Proyecto',
      key: 'project',
      render: (_: any, record: any) => {
        const { proj, client } = getProjectDetails(record.projectId);
        return (
          <div className="flex flex-col">
            <Text strong className="text-gray-700">{client?.name || 'Cliente desconocido'}</Text>
            <div className="flex items-center mt-1">
              {proj && <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: proj.color }}></span>}
              <span className="text-gray-500 text-sm">{proj?.name || 'Proyecto desconocido'}</span>
            </div>
          </div>
        );
      },
    },
    {
      title: 'Descripción',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => text || <span className="text-gray-400 italic">Sin descripción</span>,
    },
    {
      title: 'Hora',
      key: 'time',
      width: 120,
      render: (_: any, record: any) => (
        <span className="text-gray-500 text-sm">
          {dayjs(record.startTime).format('HH:mm')} - {dayjs(record.endTime).format('HH:mm')}
        </span>
      ),
    },
    {
      title: 'Duración',
      key: 'duration',
      align: 'right' as const,
      width: 100,
      render: (_: any, record: any) => {
        const duration = (record.endTime || Date.now()) - record.startTime;
        return <Tag color="blue">{formatDuration(duration)}</Tag>;
      },
    },
    {
      title: 'Acciones',
      key: 'action',
      width: 100,
      align: 'center' as const,
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => openEditModal(record)}
          />
          <Popconfirm title="¿Eliminar entrada?" onConfirm={() => deleteEntry(record.id)}>
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Calculate total for filtered entries
  const totalDuration = completedEntries.reduce((acc, entry) => {
    return acc + ((entry.endTime || 0) - entry.startTime);
  }, 0);

  return (
    <div className="space-y-4">
      {/* Filters Row */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-wrap gap-3 items-center">
            <FilterOutlined className="text-gray-400" />
            <RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates)}
              format="DD/MM/YYYY"
              placeholder={['Desde', 'Hasta']}
            />
            <Select
              placeholder="Filtrar por proyecto"
              style={{ minWidth: 200 }}
              value={filterProject}
              onChange={setFilterProject}
              allowClear
            >
              {clients.map(client => (
                <Select.OptGroup key={client.id} label={client.name}>
                  {projects.filter(p => p.clientId === client.id).map(project => (
                    <Option key={project.id} value={project.id}>
                      <div className="flex items-center">
                        <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: project.color }}></span>
                        {project.name}
                      </div>
                    </Option>
                  ))}
                </Select.OptGroup>
              ))}
            </Select>
            {(dateRange || filterProject) && (
              <Button size="small" onClick={clearFilters}>Limpiar filtros</Button>
            )}
          </div>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openAddModal}
          >
            Añadir entrada
          </Button>
        </div>

        {completedEntries.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex gap-6 text-sm text-gray-600">
            <span><strong>{completedEntries.length}</strong> entradas</span>
            <span>Total: <Tag color="blue">{formatDuration(totalDuration)}</Tag></span>
          </div>
        )}
      </div>

      {/* Table */}
      {completedEntries.length === 0 ? (
        <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
          <Empty description="No hay entradas. ¡Arranca el temporizador o añade una entrada manual!" />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <Table
            dataSource={completedEntries}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        title={editingEntry ? 'Editar entrada' : 'Añadir entrada manual'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical" className="mt-4">
          <Form.Item name="projectId" label="Proyecto" rules={[{ required: true, message: 'Selecciona un proyecto' }]}>
            <Select placeholder="Selecciona un proyecto">
              {clients.map(client => (
                <Select.OptGroup key={client.id} label={client.name}>
                  {projects.filter(p => p.clientId === client.id).map(project => (
                    <Option key={project.id} value={project.id}>
                      <div className="flex items-center">
                        <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: project.color }}></span>
                        {project.name}
                      </div>
                    </Option>
                  ))}
                </Select.OptGroup>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="description" label="Descripción">
            <Input placeholder="¿En qué trabajaste?" />
          </Form.Item>

          <Form.Item name="date" label="Fecha" rules={[{ required: true }]}>
            <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="startTime" label="Hora inicio" rules={[{ required: true }]}>
              <TimePicker format="HH:mm" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="endTime" label="Hora fin" rules={[{ required: true }]}>
              <TimePicker format="HH:mm" style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="primary" htmlType="submit">
              {editingEntry ? 'Guardar cambios' : 'Añadir entrada'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

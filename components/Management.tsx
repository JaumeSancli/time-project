import React, { useState } from 'react';
import { Row, Col, Card, List, Button, Input, Modal, Form, Select, ColorPicker, Typography, Popconfirm, Tag, Empty, Checkbox } from 'antd';
import { PlusOutlined, DeleteOutlined, UserOutlined, ProjectOutlined, TeamOutlined, EditOutlined } from '@ant-design/icons';
import { useTime } from '../context/TimeContext';

const { Title } = Typography;
const { Option } = Select;

export const Management: React.FC = () => {
  const { clients, projects, addClient, deleteClient, addProject, updateProject, deleteProject } = useTime();

  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null); // State for editing project
  const [formClient] = Form.useForm();
  const [formProject] = Form.useForm();

  const handleCreateClient = (values: { name: string }) => {
    addClient(values.name);
    setIsClientModalOpen(false);
    formClient.resetFields();
  };

  const handleCreateProject = (values: { name: string; clientId: string; color: any; isShared: boolean }) => {
    const colorHex = typeof values.color === 'string' ? values.color : values.color.toHexString();

    if (editingProject) {
      updateProject(editingProject.id, values.name, values.clientId, colorHex, values.isShared);
    } else {
      addProject(values.name, values.clientId, colorHex, values.isShared);
    }

    setIsProjectModalOpen(false);
    formProject.resetFields();
    setEditingProject(null);
  };

  const openEditProjectModal = (project: any) => {
    setEditingProject(project);
    formProject.setFieldsValue({
      name: project.name,
      clientId: project.clientId,
      color: project.color,
      isShared: project.isShared
    });
    setIsProjectModalOpen(true);
  };

  const openCreateProjectModal = () => {
    setEditingProject(null);
    formProject.resetFields();
    setIsProjectModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Title level={2} style={{ margin: 0 }}>Gestión de Datos</Title>
      </div>

      <Row gutter={[24, 24]}>
        {/* Clients Column */}
        <Col xs={24} md={12}>
          <Card
            title={<><UserOutlined className="mr-2" /> Clientes</>}
            extra={<Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setIsClientModalOpen(true)}>Nuevo</Button>}
            className="shadow-sm h-full"
          >
            {clients.length === 0 ? (
              <Empty description="No hay clientes. ¡Añade uno!" />
            ) : (
              <List
                itemLayout="horizontal"
                dataSource={clients}
                renderItem={client => (
                  <List.Item
                    actions={[
                      <Popconfirm title="¿Eliminar cliente?" onConfirm={() => deleteClient(client.id)}>
                        <Button type="text" danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                    ]}
                  >
                    <List.Item.Meta
                      title={client.name}
                      description={`${projects.filter(p => p.clientId === client.id).length} proyectos`}
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>

        {/* Projects Column */}
        <Col xs={24} md={12}>
          <Card
            title={<><ProjectOutlined className="mr-2" /> Proyectos</>}
            extra={<Button type="primary" size="small" icon={<PlusOutlined />} onClick={openCreateProjectModal} disabled={clients.length === 0}>Nuevo</Button>}
            className="shadow-sm h-full"
          >
            {projects.length === 0 ? (
              <Empty description={clients.length === 0 ? "Primero añade un cliente" : "No hay proyectos. ¡Añade uno!"} />
            ) : (
              <List
                itemLayout="horizontal"
                dataSource={projects}
                renderItem={project => {
                  const client = clients.find(c => c.id === project.clientId);
                  return (
                    <List.Item
                      actions={[
                        <Button type="text" icon={<EditOutlined />} onClick={() => openEditProjectModal(project)} />,
                        <Popconfirm title="¿Eliminar proyecto?" onConfirm={() => deleteProject(project.id)}>
                          <Button type="text" danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                      ]}
                    >
                      <List.Item.Meta
                        avatar={<div className="w-4 h-4 rounded-full mt-1" style={{ backgroundColor: project.color }} />}
                        title={<span>{project.name} {project.isShared && <Tag color="blue" icon={<TeamOutlined />}>Compartido</Tag>}</span>}
                        description={<Tag>{client?.name || 'Desconocido'}</Tag>}
                      />
                    </List.Item>
                  );
                }}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* Client Modal */}
      <Modal title="Añadir Cliente" open={isClientModalOpen} onCancel={() => setIsClientModalOpen(false)} footer={null}>
        <Form form={formClient} onFinish={handleCreateClient} layout="vertical" className="mt-4">
          <Form.Item name="name" label="Nombre del cliente" rules={[{ required: true, message: 'Introduce un nombre' }]}>
            <Input placeholder="Ej: Empresa ABC" />
          </Form.Item>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setIsClientModalOpen(false)}>Cancelar</Button>
            <Button type="primary" htmlType="submit">Crear</Button>
          </div>
        </Form>
      </Modal>

      {/* Project Modal */}
      <Modal title={editingProject ? "Editar Proyecto" : "Añadir Proyecto"} open={isProjectModalOpen} onCancel={() => setIsProjectModalOpen(false)} footer={null}>
        <Form form={formProject} onFinish={handleCreateProject} layout="vertical" initialValues={{ color: '#1677ff' }} className="mt-4">
          <Form.Item name="name" label="Nombre del proyecto" rules={[{ required: true, message: 'Introduce un nombre' }]}>
            <Input placeholder="Ej: Rediseño web" />
          </Form.Item>
          <Form.Item name="clientId" label="Cliente" rules={[{ required: true, message: 'Selecciona un cliente' }]}>
            <Select placeholder="Selecciona un cliente">
              {clients.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="color" label="Color">
            <ColorPicker showText />
          </Form.Item>
          <Form.Item name="isShared" valuePropName="checked">
            <Checkbox>Compartir este proyecto con otros usuarios</Checkbox>
          </Form.Item>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setIsProjectModalOpen(false)}>Cancelar</Button>
            <Button type="primary" htmlType="submit">{editingProject ? "Guardar" : "Crear"}</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

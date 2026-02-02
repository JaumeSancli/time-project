import React from 'react';
import { Row, Col, Card, Statistic, Table, Typography, Progress, Empty, Button, message } from 'antd';
import { PieChartOutlined, ClockCircleOutlined, ProjectOutlined, DownloadOutlined } from '@ant-design/icons';
import { useTime } from '../context/TimeContext';
import { formatDuration } from '../utils';

const { Title } = Typography;

export const Reports: React.FC = () => {
  const { entries, clients, projects } = useTime();

  // Aggregate data by client
  const clientStats = clients.map(client => {
    const clientProjects = projects.filter(p => p.clientId === client.id).map(p => p.id);
    const clientEntries = entries.filter(e => e.endTime && clientProjects.includes(e.projectId));

    const totalMs = clientEntries.reduce((acc, curr) => {
      return acc + ((curr.endTime || Date.now()) - curr.startTime);
    }, 0);

    return {
      key: client.id,
      client: client.name,
      hours: totalMs / (1000 * 60 * 60),
      count: clientEntries.length,
      totalMs
    };
  }).filter(s => s.totalMs > 0).sort((a, b) => b.totalMs - a.totalMs);

  // Aggregate data by project
  const projectStats = projects.map(project => {
    const projectEntries = entries.filter(e => e.endTime && e.projectId === project.id);
    const client = clients.find(c => c.id === project.clientId);

    const totalMs = projectEntries.reduce((acc, curr) => {
      return acc + ((curr.endTime || Date.now()) - curr.startTime);
    }, 0);

    return {
      key: project.id,
      project: project.name,
      client: client?.name || 'Desconocido',
      color: project.color,
      hours: totalMs / (1000 * 60 * 60),
      count: projectEntries.length,
      totalMs
    };
  }).filter(s => s.totalMs > 0).sort((a, b) => b.totalMs - a.totalMs);

  const totalHours = clientStats.reduce((acc, curr) => acc + curr.hours, 0);
  const totalEntries = entries.filter(e => e.endTime).length;

  // Export to CSV
  const exportToCSV = () => {
    const completedEntries = entries.filter(e => e.endTime);

    if (completedEntries.length === 0) {
      message.warning('No hay datos para exportar');
      return;
    }

    const headers = ['Fecha', 'Cliente', 'Proyecto', 'Descripción', 'Hora Inicio', 'Hora Fin', 'Duración (horas)'];

    const rows = completedEntries.map(entry => {
      const project = projects.find(p => p.id === entry.projectId);
      const client = clients.find(c => c.id === project?.clientId);
      const duration = ((entry.endTime || 0) - entry.startTime) / (1000 * 60 * 60);

      const formatDateTime = (ts: number) => new Date(ts).toLocaleString('es-ES');
      const formatDateOnly = (ts: number) => new Date(ts).toLocaleDateString('es-ES');

      return [
        formatDateOnly(entry.startTime),
        client?.name || 'Desconocido',
        project?.name || 'Desconocido',
        `"${(entry.description || '').replace(/"/g, '""')}"`,
        formatDateTime(entry.startTime),
        formatDateTime(entry.endTime!),
        duration.toFixed(2)
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `timeflow_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    URL.revokeObjectURL(url);
    message.success('Datos exportados correctamente');
  };

  const clientColumns = [
    { title: 'Cliente', dataIndex: 'client', key: 'client' },
    { title: 'Entradas', dataIndex: 'count', key: 'count', align: 'center' as const },
    {
      title: 'Horas',
      dataIndex: 'hours',
      key: 'hours',
      align: 'right' as const,
      render: (val: number) => val.toFixed(2) + ' h'
    },
    {
      title: 'Distribución',
      key: 'dist',
      width: 150,
      render: (_: any, record: any) => (
        <Progress percent={Math.round((record.hours / totalHours) * 100)} size="small" />
      )
    }
  ];

  const projectColumns = [
    {
      title: 'Proyecto',
      key: 'project',
      render: (_: any, record: any) => (
        <div className="flex items-center">
          <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: record.color }}></span>
          {record.project}
        </div>
      )
    },
    { title: 'Cliente', dataIndex: 'client', key: 'client' },
    { title: 'Entradas', dataIndex: 'count', key: 'count', align: 'center' as const },
    {
      title: 'Horas',
      dataIndex: 'hours',
      key: 'hours',
      align: 'right' as const,
      render: (val: number) => val.toFixed(2) + ' h'
    },
  ];

  if (totalEntries === 0) {
    return (
      <div className="space-y-6">
        <Title level={2}>Informes</Title>
        <Card className="shadow-sm">
          <Empty description="No hay datos para mostrar. ¡Empieza a registrar tiempo!" />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Title level={2} style={{ margin: 0 }}>Informes</Title>
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={exportToCSV}
        >
          Exportar CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <Row gutter={[24, 24]}>
        <Col xs={24} md={8}>
          <Card bordered={false} className="shadow-sm">
            <Statistic
              title="Tiempo Total Registrado"
              value={totalHours.toFixed(1)}
              suffix="horas"
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card bordered={false} className="shadow-sm">
            <Statistic
              title="Clientes Activos"
              value={clientStats.length}
              prefix={<PieChartOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card bordered={false} className="shadow-sm">
            <Statistic
              title="Proyectos Activos"
              value={projectStats.length}
              prefix={<ProjectOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Hours by Client */}
      <Card title="Horas por Cliente" className="shadow-sm">
        <Table dataSource={clientStats} columns={clientColumns} pagination={false} />
      </Card>

      {/* Hours by Project */}
      <Card title="Horas por Proyecto" className="shadow-sm">
        <Table dataSource={projectStats} columns={projectColumns} pagination={false} />
      </Card>
    </div>
  );
};

import React, { useState, useEffect, useMemo } from 'react';
import { Select, Input, Button, Popconfirm, message, Tag } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, HistoryOutlined } from '@ant-design/icons';
import { useTime } from '../context/TimeContext';
import { formatDuration } from '../utils';

const { Option } = Select;

export const TimerWidget: React.FC = () => {
  const { clients, projects, entries, activeEntry, startTimer, stopTimer, updateActiveEntry, discardTimer } = useTime();

  const [selectedProject, setSelectedProject] = useState<string | undefined>(undefined);
  const [description, setDescription] = useState('');
  const [elapsed, setElapsed] = useState(0);

  // Get recent projects (last 5 unique projects used)
  const recentProjects = useMemo(() => {
    const seen = new Set<string>();
    const recent: typeof projects = [];

    for (const entry of entries) {
      if (entry.projectId && !seen.has(entry.projectId)) {
        const proj = projects.find(p => p.id === entry.projectId);
        if (proj) {
          recent.push(proj);
          seen.add(entry.projectId);
        }
      }
      if (recent.length >= 5) break;
    }

    return recent;
  }, [entries, projects]);

  // Sync local state with active entry
  useEffect(() => {
    if (activeEntry) {
      setSelectedProject(activeEntry.projectId);
      setDescription(activeEntry.description);
    }
  }, [activeEntry]);

  // Ticker effect
  useEffect(() => {
    let interval: any;
    if (activeEntry) {
      const update = () => {
        setElapsed(Date.now() - activeEntry.startTime);
      };
      update();
      interval = setInterval(update, 1000);
    } else {
      setElapsed(0);
    }
    return () => clearInterval(interval);
  }, [activeEntry]);

  const handleStart = () => {
    if (!selectedProject) {
      message.warning('Selecciona un proyecto primero');
      return;
    }
    startTimer(selectedProject, description);
  };

  const handleStop = () => {
    stopTimer();
    setDescription('');
    setSelectedProject(undefined);
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDescription(val);
    if (activeEntry && selectedProject) {
      updateActiveEntry(selectedProject, val);
    }
  };

  const handleProjectChange = (val: string) => {
    setSelectedProject(val);
    if (activeEntry) {
      updateActiveEntry(val, description);
    }
  };

  const handleQuickStart = (projectId: string) => {
    setSelectedProject(projectId);
    if (!activeEntry) {
      startTimer(projectId, '');
    }
  };

  return (
    <div className="space-y-3 mb-6">
      {/* Main Timer Bar */}
      <div className="bg-white p-4 shadow-sm border border-gray-200 rounded-lg flex flex-col md:flex-row items-center gap-4 sticky top-0 z-10">
        <div className="flex-1 w-full">
          <Input
            placeholder="¿En qué estás trabajando?"
            value={description}
            onChange={handleDescriptionChange}
            size="large"
            className="border-none shadow-none focus:shadow-none bg-transparent text-gray-700"
            prefix={<ClockCircleOutlined className="text-gray-400" />}
          />
        </div>

        <div className="w-full md:w-64">
          <Select
            showSearch
            placeholder="Seleccionar proyecto"
            style={{ width: '100%' }}
            size="large"
            value={selectedProject}
            onChange={handleProjectChange}
            optionFilterProp="children"
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
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
          <div className={`text-2xl font-mono font-medium w-28 text-center ${activeEntry ? 'text-blue-600' : 'text-gray-400'}`}>
            {formatDuration(elapsed)}
          </div>

          {!activeEntry ? (
            <Button
              type="primary"
              shape="round"
              icon={<PlayCircleOutlined />}
              size="large"
              onClick={handleStart}
              disabled={projects.length === 0}
            >
              Iniciar
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                type="primary"
                danger
                shape="round"
                icon={<PauseCircleOutlined />}
                size="large"
                onClick={handleStop}
              >
                Parar
              </Button>
              <Popconfirm title="¿Descartar esta entrada?" onConfirm={discardTimer} okText="Sí" cancelText="No">
                <Button
                  type="text"
                  icon={<CloseCircleOutlined className="text-gray-400 hover:text-red-500" />}
                  size="large"
                />
              </Popconfirm>
            </div>
          )}
        </div>
      </div>

      {/* Recent Projects Quick Access */}
      {!activeEntry && recentProjects.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-gray-400 text-sm flex items-center gap-1">
            <HistoryOutlined /> Recientes:
          </span>
          {recentProjects.map(proj => {
            const client = clients.find(c => c.id === proj.clientId);
            return (
              <Tag
                key={proj.id}
                className="cursor-pointer hover:opacity-80 transition-opacity"
                style={{
                  backgroundColor: proj.color + '20',
                  borderColor: proj.color,
                  color: proj.color
                }}
                onClick={() => handleQuickStart(proj.id)}
              >
                <span className="w-2 h-2 rounded-full inline-block mr-1" style={{ backgroundColor: proj.color }}></span>
                {proj.name}
                <span className="text-gray-400 ml-1 text-xs">({client?.name})</span>
              </Tag>
            );
          })}
        </div>
      )}
    </div>
  );
};

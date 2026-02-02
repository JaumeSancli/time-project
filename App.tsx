import React, { useState } from 'react';
import { Layout, Menu, ConfigProvider, theme } from 'antd';
import {
  ClockCircleOutlined,
  BarChartOutlined,
  SettingOutlined,
  ThunderboltFilled,
  CalendarOutlined
} from '@ant-design/icons';
import { TimeProvider } from './context/TimeContext';
import { TimerWidget } from './components/TimerWidget';
import { TimeLog } from './components/TimeLog';
import { Management } from './components/Management';
import { Reports } from './components/Reports';
import { Calendar } from './components/Calendar';

const { Header, Content, Sider } = Layout;

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState('tracker');
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const renderContent = () => {
    switch (currentView) {
      case 'tracker':
        return (
          <>
            <div className="mb-2">
              <h1 className="text-2xl font-bold text-gray-800">Registro de Tiempo</h1>
            </div>
            <TimerWidget />
            <TimeLog />
          </>
        );
      case 'calendar':
        return <Calendar />;
      case 'reports':
        return <Reports />;
      case 'manage':
        return <Management />;
      default:
        return <TimerWidget />;
    }
  };

  return (
    <Layout className="min-h-screen">
      <Sider
        breakpoint="lg"
        collapsedWidth="0"
        theme="light"
        className="shadow-md z-20"
        width={240}
      >
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <ThunderboltFilled className="text-blue-600 text-xl mr-2" />
          <span className="text-lg font-bold text-gray-800 tracking-tight">TimeFlow</span>
        </div>
        <Menu
          theme="light"
          mode="inline"
          defaultSelectedKeys={['tracker']}
          selectedKeys={[currentView]}
          onClick={({ key }) => setCurrentView(key)}
          className="border-r-0 mt-4 px-2"
          items={[
            {
              key: 'tracker',
              icon: <ClockCircleOutlined />,
              label: 'Registro',
            },
            {
              key: 'calendar',
              icon: <CalendarOutlined />,
              label: 'Calendario',
            },
            {
              key: 'reports',
              icon: <BarChartOutlined />,
              label: 'Informes',
            },
            {
              type: 'divider'
            },
            {
              key: 'manage',
              icon: <SettingOutlined />,
              label: 'Gestión',
            },
          ]}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer }} className="shadow-sm z-10 sticky top-0 md:hidden flex items-center px-4">
          <div className="font-bold text-lg">TimeFlow</div>
        </Header>
        <Content style={{ margin: '24px 16px 0', overflow: 'initial' }}>
          <div className={`${currentView === 'calendar' ? 'max-w-7xl' : 'max-w-5xl'} mx-auto pb-12`}>
            {renderContent()}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1677ff', // Corporate Blue
          borderRadius: 6,
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        },
      }}
    >
      <TimeProvider>
        <AppContent />
      </TimeProvider>
    </ConfigProvider>
  );
};

export default App;

import React, { useState } from 'react';
import { Layout, Menu, ConfigProvider, theme, Spin } from 'antd';
import {
  ClockCircleOutlined,
  BarChartOutlined,
  SettingOutlined,
  ThunderboltFilled,
  CalendarOutlined,
  CheckSquareOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import { TimeProvider, useTime } from './context/TimeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TimerWidget } from './components/TimerWidget';
import { TimeLog } from './components/TimeLog';
import { Management } from './components/Management';
import { Reports } from './components/Reports';
import { Calendar } from './components/Calendar';
import { Auth } from './components/Auth';
import { Tasks } from './components/Tasks';

const { Header, Content, Sider } = Layout;

const AppContent: React.FC = () => {
  const { user, signOut, loading } = useAuth();
  const [currentView, setCurrentView] = useState('tracker');
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  // Need to checking loading state of Auth to prevent flash of login screen
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Spin size="large" /></div>;
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <AuthenticatedAppContent
      currentView={currentView}
      setCurrentView={setCurrentView}
      colorBgContainer={colorBgContainer}
      signOut={signOut}
    />
  );
};

// Separated to use hooks that depend on TimeProvider if needed (though Auth is outside)
const AuthenticatedAppContent: React.FC<{
  currentView: string,
  setCurrentView: (v: string) => void,
  colorBgContainer: string,
  signOut: () => void
}> = ({ currentView, setCurrentView, colorBgContainer, signOut }) => {

  // We can access useTime here if we want to show loading state for data
  const { loadingData } = useTime();

  const renderContent = () => {
    if (loadingData && currentView === 'tracker' && false) {
      // Optional: Show loading spinner for data. Disabling for now to allow UI to render empty first
      // or we can handle it inside components.
    }

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
      case 'tasks':
        return <Tasks />;
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
          onClick={({ key }) => {
            if (key === 'logout') {
              signOut();
            } else {
              setCurrentView(key);
            }
          }}
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
              key: 'tasks',
              icon: <CheckSquareOutlined />,
              label: 'Tareas',
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
            {
              type: 'divider'
            },
            {
              key: 'logout',
              icon: <LogoutOutlined />,
              label: 'Cerrar Sesión',
              danger: true
            }
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
}

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
      <AuthProvider>
        <TimeProvider>
          <AppContent />
        </TimeProvider>
      </AuthProvider>
    </ConfigProvider>
  );
};

export default App;

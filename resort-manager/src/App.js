import React, { useState } from 'react';
import { Layout, Menu } from 'antd';
import ResortsPage from './pages/resorts/ResortsPage';
import UsersPage from './pages/users/UsersPage';
import ScrapingPage from './pages/scraping/ScrapingPage';
import OverpassTurboPage from './pages/overpass-turbo/OverpassTurboPage';
import SkiPassPage from './pages/ski-passes/SkiPassPage';

const { Header, Content, Footer } = Layout;

const App = () => {
  const [selectedKey, setSelectedKey] = useState('1');

  const handleMenuClick = (e) => {
    setSelectedKey(e.key);
  };

  return (
    <Layout>
      <Header>
        <div className="logo" />
        <Menu theme="dark" mode="horizontal" defaultSelectedKeys={['1']} onClick={handleMenuClick}>
          <Menu.Item key="1">Resorts</Menu.Item>
          <Menu.Item key="2">Users</Menu.Item>
          <Menu.Item key="3">Scraping</Menu.Item>
          <Menu.Item key="4">Overpass Turbo</Menu.Item>
          <Menu.Item key="5">Ski Passes</Menu.Item>
        </Menu>
      </Header>
      <Content style={{ 
        padding: selectedKey === '4' ? '0' : selectedKey === '1' ? '0' : '50px',
        minHeight: 'calc(100vh - 64px - 70px)',
        overflow: selectedKey === '1' ? 'visible' : 'hidden'
      }}>
        {selectedKey === '1' && <ResortsPage />}
        {selectedKey === '2' && <UsersPage />}
        {selectedKey === '3' && <ScrapingPage />}
        {selectedKey === '4' && <OverpassTurboPage />}
        {selectedKey === '5' && <SkiPassPage />}
      </Content>
      <Footer style={{ textAlign: 'center' }}>Resort Manager ©2023</Footer>
    </Layout>
  );
};

export default App;
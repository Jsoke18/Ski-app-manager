import React, { useState } from 'react';
import { Layout, Menu } from 'antd';
import ResortsPage from './pages/resorts/ResortsPage';
import FlaggedResortsPage from './pages/resorts/FlaggedResortsPage';
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
          <Menu.Item key="2">Flagged Resorts</Menu.Item>
          <Menu.Item key="3">Users</Menu.Item>
          <Menu.Item key="4">Scraping</Menu.Item>
          <Menu.Item key="5">Overpass Turbo</Menu.Item>
          <Menu.Item key="6">Ski Passes</Menu.Item>
        </Menu>
      </Header>
      <Content style={{ padding: '50px' }}>
        {selectedKey === '1' && <ResortsPage />}
        {selectedKey === '2' && <FlaggedResortsPage />}
        {selectedKey === '3' && <UsersPage />}
        {selectedKey === '4' && <ScrapingPage />}
        {selectedKey === '5' && <OverpassTurboPage />}
        {selectedKey === '6' && <SkiPassPage />}
      </Content>
      <Footer style={{ textAlign: 'center' }}>Resort Manager ©2023</Footer>
    </Layout>
  );
};

export default App;
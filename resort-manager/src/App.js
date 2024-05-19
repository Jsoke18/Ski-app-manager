import React, { useState } from 'react';
import { Layout, Menu } from 'antd';
import ResortsPage from './pages/resorts/ResortsPage';
import UsersPage from './pages/users/UsersPage';

const { Header, Content, Footer } = Layout;

const App = () => {
  const [selectedKey, setSelectedKey] = useState('1');

  const handleMenuClick = e => {
    setSelectedKey(e.key);
  };

  return (
    <Layout>
      <Header>
        <div className="logo" />
        <Menu theme="dark" mode="horizontal" defaultSelectedKeys={['1']} onClick={handleMenuClick}>
          <Menu.Item key="1">Resorts</Menu.Item>
          <Menu.Item key="2">Users</Menu.Item>
        </Menu>
      </Header>
      <Content style={{ padding: '50px' }}>
        {selectedKey === '1' && <ResortsPage />}
        {selectedKey === '2' && <UsersPage />}
      </Content>
      <Footer style={{ textAlign: 'center' }}>Resort Manager ©2023</Footer>
    </Layout>
  );
};

export default App;
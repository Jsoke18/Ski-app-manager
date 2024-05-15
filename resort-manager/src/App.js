import React from 'react';
import { Layout, Menu } from 'antd';
import ResortsPage from './pages/resorts/ResortsPage';
const { Header, Content, Footer } = Layout;

const App = () => {
  return (
    <Layout>
      <Header>
        <div className="logo" />
        <Menu theme="dark" mode="horizontal" defaultSelectedKeys={['1']}>
          <Menu.Item key="1">Home</Menu.Item>
          <Menu.Item key="2">Resorts</Menu.Item>
        </Menu>
      </Header>
      <Content style={{ padding: '50px' }}>
        <ResortsPage />
      </Content>
      <Footer style={{ textAlign: 'center' }}>Resort Manager ©2023</Footer>
    </Layout>
  );
};

export default App;
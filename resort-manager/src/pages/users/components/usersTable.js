import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Popconfirm, message } from 'antd';
import { getAllUsers, deleteUser } from '../../../services/usersService';
import UsersForm from './UsersForm';

function UsersTable() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    getAllUsers().then(setUsers).catch(console.error);
  }, []);

  const columns = [
    {
      title: 'User Details',
      key: 'userDetails',
      width: 300,
      render: (_, record) => (
        <div style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            borderRadius: '50%', 
            backgroundColor: '#1890ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '18px',
            flexShrink: 0
          }}>
            {record.username ? record.username.charAt(0).toUpperCase() : 'U'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ 
              fontWeight: 'bold', 
              fontSize: '14px',
              color: '#1f1f1f',
              marginBottom: '4px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {record.username || 'No username'}
            </div>
            <div style={{ 
              fontSize: '12px', 
              color: '#666',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {record.email || 'No email'}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Account Info',
      key: 'accountInfo',
      width: 200,
      render: (_, record) => (
        <div style={{ padding: '4px 0' }}>
          <div style={{ marginBottom: '8px' }}>
            <div style={{ fontSize: '11px', color: '#999', marginBottom: '2px' }}>Created</div>
            <div style={{ fontSize: '12px', color: '#333' }}>
              {record.createdAt ? new Date(record.createdAt).toLocaleDateString() : 'Unknown'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#999', marginBottom: '2px' }}>Status</div>
            <div style={{ 
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: '#f6ffed',
              border: '1px solid #b7eb8f',
              color: '#52c41a',
              fontSize: '11px',
              fontWeight: '500',
              display: 'inline-block'
            }}>
              Active
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 140,
      fixed: 'right',
      render: (text, record) => (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '6px',
          padding: '4px 0'
        }}>
          <Button 
            type="primary"
            size="small"
            onClick={() => handleEditUser(record)}
            style={{ fontSize: '11px' }}
            block
          >
            Edit User
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this user?"
            onConfirm={() => handleDeleteUser(record._id)}
            okText="Yes"
            cancelText="No"
            placement="topRight"
          >
            <Button 
              danger 
              size="small"
              style={{ fontSize: '11px' }}
              block
            >
              Delete
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleDeleteUser = async (userId) => {
    try {
      await deleteUser(userId);
      setUsers(users.filter((user) => user._id !== userId));
      message.success('User deleted successfully');
    } catch (error) {
      console.error('Failed to delete user', error);
      message.error('Failed to delete user');
    }
  };

  const handleModalCancel = () => {
    setSelectedUser(null);
    setIsModalOpen(false);
  };

  return (
    <>
      <Table 
        dataSource={users} 
        columns={columns} 
        rowKey="_id"
        scroll={{ 
          x: 640,
          y: 'calc(100vh - 300px)'
        }}
        pagination={{
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} users`,
          pageSizeOptions: ['10', '20', '50'],
          defaultPageSize: 20,
        }}
        size="middle"
        style={{
          background: '#fff',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
      />
      <Modal
        title={
          <div style={{ fontSize: '16px', fontWeight: '600', color: '#1f1f1f' }}>
            Edit User Details
          </div>
        }
        open={isModalOpen}
        onCancel={handleModalCancel}
        footer={null}
        width={500}
        style={{ top: 50 }}
      >
        {selectedUser && (
          <UsersForm
            userId={selectedUser._id}
            username={selectedUser.username}
            setUsername={(newUsername) =>
              setSelectedUser({ ...selectedUser, username: newUsername })
            }
            onSuccess={() => {
              message.success('Username updated successfully');
              setIsModalOpen(false);
            }}
            onFailure={() => message.error('Failed to update username')}
          />
        )}
      </Modal>
    </>
  );
}

export default UsersTable;
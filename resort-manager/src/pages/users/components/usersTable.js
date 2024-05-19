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
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (text, record) => (
        <>
          <Button onClick={() => handleEditUser(record)}>Edit</Button>
          <Popconfirm
            title="Are you sure you want to delete this user?"
            onConfirm={() => handleDeleteUser(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button danger>Delete</Button>
          </Popconfirm>
        </>
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
      <Table dataSource={users} columns={columns} rowKey="_id" />
      <Modal
        title="Edit User"
        open={isModalOpen}
        onCancel={handleModalCancel}
        footer={null}
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
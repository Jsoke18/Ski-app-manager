import React from 'react';
import { Form, Input, Button } from 'antd';
import { updateUser } from  '../../../services/usersService';


const UsersForm = ({ userId, username, setUsername }) => {
  const handleUsernameChange = (event) => {
    setUsername(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const updatedData = { username };
      await updateUser(userId, updatedData);
      alert('Username updated successfully');
    } catch (error) {
      console.error('Failed to update username', error);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Item label="Username">
        <Input value={username} onChange={handleUsernameChange} />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit">
          Update Username
        </Button>
      </Form.Item>
    </Form>
  );
};

export default UsersForm;
import React, { useEffect } from 'react';
import { Form, Input, Button } from 'antd';

const ResortForm = ({ editingResort, onUpdateResort, isAddingResort }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (editingResort) {
      form.setFieldsValue(editingResort);
    } else {
      form.resetFields();
    }
  }, [editingResort, form]);

  const onFinish = (values) => {
    console.log('Form values:', values);
    if (editingResort) {
      onUpdateResort({ ...editingResort, ...values });
    } else {
      onUpdateResort(values);
    }
    form.resetFields();
  };

  return (
    <Form
      form={form}
      onFinish={onFinish}
      labelCol={{ span: 6 }}
      wrapperCol={{ span: 18 }}
    >
      <Form.Item
        name="name"
        label="Resort Name"
        rules={[{ required: true }]}
      >
        <Input />
      </Form.Item>
      <Form.Item name="country" label="Country">
        <Input />
      </Form.Item>
      <Form.Item name="province" label="Province">
        <Input />
      </Form.Item>
      <Form.Item name="information" label="Information">
        <Input.TextArea rows={4} />
      </Form.Item>
      <Form.Item name="longestRun" label="Longest Run">
        <Input />
      </Form.Item>
      <Form.Item name="baseElevation" label="Base Elevation">
        <Input />
      </Form.Item>
      <Form.Item name="topElevation" label="Top Elevation">
        <Input />
      </Form.Item>
      <Form.Item name="totalLifts" label="Total Lifts">
        <Input type="number" />
      </Form.Item>
      <Form.Item name="notes" label="Notes">
        <Input.TextArea rows={4} />
      </Form.Item>
      <Form.Item name="image" label="Image URL">
        <Input />
      </Form.Item>
      <Form.Item wrapperCol={{ offset: 6, span: 18 }}>
        <Button type="primary" htmlType="submit">
          {editingResort ? 'Update Resort' : 'Add Resort'}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default ResortForm;
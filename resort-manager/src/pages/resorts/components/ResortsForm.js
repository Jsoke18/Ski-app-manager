import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Upload } from 'antd';
import { InboxOutlined } from '@ant-design/icons';

const { Dragger } = Upload;

const ResortForm = ({ editingResort, onUpdateResort, isAddingResort }) => {
  const [form] = Form.useForm();
  const [geoJSONFile, setGeoJSONFile] = useState(null);

  useEffect(() => {
    if (editingResort) {
      form.setFieldsValue(editingResort);
    } else {
      form.resetFields();
    }
  }, [editingResort, form]);

  const onFinish = (values) => {
    console.log('Form values:', values);
    const formData = new FormData();
    formData.append('name', values.name);
    formData.append('province', values.province);
    formData.append('information', values.information);
    formData.append('longestRun', values.longestRun);
    formData.append('baseElevation', values.baseElevation);
    formData.append('topElevation', values.topElevation);
    formData.append('totalLifts', values.totalLifts);
    formData.append('notes', values.notes);
    formData.append('image', values.image);
    if (geoJSONFile) {
      formData.append('geoJSONFile', geoJSONFile);
    }
  
    if (editingResort) {
      formData.append('_id', editingResort._id); // Pass the resort ID when updating
      onUpdateResort(formData);
    } else {
      onUpdateResort(formData);
    }
  
    form.resetFields();
    setGeoJSONFile(null);
  };

  const geoJSONProps = {
    name: 'geoJSONFile',
    multiple: false,
    accept: '.geojson',
    beforeUpload: (file) => {
      setGeoJSONFile(file);
      return false; // Do not upload the file immediately
    },
    onRemove: () => {
      setGeoJSONFile(null);
    },
  };

  return (
    <Form form={form} onFinish={onFinish} labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
      <Form.Item name="name" label="Resort Name" rules={[{ required: true }]}>
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
      <Form.Item name="geoJSONFile" label="GeoJSON File" valuePropName="file">
        <Dragger {...geoJSONProps}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">Click or drag a GeoJSON file to this area to upload</p>
        </Dragger>
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
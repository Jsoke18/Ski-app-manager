import React, { useEffect } from "react";
import { Form, Input, Button, InputNumber, Switch, Select, Tag, Space, Upload } from "antd";
import { MinusCircleOutlined, PlusOutlined, InboxOutlined } from "@ant-design/icons";

const { Option } = Select;
const { TextArea } = Input;
const { Dragger } = Upload;

const SkiPassForm = ({ editingSkiPass, onSubmit, onCancel }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (editingSkiPass) {
      form.setFieldsValue({
        ...editingSkiPass,
        blackoutDates: editingSkiPass.restrictions?.blackoutDates || [],
        limitedDays: editingSkiPass.restrictions?.limitedDays,
        advanceReservation: editingSkiPass.restrictions?.advanceReservation || false,
        adultPrice: editingSkiPass.price?.adult,
        childPrice: editingSkiPass.price?.child,
        seniorPrice: editingSkiPass.price?.senior,
        studentPrice: editingSkiPass.price?.student,
        benefits: editingSkiPass.benefits || [],
      });
    } else {
      form.resetFields();
    }
  }, [editingSkiPass, form]);

  const onFinish = (values) => {
    console.log("SkiPass form values:", values);
    
    const skiPassData = {
      name: values.name,
      description: values.description,
      website: values.website,
      price: {
        adult: values.adultPrice,
        child: values.childPrice,
        senior: values.seniorPrice,
        student: values.studentPrice,
      },
      season: values.season,
      passType: values.passType,
      restrictions: {
        blackoutDates: values.blackoutDates || [],
        limitedDays: values.limitedDays,
        advanceReservation: values.advanceReservation || false,
      },
      benefits: values.benefits || [],
      isActive: values.isActive !== undefined ? values.isActive : true,
      logo: values.logo,
      color: values.color,
    };

    // Handle image upload
    let imageFile = null;
    if (values.image && values.image.fileList && values.image.fileList[0]) {
      imageFile = values.image.fileList[0].originFileObj;
      console.log("Image file found:", imageFile);
    } else {
      console.log("No image file found in form values");
    }

    console.log("Submitting ski pass data:", skiPassData);
    console.log("Image file:", imageFile);

    onSubmit(skiPassData, imageFile);
    if (!editingSkiPass) {
      form.resetFields();
    }
  };

  return (
    <Form
      form={form}
      onFinish={onFinish}
      labelCol={{ span: 6 }}
      wrapperCol={{ span: 18 }}
      initialValues={{
        isActive: true,
        advanceReservation: false,
        passType: 'multi-resort',
      }}
    >
      <Form.Item name="name" label="Pass Name" rules={[{ required: true }]}>
        <Input />
      </Form.Item>

      <Form.Item name="description" label="Description" rules={[{ required: true }]}>
        <TextArea rows={3} />
      </Form.Item>

      <Form.Item name="website" label="Website">
        <Input />
      </Form.Item>

      <Form.Item name="season" label="Season" rules={[{ required: true }]}>
        <Input placeholder="e.g., 2024-2025" />
      </Form.Item>

      <Form.Item name="passType" label="Pass Type" rules={[{ required: true }]}>
        <Select>
          <Option value="multi-resort">Multi-Resort</Option>
          <Option value="single-resort">Single Resort</Option>
          <Option value="limited">Limited</Option>
          <Option value="day-pass">Day Pass</Option>
        </Select>
      </Form.Item>

      {/* Price Section */}
      <Form.Item label="Pricing">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Form.Item name="adultPrice" label="Adult Price" style={{ marginBottom: 8 }}>
            <InputNumber
              min={0}
              style={{ width: '100%' }}
              formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
            />
          </Form.Item>
          <Form.Item name="childPrice" label="Child Price" style={{ marginBottom: 8 }}>
            <InputNumber
              min={0}
              style={{ width: '100%' }}
              formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
            />
          </Form.Item>
          <Form.Item name="seniorPrice" label="Senior Price" style={{ marginBottom: 8 }}>
            <InputNumber
              min={0}
              style={{ width: '100%' }}
              formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
            />
          </Form.Item>
          <Form.Item name="studentPrice" label="Student Price" style={{ marginBottom: 0 }}>
            <InputNumber
              min={0}
              style={{ width: '100%' }}
              formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
            />
          </Form.Item>
        </Space>
      </Form.Item>

      {/* Restrictions Section */}
      <Form.Item label="Restrictions">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Form.Item name="limitedDays" label="Limited Days" style={{ marginBottom: 8 }}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="advanceReservation" label="Advance Reservation Required" valuePropName="checked" style={{ marginBottom: 0 }}>
            <Switch />
          </Form.Item>
        </Space>
      </Form.Item>

      {/* Blackout Dates */}
      <Form.List name="blackoutDates">
        {(fields, { add, remove }) => (
          <Form.Item label="Blackout Dates">
            {fields.map(({ key, name, ...restField }) => (
              <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                <Form.Item
                  {...restField}
                  name={name}
                  rules={[{ required: true, message: 'Missing blackout date' }]}
                  style={{ marginBottom: 0 }}
                >
                  <Input placeholder="e.g., Dec 26 - Jan 1" />
                </Form.Item>
                <MinusCircleOutlined onClick={() => remove(name)} />
              </Space>
            ))}
            <Form.Item style={{ marginBottom: 0 }}>
              <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                Add Blackout Date
              </Button>
            </Form.Item>
          </Form.Item>
        )}
      </Form.List>

      {/* Benefits */}
      <Form.List name="benefits">
        {(fields, { add, remove }) => (
          <Form.Item label="Benefits">
            {fields.map(({ key, name, ...restField }) => (
              <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                <Form.Item
                  {...restField}
                  name={name}
                  rules={[{ required: true, message: 'Missing benefit' }]}
                  style={{ marginBottom: 0 }}
                >
                  <Input placeholder="Enter benefit" />
                </Form.Item>
                <MinusCircleOutlined onClick={() => remove(name)} />
              </Space>
            ))}
            <Form.Item style={{ marginBottom: 0 }}>
              <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                Add Benefit
              </Button>
            </Form.Item>
          </Form.Item>
        )}
      </Form.List>

      <Form.Item name="logo" label="Logo URL">
        <Input />
      </Form.Item>

      <Form.Item name="color" label="Brand Color">
        <Input placeholder="#00A859" />
      </Form.Item>

      <Form.Item name="image" label="Logo/Image" valuePropName="file">
        {editingSkiPass && editingSkiPass.imageUrl && (
          <div style={{ marginBottom: 16 }}>
            <img
              src={editingSkiPass.imageUrl}
              alt="Current logo"
              style={{
                width: 100,
                height: 100,
                objectFit: 'cover',
                border: '1px solid #d9d9d9',
                borderRadius: '6px',
              }}
            />
            <p style={{ fontSize: '12px', color: '#666', marginTop: 8 }}>
              Current image (upload a new one to replace)
            </p>
          </div>
        )}
        <Dragger
          name="image"
          accept="image/*"
          beforeUpload={() => false}
          maxCount={1}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">
            Click or drag an image file to this area to upload
          </p>
          <p className="ant-upload-hint">
            Support for single upload. Only image files are accepted.
          </p>
        </Dragger>
      </Form.Item>

      <Form.Item name="isActive" label="Active" valuePropName="checked">
        <Switch />
      </Form.Item>

      <Form.Item wrapperCol={{ offset: 6, span: 18 }}>
        <Space>
          <Button type="primary" htmlType="submit">
            {editingSkiPass ? "Update Ski Pass" : "Add Ski Pass"}
          </Button>
          {onCancel && (
            <Button onClick={onCancel}>
              Cancel
            </Button>
          )}
        </Space>
      </Form.Item>
    </Form>
  );
};

export default SkiPassForm; 
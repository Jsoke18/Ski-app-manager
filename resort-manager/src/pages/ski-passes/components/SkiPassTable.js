import React from "react";
import { Table, Button, Space, Popconfirm, Tag, Tooltip, Avatar } from "antd";
import { EditOutlined, DeleteOutlined, EyeOutlined, GlobalOutlined } from "@ant-design/icons";

const SkiPassTable = ({ skiPasses, onEdit, onDelete, loading }) => {
  const formatPrice = (price) => {
    if (!price || price === null) return 'N/A';
    return `$${price.toLocaleString()}`;
  };

  const formatBlackoutDates = (dates) => {
    if (!dates || dates.length === 0) return 'None';
    return dates.map((date, index) => (
      <Tag key={index} color="red" style={{ marginBottom: 4 }}>
        {date}
      </Tag>
    ));
  };

  const formatBenefits = (benefits) => {
    if (!benefits || benefits.length === 0) return 'None';
    return benefits.slice(0, 2).map((benefit, index) => (
      <Tag key={index} color="blue" style={{ marginBottom: 4 }}>
        {benefit.length > 30 ? `${benefit.substring(0, 30)}...` : benefit}
      </Tag>
    ));
  };

  const columns = [
    {
      title: 'Pass Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          {(record.imageUrl || record.logo) && (
            <Avatar 
              src={record.imageUrl || record.logo} 
              size={32}
              style={{ backgroundColor: record.color || '#f56a00' }}
            >
              {text.charAt(0)}
            </Avatar>
          )}
          <div>
            <div style={{ fontWeight: 'bold', color: record.color || '#1890ff' }}>
              {text}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {record.season}
            </div>
          </div>
        </Space>
      ),
      width: 200,
    },
    {
      title: 'Type',
      dataIndex: 'passType',
      key: 'passType',
      render: (type) => {
        const colors = {
          'multi-resort': 'green',
          'single-resort': 'blue',
          'limited': 'orange',
          'day-pass': 'purple'
        };
        return <Tag color={colors[type] || 'default'}>{type}</Tag>;
      },
      width: 120,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text) => (
        <Tooltip title={text}>
          <div style={{ maxWidth: 200 }}>
            {text && text.length > 100 ? `${text.substring(0, 100)}...` : text}
          </div>
        </Tooltip>
      ),
      width: 220,
    },
    {
      title: 'Pricing',
      key: 'pricing',
      render: (_, record) => (
        <div>
          <div><strong>Adult:</strong> {formatPrice(record.price?.adult)}</div>
          {record.price?.child && <div><strong>Child:</strong> {formatPrice(record.price.child)}</div>}
          {record.price?.senior && <div><strong>Senior:</strong> {formatPrice(record.price.senior)}</div>}
          {record.price?.student && <div><strong>Student:</strong> {formatPrice(record.price.student)}</div>}
        </div>
      ),
      width: 150,
    },
    {
      title: 'Restrictions',
      key: 'restrictions',
      render: (_, record) => (
        <div>
          {record.restrictions?.limitedDays && (
            <div><strong>Limited Days:</strong> {record.restrictions.limitedDays}</div>
          )}
          {record.restrictions?.advanceReservation && (
            <Tag color="warning">Advance Reservation Required</Tag>
          )}
          <div style={{ marginTop: 4 }}>
            <strong>Blackout Dates:</strong>
            <div>{formatBlackoutDates(record.restrictions?.blackoutDates)}</div>
          </div>
        </div>
      ),
      width: 200,
    },
    {
      title: 'Benefits',
      dataIndex: 'benefits',
      key: 'benefits',
      render: (benefits) => (
        <div>
          {formatBenefits(benefits)}
          {benefits && benefits.length > 2 && (
            <Tag>+{benefits.length - 2} more</Tag>
          )}
        </div>
      ),
      width: 180,
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
      width: 80,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          {record.website && (
            <Tooltip title="Visit Website">
              <Button
                type="link"
                icon={<GlobalOutlined />}
                size="small"
                onClick={() => window.open(record.website, '_blank')}
              />
            </Tooltip>
          )}
          <Tooltip title="Edit">
            <Button
              type="link"
              icon={<EditOutlined />}
              size="small"
              onClick={() => onEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Are you sure you want to delete this ski pass?"
            onConfirm={() => onDelete(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete">
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
                size="small"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
      width: 120,
      fixed: 'right',
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={skiPasses}
      rowKey="_id"
      loading={loading}
      scroll={{ x: 1400 }}
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) =>
          `${range[0]}-${range[1]} of ${total} ski passes`,
      }}
      size="middle"
    />
  );
};

export default SkiPassTable; 
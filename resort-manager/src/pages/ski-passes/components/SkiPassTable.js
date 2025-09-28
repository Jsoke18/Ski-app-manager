import React from "react";
import { Table, Button, Popconfirm, Tag, Avatar } from "antd";
import { EditOutlined, DeleteOutlined, GlobalOutlined } from "@ant-design/icons";

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
      title: 'Pass Details',
      dataIndex: 'name',
      key: 'name',
      fixed: 'left',
      width: 250,
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0' }}>
          <Avatar 
            src={record.imageUrl || record.logo} 
            size={48}
            style={{ 
              backgroundColor: record.color || '#1890ff',
              flexShrink: 0,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            {text.charAt(0)}
          </Avatar>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ 
              fontWeight: 'bold', 
              color: record.color || '#1890ff',
              fontSize: '14px',
              marginBottom: '4px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {text}
            </div>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>
              Season: {record.season || 'N/A'}
            </div>
            <Tag 
              color={record.isActive ? 'green' : 'red'} 
              size="small"
              style={{ margin: 0 }}
            >
              {record.isActive ? 'Active' : 'Inactive'}
            </Tag>
          </div>
        </div>
      ),
    },
    {
      title: 'Type & Description',
      key: 'typeDescription',
      width: 280,
      render: (_, record) => {
        const colors = {
          'multi-resort': 'green',
          'single-resort': 'blue',
          'limited': 'orange',
          'day-pass': 'purple'
        };
        return (
          <div style={{ padding: '4px 0' }}>
            <div style={{ marginBottom: '8px' }}>
              <Tag color={colors[record.passType] || 'default'} style={{ fontSize: '11px' }}>
                {record.passType || 'Standard'}
              </Tag>
            </div>
            <div style={{ 
              fontSize: '13px',
              lineHeight: '1.4',
              color: '#333',
              wordWrap: 'break-word',
              maxHeight: '60px',
              overflow: 'hidden'
            }}>
              {record.description || 'No description available'}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Pricing',
      key: 'pricing',
      width: 180,
      render: (_, record) => (
        <div style={{ padding: '4px 0' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr',
            gap: '4px',
            fontSize: '12px'
          }}>
            <div style={{ padding: '2px 0' }}>
              <span style={{ color: '#666', fontWeight: '500' }}>Adult:</span>
              <div style={{ fontWeight: 'bold', color: '#1890ff' }}>
                {formatPrice(record.price?.adult)}
              </div>
            </div>
            {record.price?.child && (
              <div style={{ padding: '2px 0' }}>
                <span style={{ color: '#666', fontWeight: '500' }}>Child:</span>
                <div style={{ fontWeight: 'bold', color: '#52c41a' }}>
                  {formatPrice(record.price.child)}
                </div>
              </div>
            )}
            {record.price?.senior && (
              <div style={{ padding: '2px 0' }}>
                <span style={{ color: '#666', fontWeight: '500' }}>Senior:</span>
                <div style={{ fontWeight: 'bold', color: '#fa8c16' }}>
                  {formatPrice(record.price.senior)}
                </div>
              </div>
            )}
            {record.price?.student && (
              <div style={{ padding: '2px 0' }}>
                <span style={{ color: '#666', fontWeight: '500' }}>Student:</span>
                <div style={{ fontWeight: 'bold', color: '#722ed1' }}>
                  {formatPrice(record.price.student)}
                </div>
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Restrictions & Benefits',
      key: 'restrictionsBenefits',
      width: 320,
      render: (_, record) => (
        <div style={{ padding: '4px 0' }}>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#666', marginBottom: '6px' }}>
              Restrictions
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {record.restrictions?.limitedDays && (
                <div style={{ fontSize: '11px' }}>
                  <span style={{ color: '#666' }}>Limited Days:</span> {record.restrictions.limitedDays}
                </div>
              )}
              {record.restrictions?.advanceReservation && (
                <Tag color="warning" size="small" style={{ alignSelf: 'flex-start' }}>
                  Advance Reservation Required
                </Tag>
              )}
              {record.restrictions?.blackoutDates && record.restrictions.blackoutDates.length > 0 && (
                <div>
                  <div style={{ fontSize: '11px', color: '#666', marginBottom: '2px' }}>Blackout Dates:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
                    {formatBlackoutDates(record.restrictions.blackoutDates)}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#666', marginBottom: '6px' }}>
              Benefits
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {record.benefits && record.benefits.length > 0 ? (
                <>
                  {formatBenefits(record.benefits)}
                  {record.benefits.length > 2 && (
                    <Tag size="small" style={{ alignSelf: 'flex-start', marginTop: '2px' }}>
                      +{record.benefits.length - 2} more
                    </Tag>
                  )}
                </>
              ) : (
                <span style={{ fontSize: '11px', color: '#999', fontStyle: 'italic' }}>
                  No benefits listed
                </span>
              )}
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
      render: (_, record) => (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '6px',
          padding: '4px 0'
        }}>
          {record.website && (
            <Button
              type="primary"
              size="small"
              icon={<GlobalOutlined />}
              onClick={() => window.open(record.website, '_blank')}
              style={{ fontSize: '11px' }}
              block
            >
              Visit Site
            </Button>
          )}
          <Button
            type="default"
            size="small"
            icon={<EditOutlined />}
            onClick={() => onEdit(record)}
            style={{ fontSize: '11px' }}
            block
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this ski pass?"
            onConfirm={() => onDelete(record._id)}
            okText="Yes"
            cancelText="No"
            placement="topRight"
          >
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
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

  return (
    <Table
      columns={columns}
      dataSource={skiPasses}
      rowKey="_id"
      loading={loading}
      scroll={{ 
        x: 1200,
        y: 'calc(100vh - 300px)'
      }}
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) =>
          `${range[0]}-${range[1]} of ${total} ski passes`,
        pageSizeOptions: ['10', '20', '50'],
      }}
      size="middle"
      style={{
        background: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}
    />
  );
};

export default SkiPassTable; 
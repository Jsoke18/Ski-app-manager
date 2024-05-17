import React, { useState, useEffect } from 'react';
import { Typography, Alert, Row, Col, Button } from 'antd';
import ResortForm from './components/ResortsForm';
import ResortTable from './components/ResortsTable';
import { fetchResorts, addResort, updateResort } from '../../services/resortService';

const { Title } = Typography;

const ResortsPage = () => {
  const [resorts, setResorts] = useState([]);
  const [error, setError] = useState(null);
  const [editingResort, setEditingResort] = useState(null);

  useEffect(() => {
    fetchResorts()
      .then((data) => setResorts(data))
      .catch((error) => {
        console.error('Error fetching resorts:', error);
        setError('Failed to fetch resorts. Please try again.');
      });
  }, []);

  const handleAddResort = async (newResort) => {
    try {
      const addedResort = await addResort(newResort);
      console.log('Resort added:', addedResort);
      setResorts([...resorts, addedResort]);
    } catch (error) {
      console.error('Error adding resort:', error);
      setError('Failed to add resort. Please try again.');
    }
  };

  const handleEdit = (resort) => {
    setEditingResort(resort);
  };

  return (
    <div>
      {error && <Alert message={error} type="error" closable />}
      <Row gutter={16}>
        <Col span={editingResort ? 12 : 24}>
          <Title level={2}>Resorts</Title>
          <ResortTable data={resorts} setData={setResorts} handleEdit={handleEdit} />
        </Col>
        {editingResort && (
          <Col span={12}>
            <Title level={2}>Edit Resort</Title>
            <ResortForm
              editingResort={editingResort}
              onUpdateResort={(updatedResort) => {
                const updatedResorts = resorts.map((resort) =>
                  resort._id === updatedResort._id ? updatedResort : resort
                );
                setResorts(updatedResorts);
                setEditingResort(null);
              }}
            />
          </Col>
        )}
      </Row>
    </div>
  );
};

export default ResortsPage;
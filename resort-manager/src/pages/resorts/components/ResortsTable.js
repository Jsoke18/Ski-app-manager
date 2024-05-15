import React, { useState, useEffect } from 'react';
import { Table, Button, Modal } from 'antd';
import ResortForm from './ResortsForm';
import { fetchResorts, addResort, updateResort } from '../../../services/resortService';

const ResortTable = ({ data, setData }) => {
  const [editingResort, setEditingResort] = useState(null);
  const [isAddingResort, setIsAddingResort] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const columns = [
    { title: 'Resort Name', dataIndex: 'name', key: 'name' },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      render: (location) => `${location.coordinates[0]}, ${location.coordinates[1]}`,
    },
    { title: 'Country', dataIndex: 'country', key: 'country' },
    { title: 'Province', dataIndex: 'province', key: 'province' },
    { title: 'Longest Run', dataIndex: 'longestRun', key: 'longestRun' },
    { title: 'Base Elevation', dataIndex: 'baseElevation', key: 'baseElevation' },
    { title: 'Top Elevation', dataIndex: 'topElevation', key: 'topElevation' },
    { title: 'Total Lifts', dataIndex: 'totalLifts', key: 'totalLifts' },
    {
      title: 'Actions',
      key: 'actions',
      render: (text, record) => (
        <Button type="link" onClick={() => setEditingResort(record)}>
          Edit
        </Button>
      ),
    },
  ];
  const handleCloseModal = () => {
    setEditingResort(null);
    setIsAddingResort(false);
    setModalVisible(false);
  };

  const handleAddResort = async (newResort) => {
    try {
      const addedResort = await addResort(newResort);
      // You may want to update the data source with the added resort
      // or fetch the updated data from the server
      console.log('Added resort:', addedResort);
      handleCloseModal();
    } catch (error) {
      console.error('Error adding resort:', error);
    }
  };
  const handleUpdateResort = async (updatedResort) => {
    try {
      const response = await updateResort(updatedResort);
      console.log('Updated resort:', response);
      // Update the data source with the updated resort
      const updatedData = data.map((resort) =>
        resort._id === updatedResort._id ? response : resort
      );
      setData(updatedData);
      handleCloseModal();
    } catch (error) {
      console.error('Error updating resort:', error);
    }
  };

  const handleEditResort = (resort) => {
    setEditingResort(resort);
    setIsAddingResort(false);
    setModalVisible(true);
  };

  useEffect(() => {
    setModalVisible(!!editingResort || isAddingResort);
  }, [editingResort, isAddingResort]);

  const tableTitle = () => (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span>Resorts</span>
      <Button type="primary" onClick={() => setIsAddingResort(true)}>
        Add Resort
      </Button>
    </div>
  );

  return (
    <>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="_id"
        title={tableTitle}
      />
      <Modal
        title={editingResort ? 'Edit Resort' : 'Add Resort'}
        visible={modalVisible}
        onCancel={handleCloseModal}
        footer={null}
        width={800}
        bodyStyle={{ paddingTop: 24 }}
      >
        <ResortForm
          editingResort={editingResort || null}
          isAddingResort={!editingResort}
          onUpdateResort={(updatedResort) => {
            if (editingResort) {
              handleUpdateResort(updatedResort);
            } else {
              handleAddResort(updatedResort);
            }
            handleCloseModal();
          }}
        />
      </Modal>
    </>
  );
};

export default ResortTable;
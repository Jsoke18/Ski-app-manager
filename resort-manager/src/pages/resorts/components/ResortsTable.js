import React, { useState, useEffect } from "react";
import { Table, Button, Modal, message } from "antd";
import ResortForm from "./ResortsForm";
import {
  fetchResorts,
  addResort,
  updateResort,
  deleteResort,
} from "../../../services/resortService";

const ResortTable = ({ data, setData }) => {
  const [editingResort, setEditingResort] = useState(null);
  const [isAddingResort, setIsAddingResort] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const columns = [
    {
      title: "Resort",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <div style={{ display: "flex", alignItems: "center" }}>
          {record.imageUrl && (
            <img
              src={record.imageUrl}
              alt={record.name}
              style={{ width: 50, height: 50, marginRight: 8, objectFit: "cover" }}
            />
          )}
          <span>{text}</span>
        </div>
      ),
    },
    {
      title: "Location",
      dataIndex: "location",
      key: "location",
      render: (location) =>
        location && location.coordinates
          ? `${location.coordinates[0]}, ${location.coordinates[1]}`
          : "",
    },
    { title: "Country", dataIndex: "country", key: "country" },
    { title: "Province", dataIndex: "province", key: "province" },
    { title: "Skiable Terrain", dataIndex: "skiable_terrain", key: "skiable_terrain" },
    { title: "Longest Run", dataIndex: "longestRun", key: "longestRun" },
    {
      title: "Runs",
      dataIndex: "runs",
      key: "runs",
      render: (runs) => `${runs.open || 0} / ${runs.total || 0}`,
    },
    {
      title: "Base Elevation",
      dataIndex: "baseElevation",
      key: "baseElevation",
    },
    { title: "Top Elevation", dataIndex: "topElevation", key: "topElevation" },
    {
      title: 'Lifts',
      dataIndex: 'lifts',
      key: 'lifts',
      render: (lifts) => `${lifts.open || 0} / ${lifts.total || 0}`,
    },
    {
      title: "Actions",
      key: "actions",
      render: (text, record) => (
        <>
          <Button type="link" onClick={() => setEditingResort(record)}>
            Edit
          </Button>
          <Button type="link" onClick={() => handleDeleteResort(record._id)}>
            Delete
          </Button>
        </>
      ),
    },
  ];
  const handleCloseModal = () => {
    setEditingResort(null);
    setIsAddingResort(false);
    setModalVisible(false);
  };
  const handleDeleteResort = async (resortId) => {
    try {
      const response = await deleteResort(resortId);
      if (response && response.data) {
        // Remove the deleted resort from the data source
        const updatedData = data.filter((resort) => resort._id !== resortId);
        setData(updatedData);
        message.success("Resort deleted successfully");
      } else {
        message.error("Failed to delete resort");
      }
    } catch (error) {
      console.error("Error deleting resort:", error);
      if (error.response && error.response.data && error.response.data.error) {
        message.error(error.response.data.error);
      } else {
        message.error("An error occurred while deleting the resort");
      }
    }
  };

  const handleAddResort = async (formData) => {
    try {
      const addedResort = await addResort(formData);
      console.log("Added resort:", addedResort);
      // Update the data state with the newly added resort
      setData([...data, addedResort.data]); // Assuming the response contains the added resort data
      handleCloseModal();
      message.success("Resort added successfully");
    } catch (error) {
      console.error("Error adding resort:", error);
      if (error.response && error.response.data && error.response.data.error) {
        message.error(error.response.data.error);
      } else {
        message.error("An error occurred while adding the resort");
      }
    }
  };

  const handleUpdateResort = async (updatedResort) => {
    try {
      const response = await updateResort(updatedResort);
      console.log("Updated resort:", response);
      if (response && response.data) {
        // Update the data source with the updated resort
        const updatedData = data.map((resort) =>
          resort._id === response.data._id ? response.data : resort
        );
        setData(updatedData);
        handleCloseModal();
        message.success("Resort updated successfully");
      } else {
        message.error("Failed to update resort");
      }
    } catch (error) {
      console.error("Error updating resort:", error);
      if (error.response && error.response.data && error.response.data.error) {
        message.error(error.response.data.error);
      } else {
        message.error("An error occurred while updating the resort");
      }
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
    <div style={{ display: "flex", justifyContent: "space-between" }}>
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
        title={editingResort ? "Edit Resort" : "Add Resort"}
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

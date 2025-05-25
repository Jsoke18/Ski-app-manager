import React, { useState, useEffect } from "react";
import { Typography, Alert, Row, Col, Button, message, Card, Space } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import SkiPassForm from "./components/SkiPassForm";
import SkiPassTable from "./components/SkiPassTable";
import {
  fetchSkiPasses,
  addSkiPass,
  updateSkiPass,
  deleteSkiPass,
} from "../../services/skiPassService";

const { Title } = Typography;

const SkiPassPage = () => {
  const [skiPasses, setSkiPasses] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingSkiPass, setEditingSkiPass] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadSkiPasses();
  }, []);

  const loadSkiPasses = async () => {
    try {
      setLoading(true);
      const data = await fetchSkiPasses();
      setSkiPasses(data);
      setError(null);
    } catch (error) {
      console.error("Error fetching ski passes:", error);
      setError("Failed to fetch ski passes. Please try again.");
      message.error("Failed to load ski passes");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkiPass = async (skiPassData, imageFile) => {
    try {
      const newSkiPass = await addSkiPass(skiPassData, imageFile);
      setSkiPasses([...skiPasses, newSkiPass]);
      setShowForm(false);
      message.success("Ski pass added successfully");
      setError(null);
    } catch (error) {
      console.error("Error adding ski pass:", error);
      message.error("Failed to add ski pass. Please try again.");
    }
  };

  const handleUpdateSkiPass = async (skiPassData, imageFile) => {
    try {
      const updatedSkiPass = await updateSkiPass(editingSkiPass._id, skiPassData, imageFile);
      const updatedSkiPasses = skiPasses.map((pass) =>
        pass._id === editingSkiPass._id ? updatedSkiPass : pass
      );
      setSkiPasses(updatedSkiPasses);
      setEditingSkiPass(null);
      setShowForm(false);
      message.success("Ski pass updated successfully");
      setError(null);
    } catch (error) {
      console.error("Error updating ski pass:", error);
      message.error("Failed to update ski pass. Please try again.");
    }
  };

  const handleDeleteSkiPass = async (skiPassId) => {
    try {
      await deleteSkiPass(skiPassId);
      const updatedSkiPasses = skiPasses.filter((pass) => pass._id !== skiPassId);
      setSkiPasses(updatedSkiPasses);
      message.success("Ski pass deleted successfully");
      setError(null);
    } catch (error) {
      console.error("Error deleting ski pass:", error);
      message.error("Failed to delete ski pass. Please try again.");
    }
  };

  const handleEdit = (skiPass) => {
    setEditingSkiPass(skiPass);
    setShowForm(true);
  };

  const handleAddNew = () => {
    setEditingSkiPass(null);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setEditingSkiPass(null);
    setShowForm(false);
  };

  const handleFormSubmit = (skiPassData, imageFile) => {
    if (editingSkiPass) {
      handleUpdateSkiPass(skiPassData, imageFile);
    } else {
      handleAddSkiPass(skiPassData, imageFile);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2} style={{ margin: 0 }}>
              Ski Pass Management
            </Title>
            <p style={{ color: '#666', marginTop: 8 }}>
              Manage ski passes and their details
            </p>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddNew}
              size="large"
            >
              Add Ski Pass
            </Button>
          </Col>
        </Row>
      </div>

      {error && (
        <Alert
          message={error}
          type="error"
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: 24 }}
        />
      )}

      <Row gutter={[24, 24]}>
        <Col span={showForm ? 14 : 24}>
          <Card>
            <SkiPassTable
              skiPasses={skiPasses}
              onEdit={handleEdit}
              onDelete={handleDeleteSkiPass}
              loading={loading}
            />
          </Card>
        </Col>
        {showForm && (
          <Col span={10}>
            <Card 
              title={editingSkiPass ? "Edit Ski Pass" : "Add New Ski Pass"}
              extra={
                <Button type="text" onClick={handleCancelForm}>
                  Close
                </Button>
              }
            >
              <SkiPassForm
                editingSkiPass={editingSkiPass}
                onSubmit={handleFormSubmit}
                onCancel={handleCancelForm}
              />
            </Card>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default SkiPassPage; 
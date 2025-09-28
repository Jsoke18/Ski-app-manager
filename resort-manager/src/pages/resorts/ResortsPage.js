import React, { useState, useEffect } from "react";
import { Typography, Alert, message } from "antd";
import ResortForm from "./components/ResortsForm";
import ResortTable from "./components/ResortsTable";
import {
  fetchResorts,
  addResort,
  deleteResort,
} from "../../services/resortService";

const { Title } = Typography;

const ResortsPage = () => {
  const [resorts, setResorts] = useState([]);
  const [error, setError] = useState(null);
  const [editingResort, setEditingResort] = useState(null);

  useEffect(() => {
    fetchResorts()
      .then((data) => setResorts(data))
      .catch((error) => {
        console.error("Error fetching resorts:", error);
        setError("Failed to fetch resorts. Please try again.");
      });
  }, []);

  const handleAddResort = async (newResort) => {
    try {
      const addedResort = await addResort(newResort);
      console.log("Resort added:", addedResort);
      if (addedResort) {
        setResorts([...resorts, addedResort]);
        setError(null);
      } else {
        setError("Failed to add resort. Please try again.");
      }
    } catch (error) {
      console.error("Error adding resort:", error);
      setError("Failed to add resort. Please try again.");
    }
  };

  const handleEdit = (resort) => {
    setEditingResort(resort);
  };


  const handleDeleteResort = async (resortId) => {
    try {
      const response = await deleteResort(resortId);
      if (response && response.data) {
        const updatedResorts = resorts.filter((resort) => resort._id !== resortId);
        setResorts(updatedResorts);
        message.success("Resort deleted successfully", () => {
          setResorts([...updatedResorts]);
        });
      } else {
        message.error("Failed to delete resort. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting resort:", error);
      message.error("Failed to delete resort. Please try again.");
    }
  };
  return (
    <div style={{ 
      background: '#f5f5f5',
      minHeight: '100vh'
    }}>
      {error && (
        <Alert 
          message={error} 
          type="error" 
          closable 
          style={{ 
            margin: '16px',
            borderRadius: '8px',
            flexShrink: 0
          }}
        />
      )}
      
      {editingResort ? (
        <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px - 70px)' }}>
          <div style={{ 
            flex: '2',
            background: '#fff',
            borderRight: '1px solid #e8e8e8'
          }}>
            <ResortTable
              data={resorts}
              setData={setResorts}
              handleEdit={handleEdit}
              handleAddResort={handleAddResort}
              handleDeleteResort={handleDeleteResort}
            />
          </div>
          <div style={{ 
            flex: '1',
            background: '#fafafa',
            padding: '20px'
          }}>
            <Title level={3} style={{ marginTop: 0, color: '#1f1f1f' }}>
              Edit Resort
            </Title>
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
          </div>
        </div>
      ) : (
        <div style={{ 
          background: '#fff'
        }}>
          <ResortTable
            data={resorts}
            setData={setResorts}
            handleEdit={handleEdit}
            handleAddResort={handleAddResort}
            handleDeleteResort={handleDeleteResort}
          />
        </div>
      )}
    </div>
  );
};

export default ResortsPage;
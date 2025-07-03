import React, { useState, useEffect } from "react";
import { Typography, Alert, Row, Col, Button, message, Spin } from "antd";
import { FlagFilled } from "@ant-design/icons";
import ResortTable from "./components/ResortsTable";
import {
  fetchFlaggedResorts,
} from "../../services/resortService";

const { Title } = Typography;

const FlaggedResortsPage = () => {
  const [flaggedResorts, setFlaggedResorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadFlaggedResorts();
  }, []);

  const loadFlaggedResorts = async () => {
    try {
      setLoading(true);
      const data = await fetchFlaggedResorts();
      setFlaggedResorts(data);
      setError(null);
    } catch (error) {
      console.error("Error fetching flagged resorts:", error);
      setError("Failed to fetch flagged resorts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadFlaggedResorts();
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <p style={{ marginTop: 16 }}>Loading flagged resorts...</p>
      </div>
    );
  }

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col flex="auto">
          <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FlagFilled style={{ color: '#ff4d4f' }} />
            Flagged Resorts
            <span style={{ fontSize: 16, fontWeight: 'normal', color: '#666' }}>
              ({flaggedResorts.length} {flaggedResorts.length === 1 ? 'resort' : 'resorts'})
            </span>
          </Title>
        </Col>
        <Col>
          <Button onClick={handleRefresh} loading={loading}>
            Refresh
          </Button>
        </Col>
      </Row>

      {error && <Alert message={error} type="error" closable style={{ marginBottom: 16 }} />}
      
      {flaggedResorts.length === 0 ? (
        <Alert
          message="No Flagged Resorts"
          description="There are currently no flagged resorts. You can flag resorts from the main resorts page."
          type="info"
          showIcon
        />
      ) : (
        <ResortTable
          data={flaggedResorts}
          setData={setFlaggedResorts}
        />
      )}
    </div>
  );
};

export default FlaggedResortsPage; 
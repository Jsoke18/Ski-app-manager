import React, { useState, useEffect, props, useMemo } from "react";
import { Table, Button, Modal, message, Input, Select, Row, Col, Card, Space, Tag, Switch, Divider } from "antd";
import { SearchOutlined, FilterOutlined, ClearOutlined, CheckOutlined, CloseOutlined } from "@ant-design/icons";
import ResortForm from "./ResortsForm";
import {
  fetchResorts,
  addResort,
  updateResort,
  deleteResort,
} from "../../../services/resortService";

const { Option } = Select;

const ResortTable = ({ data, setData }) => {
  const [editingResort, setEditingResort] = useState(null);
  const [isAddingResort, setIsAddingResort] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Filter states
  const [searchText, setSearchText] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [provinceFilter, setProvinceFilter] = useState("");
  const [skiPassFilter, setSkiPassFilter] = useState(""); // "all", "with", "without"
  const [websiteFilter, setWebsiteFilter] = useState(""); // "all", "with", "without"

  // Extract unique values for filter dropdowns
  const uniqueCountries = useMemo(() => {
    const countries = [...new Set(data.map(resort => resort.country).filter(Boolean))];
    return countries.sort();
  }, [data]);

  const uniqueProvinces = useMemo(() => {
    const provinces = [...new Set(data.map(resort => resort.province).filter(Boolean))];
    return provinces.sort();
  }, [data]);

  // Filter the data based on all filter criteria
  const filteredData = useMemo(() => {
    return data.filter(resort => {
      // Search text filter (searches name, country, province, information)
      const searchMatch = !searchText || 
        resort.name?.toLowerCase().includes(searchText.toLowerCase()) ||
        resort.country?.toLowerCase().includes(searchText.toLowerCase()) ||
        resort.province?.toLowerCase().includes(searchText.toLowerCase()) ||
        resort.information?.toLowerCase().includes(searchText.toLowerCase()) ||
        resort.longestRun?.toLowerCase().includes(searchText.toLowerCase());

      // Country filter
      const countryMatch = !countryFilter || resort.country === countryFilter;

      // Province filter
      const provinceMatch = !provinceFilter || resort.province === provinceFilter;

      // Ski pass filter
      const skiPassMatch = !skiPassFilter || 
        (skiPassFilter === "with" && resort.skiPasses && resort.skiPasses.length > 0) ||
        (skiPassFilter === "without" && (!resort.skiPasses || resort.skiPasses.length === 0));

      // Website filter
      const websiteMatch = !websiteFilter ||
        (websiteFilter === "with" && resort.website && resort.website.trim() !== "") ||
        (websiteFilter === "without" && (!resort.website || resort.website.trim() === ""));

      return searchMatch && countryMatch && provinceMatch && skiPassMatch && websiteMatch;
    });
  }, [data, searchText, countryFilter, provinceFilter, skiPassFilter, websiteFilter]);

  // Clear all filters
  const clearAllFilters = () => {
    setSearchText("");
    setCountryFilter("");
    setProvinceFilter("");
    setSkiPassFilter("");
    setWebsiteFilter("");
  };

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
              style={{
                width: 50,
                height: 50,
                marginRight: 8,
                objectFit: "cover",
              }}
            />
          )}
          <span>{text}</span>
        </div>
      ),
    },
    {
      title: "GeoJSON Data",
      dataIndex: "geoJsonData",
      key: "geoJsonData",
      render: (geoJsonData) => (geoJsonData ? "Yes" : "No"),
    },
    {
      title: "Mapbox Tile URL",
      dataIndex: "mapboxVectorUrl",
      key: "mapboxVectorUrl",
      render: (mapboxVectorUrl) => (mapboxVectorUrl ? "Yes" : "No"),
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
    {
      title: "Website",
      dataIndex: "website",
      key: "website",
      render: (website) => {
        if (!website) {
          return <span style={{ color: '#999' }}>No website</span>;
        }
        return (
          <a 
            href={website} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: '#1890ff' }}
          >
            Visit Website
          </a>
        );
      },
    },
    {
      title: "Skiable Terrain",
      dataIndex: "skiable_terrain",
      key: "skiable_terrain",
    },
    { title: "Longest Run", dataIndex: "longestRun", key: "longestRun" },
    {
      title: "Runs",
      dataIndex: "runs",
      key: "runs",
      render: (runs) => {
        const open = runs?.open || 0;
        const total = runs?.total || 0;
        return `${open} / ${total}`;
      },
    },
    {
      title: "Base Elevation",
      dataIndex: "baseElevation",
      key: "baseElevation",
    },
    { title: "Top Elevation", dataIndex: "topElevation", key: "topElevation" },
    {
      title: "Lifts",
      dataIndex: "lifts",
      key: "lifts",
      render: (lifts) => {
        const open = lifts?.open || 0;
        const total = lifts?.total || 0;
        return `${open} / ${total}`;
      },
    },
    {
      title: "Ski Passes",
      dataIndex: "skiPasses",
      key: "skiPasses",
      render: (skiPasses) => {
        if (!skiPasses || skiPasses.length === 0) {
          return <span style={{ color: '#999' }}>None</span>;
        }
        return (
          <div>
            {skiPasses.slice(0, 2).map((pass, index) => (
              <span
                key={index}
                style={{
                  backgroundColor: pass?.color || '#1890ff',
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  margin: '2px',
                  display: 'inline-block',
                  fontSize: '11px'
                }}
              >
                {typeof pass === 'object' ? pass.name : pass}
              </span>
            ))}
            {skiPasses.length > 2 && (
              <span style={{ fontSize: '11px', color: '#666' }}>
                +{skiPasses.length - 2} more
              </span>
            )}
          </div>
        );
      },
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

  const handleAddResort = async (formData) => {
    try {
      const addedResort = await addResort(formData);
      console.log("Added resort:", addedResort);
  
      if (addedResort && typeof addedResort === 'object' && addedResort.hasOwnProperty('name')) {
        const sanitizedResort = {
          ...addedResort,
          baseElevation: addedResort.baseElevation || '',
          topElevation: addedResort.topElevation || '',
          country: addedResort.country || '',
          province: addedResort.province || '',
          information: addedResort.information || '',
          longestRun: addedResort.longestRun || '',
          imageUrl: addedResort.imageUrl || '',
          runs: addedResort.runs || { open: 0, total: 0 },
          lifts: addedResort.lifts || { open: 0, total: 0 },
          skiable_terrain: addedResort.skiable_terrain || '',
        };
  
        setData((prevData) => [...prevData, sanitizedResort]);
        handleCloseModal();
        message.success("Resort added successfully");
      } else {
        console.log('failed in table');
        console.log('addedResort:', addedResort);
        message.error("Failed to add resort, message from table");
      }
    } catch (error) {
      console.error("Error adding resort:", error);
      if (error.response && error.response.data && error.response.data.error) {
        message.error(error.response.data.error);
      } else {
        message.error("An error occurred while adding the resort");
      }
    }
  };
  const handleDeleteResort = (resortId) => {
    Modal.confirm({
      title: 'Are you sure delete this resort?',
      content: 'Some descriptions',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          const response = await deleteResort(resortId);
          if (response && response.message === 'Resort deleted successfully') {
            const updatedResorts = data.filter((resort) => resort._id !== resortId);
            setData(updatedResorts);
            message.success("Resort deleted successfully", () => {
              setData([...updatedResorts]);
            });
          } else {
            message.error("Failed to delete resort. Please try again.");
          }
        } catch (error) {
          console.error("Error deleting resort:", error);
          message.error("Failed to delete resort. Please try again.");
        }
      },
      onCancel() {
        console.log('Cancel');
      },
    });
  };
  const handleUpdateResort = async (updatedResort) => {
    try {
      const response = await updateResort(updatedResort);
      console.log("Updated resort:", response);
      if (response && response.data) {
        // Update the data source with the updated resort
        setData((prevData) =>
          prevData.map((resort) =>
            resort._id === response.data._id ? response.data : resort
          )
        );
        
        message.success("Resort updated successfully");
        handleCloseModal(); // Close modal after successful update
        return true; // Indicate success
      } else {
        message.error("Failed to update resort");
        return false; // Indicate failure
      }
    } catch (error) {
      console.error("Error updating resort:", error);
      if (error.response && error.response.data && error.response.data.error) {
        message.error(error.response.data.error);
      } else {
        message.error("An error occurred while updating the resort");
      }
      return false; // Indicate failure
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
    <div style={{ marginBottom: 16 }}>
      {/* Main search and add button */}
      <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 12 }}>
        <Col flex="auto">
          <Input
            placeholder="Search resorts by name, location, or description..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            size="large"
            style={{ borderRadius: 8 }}
          />
        </Col>
        <Col>
          <Button type="primary" size="large" onClick={() => setIsAddingResort(true)}>
            Add Resort
          </Button>
        </Col>
      </Row>

      {/* Clean filter controls */}
      <Card size="small" style={{ borderRadius: 8, padding: '12px 16px' }}>
        <Row gutter={[24, 12]} align="middle">
          {/* Location filters */}
          <Col>
            <Space direction="vertical" size={4}>
              <span style={{ fontSize: 12, fontWeight: 500, color: '#666' }}>Location</span>
              <Space wrap size={8}>
                <Select
                  placeholder="Any Country"
                  value={countryFilter}
                  onChange={setCountryFilter}
                  style={{ width: 120 }}
                  size="small"
                  allowClear
                >
                  {uniqueCountries.map(country => (
                    <Option key={country} value={country}>{country}</Option>
                  ))}
                </Select>
                <Select
                  placeholder="Any Province"
                  value={provinceFilter}
                  onChange={setProvinceFilter}
                  style={{ width: 120 }}
                  size="small"
                  allowClear
                >
                  {uniqueProvinces.map(province => (
                    <Option key={province} value={province}>{province}</Option>
                  ))}
                </Select>
              </Space>
            </Space>
          </Col>

          <Divider type="vertical" style={{ height: 40 }} />

          {/* Feature toggles */}
          <Col>
            <Space direction="vertical" size={4}>
              <span style={{ fontSize: 12, fontWeight: 500, color: '#666' }}>Ski Passes</span>
              <Space size={12}>
                <Button
                  size="small"
                  type={skiPassFilter === "with" ? "primary" : "default"}
                  icon={skiPassFilter === "with" ? <CheckOutlined /> : null}
                  onClick={() => setSkiPassFilter(skiPassFilter === "with" ? "" : "with")}
                  style={{ 
                    borderRadius: 6,
                    backgroundColor: skiPassFilter === "with" ? "#52c41a" : undefined,
                    borderColor: skiPassFilter === "with" ? "#52c41a" : undefined
                  }}
                >
                  Has Passes
                </Button>
                <Button
                  size="small"
                  type={skiPassFilter === "without" ? "primary" : "default"}
                  icon={skiPassFilter === "without" ? <CloseOutlined /> : null}
                  onClick={() => setSkiPassFilter(skiPassFilter === "without" ? "" : "without")}
                  style={{ 
                    borderRadius: 6,
                    backgroundColor: skiPassFilter === "without" ? "#ff4d4f" : undefined,
                    borderColor: skiPassFilter === "without" ? "#ff4d4f" : undefined
                  }}
                >
                  No Passes
                </Button>
              </Space>
            </Space>
          </Col>

          <Divider type="vertical" style={{ height: 40 }} />

          {/* Website toggles */}
          <Col>
            <Space direction="vertical" size={4}>
              <span style={{ fontSize: 12, fontWeight: 500, color: '#666' }}>Website</span>
              <Space size={12}>
                <Button
                  size="small"
                  type={websiteFilter === "with" ? "primary" : "default"}
                  icon={websiteFilter === "with" ? <CheckOutlined /> : null}
                  onClick={() => setWebsiteFilter(websiteFilter === "with" ? "" : "with")}
                  style={{ 
                    borderRadius: 6,
                    backgroundColor: websiteFilter === "with" ? "#1890ff" : undefined,
                    borderColor: websiteFilter === "with" ? "#1890ff" : undefined
                  }}
                >
                  Has Website
                </Button>
                <Button
                  size="small"
                  type={websiteFilter === "without" ? "primary" : "default"}
                  icon={websiteFilter === "without" ? <CloseOutlined /> : null}
                  onClick={() => setWebsiteFilter(websiteFilter === "without" ? "" : "without")}
                  style={{ 
                    borderRadius: 6,
                    backgroundColor: websiteFilter === "without" ? "#ff4d4f" : undefined,
                    borderColor: websiteFilter === "without" ? "#ff4d4f" : undefined
                  }}
                >
                  No Website
                </Button>
              </Space>
            </Space>
          </Col>

          {/* Clear and results */}
          <Col flex="auto" style={{ textAlign: 'right' }}>
            <Space direction="vertical" size={4} style={{ alignItems: 'flex-end' }}>
              <div style={{ fontSize: 13, color: '#666' }}>
                <strong>{filteredData.length}</strong> of <strong>{data.length}</strong> resorts
              </div>
              {(searchText || countryFilter || provinceFilter || skiPassFilter || websiteFilter) && (
                <Button 
                  size="small"
                  icon={<ClearOutlined />}
                  onClick={clearAllFilters}
                  style={{ borderRadius: 6 }}
                >
                  Clear All
                </Button>
              )}
            </Space>
          </Col>
        </Row>

        {/* Active filters summary */}
        {(searchText || countryFilter || provinceFilter || skiPassFilter || websiteFilter) && (
          <Row style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #f0f0f0' }}>
            <Col span={24}>
              <Space wrap size={4}>
                <span style={{ fontSize: 11, color: '#999' }}>Active:</span>
                {searchText && <Tag size="small" color="blue">"{searchText}"</Tag>}
                {countryFilter && <Tag size="small">{countryFilter}</Tag>}
                {provinceFilter && <Tag size="small">{provinceFilter}</Tag>}
                {skiPassFilter === "with" && <Tag size="small" color="green">Has Ski Passes</Tag>}
                {skiPassFilter === "without" && <Tag size="small" color="red">No Ski Passes</Tag>}
                {websiteFilter === "with" && <Tag size="small" color="blue">Has Website</Tag>}
                {websiteFilter === "without" && <Tag size="small" color="red">No Website</Tag>}
              </Space>
            </Col>
          </Row>
        )}
      </Card>
    </div>
  );

  return (
    <>
      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="_id"
        title={tableTitle}
        pagination={{
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} resorts`,
          pageSizeOptions: ['10', '20', '50', '100'],
          defaultPageSize: 20,
        }}
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
          onUpdateResort={async (updatedResort) => {
            if (editingResort) {
              await handleUpdateResort(updatedResort);
              // Modal will be closed by handleUpdateResort if successful
            } else {
              await handleAddResort(updatedResort);
              // Modal is already closed by handleAddResort if successful
            }
          }}
        />
      </Modal>
    </>
  );
};

export default ResortTable;

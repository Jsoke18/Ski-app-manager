import React, { useState, useEffect, props, useMemo } from "react";
import { Table, Button, Modal, message, Input, Select, Row, Col, Card, Space, Tag, Switch, Divider, Typography } from "antd";
import { SearchOutlined, FilterOutlined, ClearOutlined, CheckOutlined, CloseOutlined, EditOutlined, SaveOutlined } from "@ant-design/icons";
import ResortForm from "./ResortsForm";
import {
  fetchResorts,
  addResort,
  updateResort,
  deleteResort,
} from "../../../services/resortService";

const { Option } = Select;
const { Text } = Typography;

const ResortTable = ({ data, setData }) => {
  const [editingResort, setEditingResort] = useState(null);
  const [isAddingResort, setIsAddingResort] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Inline editing states
  const [editingCell, setEditingCell] = useState(null); // { resortId, field }
  const [editingValue, setEditingValue] = useState("");
  const [savingCell, setSavingCell] = useState(false);
  
  // Filter states
  const [searchText, setSearchText] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [provinceFilter, setProvinceFilter] = useState("");
  const [skiPassFilter, setSkiPassFilter] = useState(""); // "all", "with", "without"
  const [websiteFilter, setWebsiteFilter] = useState(""); // "all", "with", "without"

  // Extract unique values for filter dropdowns with counts
  const uniqueCountries = useMemo(() => {
    const countryCount = {};
    data.forEach(resort => {
      if (resort.country) {
        countryCount[resort.country] = (countryCount[resort.country] || 0) + 1;
      }
    });
    
    return Object.keys(countryCount)
      .sort()
      .map(country => ({
        name: country,
        count: countryCount[country]
      }));
  }, [data]);

  const uniqueProvinces = useMemo(() => {
    const provinceCount = {};
    // Filter provinces by selected country if one is selected
    const relevantResorts = countryFilter 
      ? data.filter(resort => resort.country === countryFilter)
      : data;
    
    relevantResorts.forEach(resort => {
      if (resort.province) {
        provinceCount[resort.province] = (provinceCount[resort.province] || 0) + 1;
      }
    });
    
    return Object.keys(provinceCount)
      .sort()
      .map(province => ({
        name: province,
        count: provinceCount[province]
      }));
  }, [data, countryFilter]);

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

  // Inline editing functions
  const startEditing = (resortId, field, currentValue) => {
    setEditingCell({ resortId, field });
    setEditingValue(currentValue || "");
  };

  const cancelEditing = () => {
    setEditingCell(null);
    setEditingValue("");
  };

  const saveInlineEdit = async () => {
    if (!editingCell) return;
    
    setSavingCell(true);
    try {
      const resort = data.find(r => r._id === editingCell.resortId);
      if (!resort) {
        message.error("Resort not found");
        return;
      }

      // Create FormData object for the update (matching the existing API structure)
      const formData = new FormData();
      
      // Add all existing fields to maintain data integrity
      formData.append("_id", resort._id);
      formData.append("name", editingCell.field === 'name' ? editingValue : (resort.name || ""));
      formData.append("province", editingCell.field === 'province' ? editingValue : (resort.province || ""));
      formData.append("country", editingCell.field === 'country' ? editingValue : (resort.country || ""));
      formData.append("website", editingCell.field === 'website' ? editingValue : (resort.website || ""));
      formData.append("information", resort.information || "");
      formData.append("longestRun", editingCell.field === 'longestRun' ? editingValue : (resort.longestRun || ""));
      formData.append("baseElevation", editingCell.field === 'baseElevation' ? editingValue : (resort.baseElevation || ""));
      formData.append("topElevation", editingCell.field === 'topElevation' ? editingValue : (resort.topElevation || ""));
      formData.append("notes", resort.notes || "");
      formData.append("runs", JSON.stringify(resort.runs || { open: 0, total: 0 }));
      formData.append("terrainParks", resort.terrainParks || "");
      formData.append("lifts", JSON.stringify(resort.lifts || { open: 0, total: 0 }));
      formData.append("gondolas", resort.gondolas || "");
      formData.append("skiable_terrain", editingCell.field === 'skiable_terrain' ? editingValue : (resort.skiable_terrain || ""));
      formData.append("snowCats", resort.snowCats || "");
      formData.append("helicopters", resort.helicopters || "");
      formData.append("mapboxVector", resort.mapboxVectorUrl || "");
      
      // Add ski passes if they exist
      if (resort.skiPasses && resort.skiPasses.length > 0) {
        const skiPassIds = resort.skiPasses.map(pass => 
          typeof pass === 'object' ? pass._id : pass
        );
        formData.append("skiPasses", JSON.stringify(skiPassIds));
      }
      
      // Add location if it exists
      if (resort.location) {
        formData.append("location", JSON.stringify(resort.location));
      }
      
      // Preserve existing image if it exists
      if (resort.imageUrl) {
        formData.append("existingImageUrl", resort.imageUrl);
      }

      console.log(`Updating ${editingCell.field} to: "${editingValue}"`);
      console.log("FormData entries:");
      for (const [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
      }

      // Call the update API
      const response = await updateResort(formData);
      
      if (response && response.data) {
        // Update the local data
        setData(prevData => 
          prevData.map(r => 
            r._id === editingCell.resortId 
              ? { ...r, [editingCell.field]: editingValue }
              : r
          )
        );
        
        message.success(`${editingCell.field.charAt(0).toUpperCase() + editingCell.field.slice(1)} updated successfully`);
        cancelEditing();
      } else {
        message.error("Failed to update resort");
      }
    } catch (error) {
      console.error("Error updating resort:", error);
      if (error.response && error.response.data && error.response.data.error) {
        message.error(`Failed to update: ${error.response.data.error}`);
      } else {
        message.error("Failed to update resort");
      }
    } finally {
      setSavingCell(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent form submission
      e.stopPropagation(); // Stop event bubbling
      saveInlineEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      cancelEditing();
    }
  };

  // Inline editable cell component
  const EditableCell = ({ value, resortId, field, placeholder, type = "text" }) => {
    const isEditing = editingCell?.resortId === resortId && editingCell?.field === field;
    
    if (isEditing) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Input
            value={editingValue}
            onChange={(e) => setEditingValue(e.target.value)}
            onKeyDown={handleKeyPress}
            onBlur={(e) => {
              // Small delay to allow save button click to register
              setTimeout(() => {
                if (editingCell?.resortId === resortId && editingCell?.field === field) {
                  saveInlineEdit();
                }
              }, 100);
            }}
            autoFocus
            size="small"
            placeholder={placeholder}
            style={{ minWidth: 120 }}
            onPressEnter={(e) => {
              e.preventDefault();
              e.stopPropagation();
              saveInlineEdit();
            }}
          />
          <Button
            type="text"
            size="small"
            icon={<SaveOutlined />}
            loading={savingCell}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              saveInlineEdit();
            }}
            style={{ color: '#52c41a' }}
          />
          <Button
            type="text"
            size="small"
            icon={<CloseOutlined />}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              cancelEditing();
            }}
            style={{ color: '#ff4d4f' }}
          />
        </div>
      );
    }

    return (
      <div
        style={{
          minHeight: 22,
          padding: '2px 4px',
          borderRadius: 4,
          cursor: 'pointer',
          transition: 'background-color 0.2s',
          display: 'flex',
          alignItems: 'center',
          gap: 4
        }}
        className="editable-cell"
        onDoubleClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          startEditing(resortId, field, value);
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = '#f5f5f5';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = 'transparent';
        }}
      >
        <Text style={{ color: value ? '#000' : '#999' }}>
          {value || placeholder || 'Double-click to edit'}
        </Text>
        <EditOutlined style={{ fontSize: 12, color: '#999', opacity: 0.6 }} />
      </div>
    );
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
          <EditableCell
            value={text}
            resortId={record._id}
            field="name"
            placeholder="Resort name"
          />
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
    { 
      title: "Country", 
      dataIndex: "country", 
      key: "country",
      render: (text, record) => (
        <EditableCell
          value={text}
          resortId={record._id}
          field="country"
          placeholder="Country"
        />
      ),
    },
    { 
      title: "Province", 
      dataIndex: "province", 
      key: "province",
      render: (text, record) => (
        <EditableCell
          value={text}
          resortId={record._id}
          field="province"
          placeholder="Province"
        />
      ),
    },
    {
      title: "Website",
      dataIndex: "website",
      key: "website",
      render: (website, record) => {
        const isEditing = editingCell?.resortId === record._id && editingCell?.field === 'website';
        
                 if (isEditing) {
           return (
             <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
               <Input
                 value={editingValue}
                 onChange={(e) => setEditingValue(e.target.value)}
                 onKeyDown={handleKeyPress}
                 onBlur={(e) => {
                   // Small delay to allow save button click to register
                   setTimeout(() => {
                     if (editingCell?.resortId === record._id && editingCell?.field === 'website') {
                       saveInlineEdit();
                     }
                   }, 100);
                 }}
                 autoFocus
                 size="small"
                 placeholder="https://example.com"
                 style={{ minWidth: 200 }}
                 onPressEnter={(e) => {
                   e.preventDefault();
                   e.stopPropagation();
                   saveInlineEdit();
                 }}
               />
               <Button
                 type="text"
                 size="small"
                 icon={<SaveOutlined />}
                 loading={savingCell}
                 onClick={(e) => {
                   e.preventDefault();
                   e.stopPropagation();
                   saveInlineEdit();
                 }}
                 style={{ color: '#52c41a' }}
               />
               <Button
                 type="text"
                 size="small"
                 icon={<CloseOutlined />}
                 onClick={(e) => {
                   e.preventDefault();
                   e.stopPropagation();
                   cancelEditing();
                 }}
                 style={{ color: '#ff4d4f' }}
               />
             </div>
           );
         }

        if (!website) {
          return (
            <div
              style={{
                minHeight: 22,
                padding: '2px 4px',
                borderRadius: 4,
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                color: '#999'
              }}
              className="editable-cell"
              onDoubleClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                startEditing(record._id, 'website', website);
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#f5f5f5';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              <span>Double-click to add website</span>
              <EditOutlined style={{ fontSize: 12, color: '#999', opacity: 0.6 }} />
            </div>
          );
        }
        
        return (
          <div
            style={{
              minHeight: 22,
              padding: '2px 4px',
              borderRadius: 4,
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
            className="editable-cell"
            onDoubleClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              startEditing(record._id, 'website', website);
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#f5f5f5';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            <a 
              href={website} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: '#1890ff' }}
              onClick={(e) => e.stopPropagation()}
            >
              Visit Website
            </a>
            <EditOutlined style={{ fontSize: 12, color: '#999', opacity: 0.6 }} />
          </div>
        );
      },
    },
    {
      title: "Skiable Terrain",
      dataIndex: "skiable_terrain",
      key: "skiable_terrain",
      render: (text, record) => (
        <EditableCell
          value={text}
          resortId={record._id}
          field="skiable_terrain"
          placeholder="Skiable terrain"
        />
      ),
    },
    { 
      title: "Longest Run", 
      dataIndex: "longestRun", 
      key: "longestRun",
      render: (text, record) => (
        <EditableCell
          value={text}
          resortId={record._id}
          field="longestRun"
          placeholder="Longest run"
        />
      ),
    },
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
      render: (text, record) => (
        <EditableCell
          value={text}
          resortId={record._id}
          field="baseElevation"
          placeholder="Base elevation"
        />
      ),
    },
    { 
      title: "Top Elevation", 
      dataIndex: "topElevation", 
      key: "topElevation",
      render: (text, record) => (
        <EditableCell
          value={text}
          resortId={record._id}
          field="topElevation"
          placeholder="Top elevation"
        />
      ),
    },
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

      {/* Enhanced filter controls */}
      <Card size="small" style={{ borderRadius: 8, padding: '16px 20px' }}>
        {/* Quick Country Filters */}
        <Row style={{ marginBottom: 16 }}>
          <Col span={24}>
            <Space direction="vertical" size={8}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>🌍 Quick Country Filters</span>
              <Space wrap size={8}>
                {uniqueCountries.slice(0, 6).map(country => (
                  <Button
                    key={country.name}
                    size="small"
                    type={countryFilter === country.name ? "primary" : "default"}
                    onClick={() => setCountryFilter(countryFilter === country.name ? "" : country.name)}
                    style={{ 
                      borderRadius: 16,
                      fontSize: 12,
                      height: 28,
                      paddingLeft: 12,
                      paddingRight: 12
                    }}
                  >
                    {country.name} ({country.count})
                  </Button>
                ))}
                {uniqueCountries.length > 6 && (
                  <span style={{ fontSize: 12, color: '#999' }}>
                    +{uniqueCountries.length - 6} more in dropdown
                  </span>
                )}
              </Space>
            </Space>
          </Col>
        </Row>

        <Row gutter={[24, 12]} align="middle">
          {/* Enhanced Location filters */}
          <Col>
            <Space direction="vertical" size={6}>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#666' }}>📍 Location Filters</span>
              <Space wrap size={12}>
                <Select
                  placeholder="🌎 Select Country"
                  value={countryFilter}
                  onChange={(value) => {
                    setCountryFilter(value);
                    // Clear province filter when country changes
                    if (value !== countryFilter) {
                      setProvinceFilter("");
                    }
                  }}
                  style={{ width: 160 }}
                  size="default"
                  allowClear
                  showSearch
                  filterOption={(input, option) =>
                    option.children.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {uniqueCountries.map(country => (
                    <Option key={country.name} value={country.name}>
                      {country.name} ({country.count})
                    </Option>
                  ))}
                </Select>
                <Select
                  placeholder="🏔️ Select Province/State"
                  value={provinceFilter}
                  onChange={setProvinceFilter}
                  style={{ width: 180 }}
                  size="default"
                  allowClear
                  showSearch
                  disabled={!countryFilter && uniqueProvinces.length === 0}
                  filterOption={(input, option) =>
                    option.children.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {uniqueProvinces.map(province => (
                    <Option key={province.name} value={province.name}>
                      {province.name} ({province.count})
                    </Option>
                  ))}
                </Select>
              </Space>
            </Space>
          </Col>

          <Divider type="vertical" style={{ height: 50 }} />

          {/* Feature toggles */}
          <Col>
            <Space direction="vertical" size={6}>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#666' }}>🎿 Ski Passes</span>
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

          <Divider type="vertical" style={{ height: 50 }} />

          {/* Website toggles */}
          <Col>
            <Space direction="vertical" size={6}>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#666' }}>🌐 Website</span>
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
            <Space direction="vertical" size={6} style={{ alignItems: 'flex-end' }}>
              <div style={{ fontSize: 14, color: '#666', fontWeight: 500 }}>
                <strong style={{ color: '#1890ff' }}>{filteredData.length}</strong> of <strong>{data.length}</strong> resorts
              </div>
              {(searchText || countryFilter || provinceFilter || skiPassFilter || websiteFilter) && (
                <Button 
                  size="small"
                  icon={<ClearOutlined />}
                  onClick={clearAllFilters}
                  style={{ borderRadius: 6 }}
                  type="dashed"
                >
                  Clear All Filters
                </Button>
              )}
            </Space>
          </Col>
        </Row>

        {/* Active filters summary */}
        {(searchText || countryFilter || provinceFilter || skiPassFilter || websiteFilter) && (
          <Row style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
            <Col span={24}>
              <Space wrap size={6}>
                <span style={{ fontSize: 12, color: '#999', fontWeight: 500 }}>🏷️ Active Filters:</span>
                {searchText && <Tag size="small" color="blue" closable onClose={() => setSearchText("")}>Search: "{searchText}"</Tag>}
                {countryFilter && <Tag size="small" color="geekblue" closable onClose={() => setCountryFilter("")}>Country: {countryFilter}</Tag>}
                {provinceFilter && <Tag size="small" color="cyan" closable onClose={() => setProvinceFilter("")}>Province: {provinceFilter}</Tag>}
                {skiPassFilter === "with" && <Tag size="small" color="green" closable onClose={() => setSkiPassFilter("")}>Has Ski Passes</Tag>}
                {skiPassFilter === "without" && <Tag size="small" color="red" closable onClose={() => setSkiPassFilter("")}>No Ski Passes</Tag>}
                {websiteFilter === "with" && <Tag size="small" color="blue" closable onClose={() => setWebsiteFilter("")}>Has Website</Tag>}
                {websiteFilter === "without" && <Tag size="small" color="red" closable onClose={() => setWebsiteFilter("")}>No Website</Tag>}
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

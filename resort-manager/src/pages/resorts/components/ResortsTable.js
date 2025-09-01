import React, { useState, useEffect, useMemo } from "react";
import { Table, Button, Modal, message, Input, Select, Row, Col, Card, Space, Tag, Switch, Divider, Typography, Affix, Badge, Tooltip } from "antd";
import { SearchOutlined, FilterOutlined, ClearOutlined, CheckOutlined, CloseOutlined, EditOutlined, SaveOutlined, FlagOutlined, FlagFilled, UndoOutlined, CopyOutlined, CarOutlined, InfoCircleOutlined } from "@ant-design/icons";
import ResortForm from "./ResortsForm";

import {
  fetchResorts,
  addResort,
  updateResort,
  deleteResort,
  fetchFlaggedResorts,
  getResortFlagStatus,
  setResortFlagStatus,
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
  
  // Pending changes system
  const [pendingChanges, setPendingChanges] = useState({}); // { resortId: { field: value, field2: value2 } }
  const [isSavingBatch, setIsSavingBatch] = useState(false);
  
  // Filter states
  const [searchText, setSearchText] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [provinceFilter, setProvinceFilter] = useState("");
  const [skiPassFilter, setSkiPassFilter] = useState(""); // "all", "with", "without"
  const [websiteFilter, setWebsiteFilter] = useState(""); // "all", "with", "without"
  const [flaggedFilter, setFlaggedFilter] = useState(""); // "all", "flagged", "unflagged"
  
  // New data quality filters
  const [liftsFilter, setLiftsFilter] = useState(""); // "all", "minimal", "complete"
  const [runsFilter, setRunsFilter] = useState(""); // "all", "minimal", "complete"

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

  // Apply pending changes to data for display
  const dataWithPendingChanges = useMemo(() => {
    return data.map(resort => {
      const changes = pendingChanges[resort._id];
      if (changes) {
        return { ...resort, ...changes };
      }
      return resort;
    });
  }, [data, pendingChanges]);

  // Filter the data based on all filter criteria
  const filteredData = useMemo(() => {
    return dataWithPendingChanges.filter(resort => {
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

      // Flagged filter
      const flaggedMatch = !flaggedFilter ||
        (flaggedFilter === "flagged" && resort.flagged === true) ||
        (flaggedFilter === "unflagged" && resort.flagged !== true);

      // Lifts filter
      const totalLifts = resort.lifts?.total || 0;
      const liftsMatch = !liftsFilter ||
        (liftsFilter === "minimal" && totalLifts <= 1) ||
        (liftsFilter === "complete" && totalLifts > 1);

      // Runs filter
      const totalRuns = resort.runs?.total || 0;
      const runsMatch = !runsFilter ||
        (runsFilter === "minimal" && totalRuns <= 1) ||
        (runsFilter === "complete" && totalRuns > 1);

      return searchMatch && countryMatch && provinceMatch && skiPassMatch && websiteMatch && 
             flaggedMatch && liftsMatch && runsMatch;
    });
  }, [dataWithPendingChanges, searchText, countryFilter, provinceFilter, skiPassFilter, websiteFilter, 
      flaggedFilter, liftsFilter, runsFilter]);

  // Clear all filters
  const clearAllFilters = () => {
    setSearchText("");
    setCountryFilter("");
    setProvinceFilter("");
    setSkiPassFilter("");
    setWebsiteFilter("");
    setFlaggedFilter("");
    setLiftsFilter("");
    setRunsFilter("");
  };

  // Copy to clipboard function
  const copyToClipboard = async (text, label = 'Text') => {
    try {
      await navigator.clipboard.writeText(text);
      message.success(`${label} copied to clipboard!`);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      message.success(`${label} copied to clipboard!`);
    }
  };

  // Pending changes functions
  const addPendingChange = (resortId, field, value) => {
    setPendingChanges(prev => ({
      ...prev,
      [resortId]: {
        ...prev[resortId],
        [field]: value
      }
    }));
  };

  const removePendingChange = (resortId, field) => {
    setPendingChanges(prev => {
      const updated = { ...prev };
      if (updated[resortId]) {
        delete updated[resortId][field];
        if (Object.keys(updated[resortId]).length === 0) {
          delete updated[resortId];
        }
      }
      return updated;
    });
  };

  const discardAllChanges = () => {
    setPendingChanges({});
    message.info("All pending changes discarded");
  };

  const getPendingChangesCount = () => {
    return Object.values(pendingChanges).reduce((total, changes) => 
      total + Object.keys(changes).length, 0
    );
  };

  // Flag handling function - now adds to pending changes
  const handleFlagToggle = (resortId, currentFlagStatus) => {
    const newFlagStatus = !currentFlagStatus;
    addPendingChange(resortId, 'flagged', newFlagStatus);
  };

  // Save all pending changes
  const saveAllChanges = async () => {
    if (Object.keys(pendingChanges).length === 0) return;

    setIsSavingBatch(true);
    const successfulUpdates = [];
    const failedUpdates = [];

    try {
      for (const [resortId, changes] of Object.entries(pendingChanges)) {
        try {
          const resort = data.find(r => r._id === resortId);
          if (!resort) {
            failedUpdates.push({ resortId, error: 'Resort not found' });
            continue;
          }

          // Create FormData object for the update
          const formData = new FormData();
          
          // Add all existing fields to maintain data integrity
          formData.append("_id", resort._id);
          formData.append("name", changes.name !== undefined ? changes.name : (resort.name || ""));
          formData.append("province", changes.province !== undefined ? changes.province : (resort.province || ""));
          formData.append("country", changes.country !== undefined ? changes.country : (resort.country || ""));
          formData.append("website", changes.website !== undefined ? changes.website : (resort.website || ""));
          formData.append("information", resort.information || "");
          formData.append("longestRun", changes.longestRun !== undefined ? changes.longestRun : (resort.longestRun || ""));
          formData.append("baseElevation", changes.baseElevation !== undefined ? changes.baseElevation : (resort.baseElevation || ""));
          formData.append("topElevation", changes.topElevation !== undefined ? changes.topElevation : (resort.topElevation || ""));
          formData.append("notes", resort.notes || "");
          formData.append("flagged", changes.flagged !== undefined ? changes.flagged : (resort.flagged || false));
          formData.append("runs", JSON.stringify(resort.runs || { open: 0, total: 0 }));
          formData.append("terrainParks", resort.terrainParks || "");
          formData.append("lifts", JSON.stringify(resort.lifts || { open: 0, total: 0 }));
          formData.append("gondolas", resort.gondolas || "");
          formData.append("skiable_terrain", changes.skiable_terrain !== undefined ? changes.skiable_terrain : (resort.skiable_terrain || ""));
          formData.append("snowCats", resort.snowCats || "");
          formData.append("helicopters", resort.helicopters || "");
          formData.append("mapboxVector", resort.mapboxVectorUrl || "");
          
          if (resort.skiPasses && resort.skiPasses.length > 0) {
            formData.append("skiPasses", JSON.stringify(resort.skiPasses));
          }

          if (resort.location) {
            formData.append("location", JSON.stringify(resort.location));
          }

          // Call the update API
          const response = await updateResort(formData);
          
          if (response && response.data) {
            successfulUpdates.push({ resortId, changes });
          } else {
            failedUpdates.push({ resortId, error: 'Update failed' });
          }
        } catch (error) {
          console.error(`Error updating resort ${resortId}:`, error);
          failedUpdates.push({ resortId, error: error.message });
        }
      }

      // Update local data for successful updates
      if (successfulUpdates.length > 0) {
        setData(prevData => 
          prevData.map(resort => {
            const update = successfulUpdates.find(u => u.resortId === resort._id);
            if (update) {
              return { ...resort, ...update.changes };
            }
            return resort;
          })
        );
      }

      // Clear successful changes from pending
      const updatedPendingChanges = { ...pendingChanges };
      successfulUpdates.forEach(({ resortId }) => {
        delete updatedPendingChanges[resortId];
      });
      setPendingChanges(updatedPendingChanges);

      // Show results
      if (successfulUpdates.length > 0) {
        message.success(`Successfully updated ${successfulUpdates.length} resort${successfulUpdates.length > 1 ? 's' : ''}`);
      }
      
      if (failedUpdates.length > 0) {
        message.error(`Failed to update ${failedUpdates.length} resort${failedUpdates.length > 1 ? 's' : ''}`);
      }

    } finally {
      setIsSavingBatch(false);
    }
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

  const saveInlineEdit = () => {
    if (!editingCell) return;
    
    // Add to pending changes instead of saving immediately
    addPendingChange(editingCell.resortId, editingCell.field, editingValue);
    cancelEditing();
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
    const hasPendingChange = pendingChanges[resortId]?.[field] !== undefined;
    const displayValue = hasPendingChange ? pendingChanges[resortId][field] : value;
    
    if (isEditing) {
      return (
        <Input
          value={editingValue}
          onChange={(e) => setEditingValue(e.target.value)}
          onKeyDown={handleKeyPress}
          onBlur={(e) => {
            // Save on blur (clicking away)
            saveInlineEdit();
          }}
          autoFocus
          size="small"
          placeholder={placeholder}
          style={{ width: '100%' }}
          onPressEnter={(e) => {
            e.preventDefault();
            e.stopPropagation();
            saveInlineEdit();
          }}
        />
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
          gap: 4,
          backgroundColor: hasPendingChange ? '#fff7e6' : 'transparent',
          border: hasPendingChange ? '1px solid #ffd591' : 'none'
        }}
        className="editable-cell"
        onDoubleClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          startEditing(resortId, field, displayValue);
        }}
        onMouseEnter={(e) => {
          if (!hasPendingChange) {
            e.target.style.backgroundColor = '#f5f5f5';
          }
        }}
        onMouseLeave={(e) => {
          if (!hasPendingChange) {
            e.target.style.backgroundColor = 'transparent';
          }
        }}
      >
        <Text 
          style={{ 
            color: displayValue ? '#000' : '#999', 
            fontWeight: hasPendingChange ? 'bold' : 'normal',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: 'block',
            width: '100%'
          }}
          title={displayValue || placeholder || 'Double-click to edit'}
        >
          {displayValue || placeholder || 'Double-click to edit'}
        </Text>
        <EditOutlined style={{ fontSize: 12, color: '#999', opacity: 0.6 }} />
        {hasPendingChange && (
          <Badge dot style={{ backgroundColor: '#faad14' }} />
        )}
      </div>
    );
  };

  const columns = [
    {
      title: "Resort",
      dataIndex: "name",
      key: "name",
      width: 250,
      render: (text, record) => {
        const hasPendingChange = pendingChanges[record._id]?.name !== undefined;
        const displayName = hasPendingChange ? pendingChanges[record._id].name : text;
        
        return (
          <div style={{ display: "flex", alignItems: "center", minWidth: 180 }}>
            {record.imageUrl && (
              <img
                src={record.imageUrl}
                alt={record.name}
                style={{
                  width: 40,
                  height: 40,
                  marginRight: 8,
                  objectFit: "cover",
                  borderRadius: 4,
                  flexShrink: 0
                }}
              />
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 0 }}>
              <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                <EditableCell
                  value={text}
                  resortId={record._id}
                  field="name"
                  placeholder="Resort name"
                />
              </div>
              {displayName && (
                <Tooltip title="Copy resort name">
                  <Button
                    type="text"
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(displayName, 'Resort name');
                    }}
                    style={{
                      opacity: 0.6,
                      transition: 'opacity 0.2s',
                      padding: '2px 4px',
                      height: 'auto',
                      minWidth: 'auto',
                      flexShrink: 0
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.opacity = 1;
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.opacity = 0.6;
                    }}
                  />
                </Tooltip>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: "GeoJSON",
      dataIndex: "geoJsonData",
      key: "geoJsonData",
      width: 80,
      align: 'center',
      render: (geoJsonData) => (
        <Tag color={geoJsonData ? "green" : "red"} style={{ margin: 0 }}>
          {geoJsonData ? "Yes" : "No"}
        </Tag>
      ),
    },

    {
      title: "Coordinates",
      dataIndex: "location",
      key: "location",
      width: 150,
      render: (location) => {
        if (!location || !location.coordinates) return "-";
        const [lng, lat] = location.coordinates;
        return (
          <div style={{ fontSize: 12, fontFamily: 'monospace' }}>
            {lat.toFixed(4)}, {lng.toFixed(4)}
          </div>
        );
      },
    },
    { 
      title: "Country", 
      dataIndex: "country", 
      key: "country",
      width: 120,
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
      width: 120,
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
      width: 120,
      render: (website, record) => {
        const isEditing = editingCell?.resortId === record._id && editingCell?.field === 'website';
        
                 if (isEditing) {
           return (
             <Input
               value={editingValue}
               onChange={(e) => setEditingValue(e.target.value)}
               onKeyDown={handleKeyPress}
               onBlur={(e) => {
                 // Save on blur (clicking away)
                 saveInlineEdit();
               }}
               autoFocus
               size="small"
               placeholder="https://example.com"
               style={{ width: '100%' }}
               onPressEnter={(e) => {
                 e.preventDefault();
                 e.stopPropagation();
                 saveInlineEdit();
               }}
             />
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
      width: 120,
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
      title: "Runs",
      dataIndex: "runs",
      key: "runs",
      width: 80,
      align: 'center',
      render: (runs) => {
        const open = runs?.open || 0;
        const total = runs?.total || 0;
        return (
          <div style={{ fontFamily: 'monospace', fontSize: 12 }}>
            {open} / {total}
          </div>
        );
      },
    },
    {
      title: "Base Elev",
      dataIndex: "baseElevation",
      key: "baseElevation",
      width: 100,
      render: (text, record) => (
        <EditableCell
          value={text}
          resortId={record._id}
          field="baseElevation"
          placeholder="Base"
        />
      ),
    },
    { 
      title: "Top Elev", 
      dataIndex: "topElevation", 
      key: "topElevation",
      width: 100,
      render: (text, record) => (
        <EditableCell
          value={text}
          resortId={record._id}
          field="topElevation"
          placeholder="Top"
        />
      ),
    },
    {
      title: "Lifts",
      dataIndex: "lifts",
      key: "lifts",
      width: 80,
      align: 'center',
      render: (lifts) => {
        const open = lifts?.open || 0;
        const total = lifts?.total || 0;
        return (
          <div style={{ fontFamily: 'monospace', fontSize: 12 }}>
            {open} / {total}
          </div>
        );
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
      title: "Heli & Snowcat",
      key: "heliSnowcat",
      width: 120,
      render: (text, record) => {
        const helicopters = record.helicopters || 0;
        const snowCats = record.snowCats || 0;
        const hasEquipment = helicopters > 0 || snowCats > 0;
        
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Space>
                {helicopters > 0 && (
                  <Tooltip title={`${helicopters} helicopter${helicopters > 1 ? 's' : ''}`}>
                    <Tag color="blue" size="small">
                      🚁 {helicopters}
                    </Tag>
                  </Tooltip>
                )}
                {snowCats > 0 && (
                  <Tooltip title={`${snowCats} snowcat${snowCats > 1 ? 's' : ''}`}>
                    <Tag color="green" size="small">
                      <CarOutlined /> {snowCats}
                    </Tag>
                  </Tooltip>
                )}
                {!hasEquipment && (
                  <Tag color="default" size="small">None</Tag>
                )}
              </Space>
            </div>
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => setEditingResort(record)}
              style={{ 
                padding: '0 4px', 
                height: 'auto', 
                fontSize: '12px',
                color: hasEquipment ? '#1890ff' : '#8c8c8c'
              }}
            >
              {hasEquipment ? 'Edit Details' : 'Add Services'}
            </Button>
          </div>
        );
      },
    },
    {
      title: "Flag",
      key: "flagged",
      width: 80,
      render: (text, record) => {
        const hasPendingChange = pendingChanges[record._id]?.flagged !== undefined;
        const currentFlagStatus = hasPendingChange ? pendingChanges[record._id].flagged : record.flagged;
        
        return (
          <div style={{ position: 'relative' }}>
            <Button
              type="text"
              icon={currentFlagStatus ? <FlagFilled style={{ color: '#ff4d4f' }} /> : <FlagOutlined />}
              onClick={() => handleFlagToggle(record._id, currentFlagStatus)}
              title={currentFlagStatus ? 'Unflag resort' : 'Flag resort'}
              style={{
                color: currentFlagStatus ? '#ff4d4f' : '#8c8c8c',
                border: 'none',
                padding: '4px 8px',
                backgroundColor: hasPendingChange ? '#fff7e6' : 'transparent',
                borderRadius: hasPendingChange ? '4px' : '0'
              }}
            />
            {hasPendingChange && (
              <Badge dot style={{ backgroundColor: '#faad14', position: 'absolute', top: 2, right: 2 }} />
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

          <Divider type="vertical" style={{ height: 50 }} />

          {/* Flag toggles */}
          <Col>
            <Space direction="vertical" size={6}>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#666' }}>🚩 Flag Status</span>
              <Space size={12}>
                <Button
                  size="small"
                  type={flaggedFilter === "flagged" ? "primary" : "default"}
                  icon={flaggedFilter === "flagged" ? <FlagFilled /> : null}
                  onClick={() => setFlaggedFilter(flaggedFilter === "flagged" ? "" : "flagged")}
                  style={{ 
                    borderRadius: 6,
                    backgroundColor: flaggedFilter === "flagged" ? "#ff4d4f" : undefined,
                    borderColor: flaggedFilter === "flagged" ? "#ff4d4f" : undefined
                  }}
                >
                  Flagged
                </Button>
                <Button
                  size="small"
                  type={flaggedFilter === "unflagged" ? "primary" : "default"}
                  icon={flaggedFilter === "unflagged" ? <CheckOutlined /> : null}
                  onClick={() => setFlaggedFilter(flaggedFilter === "unflagged" ? "" : "unflagged")}
                  style={{ 
                    borderRadius: 6,
                    backgroundColor: flaggedFilter === "unflagged" ? "#52c41a" : undefined,
                    borderColor: flaggedFilter === "unflagged" ? "#52c41a" : undefined
                  }}
                >
                  Unflagged
                </Button>
              </Space>
            </Space>
          </Col>

          <Divider type="vertical" style={{ height: 50 }} />

          {/* Data Quality Filters */}
          <Col>
            <Space direction="vertical" size={6}>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#666' }}>📊 Data Quality</span>
              <Space size={8} wrap>
                <Button
                  size="small"
                  type={liftsFilter === "minimal" ? "primary" : "default"}
                  onClick={() => setLiftsFilter(liftsFilter === "minimal" ? "" : "minimal")}
                  style={{ 
                    borderRadius: 6,
                    backgroundColor: liftsFilter === "minimal" ? "#faad14" : undefined,
                    borderColor: liftsFilter === "minimal" ? "#faad14" : undefined,
                    fontSize: 11
                  }}
                >
                  Lifts ≤ 1
                </Button>
                <Button
                  size="small"
                  type={runsFilter === "minimal" ? "primary" : "default"}
                  onClick={() => setRunsFilter(runsFilter === "minimal" ? "" : "minimal")}
                  style={{ 
                    borderRadius: 6,
                    backgroundColor: runsFilter === "minimal" ? "#faad14" : undefined,
                    borderColor: runsFilter === "minimal" ? "#faad14" : undefined,
                    fontSize: 11
                  }}
                >
                  Runs ≤ 1
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
              {(searchText || countryFilter || provinceFilter || skiPassFilter || websiteFilter || 
                flaggedFilter || liftsFilter || runsFilter) && (
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
        {(searchText || countryFilter || provinceFilter || skiPassFilter || websiteFilter ||
          flaggedFilter || liftsFilter || runsFilter) && (
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
                {flaggedFilter === "flagged" && <Tag size="small" color="red" closable onClose={() => setFlaggedFilter("")}>Flagged</Tag>}
                {flaggedFilter === "unflagged" && <Tag size="small" color="green" closable onClose={() => setFlaggedFilter("")}>Unflagged</Tag>}
                {liftsFilter === "minimal" && <Tag size="small" color="orange" closable onClose={() => setLiftsFilter("")}>Lifts ≤ 1</Tag>}
                {runsFilter === "minimal" && <Tag size="small" color="orange" closable onClose={() => setRunsFilter("")}>Runs ≤ 1</Tag>}

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
        sticky={{ 
          offsetHeader: 64,
          offsetScroll: 0,
          getContainer: () => window
        }}
        pagination={{
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} resorts`,
          pageSizeOptions: ['10', '20', '50', '100'],
          defaultPageSize: 20,
        }}
      />
      
      {/* Pending Changes Controls */}
      {getPendingChangesCount() > 0 && (
        <Affix offsetBottom={20}>
          <div style={{
            background: 'linear-gradient(135deg, #fff 0%, #fafafa 100%)',
            padding: '12px 20px',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            backdropFilter: 'blur(8px)',
            maxWidth: '800px',
            margin: '0 auto',
            position: 'relative',
            zIndex: 1000
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                background: 'linear-gradient(135deg, #faad14 0%, #ff9c00 100%)',
                borderRadius: '50%',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}>
                <EditOutlined style={{ fontSize: 16, color: '#fff' }} />
                <Badge 
                  count={getPendingChangesCount()} 
                  style={{ 
                    backgroundColor: '#ff4d4f',
                    position: 'absolute',
                    top: -2,
                    right: -2,
                    minWidth: '18px',
                    height: '18px',
                    lineHeight: '18px',
                    fontSize: '11px',
                    fontWeight: 'bold'
                  }}
                />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#333', marginBottom: 2 }}>
                  {getPendingChangesCount()} Pending Change{getPendingChangesCount() > 1 ? 's' : ''}
                </div>
                <div style={{ fontSize: 11, color: '#666' }}>
                  Click Save All to commit changes to server
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button 
                size="small"
                icon={<UndoOutlined />}
                onClick={discardAllChanges}
                style={{ 
                  borderRadius: '8px',
                  border: '1px solid #d9d9d9',
                  color: '#666',
                  height: '32px',
                  fontSize: '12px'
                }}
              >
                Discard
              </Button>
              <Button 
                type="primary"
                size="small"
                icon={<SaveOutlined />}
                loading={isSavingBatch}
                onClick={saveAllChanges}
                style={{
                  borderRadius: '8px',
                  backgroundColor: '#52c41a',
                  borderColor: '#52c41a',
                  height: '32px',
                  fontSize: '12px',
                  fontWeight: 600,
                  boxShadow: '0 2px 4px rgba(82, 196, 26, 0.3)'
                }}
              >
                Save All
              </Button>
            </div>
          </div>
        </Affix>
      )}

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

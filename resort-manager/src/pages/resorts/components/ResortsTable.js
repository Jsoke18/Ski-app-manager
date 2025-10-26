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
import { fetchHelicopterPackages, fetchHeliSkiingData } from "../../../services/helicopterService";

const { Option } = Select;
const { Text } = Typography;

const ResortTable = ({ data, setData }) => {
  const [editingResort, setEditingResort] = useState(null);
  const [isAddingResort, setIsAddingResort] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [helicopterData, setHelicopterData] = useState({}); // Store helicopter packages by resort ID
  const [snowcatData, setSnowcatData] = useState({}); // Store snowcat packages by resort ID
  

  
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
  const [skiPassFilter, setSkiPassFilter] = useState(""); // specific pass name filter
  const [websiteFilter, setWebsiteFilter] = useState(""); // "all", "with", "without"
  const [flaggedFilter, setFlaggedFilter] = useState(""); // "all", "flagged", "unflagged"
  const [heliFilter, setHeliFilter] = useState(""); // "all", "with", "without"
  const [snowcatFilter, setSnowcatFilter] = useState(""); // "all", "with", "without"
  const [passQualityFilter, setPassQualityFilter] = useState(""); // "all", "missing-names", "good-quality"
  
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

  // Extract unique ski pass names with counts
  const uniqueSkiPasses = useMemo(() => {
    const passCount = {};
    
    data.forEach(resort => {
      if (resort.skiPasses && resort.skiPasses.length > 0) {
        resort.skiPasses.forEach(pass => {
          const passName = typeof pass === 'object' ? pass.name : pass;
          if (passName && passName.trim() !== '') {
            const cleanName = passName.trim();
            passCount[cleanName] = (passCount[cleanName] || 0) + 1;
          }
        });
      }
    });
    
    return Object.keys(passCount)
      .sort((a, b) => passCount[b] - passCount[a]) // Sort by count descending
      .map(passName => ({
        name: passName,
        count: passCount[passName]
      }));
  }, [data]);

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

      // Ski pass filter - filter by specific pass name
      const skiPassMatch = !skiPassFilter || 
        (resort.skiPasses && resort.skiPasses.some(pass => {
          const passName = typeof pass === 'object' ? pass.name : pass;
          return passName && passName.toLowerCase().includes(skiPassFilter.toLowerCase());
        }));

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

      // Heli filter
      const helicopters = resort.helicopters || 0;
      const heliMatch = !heliFilter ||
        (heliFilter === "with" && helicopters > 0) ||
        (heliFilter === "without" && helicopters === 0);

      // Snowcat filter
      const snowcats = resort.snowCats || 0;
      const snowcatMatch = !snowcatFilter ||
        (snowcatFilter === "with" && snowcats > 0) ||
        (snowcatFilter === "without" && snowcats === 0);

      // Pass quality filter
      const passCount = resort.skiPasses ? resort.skiPasses.length : 0;
      const hasPassQualityIssues = resort.skiPasses && resort.skiPasses.some(pass => 
        !pass || 
        (typeof pass === 'object' && (!pass.name || pass.name.trim() === '')) ||
        (typeof pass === 'string' && pass.trim() === '')
      );
      const passQualityMatch = !passQualityFilter ||
        (passQualityFilter === "missing-names" && hasPassQualityIssues) ||
        (passQualityFilter === "good-quality" && !hasPassQualityIssues && passCount > 0);

      return searchMatch && countryMatch && provinceMatch && skiPassMatch && websiteMatch && 
             flaggedMatch && liftsMatch && runsMatch && heliMatch && snowcatMatch && passQualityMatch;
    });
  }, [dataWithPendingChanges, searchText, countryFilter, provinceFilter, skiPassFilter, websiteFilter, 
      flaggedFilter, liftsFilter, runsFilter, heliFilter, snowcatFilter, passQualityFilter]);

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
    setHeliFilter("");
    setSnowcatFilter("");
    setPassQualityFilter("");
  };

  // Fetch helicopter packages for a specific resort
  const fetchResortHelicopterData = async (resortId) => {
    try {
      const heliData = await fetchHeliSkiingData(resortId);
      setHelicopterData(prev => ({
        ...prev,
        [resortId]: heliData
      }));
      return heliData;
    } catch (error) {
      console.error('Error fetching helicopter data for resort:', resortId, error);
      return null;
    }
  };

  // Fetch snowcat data for a specific resort
  const fetchResortSnowcatData = async (resortId) => {
    try {
      const response = await fetch(`http://localhost:3000/resorts/${resortId}/heli-snowcat`);
      const data = await response.json();
      const snowcatInfo = data?.snowcats?.snowcatTours || null;
      setSnowcatData(prev => ({
        ...prev,
        [resortId]: snowcatInfo
      }));
      return snowcatInfo;
    } catch (error) {
      console.error('Error fetching snowcat data for resort:', resortId, error);
      return null;
    }
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
      width: 280,
      fixed: 'left',
      render: (text, record) => {
        const hasPendingChange = pendingChanges[record._id]?.name !== undefined;
        const displayName = hasPendingChange ? pendingChanges[record._id].name : text;
        
        return (
          <div style={{ display: "flex", alignItems: "center", minWidth: 200, padding: '8px 0' }}>
            {record.imageUrl && (
              <img
                src={record.imageUrl}
                alt={record.name}
                style={{
                  width: 48,
                  height: 48,
                  marginRight: 12,
                  objectFit: "cover",
                  borderRadius: 6,
                  flexShrink: 0,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              />
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ 
                  fontWeight: 'bold', 
                  fontSize: '14px',
                  color: '#1f1f1f',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '150px'
                }}>
                  {displayName || 'Unnamed Resort'}
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
              <div style={{ 
                fontSize: '12px', 
                color: '#8c8c8c',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                {record.country && record.province ? `${record.province}, ${record.country}` : 
                 record.country ? record.country : 
                 record.province ? record.province : 
                 'Location not set'}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: "Location Details",
      key: "locationDetails",
      width: 300,
      render: (_, record) => (
        <div style={{ padding: '4px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '12px', color: '#666', fontWeight: '500' }}>GeoJSON:</span>
              <Tag color={record.geoJsonData ? "green" : "red"} size="small">
                {record.geoJsonData ? "✓" : "✗"}
              </Tag>
            </div>
          </div>
          {record.location && record.location.coordinates && 
           record.location.coordinates[0] != null && record.location.coordinates[1] != null && (
            <div style={{ 
              fontSize: '11px', 
              fontFamily: 'monospace',
              color: '#666',
              marginBottom: '4px',
              padding: '2px 6px',
              backgroundColor: '#f5f5f5',
              borderRadius: '3px',
              display: 'inline-block'
            }}>
              {record.location.coordinates[1].toFixed(4)}, {record.location.coordinates[0].toFixed(4)}
            </div>
          )}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ minWidth: '80px' }}>
              <div style={{ fontSize: '11px', color: '#999', marginBottom: '2px' }}>Country</div>
              <EditableCell
                value={record.country}
                resortId={record._id}
                field="country"
                placeholder="Country"
              />
            </div>
            <div style={{ minWidth: '80px' }}>
              <div style={{ fontSize: '11px', color: '#999', marginBottom: '2px' }}>Province</div>
              <EditableCell
                value={record.province}
                resortId={record._id}
                field="province"
                placeholder="Province"
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Terrain & Web",
      key: "terrainWeb",
      width: 180,
      render: (_, record) => {
        const isEditing = editingCell?.resortId === record._id && editingCell?.field === 'website';
        
        return (
          <div style={{ padding: '4px 0' }}>
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '11px', color: '#999', marginBottom: '2px' }}>Skiable Terrain</div>
              <EditableCell
                value={record.skiable_terrain}
                resortId={record._id}
                field="skiable_terrain"
                placeholder="e.g., 2,500 acres"
              />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#999', marginBottom: '2px' }}>Website</div>
              {isEditing ? (
                <Input
                  value={editingValue}
                  onChange={(e) => setEditingValue(e.target.value)}
                  onKeyDown={handleKeyPress}
                  onBlur={(e) => {
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
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {record.website ? (
                    <a 
                      href={record.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ 
                        color: '#1890ff',
                        fontSize: '12px',
                        textDecoration: 'none'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      Visit Site
                    </a>
                  ) : (
                    <span 
                      style={{ 
                        color: '#999', 
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                      onDoubleClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        startEditing(record._id, 'website', record.website);
                      }}
                    >
                      Add website
                    </span>
                  )}
                  <EditOutlined 
                    style={{ 
                      fontSize: 10, 
                      color: '#999', 
                      opacity: 0.6,
                      cursor: 'pointer'
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      startEditing(record._id, 'website', record.website);
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        );
      },
    },

    {
      title: "Resort Stats",
      key: "resortStats",
      width: 200,
      render: (_, record) => {
        const runsOpen = record.runs?.open || 0;
        const runsTotal = record.runs?.total || 0;
        const liftsOpen = record.lifts?.open || 0;
        const liftsTotal = record.lifts?.total || 0;
        
        return (
          <div style={{ padding: '4px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <div style={{ textAlign: 'center', minWidth: '60px' }}>
                <div style={{ fontSize: '11px', color: '#999', marginBottom: '2px' }}>Runs</div>
                <div style={{ 
                  fontFamily: 'monospace', 
                  fontSize: '13px',
                  fontWeight: 'bold',
                  color: runsOpen > 0 ? '#52c41a' : '#d9d9d9'
                }}>
                  {runsOpen} / {runsTotal}
                </div>
              </div>
              <div style={{ textAlign: 'center', minWidth: '60px' }}>
                <div style={{ fontSize: '11px', color: '#999', marginBottom: '2px' }}>Lifts</div>
                <div style={{ 
                  fontFamily: 'monospace', 
                  fontSize: '13px',
                  fontWeight: 'bold',
                  color: liftsOpen > 0 ? '#52c41a' : '#d9d9d9'
                }}>
                  {liftsOpen} / {liftsTotal}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '10px', color: '#999', marginBottom: '1px' }}>Base</div>
                <EditableCell
                  value={record.baseElevation}
                  resortId={record._id}
                  field="baseElevation"
                  placeholder="Base elev"
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '10px', color: '#999', marginBottom: '1px' }}>Top</div>
                <EditableCell
                  value={record.topElevation}
                  resortId={record._id}
                  field="topElevation"
                  placeholder="Top elev"
                />
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: "Ski Passes",
      dataIndex: "skiPasses",
      key: "skiPasses",
      width: 160,
      render: (skiPasses) => {
        if (!skiPasses || skiPasses.length === 0) {
          return (
            <div style={{ 
              padding: '8px', 
              textAlign: 'center',
              color: '#999',
              fontSize: '12px'
            }}>
              No passes
            </div>
          );
        }
        return (
          <div style={{ padding: '4px 0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {skiPasses.slice(0, 3).map((pass, index) => (
                <Tag
                  key={index}
                  color={'blue'}
                  style={{
                    margin: 0,
                    borderRadius: '4px',
                    fontSize: '11px',
                    padding: '2px 8px',
                    maxWidth: '120px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                  title={typeof pass === 'object' ? pass.name : pass}
                >
                  {typeof pass === 'object' ? pass.name : pass}
                </Tag>
              ))}
              {skiPasses.length > 3 && (
                <Tag color="default" style={{ 
                  margin: 0, 
                  fontSize: '11px',
                  textAlign: 'center'
                }}>
                  +{skiPasses.length - 3} more
                </Tag>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: "Equipment & Services",
      key: "equipmentServices",
      width: 200,
      render: (text, record) => {
        const helicopters = record.helicopters || 0;
        const snowCats = record.snowCats || 0;
        const gondolas = record.gondolas || 0;
        const heliData = helicopterData[record._id];
        const heliPackages = heliData?.packages || [];
        const activeHeliPackages = heliPackages.filter(pkg => pkg.active === true);
        
        const snowcatInfo = snowcatData[record._id];
        const snowcatPackages = snowcatInfo?.packages || [];
        const activeSnowcatPackages = snowcatPackages.filter(pkg => pkg.active === true);
        
        return (
          <div style={{ padding: '4px 0' }}>
            <div style={{ marginBottom: '8px' }}>
              {/* Basic Equipment Count */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
                {helicopters > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>🚁</span>
                    <span style={{ fontSize: '12px' }}>{helicopters} Helicopter{helicopters > 1 ? 's' : ''}</span>
                  </div>
                )}
                {snowCats > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CarOutlined style={{ color: '#52c41a' }} />
                    <span style={{ fontSize: '12px' }}>{snowCats} Snowcat{snowCats > 1 ? 's' : ''}</span>
                  </div>
                )}
                {gondolas > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>🚠</span>
                    <span style={{ fontSize: '12px' }}>{gondolas} Gondola{gondolas > 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>

              {/* Helicopter Packages */}
              {activeHeliPackages.length > 0 && (
                <div style={{ 
                  borderTop: '1px solid #f0f0f0', 
                  paddingTop: '6px',
                  marginTop: '6px'
                }}>
                  <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px', fontWeight: 'bold' }}>
                    🚁 Heli Packages ({activeHeliPackages.length})
                  </div>
                  {activeHeliPackages.slice(0, 2).map((pkg, index) => (
                    <div key={pkg._id || index} style={{ 
                      fontSize: '10px', 
                      color: '#333',
                      marginBottom: '2px',
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}>
                      <span style={{ fontWeight: '500' }}>{pkg.name}</span>
                      <span style={{ color: '#52c41a' }}>${pkg.price}</span>
                    </div>
                  ))}
                  {activeHeliPackages.length > 2 && (
                    <div style={{ fontSize: '10px', color: '#666', fontStyle: 'italic' }}>
                      +{activeHeliPackages.length - 2} more packages
                    </div>
                  )}
                </div>
              )}

              {/* Snowcat Packages */}
              {activeSnowcatPackages.length > 0 && (
                <div style={{ 
                  borderTop: '1px solid #f0f0f0', 
                  paddingTop: '6px',
                  marginTop: '6px'
                }}>
                  <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px', fontWeight: 'bold' }}>
                    🚜 Snowcat Packages ({activeSnowcatPackages.length})
                  </div>
                  {activeSnowcatPackages.slice(0, 2).map((pkg, index) => (
                    <div key={pkg._id || index} style={{ 
                      fontSize: '10px', 
                      color: '#333',
                      marginBottom: '2px',
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}>
                      <span style={{ fontWeight: '500' }}>{pkg.name}</span>
                      <span style={{ color: '#52c41a' }}>${pkg.price}</span>
                    </div>
                  ))}
                  {activeSnowcatPackages.length > 2 && (
                    <div style={{ fontSize: '10px', color: '#666', fontStyle: 'italic' }}>
                      +{activeSnowcatPackages.length - 2} more packages
                    </div>
                  )}
                </div>
              )}

              {helicopters === 0 && snowCats === 0 && gondolas === 0 && 
               activeHeliPackages.length === 0 && activeSnowcatPackages.length === 0 && (
                <div style={{ 
                  color: '#999', 
                  fontSize: '12px',
                  fontStyle: 'italic',
                  textAlign: 'center',
                  padding: '8px 0'
                }}>
                  No equipment listed
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => setEditingResort(record)}
                style={{ 
                  padding: '2px 8px', 
                  height: 'auto', 
                  fontSize: '11px',
                  color: '#1890ff',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px'
                }}
              >
                Edit Equipment
              </Button>
              
              {!helicopterData[record._id] && helicopters > 0 && (
                <Button
                  type="text"
                  size="small"
                  onClick={() => fetchResortHelicopterData(record._id)}
                  style={{ 
                    padding: '2px 8px', 
                    height: 'auto', 
                    fontSize: '10px',
                    color: '#666'
                  }}
                >
                  Load Heli Data
                </Button>
              )}

              {!snowcatData[record._id] && snowCats > 0 && (
                <Button
                  type="text"
                  size="small"
                  onClick={() => fetchResortSnowcatData(record._id)}
                  style={{ 
                    padding: '2px 8px', 
                    height: 'auto', 
                    fontSize: '10px',
                    color: '#666'
                  }}
                >
                  Load Snowcat Data
                </Button>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: "Status & Actions",
      key: "statusActions",
      width: 140,
      fixed: 'right',
      render: (text, record) => {
        const hasPendingChange = pendingChanges[record._id]?.flagged !== undefined;
        const currentFlagStatus = hasPendingChange ? pendingChanges[record._id].flagged : record.flagged;
        
        return (
          <div style={{ padding: '4px 0' }}>
            <div style={{ marginBottom: '8px', textAlign: 'center' }}>
              <Button
                type="text"
                icon={currentFlagStatus ? <FlagFilled style={{ color: '#ff4d4f' }} /> : <FlagOutlined />}
                onClick={() => handleFlagToggle(record._id, currentFlagStatus)}
                title={currentFlagStatus ? 'Unflag resort' : 'Flag resort'}
                style={{
                  color: currentFlagStatus ? '#ff4d4f' : '#8c8c8c',
                  border: currentFlagStatus ? '1px solid #ff4d4f' : '1px solid #d9d9d9',
                  padding: '4px 8px',
                  backgroundColor: hasPendingChange ? '#fff7e6' : 'transparent',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
                size="small"
              >
                {currentFlagStatus ? 'Flagged' : 'Flag'}
              </Button>
              {hasPendingChange && (
                <Badge dot style={{ backgroundColor: '#faad14', position: 'absolute', marginTop: '-8px', marginLeft: '-8px' }} />
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <Button 
                type="primary" 
                size="small" 
                onClick={() => setEditingResort(record)}
                style={{ fontSize: '11px' }}
                block
              >
                Edit
              </Button>
              <Button 
                danger 
                size="small" 
                onClick={() => handleDeleteResort(record._id)}
                style={{ fontSize: '11px' }}
                block
              >
                Delete
              </Button>
            </div>
          </div>
        );
      },
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

          {/* Ski Pass Filter */}
          <Col>
            <Space direction="vertical" size={6}>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#666' }}>🎿 Ski Pass Network</span>
              <Select
                placeholder="🎿 Filter by Pass"
                value={skiPassFilter}
                onChange={setSkiPassFilter}
                style={{ width: 200 }}
                size="default"
                allowClear
                showSearch
                filterOption={(input, option) =>
                  option.children.toLowerCase().includes(input.toLowerCase())
                }
              >
                {uniqueSkiPasses.map(pass => (
                  <Option key={pass.name} value={pass.name}>
                    {pass.name} ({pass.count})
                  </Option>
                ))}
              </Select>
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

          {/* Helicopter toggles */}
          <Col>
            <Space direction="vertical" size={6}>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#666' }}>🚁 Heli-Skiing</span>
              <Space size={12}>
                <Button
                  size="small"
                  type={heliFilter === "with" ? "primary" : "default"}
                  icon={heliFilter === "with" ? <CheckOutlined /> : null}
                  onClick={() => setHeliFilter(heliFilter === "with" ? "" : "with")}
                  style={{ 
                    borderRadius: 6,
                    backgroundColor: heliFilter === "with" ? "#722ed1" : undefined,
                    borderColor: heliFilter === "with" ? "#722ed1" : undefined
                  }}
                >
                  Has Heli
                </Button>
                <Button
                  size="small"
                  type={heliFilter === "without" ? "primary" : "default"}
                  icon={heliFilter === "without" ? <CloseOutlined /> : null}
                  onClick={() => setHeliFilter(heliFilter === "without" ? "" : "without")}
                  style={{ 
                    borderRadius: 6,
                    backgroundColor: heliFilter === "without" ? "#d9d9d9" : undefined,
                    borderColor: heliFilter === "without" ? "#d9d9d9" : undefined
                  }}
                >
                  No Heli
                </Button>
              </Space>
            </Space>
          </Col>

          <Divider type="vertical" style={{ height: 50 }} />

          {/* Snowcat toggles */}
          <Col>
            <Space direction="vertical" size={6}>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#666' }}>🚜 Snowcat Tours</span>
              <Space size={12}>
                <Button
                  size="small"
                  type={snowcatFilter === "with" ? "primary" : "default"}
                  icon={snowcatFilter === "with" ? <CheckOutlined /> : null}
                  onClick={() => setSnowcatFilter(snowcatFilter === "with" ? "" : "with")}
                  style={{ 
                    borderRadius: 6,
                    backgroundColor: snowcatFilter === "with" ? "#52c41a" : undefined,
                    borderColor: snowcatFilter === "with" ? "#52c41a" : undefined
                  }}
                >
                  Has Snowcat
                </Button>
                <Button
                  size="small"
                  type={snowcatFilter === "without" ? "primary" : "default"}
                  icon={snowcatFilter === "without" ? <CloseOutlined /> : null}
                  onClick={() => setSnowcatFilter(snowcatFilter === "without" ? "" : "without")}
                  style={{ 
                    borderRadius: 6,
                    backgroundColor: snowcatFilter === "without" ? "#d9d9d9" : undefined,
                    borderColor: snowcatFilter === "without" ? "#d9d9d9" : undefined
                  }}
                >
                  No Snowcat
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
                flaggedFilter || liftsFilter || runsFilter || heliFilter || snowcatFilter || passQualityFilter) && (
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
          flaggedFilter || liftsFilter || runsFilter || heliFilter || snowcatFilter || passQualityFilter) && (
          <Row style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
            <Col span={24}>
              <Space wrap size={6}>
                <span style={{ fontSize: 12, color: '#999', fontWeight: 500 }}>🏷️ Active Filters:</span>
                {searchText && <Tag size="small" color="blue" closable onClose={() => setSearchText("")}>Search: "{searchText}"</Tag>}
                {countryFilter && <Tag size="small" color="geekblue" closable onClose={() => setCountryFilter("")}>Country: {countryFilter}</Tag>}
                {provinceFilter && <Tag size="small" color="cyan" closable onClose={() => setProvinceFilter("")}>Province: {provinceFilter}</Tag>}
                {skiPassFilter && <Tag size="small" color="blue" closable onClose={() => setSkiPassFilter("")}>Pass: {skiPassFilter}</Tag>}
                {passQualityFilter === "missing-names" && <Tag size="small" color="red" closable onClose={() => setPassQualityFilter("")}>⚠️ Passes Need Review</Tag>}
                {passQualityFilter === "good-quality" && <Tag size="small" color="green" closable onClose={() => setPassQualityFilter("")}>✅ Clean Pass Data</Tag>}
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
        scroll={{ 
          x: 1200
        }}
        pagination={{
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} resorts`,
          pageSizeOptions: ['10', '20', '50', '100'],
          defaultPageSize: 20,
          style: { 
            padding: '16px 24px', 
            background: '#fff'
          }
        }}
        size="middle"
        style={{
          background: 'transparent'
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

import React, { useEffect, useState } from "react";
import { Form, Input, Button, Upload, Select, InputNumber, Card, Row, Col, Collapse, Space, Affix, Switch, Typography } from "antd";
import { InboxOutlined, UploadOutlined, SaveOutlined, EnvironmentOutlined, InfoCircleOutlined, AreaChartOutlined, CameraOutlined, FlagOutlined } from "@ant-design/icons";
import { uploadImageToGCS } from "../../../services/GoogleBucketService";
import { fetchSkiPasses } from "../../../services/skiPassService";
import { fetchHeliSkiingData, fetchCompleteHeliSnowcatData } from "../../../services/helicopterService";

const { Dragger } = Upload;
const { Option } = Select;
const { Panel } = Collapse;

const ResortForm = ({
  editingResort,
  onUpdateResort,
  isAddingResort,
  initialValues,
}) => {
  const [form] = Form.useForm();
  const [geoJSONFile, setGeoJSONFile] = useState(null);
  const [skiPasses, setSkiPasses] = useState([]);
  const [loadingSkiPasses, setLoadingSkiPasses] = useState(false);
  const [imageFileList, setImageFileList] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [helicopterData, setHelicopterData] = useState(null);
  const [loadingHelicopterData, setLoadingHelicopterData] = useState(false);

  useEffect(() => {
    loadSkiPasses();
  }, []);

  const loadSkiPasses = async () => {
    try {
      setLoadingSkiPasses(true);
      const data = await fetchSkiPasses();
      setSkiPasses(data);
    } catch (error) {
      console.error('Error loading ski passes:', error);
    } finally {
      setLoadingSkiPasses(false);
    }
  };

  const loadHelicopterData = async (resortId) => {
    if (!resortId) return;
    try {
      setLoadingHelicopterData(true);
      const data = await fetchCompleteHeliSnowcatData(resortId);
      setHelicopterData(data);
      console.log('🚁 Loaded helicopter data for form:', data);
      return data;
    } catch (error) {
      console.error('Error loading helicopter data:', error);
      return null;
    } finally {
      setLoadingHelicopterData(false);
    }
  };

  useEffect(() => {
    const initializeForm = async () => {
      if (initialValues) {
        form.setFieldsValue(initialValues);
        setImageFileList([]); // Reset image file list
      } else if (editingResort) {
        // Load helicopter data for this resort if it has an ID
        let heliData = null;
        if (editingResort._id) {
          heliData = await loadHelicopterData(editingResort._id);
        }
        
        // Exclude image-related fields from form initialization to avoid conflicts
        const { imageUrl, image, ...resortDataWithoutImage } = editingResort;
        
        console.log("Initializing form for editing resort:", editingResort.name);
        console.log("Existing imageUrl:", imageUrl);
        console.log("Existing skiPasses:", editingResort.skiPasses);
        console.log("Loaded helicopter data:", heliData);
        
        // Prepare coordinates string if location exists
        let coordinatesString = "";
        if (editingResort.location && editingResort.location.coordinates) {
          const [longitude, latitude] = editingResort.location.coordinates;
          coordinatesString = `${latitude}, ${longitude}`;
        }
        
        form.setFieldsValue({
          ...resortDataWithoutImage,
          coordinates: coordinatesString,
          locationType: editingResort.location?.type || "",
          runs: {
            open: editingResort.runs?.open || null,
            total: editingResort.runs?.total || null,
          },
          lifts: {
            open: editingResort.lifts?.open || null,
            total: editingResort.lifts?.total || null,
          },
          skiPasses: editingResort.skiPasses?.map(pass => 
            typeof pass === 'object' ? pass._id : pass
          ) || [],
          // Explicitly set image field to empty array to ensure clean state
          image: [],
          // Ensure all numeric fields are properly set
          terrainParks: editingResort.terrainParks || null,
          gondolas: editingResort.gondolas || null,
          snowCats: editingResort.snowCats || null,
          helicopters: heliData?.helicopters?.count || editingResort.helicopters || null,
          // Use loaded helicopter data if available, otherwise fall back to existing data
          heliSkiing: {
            packages: heliData?.helicopters?.heliSkiing?.packages || editingResort.heliSkiing?.packages || []
          },
          snowcatTours: {
            packages: heliData?.snowcats?.snowcatTours?.packages || editingResort.snowcatTours?.packages || []
          },
        });
        setImageFileList([]); // Reset image file list for editing
        
        console.log("Form initialized with values:", {
          skiPasses: editingResort.skiPasses?.map(pass => 
            typeof pass === 'object' ? pass._id : pass
          ) || [],
          runs: editingResort.runs,
          lifts: editingResort.lifts,
          helicopters: heliData?.helicopters?.count || editingResort.helicopters,
          heliPackages: heliData?.helicopters?.heliSkiing?.packages || editingResort.heliSkiing?.packages
        });
      } else {
        form.resetFields();
        setImageFileList([]); // Reset image file list
      }
    };
    
    initializeForm();
  }, [editingResort, form, initialValues]);

  const onFinish = async (values) => {
    setIsSubmitting(true);
    try {
      console.log("=== FORM SUBMISSION DEBUG ===");
      console.log("Form values:", values);
      console.log("Image field in values:", values.image);
      console.log("Image array length:", values.image?.length);
      console.log("First image file:", values.image?.[0]);
      console.log("Is editing resort:", !!editingResort);
      console.log("Resort being edited:", editingResort?.name);
      console.log("Ski passes in form:", values.skiPasses);
      
      const formData = new FormData();
      formData.append("name", values.name || "");
      formData.append("province", values.province || "");
      formData.append("country", values.country || "");
      formData.append("website", values.website || "");
      formData.append("information", values.information || "");
      formData.append("longestRun", values.longestRun || "");
      formData.append("baseElevation", values.baseElevation || "");
      formData.append("topElevation", values.topElevation || "");
      formData.append("notes", values.notes || "");
      formData.append("flagged", values.flagged || false);
      formData.append("runs", JSON.stringify(values.runs || { open: 0, total: 0 }));
      formData.append("terrainParks", values.terrainParks || "");
      formData.append("lifts", JSON.stringify(values.lifts || { open: 0, total: 0 }));
      formData.append("gondolas", values.gondolas || "");
      formData.append("skiable_terrain", values.skiable_terrain || "");
      formData.append("snowCats", values.snowCats || "");
      formData.append("helicopters", values.helicopters || "");
      
      // Add heli skiing and snowcat tour data
      if (values.heliSkiing) {
        formData.append("heliSkiing", JSON.stringify(values.heliSkiing));
      }
      if (values.snowcatTours) {
        formData.append("snowcatTours", JSON.stringify(values.snowcatTours));
      }
      
      formData.append("mapboxVector", values.mapboxVectorUrl || "");

      // Add ski passes to form data
      if (values.skiPasses && values.skiPasses.length > 0) {
        console.log("Adding ski passes to FormData:", values.skiPasses);
        formData.append("skiPasses", JSON.stringify(values.skiPasses));
      } else {
        console.log("No ski passes selected");
      }

      if (geoJSONFile) {
        formData.append("geoJSONFile", geoJSONFile);
      }

      if (editingResort && editingResort.location) {
        if (values.coordinates) {
          // Update the coordinates if provided in the form
          const [latitude, longitude] = values.coordinates
            .split(",")
            .map((coord) => parseFloat(coord.trim()));
          const updatedLocation = {
            ...editingResort.location,
            coordinates: [longitude, latitude], // Swap the coordinates
          };
          formData.append("location", JSON.stringify(updatedLocation));
        } else {
          // Use the existing location data if coordinates are not provided
          formData.append("location", JSON.stringify(editingResort.location));
        }
      } else if (values.locationType && values.coordinates) {
        // Create a new location object if locationType and coordinates are provided
        const [latitude, longitude] = values.coordinates
          .split(",")
          .map((coord) => parseFloat(coord.trim()));
        formData.append(
          "location",
          JSON.stringify({
            type: values.locationType,
            coordinates: [longitude, latitude], // Swap the coordinates
          })
        );
      }

      // Handle image upload logic
      const hasImageInForm = values.image && values.image.length > 0;
      const hasNewImageFile = hasImageInForm && values.image[0].originFileObj;
      const hasExistingImage = editingResort && editingResort.imageUrl;
      
      console.log("Image handling debug:");
      console.log("- values.image:", values.image);
      console.log("- hasImageInForm:", hasImageInForm);
      console.log("- hasNewImageFile:", hasNewImageFile);
      console.log("- hasExistingImage:", hasExistingImage);
      console.log("- editingResort.imageUrl:", editingResort?.imageUrl);
      
      if (hasImageInForm) {
        console.log("- File object details:");
        console.log("  - name:", values.image[0].name);
        console.log("  - uid:", values.image[0].uid);
        console.log("  - lastModified:", values.image[0].lastModified);
        console.log("  - originFileObj:", values.image[0].originFileObj);
        console.log("  - originFileObj.name:", values.image[0].originFileObj?.name);
        console.log("  - originFileObj.lastModified:", values.image[0].originFileObj?.lastModified);
        console.log("  - status:", values.image[0].status);
      }
      
      if (hasNewImageFile) {
        // Send new image
        console.log("✓ Sending new image file:", values.image[0].originFileObj.name);
        formData.append("imageFile", values.image[0].originFileObj);
      } else if (hasExistingImage && !hasImageInForm) {
        // Preserve existing only if no image in form
        console.log("✓ Preserving existing image:", editingResort.imageUrl);
        formData.append("existingImageUrl", editingResort.imageUrl);
      } else {
        console.log("✓ No image data - will clear image");
      }
      
      console.log("=== FINAL IMAGE DECISION ===");
      console.log("Decision: ", hasNewImageFile ? "SEND_NEW_IMAGE" : (hasExistingImage && !hasImageInForm) ? "PRESERVE_EXISTING" : "CLEAR_IMAGE");
      console.log("FormData keys:", Array.from(formData.keys()));
      console.log("=== END IMAGE DECISION ===");

      if (editingResort) {
        formData.append("_id", editingResort._id);
        await onUpdateResort(formData);
      } else {
        await onUpdateResort(formData);
      }

      form.resetFields();
      setGeoJSONFile(null);
      setImageFileList([]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const geoJSONProps = {
    name: "geoJSONFile",
    multiple: false,
    accept: ".geojson",
    beforeUpload: (file) => {
      setGeoJSONFile(file);
      return false;
    },
    onRemove: () => {
      setGeoJSONFile(null);
    },
  };

  return (
    <div style={{ position: 'relative', paddingBottom: 80 }}>
      <Form
        form={form}
        onFinish={onFinish}
        layout="vertical"
        scrollToFirstError
      >
        <Collapse 
          defaultActiveKey={['basic', 'location']} 
          ghost
          style={{ marginBottom: 16 }}
        >
          {/* Basic Information Panel */}
          <Panel 
            header={
              <Space>
                <InfoCircleOutlined />
                <span style={{ fontWeight: 600 }}>Basic Information</span>
              </Space>
            } 
            key="basic"
          >
            <Row gutter={[16, 0]}>
              <Col xs={24} sm={12}>
                <Form.Item name="name" label="Resort Name" rules={[{ required: true }]}>
                  <Input size="large" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item 
                  name="website" 
                  label="Website" 
                  rules={[
                    {
                      type: 'url',
                      message: 'Please enter a valid URL (e.g., https://example.com)',
                    },
                  ]}
                >
                  <Input placeholder="https://example.com" size="large" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="country" label="Country">
                  <Input size="large" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="province" label="Province">
                  <Input size="large" />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item name="information" label="Information">
                  <Input.TextArea rows={3} />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item name="notes" label="Notes">
                  <Input.TextArea rows={3} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item 
                  name="flagged" 
                  label="Flag Status" 
                  valuePropName="checked"
                  tooltip="Flag this resort for special attention or review"
                >
                  <Switch 
                    checkedChildren={<FlagOutlined />}
                    unCheckedChildren="Normal"
                    style={{ backgroundColor: form.getFieldValue('flagged') ? '#ff4d4f' : undefined }}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Panel>

          {/* Location & Technical Panel */}
          <Panel 
            header={
              <Space>
                <EnvironmentOutlined />
                <span style={{ fontWeight: 600 }}>Location & Technical Data</span>
              </Space>
            } 
            key="location"
          >
            <Row gutter={[16, 0]}>
              <Col xs={24} sm={12}>
                <Form.Item name="locationType" label="Location Type">
                  <Select size="large">
                    <Option value="Point">Point</Option>
                    <Option value="LineString">LineString</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="coordinates" label="Coordinates">
                  <Input placeholder="Enter coordinates separated by commas" size="large" />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item name="mapboxVectorUrl" label="Mapbox Vector URL">
                  <Input size="large" />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item name="geoJSONFile" label="GeoJSON File" valuePropName="file">
                  <Dragger {...geoJSONProps}>
                    <p className="ant-upload-drag-icon">
                      <InboxOutlined />
                    </p>
                    <p className="ant-upload-text">
                      Click or drag a GeoJSON file to this area to upload
                    </p>
                  </Dragger>
                </Form.Item>
              </Col>
            </Row>
          </Panel>

          {/* Terrain & Statistics Panel */}
          <Panel 
            header={
              <Space>
                <AreaChartOutlined />
                <span style={{ fontWeight: 600 }}>Terrain & Statistics</span>
              </Space>
            } 
            key="terrain"
          >
            <Row gutter={[16, 0]}>
              <Col xs={24} sm={12}>
                <Form.Item name="baseElevation" label="Base Elevation">
                  <Input size="large" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="topElevation" label="Top Elevation">
                  <Input size="large" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="longestRun" label="Longest Run">
                  <Input size="large" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="skiable_terrain" label="Skiable Terrain">
                  <Input size="large" />
                </Form.Item>
              </Col>
              
              {/* Runs */}
              <Col xs={12} sm={6}>
                <Form.Item name={["runs", "open"]} label="Open Runs">
                  <InputNumber style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={12} sm={6}>
                <Form.Item name={["runs", "total"]} label="Total Runs">
                  <InputNumber style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              
              {/* Lifts */}
              <Col xs={12} sm={6}>
                <Form.Item name={["lifts", "open"]} label="Open Lifts">
                  <InputNumber style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={12} sm={6}>
                <Form.Item name={["lifts", "total"]} label="Total Lifts">
                  <InputNumber style={{ width: '100%' }} />
                </Form.Item>
              </Col>

              {/* Other facilities */}
              <Col xs={12} sm={6}>
                <Form.Item name="terrainParks" label="Terrain Parks">
                  <InputNumber style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={12} sm={6}>
                <Form.Item name="gondolas" label="Gondolas">
                  <InputNumber style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={12} sm={6}>
                <Form.Item 
                  name="snowCats" 
                  label="Snow Cats"
                  tooltip="Number of snowcats available for guided tours. Set to 0 to disable snowcat tours."
                >
                  <InputNumber 
                    min={0}
                    style={{ width: '100%' }} 
                    placeholder="0"
                  />
                </Form.Item>
              </Col>
              <Col xs={12} sm={6}>
                <Form.Item 
                  name="helicopters" 
                  label="Helicopters"
                  tooltip="Number of helicopters available for heli skiing. Set to 0 to disable heli skiing."
                >
                  <InputNumber 
                    min={0}
                    style={{ width: '100%' }} 
                    placeholder="0"
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* Heli Skiing Packages */}
            <Row gutter={[16, 8]}>
              <Col span={24}>
                <Typography.Title level={5} style={{ margin: '16px 0 8px 0', color: '#1890ff' }}>
                  🚁 Heli Skiing Packages {loadingHelicopterData && <span style={{ fontSize: '12px', color: '#666' }}>(Loading...)</span>}
                </Typography.Title>
              </Col>
            </Row>
            
            <Form.List name={['heliSkiing', 'packages']}>
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Row key={key} gutter={[16, 8]} style={{ marginBottom: 16, padding: '12px', backgroundColor: '#f8faff', borderRadius: '6px', border: '1px solid #d6e4ff' }}>
                      <Col xs={24} sm={8}>
                        <Form.Item
                          {...restField}
                          name={[name, 'name']}
                          label="Package Name"
                          rules={[{ required: true, message: 'Package name is required' }]}
                        >
                          <Input placeholder="3-Run Package" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={6}>
                        <Form.Item
                          {...restField}
                          name={[name, 'price']}
                          label="Price ($)"
                          rules={[{ required: true, message: 'Price is required' }]}
                        >
                          <InputNumber
                            prefix="$"
                            style={{ width: '100%' }}
                            placeholder="1299.00"
                            step={0.01}
                            min={0}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={4}>
                        <Form.Item
                          {...restField}
                          name={[name, 'runs']}
                          label="Runs"
                        >
                          <InputNumber
                            style={{ width: '100%' }}
                            placeholder="3"
                            min={1}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={4}>
                        <Form.Item
                          {...restField}
                          name={[name, 'skillLevel']}
                          label="Skill Level"
                        >
                          <Select placeholder="Beginner">
                            <Option value="Beginner">Beginner</Option>
                            <Option value="Intermediate">Intermediate</Option>
                            <Option value="Advanced">Advanced</Option>
                            <Option value="Expert">Expert</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={2} style={{ display: 'flex', alignItems: 'end', justifyContent: 'center' }}>
                        <Button 
                          type="text" 
                          danger 
                          onClick={() => remove(name)}
                          style={{ marginBottom: 24 }}
                        >
                          Remove
                        </Button>
                      </Col>
                      <Col xs={24}>
                        <Form.Item
                          {...restField}
                          name={[name, 'description']}
                          label="Description"
                        >
                          <Input placeholder="Introduction to Heli-Skiing" />
                        </Form.Item>
                      </Col>
                    </Row>
                  ))}
                  <Row>
                    <Col span={24}>
                      <Button 
                        type="dashed" 
                        onClick={() => add()} 
                        style={{ width: '100%', marginBottom: 16 }}
                      >
                        + Add Heli Skiing Package
                      </Button>
                    </Col>
                  </Row>
                </>
              )}
            </Form.List>

            {/* Snowcat Tours Packages */}
            <Row gutter={[16, 8]}>
              <Col span={24}>
                <Typography.Title level={5} style={{ margin: '16px 0 8px 0', color: '#52c41a' }}>
                  🚗 Snowcat Tours Packages
                </Typography.Title>
              </Col>
            </Row>
            
            <Form.List name={['snowcatTours', 'packages']}>
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Row key={key} gutter={[16, 8]} style={{ marginBottom: 16, padding: '12px', backgroundColor: '#f6ffed', borderRadius: '6px', border: '1px solid #b7eb8f' }}>
                      <Col xs={24} sm={8}>
                        <Form.Item
                          {...restField}
                          name={[name, 'name']}
                          label="Package Name"
                          rules={[{ required: true, message: 'Package name is required' }]}
                        >
                          <Input placeholder="Snowcat Adventure" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={6}>
                        <Form.Item
                          {...restField}
                          name={[name, 'price']}
                          label="Price ($)"
                          rules={[{ required: true, message: 'Price is required' }]}
                        >
                          <InputNumber
                            prefix="$"
                            style={{ width: '100%' }}
                            placeholder="350.00"
                            step={0.01}
                            min={0}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={6}>
                        <Form.Item
                          {...restField}
                          name={[name, 'duration']}
                          label="Duration"
                        >
                          <Select placeholder="Full Day">
                            <Option value="Half Day">Half Day</Option>
                            <Option value="Full Day">Full Day</Option>
                            <Option value="Multi Day">Multi Day</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={2} style={{ display: 'flex', alignItems: 'end', justifyContent: 'center' }}>
                        <Button 
                          type="text" 
                          danger 
                          onClick={() => remove(name)}
                          style={{ marginBottom: 24 }}
                        >
                          Remove
                        </Button>
                      </Col>
                      <Col xs={24}>
                        <Form.Item
                          {...restField}
                          name={[name, 'description']}
                          label="Description"
                        >
                          <Input placeholder="Guided snowcat tour experience" />
                        </Form.Item>
                      </Col>
                    </Row>
                  ))}
                  <Row>
                    <Col span={24}>
                      <Button 
                        type="dashed" 
                        onClick={() => add()} 
                        style={{ width: '100%', marginBottom: 16 }}
                      >
                        + Add Snowcat Package
                      </Button>
                    </Col>
                  </Row>
                </>
              )}
            </Form.List>
          </Panel>

          {/* Ski Passes & Media Panel */}
          <Panel 
            header={
              <Space>
                <CameraOutlined />
                <span style={{ fontWeight: 600 }}>Ski Passes & Media</span>
              </Space>
            } 
            key="media"
          >
            <Row gutter={[16, 0]}>
              <Col xs={24}>
                <Form.Item name="skiPasses" label="Ski Passes">
                  <Select
                    mode="multiple"
                    size="large"
                    style={{ width: '100%' }}
                    placeholder="Select ski passes"
                    loading={loadingSkiPasses}
                    filterOption={(input, option) => {
                      const pass = skiPasses.find(p => p._id === option.value);
                      if (!pass) return false;
                      const searchText = input.toLowerCase();
                      return (
                        pass.name.toLowerCase().includes(searchText) ||
                        pass.season.toLowerCase().includes(searchText)
                      );
                    }}
                    tagRender={(props) => {
                      const { label, value, closable, onClose } = props;
                      const pass = skiPasses.find(p => p._id === value);
                      return (
                        <span
                          style={{
                            backgroundColor: pass?.color || '#1890ff',
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            margin: '2px',
                            display: 'inline-block',
                            fontSize: '12px'
                          }}
                        >
                          {label}
                          {closable && (
                            <span 
                              onClick={onClose}
                              style={{ marginLeft: '8px', cursor: 'pointer' }}
                            >
                              ×
                            </span>
                          )}
                        </span>
                      );
                    }}
                  >
                    {skiPasses.map((pass) => (
                      <Option key={pass._id} value={pass._id}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div
                            style={{
                              width: '12px',
                              height: '12px',
                              backgroundColor: pass.color || '#1890ff',
                              borderRadius: '50%',
                              marginRight: '8px'
                            }}
                          />
                          {pass.name}
                          <span style={{ color: '#666', marginLeft: '8px', fontSize: '12px' }}>
                            ({pass.season})
                          </span>
                        </div>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item name="image" label="Image" valuePropName="fileList">
                  {editingResort && editingResort.imageUrl && (
                    <div style={{ marginBottom: '16px' }}>
                      <p style={{ marginBottom: '8px' }}>Current Image:</p>
                      <img 
                        src={editingResort.imageUrl} 
                        alt="Current resort image" 
                        style={{ maxWidth: '200px', maxHeight: '150px', objectFit: 'cover', borderRadius: '8px' }}
                      />
                      <p style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                        Upload a new image to replace the current one, or leave empty to keep the current image.
                      </p>
                    </div>
                  )}
                  <Dragger
                    accept="image/*"
                    maxCount={1}
                    fileList={imageFileList}
                    customRequest={({ file, onSuccess }) => {
                      console.log("File selected in upload component:", file.name);
                      console.log("File object:", file);
                      console.log("File size:", file.size);
                      console.log("File lastModified:", file.lastModified);
                      console.log("File type:", file.type);
                      
                      // Immediately call onSuccess to mark upload as complete without actually uploading
                      setTimeout(() => {
                        onSuccess("ok");
                      }, 0);
                    }}
                    onChange={(info) => {
                      console.log("Upload onChange triggered:", info);
                      console.log("FileList in onChange:", info.fileList);
                      console.log("File status:", info.file.status);
                      console.log("File originFileObj exists:", !!info.file.originFileObj);
                      
                      // When a new file is added, completely replace the old one
                      if (info.file.status === 'uploading' || info.file.status === 'done') {
                        console.log("New file being processed:", {
                          name: info.file.name,
                          uid: info.file.uid,
                          status: info.file.status,
                          lastModified: info.file.lastModified,
                          size: info.file.size,
                          hasOriginFileObj: !!info.file.originFileObj,
                          originFileObj: info.file.originFileObj ? {
                            name: info.file.originFileObj.name,
                            lastModified: info.file.originFileObj.lastModified,
                            size: info.file.originFileObj.size
                          } : null
                        });
                        
                        // Ensure the file has originFileObj (actual file data)
                        if (info.file.originFileObj) {
                          // Force replace with only the new file
                          const newFileList = [info.file];
                          
                          // Update our controlled state
                          setImageFileList(newFileList);
                          
                          // Update the form field manually
                          form.setFieldsValue({ image: newFileList });
                          
                          console.log("✓ Successfully set new file in form:", newFileList);
                        } else {
                          console.warn("⚠️ File uploaded but no originFileObj found");
                        }
                      } else if (info.file.status === 'removed') {
                        // Handle file removal
                        setImageFileList([]);
                        form.setFieldsValue({ image: [] });
                        console.log("File removed, cleared fileList");
                      } else if (info.file.status === 'error') {
                        console.error("File upload error:", info.file.error);
                      }
                    }}
                    showUploadList={{
                      showPreviewIcon: true,
                      showRemoveIcon: true,
                    }}
                  >
                    <p className="ant-upload-drag-icon">
                      <InboxOutlined />
                    </p>
                    <p className="ant-upload-text">
                      Click or drag an image file to this area to upload
                    </p>
                  </Dragger>
                </Form.Item>
              </Col>
            </Row>
          </Panel>
        </Collapse>
      </Form>

      {/* Sticky Submit Button */}
      <Affix offsetBottom={0}>
        <div style={{
          background: '#fff',
          padding: '16px 24px',
          borderTop: '1px solid #f0f0f0',
          borderRadius: '8px 8px 0 0',
          boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ color: '#666', fontSize: '14px' }}>
            {editingResort ? 'Editing' : 'Adding'} resort
          </div>
          <Button 
            type="primary" 
            size="large"
            icon={<SaveOutlined />}
            loading={isSubmitting}
            onClick={() => form.submit()}
            style={{
              borderRadius: '8px',
              height: '40px',
              paddingLeft: '24px',
              paddingRight: '24px',
              fontSize: '16px',
              fontWeight: 600
            }}
          >
            {editingResort ? "Update Resort" : "Add Resort"}
          </Button>
        </div>
      </Affix>
    </div>
  );
};
export default ResortForm;

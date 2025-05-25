import React, { useEffect, useState } from "react";
import { Form, Input, Button, Upload, Select, InputNumber } from "antd";
import { InboxOutlined, UploadOutlined } from "@ant-design/icons";
import { uploadImageToGCS } from "../../../services/GoogleBucketService";
import { fetchSkiPasses } from "../../../services/skiPassService";

const { Dragger } = Upload;
const { Option } = Select;

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

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
    } else if (editingResort) {
      form.setFieldsValue({
        ...editingResort,
        runs: {
          open: editingResort.runs?.open || null,
          total: editingResort.runs?.total || 0,
        },
        lifts: {
          open: editingResort.lifts?.open || null,
          total: editingResort.lifts?.total || 0,
        },
        skiPasses: editingResort.skiPasses?.map(pass => 
          typeof pass === 'object' ? pass._id : pass
        ) || [],
      });
    } else {
      form.resetFields();
    }
  }, [editingResort, form, initialValues]);

  const onFinish = async (values) => {
    console.log("Form values:", values);
    console.log("Image field in values:", values.image);
    console.log("Image array length:", values.image?.length);
    console.log("First image file:", values.image?.[0]);
    const formData = new FormData();
    formData.append("name", values.name);
    formData.append("province", values.province);
    formData.append("country", values.country);
    formData.append("information", values.information);
    formData.append("longestRun", values.longestRun);
    formData.append("baseElevation", values.baseElevation);
    formData.append("topElevation", values.topElevation);
    formData.append("notes", values.notes);
    formData.append("runs", JSON.stringify(values.runs));
    formData.append("terrainParks", values.terrainParks);
    formData.append("lifts", JSON.stringify(values.lifts));
    formData.append("gondolas", values.gondolas);
    formData.append("skiable_terrain", values.skiable_terrain);
    formData.append("snowCats", values.snowCats);
    formData.append("helicopters", values.helicopters);
    formData.append("mapboxVector", values.mapboxVectorUrl);

    // Add ski passes to form data
    if (values.skiPasses && values.skiPasses.length > 0) {
      formData.append("skiPasses", JSON.stringify(values.skiPasses));
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

    if (values.image && values.image.length > 0 && values.image[0].originFileObj) {
      // New image uploaded - send only the new image file
      console.log("Sending new image file:", values.image[0].originFileObj.name);
      formData.append("imageFile", values.image[0].originFileObj);
    } else if (editingResort && editingResort.imageUrl) {
      // No new image provided - preserve existing image
      console.log("Preserving existing image:", editingResort.imageUrl);
      formData.append("existingImageUrl", editingResort.imageUrl);
    } else {
      console.log("No image data - will clear image");
    }

    if (editingResort) {
      formData.append("_id", editingResort._id);
      onUpdateResort(formData);
    } else {
      onUpdateResort(formData);
    }

    form.resetFields();
    setGeoJSONFile(null);
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
    <Form
      form={form}
      onFinish={onFinish}
      labelCol={{ span: 6 }}
      wrapperCol={{ span: 18 }}
    >
      <Form.Item name="name" label="Resort Name" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item name="country" label="Country">
        <Input />
      </Form.Item>
      <Form.Item name="province" label="Province">
        <Input />
        <Form.Item name="mapboxVectorUrl" label="mapboxVectorUrl">
        <Input />
      </Form.Item>
      </Form.Item>
      <Form.Item name="locationType" label="Location Type">
        <Select>
          <Option value="Point">Point</Option>
          <Option value="LineString">LineString</Option>
        </Select>
      </Form.Item>
      <Form.Item name="coordinates" label="Coordinates">
        <Input placeholder="Enter coordinates separated by commas" />
      </Form.Item>
      <Form.Item name="information" label="Information">
        <Input.TextArea rows={4} />
      </Form.Item>
      <Form.Item name="longestRun" label="Longest Run">
        <Input />
      </Form.Item>
      <Form.Item name="baseElevation" label="Base Elevation">
        <Input />
      </Form.Item>
      <Form.Item name="topElevation" label="Top Elevation">
        <Input />
      </Form.Item>
      <Form.Item name="notes" label="Notes">
        <Input.TextArea rows={4} />
      </Form.Item>
      <Form.Item name={["runs", "open"]} label="Open Runs">
        <InputNumber />
      </Form.Item>
      <Form.Item name={["runs", "total"]} label="Total Runs">
        <InputNumber />
      </Form.Item>
      <Form.Item name="terrainParks" label="Terrain Parks">
        <InputNumber />
      </Form.Item>
      <Form.Item name="gondolas" label="Gondolas">
        <InputNumber />
      </Form.Item>
      <Form.Item name={["lifts", "open"]} label="Open Lifts">
        <InputNumber />
      </Form.Item>
      <Form.Item name={["lifts", "total"]} label="Total Lifts">
        <InputNumber />
      </Form.Item>
      <Form.Item name="snowCats" label="Snow Cats">
        <InputNumber />
      </Form.Item>
      <Form.Item name="helicopters" label="Helicopters">
        <InputNumber />
      </Form.Item>
      <Form.Item name="skiable_terrain" label="Skiable Terrain">
        <Input />
      </Form.Item>
      <Form.Item name="skiPasses" label="Ski Passes">
        <Select
          mode="multiple"
          style={{ width: '100%' }}
          placeholder="Select ski passes"
          optionFilterProp="children"
          loading={loadingSkiPasses}
          filterOption={(input, option) =>
            option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
          }
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
          name="image"
          accept="image/*"
          beforeUpload={(file) => {
            console.log("File selected in upload component:", file.name);
            return false;
          }}
          maxCount={1}
          onChange={(info) => {
            console.log("Upload onChange:", info);
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
      <Form.Item wrapperCol={{ offset: 6, span: 18 }}>
        <Button type="primary" htmlType="submit">
          {editingResort ? "Update Resort" : "Add Resort"}
        </Button>
      </Form.Item>
    </Form>
  );
};
export default ResortForm;

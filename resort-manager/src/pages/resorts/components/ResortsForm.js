import React, { useEffect, useState } from "react";
import { Form, Input, Button, Upload, Select, InputNumber } from "antd";
import { InboxOutlined, UploadOutlined } from "@ant-design/icons";
import { uploadImageToGCS } from "../../../services/GoogleBucketService";

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
      });
    } else {
      form.resetFields();
    }
  }, [editingResort, form, initialValues]);

  const onFinish = async (values) => {
    console.log("Form values:", values);
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

    if (values.image && values.image.fileList && values.image.fileList[0]) {
      formData.append("imageFile", values.image.fileList[0].originFileObj);
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
      <Form.Item name="image" label="Image" valuePropName="file">
        <Dragger
          name="image"
          accept="image/*"
          beforeUpload={() => false}
          maxCount={1}
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

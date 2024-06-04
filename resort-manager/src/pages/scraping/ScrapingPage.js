import React, { useState } from 'react';
import { Form, Input, Button, message, Steps } from 'antd';
import scrapingService from '../../services/ScrapingService';
import ResortsForm from '../resorts/components/ResortsForm';

const { Step } = Steps;

const ScrapingPage = () => {
  const [form] = Form.useForm();
  const [current, setCurrent] = useState(0);
  const [scrapedData, setScrapedData] = useState(null);

  const handleSubmit = async (values) => {
    try {
      const data = await scrapingService.scrapeAndIngest(values.name, values.url);
      setScrapedData(data);
      setCurrent(1);
      message.success('Data scraped and ingested successfully');
    } catch (error) {
      message.error('Error scraping and ingesting data');
    }
  };

  const handleResortsFormSubmit = async (values) => {
    try {
      // Handle the submission of the ResortsForm data
      console.log('ResortsForm data:', values);
      setCurrent(2);
      message.success('Resort data submitted successfully');
    } catch (error) {
      message.error('Error submitting resort data');
    }
  };

  const steps = [
    {
      title: 'Scrape and Ingest',
      content: (
        <Form form={form} onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please enter a name' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="url"
            label="URL"
            rules={[{ required: true, message: 'Please enter a URL' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Scrape and Ingest
            </Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      title: 'Resort Details',
      content: <ResortsForm onSubmit={handleResortsFormSubmit} initialValues={scrapedData} />,
    },
    {
      title: 'Complete',
      content: <div>Scraping and ingestion process completed successfully!</div>,
    },
  ];

  return (
    <div>
      <h2>Scrape and Ingest Data</h2>
      <div style={{ marginTop: '24px' }}>
        <Steps current={current}>
          {steps.map((step) => (
            <Step key={step.title} title={step.title} />
          ))}
        </Steps>
      </div>
      <div style={{ marginTop: '32px' }}>{steps[current].content}</div>
    </div>
  );
};

export default ScrapingPage;
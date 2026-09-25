import { useEffect, useState } from 'react';
import { Button, Card, DatePicker, Form, Input, InputNumber, Modal, Select, Space, Table, Tag, Typography, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useFactorStore } from '../stores/factorStore';
import { useAuth } from '../hooks/useAuth';
import { ActivityCategory, ACTIVITY_CATEGORY_LABELS } from '../constants/activity';
import { Messages } from '../constants/messages';
import { CarbonFactor } from '../types/entities';
import { formatDate } from '../utils/formatters';

const categoryOptions = Object.values(ActivityCategory).map((value) => ({ value, label: ACTIVITY_CATEGORY_LABELS[value] }));

export function Factors() {
  const [open, setOpen] = useState(false);
  const rows = useFactorStore((state) => state.rows);
  const load = useFactorStore((state) => state.load);
  const addVersion = useFactorStore((state) => state.addVersion);
  const { token } = useAuth();

  useEffect(() => {
    if (!token) return;
    void load();
  }, [load, token]);

  return (
    <Card>
      <Space style={{ justifyContent: 'space-between', width: '100%', marginBottom: 16 }}>
        <div>
          <Typography.Title level={2} style={{ marginBottom: 4 }}>地区排放因子</Typography.Title>
          <Typography.Text type="secondary">同一分类 / 子类型 / 地区按生效日期管理多版本；新版本从填写日期起生效，旧版本自动截止前一天。</Typography.Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>新增因子版本</Button>
      </Space>
      <Table<CarbonFactor>
        rowKey="id"
        dataSource={rows}
        pagination={{ pageSize: 10 }}
        columns={[
          { title: '地区', dataIndex: 'region' },
          { title: '分类', dataIndex: 'category', render: (value: ActivityCategory) => ACTIVITY_CATEGORY_LABELS[value] || value },
          { title: '子类型', dataIndex: 'subType' },
          {
            title: '因子值',
            dataIndex: 'factorValue',
            render: (value: string, record) => <Typography.Text strong>{Number(value).toFixed(4)}</Typography.Text>,
            sorter: (a, b) => Number(a.factorValue) - Number(b.factorValue)
          },
          { title: '单位', dataIndex: 'unit' },
          { title: '生效开始', dataIndex: 'effectiveFrom', render: formatDate, sorter: (a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom), defaultSortOrder: 'descend' },
          {
            title: '生效结束',
            dataIndex: 'effectiveTo',
            render: (value: string | null) => (value ? formatDate(value) : <Tag color="green">至今</Tag>)
          }
        ]}
      />
      <Modal title="新增因子版本" open={open} onCancel={() => setOpen(false)} footer={null} destroyOnClose>
        <Form
          layout="vertical"
          initialValues={{ category: ActivityCategory.ENERGY, unit: 'kWh', effectiveFrom: dayjs() }}
          onFinish={async (values) => {
            await addVersion({ ...values, effectiveFrom: values.effectiveFrom.format('YYYY-MM-DD') });
            message.success(Messages.FRONTEND_FACTOR_VERSION_SAVED);
            setOpen(false);
          }}
        >
          <Form.Item name="category" label="分类" rules={[{ required: true }]}>
            <Select options={categoryOptions} />
          </Form.Item>
          <Form.Item name="subType" label="子类型" rules={[{ required: true }]}>
            <Input placeholder="metro / electricity / beef-meal / parcel" />
          </Form.Item>
          <Form.Item name="region" label="地区" rules={[{ required: true }]}>
            <Input placeholder="Shanghai / Hangzhou / Beijing" />
          </Form.Item>
          <Form.Item name="factorValue" label="因子值" rules={[{ required: true }]}>
            <InputNumber min={0} step={0.0001} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="unit" label="单位" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="effectiveFrom" label="生效日期（同一天不可重复建版本）" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>保存版本</Button>
        </Form>
      </Modal>
    </Card>
  );
}

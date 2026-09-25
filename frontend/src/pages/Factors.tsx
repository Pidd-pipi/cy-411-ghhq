import { useEffect, useState } from 'react';
import { Button, Card, DatePicker, Form, Input, InputNumber, Modal, Select, Space, Table, Typography, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { createFactor, fetchFactors } from '../api/factor';
import { CategoryBadge } from '../components/common/CategoryBadge';
import { ActivityCategory, ACTIVITY_CATEGORY_LABELS } from '../constants/activity';
import { Messages } from '../constants/messages';
import { useAuth } from '../hooks/useAuth';
import { CarbonFactor } from '../types/entities';
import { formatDate, formatFactor } from '../utils/formatters';

export function Factors() {
  const [rows, setRows] = useState<CarbonFactor[]>([]);
  const [category, setCategory] = useState<ActivityCategory | undefined>();
  const [open, setOpen] = useState(false);
  const { token } = useAuth();

  const load = async (nextCategory?: ActivityCategory) => {
    const data = await fetchFactors(nextCategory ? { category: nextCategory } : undefined);
    setRows(data);
  };

  useEffect(() => {
    if (!token) return;
    void load(category);
  }, [token, category]);

  return (
    <Card>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Space style={{ justifyContent: 'space-between', width: '100%' }}>
          <div>
            <Typography.Title level={2}>排放因子</Typography.Title>
            <Typography.Text type="secondary">按版本查看各因子有效日期与数值，新版本自填写日期起生效。</Typography.Text>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>新增因子版本</Button>
        </Space>
        <Select
          allowClear
          placeholder="按分类筛选"
          value={category}
          onChange={setCategory}
          style={{ width: 220 }}
          options={Object.values(ActivityCategory).map((value) => ({ value, label: ACTIVITY_CATEGORY_LABELS[value] }))}
        />
        <Table
          rowKey="id"
          dataSource={rows}
          pagination={{ pageSize: 10 }}
          columns={[
            { title: '分类', dataIndex: 'category', render: (value: ActivityCategory) => <CategoryBadge category={value} /> },
            { title: '子类型', dataIndex: 'subType' },
            { title: '地区', dataIndex: 'region' },
            { title: '因子值', dataIndex: 'factorValue', render: (value: string, row) => formatFactor(value, row.unit) },
            { title: '生效日期', dataIndex: 'effectiveFrom', render: formatDate },
            { title: '失效日期', dataIndex: 'effectiveTo', render: (value: string | null) => (value ? formatDate(value) : '至今') },
            { title: '更新时间', dataIndex: 'updatedAt', render: formatDate }
          ]}
        />
      </Space>
      <Modal title="新增因子版本" open={open} onCancel={() => setOpen(false)} footer={null} destroyOnClose>
        <Form
          layout="vertical"
          initialValues={{ category: ActivityCategory.TRANSPORT, region: 'Shanghai', effectiveFrom: dayjs() }}
          onFinish={async (values) => {
            await createFactor({ ...values, effectiveFrom: values.effectiveFrom.format('YYYY-MM-DD') });
            message.success(Messages.FRONTEND_FACTOR_SAVED);
            setOpen(false);
            await load(category);
          }}
        >
          <Form.Item name="category" label="分类" rules={[{ required: true }]}>
            <Select options={Object.values(ActivityCategory).map((value) => ({ value, label: ACTIVITY_CATEGORY_LABELS[value] }))} />
          </Form.Item>
          <Form.Item name="subType" label="子类型" rules={[{ required: true }]}>
            <Input placeholder="metro / electricity / beef-meal / parcel" />
          </Form.Item>
          <Form.Item name="factorValue" label="因子值" rules={[{ required: true }]}>
            <InputNumber min={0.0001} step={0.0001} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="unit" label="单位" rules={[{ required: true }]}>
            <Input placeholder="km / kWh / meal / item" />
          </Form.Item>
          <Form.Item name="region" label="地区" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="effectiveFrom" label="生效日期（旧版本于前一日截止，同日不可重复）" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>保存</Button>
        </Form>
      </Modal>
    </Card>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Button, DatePicker, Form, Input, InputNumber, Modal, Pagination, Select, Space, Typography, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { ActivityCard } from '../components/common/ActivityCard';
import { EmptyState } from '../components/common/EmptyState';
import { ActivityCategory, ACTIVITY_CATEGORY_LABELS } from '../constants/activity';
import { useActivityStore } from '../stores/activityStore';
import { useAuth } from '../hooks/useAuth';
import { usePagination } from '../hooks/usePagination';
import { Messages } from '../constants/messages';
import { ActivityPayload } from '../api/activity';
import { Activity } from '../types/entities';

const categoryOptions = Object.values(ActivityCategory).map((value) => ({ value, label: ACTIVITY_CATEGORY_LABELS[value] }));

export function Activities() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Activity | null>(null);
  const [category, setCategory] = useState<ActivityCategory | undefined>();
  const [form] = Form.useForm();
  const rows = useActivityStore((state) => state.rows);
  const load = useActivityStore((state) => state.load);
  const add = useActivityStore((state) => state.add);
  const update = useActivityStore((state) => state.update);
  const { token } = useAuth();
  const filtered = useMemo(() => (category ? rows.filter((row) => row.category === category) : rows), [rows, category]);
  const pagination = usePagination(filtered, 5);

  useEffect(() => {
    if (!token) return;
    void load();
  }, [load, token]);

  const openCreate = () => {
    setEditing(null);
    form.setFieldsValue({ category: ActivityCategory.TRANSPORT, subType: 'metro', unit: 'km', recordDate: dayjs() });
    setOpen(true);
  };

  const openEdit = (activity: Activity) => {
    setEditing(activity);
    form.setFieldsValue({
      category: activity.category,
      subType: activity.subType,
      amount: Number(activity.amount),
      unit: activity.unit,
      recordDate: dayjs(activity.recordDate),
      note: activity.note || undefined
    });
    setOpen(true);
  };

  const handleSubmit = async (values: Omit<ActivityPayload, 'recordDate'> & { recordDate: dayjs.Dayjs }) => {
    const payload = { ...values, recordDate: values.recordDate.format('YYYY-MM-DD') };
    if (editing) {
      await update(editing.id, payload);
      message.success(Messages.FRONTEND_ACTIVITY_UPDATED);
    } else {
      await add(payload);
      message.success(Messages.FRONTEND_ACTIVITY_SAVED);
    }
    setOpen(false);
  };

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Space style={{ justifyContent: 'space-between', width: '100%' }}>
        <div>
          <Typography.Title level={2}>活动记录</Typography.Title>
          <Typography.Text type="secondary">按记录日期自动选取当时生效的因子版本，补录或改期后重新计算。</Typography.Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新增活动</Button>
      </Space>
      <Select
        allowClear
        placeholder="按分类筛选"
        value={category}
        onChange={setCategory}
        style={{ width: 220 }}
        options={categoryOptions}
      />
      <div className="card-grid">
        {pagination.currentRows.length ? pagination.currentRows.map((activity) => <ActivityCard key={activity.id} activity={activity} onEdit={openEdit} />) : <EmptyState text="暂无活动记录" />}
      </div>
      <Pagination current={pagination.page} pageSize={pagination.pageSize} total={pagination.total} onChange={(page, size) => { pagination.setPage(page); pagination.setPageSize(size); }} />
      <Modal title={editing ? '补录 / 改期活动' : '新增活动'} open={open} onCancel={() => setOpen(false)} footer={null} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="category" label="分类" rules={[{ required: true }]}>
            <Select options={categoryOptions} />
          </Form.Item>
          <Form.Item name="subType" label="子类型" rules={[{ required: true }]}>
            <Input placeholder="metro / electricity / beef-meal / parcel" />
          </Form.Item>
          <Form.Item name="amount" label="数量" rules={[{ required: true }]}>
            <InputNumber min={0.01} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="unit" label="单位" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="recordDate" label="日期（按此日期匹配因子版本）" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="note" label="备注">
            <Input />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>保存</Button>
        </Form>
      </Modal>
    </Space>
  );
}

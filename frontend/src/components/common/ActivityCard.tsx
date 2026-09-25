import { Card, Space, Tooltip, Typography } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { Activity } from '../../types/entities';
import { formatCarbon, formatDate } from '../../utils/formatters';
import { CategoryBadge } from './CategoryBadge';

interface ActivityCardProps {
  activity: Activity;
  onEdit?: (activity: Activity) => void;
}

export function ActivityCard({ activity, onEdit }: ActivityCardProps) {
  return (
    <Card
      className="activity-card"
      size="small"
      extra={onEdit ? <Tooltip title="补录或改期"><EditOutlined onClick={() => onEdit(activity)} /></Tooltip> : undefined}
    >
      <Space direction="vertical" size={6} style={{ width: '100%' }}>
        <Space style={{ justifyContent: 'space-between', width: '100%' }}>
          <CategoryBadge category={activity.category} />
          <Typography.Text strong>{formatCarbon(activity.carbonValue)}</Typography.Text>
        </Space>
        <Typography.Text>{activity.subType} · {Number(activity.amount).toFixed(2)} {activity.unit}</Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          采用因子 {activity.factor ? `${Number(activity.factor.factorValue).toFixed(4)} ${activity.factor.unit}（生效 ${formatDate(activity.factor.effectiveFrom)}）` : '无匹配因子'}
        </Typography.Text>
        <div className="split-line">
          <span>{formatDate(activity.recordDate)}</span>
          <span>{activity.note || '无备注'}</span>
        </div>
      </Space>
    </Card>
  );
}

export const Messages = {
  FRONTEND_ACTIVITY_SAVED: '活动记录已同步到碳账本',
  FRONTEND_ACTIVITY_UPDATED: '活动已按记录日期重新选取因子并计算',
  FRONTEND_GOAL_SAVED: '减排目标已更新',
  FRONTEND_PROFILE_SAVED: '个人资料已保存',
  FRONTEND_FACTOR_REQUIRED: '请先选择匹配的排放因子',
  FRONTEND_FACTOR_VERSION_SAVED: '因子新版本已生效，旧版本自动截止前一天',
  FRONTEND_FACTOR_NO_VERSION: '该日期没有可用因子版本，记录未保存',
  BACKEND_SHARED_COPY: '前后端耦合文案：修改文案时需要同步后端 constants/messages.ts',
  LOG_ACTIVITY_CATEGORY: 'ActivityCategory affects filters, chart legends, logs and errors',
  LOG_GOAL_STATUS: 'GoalStatus affects list badges, progress cards, logs and errors'
} as const;


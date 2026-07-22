/** 集中管理面向学员的状态文案，把技术术语翻译成人话。 */

/** 角色枚举 → 中文 */
export function roleText(role: string): string {
  switch (role) {
    case 'LEARNER': return '学员';
    case 'GROUP_LEADER': return '组长';
    case 'COACH': return '教练';
    case 'REVIEW_BOARD': return '评审团';
    case 'CAMP_ADMIN': return '营长';
    case 'PLATFORM_ADMIN': return '平台管理员';
    default: return role;
  }
}

/** 期次状态枚举 → 中文 */
export function cohortStatusText(status: string): string {
  switch (status) {
    case 'PLANNING': return '筹备中';
    case 'RUNNING': return '进行中';
    case 'CLOSED': return '已结营';
    default: return status;
  }
}

/** 启用状态 → 中文 */
export function activeText(active: boolean): string {
  return active ? '启用' : '停用';
}

/** 判题方式 → 人话说明（侧栏/卡片用） */
export function verifyTypeText(verifyType: string): string {
  switch (verifyType) {
    case 'CI': return '提交后自动判题（通过 = 🟡）；🟢 由教练复核给出';
    case 'LLM': return '提交后 AI 预评；🟢 由教练复核给出';
    case 'HYBRID': return '提交后自动检查 + AI 预评；🟢 由教练复核给出';
    case 'PEER': return '完成平台指派的跨组评审后，由平台判定';
    case 'MANUAL': return '由教练人工判定';
    default: return verifyType;
  }
}

/** 🟢 判定方 → 人话 */
export function greenByText(greenBy: string): string {
  switch (greenBy) {
    case 'COACH': return '教练复核';
    case 'PEER_TEST': return '跨组互测';
    case 'AUTO': return '自动判定';
    default: return greenBy;
  }
}

/** 关卡尝试状态 → 人话 */
export function attemptStatusText(status: string | null | undefined, color: string | null | undefined): string {
  if (color === 'GREEN') return '🟢 优秀';
  if (color === 'YELLOW') return '🟡 通过';
  if (color === 'RED') return '🔴 未通过';
  if (status === 'SUBMITTED') return '判题中…';
  if (status === 'IN_PROGRESS') return '进行中';
  if (!status || status === 'UNLOCKED' || status === 'LOCKED') return '未开始';
  return status;
}

/** IM 通知适配器：配置了 webhook 就推群机器人，否则打日志（企微/钉钉/飞书 text 格式基本兼容） */
export async function notify(text: string) {
  const url = process.env.IM_WEBHOOK_URL;
  if (!url) {
    console.log(`[IM] ${text}`);
    return;
  }
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ msgtype: 'text', text: { content: text } }),
    });
  } catch (e) {
    console.error('[IM] send failed', e);
  }
}

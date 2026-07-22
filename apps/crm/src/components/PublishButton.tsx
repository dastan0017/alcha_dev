import { useState } from 'react';
import { App, Button } from 'antd';
import { CloudUploadOutlined } from '@ant-design/icons';
import type { PublishTarget } from '@alcha/shared';
import { http } from '../api/client';

export function PublishButton({ target, slug }: { target: PublishTarget; slug?: string }) {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);

  const publish = async () => {
    setLoading(true);
    try {
      await http.post('/publish', { target, slug });
      message.success('Сайт обновлён ✓');
    } catch {
      message.error('Не удалось опубликовать сайт');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button type="primary" icon={<CloudUploadOutlined />} loading={loading} onClick={publish}>
      Опубликовать
    </Button>
  );
}

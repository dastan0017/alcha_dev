import { useEffect, useState } from 'react';
import {
  App,
  Button,
  Col,
  Descriptions,
  Divider,
  Flex,
  Form,
  Input,
  Row,
  Typography,
  Upload,
  type UploadProps,
} from 'antd';
import { LogoutOutlined, UploadOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SiteSettings, SiteSettingsUpdate, UserRole } from '@alcha/shared';
import { http } from '../api/client';
import { MEDIA_QUERY_KEY, uploadMedia } from '../api/media';
import { useAuth } from '../auth/AuthContext';
import { PageHeader } from '../components/PageHeader';
import { SITE_URL } from '../lib/site';
import { PublishButton } from '../components/PublishButton';

const SETTINGS_QUERY_KEY = ['settings'] as const;

const roleLabels: Record<UserRole, string> = { ADMIN: 'Администратор' };

/** The CV URL input plus a PDF upload that drops the uploaded file's URL into it. */
function CvField() {
  const form = Form.useFormInstance<SiteSettings>();
  const cvUrl = Form.useWatch('cvUrl', form);
  // Seeded CVs live in the site's /public, so relative URLs resolve against the site.
  const cvHref = cvUrl && URL.canParse(cvUrl, SITE_URL) ? new URL(cvUrl, SITE_URL).href : null;
  const qc = useQueryClient();
  const { message } = App.useApp();
  const [uploading, setUploading] = useState(false);

  const customRequest: UploadProps['customRequest'] = async (options) => {
    setUploading(true);
    try {
      const { asset } = await uploadMedia(options.file as File);
      form.setFieldValue('cvUrl', asset.url);
      qc.invalidateQueries({ queryKey: MEDIA_QUERY_KEY });
      message.success('PDF загружен — сохраните настройки');
      options.onSuccess?.(asset);
    } catch (error) {
      message.error('Ошибка загрузки');
      options.onError?.(error as Error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Form.Item label="Ссылка на PDF" htmlFor="cv-url">
      <Flex gap={8} wrap align="center">
        <Form.Item name="cvUrl" noStyle>
          <Input id="cv-url" style={{ flex: '1 1 240px' }} />
        </Form.Item>
        <Upload accept="application/pdf" showUploadList={false} customRequest={customRequest}>
          <Button icon={<UploadOutlined />} loading={uploading}>
            Загрузить PDF
          </Button>
        </Upload>
        {cvHref && (
          <Typography.Link href={cvHref} target="_blank" rel="noreferrer">
            Открыть
          </Typography.Link>
        )}
      </Flex>
    </Form.Item>
  );
}

export function SettingsPage() {
  const qc = useQueryClient();
  const { message } = App.useApp();
  const { user, logout } = useAuth();
  const [form] = Form.useForm<SiteSettings>();

  const { data, isLoading } = useQuery({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: () => http.get<SiteSettings>('/admin/settings').then((r) => r.data),
  });

  useEffect(() => {
    if (data) form.setFieldsValue(data);
  }, [data, form]);

  const save = useMutation({
    mutationFn: (values: SiteSettingsUpdate) => http.put('/admin/settings', values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY });
      message.success('Сохранено');
    },
    onError: () => message.error('Ошибка сохранения'),
  });

  return (
    <div style={{ maxWidth: 900 }}>
      <PageHeader title="Настройки" actions={<PublishButton target="settings" />} />

      <Divider orientation="left">Аккаунт</Divider>
      {/* TODO(dastan): password change needs an API endpoint */}
      <Flex gap={16} wrap align="center" justify="space-between">
        <Descriptions
          column={1}
          size="small"
          items={[
            { key: 'email', label: 'Email', children: user?.email },
            { key: 'role', label: 'Роль', children: user && roleLabels[user.role] },
          ]}
          style={{ flex: '1 1 320px' }}
        />
        <Button icon={<LogoutOutlined />} onClick={() => logout()}>
          Выйти
        </Button>
      </Flex>

      <Form form={form} layout="vertical" onFinish={(values) => save.mutate(values)}>
        <Divider orientation="left">Контакты и соцсети</Divider>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item name="email" label="Email" rules={[{ type: 'email' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="telegram" label="Telegram (ссылка)">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="whatsapp" label="WhatsApp (ссылка)">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="github" label="GitHub">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="linkedin" label="LinkedIn">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="instagram" label="Instagram">
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">CV</Divider>
        <CvField />

        <Divider orientation="left">Адрес для JSON-LD</Divider>
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item name="addressLocality" label="Город">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="addressRegion" label="Регион">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="addressCountry" label="Страна (код)">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="priceRange" label="Ценовой диапазон">
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">Аналитика</Divider>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item name="gaId" label="Google Analytics ID">
              <Input placeholder="G-XXXXXXXXXX" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="yandexMetrikaId" label="Yandex.Metrika ID">
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Button type="default" htmlType="submit" loading={save.isPending || isLoading}>
          Сохранить черновик
        </Button>
      </Form>

      <Divider orientation="left">Интеграции</Divider>
      {/* TODO(dastan): show integration status once the API exposes it */}
      <Typography.Paragraph type="secondary">
        Уведомления о новых заявках в Telegram настраиваются на сервере переменными окружения{' '}
        <Typography.Text code>TELEGRAM_BOT_TOKEN</Typography.Text> и{' '}
        <Typography.Text code>TELEGRAM_CHAT_ID</Typography.Text>.
      </Typography.Paragraph>
    </div>
  );
}

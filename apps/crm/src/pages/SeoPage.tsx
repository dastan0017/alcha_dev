import { useState } from 'react';
import { App, Button, Form, Input, Modal, Select, Space, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SeoMeta } from '@alcha/shared';
import { http } from '../api/client';
import { PageHeader } from '../components/PageHeader';
import { PublishButton } from '../components/PublishButton';
import { StringListField } from '../components/fields';

export function SeoPage() {
  const qc = useQueryClient();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, unknown>>({});

  const list = useQuery({
    queryKey: ['seo'],
    queryFn: () => http.get<SeoMeta[]>('/admin/seo').then((r) => r.data),
  });

  const save = useMutation({
    mutationFn: (values: Record<string, unknown>) => http.put('/admin/seo', values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seo'] });
      message.success('Сохранено');
      setOpen(false);
    },
    onError: () => message.error('Ошибка сохранения'),
  });

  const openEdit = (meta?: SeoMeta) => {
    setFormValues(meta ?? { page: 'home', locale: 'ru', keywords: [] });
    setOpen(true);
  };

  const columns: ColumnsType<SeoMeta> = [
    { title: 'Страница', dataIndex: 'page', width: 120 },
    { title: 'Язык', dataIndex: 'locale', width: 80, render: (l: string) => l.toUpperCase() },
    { title: 'Title', dataIndex: 'title', ellipsis: true },
    {
      title: '',
      width: 60,
      align: 'right',
      render: (_, meta) => (
        <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(meta)} />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="SEO"
        actions={
          <Space>
            <Button icon={<PlusOutlined />} onClick={() => openEdit()}>
              Добавить
            </Button>
            <PublishButton target="all" />
          </Space>
        }
      />
      <Table
        rowKey={(m) => `${m.page}-${m.locale}`}
        loading={list.isLoading}
        dataSource={list.data ?? []}
        columns={columns}
        pagination={false}
      />
      <Modal
        title="SEO страницы"
        open={open}
        onOk={() => form.validateFields().then((v) => save.mutate(v))}
        onCancel={() => setOpen(false)}
        confirmLoading={save.isPending}
        okText="Сохранить"
        cancelText="Отмена"
        destroyOnHidden
        afterOpenChange={(opened) => {
          if (opened) form.setFieldsValue(formValues);
        }}
      >
        <Form form={form} layout="vertical" initialValues={formValues}>
          <Space>
            <Form.Item name="page" label="Страница" rules={[{ required: true }]}>
              <Select
                style={{ width: 160 }}
                options={[{ value: 'home', label: 'Главная' }]}
              />
            </Form.Item>
            <Form.Item name="locale" label="Язык" rules={[{ required: true }]}>
              <Select
                style={{ width: 120 }}
                options={[
                  { value: 'ru', label: 'RU' },
                  { value: 'en', label: 'EN' },
                ]}
              />
            </Form.Item>
          </Space>
          <Form.Item name="title" label="Title (до 60 символов)" rules={[{ required: true, max: 70 }]}>
            <Input showCount maxLength={70} />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description (до 160 символов)"
            rules={[{ required: true, max: 180 }]}
          >
            <Input.TextArea rows={3} showCount maxLength={180} />
          </Form.Item>
          <StringListField name="keywords" label="Ключевые слова" />
          <Form.Item name="ogImageUrl" label="OG-картинка (URL, необязательно)">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

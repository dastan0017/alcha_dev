import { useState, type ReactNode } from 'react';
import { App, Button, Form, Input, Modal, Popconfirm, Space, Switch, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PublishTarget } from '@alcha/shared';
import { http } from '../api/client';
import { PublishButton } from './PublishButton';
import { PageHeader } from './PageHeader';

interface Item {
  id: string;
  published: boolean;
}

export interface CrudListPageProps<T extends Item> {
  title: string;
  endpoint: string;
  queryKey: string;
  publishTarget: PublishTarget;
  primaryText: (item: T) => string;
  secondaryText?: (item: T) => string;
  emptyValues: Record<string, unknown>;
  toFormValues: (item: T) => Record<string, unknown>;
  fields: ReactNode;
  reorderable?: boolean;
  modalWidth?: number;
}

export function CrudListPage<T extends Item>({
  title,
  endpoint,
  queryKey,
  publishTarget,
  primaryText,
  secondaryText,
  emptyValues,
  toFormValues,
  fields,
  reorderable = false,
  modalWidth = 800,
}: CrudListPageProps<T>) {
  const qc = useQueryClient();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const list = useQuery({
    queryKey: [queryKey],
    queryFn: () => http.get<T[]>(endpoint).then((r) => r.data),
  });
  const items = list.data ?? [];

  const invalidate = () => qc.invalidateQueries({ queryKey: [queryKey] });

  const save = useMutation({
    mutationFn: (values: Record<string, unknown>) =>
      editingId ? http.put(`${endpoint}/${editingId}`, values) : http.post(endpoint, values),
    onSuccess: () => {
      invalidate();
      message.success('Сохранено');
      setOpen(false);
    },
    onError: () => message.error('Ошибка сохранения'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => http.delete(`${endpoint}/${id}`),
    onSuccess: () => {
      invalidate();
      message.success('Удалено');
    },
  });

  const reorder = useMutation({
    mutationFn: (ids: string[]) => http.patch(`${endpoint}/reorder`, { ids }),
    onSuccess: invalidate,
  });

  const openCreate = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({ published: true, sortOrder: items.length, ...emptyValues });
    setOpen(true);
  };

  const openEdit = (item: T) => {
    setEditingId(item.id);
    form.resetFields();
    form.setFieldsValue(toFormValues(item));
    setOpen(true);
  };

  const submit = async () => {
    const values = await form.validateFields();
    save.mutate(values);
  };

  const move = (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= items.length) return;
    const ids = items.map((i) => i.id);
    [ids[index], ids[next]] = [ids[next], ids[index]];
    reorder.mutate(ids);
  };

  const columns: ColumnsType<T> = [
    {
      title: 'Название',
      key: 'primary',
      render: (_, item) => (
        <div>
          <div style={{ fontWeight: 600 }}>{primaryText(item)}</div>
          {secondaryText && (
            <div style={{ color: '#8A8494', fontSize: 13 }}>{secondaryText(item)}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Статус',
      key: 'published',
      width: 130,
      render: (_, item) =>
        item.published ? <Tag color="green">Опубликовано</Tag> : <Tag>Черновик</Tag>,
    },
    {
      title: '',
      key: 'actions',
      width: reorderable ? 210 : 120,
      align: 'right',
      render: (_, item, index) => (
        <Space>
          {reorderable && (
            <>
              <Button
                size="small"
                icon={<ArrowUpOutlined />}
                onClick={() => move(index, -1)}
                disabled={index === 0}
              />
              <Button
                size="small"
                icon={<ArrowDownOutlined />}
                onClick={() => move(index, 1)}
                disabled={index === items.length - 1}
              />
            </>
          )}
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(item)} />
          <Popconfirm
            title="Удалить запись?"
            okText="Да"
            cancelText="Нет"
            onConfirm={() => remove.mutate(item.id)}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={title}
        actions={
          <Space>
            <Button icon={<PlusOutlined />} onClick={openCreate}>
              Добавить
            </Button>
            <PublishButton target={publishTarget} />
          </Space>
        }
      />
      <Table
        rowKey="id"
        loading={list.isLoading}
        dataSource={items}
        columns={columns}
        pagination={false}
      />
      <Modal
        title={editingId ? 'Редактирование' : 'Новая запись'}
        open={open}
        onOk={submit}
        onCancel={() => setOpen(false)}
        confirmLoading={save.isPending}
        width={modalWidth}
        okText="Сохранить"
        cancelText="Отмена"
        destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item name="sortOrder" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="published" label="Опубликовано" valuePropName="checked">
            <Switch />
          </Form.Item>
          {fields}
        </Form>
      </Modal>
    </div>
  );
}

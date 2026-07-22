import { useState } from 'react';
import { App, Button, Drawer, Form, Input, Select, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  LEAD_STATUS_COLORS,
  LEAD_STATUS_LABELS,
  LEAD_STATUSES,
  type Lead,
  type LeadStatus,
} from '@alcha/shared';
import { http } from '../api/client';
import { PageHeader } from '../components/PageHeader';

const statusOptions = LEAD_STATUSES.map((s) => ({ value: s, label: LEAD_STATUS_LABELS[s].ru }));

export function LeadsPage() {
  const qc = useQueryClient();
  const { message } = App.useApp();
  const [statusFilter, setStatusFilter] = useState<LeadStatus | undefined>();
  const [active, setActive] = useState<Lead | null>(null);
  const [form] = Form.useForm();

  const list = useQuery({
    queryKey: ['leads', statusFilter],
    queryFn: () =>
      http
        .get<Lead[]>('/admin/leads', { params: statusFilter ? { status: statusFilter } : {} })
        .then((r) => r.data),
  });

  const update = useMutation({
    mutationFn: (values: { status?: LeadStatus; note?: string | null }) =>
      http.patch(`/admin/leads/${active?.id}`, values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] });
      qc.invalidateQueries({ queryKey: ['leadStats'] });
      message.success('Обновлено');
      setActive(null);
    },
  });

  const openLead = (lead: Lead) => {
    setActive(lead);
    form.setFieldsValue({ status: lead.status, note: lead.note ?? '' });
  };

  const statusTag = (s: LeadStatus) => <Tag color={LEAD_STATUS_COLORS[s]}>{LEAD_STATUS_LABELS[s].ru}</Tag>;

  const columns: ColumnsType<Lead> = [
    { title: 'Имя', dataIndex: 'name', width: 150 },
    { title: 'Контакт', dataIndex: 'contact', width: 190 },
    { title: 'Сообщение', dataIndex: 'message', ellipsis: true },
    { title: 'Статус', dataIndex: 'status', width: 130, render: statusTag },
    { title: 'Страница', dataIndex: 'sourcePath', width: 140 },
    {
      title: 'Дата',
      dataIndex: 'createdAt',
      width: 160,
      render: (d: string) => new Date(d).toLocaleString('ru-RU'),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Заявки"
        actions={
          <Select
            allowClear
            placeholder="Все статусы"
            style={{ width: 190 }}
            value={statusFilter}
            onChange={(v) => setStatusFilter(v)}
            options={statusOptions}
          />
        }
      />
      <Table
        rowKey="id"
        loading={list.isLoading}
        dataSource={list.data ?? []}
        columns={columns}
        onRow={(lead) => ({ onClick: () => openLead(lead), style: { cursor: 'pointer' } })}
        pagination={{ pageSize: 20 }}
        scroll={{ x: 900 }}
      />
      <Drawer title="Заявка" open={!!active} onClose={() => setActive(null)} width={440}>
        {active && (
          <>
            <Typography.Paragraph>
              <b>{active.name}</b>
              <br />
              {active.contact}
            </Typography.Paragraph>
            <Typography.Paragraph style={{ whiteSpace: 'pre-wrap' }}>
              {active.message}
            </Typography.Paragraph>
            <Typography.Text type="secondary">
              {active.sourcePath} · {new Date(active.createdAt).toLocaleString('ru-RU')}
            </Typography.Text>
            <Form
              form={form}
              layout="vertical"
              style={{ marginTop: 24 }}
              onFinish={(v) => update.mutate(v)}
            >
              <Form.Item name="status" label="Статус">
                <Select options={statusOptions} />
              </Form.Item>
              <Form.Item name="note" label="Заметка">
                <Input.TextArea rows={3} />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={update.isPending}>
                Сохранить
              </Button>
            </Form>
          </>
        )}
      </Drawer>
    </div>
  );
}

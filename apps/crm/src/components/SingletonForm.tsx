import { useEffect, type ReactNode } from 'react';
import { App, Button, Form } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PublishTarget } from '@alcha/shared';
import { http } from '../api/client';
import { PublishButton } from './PublishButton';
import { PageHeader } from './PageHeader';

export function SingletonForm({
  title,
  endpoint,
  queryKey,
  publishTarget,
  children,
  maxWidth = 900,
}: {
  title: string;
  endpoint: string;
  queryKey: string;
  publishTarget: PublishTarget;
  children: ReactNode;
  maxWidth?: number;
}) {
  const qc = useQueryClient();
  const { message } = App.useApp();
  const [form] = Form.useForm();

  const { data, isLoading } = useQuery({
    queryKey: [queryKey],
    queryFn: () => http.get<Record<string, unknown>>(endpoint).then((r) => r.data),
  });

  useEffect(() => {
    if (data) form.setFieldsValue(data);
  }, [data, form]);

  const save = useMutation({
    mutationFn: (values: Record<string, unknown>) => http.put(endpoint, values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [queryKey] });
      message.success('Сохранено');
    },
    onError: () => message.error('Ошибка сохранения'),
  });

  return (
    <div>
      <PageHeader title={title} actions={<PublishButton target={publishTarget} />} />
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => save.mutate(values)}
        style={{ maxWidth }}
      >
        {children}
        <Button type="default" htmlType="submit" loading={save.isPending || isLoading}>
          Сохранить черновик
        </Button>
      </Form>
    </div>
  );
}

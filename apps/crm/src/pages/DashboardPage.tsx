import { Card, Col, Row, Statistic, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';
import type { LeadStats } from '@alcha/shared';
import { http } from '../api/client';
import { PageHeader } from '../components/PageHeader';

export function DashboardPage() {
  const { data } = useQuery({
    queryKey: ['leadStats'],
    queryFn: () => http.get<LeadStats>('/admin/leads/stats').then((r) => r.data),
  });

  return (
    <div>
      <PageHeader title="Дашборд" />
      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Новые заявки" value={data?.new ?? 0} valueStyle={{ color: '#5B34C9' }} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="В работе" value={data?.in_progress ?? 0} valueStyle={{ color: '#E8930C' }} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Оплачено" value={data?.paid ?? 0} valueStyle={{ color: '#2E9E5B' }} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Всего заявок" value={data?.total ?? 0} />
          </Card>
        </Col>
      </Row>
      <Typography.Paragraph style={{ marginTop: 24, color: '#8A8494', maxWidth: 620 }}>
        Выберите раздел слева, чтобы редактировать контент. После правок нажмите «Опубликовать» —
        сайт обновится за несколько секунд без пересборки.
      </Typography.Paragraph>
    </div>
  );
}

import { App, Card, Col, Empty, Popconfirm, Row, Upload } from 'antd';
import type { UploadProps } from 'antd';
import { CopyOutlined, DeleteOutlined, InboxOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { MediaAsset, PresignResponse } from '@alcha/shared';
import { http } from '../api/client';
import { PageHeader } from '../components/PageHeader';

export function MediaPage() {
  const qc = useQueryClient();
  const { message } = App.useApp();

  const list = useQuery({
    queryKey: ['media'],
    queryFn: () => http.get<MediaAsset[]>('/media').then((r) => r.data),
  });

  const remove = useMutation({
    mutationFn: (id: string) => http.delete(`/media/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['media'] });
      message.success('Удалено');
    },
  });

  const customRequest: UploadProps['customRequest'] = async (options) => {
    const file = options.file as File;
    const contentType = file.type || 'application/octet-stream';
    try {
      const presign = (
        await http.post<PresignResponse>('/media/presign', {
          filename: file.name,
          contentType,
          size: file.size,
        })
      ).data;
      await fetch(presign.uploadUrl, { method: 'PUT', headers: presign.headers, body: file });
      await http.post('/media', {
        key: presign.key,
        url: presign.publicUrl,
        filename: file.name,
        mimeType: contentType,
        size: file.size,
        width: null,
        height: null,
      });
      qc.invalidateQueries({ queryKey: ['media'] });
      message.success('Загружено');
      options.onSuccess?.({});
    } catch (error) {
      message.error('Ошибка загрузки');
      options.onError?.(error as Error);
    }
  };

  const copy = (url: string) => {
    navigator.clipboard.writeText(url);
    message.success('URL скопирован');
  };

  const assets = list.data ?? [];

  return (
    <div>
      <PageHeader title="Медиа" />
      <Upload.Dragger
        multiple
        customRequest={customRequest}
        showUploadList={false}
        style={{ marginBottom: 24 }}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p>Перетащите файлы сюда или нажмите для загрузки</p>
      </Upload.Dragger>

      {assets.length === 0 ? (
        <Empty description="Пока нет файлов" />
      ) : (
        <Row gutter={[16, 16]}>
          {assets.map((asset) => (
            <Col xs={12} md={8} lg={6} key={asset.id}>
              <Card
                size="small"
                cover={
                  asset.mimeType.startsWith('image/') ? (
                    <img
                      src={asset.url}
                      alt={asset.filename}
                      style={{ height: 140, objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      style={{
                        height: 140,
                        display: 'grid',
                        placeItems: 'center',
                        background: '#F4F0F8',
                        textTransform: 'uppercase',
                        color: '#8A8494',
                      }}
                    >
                      {asset.filename.split('.').pop()}
                    </div>
                  )
                }
                actions={[
                  <CopyOutlined key="copy" onClick={() => copy(asset.url)} />,
                  <Popconfirm
                    key="delete"
                    title="Удалить файл?"
                    okText="Да"
                    cancelText="Нет"
                    onConfirm={() => remove.mutate(asset.id)}
                  >
                    <DeleteOutlined />
                  </Popconfirm>,
                ]}
              >
                <Card.Meta title={<span style={{ fontSize: 12 }}>{asset.filename}</span>} />
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}

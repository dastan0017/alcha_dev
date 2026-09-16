import { App, Card, Col, Empty, Popconfirm, Row, Upload } from 'antd';
import type { UploadProps } from 'antd';
import { CopyOutlined, DeleteOutlined, InboxOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteMedia, listMedia, MEDIA_QUERY_KEY, uploadMedia } from '../api/media';
import { PageHeader } from '../components/PageHeader';

export function MediaPage() {
  const qc = useQueryClient();
  const { message } = App.useApp();

  const list = useQuery({ queryKey: MEDIA_QUERY_KEY, queryFn: listMedia });

  const remove = useMutation({
    mutationFn: deleteMedia,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MEDIA_QUERY_KEY });
      message.success('Удалено');
    },
  });

  const customRequest: UploadProps['customRequest'] = async (options) => {
    try {
      const asset = await uploadMedia(options.file as File);
      qc.invalidateQueries({ queryKey: MEDIA_QUERY_KEY });
      message.success('Загружено');
      options.onSuccess?.(asset);
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

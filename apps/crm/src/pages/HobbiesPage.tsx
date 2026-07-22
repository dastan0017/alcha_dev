import { Form, Input } from 'antd';
import type { HobbyCardAdmin } from '@alcha/shared';
import { CrudListPage } from '../components/CrudListPage';
import { TranslatedField } from '../components/fields';

export function HobbiesPage() {
  return (
    <CrudListPage<HobbyCardAdmin>
      title="Вне работы"
      endpoint="/admin/hobby"
      queryKey="hobby"
      publishTarget="about"
      reorderable
      primaryText={(h) => h.translations.ru.title}
      secondaryText={(h) => h.handle}
      emptyValues={{
        handle: '',
        url: '',
        imageUrl: null,
        translations: {
          ru: { title: '', description: '' },
          en: { title: '', description: '' },
        },
      }}
      toFormValues={(h) => ({
        published: h.published,
        sortOrder: h.sortOrder,
        handle: h.handle,
        url: h.url,
        imageUrl: h.imageUrl,
        translations: h.translations,
      })}
      fields={
        <>
          <Form.Item name="handle" label="Хэндл (@...)" rules={[{ required: true }]}>
            <Input style={{ maxWidth: 320 }} />
          </Form.Item>
          <Form.Item name="url" label="Ссылка">
            <Input placeholder="https://instagram.com/..." />
          </Form.Item>
          <Form.Item name="imageUrl" label="Картинка (URL)">
            <Input placeholder="URL из раздела «Медиа»" />
          </Form.Item>
          <TranslatedField field="title" label="Заголовок" />
          <TranslatedField field="description" label="Описание" type="textarea" />
        </>
      }
    />
  );
}

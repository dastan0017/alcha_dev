import { Form, Input } from 'antd';
import type { ServiceAdmin } from '@alcha/shared';
import { CrudListPage } from '../components/CrudListPage';
import { TranslatedField } from '../components/fields';

export function ServicesPage() {
  return (
    <CrudListPage<ServiceAdmin>
      title="Услуги"
      endpoint="/admin/services"
      queryKey="services"
      publishTarget="home"
      reorderable
      primaryText={(s) => s.translations.ru.title}
      secondaryText={(s) => `№ ${s.number}`}
      emptyValues={{
        number: '',
        translations: {
          ru: { title: '', description: '' },
          en: { title: '', description: '' },
        },
      }}
      toFormValues={(s) => ({
        published: s.published,
        sortOrder: s.sortOrder,
        number: s.number,
        translations: s.translations,
      })}
      fields={
        <>
          <Form.Item name="number" label="Номер (01–04)" rules={[{ required: true }]}>
            <Input style={{ maxWidth: 160 }} />
          </Form.Item>
          <TranslatedField field="title" label="Заголовок" />
          <TranslatedField field="description" label="Описание" type="textarea" />
        </>
      }
    />
  );
}

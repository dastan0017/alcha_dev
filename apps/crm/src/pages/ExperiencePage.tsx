import { Form, Input } from 'antd';
import type { ExperienceAdmin } from '@alcha/shared';
import { CrudListPage } from '../components/CrudListPage';
import { TranslatedField } from '../components/fields';

export function ExperiencePage() {
  return (
    <CrudListPage<ExperienceAdmin>
      title="Опыт"
      endpoint="/admin/experience"
      queryKey="experience"
      publishTarget="about"
      reorderable
      primaryText={(e) => e.company}
      secondaryText={(e) => e.translations.ru.role}
      emptyValues={{
        company: '',
        translations: {
          ru: { role: '', meta: '', description: '' },
          en: { role: '', meta: '', description: '' },
        },
      }}
      toFormValues={(e) => ({
        published: e.published,
        sortOrder: e.sortOrder,
        company: e.company,
        translations: e.translations,
      })}
      fields={
        <>
          <Form.Item name="company" label="Компания" rules={[{ required: true }]}>
            <Input style={{ maxWidth: 320 }} />
          </Form.Item>
          <TranslatedField field="role" label="Должность" />
          <TranslatedField field="meta" label="Период / формат" />
          <TranslatedField field="description" label="Описание" type="textarea" />
        </>
      }
    />
  );
}

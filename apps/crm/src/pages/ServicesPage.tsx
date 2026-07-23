import { Form, Input, Switch } from 'antd';
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
        featured: false,
        translations: {
          ru: { title: '', description: '', badge: '', bullets: [], techLine: '' },
          en: { title: '', description: '', badge: '', bullets: [], techLine: '' },
        },
      }}
      toFormValues={(s) => ({
        published: s.published,
        sortOrder: s.sortOrder,
        number: s.number,
        featured: s.featured,
        translations: s.translations,
      })}
      fields={
        <>
          <Form.Item name="number" label="Номер (01–04)" rules={[{ required: true }]}>
            <Input style={{ maxWidth: 160 }} />
          </Form.Item>
          <Form.Item
            name="featured"
            label="Главная услуга (большая карточка)"
            valuePropName="checked"
            extra="Включите только у одной услуги"
          >
            <Switch />
          </Form.Item>
          <TranslatedField field="title" label="Заголовок" />
          <TranslatedField field="description" label="Описание" type="textarea" />
          <TranslatedField field="bullets" label="Пункты (галочки)" type="tags" required={false} />
          <TranslatedField
            field="badge"
            label="Плашка (только у главной услуги)"
            required={false}
          />
          <TranslatedField
            field="techLine"
            label="Строка технологий (необязательно)"
            required={false}
          />
        </>
      }
    />
  );
}

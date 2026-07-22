import { Form, Switch } from 'antd';
import type { PricingPlanAdmin } from '@alcha/shared';
import { CrudListPage } from '../components/CrudListPage';
import { TranslatedField } from '../components/fields';

export function PricingPage() {
  return (
    <CrudListPage<PricingPlanAdmin>
      title="Цены"
      endpoint="/admin/pricing"
      queryKey="pricing"
      publishTarget="home"
      reorderable
      primaryText={(p) => p.translations.ru.name}
      secondaryText={(p) => p.translations.ru.priceLabel}
      emptyValues={{
        highlighted: false,
        translations: {
          ru: { name: '', priceLabel: '', termLine: '', highlightLabel: '', description: '', features: [] },
          en: { name: '', priceLabel: '', termLine: '', highlightLabel: '', description: '', features: [] },
        },
      }}
      toFormValues={(p) => ({
        published: p.published,
        sortOrder: p.sortOrder,
        highlighted: p.highlighted,
        translations: p.translations,
      })}
      fields={
        <>
          <Form.Item name="highlighted" label="Выделенный тариф" valuePropName="checked">
            <Switch />
          </Form.Item>
          <TranslatedField field="name" label="Название" />
          <TranslatedField field="priceLabel" label="Цена (напр. «от $300»)" />
          <TranslatedField field="termLine" label="Срок / условия" />
          <TranslatedField field="highlightLabel" label="Плашка" required={false} />
          <TranslatedField field="description" label="Описание" type="textarea" />
          <TranslatedField field="features" label="Пункты" type="tags" required={false} />
        </>
      }
    />
  );
}

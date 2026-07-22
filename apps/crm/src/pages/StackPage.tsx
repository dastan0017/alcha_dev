import type { StackCategoryAdmin } from '@alcha/shared';
import { CrudListPage } from '../components/CrudListPage';
import { StringListField, TranslatedField } from '../components/fields';

export function StackPage() {
  return (
    <CrudListPage<StackCategoryAdmin>
      title="Стек"
      endpoint="/admin/stack"
      queryKey="stack"
      publishTarget="about"
      reorderable
      primaryText={(c) => c.translations.ru.title}
      secondaryText={(c) => c.items.join(' · ')}
      emptyValues={{
        items: [],
        translations: { ru: { title: '' }, en: { title: '' } },
      }}
      toFormValues={(c) => ({
        published: c.published,
        sortOrder: c.sortOrder,
        items: c.items,
        translations: c.translations,
      })}
      fields={
        <>
          <TranslatedField field="title" label="Категория" />
          <StringListField name="items" label="Технологии" help="Введите технологию и нажмите Enter" />
        </>
      }
    />
  );
}

import { Divider, Form, Input, Select, Switch } from 'antd';
import type { ProjectAdmin } from '@alcha/shared';
import { CrudListPage } from '../components/CrudListPage';
import { StringListField, TranslatedField } from '../components/fields';

export function ProjectsPage() {
  return (
    <CrudListPage<ProjectAdmin>
      title="Работы"
      endpoint="/admin/projects"
      queryKey="projects"
      publishTarget="projects"
      reorderable
      modalWidth={880}
      primaryText={(p) => p.translations.ru.title}
      secondaryText={(p) => `/${p.slug}`}
      emptyValues={{
        slug: '',
        badgeType: 'work',
        showOnHome: false,
        showOnAbout: false,
        coverImage: null,
        screenshots: [],
        translations: {
          ru: {
            title: '',
            badge: '',
            metaLine: '',
            role: '',
            description: '',
            pills: [],
            bullets: [],
            techChips: [],
            seoTitle: '',
            seoDescription: '',
          },
          en: {
            title: '',
            badge: '',
            metaLine: '',
            role: '',
            description: '',
            pills: [],
            bullets: [],
            techChips: [],
            seoTitle: '',
            seoDescription: '',
          },
        },
      }}
      toFormValues={(p) => ({
        published: p.published,
        sortOrder: p.sortOrder,
        slug: p.slug,
        badgeType: p.badgeType,
        showOnHome: p.showOnHome,
        showOnAbout: p.showOnAbout,
        coverImage: p.coverImage,
        screenshots: p.screenshots,
        translations: p.translations,
      })}
      fields={
        <>
          <Form.Item
            name="slug"
            label="Slug (латиница, через дефис)"
            rules={[
              { required: true },
              { pattern: /^[a-z0-9-]+$/, message: 'Только строчные латинские буквы, цифры и дефис' },
            ]}
          >
            <Input style={{ maxWidth: 360 }} placeholder="my-project" />
          </Form.Item>
          <Form.Item name="badgeType" label="Тип" rules={[{ required: true }]}>
            <Select
              style={{ maxWidth: 240 }}
              options={[
                { value: 'work', label: 'Клиентский проект' },
                { value: 'own', label: 'Свой продукт' },
              ]}
            />
          </Form.Item>
          <Form.Item name="showOnHome" label="Показывать на главной" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="showOnAbout" label="Показывать на «Обо мне»" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="coverImage" label="Обложка (URL)">
            <Input placeholder="URL из раздела «Медиа»" />
          </Form.Item>
          <StringListField name="screenshots" label="Скриншоты (URL)" />

          <Divider orientation="left">Контент</Divider>
          <TranslatedField field="title" label="Название" />
          <TranslatedField field="badge" label="Плашка (напр. APP STORE + GOOGLE PLAY)" />
          <TranslatedField field="metaLine" label="Короткое описание (карточка)" type="textarea" />
          <TranslatedField field="role" label="Роль" required={false} />
          <TranslatedField field="description" label="Полное описание" type="textarea" rows={4} />
          <TranslatedField field="pills" label="Что сделано (чипы)" type="tags" required={false} />
          <TranslatedField field="bullets" label="Пункты (подробно)" type="tags" required={false} />
          <TranslatedField field="techChips" label="Технологии" type="tags" required={false} />

          <Divider orientation="left">SEO страницы проекта</Divider>
          <TranslatedField field="seoTitle" label="SEO title" required={false} />
          <TranslatedField field="seoDescription" label="SEO description" type="textarea" required={false} />
        </>
      }
    />
  );
}

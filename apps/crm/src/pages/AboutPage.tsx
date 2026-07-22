import { Divider, Form, Input } from 'antd';
import { SingletonForm } from '../components/SingletonForm';
import { TranslatedField } from '../components/fields';

export function AboutPage() {
  return (
    <SingletonForm title="Обо мне" endpoint="/admin/about" queryKey="about" publishTarget="about">
      <Form.Item name="photoUrl" label="Фото (URL)">
        <Input placeholder="URL из раздела «Медиа»" />
      </Form.Item>

      <Divider orientation="left">Текст</Divider>
      <TranslatedField field="name" label="Имя" />
      <TranslatedField field="photoCaption" label="Подпись к фото" required={false} />
      <TranslatedField field="bioHtml" label="Био (можно HTML: <strong>…</strong>)" type="html" rows={6} />

      <Divider orientation="left">Заголовки секций</Divider>
      <TranslatedField field="experienceHeading" label="Заголовок «Опыт»" />
      <TranslatedField field="projectsHeading" label="Заголовок «Проекты»" />
      <TranslatedField field="stackHeading" label="Заголовок «Стек»" />
      <TranslatedField field="hobbiesHeading" label="Заголовок «Вне работы»" />
    </SingletonForm>
  );
}

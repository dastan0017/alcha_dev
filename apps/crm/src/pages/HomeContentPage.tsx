import { Divider } from 'antd';
import { SingletonForm } from '../components/SingletonForm';
import { TranslatedField } from '../components/fields';

export function HomeContentPage() {
  return (
    <SingletonForm title="Главная страница" endpoint="/admin/home" queryKey="home" publishTarget="home">
      <Divider orientation="left">Первый экран</Divider>
      <TranslatedField field="eyebrow" label="Надзаголовок" />
      <TranslatedField field="heroTitle" label="Заголовок" type="textarea" rows={2} />
      <TranslatedField field="heroSubtitle" label="Подзаголовок" type="textarea" />
      <TranslatedField
        field="heroBullets"
        label="Пункты под подзаголовком"
        type="tags"
        required={false}
      />
      <TranslatedField field="heroNote" label="Строка с ценой / сроком" required={false} />
      <TranslatedField field="heroCtaPrimary" label="Кнопка (основная)" />
      <TranslatedField field="heroCtaSecondary" label="Кнопка (вторичная)" />
      <TranslatedField field="trustLine" label="Строка доверия" />

      <Divider orientation="left">Заголовки секций</Divider>
      <TranslatedField field="servicesHeading" label="Заголовок «Услуги»" type="textarea" rows={2} />
      <TranslatedField field="worksHeading" label="Заголовок «Работы»" />
      <TranslatedField field="pricingHeading" label="Заголовок «Цены»" />
      <TranslatedField field="pricingNote" label="Подпись к ценам" />

      <Divider orientation="left">Баннер призыва к действию</Divider>
      <TranslatedField field="ctaTitle" label="Заголовок баннера" />
      <TranslatedField field="ctaSubtitle" label="Текст баннера" type="textarea" />
      <TranslatedField field="ctaTelegramLabel" label="Кнопка Telegram" />
      <TranslatedField field="ctaCvLabel" label="Кнопка CV" />
    </SingletonForm>
  );
}

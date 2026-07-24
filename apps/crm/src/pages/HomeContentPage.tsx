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

      <Divider orientation="left">Секция «Услуги»</Divider>
      <TranslatedField field="servicesEyebrow" label="Надзаголовок" required={false} />
      <TranslatedField field="servicesHeading" label="Заголовок «Услуги»" type="textarea" rows={2} />
      <TranslatedField field="servicesLede" label="Вводный абзац" type="textarea" required={false} />
      <TranslatedField
        field="servicesSecondaryLabel"
        label="Подпись над остальными карточками"
        required={false}
      />

      <Divider orientation="left">Заголовки секций</Divider>
      <Divider orientation="left">Секция «Работы»</Divider>
      <TranslatedField field="worksEyebrow" label="Надзаголовок" required={false} />
      <TranslatedField field="worksHeading" label="Заголовок «Работы»" />
      <TranslatedField field="worksLede" label="Вводный абзац" type="textarea" required={false} />
      <TranslatedField
        field="worksLinkLabel"
        label="Ссылка «Все проекты» (ведёт на «Обо мне»)"
        required={false}
      />

      <Divider orientation="left">Секция «Цены»</Divider>
      <TranslatedField field="pricingEyebrow" label="Надзаголовок" required={false} />
      <TranslatedField field="pricingHeading" label="Заголовок «Цены»" />
      <TranslatedField field="pricingNote" label="Подпись рядом с заголовком" />
      <TranslatedField
        field="pricingFootnote"
        label="Сноска под тарифами (рассрочка)"
        type="textarea"
        required={false}
      />

      <Divider orientation="left">Баннер призыва к действию</Divider>
      <TranslatedField field="ctaTitle" label="Заголовок баннера" />
      <TranslatedField field="ctaSubtitle" label="Текст баннера" type="textarea" />
      <TranslatedField field="ctaTelegramLabel" label="Кнопка Telegram" />
      <TranslatedField field="ctaCvLabel" label="Кнопка CV" />
    </SingletonForm>
  );
}

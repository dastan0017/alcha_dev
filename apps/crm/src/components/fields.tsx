import { Col, Form, Input, Row, Select } from 'antd';
import type { ReactNode } from 'react';

type FieldType = 'text' | 'textarea' | 'html' | 'tags';

/** Renders RU + EN inputs side by side, bound to translations.<locale>.<field>. */
export function TranslatedField({
  field,
  label,
  type = 'text',
  rows = 3,
  required = true,
}: {
  field: string;
  label: string;
  type?: FieldType;
  rows?: number;
  required?: boolean;
}) {
  const control = (): ReactNode => {
    if (type === 'textarea' || type === 'html') return <Input.TextArea rows={rows} />;
    if (type === 'tags') return <Select mode="tags" tokenSeparators={[',']} open={false} />;
    return <Input />;
  };

  const cell = (locale: 'ru' | 'en') => (
    <Col xs={24} md={12}>
      <Form.Item
        label={`${label} (${locale.toUpperCase()})`}
        name={['translations', locale, field]}
        rules={required && type !== 'tags' ? [{ required: true, message: 'Заполните поле' }] : []}
      >
        {control()}
      </Form.Item>
    </Col>
  );

  return (
    <Row gutter={16}>
      {cell('ru')}
      {cell('en')}
    </Row>
  );
}

/** A language-neutral list-of-strings field (chips), e.g. tech stack items. */
export function StringListField({
  name,
  label,
  help,
}: {
  name: string | (string | number)[];
  label: string;
  help?: string;
}) {
  return (
    <Form.Item label={label} name={name} extra={help}>
      <Select mode="tags" tokenSeparators={[',']} open={false} placeholder="Введите и нажмите Enter" />
    </Form.Item>
  );
}

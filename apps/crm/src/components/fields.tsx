import { Form, Select } from 'antd';

/** A language-neutral list-of-strings field (chips), e.g. SEO keywords. */
export function StringListField({ name, label }: { name: string; label: string }) {
  return (
    <Form.Item label={label} name={name}>
      <Select mode="tags" tokenSeparators={[',']} open={false} placeholder="Введите и нажмите Enter" />
    </Form.Item>
  );
}

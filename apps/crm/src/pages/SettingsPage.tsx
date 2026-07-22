import { Col, Divider, Form, Input, Row } from 'antd';
import { SingletonForm } from '../components/SingletonForm';

export function SettingsPage() {
  return (
    <SingletonForm
      title="Настройки сайта"
      endpoint="/admin/settings"
      queryKey="settings"
      publishTarget="settings"
    >
      <Divider orientation="left">Контакты и соцсети</Divider>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item name="email" label="Email" rules={[{ type: 'email' }]}>
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="telegram" label="Telegram (ссылка)">
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="whatsapp" label="WhatsApp (ссылка)">
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="github" label="GitHub">
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="linkedin" label="LinkedIn">
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="instagram" label="Instagram">
            <Input />
          </Form.Item>
        </Col>
      </Row>

      <Divider orientation="left">CV и адрес</Divider>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item name="cvUrl" label="CV (URL PDF)">
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="priceRange" label="Ценовой диапазон (JSON-LD)">
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name="addressLocality" label="Город">
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name="addressRegion" label="Регион">
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name="addressCountry" label="Страна (код)">
            <Input />
          </Form.Item>
        </Col>
      </Row>

      <Divider orientation="left">Аналитика</Divider>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item name="gaId" label="Google Analytics ID">
            <Input placeholder="G-XXXXXXXXXX" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="yandexMetrikaId" label="Yandex.Metrika ID">
            <Input />
          </Form.Item>
        </Col>
      </Row>
    </SingletonForm>
  );
}

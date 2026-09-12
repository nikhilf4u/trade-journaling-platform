import React, { useEffect, useState } from 'react';
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Button,
  message,
  Upload,
  Space,
  Tag,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import dayjs from 'dayjs';
import { tradeApi, Trade } from '../services/tradeApi';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingTrade?: Trade | null;
}

const MARKETS = [
  { label: 'NSE (India)', value: 'NSE' },
  { label: 'BSE (India)', value: 'BSE' },
  { label: 'NASDAQ (US)', value: 'NASDAQ' },
  { label: 'NYSE (US)', value: 'NYSE' },
  { label: 'Crypto', value: 'CRYPTO' },
  { label: 'Forex', value: 'FX' },
];

const INSTRUMENTS = [
  { label: 'Equity', value: 'EQUITY' },
  { label: 'Futures', value: 'FUTURES' },
  { label: 'Options', value: 'OPTIONS' },
  { label: 'Forex', value: 'FOREX' },
];

const BIAS_OPTIONS = [
  { label: '🟢🟢 Strong Bullish', value: 'STRONG_BULLISH' },
  { label: '🟢 Bullish', value: 'BULLISH' },
  { label: '⚪ Neutral', value: 'NEUTRAL' },
  { label: '🔴 Bearish', value: 'BEARISH' },
  { label: '🔴🔴 Strong Bearish', value: 'STRONG_BEARISH' },
];

export const TradeFormModal: React.FC<Props> = ({
  open,
  onClose,
  onSuccess,
  editingTrade,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [removedScreenshotIds, setRemovedScreenshotIds] = useState<number[]>([]);
  const isEditing = !!editingTrade;

  // ----------------------------------------------------------
  // Populate form + existing screenshots when editing
  // ----------------------------------------------------------
  useEffect(() => {
    if (editingTrade) {
      form.setFieldsValue({
        ...editingTrade,
        entryDate: editingTrade.entryDate ? dayjs(editingTrade.entryDate) : null,
        exitDate: editingTrade.exitDate ? dayjs(editingTrade.exitDate) : null,
      });

      // ⭐ Encode the DB id into the uid: "existing-<id>"
      const existingFiles: UploadFile[] = (editingTrade.screenshots || []).map(
        (s, i) => ({
          uid: `existing-${s.id ?? i}`,
          name: s.label || `screenshot-${i + 1}`,
          status: 'done',
          url: s.url,
        })
      );

      setFileList(existingFiles);
      setRemovedScreenshotIds([]);
    } else {
      form.resetFields();
      form.setFieldsValue({
        market: 'NSE',
        direction: 'BUY',
        quoteCurrency: 'INR',
        instrumentType: 'EQUITY',
        quantity: 1,
        longTimeFrameBias: 'NEUTRAL',
      });
      setFileList([]);
      setRemovedScreenshotIds([]);
    }
  }, [editingTrade, form]);

  // ----------------------------------------------------------
  // Track removals in onChange
  // ----------------------------------------------------------
  const handleUploadChange = ({
    fileList: newList,
  }: {
    fileList: UploadFile[];
  }) => {
    const newUids = new Set(newList.map((f) => f.uid));
    const removedFiles = fileList.filter((f) => !newUids.has(f.uid));

    removedFiles.forEach((f) => {
      const uidStr = String(f.uid);
      if (uidStr.startsWith('existing-')) {
        const idStr = uidStr.replace('existing-', '');
        const id = parseInt(idStr, 10);
        if (!isNaN(id)) {
          setRemovedScreenshotIds((prev) =>
            prev.includes(id) ? prev : [...prev, id]
          );
        }
      }
    });

    setFileList(newList);
  };

  // ----------------------------------------------------------
  // Submit
  // ----------------------------------------------------------
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // ⭐ Clean payload — only editable fields
      const payload: Trade = {
        market: values.market,
        symbol: values.symbol.toUpperCase(),
        instrumentType: values.instrumentType,
        direction: values.direction,
        entryPrice: values.entryPrice,
        exitPrice: values.exitPrice,
        quantity: values.quantity,
        quoteCurrency: values.quoteCurrency,
        stoploss: values.stoploss,
        target: values.target,
        mfe: values.mfe,                    // ⭐ NEW
        mae: values.mae,                    // ⭐ NEW
        longTimeFrameBias: values.longTimeFrameBias,
        entryDate: values.entryDate.toISOString(),
        exitDate: values.exitDate.toISOString(),
        notes: values.notes,
      };

      let savedTrade: Trade;

      if (isEditing && editingTrade?.id) {
        savedTrade = await tradeApi.update(editingTrade.id, payload);
      } else {
        savedTrade = await tradeApi.create(payload);
      }

      // 1. Delete removed screenshots
      if (isEditing && editingTrade?.id && removedScreenshotIds.length > 0) {
        for (const screenshotId of removedScreenshotIds) {
          try {
            await tradeApi.deleteScreenshot(editingTrade.id, screenshotId);
          } catch (err) {
            console.warn('Failed to delete screenshot', screenshotId, err);
          }
        }
      }

      // 2. Upload new screenshots
      if (savedTrade.id) {
        const newFiles: File[] = fileList
            .map((f) => f.originFileObj as unknown as File)
            .filter((f): f is File => !!f);
        if (newFiles.length > 0) {
          await tradeApi.uploadScreenshots(savedTrade.id, newFiles);
        }
      }

      message.success(isEditing ? 'Trade updated!' : 'Trade created!');
      onSuccess();
      onClose();
    } catch (err: any) {
      if (err.errorFields) return; // validation errors
      console.error('❌ Save trade error:', err);
      message.error(
        err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          'Failed to save trade'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={isEditing ? '✏️ Edit Trade' : '📝 Log New Trade'}
      open={open}
      onCancel={onClose}
      width={820}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleSubmit}
        >
          {isEditing ? 'Update Trade' : 'Save Trade'}
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical">
        {/* Debug info (only when editing) */}
        {isEditing && (
          <div style={{ marginBottom: 16 }}>
            <Space wrap>
              <Tag color="blue">
                Existing: {editingTrade?.screenshots?.length || 0}
              </Tag>
              <Tag color="green">In UI: {fileList.length}</Tag>
              <Tag color="red">To Delete: {removedScreenshotIds.length}</Tag>
            </Space>
          </div>
        )}

        {/* ============================================ */}
        {/* Row 1: Trade Identity */}
        {/* ============================================ */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 16,
          }}
        >
          <Form.Item
            label="Market"
            name="market"
            rules={[{ required: true, message: 'Market is required' }]}
          >
            <Select options={MARKETS} size="large" />
          </Form.Item>

          <Form.Item
            label="Symbol"
            name="symbol"
            rules={[{ required: true, message: 'Symbol is required' }]}
          >
            <Input placeholder="e.g., NIFTY, AAPL" size="large" />
          </Form.Item>

          <Form.Item label="Instrument Type" name="instrumentType">
            <Select options={INSTRUMENTS} size="large" />
          </Form.Item>

          <Form.Item
            label="Direction"
            name="direction"
            rules={[{ required: true }]}
          >
            <Select
              size="large"
              options={[
                { label: '🟢 BUY', value: 'BUY' },
                { label: '🔴 SELL', value: 'SELL' },
              ]}
            />
          </Form.Item>
        </div>

        {/* ============================================ */}
        {/* Row 2: Prices & Quantity */}
        {/* ============================================ */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 16,
          }}
        >
          <Form.Item
            label="Entry Price"
            name="entryPrice"
            rules={[{ required: true, message: 'Entry price is required' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              size="large"
              min={0}
              step={0.01}
            />
          </Form.Item>

          <Form.Item
            label="Exit Price"
            name="exitPrice"
            rules={[{ required: true, message: 'Exit price is required' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              size="large"
              min={0}
              step={0.01}
            />
          </Form.Item>

          <Form.Item
            label="Quantity"
            name="quantity"
            rules={[{ required: true, message: 'Quantity is required' }]}
          >
            <InputNumber style={{ width: '100%' }} size="large" min={1} />
          </Form.Item>
        </div>

        {/* ============================================ */}
        {/* Row 3: Planning (Stop Loss & Target) */}
        {/* ============================================ */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 16,
          }}
        >
          <Form.Item
            label="Stop Loss"
            name="stoploss"
            tooltip="The price at which you'd exit if the trade goes against you"
          >
            <InputNumber
              style={{ width: '100%' }}
              size="large"
              min={0}
              step={0.01}
              placeholder="e.g., 22400.00"
            />
          </Form.Item>

          <Form.Item
            label="Target (Take Profit)"
            name="target"
            tooltip="The price at which you plan to exit for a profit"
          >
            <InputNumber
              style={{ width: '100%' }}
              size="large"
              min={0}
              step={0.01}
              placeholder="e.g., 22800.00"
            />
          </Form.Item>

          <Form.Item label="Quote Currency" name="quoteCurrency" rules={[{ required: true }]}>
            <Select
              size="large"
              options={[
                { label: 'INR (₹)', value: 'INR' },
                { label: 'USD ($)', value: 'USD' },
                { label: 'EUR (€)', value: 'EUR' },
              ]}
            />
          </Form.Item>
        </div>

        {/* ============================================ */}
        {/* Row 4: MFE / MAE Analysis */}
        {/* ============================================ */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 16,
          }}
        >
          <Form.Item
            label="Best Price Reached (MFE)"
            name="mfe"
            tooltip="The best price reached after entry. For BUY = swing high. For SELL = swing low. Tells us how much move you could have captured."
          >
            <InputNumber
              style={{ width: '100%' }}
              size="large"
              step={0.01}
              placeholder="e.g., 22900"
            />
          </Form.Item>

          <Form.Item
            label="Worst Price Reached (MAE)"
            name="mae"
            tooltip="The worst price reached after entry. For BUY = swing low. For SELL = swing high. Tells us how close you were to being stopped out."
          >
            <InputNumber
              style={{ width: '100%' }}
              size="large"
              step={0.01}
              placeholder="e.g., 22420"
            />
          </Form.Item>
        </div>

        {/* ============================================ */}
        {/* Row 5: HTF Bias & Dates */}
        {/* ============================================ */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 16,
          }}
        >
          <Form.Item
            label="Higher Time Frame Bias"
            name="longTimeFrameBias"
            tooltip="Your directional view on the daily/weekly chart"
          >
            <Select size="large" options={BIAS_OPTIONS} />
          </Form.Item>

          <Form.Item
            label="Entry Date"
            name="entryDate"
            rules={[{ required: true, message: 'Entry date is required' }]}
          >
            <DatePicker showTime style={{ width: '100%' }} size="large" />
          </Form.Item>

          <Form.Item
            label="Exit Date"
            name="exitDate"
            rules={[{ required: true, message: 'Exit date is required' }]}
          >
            <DatePicker showTime style={{ width: '100%' }} size="large" />
          </Form.Item>
        </div>

        {/* ============================================ */}
        {/* Notes */}
        {/* ============================================ */}
        <Form.Item label="Notes" name="notes">
          <Input.TextArea
            rows={3}
            placeholder="Your thoughts, strategy, emotions..."
          />
        </Form.Item>

        {/* ============================================ */}
        {/* Screenshots (multi-upload + delete tracking) */}
        {/* ============================================ */}
        <Form.Item
          label="Trade Screenshots"
          tooltip="Existing images are shown. Click X to remove one. Click + to add more."
        >
          <Upload
            listType="picture-card"
            fileList={fileList}
            onChange={handleUploadChange}
            beforeUpload={() => false}
            multiple={true}
            accept="image/*"
          >
            <div>
              <PlusOutlined />
              <div style={{ marginTop: 8 }}>Add Image</div>
            </div>
          </Upload>
        </Form.Item>
      </Form>
    </Modal>
  );
};
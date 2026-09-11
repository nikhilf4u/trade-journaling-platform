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
  Tag,
  Space,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import dayjs from 'dayjs';
import { tradeApi, Trade } from '../services/tradeApi';
import { notifySuccess } from '../utils/notify';

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

      console.log('📥 Loaded existing screenshots:', existingFiles);
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
  // Track removals immediately in onChange
  // ----------------------------------------------------------
  const handleUploadChange = ({
    fileList: newList,
  }: {
    fileList: UploadFile[];
  }) => {
    console.log('🔄 Upload onChange. New list:', newList.map(f => f.uid));

    // Find files that were in old list but not in new
    const newUids = new Set(newList.map((f) => f.uid));
    const removedFiles = fileList.filter((f) => !newUids.has(f.uid));

    console.log('🗑️ Removed files detected:', removedFiles.map(f => f.uid));

    // For each removed file with uid "existing-<id>", extract the db id
    removedFiles.forEach((f) => {
      const uidStr = String(f.uid);
      if (uidStr.startsWith('existing-')) {
        const idStr = uidStr.replace('existing-', '');
        const id = parseInt(idStr, 10);
        if (!isNaN(id)) {
          console.warn(`⚠️ Marking screenshot ${id} for deletion`);
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
        longTimeFrameBias: values.longTimeFrameBias,
        entryDate: values.entryDate.toISOString(),
        exitDate: values.exitDate.toISOString(),
        notes: values.notes,
      };

      // 1. Save/Update trade
      let savedTrade: Trade;
      if (isEditing && editingTrade?.id) {
        savedTrade = await tradeApi.update(editingTrade.id, payload);
      } else {
        savedTrade = await tradeApi.create(payload);
      }

      // 2. Delete removed screenshots
      if (isEditing && editingTrade?.id && removedScreenshotIds.length > 0) {
        console.warn('🗑️ Deleting screenshots:', removedScreenshotIds);

        for (const screenshotId of removedScreenshotIds) {
          try {
            await tradeApi.deleteScreenshot(editingTrade.id, screenshotId);
            console.log(`✅ Deleted screenshot ${screenshotId}`);
          } catch (err) {
            console.error(`❌ Failed to delete screenshot ${screenshotId}:`, err);
          }
        }
      } else {
        console.log('ℹ️ No screenshots to delete. removedScreenshotIds =', removedScreenshotIds);
      }

      // 3. Upload new screenshots
      if (savedTrade.id) {
        const newFiles: File[] = fileList
          .map((f) => f.originFileObj)
          .filter((f): f is File => !!f);

        if (newFiles.length > 0) {
          await tradeApi.uploadScreenshots(savedTrade.id, newFiles);
          console.log(`📤 Uploaded ${newFiles.length} new screenshot(s)`);
        }
      }
notifySuccess(
  isEditing ? 'Trade Updated' : 'Trade Created',
  isEditing 
    ? 'Your changes have been saved.' 
    : 'Your trade has been added to the journal.'
);
      onSuccess();
      onClose();
    } catch (err: any) {
      if (err.errorFields) return;
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
      width={750}
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
        {/* ⭐ Visible debug info */}
        {isEditing && (
          <div style={{ marginBottom: 16 }}>
            <Space wrap>
              <Tag color="blue">Existing: {editingTrade?.screenshots?.length || 0}</Tag>
              <Tag color="green">In UI: {fileList.length}</Tag>
              <Tag color="red">To Delete: {removedScreenshotIds.length}</Tag>
              {removedScreenshotIds.length > 0 && (
                <Tag color="volcano">IDs: {removedScreenshotIds.join(', ')}</Tag>
              )}
            </Space>
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 16,
          }}
        >
          <Form.Item label="Market" name="market" rules={[{ required: true }]}>
            <Select options={MARKETS} size="large" />
          </Form.Item>
          <Form.Item label="Symbol" name="symbol" rules={[{ required: true }]}>
            <Input placeholder="e.g., NIFTY, AAPL" size="large" />
          </Form.Item>

          <Form.Item label="Instrument Type" name="instrumentType">
            <Select options={INSTRUMENTS} size="large" />
          </Form.Item>
          <Form.Item label="Direction" name="direction" rules={[{ required: true }]}>
            <Select
              size="large"
              options={[
                { label: '🟢 BUY', value: 'BUY' },
                { label: '🔴 SELL', value: 'SELL' },
              ]}
            />
          </Form.Item>

          <Form.Item label="Entry Price" name="entryPrice" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} size="large" min={0} step={0.01} />
          </Form.Item>
          <Form.Item label="Exit Price" name="exitPrice" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} size="large" min={0} step={0.01} />
          </Form.Item>

          <Form.Item label="Stop Loss" name="stoploss">
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
          <Form.Item label="Quantity" name="quantity" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} size="large" min={1} />
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
          <Form.Item label="Higher Time Frame Bias" name="longTimeFrameBias">
            <Select size="large" options={BIAS_OPTIONS} />
          </Form.Item>

          <Form.Item label="Entry Date" name="entryDate" rules={[{ required: true }]}>
            <DatePicker showTime style={{ width: '100%' }} size="large" />
          </Form.Item>
          <Form.Item label="Exit Date" name="exitDate" rules={[{ required: true }]}>
            <DatePicker showTime style={{ width: '100%' }} size="large" />
          </Form.Item>
        </div>

        <Form.Item label="Notes" name="notes">
          <Input.TextArea rows={3} placeholder="Your thoughts, strategy, emotions..." />
        </Form.Item>

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
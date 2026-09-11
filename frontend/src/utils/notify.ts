import { notification } from 'antd';
import {
  CheckCircleFilled,
  CloseCircleFilled,
  InfoCircleFilled,
} from '@ant-design/icons';
import React from 'react';

export const notifySuccess = (title: string, description?: string) => {
  notification.success({
    message: title,
    description,
    placement: 'topRight',
    icon: React.createElement(CheckCircleFilled, { style: { color: '#52c41a' } }),
    duration: 3,
  });
};

export const notifyError = (title: string, description?: string) => {
  notification.error({
    message: title,
    description,
    placement: 'topRight',
    icon: React.createElement(CloseCircleFilled, { style: { color: '#ff4d4f' } }),
    duration: 5,
  });
};

export const notifyInfo = (title: string, description?: string) => {
  notification.info({
    message: title,
    description,
    placement: 'topRight',
    icon: React.createElement(InfoCircleFilled, { style: { color: '#1890ff' } }),
    duration: 4,
  });
};
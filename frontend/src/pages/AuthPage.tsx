import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Typography, message, Spin } from 'antd';
import { UserOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons';
import { authService } from '../services';
import { useAuth } from '../contexts/AuthContext';

const { Title, Paragraph, Text } = Typography;

type FormValues = {
    username: string;
    password: string;
    confirmPassword?: string;
};

const AuthPage: React.FC = () => {
    const navigate = useNavigate();
    const { isLoggedIn, login, refreshUser } = useAuth();
    const [hasAdmin, setHasAdmin] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm<FormValues>();

    useEffect(() => {
        // If already logged in, redirect to home
        if (isLoggedIn) {
            navigate('/');
            return;
        }

        // Check if admin exists
        const checkStatus = async () => {
            try {
                const status = await authService.getStatus();
                setHasAdmin(status.hasAdmin);
            } catch {
                message.error('无法连接到服务器');
            }
        };
        void checkStatus();
    }, [isLoggedIn, navigate]);

    const handleSetup = async (values: FormValues) => {
        if (values.password !== values.confirmPassword) {
            message.error('两次输入的密码不一致');
            return;
        }

        setLoading(true);
        try {
            const success = await authService.setup(values.username, values.password);
            if (success) {
                message.success('管理员账号创建成功');
                await refreshUser();
                navigate('/');
            } else {
                message.error('创建失败，请重试');
            }
        } catch (error) {
            message.error(error instanceof Error ? error.message : '创建失败');
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (values: FormValues) => {
        setLoading(true);
        try {
            const success = await login(values.username, values.password);
            if (success) {
                message.success('登录成功');
                navigate('/');
            } else {
                message.error('用户名或密码错误');
            }
        } catch (error) {
            message.error(error instanceof Error ? error.message : '登录失败');
        } finally {
            setLoading(false);
        }
    };

    if (hasAdmin === null) {
        return (
            <div className="auth-page">
                <div className="auth-loading">
                    <Spin size="large" />
                    <Text type="secondary">正在检查系统状态...</Text>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <Card className="auth-card glass-card">
                <div className="auth-header">
                    <div className="auth-icon">
                        <SafetyOutlined />
                    </div>
                    <Title level={3} className="auth-title">
                        {hasAdmin ? '管理员登录' : '创建管理员账号'}
                    </Title>
                    <Paragraph className="auth-subtitle">
                        {hasAdmin
                            ? '请输入管理员账号密码登录后台管理'
                            : '首次使用，请创建唯一的管理员账号'}
                    </Paragraph>
                </div>

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={hasAdmin ? handleLogin : handleSetup}
                    size="large"
                >
                    <Form.Item
                        name="username"
                        rules={[
                            { required: true, message: '请输入用户名' },
                            { min: 3, message: '用户名至少3个字符' }
                        ]}
                    >
                        <Input
                            prefix={<UserOutlined />}
                            placeholder="用户名"
                            autoComplete="username"
                        />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[
                            { required: true, message: '请输入密码' },
                            { min: 6, message: '密码至少6位' }
                        ]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder="密码"
                            autoComplete={hasAdmin ? 'current-password' : 'new-password'}
                        />
                    </Form.Item>

                    {!hasAdmin && (
                        <Form.Item
                            name="confirmPassword"
                            rules={[
                                { required: true, message: '请确认密码' },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue('password') === value) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error('两次输入的密码不一致'));
                                    }
                                })
                            ]}
                        >
                            <Input.Password
                                prefix={<LockOutlined />}
                                placeholder="确认密码"
                                autoComplete="new-password"
                            />
                        </Form.Item>
                    )}

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            block
                            loading={loading}
                            className="auth-submit-btn"
                        >
                            {hasAdmin ? '登录' : '创建管理员账号'}
                        </Button>
                    </Form.Item>
                </Form>

                {!hasAdmin && (
                    <div className="auth-warning">
                        <Text type="warning">
                            ⚠️ 请牢记管理员账号密码，创建后无法修改
                        </Text>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default AuthPage;

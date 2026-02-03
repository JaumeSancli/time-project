
import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert, message } from 'antd';
import { UserOutlined, LockOutlined, ThunderboltFilled } from '@ant-design/icons';
import { supabase } from '../supabaseClient';

const { Title, Text, Link } = Typography;

export const Auth: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [isLogin, setIsLogin] = useState(true);
    const [errorMSG, setErrorMSG] = useState<string | null>(null);

    const handleAuth = async (values: any) => {
        setLoading(true);
        setErrorMSG(null);
        const { email, password, fullName } = values;

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName,
                            avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${fullName}`,
                        },
                    },
                });
                if (error) throw error;
                message.success('Registration successful! Please check your email to verify your account if required.');
            }
        } catch (error: any) {
            setErrorMSG(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <Card className="w-full max-w-md shadow-lg border-gray-100">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 text-blue-600 mb-4">
                        <ThunderboltFilled style={{ fontSize: '24px' }} />
                    </div>
                    <Title level={3} style={{ margin: 0 }}>TimeFlow</Title>
                    <Text type="secondary">
                        {isLogin ? 'Welcome back! Please sign in.' : 'Create your account to get started.'}
                    </Text>
                </div>

                {errorMSG && (
                    <Alert
                        message="Authentication Error"
                        description={errorMSG}
                        type="error"
                        showIcon
                        className="mb-6"
                    />
                )}

                <Form
                    name="auth_form"
                    className="login-form"
                    initialValues={{ remember: true }}
                    onFinish={handleAuth}
                    size="large"
                    layout="vertical"
                >
                    {!isLogin && (
                        <Form.Item
                            name="fullName"
                            rules={[{ required: true, message: 'Please input your Full Name!' }]}
                        >
                            <Input prefix={<UserOutlined />} placeholder="Full Name" />
                        </Form.Item>
                    )}

                    <Form.Item
                        name="email"
                        rules={[{ required: true, message: 'Please input your Email!' }, { type: 'email', message: 'Invalid email' }]}
                    >
                        <Input prefix={<UserOutlined />} placeholder="Email" />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: 'Please input your Password!' }, { min: 6, message: 'Min 6 characters' }]}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="Password" />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" className="w-full bg-blue-600" loading={loading}>
                            {isLogin ? 'Sign In' : 'Sign Up'}
                        </Button>
                    </Form.Item>

                    <div className="text-center">
                        <Text type="secondary">
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                        </Text>
                        <Link onClick={() => setIsLogin(!isLogin)}>
                            {isLogin ? 'Sign Up' : 'Sign In'}
                        </Link>
                    </div>
                </Form>
            </Card>
        </div>
    );
};

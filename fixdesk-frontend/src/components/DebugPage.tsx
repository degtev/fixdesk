import React, { useState } from 'react';
import { Box, Button, Typography, Alert, CircularProgress } from '@mui/material';
import axios from 'axios';

function DebugPage() {
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any>({});
    const [error, setError] = useState('');

    const testEndpoint = async (endpoint: string, name: string) => {
        setLoading(true);
        setError('');
        
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}${endpoint}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setResults((prev: Record<string, any>) => ({
                ...prev,
                [name]: {
                    success: true,
                    data: response.data,
                    status: response.status
                }
            }));
            
        } catch (err: any) {
            setResults((prev: Record<string, any>) => ({
                ...prev,
                [name]: {
                    success: false,
                    error: err.response?.data || err.message,
                    status: err.response?.status
                }
            }));
            
        } finally {
            setLoading(false);
        }
    };

    const testAllEndpoints = async () => {
        setResults({});
        setError('');
        
        await testEndpoint('/me', 'User Info');
        await testEndpoint('/auth/who-invited-me', 'Who Invited Me');
        await testEndpoint('/auth/invited-users', 'Invited Users');
        await testEndpoint('/auth/invitation-requests', 'Invitation Requests');
        await testEndpoint('/auth/my-invitation-requests', 'My Invitation Requests');
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #000 0%, #231135 100%)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-start',
                padding: 4,
                color: 'white',
            }}
        >
            <Box
                sx={{
                    maxWidth: 1000,
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: 3,
                    boxShadow: '0 8px 32px 0 #231135',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.03)',
                    px: 4,
                    py: 4,
                }}
            >
                <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
                    API Debug Page
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <Box sx={{ mb: 3 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={testAllEndpoints}
                        disabled={loading}
                        sx={{ mr: 2 }}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Test All Endpoints'}
                    </Button>
                    
                    <Button
                        variant="outlined"
                        color="secondary"
                        onClick={() => testEndpoint('/me', 'User Info')}
                        disabled={loading}
                        sx={{ mr: 2 }}
                    >
                        Test /me
                    </Button>
                    
                    <Button
                        variant="outlined"
                        color="secondary"
                        onClick={() => testEndpoint('/auth/who-invited-me', 'Who Invited Me')}
                        disabled={loading}
                    >
                        Test Who Invited Me
                    </Button>
                </Box>

                {Object.keys(results).length > 0 && (
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            Test Results:
                        </Typography>
                        
                        {Object.entries(results).map(([name, result]: [string, any]) => (
                            <Box key={name} sx={{ mb: 2, p: 2, bgcolor: 'rgba(255, 255, 255, 0.05)', borderRadius: 1 }}>
                                <Typography variant="h6" sx={{ 
                                    color: result.success ? '#4caf50' : '#f44336',
                                    mb: 1
                                }}>
                                    {name} - {result.success ? 'SUCCESS' : 'FAILED'} (Status: {result.status})
                                </Typography>
                                
                                {result.success ? (
                                    <Box>
                                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                            Response keys: {Object.keys(result.data).join(', ')}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                            Data: {JSON.stringify(result.data, null, 2)}
                                        </Typography>
                                    </Box>
                                ) : (
                                    <Typography variant="body2" sx={{ color: '#f44336' }}>
                                        Error: {JSON.stringify(result.error, null, 2)}
                                    </Typography>
                                )}
                            </Box>
                        ))}
                    </Box>
                )}
            </Box>
        </Box>
    );
}

export default DebugPage; 
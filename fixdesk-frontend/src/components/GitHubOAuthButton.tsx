import React from 'react';
import { Button } from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';

interface GitHubOAuthButtonProps {
    action?: 'login' | 'register';
}

const GitHubOAuthButton: React.FC<GitHubOAuthButtonProps> = ({ action = 'login' }) => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

    const handleGitHubLogin = () => {
        window.location.href = `${backendUrl}/oauth/github`;
    };

    return (
        <Button
            fullWidth
            variant="outlined"
            startIcon={<GitHubIcon />}
            onClick={handleGitHubLogin}
            sx={{
                borderRadius: 2,
                borderColor: '#282c34',
                bgcolor: '#12141b',
                color: '#fff',
                textTransform: 'none',
                fontWeight: 600,
                py: 1.2,
                transition: 'all 0.3s',
                '&:hover': {
                    borderColor: '#fff',
                    bgcolor: 'rgba(255, 255, 255, 0.08)'
                }
            }}
        >
            {action === 'login' ? 'GitHub' : 'GitHub'}
        </Button>
    );
};

export default GitHubOAuthButton;


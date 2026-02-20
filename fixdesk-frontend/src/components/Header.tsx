import React, { useState } from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    Avatar,
    Menu,
    MenuItem,
    Box,
    IconButton,
    useTheme,
    useMediaQuery
} from '@mui/material';
import {
    Menu as MenuIcon,
    AccountCircle,
    Logout,
    Settings,
    Dashboard,
    Work
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Header: React.FC = () => {
    const { isAuthenticated, logout, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [mobileMenuAnchor, setMobileMenuAnchor] = useState<null | HTMLElement>(null);

    const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setMobileMenuAnchor(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setMobileMenuAnchor(null);
    };

    const handleLogout = () => {
        logout();
        handleMenuClose();
        navigate('/login');
    };

    const handleProfile = () => {
        handleMenuClose();
        navigate('/profile');
    };

    const handleDashboard = () => {
        handleMenuClose();
        navigate('/');
    };

    const handleProjects = () => {
        handleMenuClose();
        navigate('/projects');
    };

    const handleWorkspaces = () => {
        handleMenuClose();
        navigate('/workspaces');
    };

    const isActive = (path: string) => {
        return location.pathname === path;
    };

    const Logo = () => (
        <svg height="40" viewBox="0 0 261 219" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M195.356 -0.000823975C159.393 -0.000823975 130.24 29.1524 130.24 65.1147C130.24 101.077 159.393 130.23 195.356 130.23C231.318 130.23 260.472 101.077 260.472 65.1147C260.472 29.1524 231.318 -0.000823975 195.356 -0.000823975Z" fill="white"/>
            <path d="M65.125 130.23C101.087 130.23 130.241 101.077 130.241 65.1147C130.241 29.1524 101.087 -0.000823975 65.125 -0.000823975V130.23Z" fill="white"/>
            <path d="M0.00976562 130.23C35.9721 130.23 65.1256 101.077 65.1256 65.1147C65.1256 29.1524 35.9721 -0.000823975 0.00976562 -0.000823975V32.5639C17.9874 32.5639 32.5606 47.1371 32.5606 65.1147C32.5606 83.0923 17.9874 97.6658 0.00976562 97.6658V130.23Z" fill="white"/>
            <path d="M17.64 181.397H43.68V217.797H31.99V191.687H17.64V217.797H5.95V191.687H0V181.397H5.95V179.017C5.95 174.724 7.11667 171.364 9.45 168.937C11.83 166.51 15.19 165.297 19.53 165.297H25.97V174.957H23.03C21.3967 174.957 20.09 175.447 19.11 176.427C18.13 177.36 17.64 178.69 17.64 180.417V181.397ZM31.78 175.797V166.417H43.82V175.797H31.78Z" fill="white"/>
            <path d="M77.0071 198.827L89.8171 217.797H77.0071L69.4471 205.757L61.8171 217.797H49.1471L62.0271 199.107L50.1271 181.397H62.7271L69.5871 192.737L76.4471 181.397H88.9771L77.0071 198.827Z" fill="white"/>
            <path d="M119.703 167.397H131.323V217.797H120.543V214.227C117.836 217.214 114.033 218.707 109.133 218.707C106.146 218.707 103.276 217.937 100.523 216.397C97.7694 214.81 95.5294 212.57 93.8027 209.677C92.0761 206.737 91.2127 203.377 91.2127 199.597C91.2127 195.817 92.0761 192.48 93.8027 189.587C95.5294 186.647 97.7694 184.407 100.523 182.867C103.276 181.28 106.146 180.487 109.133 180.487C113.566 180.487 117.089 181.724 119.703 184.197V167.397ZM111.513 208.347C114.033 208.347 116.109 207.53 117.743 205.897C119.423 204.217 120.263 202.117 120.263 199.597C120.263 197.077 119.423 195 117.743 193.367C116.109 191.687 114.033 190.847 111.513 190.847C108.993 190.847 106.893 191.687 105.213 193.367C103.579 195 102.763 197.077 102.763 199.597C102.763 202.117 103.579 204.217 105.213 205.897C106.893 207.53 108.993 208.347 111.513 208.347Z" fill="white"/>
            <path d="M157.704 180.487C161.157 180.487 164.354 181.28 167.294 182.867C170.281 184.454 172.661 186.694 174.434 189.587C176.254 192.434 177.164 195.677 177.164 199.317C177.164 200.39 177.047 201.627 176.814 203.027H149.794C150.261 205.22 151.194 206.924 152.594 208.137C153.994 209.35 155.744 209.957 157.844 209.957C159.524 209.957 160.924 209.654 162.044 209.047C163.211 208.44 164.191 207.53 164.984 206.317H176.114C174.761 210.004 172.497 212.99 169.324 215.277C166.151 217.564 162.277 218.707 157.704 218.707C154.204 218.707 150.961 217.914 147.974 216.327C144.987 214.74 142.584 212.5 140.764 209.607C138.991 206.714 138.104 203.377 138.104 199.597C138.104 195.817 138.991 192.48 140.764 189.587C142.584 186.694 144.987 184.454 147.974 182.867C150.961 181.28 154.204 180.487 157.704 180.487ZM157.704 189.307C155.744 189.307 154.064 189.867 152.664 190.987C151.311 192.06 150.377 193.647 149.864 195.747H165.684C165.311 193.834 164.447 192.294 163.094 191.127C161.741 189.914 159.944 189.307 157.704 189.307Z" fill="white"/>
            <path d="M198.742 218.707C195.429 218.707 192.535 218.17 190.062 217.097C187.589 215.977 185.629 214.46 184.182 212.547C182.782 210.634 181.989 208.487 181.802 206.107H192.862C193.002 207.227 193.562 208.16 194.542 208.907C195.569 209.654 196.945 210.027 198.672 210.027C200.165 210.027 201.309 209.794 202.102 209.327C202.942 208.814 203.362 208.067 203.362 207.087C203.362 206.107 202.802 205.384 201.682 204.917C200.609 204.404 198.905 203.914 196.572 203.447C193.772 202.84 191.439 202.187 189.572 201.487C187.752 200.74 186.165 199.574 184.812 197.987C183.459 196.354 182.782 194.137 182.782 191.337C182.782 189.284 183.435 187.44 184.742 185.807C186.049 184.174 187.869 182.89 190.202 181.957C192.535 180.977 195.172 180.487 198.112 180.487C200.819 180.487 203.315 181 205.602 182.027C207.935 183.054 209.825 184.5 211.272 186.367C212.719 188.234 213.512 190.334 213.652 192.667H202.732C202.639 191.594 202.149 190.73 201.262 190.077C200.422 189.424 199.302 189.097 197.902 189.097C196.642 189.097 195.662 189.307 194.962 189.727C194.309 190.147 193.982 190.754 193.982 191.547C193.982 192.48 194.495 193.18 195.522 193.647C196.595 194.067 198.322 194.557 200.702 195.117C203.502 195.724 205.812 196.377 207.632 197.077C209.499 197.777 211.109 198.92 212.462 200.507C213.815 202.047 214.492 204.17 214.492 206.877C214.492 210.564 213.069 213.457 210.222 215.557C207.375 217.657 203.549 218.707 198.742 218.707Z" fill="white"/>
            <path d="M244.022 199.107L259.912 217.797H246.402L233.942 202.817V217.797H222.252V167.397H233.942V195.887L245.772 181.397H258.792L244.022 199.107Z" fill="white"/>
        </svg>
    );

    if (loading) {
        return null;
    }
    if (!isAuthenticated) {
        return null;
    }

    return (
        <AppBar 
            position="fixed" 
            sx={{ 
                zIndex: theme.zIndex.drawer + 1,
                background: '#212134',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                borderBottom: '1px solid #32324d'
            }}
        >
            <Toolbar>
                <Typography
                    variant="body1"
                    component="div"
                    sx={{ 
                        flexGrow: 0,
                        mr: 2,
                        cursor: 'pointer',
                        display:'flex',
                    }}
                    onClick={() => navigate('/')}
                >
                    <Logo />
                </Typography>

                {!isMobile && (
                    <Box sx={{ display: 'flex', gap: 2, flexGrow: 1 }}>
                        <Button
                            color="inherit"
                            onClick={() => navigate('/')}
                            sx={{
                                color: isActive('/') ? '#7b79ff' : '#ffffff',
                                fontSize: '0.875rem',
                                textTransform: 'none',
                                bgcolor: isActive('/') ? '#181826' : 'transparent',
                                '&:hover': { bgcolor: '#181826' }
                            }}
                        >
                            Главная
                        </Button>
                        <Button
                            color="inherit"
                            onClick={() => navigate('/workspaces')}
                            sx={{
                                color: location.pathname.startsWith('/workspaces') ? '#7b79ff' : '#ffffff',
                                fontSize: '0.875rem',
                                textTransform: 'none',
                                bgcolor: location.pathname.startsWith('/workspaces') ? '#181826' : 'transparent',
                                '&:hover': { bgcolor: '#181826' }
                            }}
                        >
                            Воркспейс
                        </Button>
                    </Box>
                )}

                {isMobile && (
                    <IconButton
                        size="large"
                        edge="start"
                        color="inherit"
                        aria-label="menu"
                        onClick={handleMobileMenuOpen}
                        sx={{ mr: 2 }}
                    >
                        <MenuIcon />
                    </IconButton>
                )}

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton
                        size="large"
                        edge="end"
                        aria-label="account of current user"
                        aria-controls="menu-appbar"
                        aria-haspopup="true"
                        onClick={handleProfileMenuOpen}
                        color="inherit"
                    >
                        <Avatar sx={{ width: 32, height: 32, bgcolor: '#7b79ff' }}>
                            <AccountCircle />
                        </Avatar>
                    </IconButton>
                </Box>

                <Menu
                    id="menu-appbar"
                    anchorEl={anchorEl}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                    }}
                    keepMounted
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                    }}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                    PaperProps={{
                        sx: {
                            background: '#212134',
                            border: '1px solid #32324d',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
                            mt: 1
                        }
                    }}
                >
                    <MenuItem onClick={handleProfile} sx={{ color: '#ffffff', fontSize: '0.875rem' }}>
                        <AccountCircle sx={{ mr: 1, color: '#fff' }} />
                        Профиль
                    </MenuItem>
                    <MenuItem onClick={handleLogout} sx={{ color: '#fff', fontSize: '0.875rem' }}>
                        <Logout sx={{ mr: 1 }} />
                        Выйти
                    </MenuItem>
                </Menu>

                <Menu
                    anchorEl={mobileMenuAnchor}
                    open={Boolean(mobileMenuAnchor)}
                    onClose={handleMenuClose}
                    PaperProps={{
                        sx: {
                            background: '#212134',
                            border: '1px solid #32324d',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
                            mt: 1
                        }
                    }}
                >
                    <MenuItem onClick={handleDashboard} sx={{ color: '#ffffff', fontSize: '0.875rem' }}>
                        <Dashboard sx={{ mr: 1, color: '#fff' }} />
                        Главная
                    </MenuItem>
                    <MenuItem onClick={handleWorkspaces} sx={{ color: '#ffffff', fontSize: '0.875rem' }}>
                        <Work sx={{ mr: 1, color: '#fff' }} />
                        Воркспейс
                    </MenuItem>
                </Menu>
            </Toolbar>
        </AppBar>
    );
};

export default Header; 
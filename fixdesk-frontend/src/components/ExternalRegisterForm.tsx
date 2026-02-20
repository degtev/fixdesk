import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Alert, Box, Button, TextField, Typography, InputAdornment, IconButton, Stack, Checkbox, FormControlLabel } from "@mui/material";
import { Visibility, VisibilityOff } from '@mui/icons-material';

function ExternalRegister() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const email = searchParams.get('email');
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        password: '',
        confirmPassword: '',
        email: '',
        position: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [agreedToPolicy, setAgreedToPolicy] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleClickShowPassword = () => {
        setShowPassword(!showPassword);
    };

    const handleClickShowConfirmPassword = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

    const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) {
            setError('Отсутствует токен');
            return;
        }

        if (!agreedToPolicy) {
            setError('Необходимо согласиться с политикой конфиденциальности');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Пароли не совпадают');
            return;
        }

        if (formData.password.length < 6) {
            setError('Пароль должен содержать минимум 6 символов');
            return;
        }

        try {
            const { confirmPassword, ...dataToSend } = formData;
            await axios.post(`${import.meta.env.VITE_BACKEND_URL}/auth/register/external/complete`, {
                ...dataToSend,
                token,
            });
            setSuccess('Регистрация успешна!');
            setError('');
            setTimeout(() => navigate('/login'), 2000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Ошибка регистрации');
        }
    };

    if (!token) {
        return <p>Токен не найден в URL, регистрация невозможна.</p>;
    }

    const Logo = () => (
        <svg height="35" viewBox="0 0 676 131" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M195.346 -0.000823975C159.384 -0.000823975 130.23 29.1524 130.23 65.1147C130.23 101.077 159.384 130.23 195.346 130.23C231.309 130.23 260.462 101.077 260.462 65.1147C260.462 29.1524 231.309 -0.000823975 195.346 -0.000823975Z" fill="#4E55E8" />
            <path d="M65.1152 130.23C101.078 130.23 130.231 101.077 130.231 65.1147C130.231 29.1524 101.078 -0.000823975 65.1152 -0.000823975V130.23Z" fill="#4E55E8" />
            <path d="M0 130.23C35.9623 130.23 65.1158 101.077 65.1158 65.1147C65.1158 29.1524 35.9623 -0.000823975 0 -0.000823975V32.5639C17.9776 32.5639 32.5508 47.1371 32.5508 65.1147C32.5508 83.0923 17.9776 97.6658 0 97.6658V130.23Z" fill="#4E55E8" />
            <path d="M321.781 49.5125H359.852V102.671H342.761V64.54H321.781V102.671H304.689V64.54H295.99V49.5125H304.689V46.0367C304.689 39.7667 306.395 34.8598 309.806 31.3159C313.286 27.772 318.199 26 324.544 26H333.959V40.1075H329.661C327.273 40.1075 325.363 40.8231 323.93 42.2543C322.497 43.6173 321.781 45.5596 321.781 48.0813V49.5125ZM342.454 41.3342V27.6357H360.057V41.3342H342.454Z" fill="#4E55E8" />
            <path d="M408.577 74.9672L427.306 102.671H408.577L397.524 85.0878L386.369 102.671H367.845L386.676 75.3761L369.278 49.5125H387.699L397.729 66.0734L407.759 49.5125H426.078L408.577 74.9672Z" fill="#4E55E8" />
            <path d="M471 29.0668H487.989V102.671H472.228V97.4574C468.271 101.819 462.71 104 455.546 104C451.18 104 446.983 102.875 442.958 100.626C438.933 98.3093 435.658 95.038 433.133 90.8126C430.609 86.519 429.346 81.6121 429.346 76.0917C429.346 70.5714 430.609 65.6986 433.133 61.4731C435.658 57.1796 438.933 53.9083 442.958 51.6592C446.983 49.3421 451.18 48.1835 455.546 48.1835C462.028 48.1835 467.179 49.9895 471 53.6016V29.0668ZM459.026 88.8702C462.71 88.8702 465.746 87.6776 468.134 85.2923C470.59 82.8388 471.819 79.772 471.819 76.0917C471.819 72.4115 470.59 69.3788 468.134 66.9934C465.746 64.54 462.71 63.3132 459.026 63.3132C455.341 63.3132 452.271 64.54 449.815 66.9934C447.427 69.3788 446.233 72.4115 446.233 76.0917C446.233 79.772 447.427 82.8388 449.815 85.2923C452.271 87.6776 455.341 88.8702 459.026 88.8702Z" fill="#4E55E8" />
            <path d="M526.559 48.1835C531.608 48.1835 536.282 49.3421 540.58 51.6592C544.947 53.9764 548.426 57.2477 551.019 61.4731C553.68 65.6304 555.01 70.367 555.01 75.6828C555.01 77.2503 554.84 79.0564 554.499 81.1009H514.994C515.677 84.3041 517.041 86.7916 519.088 88.5636C521.135 90.3355 523.693 91.2215 526.764 91.2215C529.22 91.2215 531.267 90.7785 532.904 89.8925C534.61 89.0066 536.043 87.6776 537.203 85.9056H553.475C551.496 91.2896 548.187 95.6514 543.548 98.9908C538.908 102.33 533.245 104 526.559 104C521.442 104 516.7 102.841 512.333 100.524C507.967 98.2071 504.453 94.9358 501.792 90.7104C499.199 86.4849 497.903 81.6121 497.903 76.0917C497.903 70.5714 499.199 65.6986 501.792 61.4731C504.453 57.2477 507.967 53.9764 512.333 51.6592C516.7 49.3421 521.442 48.1835 526.559 48.1835ZM526.559 61.0642C523.693 61.0642 521.237 61.882 519.19 63.5177C517.212 65.0852 515.847 67.4024 515.097 70.4692H538.226C537.68 67.675 536.418 65.426 534.439 63.7222C532.461 61.9502 529.834 61.0642 526.559 61.0642Z" fill="#4E55E8" />
            <path d="M586.558 104C581.714 104 577.484 103.216 573.868 101.649C570.252 100.013 567.386 97.7982 565.271 95.0039C563.224 92.2097 562.064 89.0747 561.791 85.599H577.961C578.166 87.2346 578.985 88.5976 580.418 89.6881C581.919 90.7785 583.931 91.3237 586.456 91.3237C588.639 91.3237 590.311 90.983 591.471 90.3014C592.699 89.5518 593.313 88.4613 593.313 87.0301C593.313 85.599 592.494 84.5426 590.856 83.8611C589.287 83.1114 586.797 82.3958 583.385 81.7143C579.292 80.8283 575.88 79.8742 573.151 78.8519C570.49 77.7615 568.171 76.0577 566.192 73.7405C564.213 71.3552 563.224 68.118 563.224 64.0288C563.224 61.0301 564.179 58.3381 566.09 55.9528C568 53.5675 570.661 51.6933 574.072 50.3303C577.484 48.8991 581.339 48.1835 585.637 48.1835C589.594 48.1835 593.244 48.9332 596.588 50.4325C599.999 51.9318 602.762 54.0446 604.877 56.7706C606.992 59.4967 608.152 62.5636 608.357 65.9712H592.392C592.255 64.4037 591.539 63.1429 590.242 62.1887C589.014 61.2346 587.377 60.7575 585.33 60.7575C583.488 60.7575 582.055 61.0642 581.032 61.6776C580.076 62.291 579.599 63.1769 579.599 64.3355C579.599 65.6986 580.349 66.7208 581.85 67.4024C583.42 68.0157 585.944 68.7313 589.424 69.5492C593.517 70.4351 596.895 71.3893 599.556 72.4115C602.285 73.4338 604.639 75.1035 606.617 77.4207C608.596 79.6697 609.585 82.7706 609.585 86.7235C609.585 92.1075 607.504 96.3329 603.342 99.3997C599.18 102.467 593.586 104 586.558 104Z" fill="#4E55E8" />
            <path d="M652.758 75.3761L675.99 102.671H656.238L638.021 80.7942V102.671H620.93V29.0668H638.021V70.6737L655.317 49.5125H674.353L652.758 75.3761Z" fill="#4E55E8" />
        </svg>
    );


    return (
        <Box
            sx={{
                minHeight: '100vh',
                bgcolor: '#16161a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
        >
            <Box
                component="form"
                onSubmit={handleSubmit}
                sx={{
                    width: '100%',
                    maxWidth: 390,
                    bgcolor: '#16161a',
                    borderRadius: 3,
                    padding: '20px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    boxSizing: 'border-box',
                }}
            >
                <Stack mb={3} alignItems="center" gap={2}>
                    <Logo />
                    <Typography variant="h5" fontWeight={700} color="#fff" textAlign="center" fontSize="1.25rem">
                        Регистрация
                    </Typography>
                </Stack>

                {error && (
                    <Alert
                        severity="error"
                        sx={{
                            mb: 4,
                            background: 'rgba(123,121,255,0.08)',
                            border: '1px solid #7b79ff',
                            color: '#b2b8cd',
                            borderRadius: 2,
                            fontWeight: 500,
                            fontSize: 15,
                            boxShadow: '0 2px 8px 0 rgba(105,102,255,0.10)',
                            letterSpacing: 0.1,
                            '& .MuiAlert-icon': {
                                color: '#7b79ff',
                            }
                        }}
                    >
                        {error}
                    </Alert>
                )}
                {success && (
                    <Alert
                        severity="success"
                        sx={{
                            mb: 4,
                            bgcolor: 'rgba(123, 255, 198, 0.10)',
                            border: '1px solid #20cb98',
                            color: '#b2b8cd',
                            borderRadius: 2,
                            fontWeight: 500,
                            fontSize: 15,
                            boxShadow: '0 2px 8px 0 rgba(32,203,152,0.12)',
                            letterSpacing: 0.1,
                            alignItems: 'center',
                            '& .MuiAlert-icon': {
                                color: '#20cb98',
                            }
                        }}
                    >
                        {success}
                    </Alert>
                )}
                <Stack spacing={2} width="100%" mb={2}>
                    <TextField
                        name="first_name"
                        label="Имя"
                        variant="outlined"
                        value={formData.first_name}
                        onChange={handleChange}
                        required
                        fullWidth
                        InputProps={{
                            sx: {
                                borderRadius: 2,
                                bgcolor: '#12141b',
                                color: '#fff',
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#282c34',
                                    transition: 'border-color 0.5s cubic-bezier(0.4,0,0.2,1)',

                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#282c34'
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#4e55e8',
                                    borderWidth: '1px'
                                },
                            },
                        }}
                        InputLabelProps={{
                            sx: {
                                color: '#6b6f7e',
                                '&.Mui-focused': {
                                    color: '#4e55e8',
                                }
                            }
                        }}
                    />

                    <TextField
                        name="last_name"
                        label="Фамилия"
                        variant="outlined"
                        value={formData.last_name}
                        onChange={handleChange}
                        required
                        fullWidth
                        InputProps={{
                            sx: {
                                borderRadius: 2,
                                bgcolor: '#12141b',
                                color: '#fff',
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#282c34',
                                    transition: 'border-color 0.5s cubic-bezier(0.4,0,0.2,1)',

                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#282c34'
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#4e55e8',
                                    borderWidth: '1px'
                                },
                            },
                        }}
                        InputLabelProps={{
                            sx: {
                                color: '#6b6f7e',
                                '&.Mui-focused': {
                                    color: '#4e55e8',
                                }
                            }
                        }}
                    />

                    <TextField
                        name="email"
                        label="Почта"
                        variant="outlined"
                        onChange={handleChange}
                        required
                        fullWidth
                        disabled
                        value={email || ''}
                        InputProps={{
                            sx: {
                                borderRadius: 2,
                                bgcolor: '#12141b',
                                color: '#fff',
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#282c34',
                                    transition: 'border-color 0.5s cubic-bezier(0.4,0,0.2,1)',

                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#282c34'
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#4e55e8',
                                    borderWidth: '1px'
                                },
                            },
                        }}
                        InputLabelProps={{
                            sx: {
                                color: '#6b6f7e',
                                '&.Mui-focused': {
                                    color: '#4e55e8',
                                }
                            }
                        }}
                    />

                    <TextField
                        name="password"
                        label="Пароль"
                        type={showPassword ? 'text' : 'password'}
                        variant="outlined"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        fullWidth
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label="toggle password visibility"
                                        onClick={handleClickShowPassword}
                                        onMouseDown={handleMouseDownPassword}
                                        edge="end"
                                        sx={{
                                            color: '#282c34',
                                            transition: 'color 0.5s, background-color 0.5s',
                                            '&:hover': {
                                                color: '#4e55e8'
                                            }
                                        }}
                                    >
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                            sx: {
                                borderRadius: 2,
                                bgcolor: '#12141b',
                                color: '#fff',
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#282c34',
                                    transition: 'border-color 0.5s cubic-bezier(0.4,0,0.2,1)',

                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#282c34'
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#4e55e8',
                                    borderWidth: '1px'
                                },
                            },
                        }}
                        InputLabelProps={{
                            sx: {
                                color: '#6b6f7e',
                                '&.Mui-focused': {
                                    color: '#4e55e8',
                                }
                            }
                        }}
                    />

                    <TextField
                        name="confirmPassword"
                        label="Подтвердите пароль"
                        type={showConfirmPassword ? 'text' : 'password'}
                        variant="outlined"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        fullWidth
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label="toggle confirm password visibility"
                                        onClick={handleClickShowConfirmPassword}
                                        onMouseDown={handleMouseDownPassword}
                                        edge="end"
                                        sx={{
                                            color: '#282c34',
                                            transition: 'color 0.5s, background-color 0.5s',
                                            '&:hover': {
                                                color: '#4e55e8'
                                            }
                                        }}
                                    >
                                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                            sx: {
                                borderRadius: 2,
                                bgcolor: '#12141b',
                                color: '#fff',
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#282c34',
                                    transition: 'border-color 0.5s cubic-bezier(0.4,0,0.2,1)',

                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#282c34'
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#4e55e8',
                                    borderWidth: '1px'
                                },
                            },
                        }}
                        InputLabelProps={{
                            sx: {
                                color: '#6b6f7e',
                                '&.Mui-focused': {
                                    color: '#4e55e8',
                                }
                            }
                        }}
                    />

                    <TextField
                        name="position"
                        label="Должность"
                        variant="outlined"
                        value={formData.position}
                        onChange={handleChange}
                        fullWidth
                        required
                        InputProps={{
                            sx: {
                                borderRadius: 2,
                                bgcolor: '#12141b',
                                color: '#fff',
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#282c34',
                                    transition: 'border-color 0.5s cubic-bezier(0.4,0,0.2,1)',

                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#282c34'
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#4e55e8',
                                    borderWidth: '1px'
                                },
                            },
                        }}
                        InputLabelProps={{
                            sx: {
                                color: '#6b6f7e',
                                '&.Mui-focused': {
                                    color: '#4e55e8',
                                }
                            }
                        }}
                    />
                </Stack>

                <FormControlLabel
                    control={
                        <Checkbox
                            checked={agreedToPolicy}
                            onChange={(e) => setAgreedToPolicy(e.target.checked)}
                            sx={{
                                color: '#6b6f7e',
                                '&.Mui-checked': {
                                    color: '#4e55e8',
                                },
                                display: 'none',
                            }}
                        />
                    }
                    label={
                        <Typography variant="body2" sx={{ color: '#a5a5ba' }}>
                            Я согласен с{' '}
                            <Link
                                to="/privacy-policy"
                                target="_blank"
                                style={{ color: '#4e55e8', textDecoration: 'none' }}
                            >
                                политикой конфиденциальности
                            </Link>
                        </Typography>
                    }
                    sx={{ mb: 2 }}
                />

                <Button
                    type="submit"
                    variant="contained"
                    disabled={!agreedToPolicy}
                    fullWidth
                    sx={{
                        bgcolor: '#4e55e8',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: 16,
                        borderRadius: 2,
                        py: 1.3,
                        boxShadow: '0 2px 7px 0 rgba(105,102,255,0.14)',
                        mb: 2,
                        textTransform: 'none',
                        '&:hover': { bgcolor: '#7b79ff' }
                    }}
                >
                    Зарегистрироваться
                </Button>
            </Box>
        </Box>
    );

}

export default ExternalRegister;

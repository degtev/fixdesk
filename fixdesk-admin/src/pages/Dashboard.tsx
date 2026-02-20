import { Layout, Menu, Avatar, Dropdown } from 'antd'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { UserOutlined, LogoutOutlined, TeamOutlined } from '@ant-design/icons'
import { useAuth } from '../contexts/AuthContext'
import UsersList from './UsersList'

const { Header, Content, Sider } = Layout

const Dashboard = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const menuItems = [
    {
      key: '/dashboard/users',
      icon: <TeamOutlined />,
      label: 'Пользователи',
      onClick: () => navigate('/dashboard/users'),
    },
  ]

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Выйти',
      onClick: handleLogout,
    },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        background: '#001529',
        padding: '0 20px'
      }}>
        <div style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>
          FixDesk Admin
        </div>
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Avatar icon={<UserOutlined />} />
            <span style={{ color: 'white' }}>
              {user?.first_name} {user?.last_name}
            </span>
          </div>
        </Dropdown>
      </Header>
      <Layout>
        <Sider width={200} style={{ background: '#fff' }}>
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            style={{ height: '100%', borderRight: 0 }}
            items={menuItems}
          />
        </Sider>
        <Layout style={{ padding: '24px' }}>
          <Content
            style={{
              background: '#fff',
              padding: 24,
              margin: 0,
              minHeight: 280,
            }}
          >
            <Routes>
              <Route path="users" element={<UsersList />} />
              <Route path="/" element={<UsersList />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  )
}

export default Dashboard


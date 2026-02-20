import { useState, useEffect } from 'react'
import { Table, Button, Input, Space, Modal, Form, message, Select, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import axios from 'axios'
import { API_URL } from '../contexts/AuthContext'
import type { TablePaginationConfig } from 'antd'

interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  position?: string
  created_at: string
}

const UsersList = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [searchText, setSearchText] = useState('')
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  })
  const [form] = Form.useForm()

  const fetchUsers = async (page = 1, pageSize = 10, search = '') => {
    setLoading(true)
    try {
      const response = await axios.get(`${API_URL}/admin/users`, {
        params: {
          page,
          limit: pageSize,
          search,
        },
      })
      setUsers(response.data.users)
      setPagination({
        current: page,
        pageSize,
        total: response.data.total,
      })
    } catch (error) {
      message.error('Ошибка загрузки пользователей')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers(pagination.current, pagination.pageSize, searchText)
  }, [])

  const handleTableChange = (newPagination: TablePaginationConfig) => {
    fetchUsers(newPagination.current || 1, newPagination.pageSize || 10, searchText)
  }

  const handleSearch = (value: string) => {
    setSearchText(value)
    fetchUsers(1, pagination.pageSize, value)
  }

  const handleCreate = () => {
    setEditingUser(null)
    form.resetFields()
    setIsModalOpen(true)
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    form.setFieldsValue({
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      position: user.position,
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`${API_URL}/admin/users/${id}`)
      message.success('Пользователь удален')
      fetchUsers(pagination.current, pagination.pageSize, searchText)
    } catch (error) {
      message.error('Ошибка удаления пользователя')
    }
  }

  const handleDeleteSelected = async () => {
    try {
      await Promise.all(
        selectedRowKeys.map((id) => axios.delete(`${API_URL}/admin/users/${id}`))
      )
      message.success('Пользователи удалены')
      setSelectedRowKeys([])
      fetchUsers(pagination.current, pagination.pageSize, searchText)
    } catch (error) {
      message.error('Ошибка удаления пользователей')
    }
  }

  const handleSubmit = async (values: any) => {
    try {
      if (editingUser) {
        await axios.put(`${API_URL}/admin/users/${editingUser.id}`, values)
        message.success('Пользователь обновлен')
      } else {
        await axios.post(`${API_URL}/admin/users`, values)
        message.success('Пользователь создан')
      }
      setIsModalOpen(false)
      form.resetFields()
      fetchUsers(pagination.current, pagination.pageSize, searchText)
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Ошибка сохранения пользователя')
    }
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Имя',
      dataIndex: 'first_name',
      key: 'first_name',
    },
    {
      title: 'Фамилия',
      dataIndex: 'last_name',
      key: 'last_name',
    },
    {
      title: 'Должность',
      dataIndex: 'position',
      key: 'position',
    },
    {
      title: 'Дата создания',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString('ru-RU'),
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 120,
      render: (_: any, record: User) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Вы уверены?"
            onConfirm={() => handleDelete(record.id)}
            okText="Да"
            cancelText="Нет"
          >
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys: React.Key[]) => {
      setSelectedRowKeys(selectedKeys)
    },
  }

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Создать пользователя
          </Button>
          {selectedRowKeys.length > 0 && (
            <Popconfirm
              title={`Удалить ${selectedRowKeys.length} пользователей?`}
              onConfirm={handleDeleteSelected}
              okText="Да"
              cancelText="Нет"
            >
              <Button danger icon={<DeleteOutlined />}>
                Удалить выбранных ({selectedRowKeys.length})
              </Button>
            </Popconfirm>
          )}
        </Space>
        <Space>
          <Input.Search
            placeholder="Поиск по имени или email"
            allowClear
            onSearch={handleSearch}
            style={{ width: 300 }}
            prefix={<SearchOutlined />}
          />
          <Select
            value={pagination.pageSize}
            onChange={(value) => {
              fetchUsers(1, value, searchText)
            }}
            style={{ width: 120 }}
            options={[
              { value: 10, label: '10 / страница' },
              { value: 20, label: '20 / страница' },
              { value: 50, label: '50 / страница' },
              { value: 100, label: '100 / страница' },
            ]}
          />
        </Space>
      </div>

      <Table
        rowSelection={rowSelection}
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={loading}
        pagination={pagination}
        onChange={handleTableChange}
      />

      <Modal
        title={editingUser ? 'Редактировать пользователя' : 'Создать пользователя'}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false)
          form.resetFields()
        }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Введите email' },
              { type: 'email', message: 'Введите корректный email' },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="first_name"
            label="Имя"
            rules={[{ required: true, message: 'Введите имя' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="last_name"
            label="Фамилия"
            rules={[{ required: true, message: 'Введите фамилию' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="position" label="Должность">
            <Input />
          </Form.Item>
          {!editingUser && (
            <Form.Item
              name="password"
              label="Пароль"
              rules={[
                { required: true, message: 'Введите пароль' },
                { min: 6, message: 'Минимум 6 символов' },
              ]}
            >
              <Input.Password />
            </Form.Item>
          )}
          {editingUser && (
            <Form.Item
              name="password"
              label="Новый пароль (оставьте пустым, если не нужно менять)"
            >
              <Input.Password />
            </Form.Item>
          )}
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingUser ? 'Сохранить' : 'Создать'}
              </Button>
              <Button
                onClick={() => {
                  setIsModalOpen(false)
                  form.resetFields()
                }}
              >
                Отмена
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default UsersList


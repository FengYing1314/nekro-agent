import React, { useState } from 'react'
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel,
  IconButton,
  Tooltip,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Typography,
  Switch,
  FormControlLabel,
  useTheme,
  useMediaQuery,
  SxProps,
  Theme,
} from '@mui/material'
import type { WheelEvent as ReactWheelEvent } from 'react'
import VisibilityIcon from '@mui/icons-material/Visibility'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import BlockIcon from '@mui/icons-material/Block'
import LockIcon from '@mui/icons-material/Lock'
import KeyIcon from '@mui/icons-material/Key'
import { User, UserUpdateData, getUserStatus } from '../../../services/api/user-manager'
import { format } from 'date-fns'
import RcSlider from 'rc-slider'
import 'rc-slider/assets/index.css'
import { CHIP_VARIANTS, UNIFIED_TABLE_STYLES } from '../../../theme/variants'

// 定义视觉隐藏样式，替代 visuallyHidden
const srOnlyStyle = {
  border: 0,
  clip: 'rect(0 0 0 0)',
  height: '1px',
  margin: -1,
  overflow: 'hidden',
  padding: 0,
  position: 'absolute',
  top: 20,
  width: '1px',
}

interface Pagination {
  page: number
  page_size: number
}

interface Sorting {
  field: string
  order: 'asc' | 'desc'
}

interface UserTableProps {
  users: User[]
  total: number
  loading: boolean
  pagination: Pagination
  onPaginationChange: (pagination: Pagination) => void
  sorting: Sorting
  onSortingChange: (sorting: Sorting) => void
  onViewDetail: (userId: number) => void
  onDeleteUser: (userId: number) => Promise<unknown>
  onBanUser: (params: { id: number; banUntil: string | null }) => Promise<unknown>
  onSetPreventTrigger: (params: {
    id: number
    preventTriggerUntil: string | null
  }) => Promise<unknown>
  onResetPassword: (params: { id: number; password: string }) => Promise<unknown>
  onUpdateUser: (params: { id: number; data: UserUpdateData }) => Promise<unknown>
  showEditButton?: boolean
  tableProps?: React.ComponentProps<typeof Table>
}

const UserTable: React.FC<UserTableProps> = ({
  users,
  loading,
  sorting,
  onSortingChange,
  onViewDetail,
  onDeleteUser,
  onBanUser,
  onSetPreventTrigger,
  onResetPassword,
  onUpdateUser,
  showEditButton = false,
  tableProps,
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [banDialogOpen, setBanDialogOpen] = useState(false)
  const [preventTriggerDialogOpen, setPreventTriggerDialogOpen] = useState(false)
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [banDuration, setBanDuration] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
  })
  const [preventTriggerDuration, setPreventTriggerDuration] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
  })
  const [newPassword, setNewPassword] = useState<string>('')
  const [editFormData, setEditFormData] = useState({
    username: '',
    perm_level: 0,
    access_key: '',
  })
  const [isPermanentBan, setIsPermanentBan] = useState(false)
  const [isPermanentPreventTrigger, setIsPermanentPreventTrigger] = useState(false)

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'))

  const handleRequestSort = (property: string) => {
    const isAsc = sorting.field === property && sorting.order === 'asc'
    onSortingChange({
      field: property,
      order: isAsc ? 'desc' : 'asc',
    })
  }

  const handleDeleteClick = (user: User) => {
    setSelectedUser(user)
    setDeleteDialogOpen(true)
  }

  const handleBanClick = (user: User) => {
    setSelectedUser(user)
    setBanDuration({ days: 0, hours: 0, minutes: 0 })
    setIsPermanentBan(false)
    setBanDialogOpen(true)
  }

  const handlePreventTriggerClick = (user: User) => {
    setSelectedUser(user)
    setPreventTriggerDuration({ days: 0, hours: 0, minutes: 0 })
    setIsPermanentPreventTrigger(false)
    setPreventTriggerDialogOpen(true)
  }

  const handleResetPasswordClick = (user: User) => {
    setSelectedUser(user)
    setNewPassword('')
    setResetPasswordDialogOpen(true)
  }

  const handleEditClick = (user: User) => {
    setSelectedUser(user)
    setEditFormData({
      username: user.username,
      perm_level: user.perm_level,
      access_key: '',
    })
    setEditDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (selectedUser) {
      await onDeleteUser(selectedUser.id)
      setDeleteDialogOpen(false)
    }
  }

  const calculateEndTime = (duration: { days: number; hours: number; minutes: number }) => {
    const { days, hours, minutes } = duration
    if (days === 0 && hours === 0 && minutes === 0) {
      return null
    }
    const now = new Date()
    // 直接使用本地时间进行计算
    now.setDate(now.getDate() + days)
    now.setHours(now.getHours() + hours)
    now.setMinutes(now.getMinutes() + minutes)
    // 转换为 ISO 字符串并保留时区信息
    return now.toISOString()
  }

  const handleBanConfirm = async () => {
    if (selectedUser) {
      await onBanUser({
        id: selectedUser.id,
        banUntil: isPermanentBan ? '2099-12-31T23:59:59Z' : calculateEndTime(banDuration),
      })
      setBanDialogOpen(false)
    }
  }

  const handlePreventTriggerConfirm = async () => {
    if (selectedUser) {
      await onSetPreventTrigger({
        id: selectedUser.id,
        preventTriggerUntil: isPermanentPreventTrigger
          ? '2099-12-31T23:59:59Z'
          : calculateEndTime(preventTriggerDuration),
      })
      setPreventTriggerDialogOpen(false)
    }
  }

  const handleResetPasswordConfirm = async () => {
    if (selectedUser && newPassword) {
      await onResetPassword({
        id: selectedUser.id,
        password: newPassword,
      })
      setResetPasswordDialogOpen(false)
    }
  }

  const handleEditConfirm = async () => {
    if (selectedUser) {
      await onUpdateUser({
        id: selectedUser.id,
        data: editFormData,
      })
      setEditDialogOpen(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '无'
    try {
      // 在移动设备上使用更简洁的日期格式
      return format(new Date(dateString), isMobile ? 'MM-dd HH:mm' : 'yyyy-MM-dd HH:mm:ss')
    } catch {
      return '无效日期'
    }
  }

  const getRoleLabel = (permLevel: number) => {
    switch (permLevel) {
      case 0:
        return '访客'
      case 1:
        return '用户'
      case 2:
        return '管理员'
      case 3:
        return '超级管理员'
      default:
        return `未知(${permLevel})`
    }
  }

  const DurationSelector = ({
    duration,
    setDuration,
    isPermanent,
    setIsPermanent,
    title,
  }: {
    duration: { days: number; hours: number; minutes: number }
    setDuration: (duration: { days: number; hours: number; minutes: number }) => void
    isPermanent: boolean
    setIsPermanent: (isPermanent: boolean) => void
    title: string
  }) => {
    const theme = useTheme()

    const handleSliderChange =
      (field: 'days' | 'hours' | 'minutes') => (value: number | number[]) => {
        if (!isPermanent) {
          setDuration({
            ...duration,
            [field]: typeof value === 'number' ? value : value[0],
          })
        }
      }

    const handleWheelChange =
      (field: 'days' | 'hours' | 'minutes') => (e: ReactWheelEvent<HTMLDivElement>) => {
        if (!isPermanent) {
          e.preventDefault()
          const delta = e.deltaY > 0 ? -1 : 1
          const maxValues = { days: field === 'days' ? Infinity : 30, hours: 24, minutes: 60 }
          const newValue = Math.max(0, Math.min(duration[field] + delta, maxValues[field]))
          setDuration({
            ...duration,
            [field]: newValue,
          })
        }
      }

    const handleInputChange =
      (field: 'days' | 'hours' | 'minutes') => (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!isPermanent) {
          const value = parseInt(e.target.value) || 0
          const maxValues = { days: field === 'days' ? Infinity : 30, hours: 24, minutes: 60 }
          setDuration({
            ...duration,
            [field]: Math.max(0, Math.min(value, maxValues[field])),
          })
        }
      }

    const sliderStyle = {
      height: 200,
      marginBottom: 1,
      '& .rc-slider-rail': {
        backgroundColor: theme.palette.grey[200],
        width: '6px',
        marginLeft: '2px',
      },
      '& .rc-slider-track': {
        backgroundColor: theme.palette.primary.main,
        width: '6px',
        marginLeft: '-1px',
      },
      '& .rc-slider-handle': {
        borderColor: theme.palette.primary.main,
        backgroundColor: theme.palette.common.white,
        width: '20px',
        height: '20px',
        marginLeft: '-8px',
        opacity: 1,
        '&:hover': {
          borderColor: theme.palette.primary.dark,
        },
        '&:active': {
          boxShadow: `0 0 5px ${theme.palette.primary.main}`,
        },
      },
      '& .rc-slider-dot': {
        borderColor: theme.palette.primary.main,
        backgroundColor: theme.palette.common.white,
        width: '12px',
        height: '12px',
        marginLeft: '-4px',
        bottom: '-6px',
      },
      '& .rc-slider-dot-active': {
        borderColor: theme.palette.primary.main,
        backgroundColor: theme.palette.primary.main,
      },
      '& .rc-slider-mark-text': {
        color: theme.palette.text.secondary,
        marginLeft: '12px',
      },
      '& .rc-slider-mark-text-active': {
        color: theme.palette.primary.main,
      },
      '& .rc-slider-disabled': {
        '& .rc-slider-track': {
          backgroundColor: theme.palette.action.disabledBackground,
          width: '6px',
          marginLeft: '-3px',
        },
        '& .rc-slider-handle': {
          borderColor: theme.palette.action.disabled,
          backgroundColor: theme.palette.action.disabledBackground,
        },
        '& .rc-slider-dot': {
          borderColor: theme.palette.action.disabled,
          backgroundColor: theme.palette.action.disabledBackground,
        },
        '& .rc-slider-mark-text': {
          color: theme.palette.text.disabled,
        },
      },
    }

    const getDayMarks = (): Record<number, string> => ({
      0: '0',
      15: '15',
      30: '30',
    })

    const getHourMarks = (): Record<number, string> => ({
      0: '0',
      12: '12',
      24: '24',
    })

    const getMinuteMarks = (): Record<number, string> => ({
      0: '0',
      30: '30',
      60: '60',
    })

    return (
      <Box sx={{ pt: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography gutterBottom>{title}</Typography>
          <FormControlLabel
            control={
              <Switch
                checked={isPermanent}
                onChange={e => setIsPermanent(e.target.checked)}
                size="small"
              />
            }
            label={<Typography variant="body2">永久</Typography>}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 4, mb: 3 }}>
          {/* 天数滑块 */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Box component="div" sx={sliderStyle} onWheel={handleWheelChange('days')}>
              <RcSlider
                vertical
                value={duration.days}
                onChange={handleSliderChange('days')}
                min={0}
                max={30}
                marks={getDayMarks()}
                disabled={isPermanent}
              />
            </Box>
            <Typography variant="caption">天</Typography>
          </Box>

          {/* 小时滑块 */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Box component="div" sx={sliderStyle} onWheel={handleWheelChange('hours')}>
              <RcSlider
                vertical
                value={duration.hours}
                onChange={handleSliderChange('hours')}
                min={0}
                max={24}
                marks={getHourMarks()}
                disabled={isPermanent}
              />
            </Box>
            <Typography variant="caption">时</Typography>
          </Box>

          {/* 分钟滑块 */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Box component="div" sx={sliderStyle} onWheel={handleWheelChange('minutes')}>
              <RcSlider
                vertical
                value={duration.minutes}
                onChange={handleSliderChange('minutes')}
                min={0}
                max={60}
                marks={getMinuteMarks()}
                disabled={isPermanent}
              />
            </Box>
            <Typography variant="caption">分</Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            label="天"
            type="number"
            size="small"
            value={duration.days}
            onChange={handleInputChange('days')}
            disabled={isPermanent}
            InputProps={{
              inputProps: { min: 0 },
            }}
          />
          <TextField
            label="时"
            type="number"
            size="small"
            value={duration.hours}
            onChange={handleInputChange('hours')}
            disabled={isPermanent}
            InputProps={{
              inputProps: { min: 0, max: 24 },
            }}
          />
          <TextField
            label="分"
            type="number"
            size="small"
            value={duration.minutes}
            onChange={handleInputChange('minutes')}
            disabled={isPermanent}
            InputProps={{
              inputProps: { min: 0, max: 60 },
            }}
          />
        </Box>
      </Box>
    )
  }

  return (
    <>
      <Table
        stickyHeader
        size={isSmall ? 'small' : 'medium'}
        sx={UNIFIED_TABLE_STYLES.getTableBase(isMobile, isSmall)}
        {...tableProps}
      >
        <TableHead>
          <TableRow>
            <TableCell
              sx={{
                width: '32px',
                minWidth: '32px',
                py: isSmall ? 1 : 1,
                ...(UNIFIED_TABLE_STYLES.header as SxProps<Theme>),
              }}
            >
              <TableSortLabel
                active={sorting.field === 'id'}
                direction={sorting.field === 'id' ? sorting.order : 'asc'}
                onClick={() => handleRequestSort('id')}
              >
                ID
                {sorting.field === 'id' ? (
                  <Box component="span" sx={srOnlyStyle}>
                    {sorting.order === 'desc' ? '降序排列' : '升序排列'}
                  </Box>
                ) : null}
              </TableSortLabel>
            </TableCell>
            <TableCell
              sx={{
                width: '15%',
                py: isSmall ? 1 : 1.5,
                ...(UNIFIED_TABLE_STYLES.header as SxProps<Theme>),
              }}
            >
              <TableSortLabel
                active={sorting.field === 'username'}
                direction={sorting.field === 'username' ? sorting.order : 'asc'}
                onClick={() => handleRequestSort('username')}
              >
                用户名
                {sorting.field === 'username' ? (
                  <Box component="span" sx={srOnlyStyle}>
                    {sorting.order === 'desc' ? '降序排列' : '升序排列'}
                  </Box>
                ) : null}
              </TableSortLabel>
            </TableCell>
            <TableCell
              sx={{
                width: '10%',
                py: isSmall ? 1 : 1.5,
                ...(UNIFIED_TABLE_STYLES.header as SxProps<Theme>),
              }}
            >
              适配平台
            </TableCell>
            <TableCell
              sx={{
                width: '12%',
                py: isSmall ? 1 : 1.5,
                ...(UNIFIED_TABLE_STYLES.header as SxProps<Theme>),
              }}
            >
              平台用户ID
            </TableCell>
            <TableCell
              sx={{
                width: '10%',
                py: isSmall ? 1 : 1.5,
                ...(UNIFIED_TABLE_STYLES.header as SxProps<Theme>),
              }}
            >
              权限
            </TableCell>
            <TableCell
              sx={{
                width: '10%',
                py: isSmall ? 1 : 1.5,
                ...(UNIFIED_TABLE_STYLES.header as SxProps<Theme>),
              }}
            >
              状态
            </TableCell>
            {!isMobile && (
              <TableCell
                sx={{
                  width: '13%',
                  py: isSmall ? 1 : 1.5,
                  ...(UNIFIED_TABLE_STYLES.header as SxProps<Theme>),
                }}
              >
                <TableSortLabel
                  active={sorting.field === 'create_time'}
                  direction={sorting.field === 'create_time' ? sorting.order : 'asc'}
                  onClick={() => handleRequestSort('create_time')}
                >
                  创建时间
                  {sorting.field === 'create_time' ? (
                    <Box component="span" sx={srOnlyStyle}>
                      {sorting.order === 'desc' ? '降序排列' : '升序排列'}
                    </Box>
                  ) : null}
                </TableSortLabel>
              </TableCell>
            )}
            <TableCell
              align="center"
              sx={{
                width: '18%',
                py: isSmall ? 1 : 1.5,
                ...(UNIFIED_TABLE_STYLES.header as SxProps<Theme>),
              }}
            >
              操作
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={isMobile ? 7 : 8} align="center" sx={{ py: 4 }}>
                <CircularProgress size={24} />
              </TableCell>
            </TableRow>
          ) : users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={isMobile ? 7 : 8} align="center" sx={{ py: 4 }}>
                暂无数据
              </TableCell>
            </TableRow>
          ) : (
            users.map(user => {
              const status = getUserStatus(user)
              return (
                <TableRow key={user.id} hover sx={UNIFIED_TABLE_STYLES.row as SxProps<Theme>}>
                  <TableCell sx={UNIFIED_TABLE_STYLES.cell as SxProps<Theme>}>{user.id}</TableCell>
                  <TableCell sx={UNIFIED_TABLE_STYLES.cell as SxProps<Theme>}>
                    {user.username}
                  </TableCell>
                  <TableCell sx={UNIFIED_TABLE_STYLES.cell as SxProps<Theme>}>
                    <Typography variant="body2" color="text.primary">
                      {user.adapter_key || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={UNIFIED_TABLE_STYLES.cell as SxProps<Theme>}>
                    <Typography variant="body2" color="text.primary">
                      {user.platform_userid || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={UNIFIED_TABLE_STYLES.cell as SxProps<Theme>}>
                    <Chip
                      label={getRoleLabel(user.perm_level)}
                      size="small"
                      sx={CHIP_VARIANTS.getRoleChip(user.perm_level, isSmall)}
                    />
                  </TableCell>
                  <TableCell sx={UNIFIED_TABLE_STYLES.cell as SxProps<Theme>}>
                    <Chip
                      label={status}
                      size="small"
                      sx={CHIP_VARIANTS.getUserStatusChip(status, isSmall)}
                    />
                  </TableCell>
                  {!isMobile && (
                    <TableCell sx={UNIFIED_TABLE_STYLES.cell as SxProps<Theme>}>
                      {formatDate(user.create_time)}
                    </TableCell>
                  )}
                  <TableCell align="center" sx={UNIFIED_TABLE_STYLES.cell as SxProps<Theme>}>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      <Tooltip title="查看详情">
                        <IconButton
                          size={isSmall ? 'small' : 'medium'}
                          onClick={() => onViewDetail(user.id)}
                        >
                          <VisibilityIcon fontSize={isSmall ? 'small' : 'medium'} />
                        </IconButton>
                      </Tooltip>
                      {showEditButton && !isSmall && (
                        <Tooltip title="编辑用户">
                          <IconButton
                            size={isSmall ? 'small' : 'medium'}
                            onClick={() => handleEditClick(user)}
                          >
                            <EditIcon fontSize={isSmall ? 'small' : 'medium'} />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title={user.is_active ? '封禁用户' : '解除封禁'}>
                        <IconButton
                          size={isSmall ? 'small' : 'medium'}
                          onClick={() => handleBanClick(user)}
                        >
                          <BlockIcon fontSize={isSmall ? 'small' : 'medium'} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={!user.is_prevent_trigger ? '禁止触发' : '恢复触发'}>
                        <IconButton
                          size={isSmall ? 'small' : 'medium'}
                          onClick={() => handlePreventTriggerClick(user)}
                        >
                          <LockIcon fontSize={isSmall ? 'small' : 'medium'} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="重置密码">
                        <IconButton
                          size={isSmall ? 'small' : 'medium'}
                          onClick={() => handleResetPasswordClick(user)}
                        >
                          <KeyIcon fontSize={isSmall ? 'small' : 'medium'} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="删除用户">
                        <IconButton
                          size={isSmall ? 'small' : 'medium'}
                          onClick={() => handleDeleteClick(user)}
                        >
                          <DeleteIcon fontSize={isSmall ? 'small' : 'medium'} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>

      {/* 删除确认对话框 */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <Typography variant={isSmall ? 'body2' : 'body1'}>
            确定要删除用户 "{selectedUser?.username}" 吗？此操作不可撤销。
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: isSmall ? 2 : 3, pb: isSmall ? 2 : 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} size={isSmall ? 'small' : 'medium'}>
            取消
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" size={isSmall ? 'small' : 'medium'}>
            删除
          </Button>
        </DialogActions>
      </Dialog>

      {/* 封禁/解封对话框 */}
      <Dialog open={banDialogOpen} onClose={() => setBanDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{selectedUser?.is_active ? '封禁用户' : '解除封禁'}</DialogTitle>
        <DialogContent sx={{ px: isSmall ? 2 : 3, pt: isSmall ? 1 : 2 }}>
          {selectedUser?.is_active ? (
            <DurationSelector
              duration={banDuration}
              setDuration={setBanDuration}
              isPermanent={isPermanentBan}
              setIsPermanent={setIsPermanentBan}
              title="请设置封禁时长："
            />
          ) : (
            <Typography sx={{ pt: isSmall ? 0.5 : 1 }} variant={isSmall ? 'body2' : 'body1'}>
              确定要解除对用户 "{selectedUser?.username}" 的封禁吗？
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: isSmall ? 2 : 3, pb: isSmall ? 2 : 2 }}>
          <Button onClick={() => setBanDialogOpen(false)} size={isSmall ? 'small' : 'medium'}>
            取消
          </Button>
          <Button onClick={handleBanConfirm} color="primary" size={isSmall ? 'small' : 'medium'}>
            确定
          </Button>
        </DialogActions>
      </Dialog>

      {/* 触发权限对话框 */}
      <Dialog open={preventTriggerDialogOpen} onClose={() => setPreventTriggerDialogOpen(false)}>
        <DialogTitle>{!selectedUser?.is_prevent_trigger ? '禁止触发' : '恢复触发权限'}</DialogTitle>
        <DialogContent>
          {!selectedUser?.is_prevent_trigger ? (
            <DurationSelector
              duration={preventTriggerDuration}
              setDuration={setPreventTriggerDuration}
              isPermanent={isPermanentPreventTrigger}
              setIsPermanent={setIsPermanentPreventTrigger}
              title="请设置禁止触发时长："
            />
          ) : (
            <Typography sx={{ pt: 1 }}>
              确定要恢复用户 "{selectedUser?.username}" 的触发权限吗？
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreventTriggerDialogOpen(false)}>取消</Button>
          <Button onClick={handlePreventTriggerConfirm} color="primary">
            确定
          </Button>
        </DialogActions>
      </Dialog>

      {/* 重置密码对话框 */}
      <Dialog open={resetPasswordDialogOpen} onClose={() => setResetPasswordDialogOpen(false)}>
        <DialogTitle>重置密码</DialogTitle>
        <DialogContent>
          <p>为用户 "{selectedUser?.username}" 设置新密码：</p>
          <TextField
            type="password"
            fullWidth
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            margin="normal"
            label="新密码"
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetPasswordDialogOpen(false)}>取消</Button>
          <Button onClick={handleResetPasswordConfirm} color="primary" disabled={!newPassword}>
            确定
          </Button>
        </DialogActions>
      </Dialog>

      {/* 编辑用户对话框 */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>编辑用户</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="用户名"
            value={editFormData.username}
            onChange={e => setEditFormData({ ...editFormData, username: e.target.value })}
            margin="normal"
            required
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>权限等级</InputLabel>
            <Select
              value={editFormData.perm_level}
              onChange={e =>
                setEditFormData({ ...editFormData, perm_level: Number(e.target.value) })
              }
              label="权限等级"
            >
              <MenuItem value={0}>访客</MenuItem>
              <MenuItem value={1}>用户</MenuItem>
              <MenuItem value={2}>管理员</MenuItem>
              <MenuItem value={3}>超级管理员</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="访问密钥"
            type="password"
            value={editFormData.access_key}
            onChange={e => setEditFormData({ ...editFormData, access_key: e.target.value })}
            margin="normal"
            required
            helperText="请输入超级访问密钥以确认修改"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>取消</Button>
          <Button
            onClick={handleEditConfirm}
            color="primary"
            disabled={!editFormData.username || !editFormData.access_key}
          >
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default UserTable

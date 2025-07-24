import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  MenuItem,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Autocomplete,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material'; // Removed MoreVertIcon
import axios from 'axios';
import { ExportButton } from './ExportButton';
import { format } from 'date-fns';
import { logger } from '../utils/logger';
interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata: {
    product_id?: string;
    order_id?: string;
    customer_id?: string;
    changes?: string[];
    [key: string]: unknown;
  };
  created_at: string;
}

interface ActivityLogsProps {
  userId?: string;
  entityType?: string;
  entityId?: string;
  page?: number;
  rowsPerPage?: number;
}

type ExportData = {
  [key: string]: string;
  'Log ID': string;
  'User': string;
  'Action': string;
  'Entity Type': string;
  'Entity ID': string;
  'Metadata': string;
  'Date': string;
};

const ActivityLogs: React.FC<ActivityLogsProps> = ({ userId: _userId, entityType, entityId, page: initialPage = 0, rowsPerPage: initialRowsPerPage = 10 }) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(initialPage);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);
  const [totalLogs, setTotalLogs] = useState(0);
  const [users, setUsers] = useState<User[]>([]);
  const [filters, setFilters] = useState({
    action: '',
    startDate: '',
    endDate: '',
    userId: '',
    targetUserId: '',
  });

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users');
      setUsers(response.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        per_page: rowsPerPage.toString(),
        ...(filters.action && { action: filters.action }),
        ...(filters.startDate && { start_date: filters.startDate }),
        ...(filters.endDate && { end_date: filters.endDate }),
        ...(filters.userId && { user_id: filters.userId }),
        ...(filters.targetUserId && { target_user_id: filters.targetUserId }),
        ...(entityType && { entity_type: entityType }),
        ...(entityId && { entity_id: entityId })
      });

      const response = await axios.get(`/api/activity-logs?${params}`);
      setLogs(response.data.logs);
      setTotalLogs(response.data.total);
      setError(null);
    } catch (err) {
      setError('Failed to fetch activity logs');
      console.error('Error fetching activity logs:', err);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, filters, entityType, entityId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handlePageChange = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
    setPage(0);
  };

  const handleUserFilterChange = (field: string) => (event: React.SyntheticEvent | null, value: User | null) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value?.id.toString() || '',
    }));
    setPage(0);
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'login':
        return 'success';
      case 'create_user':
        return 'primary';
      case 'update_user':
        return 'info';
      case 'delete_user':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatMetadata = (action: string, metadata: ActivityLog['metadata']): string => {
    try {
      switch (action) {
        case 'create_order':
          return `Order #${metadata.order_id || 'N/A'}`;

        case 'update_order':
          return `Order #${metadata.order_id || 'N/A'}: ${metadata.changes?.join(', ') || 'Updated'}`;

        case 'create_product':
          return `Product #${metadata.product_id || 'N/A'}`;

        case 'update_product':
          return `Product #${metadata.product_id || 'N/A'}: ${metadata.changes?.join(', ') || 'Updated'}`;

        default:
          // For unknown actions, format as key-value pairs
          return Object.entries(metadata)
            .filter(([key]) => key !== 'changes') // Exclude changes array from key-value display
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
      }
    } catch (error) {
      logger.error('Error formatting metadata', { error, action, metadata }, 'ActivityLogs');
      return 'Error formatting metadata';
    }
  };

  const getMetadataTooltip = (action: string, metadata: ActivityLog['metadata']): string => {
    const formattedMetadata = formatMetadata(action, metadata);
    const rawMetadata = JSON.stringify(metadata, null, 2);
    
    return `${formattedMetadata}\n\nRaw Data:\n${rawMetadata}`;
  };

  const prepareExportData = (): ExportData[] => {
    return logs.map(log => ({
      'Log ID': log.id,
      'User': log.user_id,
      'Action': log.action,
      'Entity Type': log.entity_type,
      'Entity ID': log.entity_id,
      'Metadata': formatMetadata(log.action, log.metadata),
      'Date': format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss')
    }));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', flex: 1 }}>
          <TextField
            select
            label="Action"
            value={filters.action}
            onChange={handleFilterChange('action')}
            size="small"
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">All Actions</MenuItem>
            <MenuItem value="login">Login</MenuItem>
            <MenuItem value="create_user">Create User</MenuItem>
            <MenuItem value="update_user">Update User</MenuItem>
            <MenuItem value="delete_user">Delete User</MenuItem>
            <MenuItem value="flag_spaza">Flag Spaza</MenuItem>
            <MenuItem value="update_order">Update Order</MenuItem>
            <MenuItem value="update_product">Update Product</MenuItem>
          </TextField>

          <TextField
            label="Start Date"
            type="date"
            value={filters.startDate}
            onChange={handleFilterChange('startDate')}
            size="small"
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="End Date"
            type="date"
            value={filters.endDate}
            onChange={handleFilterChange('endDate')}
            size="small"
            InputLabelProps={{ shrink: true }}
          />

          <Autocomplete
            options={users}
            getOptionLabel={(option) => `${option.name} (${option.email})`}
            value={users.find(u => u.id.toString() === filters.userId) || null}
            onChange={(_, value) => handleUserFilterChange('userId')(null, value)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="User"
                size="small"
                sx={{ minWidth: 200 }}
              />
            )}
          />

          <Autocomplete
            options={users}
            getOptionLabel={(option) => `${option.name} (${option.email})`}
            value={users.find(u => u.id.toString() === filters.targetUserId) || null}
            onChange={(_, value) => handleUserFilterChange('targetUserId')(null, value)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Target User"
                size="small"
                sx={{ minWidth: 200 }}
              />
            )}
          />
        </Box>

        <ExportButton<ExportData>
          data={prepareExportData()}
          fileName="activity_logs"
          label="Export Logs"
        />
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Entity</TableCell>
              <TableCell>Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>{format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss')}</TableCell>
                <TableCell>{log.user_id}</TableCell>
                <TableCell>
                  <Chip
                    label={log.action}
                    color={getActionColor(log.action)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{`${log.entity_type} #${log.entity_id}`}</TableCell>
                <TableCell>
                  <Tooltip 
                    title={getMetadataTooltip(log.action, log.metadata)}
                    placement="left"
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" noWrap>
                        {formatMetadata(log.action, log.metadata)}
                      </Typography>
                      <IconButton size="small">
                        <InfoIcon />
                      </IconButton>
                    </Box>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={totalLogs}
        page={page}
        onPageChange={handlePageChange}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleRowsPerPageChange}
      />
    </Box>
  );
};

export default ActivityLogs;
import React, { useState } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  Typography,
  Box,
  Divider,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  ShoppingCart as OrderIcon,
  Warning as StockIcon,
  Info as SystemIcon,
  Check as ReadIcon,
  Delete as ClearIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
} from '@mui/icons-material';
import { useNotifications } from '../contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

type NotificationType = 'order' | 'stock' | 'system';

const NotificationMenu: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    isMuted,
    toggleMute,
  } = useNotifications();

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const getNotificationIcon = (type: NotificationType): JSX.Element => {
    switch (type) {
      case 'order':
        return <OrderIcon color="primary" />;
      case 'stock':
        return <StockIcon color="warning" />;
      case 'system':
        return <SystemIcon color="info" />;
      default:
        return <SystemIcon />;
    }
  };

  return (
    <>
      <Tooltip title={isMuted ? "Unmute notifications" : "Mute notifications"}>
        <IconButton
          color="inherit"
          onClick={handleClick}
          sx={{ ml: 1 }}
        >
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 360,
            maxHeight: 480,
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Notifications</Typography>
          <Box>
            <Tooltip title={isMuted ? "Unmute" : "Mute"}>
              <IconButton
                size="small"
                onClick={toggleMute}
                sx={{ mr: 1 }}
              >
                {isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
              </IconButton>
            </Tooltip>
            <Button
              size="small"
              startIcon={<ReadIcon />}
              onClick={markAllAsRead}
              disabled={notifications.length === 0}
            >
              Mark all read
            </Button>
            <Button
              size="small"
              startIcon={<ClearIcon />}
              onClick={clearNotifications}
              disabled={notifications.length === 0}
              sx={{ ml: 1 }}
            >
              Clear all
            </Button>
          </Box>
        </Box>
        <Divider />
        <List sx={{ p: 0 }}>
          {notifications.length === 0 ? (
            <ListItem>
              <ListItemText
                primary="No notifications"
                sx={{ textAlign: 'center', color: 'text.secondary' }}
              />
            </ListItem>
          ) : (
            notifications.map((notification) => (
              <ListItem
                key={notification.id}
                sx={{
                  bgcolor: notification.read ? 'inherit' : 'action.hover',
                  '&:hover': {
                    bgcolor: 'action.selected',
                  },
                }}
              >
                <ListItemIcon>
                  {getNotificationIcon(notification.type)}
                </ListItemIcon>
                <ListItemText
                  primary={notification.title}
                  secondary={
                    <>
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.primary"
                      >
                        {notification.message}
                      </Typography>
                      <br />
                      <Typography
                        component="span"
                        variant="caption"
                        color="text.secondary"
                      >
                        {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                      </Typography>
                    </>
                  }
                />
                {!notification.read && (
                  <Tooltip title="Mark as read">
                    <IconButton
                      size="small"
                      onClick={() => markAsRead(notification.id)}
                    >
                      <ReadIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </ListItem>
            ))
          )}
        </List>
      </Menu>
    </>
  );
};

export default NotificationMenu; 
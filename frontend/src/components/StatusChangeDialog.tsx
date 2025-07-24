import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from '@mui/material';
import { OrderStatus } from '../types/order';

interface StatusChangeDialogProps {
  open: boolean;
  status: OrderStatus | null;
  notes: string;
  onNotesChange: (notes: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

const StatusChangeDialog: React.FC<StatusChangeDialogProps> = ({
  open,
  status,
  notes,
  onNotesChange,
  onClose,
  onConfirm,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        Change Order Status to {status?.toUpperCase()}
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Notes (Optional)"
          fullWidth
          multiline
          rows={4}
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Add any relevant notes about this status change..."
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onConfirm} variant="contained" color="primary">
          Update Status
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StatusChangeDialog; 
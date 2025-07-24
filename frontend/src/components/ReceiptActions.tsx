import React, { useState } from 'react';
import {
  Box,
  Button,
  Tooltip,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Print as PrintIcon,
  Share as ShareIcon,
} from '@mui/icons-material';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { Order } from '../types/order';
import OrderReceipt from './OrderReceipt';

interface ReceiptActionsProps {
  order: Order;
  onShare?: () => void;
}

interface PDFDownloadLinkRenderProps {
  blob: Blob | null;
  url: string | null;
  loading: boolean;
  error: Error | null;
}

const ReceiptActions: React.FC<ReceiptActionsProps> = ({ 
  order,
  onShare 
}) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePrint = async () => {
    try {
      setIsPrinting(true);
      // Add a small delay to ensure the print dialog appears after the loading state
      await new Promise(resolve => setTimeout(resolve, 100));
      window.print();
    } catch (err) {
      setError('Failed to print receipt. Please try again.');
    } finally {
      setIsPrinting(false);
    }
  };

  const handleError = (message: string) => {
    setError(message);
  };

  const handleCloseError = () => {
    setError(null);
  };

  return (
    <>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <PDFDownloadLink
          document={<OrderReceipt order={order} />}
          fileName={`order-${order.order_number}.pdf`}
          style={{ textDecoration: 'none' }}
        >
          {({ loading, error: pdfError }: PDFDownloadLinkRenderProps) => {
            if (pdfError) {
              handleError('Failed to generate PDF. Please try again.');
            }
            return (
              <Tooltip title="Download as PDF">
                <Button
                  variant="outlined"
                  startIcon={loading ? <CircularProgress size={20} /> : <ReceiptIcon />}
                  disabled={loading || isPrinting}
                >
                  {loading ? 'Generating...' : 'Download PDF'}
                </Button>
              </Tooltip>
            );
          }}
        </PDFDownloadLink>

        <Tooltip title="Print Receipt">
          <Button
            variant="outlined"
            startIcon={isPrinting ? <CircularProgress size={20} /> : <PrintIcon />}
            onClick={handlePrint}
            disabled={isPrinting}
          >
            {isPrinting ? 'Printing...' : 'Print'}
          </Button>
        </Tooltip>

        {onShare && (
          <Tooltip title="Share Receipt">
            <Button
              variant="outlined"
              startIcon={<ShareIcon />}
              onClick={onShare}
              disabled={isPrinting}
            >
              Share
            </Button>
          </Tooltip>
        )}
      </Box>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseError} 
          severity="error" 
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>

      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            .receipt-content,
            .receipt-content * {
              visibility: visible;
            }
            .receipt-content {
              position: absolute;
              left: 0;
              top: 0;
            }
          }
        `}
      </style>
    </>
  );
};

export default ReceiptActions; 
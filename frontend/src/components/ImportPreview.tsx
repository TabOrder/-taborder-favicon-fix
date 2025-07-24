import React, { useState } from 'react';
import Papa, { ParseResult, ParseError } from 'papaparse';
import {
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Paper,
  TableContainer,
} from '@mui/material';
import { CloudUpload as UploadIcon } from '@mui/icons-material';

interface ImportData {
  [key: string]: string | number | boolean | null;
}

type ImportPreviewProps = {
  onSubmit: (data: ImportData[]) => Promise<void>;
  onCancel?: () => void;
  title?: string;
  maxPreviewRows?: number;
  acceptedFileTypes?: string;
};

export const ImportPreview: React.FC<ImportPreviewProps> = ({
  onSubmit,
  onCancel,
  title = "Import CSV",
  maxPreviewRows = 10,
  acceptedFileTypes = ".csv",
}) => {
  const [previewData, setPreviewData] = useState<ImportData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);
    setIsLoading(true);

    Papa.parse<ImportData>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: ParseResult<ImportData>) => {
        if (results.errors.length > 0) {
          const firstError = results.errors[0] as ParseError;
          setError(firstError.message);
          setPreviewData([]);
        } else {
          setPreviewData(results.data);
        }
        setIsLoading(false);
      },
      error: (error: Error) => {
        setError(error.message);
        setPreviewData([]);
        setIsLoading(false);
      },
    });
  };

  const handleSubmit = async () => {
    if (previewData.length === 0) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await onSubmit(previewData);
      setPreviewData([]);
      setFileName(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import data');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>

      <Box sx={{ mb: 3 }}>
        <input
          accept={acceptedFileTypes}
          style={{ display: 'none' }}
          id="csv-file-input"
          type="file"
          onChange={handleFile}
        />
        <label htmlFor="csv-file-input">
          <Button
            variant="outlined"
            component="span"
            startIcon={<UploadIcon />}
            disabled={isLoading}
          >
            Choose CSV File
          </Button>
        </label>
        {fileName && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            Selected file: {fileName}
          </Typography>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
          <CircularProgress />
        </Box>
      )}

      {previewData.length > 0 && (
        <>
          <Typography variant="subtitle1" gutterBottom>
            Preview ({previewData.length} rows total)
          </Typography>
          <TableContainer sx={{ maxHeight: 400, mb: 2 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  {Object.keys(previewData[0]).map((key) => (
                    <TableCell key={key}>{key}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {previewData.slice(0, maxPreviewRows).map((row, rowIndex) => (
                  <TableRow key={`row-${rowIndex}`}>
                    {Object.entries(row).map(([key, value]) => (
                      <TableCell key={`${rowIndex}-${key}`}>
                        {value === null ? '' : String(value)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              Confirm & Upload
            </Button>
            {onCancel && (
              <Button
                variant="outlined"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
            )}
          </Box>
        </>
      )}
    </Paper>
  );
}; 
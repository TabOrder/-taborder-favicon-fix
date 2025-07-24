import { Button, Menu, MenuItem } from '@mui/material';
import { utils, writeFile } from 'xlsx';
import React, { useState } from 'react';
import { FileDownload as FileDownloadIcon } from '@mui/icons-material';

type ExportableData = {
  [key: string]: string | number | boolean | null;
};

type ExportButtonProps<T extends ExportableData> = {
  data: T[];
  fileName: string;
  label?: string;
  variant?: 'text' | 'outlined' | 'contained';
  startIcon?: React.ReactNode;
};

export const ExportButton = <T extends ExportableData>({
  data,
  fileName,
  label = "Export",
  variant = "outlined",
  startIcon = <FileDownloadIcon />,
}: ExportButtonProps<T>) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const exportToExcel = () => {
    const ws = utils.json_to_sheet(data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Sheet1');
    writeFile(wb, `${fileName}.xlsx`);
    handleClose();
  };

  const exportToCSV = () => {
    const csv = utils.sheet_to_csv(utils.json_to_sheet(data));
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${fileName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    handleClose();
  };

  return (
    <>
      <Button
        variant={variant}
        onClick={handleClick}
        startIcon={startIcon}
      >
        {label}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      >
        <MenuItem onClick={exportToCSV}>Export as CSV</MenuItem>
        <MenuItem onClick={exportToExcel}>Export as Excel</MenuItem>
      </Menu>
    </>
  );
}; 
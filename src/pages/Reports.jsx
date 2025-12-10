import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { format, startOfDay, endOfDay, parseISO } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  DocumentArrowDownIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BanknotesIcon,
  EyeIcon,
  PrinterIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  PlusCircleIcon,
  UserPlusIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';

const Reports = () => {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [transactions, setTransactions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  useEffect(() => {
    fetchDailyData();
    fetchWalletBalance();
  }, [selectedDate]);

  const fetchWalletBalance = async () => {
    try {
      const { data, error } = await supabase
        .from('wallet_balance')
        .select('balance')
        .eq('id', '00000000-0000-0000-0000-000000000000')
        .single();

      if (!error && data) {
        setWalletBalance(data.balance || 0);
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    }
  };

  const fetchDailyData = async () => {
    setLoading(true);
    try {
      const date = new Date(selectedDate);
      
      // Fetch transactions for selected date
      const { data: transactionsData } = await supabase
        .from('transactions')
        .select(`
          *,
          customers(name)
        `)
        .gte('created_at', startOfDay(date).toISOString())
        .lte('created_at', endOfDay(date).toISOString())
        .order('created_at', { ascending: true });

      // Fetch all customers
      const { data: customersData } = await supabase
        .from('customers')
        .select('*')
        .order('name', { ascending: true });

      setTransactions(transactionsData || []);
      setCustomers(customersData || []);
    } catch (error) {
      console.error('Error fetching daily data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDailyStats = () => {
    if (!transactions.length) {
      return {
        totalTopup: 0,
        totalCustomerDeposits: 0,
        totalWithdrawals: 0,
        transactionCount: 0,
        customerCount: customers.length,
        openingBalance: walletBalance,
        closingBalance: walletBalance,
        totalDeposits: customers.reduce((sum, customer) => sum + (customer.amount || 0), 0),
      };
    }

    const topupTransactions = transactions.filter(t => t.type === 'topup');
    const depositTransactions = transactions.filter(t => t.type === 'customer_deposit');
    const withdrawalTransactions = transactions.filter(t => t.type === 'withdrawal');
    
    const totalTopup = topupTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalCustomerDeposits = depositTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalWithdrawals = withdrawalTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    // Calculate opening balance (balance at start of day)
    const openingBalance = walletBalance + totalCustomerDeposits + totalWithdrawals - totalTopup;
    const closingBalance = walletBalance;

    return {
      totalTopup,
      totalCustomerDeposits,
      totalWithdrawals,
      transactionCount: transactions.length,
      customerCount: customers.length,
      openingBalance,
      closingBalance,
      totalDeposits: customers.reduce((sum, customer) => sum + (customer.amount || 0), 0),
    };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getTransactionTypeLabel = (type) => {
    switch (type) {
      case 'topup':
        return 'Wallet Top-up';
      case 'customer_deposit':
        return 'Customer Deposit';
      case 'withdrawal':
        return 'Withdrawal';
      default:
        return type;
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'topup':
        return { bg: 'bg-green-100', text: 'text-green-800', amount: 'text-green-600' };
      case 'customer_deposit':
        return { bg: 'bg-blue-100', text: 'text-blue-800', amount: 'text-blue-600' };
      case 'withdrawal':
        return { bg: 'bg-red-100', text: 'text-red-800', amount: 'text-red-600' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-800', amount: 'text-gray-600' };
    }
  };

const generateDailyStatementPDF = () => {
  setGeneratingPDF(true);
  
  try {
    const stats = calculateDailyStats();
    const formattedDate = format(new Date(selectedDate), 'dd MMMM, yyyy');
    const formattedTime = format(new Date(), 'hh:mm a');
    
    // Create PDF document
    const doc = new jsPDF('portrait', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 10; // Smaller margin for more space
    const contentWidth = pageWidth - (margin * 2);
    let yPos = margin;
    
    // Add header with logo/company name
    doc.setFontSize(20);
    doc.setTextColor(30, 64, 175);
    doc.text('MUKHTAR BAJI METAL TRADING', pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;
    
    doc.setFontSize(12);
    doc.setTextColor(59, 130, 246);
    doc.text('DAILY FINANCIAL STATEMENT', pageWidth / 2, yPos, { align: 'center' });
    yPos += 6;
    
    // Company info and date
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    
    // Left column: Company info
    doc.text('Kofar Ruwa Warehouse, Kano, Nigeria', margin, yPos);
    doc.text('Phone: +234 803 602 0619', margin, yPos + 4);
    
    // Right column: Date info
    doc.text(`Statement Date: ${formattedDate}`, pageWidth - margin, yPos, { align: 'right' });
    doc.text(`Generated: ${formattedTime}`, pageWidth - margin, yPos + 4, { align: 'right' });
    
    yPos += 10;
    
    // Separator line
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;
    
    // EXECUTIVE SUMMARY Section - Compact layout
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'bold');
    doc.text('EXECUTIVE SUMMARY', margin, yPos);
    yPos += 6;
    
    // Executive Summary Table - Compact
    const execSummaryData = [
      ['Total Customers', stats.customerCount],
      ['Total Customer Deposits', formatCurrency(stats.totalCustomerDeposits)],
      ['Daily Transactions', stats.transactionCount],
      ['Current Wallet Balance', formatCurrency(walletBalance)],
    ];
    
    autoTable(doc, {
      startY: yPos,
      head: [['Key Performance Indicators', 'Details']],
      body: execSummaryData,
      theme: 'grid',
      headStyles: { 
        fillColor: [59, 130, 246],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
        cellPadding: 2
      },
      bodyStyles: { 
        fontSize: 9,
        cellPadding: 2
      },
      columnStyles: {
        0: { 
          fontStyle: 'bold', 
          cellWidth: contentWidth * 0.6,
          halign: 'left'
        },
        1: { 
          cellWidth: contentWidth * 0.4,
          halign: 'center', // Centered amount
          cellPadding: { top: 2, bottom: 2 }
        }
      },
      styles: { 
        lineWidth: 0.1,
        lineColor: [200, 200, 200],
        cellPadding: 1
      },
      margin: { left: margin, right: margin },
      tableWidth: contentWidth
    });
    
    yPos = doc.lastAutoTable.finalY + 6;
    
    // DAILY FINANCIAL SUMMARY Section
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('DAILY FINANCIAL SUMMARY', margin, yPos);
    yPos += 6;
    
    const dailyFinancialData = [
      ['Opening Balance', formatCurrency(stats.openingBalance)],
      ['Wallet Top-ups', formatCurrency(stats.totalTopup)],
      ['Customer Deposits', formatCurrency(stats.totalCustomerDeposits)],
      ['Withdrawals', formatCurrency(stats.totalWithdrawals)],
      ['Net Movement', formatCurrency(stats.totalTopup - stats.totalCustomerDeposits - stats.totalWithdrawals)],
    ];
    
    autoTable(doc, {
      startY: yPos,
      head: [['Description', 'Amount (NGN)']],
      body: dailyFinancialData,
      theme: 'grid',
      headStyles: { 
        fillColor: [59, 130, 246],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
        cellPadding: 2
      },
      bodyStyles: { fontSize: 9, cellPadding: 2 },
      columnStyles: {
        0: { 
          cellWidth: contentWidth * 0.6,
          halign: 'left'
        },
        1: { 
          cellWidth: contentWidth * 0.4,
          halign: 'center', // Centered amount
          cellPadding: { top: 2, bottom: 2 }
        }
      },
      styles: { 
        lineWidth: 0.1,
        lineColor: [200, 200, 200],
        cellPadding: 1
      },
      margin: { left: margin, right: margin },
      tableWidth: contentWidth,
      didDrawCell: (data) => {
        // Highlight opening balance
        if (data.section === 'body' && data.row.index === 0) {
          doc.setFillColor(240, 249, 255);
          doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
        }
        // Highlight net movement
        if (data.section === 'body' && data.row.index === 4) {
          doc.setFillColor(240, 255, 244);
          doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
        }
      }
    });
    
    yPos = doc.lastAutoTable.finalY + 6;
    
    // CLOSING BALANCE Section
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('CLOSING BALANCE', margin, yPos);
    yPos += 6;
    
    autoTable(doc, {
      startY: yPos,
      head: [['Final Balance', 'Amount (NGN)']],
      body: [
        ['Closing Wallet Balance', formatCurrency(stats.closingBalance)]
      ],
      theme: 'grid',
      headStyles: { 
        fillColor: [34, 197, 94],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
        cellPadding: 2
      },
      bodyStyles: { 
        fillColor: [240, 253, 244],
        textColor: [21, 128, 61],
        fontStyle: 'bold',
        fontSize: 10,
        cellPadding: 3
      },
      columnStyles: {
        0: { 
          cellWidth: contentWidth * 0.6,
          fontStyle: 'bold',
          halign: 'left'
        },
        1: { 
          cellWidth: contentWidth * 0.4,
          halign: 'center', // Centered amount
          fontStyle: 'bold'
        }
      },
      styles: { 
        lineWidth: 0.1,
        lineColor: [200, 200, 200]
      },
      margin: { left: margin, right: margin },
      tableWidth: contentWidth
    });
    
    yPos = doc.lastAutoTable.finalY + 8;
    
    // DETAILED TRANSACTION LOG Section
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('DETAILED TRANSACTION LOG', margin, yPos);
    yPos += 6;
    
    if (transactions.length > 0) {
      const colWidths = [
        contentWidth * 0.05,  // #
        contentWidth * 0.15,  // Time
        contentWidth * 0.25,  // Customer/System
        contentWidth * 0.20,  // Transaction Type
        contentWidth * 0.20,  // Amount
        contentWidth * 0.15,  // Status
      ];
      
      const transactionsData = transactions.map((t, index) => [
        (index + 1).toString(),
        format(parseISO(t.created_at), 'hh:mm a'),
        t.customers?.name || 'Mukhtar Baji System',
        getTransactionTypeLabel(t.type),
        formatCurrency(t.amount),
        t.status || 'completed'
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['#', 'Time', 'Customer/System', 'Transaction Type', 'Amount (NGN)', 'Status']],
        body: transactionsData,
        theme: 'grid',
        headStyles: { 
          fillColor: [59, 130, 246],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8,
          cellPadding: 2
        },
        columnStyles: {
          0: { 
            cellWidth: colWidths[0], 
            halign: 'center',
            cellPadding: 2
          },
          1: { 
            cellWidth: colWidths[1], 
            halign: 'center',
            cellPadding: 2
          },
          2: { 
            cellWidth: colWidths[2],
            halign: 'left',
            cellPadding: 2
          },
          3: { 
            cellWidth: colWidths[3],
            halign: 'left',
            cellPadding: 2
          },
          4: { 
            cellWidth: colWidths[4], 
            halign: 'center', // Centered amount
            cellPadding: 2
          },
          5: { 
            cellWidth: colWidths[5], 
            halign: 'center',
            cellPadding: 2
          }
        },
        styles: { 
          fontSize: 7,
          cellPadding: 1,
          lineWidth: 0.1,
          lineColor: [200, 200, 200],
          overflow: 'linebreak'
        },
        margin: { left: margin, right: margin },
        tableWidth: contentWidth,
        didParseCell: (data) => {
          // Color code amounts based on transaction type
          if (data.section === 'body' && data.column.dataKey === 4) {
            const type = transactions[data.row.index].type;
            if (type === 'topup') data.cell.styles.textColor = [34, 197, 94];
            if (type === 'customer_deposit') data.cell.styles.textColor = [59, 130, 246];
            if (type === 'withdrawal') data.cell.styles.textColor = [239, 68, 68];
          }
          // Color code status
          if (data.section === 'body' && data.column.dataKey === 5) {
            const status = transactions[data.row.index].status;
            if (status === 'completed') data.cell.styles.textColor = [34, 197, 94];
            if (status === 'pending') data.cell.styles.textColor = [234, 179, 8];
            if (status === 'failed') data.cell.styles.textColor = [239, 68, 68];
          }
        }
      });
      
      yPos = doc.lastAutoTable.finalY + 8;
    } else {
      doc.text('No transactions recorded for this date', margin, yPos);
      yPos += 15;
    }
    
    // CUSTOMER DEPOSIT SUMMARY Section - Only if there's space
    const remainingSpace = pageHeight - yPos - 40;
    if (remainingSpace > 30) {
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text('CUSTOMER DEPOSIT SUMMARY', margin, yPos);
      yPos += 6;
      
      if (customers.length > 0) {
        const customerData = customers.map(customer => [
          customer.name,
          formatCurrency(customer.amount || 0),
          format(parseISO(customer.created_at), 'dd/MM/yyyy')
        ]);
        
        autoTable(doc, {
          startY: yPos,
          head: [['Customer Name', 'Total Deposit (NGN)', 'Date Added']],
          body: customerData,
          theme: 'grid',
          headStyles: { 
            fillColor: [99, 102, 241],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 8,
            cellPadding: 2
          },
          columnStyles: {
            0: { 
              cellWidth: contentWidth * 0.4,
              halign: 'left',
              cellPadding: 2
            },
            1: { 
              cellWidth: contentWidth * 0.3, 
              halign: 'center', // Centered amount
              cellPadding: 2
            },
            2: { 
              cellWidth: contentWidth * 0.3, 
              halign: 'center',
              cellPadding: 2
            }
          },
          styles: { 
            fontSize: 8,
            cellPadding: 1,
            lineWidth: 0.1,
            lineColor: [200, 200, 200],
            overflow: 'linebreak'
          },
          margin: { left: margin, right: margin },
          tableWidth: contentWidth
        });
        
        yPos = doc.lastAutoTable.finalY + 8;
      }
    }
    
    // Footer Section - Compact
    const footerY = Math.min(yPos, pageHeight - 25);
    
    // Summary box
    doc.setFillColor(243, 244, 246);
    doc.roundedRect(margin, footerY, contentWidth, 20, 3, 3, 'F');
    
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    
    // Left column - Transaction Summary
    doc.text('Transaction Summary:', margin + 5, footerY + 7);
    doc.text(`Total Transactions: ${stats.transactionCount}`, margin + 5, footerY + 12);
    doc.text(`Total Customers: ${stats.customerCount}`, margin + 5, footerY + 17);
    
    // Right column - Financial Summary
    const rightColX = margin + (contentWidth / 2);
    doc.text('Financial Summary:', rightColX, footerY + 7);
    doc.text(`Total Inflow: ${formatCurrency(stats.totalTopup)}`, rightColX, footerY + 12);
    doc.text(`Total Outflow: ${formatCurrency(stats.totalCustomerDeposits + stats.totalWithdrawals)}`, rightColX, footerY + 17);
    
    // Authorized Signature
    doc.setDrawColor(200, 200, 200);
    doc.line(pageWidth / 2 - 40, footerY + 25, pageWidth / 2 + 40, footerY + 25);
    
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Authorized Signature', pageWidth / 2, footerY + 30, { align: 'center' });
    doc.text('Mukhtar Baji Metal Trading', pageWidth / 2, footerY + 35, { align: 'center' });
    
    // Page number and copyright
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(
      'Page 1 of 1',
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
    
    doc.text(
      'Generated by Mukhtar Metal System - © All Rights Reserved',
      pageWidth / 2,
      pageHeight - 3,
      { align: 'center' }
    );
    
    // Save the PDF
    doc.save(`Mukhtar_Baji_Metal_Statement_${selectedDate}.pdf`);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Error generating PDF. Please try again.');
  } finally {
    setGeneratingPDF(false);
  }
};
  const generateCSVReport = () => {
    const stats = calculateDailyStats();
    const headers = ['Date', 'Opening Balance', 'Wallet Top-ups', 'Customer Deposits', 'Withdrawals', 'Closing Balance', 'Total Transactions', 'Total Customers'];
    const csvData = [
      headers.join(','),
      [
        selectedDate,
        stats.openingBalance,
        stats.totalTopup,
        stats.totalCustomerDeposits,
        stats.totalWithdrawals,
        stats.closingBalance,
        stats.transactionCount,
        stats.customerCount
      ].join(',')
    ].join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Mukhtar_Metal_Daily_Report_${selectedDate}.csv`;
    a.click();
  };

  const stats = calculateDailyStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Daily Reports</h1>
          <p className="text-gray-600">Generate comprehensive daily statements for Mukhtar Metal Kano</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
          </div>
          
          <button
            onClick={fetchDailyData}
            disabled={loading}
            className="btn-secondary flex items-center"
          >
            <EyeIcon className="h-5 w-5 mr-2" />
            {loading ? 'Loading...' : 'View Report'}
          </button>
        </div>
      </div>

      {/* Current Wallet Balance */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-start justify-between">
          <div className="mb-4 md:mb-0">
            <h2 className="text-xl font-bold">Current Wallet Status</h2>
            <p className="mt-2 text-3xl font-bold">
              {formatCurrency(walletBalance)}
            </p>
            <p className="mt-1 text-primary-100">
              Real-time balance as of {format(new Date(), 'dd MMMM, yyyy hh:mm a')}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm">Statement Date</p>
            <p className="text-lg font-bold">{format(new Date(selectedDate), 'dd MMMM, yyyy')}</p>
            <div className="flex items-center justify-end mt-2 space-x-4">
              <div className="text-sm">
                <UsersIcon className="h-4 w-4 inline mr-1" />
                <span>Customers: {stats.customerCount}</span>
              </div>
              <div className="text-sm">
                <CurrencyDollarIcon className="h-4 w-4 inline mr-1" />
                <span>Deposits: {formatCurrency(stats.totalDeposits)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Opening Balance</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatCurrency(stats.openingBalance)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Start of day</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <BanknotesIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Wallet Top-ups</p>
              <p className="text-2xl font-bold text-green-600 mt-2">
                {formatCurrency(stats.totalTopup)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Money added today</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <ArrowTrendingUpIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Customer Deposits</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">
                {formatCurrency(stats.totalCustomerDeposits)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Deducted today</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <ArrowTrendingDownIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Closing Balance</p>
              <p className="text-2xl font-bold text-primary-700 mt-2">
                {formatCurrency(stats.closingBalance)}
              </p>
              <p className="text-xs text-gray-500 mt-1">End of day</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
              <CurrencyDollarIcon className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Report Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Generate Comprehensive Statement</h2>
            <p className="text-gray-600 text-sm mt-1">
              Date: {format(new Date(selectedDate), 'dd MMMM, yyyy')}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={generateCSVReport}
              className="btn-secondary flex items-center"
            >
              <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
              Export CSV
            </button>
            
            <button
              onClick={generateDailyStatementPDF}
              disabled={generatingPDF}
              className="btn-primary flex items-center px-6"
            >
              {generatingPDF ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Generating PDF...
                </>
              ) : (
                <>
                  <PrinterIcon className="h-5 w-5 mr-2" />
                  Generate Full Statement
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Financial Summary Panel */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Daily Financial Summary</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="border border-gray-200 rounded-lg p-4 bg-blue-50">
            <p className="text-sm font-medium text-gray-700">Opening Balance</p>
            <p className="text-xl font-bold text-gray-900 mt-1">
              {formatCurrency(stats.openingBalance)}
            </p>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4 bg-green-50">
            <p className="text-sm font-medium text-gray-700">Wallet Top-ups</p>
            <p className="text-xl font-bold text-green-700 mt-1">
              +{formatCurrency(stats.totalTopup)}
            </p>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4 bg-blue-50">
            <p className="text-sm font-medium text-gray-700">Customer Deposits</p>
            <p className="text-xl font-bold text-blue-700 mt-1">
              -{formatCurrency(stats.totalCustomerDeposits)}
            </p>
          </div>
          
          <div className="border-2 border-primary-300 rounded-lg p-4 bg-gradient-to-r from-primary-50 to-blue-50 shadow-sm">
            <p className="text-sm font-medium text-gray-700">Closing Balance</p>
            <p className="text-xl font-bold text-primary-700 mt-1">
              {formatCurrency(stats.closingBalance)}
            </p>
            <p className="text-xs text-gray-600 mt-2">Final balance for the day</p>
          </div>
        </div>
        
        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-600">Total Transactions</p>
            <p className="text-lg font-bold text-gray-900">{stats.transactionCount}</p>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-600">Total Customers</p>
            <p className="text-lg font-bold text-gray-900">{stats.customerCount}</p>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-600">Total Customer Deposits</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(stats.totalDeposits)}</p>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Daily Transaction Log</h2>
              <p className="text-gray-600 text-sm mt-1">
                {transactions.length} transactions recorded on {format(new Date(selectedDate), 'dd MMMM, yyyy')}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Total Transaction Value</p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(stats.totalTopup + stats.totalCustomerDeposits + stats.totalWithdrawals)}
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading transaction data...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <CurrencyDollarIcon className="h-12 w-12 text-gray-400 mx-auto" />
              <p className="mt-4 text-gray-600">No transactions recorded for this date</p>
              <p className="text-sm text-gray-500">Select a different date to view transactions</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount (NGN)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => {
                  const color = getTransactionColor(transaction.type);
                  return (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(parseISO(transaction.created_at), 'hh:mm a')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {transaction.customers?.name || 'System'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${color.bg} ${color.text}`}>
                          {getTransactionTypeLabel(transaction.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${color.amount}`}>
                          {formatCurrency(transaction.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          transaction.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : transaction.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {transaction.status || 'completed'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
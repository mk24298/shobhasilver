import React, { useState } from 'react';
import CreateBill from './CreateBill';

import AddStockForm from './AddStockForm';
import DisplayStocks from './DisplayStocks';
import RetailerBillsPage from './RetailersBillPage';
import CreateRetailerForm from './CreateRetailer';
import UpdateStockForm from './UpdateStockForm';


export default function Admin() {
  const [view, setView] = useState('createbill'); // 'search', 'all', or 'sales'

  const handleCreateBill = () => {
    setView('createbill');
  };
  const handleShowCredit = () => {
    setView('credit');
  };

  const handleStockAvailable = () => {
    setView('stock');
  };

  const handleStockEntry = () => {
    setView('entry');
  };
  const handleCreateRetailer = () => {
    setView('newretailer');
  };
  const handleUpdateStock = () => {
    setView('updatestock');
  };
  const handleDownload = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/download-retailers-report', {
        method: 'GET',
      }); if (!response.ok) {
        throw new Error('Failed to fetch PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Retailers_Report.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Error downloading PDF');
    }
  };
  return (
    <div className="container">
      <h1 className="text-warning text-center my-4">Shobha Silvers</h1>
      <div className="d-flex justify-content-center mb-3">
        <button
          className="btn btn-primary mx-2"
          onClick={handleCreateBill}
          disabled={view === 'createbill'}
        >
          Create Bill
        </button>
        <button
          className="btn btn-warning mx-2"
          onClick={handleShowCredit}
          disabled={view === 'credit'}
        >
          Retailers
        </button>
        <button
          className="btn btn-warning mx-2"
          onClick={handleStockAvailable}
          disabled={view === 'stock'}
        >
          All Stock
        </button>
        <button
          className="btn btn-success mx-2"
          onClick={handleStockEntry}
          disabled={view === 'entry'}
        >
          Stock Entry
        </button>
        <button
          className="btn btn-success mx-2"
          onClick={handleCreateRetailer}
          disabled={view === 'newretailer'}
        >
          Add Retailer
        </button>
        <button
          className="btn btn-success mx-2"
          onClick={handleUpdateStock}
          disabled={view === 'updatestock'}
        >
          Update Stock
        </button>
        <button onClick={handleDownload}  className="btn btn-dark mx-2">
          Download
        </button>
      </div>
      {view === 'createbill' && <CreateBill />}
      {view === 'credit' && <RetailerBillsPage />}
      {view === 'stock' && <DisplayStocks />}
      {view === 'entry' && <AddStockForm />}
      {view === 'newretailer' && <CreateRetailerForm />}
      {view === 'updatestock' && <UpdateStockForm />}



    </div>
  );
}

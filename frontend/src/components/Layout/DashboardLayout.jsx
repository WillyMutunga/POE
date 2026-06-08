import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const DashboardLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-[#F3F4F6]">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="p-10">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

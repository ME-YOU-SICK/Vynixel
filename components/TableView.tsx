import React from 'react';
import { TableContent } from '../types';

interface TableViewProps {
  content: TableContent;
}

const TableView: React.FC<TableViewProps> = ({ content }) => {
  if (!content || !content.headers || !content.rows) {
    return <p className="text-muted-foreground">Invalid table data.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-card-foreground">
        <thead className="text-xs uppercase bg-muted/50">
          <tr>
            {content.headers.map((header, index) => (
              <th key={index} scope="col" className="px-4 py-2 font-semibold border-b border-border">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {content.rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b border-border/50 hover:bg-muted/30">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-2">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TableView;

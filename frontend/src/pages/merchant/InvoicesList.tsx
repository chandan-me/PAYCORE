import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  FileText,
  Plus,
  Download,
  Search,
  Trash2
} from 'lucide-react';
import { MoneyFormat } from '../../components/MoneyFormat';
import { StatusBadge } from '../../components/StatusBadge';

interface LineItem {
  description: string;
  quantity: number;
  unit_price: number; // in paise
  tax_rate_percent: number;
}

interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_email?: string;
  customer_gstin?: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  status: string;
  created_at: string;
  line_items: any[];
}

const invoiceValidationSchema = Yup.object({
  customerName: Yup.string()
    .trim()
    .required('Customer / Company name is required')
    .min(2, 'Name must be at least 2 characters'),
  customerEmail: Yup.string()
    .email('Invalid email address')
    .nullable(),
  customerGstin: Yup.string()
    .trim()
    .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, {
      message: 'Invalid GSTIN format (e.g. 29AAAAA0000A1Z5)',
      excludeEmptyString: true
    })
    .nullable(),
  customerAddress: Yup.string(),
  isInterstateTax: Yup.boolean(),
  notes: Yup.string(),
  lineItems: Yup.array().of(
    Yup.object({
      description: Yup.string().trim().required('Description is required'),
      quantity: Yup.number().typeError('Qty must be a number').min(1, 'Min qty is 1').required('Required'),
      unit_price: Yup.number().typeError('Price must be a number').min(0, 'Price must be >= 0').required('Required'),
      tax_rate_percent: Yup.number().required('Tax rate is required')
    })
  ).min(1, 'At least one line item is required')
});

export const InvoicesList: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('paycore_token');
      const res = await fetch('http://localhost:8000/v1/invoices', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setInvoices(data);
      }
    } catch (err) {
      console.error('Failed to load invoices', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const formik = useFormik({
    initialValues: {
      customerName: '',
      customerEmail: '',
      customerGstin: '',
      customerAddress: '',
      isInterstateTax: false,
      notes: 'Payment due within 15 days of invoice date.',
      lineItems: [
        { description: 'Consulting / Software License', quantity: 1, unit_price: 100000, tax_rate_percent: 18 }
      ]
    },
    validationSchema: invoiceValidationSchema,
    onSubmit: async (values, { resetForm }) => {
      setSubmitting(true);
      setFormError(null);
      try {
        const token = localStorage.getItem('paycore_token');
        const res = await fetch('http://localhost:8000/v1/invoices', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            customer_name: values.customerName.trim(),
            customer_email: values.customerEmail?.trim() || undefined,
            customer_gstin: values.customerGstin?.trim() || undefined,
            customer_address: values.customerAddress?.trim() || undefined,
            is_interstate_tax: values.isInterstateTax,
            line_items: values.lineItems,
            notes: values.notes?.trim() || undefined
          })
        });

        if (res.ok) {
          setIsCreateOpen(false);
          resetForm();
          fetchInvoices();
        } else {
          const errData = await res.json();
          setFormError(errData.detail || 'Invoice creation failed.');
        }
      } catch (err: any) {
        console.error('Invoice creation failed', err);
        setFormError(err.message || 'Connection error.');
      } finally {
        setSubmitting(false);
      }
    }
  });

  const handleAddLineItem = () => {
    formik.setFieldValue('lineItems', [
      ...formik.values.lineItems,
      { description: '', quantity: 1, unit_price: 0, tax_rate_percent: 18 }
    ]);
  };

  const handleRemoveLineItem = (index: number) => {
    if (formik.values.lineItems.length > 1) {
      formik.setFieldValue(
        'lineItems',
        formik.values.lineItems.filter((_, i) => i !== index)
      );
    }
  };

  const handleUpdateLineItem = (index: number, field: keyof LineItem, val: any) => {
    const updated = [...formik.values.lineItems];
    updated[index] = { ...updated[index], [field]: val };
    formik.setFieldValue('lineItems', updated);
  };

  const handleDownloadPDF = async (invId: string, invoiceNum: string) => {
    try {
      const token = localStorage.getItem('paycore_token');
      const res = await fetch(`http://localhost:8000/v1/invoices/${invId}/download-pdf`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${invoiceNum}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (err) {
      console.error('Download failed', err);
    }
  };

  const filtered = invoices.filter(
    (inv) =>
      inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      (inv.customer_name && inv.customer_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-400" />
            Tax Invoices & GST Billing
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Generate itemized tax invoices with CGST/SGST/IGST breakdown and downloadable PDFs.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/30 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Invoice
        </button>
      </div>

      {/* Invoices Table */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl backdrop-blur-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoice number or customer..."
              className="w-full pl-9 pr-4 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <span className="text-xs text-slate-500 font-mono">{filtered.length} Total Invoices</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm font-mono">Loading invoices...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">No invoices found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase font-mono tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Invoice #</th>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Subtotal</th>
                  <th className="px-6 py-3.5">Tax (GST)</th>
                  <th className="px-6 py-3.5">Grand Total</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filtered.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-indigo-400 font-medium">{inv.invoice_number}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{inv.customer_name}</div>
                      <div className="text-[11px] text-slate-500">{inv.customer_email || 'No email'}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-mono">
                      {new Date(inv.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <MoneyFormat amount={inv.subtotal} currency={inv.currency} />
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      <MoneyFormat amount={inv.tax_amount} currency={inv.currency} />
                    </td>
                    <td className="px-6 py-4 font-bold text-white">
                      <MoneyFormat amount={inv.total_amount} currency={inv.currency} />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDownloadPDF(inv.id, inv.invoice_number)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs inline-flex items-center gap-1.5 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5 text-indigo-400" />
                        PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Invoice Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              Generate Itemized GST Tax Invoice
            </h2>

            {formError && (
              <div className="mt-3 p-3 bg-red-950/50 border border-red-500/30 rounded-lg text-xs text-red-400">
                {formError}
              </div>
            )}

            <form onSubmit={formik.handleSubmit} className="mt-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Customer / Company Name *</label>
                  <input
                    type="text"
                    name="customerName"
                    value={formik.values.customerName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="e.g. Acme Labs Ltd."
                    className={`w-full bg-slate-950 border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 ${
                      formik.touched.customerName && formik.errors.customerName
                        ? 'border-rose-500 focus:ring-rose-500'
                        : 'border-slate-800 focus:ring-indigo-500'
                    }`}
                  />
                  {formik.touched.customerName && formik.errors.customerName && (
                    <p className="mt-1 text-[11px] text-rose-400">{formik.errors.customerName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Customer Email (Optional)</label>
                  <input
                    type="email"
                    name="customerEmail"
                    value={formik.values.customerEmail}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="e.g. billing@acme.com"
                    className={`w-full bg-slate-950 border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 ${
                      formik.touched.customerEmail && formik.errors.customerEmail
                        ? 'border-rose-500 focus:ring-rose-500'
                        : 'border-slate-800 focus:ring-indigo-500'
                    }`}
                  />
                  {formik.touched.customerEmail && formik.errors.customerEmail && (
                    <p className="mt-1 text-[11px] text-rose-400">{formik.errors.customerEmail}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Customer GSTIN (Optional)</label>
                  <input
                    type="text"
                    name="customerGstin"
                    value={formik.values.customerGstin}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="e.g. 29AAAAA0000A1Z5"
                    className={`w-full bg-slate-950 border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 uppercase ${
                      formik.touched.customerGstin && formik.errors.customerGstin
                        ? 'border-rose-500 focus:ring-rose-500'
                        : 'border-slate-800 focus:ring-indigo-500'
                    }`}
                  />
                  {formik.touched.customerGstin && formik.errors.customerGstin && (
                    <p className="mt-1 text-[11px] text-rose-400">{formik.errors.customerGstin}</p>
                  )}
                </div>
                <div className="flex items-center pt-6 gap-2">
                  <input
                    type="checkbox"
                    id="interstate"
                    name="isInterstateTax"
                    checked={formik.values.isInterstateTax}
                    onChange={formik.handleChange}
                    className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <label htmlFor="interstate" className="text-slate-300 font-medium cursor-pointer">
                    Interstate Supply (Apply IGST instead of CGST+SGST)
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Customer Address (Optional)</label>
                <input
                  type="text"
                  name="customerAddress"
                  value={formik.values.customerAddress}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="e.g. Tech Park, Outer Ring Road, Bangalore"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Line Items */}
              <div className="space-y-2 pt-2">
                <label className="block text-slate-400 font-medium">Line Items *</label>
                {formik.values.lineItems.map((item, index) => (
                  <div key={index} className="flex gap-2 items-center bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <input
                      type="text"
                      placeholder="Description *"
                      value={item.description}
                      onChange={(e) => handleUpdateLineItem(index, 'description', e.target.value)}
                      className="flex-1 bg-transparent border-0 text-white focus:outline-none"
                    />
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleUpdateLineItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      className="w-16 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white text-center focus:outline-none"
                    />
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500">₹</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="Price"
                        value={item.unit_price / 100}
                        onChange={(e) => handleUpdateLineItem(index, 'unit_price', Math.round(parseFloat(e.target.value || '0') * 100))}
                        className="w-24 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white text-right focus:outline-none"
                      />
                    </div>
                    <select
                      value={item.tax_rate_percent}
                      onChange={(e) => handleUpdateLineItem(index, 'tax_rate_percent', parseFloat(e.target.value))}
                      className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white focus:outline-none cursor-pointer"
                    >
                      <option value="0">0%</option>
                      <option value="5">5%</option>
                      <option value="12">12%</option>
                      <option value="18">18% (Standard)</option>
                      <option value="28">28%</option>
                    </select>
                    {formik.values.lineItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLineItem(index)}
                        className="p-1 text-slate-500 hover:text-red-400 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddLineItem}
                  className="text-xs text-indigo-400 font-semibold hover:text-indigo-300 flex items-center gap-1 mt-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Another Item
                </button>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Notes & Terms</label>
                <textarea
                  rows={2}
                  name="notes"
                  value={formik.values.notes}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  {submitting ? 'Generating Invoice...' : 'Create & Issue Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

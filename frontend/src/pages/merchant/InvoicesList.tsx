import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  FileText,
  Plus,
  Download,
  Search,
  Trash2,
  Receipt
} from 'lucide-react';
import { MoneyFormat } from '../../components/MoneyFormat';
import { StatusBadge } from '../../components/StatusBadge';
import { useToast } from '../../context/ToastContext';

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
  const toast = useToast();

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
      toast.error('Failed to Load Invoices', 'Could not retrieve GST invoices.');
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
      notes: 'Payment is due within 15 days of invoice date. Thank you for your business.',
      lineItems: [
        { description: 'Cloud Infrastructure & API Retainer', quantity: 1, unit_price: 249900, tax_rate_percent: 18 }
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
            customer_gstin: values.customerGstin?.trim() ? values.customerGstin.trim().toUpperCase() : undefined,
            customer_address: values.customerAddress?.trim() || undefined,
            is_interstate_tax: values.isInterstateTax,
            notes: values.notes?.trim() || undefined,
            line_items: values.lineItems.map(item => ({
              description: item.description.trim(),
              quantity: Number(item.quantity),
              unit_price: Number(item.unit_price),
              tax_rate_percent: Number(item.tax_rate_percent)
            }))
          })
        });

        if (res.ok) {
          const newInv = await res.json();
          setIsCreateOpen(false);
          resetForm();
          fetchInvoices();
          toast.success(
            'Tax Invoice Generated!',
            `Invoice ${newInv.invoice_number} created for ${values.customerName.trim()} with GST breakdown.`
          );
        } else {
          const errData = await res.json();
          const errMsg = errData.detail || 'Invoice creation failed.';
          setFormError(errMsg);
          toast.error('Invoice Creation Failed', errMsg);
        }
      } catch (err: any) {
        console.error('Invoice creation failed', err);
        setFormError(err.message || 'Connection error.');
        toast.error('Network Error', 'Could not create invoice.');
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
      toast.info('Generating PDF', `Preparing official GST tax invoice PDF (${invoiceNum})...`);
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
        toast.success('PDF Download Complete', `Downloaded ${invoiceNum}.pdf`);
      } else {
        toast.error('Download Failed', 'Could not generate PDF.');
      }
    } catch (err) {
      console.error('Download failed', err);
      toast.error('Download Error', 'Network error generating PDF.');
    }
  };

  const filtered = invoices.filter(
    (inv) =>
      inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      (inv.customer_name && inv.customer_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-[#0066FF]" />
              Tax Invoices & GST Billing
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold">
              GST Compliant
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Generate itemized tax invoices with CGST/SGST/IGST breakdown and downloadable PDFs
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-[#0066FF] hover:bg-[#0052cc] text-white font-bold text-xs transition-all shadow-md shadow-blue-600/20 flex items-center gap-2 cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Create Tax Invoice</span>
        </button>
      </div>

      {/* Invoices Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoice # or customer..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20 focus:border-[#0066FF]"
            />
          </div>
          <span className="text-xs text-slate-400 font-mono">{filtered.length} Total Invoices</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs font-mono">Loading invoices...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">No invoices found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Invoice #</th>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Subtotal</th>
                  <th className="px-5 py-3.5">Tax (GST)</th>
                  <th className="px-5 py-3.5">Grand Total</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-[#0066FF] font-bold">{inv.invoice_number}</td>
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900">{inv.customer_name}</div>
                      <div className="text-[11px] text-slate-400">{inv.customer_email || 'No email'}</div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 font-mono">
                      {new Date(inv.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <MoneyFormat amount={inv.subtotal} currency={inv.currency} />
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      <MoneyFormat amount={inv.tax_amount} currency={inv.currency} />
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      <MoneyFormat amount={inv.total_amount} currency={inv.currency} />
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleDownloadPDF(inv.id, inv.invoice_number)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs inline-flex items-center gap-1.5 transition cursor-pointer"
                        title="Download Tax Invoice PDF"
                      >
                        <Download className="w-3.5 h-3.5 text-[#0066FF]" />
                        <span>PDF</span>
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
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#0066FF]" />
                Generate Itemized GST Tax Invoice
              </h2>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={formik.handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Customer / Company Name *</label>
                  <input
                    type="text"
                    name="customerName"
                    value={formik.values.customerName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="e.g. Acme Labs Ltd."
                    className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 ${
                      formik.touched.customerName && formik.errors.customerName
                        ? 'border-rose-400 focus:ring-rose-500'
                        : 'border-slate-200 focus:ring-[#0066FF]/20 focus:border-[#0066FF]'
                    }`}
                  />
                  {formik.touched.customerName && formik.errors.customerName && (
                    <p className="mt-1 text-[11px] text-rose-600 font-medium">{formik.errors.customerName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Customer Email (Optional)</label>
                  <input
                    type="email"
                    name="customerEmail"
                    value={formik.values.customerEmail}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="e.g. billing@acme.com"
                    className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 ${
                      formik.touched.customerEmail && formik.errors.customerEmail
                        ? 'border-rose-400 focus:ring-rose-500'
                        : 'border-slate-200 focus:ring-[#0066FF]/20 focus:border-[#0066FF]'
                    }`}
                  />
                  {formik.touched.customerEmail && formik.errors.customerEmail && (
                    <p className="mt-1 text-[11px] text-rose-600 font-medium">{formik.errors.customerEmail}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Customer GSTIN (Optional)</label>
                  <input
                    type="text"
                    name="customerGstin"
                    value={formik.values.customerGstin}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="e.g. 29AAAAA0000A1Z5"
                    className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 uppercase ${
                      formik.touched.customerGstin && formik.errors.customerGstin
                        ? 'border-rose-400 focus:ring-rose-500'
                        : 'border-slate-200 focus:ring-[#0066FF]/20 focus:border-[#0066FF]'
                    }`}
                  />
                  {formik.touched.customerGstin && formik.errors.customerGstin && (
                    <p className="mt-1 text-[11px] text-rose-600 font-medium">{formik.errors.customerGstin}</p>
                  )}
                </div>
                <div className="flex items-center pt-6 gap-2">
                  <input
                    type="checkbox"
                    id="interstate"
                    name="isInterstateTax"
                    checked={formik.values.isInterstateTax}
                    onChange={formik.handleChange}
                    className="rounded border-slate-300 text-[#0066FF] focus:ring-[#0066FF] cursor-pointer"
                  />
                  <label htmlFor="interstate" className="text-slate-700 font-medium cursor-pointer">
                    Interstate Supply (Apply IGST instead of CGST+SGST)
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Customer Address (Optional)</label>
                <input
                  type="text"
                  name="customerAddress"
                  value={formik.values.customerAddress}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="e.g. Tech Park, Outer Ring Road, Bangalore"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20 focus:border-[#0066FF]"
                />
              </div>

              {/* Line Items */}
              <div className="space-y-2 pt-2">
                <label className="block text-slate-700 font-bold">Line Items *</label>
                {formik.values.lineItems.map((item, index) => (
                  <div key={index} className="flex gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <input
                      type="text"
                      placeholder="Description *"
                      value={item.description}
                      onChange={(e) => handleUpdateLineItem(index, 'description', e.target.value)}
                      className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0066FF]"
                    />
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleUpdateLineItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-slate-900 text-center focus:outline-none"
                    />
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400 font-mono">₹</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="Price"
                        value={item.unit_price / 100}
                        onChange={(e) => handleUpdateLineItem(index, 'unit_price', Math.round(parseFloat(e.target.value || '0') * 100))}
                        className="w-24 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-slate-900 text-right focus:outline-none font-mono"
                      />
                    </div>
                    <select
                      value={item.tax_rate_percent}
                      onChange={(e) => handleUpdateLineItem(index, 'tax_rate_percent', parseFloat(e.target.value))}
                      className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-slate-900 focus:outline-none cursor-pointer text-xs font-semibold"
                    >
                      <option value="0">0% GST</option>
                      <option value="5">5% GST</option>
                      <option value="12">12% GST</option>
                      <option value="18">18% (Standard)</option>
                      <option value="28">28% GST</option>
                    </select>
                    {formik.values.lineItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLineItem(index)}
                        className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddLineItem}
                  className="text-xs text-[#0066FF] font-bold hover:underline flex items-center gap-1 mt-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Another Line Item
                </button>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Notes & Terms</label>
                <textarea
                  rows={2}
                  name="notes"
                  value={formik.values.notes}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20 focus:border-[#0066FF]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[#0066FF] hover:bg-[#0052cc] text-white font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer active:scale-95"
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

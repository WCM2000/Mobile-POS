const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    quantity: Number,
    price: Number
  }],
  subTotal: { type: Number, required: true },
  taxAmount: { type: Number, required: true },
  grandTotal: { type: Number, required: true },
  paymentMethod: { type: String, required: true },
  status: { type: String, enum: ['Paid', 'Pending', 'Cancelled'], default: 'Pending' },
  invoiceType: { type: String, default: 'Cash Bill' },
  customerName: { type: String, default: 'Walk-in Customer' },
  customerPhone: { type: String, default: '' },
  discountAmount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Invoice', invoiceSchema);

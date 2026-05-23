import { BLEPrinter } from 'react-native-thermal-receipt-printer-image-qr';
import { O3_LOGO_BASE64 } from '../utils/logoBase64';
import { store } from '../redux/store';

class PrinterService {
  constructor() {
    this.devices = [];
  }

  // Initialize and Scan for Bluetooth Printers
  async scanForPrinters() {
    try {
      await BLEPrinter.init();
      const deviceList = await BLEPrinter.getDeviceList();
      this.devices = deviceList;
      return deviceList;
    } catch (error) {
      console.error('Error scanning for printers:', error);
      throw error;
    }
  }

  // Connect to a specific printer by its address
  async connectToPrinter(address) {
    try {
      await BLEPrinter.connectPrinter(address);
      console.log('Connected to printer:', address);
    } catch (error) {
      console.error('Error connecting to printer:', error);
      throw error;
    }
  }

  // Format and Print Receipt (includes branding logo and custom store profile)
  async printReceipt(cartItems, subTotal, taxAmount, grandTotal) {
    try {
      // 1. Fetch live configurations from Redux store dynamically
      const state = store.getState();
      const settings = state.settings;
      
      const shopName = settings.shopName || 'O3 Retail Terminal';
      const shopAddress = settings.shopAddress || 'Colombo, Sri Lanka';
      const shopPhone = settings.shopPhone || '077 123 4567';
      const shopGstNumber = settings.shopGstNumber || '';
      const currency = settings.currency || 'Rs.';
      const printerSize = settings.printerSize || '58mm';
      
      // Calculate printable character width based on paper format (standard 58mm: 32 chars, 80mm: 48 chars)
      const lineCharLimit = printerSize === '80mm' ? 48 : 32;
      const separatorLine = '-'.repeat(lineCharLimit) + '\n';

      // 2. Send Monochrome O3 Logo to BLE Thermal Print Buffer
      try {
        await BLEPrinter.printImage(O3_LOGO_BASE64, { imageWidth: 120, imageHeight: 120 });
      } catch (imageError) {
        console.warn('Monochrome logo print skipped or unsupported by printer firmware:', imageError);
      }

      // 3. Compile transaction textual receipt
      let receiptText = '';
      
      // Store Header Section
      receiptText += `<C><B>${shopName.toUpperCase()}</B></C>\n`;
      receiptText += `<C>${shopAddress}</C>\n`;
      receiptText += `<C>Tel: ${shopPhone}</C>\n`;
      if (shopGstNumber) {
        receiptText += `<C>Tax ID: ${shopGstNumber}</C>\n`;
      }
      receiptText += separatorLine;
      
      // Matrix Column Titles
      if (printerSize === '80mm') {
        receiptText += 'Item Description            Qty       Unit      Total\n';
      } else {
        receiptText += 'Item            Qty        Price\n';
      }
      receiptText += separatorLine;
      
      // Cart items row compilations
      cartItems.forEach(item => {
        const itemPrice = item.price;
        const totalItemPrice = itemPrice * item.quantity;

        if (printerSize === '80mm') {
          const name = item.name.padEnd(25, ' ').substring(0, 25);
          const qty = item.quantity.toString().padStart(5, ' ');
          const unit = `${currency}${itemPrice.toFixed(0)}`.padStart(8, ' ');
          const total = `${currency}${totalItemPrice.toFixed(0)}`.padStart(9, ' ');
          receiptText += `${name} ${qty} ${unit} ${total}\n`;
        } else {
          const name = item.name.padEnd(15, ' ').substring(0, 15);
          const qty = item.quantity.toString().padStart(3, ' ');
          const total = `${currency}${totalItemPrice.toFixed(0)}`.padStart(12, ' ');
          receiptText += `${name} ${qty} ${total}\n`;
        }
      });
      
      receiptText += separatorLine;
      
      // Ledger Financials Section
      const labelPad = printerSize === '80mm' ? 36 : 20;
      const subTotalLabel = 'Subtotal:'.padEnd(labelPad, ' ');
      const taxLabel = `${settings.taxType || 'Tax'} (${settings.taxRate}%):`.padEnd(labelPad, ' ');
      const totalLabel = 'GRAND TOTAL:'.padEnd(labelPad, ' ');

      receiptText += `<R>${subTotalLabel}${currency}${subTotal.toFixed(2)}</R>\n`;
      receiptText += `<R>${taxLabel}${currency}${taxAmount.toFixed(2)}</R>\n`;
      receiptText += `<R><B>${totalLabel}${currency}${grandTotal.toFixed(2)}</B></R>\n`;
      
      receiptText += separatorLine;
      
      // Footer Branding
      receiptText += '<C>Thank You for choosing O3!</C>\n';
      receiptText += '<C>System by O3 Professional</C>\n';
      receiptText += '\n\n\n\n'; // Feed paper for tear-off
      
      await BLEPrinter.printText(receiptText);
      console.log('Receipt compiled and printed successfully.');
    } catch (error) {
      console.error('Error printing receipt:', error);
      throw error;
    }
  }
}

export default new PrinterService();

import { BLEPrinter } from 'react-native-thermal-receipt-printer-image-qr';

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

  // Format and Print Receipt
  async printReceipt(cartItems, subTotal, taxAmount, grandTotal) {
    try {
      let receiptText = '';
      
      // Header
      receiptText += '<C>MOBILE POS STORE</C>\n';
      receiptText += '<C>123 Business Road, Tech City</C>\n';
      receiptText += '--------------------------------\n';
      
      // Items
      receiptText += 'Item            Qty        Price\n';
      receiptText += '--------------------------------\n';
      
      cartItems.forEach(item => {
        const name = item.name.padEnd(15, ' ').substring(0, 15);
        const qty = item.quantity.toString().padStart(3, ' ');
        const price = (item.price * item.quantity).toString().padStart(10, ' ');
        receiptText += `${name} ${qty} ${price}\n`;
      });
      
      receiptText += '--------------------------------\n';
      
      // Totals
      receiptText += `<R>Subtotal: ₹${subTotal.toFixed(2)}</R>\n`;
      receiptText += `<R>Tax (6%): ₹${taxAmount.toFixed(2)}</R>\n`;
      receiptText += `<R><B>Grand Total: ₹${grandTotal.toFixed(2)}</B></R>\n`;
      
      receiptText += '--------------------------------\n';
      
      // Footer
      receiptText += '<C>Thank You for your visit!</C>\n';
      receiptText += '<C>Please come again</C>\n';
      receiptText += '\n\n\n'; // Feed paper
      
      await BLEPrinter.printText(receiptText);
    } catch (error) {
      console.error('Error printing receipt:', error);
      throw error;
    }
  }
}

export default new PrinterService();

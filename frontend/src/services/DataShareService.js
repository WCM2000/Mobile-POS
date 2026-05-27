import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { getInvoicesByDateLocal, getDb } from './LocalDbService';

export const exportDataAsJson = async (dateStr) => {
  try {
    const invoices = await getInvoicesByDateLocal(dateStr);
    
    if (invoices.length === 0) {
      alert('No data found for the selected date');
      return;
    }

    const dataToExport = {
      date: dateStr,
      exportTime: new Date().toISOString(),
      invoices: invoices
    };

    const fileName = `POS_Data_${dateStr}.json`;
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(dataToExport), {
      encoding: FileSystem.EncodingType.UTF8,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri);
    } else {
      alert('Sharing is not available on this device');
    }
  } catch (error) {
    console.error('Export Error:', error);
    alert('Failed to export data');
  }
};

export const pickAndImportFile = async () => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const fileUri = result.assets[0].uri;
      const content = await FileSystem.readAsStringAsync(fileUri);
      await importDataFromJson(content);
    }
  } catch (error) {
    console.error('Pick File Error:', error);
    alert('Error selecting file');
  }
};

export const importDataFromJson = async (jsonData) => {
  const db = getDb();
  try {
    const data = JSON.parse(jsonData);
    
    if (!data.invoices || !Array.isArray(data.invoices)) {
      throw new Error('Invalid data format');
    }

    // Use a transaction for better performance and data integrity
    await db.withTransactionAsync(async () => {
      for (const invoice of data.invoices) {
        // Check if invoice already exists (by a unique property if available, 
        // or just insert if duplicates are handled by business logic)
        await db.runAsync(
          'INSERT INTO invoices (customer_name, total_amount, discount, date, items) VALUES (?, ?, ?, ?, ?)',
          [invoice.customer_name, invoice.total_amount, invoice.discount, invoice.date, invoice.items]
        );
      }
    });

    alert('Data imported successfully!');
  } catch (error) {
    console.error('Import Error:', error);
    alert('Failed to import data: ' + error.message);
  }
};

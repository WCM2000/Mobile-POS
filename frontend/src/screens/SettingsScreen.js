import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { updateSettings } from '../redux/settingsSlice';
import PrinterService from '../services/PrinterService';
import { COLORS, SHADOWS } from '../utils/styles';
import { exportDataAsJson, pickAndImportFile } from '../services/DataShareService';

const SettingsScreen = () => {
  const dispatch = useDispatch();
  const settings = useSelector((state) => state.settings);

  // Form States
  const [shopName, setShopName] = useState(settings.shopName);
  const [shopAddress, setShopAddress] = useState(settings.shopAddress);
  const [shopPhone, setShopPhone] = useState(settings.shopPhone);
  const [shopGstNumber, setShopGstNumber] = useState(settings.shopGstNumber);
  const [taxRateInput, setTaxRateInput] = useState(settings.taxRate.toString());
  const [taxInclusive, setTaxInclusive] = useState(settings.taxInclusive);
  const [taxType, setTaxType] = useState(settings.taxType); // GST, SST, VAT, None
  const [currency, setCurrency] = useState(settings.currency);
  const [showDiscountOnInvoice, setShowDiscountOnInvoice] = useState(settings.showDiscountOnInvoice);
  const [listProductsSeparately, setListProductsSeparately] = useState(settings.listProductsSeparately);
  const [showCustomerDetailsOnInvoice, setShowCustomerDetailsOnInvoice] = useState(settings.showCustomerDetailsOnInvoice ?? true);

  // Export Date State
  const [exportDate, setExportDate] = useState(new Date().toISOString().split('T')[0]);

  // Printer Scanning
  const [scanning, setScanning] = useState(false);
  const [devices, setDevices] = useState([]);

  // Save Configs
  const handleSaveSettings = () => {
    const rate = parseFloat(taxRateInput) || 0;
    dispatch(
      updateSettings({
        shopName,
        shopAddress,
        shopPhone,
        shopGstNumber,
        taxRate: rate,
        taxInclusive,
        taxType,
        currency,
        showDiscountOnInvoice,
        listProductsSeparately,
        showCustomerDetailsOnInvoice,
      })
    );
    Alert.alert('Success', 'Shop configurations saved locally and synchronized!');
  };

  const handleExport = async () => {
    await exportDataAsJson(exportDate);
  };

  const handleImport = async () => {
    await pickAndImportFile();
  };

  // Android BLE Permissions check at runtime (Android 12+)
  const requestBluetoothPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        if (Platform.Version >= 31) {
          const granted = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          ]);
          return (
            granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === PermissionsAndroid.RESULTS.GRANTED &&
            granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === PermissionsAndroid.RESULTS.GRANTED
          );
        } else {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
      } catch (err) {
        console.warn('Permission error:', err);
        return false;
      }
    }
    return true;
  };

  const handleScanPrinters = async () => {
    const hasPermission = await requestBluetoothPermissions();
    if (!hasPermission) {
      Alert.alert(
        'Permissions Denied',
        'Bluetooth and Location access are required to discover nearby thermal printers.'
      );
      return;
    }

    try {
      setScanning(true);
      setDevices([]);
      const deviceList = await PrinterService.scanForPrinters();
      
      if (deviceList && deviceList.length > 0) {
        setDevices(deviceList);
      } else {
        Alert.alert(
          'Bluetooth Scan',
          'No Bluetooth printers found. Make sure your thermal printer is turned on, has Bluetooth enabled, and is within range.'
        );
      }
    } catch (err) {
      console.log('Bluetooth Scan Error:', err);
      Alert.alert(
        'Scan Failed',
        'Failed to initialize Bluetooth adapter. Verify Bluetooth is enabled on your device.'
      );
    } finally {
      setScanning(false);
    }
  };

  const handleConnectPrinter = async (device) => {
    try {
      setScanning(true);
      await PrinterService.connectToPrinter(device.address);
      dispatch(
        updateSettings({
          connectedPrinterAddress: device.address,
          connectedPrinterName: device.device_name || 'Thermal Printer',
        })
      );
      Alert.alert('Connected', `Successfully paired with printer: ${device.device_name || 'Thermal Printer'}`);
    } catch (err) {
      console.log('Connection error:', err);
      Alert.alert(
        'Connection Failed',
        `Could not connect to ${device.device_name || 'Thermal Printer'}. Please check if the printer is already paired or try restarting it.`
      );
    } finally {
      setScanning(false);
    }
  };

  const handleTestPrint = async () => {
    if (!settings.connectedPrinterAddress) {
      Alert.alert('Printer Required', 'Please connect a Bluetooth printer before printing a test slip.');
      return;
    }
    try {
      Alert.alert('Printing Slip', 'Sending self-test slip to thermal printer...');
      await PrinterService.printReceipt([], 0, 0, 0);
    } catch (error) {
      Alert.alert('Test Failed', 'No printer response. Verify Bluetooth power is turned on and paired.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.pageTitle}>System Settings</Text>
        <Text style={styles.pageSubtitle}>Configure printing terminals, tax, and branding profile</Text>

        {/* Backup & Restore Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>📂 Backup & Restore (Offline Share)</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Export Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={exportDate}
              onChangeText={setExportDate}
              placeholder="e.g. 2026-05-27"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>
          <View style={styles.rowBetween}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.primary }]} onPress={handleExport}>
              <Text style={styles.actionBtnText}>📤 Export Data</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.success }]} onPress={handleImport}>
              <Text style={styles.actionBtnText}>📥 Import Data</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.toggleDesc}>
            Exported JSON files can be shared via WhatsApp/Bluetooth and imported on another device.
          </Text>
        </View>

        {/* Shop Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>🏢 Shop Invoice Profile</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Shop Name</Text>
            <TextInput
              style={styles.input}
              value={shopName}
              onChangeText={setShopName}
              placeholder="e.g. O3 Retail Hub"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Shop Address</Text>
            <TextInput
              style={styles.input}
              value={shopAddress}
              onChangeText={setShopAddress}
              placeholder="e.g. No. 12, Galle Road, Colombo"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Telephone Number</Text>
            <TextInput
              style={styles.input}
              value={shopPhone}
              onChangeText={setShopPhone}
              placeholder="e.g. 077 123 4567"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="phone-pad"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>GST / Tax Registry ID</Text>
            <TextInput
              style={styles.input}
              value={shopGstNumber}
              onChangeText={setShopGstNumber}
              placeholder="e.g. GST-O3-4567"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>
        </View>

        {/* Invoice Display Settings Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>🧾 Invoice Display Options</Text>
          
          <View style={[styles.rowBetween, styles.toggleContainer]}>
            <View style={{ flex: 0.8 }}>
              <Text style={styles.toggleLabel}>Show Discount</Text>
              <Text style={styles.toggleDesc}>Display the discount amount applied on the receipt</Text>
            </View>
            <Switch
              value={showDiscountOnInvoice}
              onValueChange={setShowDiscountOnInvoice}
              trackColor={{ false: '#CBD5E1', true: COLORS.primary }}
              thumbColor={Platform.OS === 'ios' ? undefined : '#FFFFFF'}
            />
          </View>

          <View style={[styles.rowBetween, styles.toggleContainer]}>
            <View style={{ flex: 0.8 }}>
              <Text style={styles.toggleLabel}>List Products Separately</Text>
              <Text style={styles.toggleDesc}>Print each product on a new line instead of grouping by quantity</Text>
            </View>
            <Switch
              value={listProductsSeparately}
              onValueChange={setListProductsSeparately}
              trackColor={{ false: '#CBD5E1', true: COLORS.primary }}
              thumbColor={listProductsSeparately ? COLORS.textWhite : '#f4f3f4'}
            />
          </View>

          <View style={[styles.rowBetween, styles.toggleContainer]}>
            <View style={{ flex: 0.8 }}>
              <Text style={styles.toggleLabel}>Show Customer Details</Text>
              <Text style={styles.toggleDesc}>Print customer name, phone, email, and address on the receipt</Text>
            </View>
            <Switch
              value={showCustomerDetailsOnInvoice}
              onValueChange={setShowCustomerDetailsOnInvoice}
              trackColor={{ false: '#CBD5E1', true: COLORS.primary }}
              thumbColor={showCustomerDetailsOnInvoice ? COLORS.textWhite : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Tax and Finance Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>💸 GST / SST Format Config</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Active Tax Schema</Text>
            <View style={styles.typeSelectorRow}>
              {['GST', 'SST', 'VAT', 'None'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.selectorTab, taxType === type && styles.selectorTabActive]}
                  onPress={() => setTaxType(type)}
                >
                  <Text style={[styles.selectorText, taxType === type && styles.selectorTextActive]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {taxType !== 'None' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tax Rate (%)</Text>
              <TextInput
                style={styles.input}
                value={taxRateInput}
                onChangeText={setTaxRateInput}
                placeholder="e.g. 8"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
              />
            </View>
          )}

          <View style={[styles.rowBetween, styles.toggleContainer]}>
            <View>
              <Text style={styles.toggleLabel}>Inclusive Tax Mode</Text>
              <Text style={styles.toggleDesc}>Calculate tax inside prices instead of on-top</Text>
            </View>
            <Switch
              value={taxInclusive}
              onValueChange={setTaxInclusive}
              trackColor={{ false: '#CBD5E1', true: COLORS.primary }}
              thumbColor={Platform.OS === 'ios' ? undefined : '#FFFFFF'}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Primary Currency</Text>
            <View style={styles.typeSelectorRow}>
              {['Rs.', '₹', '$', 'RM'].map((curr) => (
                <TouchableOpacity
                  key={curr}
                  style={[styles.selectorTab, currency === curr && styles.selectorTabActive]}
                  onPress={() => setCurrency(curr)}
                >
                  <Text style={[styles.selectorText, currency === curr && styles.selectorTextActive]}>
                    {curr}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Save button for settings */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveSettings}>
          <Text style={styles.saveBtnText}>💾 Apply Profile & Finance Settings</Text>
        </TouchableOpacity>

        {/* Bluetooth Thermal Printer Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>🖨 Bluetooth Printer Settings</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Receipt Paper Format</Text>
            <View style={styles.typeSelectorRow}>
              {['58mm', '80mm'].map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.selectorTab,
                    settings.printerSize === size && styles.selectorTabActive,
                  ]}
                  onPress={() => dispatch(updateSettings({ printerSize: size }))}
                >
                  <Text
                    style={[
                      styles.selectorText,
                      settings.printerSize === size && styles.selectorTextActive,
                    ]}
                  >
                    🎫 {size} Size
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.printerStatusTitle}>Connection Status</Text>
              <Text style={settings.connectedPrinterAddress ? styles.printerStatusConnected : styles.printerStatusDisconnected}>
                {settings.connectedPrinterAddress ? `🟢 Connected: ${settings.connectedPrinterName}` : '🔴 Not Connected'}
              </Text>
              {settings.connectedPrinterAddress !== '' && (
                <Text style={styles.printerAddress}>MAC: {settings.connectedPrinterAddress}</Text>
              )}
            </View>
            <TouchableOpacity 
              style={[styles.testBtn, !settings.connectedPrinterAddress && styles.disabledTestBtn]} 
              onPress={handleTestPrint}
              disabled={!settings.connectedPrinterAddress}
            >
              <Text style={[styles.testBtnText, !settings.connectedPrinterAddress && styles.disabledTestBtnText]}>Test Slip</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.scanBtn, scanning && styles.disabledBtn]}
            onPress={handleScanPrinters}
            disabled={scanning}
          >
            {scanning ? (
              <ActivityIndicator color={COLORS.textWhite} size="small" />
            ) : (
              <Text style={styles.scanBtnText}>🔍 Scan for Bluetooth Printers</Text>
            )}
          </TouchableOpacity>

          {/* List of discovered devices */}
          {devices.length > 0 && (
            <View style={styles.devicesBox}>
              <Text style={styles.devicesBoxTitle}>Discovered Devices</Text>
              {devices.map((device, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.deviceRow,
                    settings.connectedPrinterAddress === device.address && styles.activeDeviceRow,
                  ]}
                  onPress={() => handleConnectPrinter(device)}
                >
                  <View>
                    <Text style={styles.deviceName}>🖨 {device.device_name || 'Generic BLE Printer'}</Text>
                    <Text style={styles.deviceAddress}>{device.address}</Text>
                  </View>
                  <Text style={styles.connectPill}>
                    {settings.connectedPrinterAddress === device.address ? 'Connected' : 'Connect'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.footerBranding}>
          <Text style={styles.footerLogo}>O₃ POS SYSTEM</Text>
          <Text style={styles.footerCopyright}>© 2026 O3 Professional. All rights reserved.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightBg,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.textDark,
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
    marginBottom: 20,
  },
  card: {
    backgroundColor: COLORS.lightCard,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.small,
  },
  cardHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 16,
    letterSpacing: -0.2,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 14,
    color: COLORS.textDark,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
  },
  selectorTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  selectorTabActive: {
    backgroundColor: COLORS.lightCard,
    ...SHADOWS.small,
  },
  selectorText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  selectorTextActive: {
    color: COLORS.textDark,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginVertical: 10,
  },
  toggleLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  toggleDesc: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
    lineHeight: 14,
  },
  actionBtn: {
    flex: 0.48,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  actionBtnText: {
    color: COLORS.textWhite,
    fontWeight: '800',
    fontSize: 13,
  },
  saveBtn: {
    backgroundColor: COLORS.darkBg,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20,
    ...SHADOWS.medium,
  },
  saveBtnText: {
    color: COLORS.textWhite,
    fontWeight: '800',
    fontSize: 14,
  },
  printerStatusTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  printerStatusConnected: {
    fontSize: 13,
    color: COLORS.success,
    fontWeight: '600',
    marginTop: 4,
  },
  printerStatusDisconnected: {
    fontSize: 13,
    color: COLORS.danger,
    fontWeight: '600',
    marginTop: 4,
  },
  printerAddress: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  testBtn: {
    borderColor: COLORS.primary,
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  disabledTestBtn: {
    borderColor: '#CBD5E1',
  },
  testBtnText: {
    color: COLORS.primaryDark,
    fontSize: 12,
    fontWeight: '700',
  },
  disabledTestBtnText: {
    color: '#94A3B8',
  },
  scanBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  scanBtnText: {
    color: COLORS.textWhite,
    fontSize: 13,
    fontWeight: '800',
  },
  disabledBtn: {
    opacity: 0.6,
  },
  devicesBox: {
    marginTop: 18,
    borderTopWidth: 1,
    borderColor: COLORS.borderLight,
    paddingTop: 14,
  },
  devicesBoxTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 10,
  },
  deviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  activeDeviceRow: {
    borderColor: COLORS.primary,
    backgroundColor: '#F0F9FF',
  },
  deviceName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  deviceAddress: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  connectPill: {
    backgroundColor: COLORS.accentLight,
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: '800',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    overflow: 'hidden',
  },
  footerBranding: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  footerLogo: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.textMuted,
    letterSpacing: 2,
  },
  footerCopyright: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
  },
});

export default SettingsScreen;

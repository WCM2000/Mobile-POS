import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
  Share,
  Alert,
  TextInput,
  Platform,
} from 'react-native';
import { useSelector } from 'react-redux';
import { getDb } from '../services/LocalDbService';
import PrinterService from '../services/PrinterService';
import { COLORS, SHADOWS } from '../utils/styles';

const { width } = Dimensions.get('window');

const ReportsScreen = () => {
  const settings = useSelector((state) => state.settings);

  // States
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All'); // All, Cash Bill, Open Invoice
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const db = getDb();
      if (!db) return;
      
      const data = await db.getAllAsync('SELECT * FROM invoices ORDER BY id DESC');
      
      // Parse items JSON string for each invoice
      const parsedData = data.map(inv => ({
        ...inv,
        items: JSON.parse(inv.items),
        invoiceNumber: `INV-${inv.id.toString().padStart(6, '0')}`,
        createdAt: inv.date, // Alias for date
        grandTotal: inv.total_amount,
        taxAmount: (inv.total_amount * settings.taxRate) / (100 + settings.taxRate), // rough estimate if not stored
        customerName: inv.customer_name,
        invoiceType: 'Cash Bill', // Default or add a column if needed
        status: 'Paid',
      }));

      setInvoices(parsedData);
    } catch (error) {
      console.log('Error fetching invoices:', error);
      Alert.alert('Load Error', 'Failed to retrieve sales reports from local database.');
    } finally {
      setLoading(false);
    }
  };

  // Generate sales summary statistics
  const getStats = () => {
    let totalSales = 0;
    let cashSales = 0;
    let creditSales = 0;
    let totalTax = 0;
    let pendingOutstanding = 0;

    invoices.forEach((inv) => {
      if (inv.status !== 'Cancelled') {
        totalSales += inv.grandTotal;
        totalTax += inv.taxAmount;
        if (inv.invoiceType === 'Open Invoice') {
          creditSales += inv.grandTotal;
          if (inv.status === 'Pending') {
            pendingOutstanding += inv.grandTotal;
          }
        } else {
          cashSales += inv.grandTotal;
        }
      }
    });

    return {
      totalSales,
      cashSales,
      creditSales,
      totalTax,
      pendingOutstanding,
      invoiceCount: invoices.filter(i => i.status !== 'Cancelled').length,
    };
  };

  const stats = getStats();

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      if (invoices.length === 0) {
        Alert.alert('No Data', 'There are no transactions to export.');
        return;
      }

      // 1. Build CSV Header
      let csvContent = 'Invoice Number,Date,Customer Name,Type,Subtotal,Tax Amount,Grand Total,Status\n';

      // 2. Add Invoice Rows
      invoices.forEach((inv) => {
        const dateStr = new Date(inv.date).toLocaleDateString().replace(/,/g, '');
        const custName = (inv.customerName || 'Walk-in').replace(/,/g, '');
        const type = inv.invoiceType || 'Cash Bill';
        csvContent += `${inv.invoiceNumber},${dateStr},${custName},${type},${inv.total_amount},${inv.taxAmount.toFixed(2)},${inv.grandTotal},${inv.status}\n`;
      });

      // 3. Share File via native share sheet
      const result = await Share.share({
        title: 'Daily Sales Report O3 POS',
        message: csvContent,
        url: Platform.OS === 'ios' ? 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent) : undefined,
      });

      if (result.action === Share.sharedAction) {
        Alert.alert('Exported', 'Sales ledger CSV shared successfully!');
      }
    } catch (error) {
      Alert.alert('Export Failed', 'An error occurred while compiling the Excel CSV.');
    } finally {
      setExporting(false);
    }
  };

  const handleReprintReceipt = async (inv) => {
    try {
      Alert.alert('Reprinting', `Resending Invoice ${inv.invoiceNumber} to Bluetooth Printer...`);
      await PrinterService.printReceipt(
        inv.items,
        inv.total_amount - inv.taxAmount,
        inv.taxAmount,
        inv.total_amount
      );
    } catch (err) {
      Alert.alert('Print Error', 'Thermal printer could not be reached.');
    }
  };

  const handleCancelInvoice = async (invId) => {
    Alert.alert(
      'Void Transaction',
      'Are you sure you want to cancel this invoice?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Void',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const db = getDb();
              // In a real app, you'd add a status column to the invoices table
              // For now, let's just delete or mark it if we had a column.
              // Since we don't have a status column yet, let's just delete for this demo
              await db.runAsync('DELETE FROM invoices WHERE id = ?', [invId]);

              Alert.alert('Voided', 'Invoice has been removed.');
              setSelectedInvoice(null);
              fetchInvoices();
            } catch (error) {
              Alert.alert('Cancel Failed', 'Could not void transaction.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.customerName && inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesFilter =
      activeFilter === 'All' ||
      (activeFilter === 'Cash Bill' && inv.invoiceType === 'Cash Bill') ||
      (activeFilter === 'Open Invoice' && inv.invoiceType === 'Open Invoice');

    return matchesSearch && matchesFilter;
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Dashboard Metrics */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View>
            <Text style={styles.title}>Daily Sales Reports</Text>
            <Text style={styles.subtitle}>Track cashier revenue locally</Text>
          </View>
          <TouchableOpacity
            style={[styles.exportBtn, exporting && styles.disabledBtn]}
            onPress={handleExportCSV}
            disabled={exporting}
          >
            {exporting ? (
              <ActivityIndicator color={COLORS.textWhite} size="small" />
            ) : (
              <Text style={styles.exportBtnText}>📊 Export CSV</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Dashboard Stat Cards */}
        <View style={styles.kpiContainer}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>TOTAL SALES</Text>
            <Text style={[styles.kpiValue, { color: COLORS.success }]}>
              {settings.currency}{stats.totalSales.toFixed(2)}
            </Text>
            <Text style={styles.kpiSub}>{stats.invoiceCount} Bills</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>CASH RECEIVED</Text>
            <Text style={[styles.kpiValue, { color: COLORS.primary }]}>
              {settings.currency}{stats.cashSales.toFixed(2)}
            </Text>
            <Text style={styles.kpiSub}>Local Cash</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>TAX COLLECTED</Text>
            <Text style={[styles.kpiValue, { color: COLORS.warning }]}>
              {settings.currency}{stats.totalTax.toFixed(2)}
            </Text>
            <Text style={styles.kpiSub}>Estimated Tax</Text>
          </View>
        </View>
      </View>

      {/* Invoice Filter Controls */}
      <View style={styles.filterSection}>
        <View style={styles.tabsContainer}>
          {['All', 'Cash Bill', 'Open Invoice'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeFilter === tab && styles.tabActive]}
              onPress={() => setActiveFilter(tab)}
            >
              <Text style={[styles.tabText, activeFilter === tab && styles.tabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          style={styles.searchBar}
          placeholder="🔍 Search by bill ID or customer..."
          placeholderTextColor={COLORS.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Transaction List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.loadingText}>Fetching local logs...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredInvoices}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => {
            const isCancelled = item.status === 'Cancelled';
            const isPending = item.status === 'Pending';
            const isPaid = item.status === 'Paid';

            return (
              <TouchableOpacity
                style={[styles.invoiceCard, selectedInvoice?.id === item.id && styles.selectedCard]}
                onPress={() => setSelectedInvoice(selectedInvoice?.id === item.id ? null : item)}
              >
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.invoiceNum}>{item.invoiceNumber}</Text>
                    <Text style={styles.invoiceDate}>
                      {new Date(item.date).toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.badgeRow}>
                    <View style={[styles.typePill, { backgroundColor: item.invoiceType === 'Open Invoice' ? '#EEF2F6' : '#E0F2FE' }]}>
                      <Text style={[styles.typePillText, { color: item.invoiceType === 'Open Invoice' ? COLORS.textMuted : COLORS.primaryDark }]}>
                        {item.invoiceType || 'Cash Bill'}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        isCancelled && { backgroundColor: '#FEE2E2' },
                        isPending && { backgroundColor: '#FEF3C7' },
                        isPaid && { backgroundColor: '#D1FAE5' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          isCancelled && { color: COLORS.danger },
                          isPending && { color: COLORS.warning },
                          isPaid && { color: COLORS.success },
                        ]}
                      >
                        {item.status}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.cardDivider} />

                <View style={styles.cardBody}>
                  <Text style={styles.custName}>👤 {item.customerName || 'Walk-in Customer'}</Text>
                  <Text style={styles.grandTotal}>
                    {settings.currency}{item.grandTotal.toFixed(2)}
                  </Text>
                </View>

                {/* Expanded details & quick actions when tapped */}
                {selectedInvoice?.id === item.id && (
                  <View style={styles.expandedSection}>
                    <View style={styles.itemDetailTitleRow}>
                      <Text style={styles.detailsTitle}>Items Purchased:</Text>
                    </View>
                    
                    {item.items.map((it, idx) => (
                      <View key={idx} style={styles.purchasedItemRow}>
                        <Text style={styles.purchasedItemName}>{it.name} x {it.quantity}</Text>
                        <Text style={styles.purchasedItemPrice}>
                          {settings.currency}{(it.price * it.quantity).toFixed(2)}
                        </Text>
                      </View>
                    ))}

                    <View style={styles.actionsPanel}>
                      <TouchableOpacity
                        style={styles.actionBtnReprint}
                        onPress={() => handleReprintReceipt(item)}
                      >
                        <Text style={styles.actionText}>🖨 Reprint Receipt</Text>
                      </TouchableOpacity>
                      {!isCancelled && (
                        <TouchableOpacity
                          style={styles.actionBtnCancel}
                          onPress={() => handleCancelInvoice(item.id)}
                        >
                          <Text style={[styles.actionText, { color: COLORS.danger }]}>✕ Void Bill</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No matching sales reports found.</Text>
              <Text style={styles.emptySubText}>Process bills in the POS tab to view analytics.</Text>
            </View>
          }
          refreshing={loading}
          onRefresh={fetchInvoices}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightBg,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.textMuted,
    fontSize: 14,
  },
  header: {
    backgroundColor: COLORS.darkBg,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    ...SHADOWS.large,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.textWhite,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  exportBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  exportBtnText: {
    color: COLORS.textWhite,
    fontSize: 12,
    fontWeight: '800',
  },
  kpiContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  kpiCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    padding: 12,
    width: (width - 48) / 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  kpiLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  kpiValue: {
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 4,
  },
  kpiSub: {
    fontSize: 9,
    color: COLORS.textMuted,
  },
  filterSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#EEF2F6',
    borderRadius: 10,
    padding: 3,
    marginBottom: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: COLORS.lightCard,
    ...SHADOWS.small,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  tabTextActive: {
    color: COLORS.textDark,
  },
  searchBar: {
    backgroundColor: COLORS.lightCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: 14,
    color: COLORS.textDark,
  },
  invoiceCard: {
    backgroundColor: COLORS.lightCard,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.small,
  },
  selectedCard: {
    borderColor: COLORS.primary,
    borderWidth: 1.5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invoiceNum: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  invoiceDate: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typePill: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginRight: 6,
  },
  typePillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  custName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  grandTotal: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  expandedSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 6,
  },
  purchasedItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  purchasedItemName: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  purchasedItemPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  actionsPanel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    paddingTop: 10,
  },
  actionBtnReprint: {
    backgroundColor: '#EEF2F6',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actionBtnCancel: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actionText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  emptySubText: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 5,
  },
});

export default ReportsScreen;

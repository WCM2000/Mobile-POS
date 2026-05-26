import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { addToCart, removeFromCart, updateQuantity, applyCartConfig, clearCart } from '../redux/cartSlice';
import PrinterService from '../services/PrinterService';
import { COLORS, SHADOWS } from '../utils/styles';
import { getProductsLocal, getDb, addInvoiceLocal } from '../services/LocalDbService';

const { width, height } = Dimensions.get('window');
const isTablet = width > 768;

const PosBillingScreen = () => {
  const dispatch = useDispatch();
  
  // Redux States
  const { items, subTotal, discountAmount, taxRate, taxInclusive, taxAmount, grandTotal } = useSelector((state) => state.cart);
  const settings = useSelector((state) => state.settings);

  // Component States
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  
  // Billing Configs
  const [invoiceType, setInvoiceType] = useState('Cash Bill'); // Cash Bill or Open Invoice
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [discountInput, setDiscountInput] = useState('');
  
  // Modals
  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [addCustomerLoading, setAddCustomerLoading] = useState(false);

  // Sync settings with cart slice config
  useEffect(() => {
    dispatch(
      applyCartConfig({
        taxRate: settings.taxRate,
        taxInclusive: settings.taxInclusive,
      })
    );
  }, [settings.taxRate, settings.taxInclusive]);

  // Load products & customers
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const db = getDb();
      if (!db) return;

      const [prods, custs] = await Promise.all([
        getProductsLocal(),
        db.getAllAsync('SELECT * FROM customers'),
      ]);
      setProducts(prods);
      setCustomers(custs);
    } catch (error) {
      console.log('Fetch error:', error);
      Alert.alert('Load Failed', 'Failed to retrieve inventory items or customers.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyDiscount = () => {
    const discountVal = parseFloat(discountInput) || 0;
    if (discountVal < 0 || discountVal > subTotal) {
      Alert.alert('Invalid Discount', 'Discount amount must be between 0 and the subtotal.');
      return;
    }
    dispatch(applyCartConfig({ discountAmount: discountVal }));
  };

  const handleQuickAddCustomer = async () => {
    if (!newCustomerName || !newCustomerPhone) {
      Alert.alert('Missing Fields', 'Please enter customer name and phone.');
      return;
    }
    try {
      setAddCustomerLoading(true);
      const db = getDb();
      await db.runAsync(
        'INSERT INTO customers (name, phone) VALUES (?, ?)',
        [newCustomerName, newCustomerPhone]
      );
      
      const updatedCusts = await db.getAllAsync('SELECT * FROM customers');
      setCustomers(updatedCusts);
      
      const newCust = updatedCusts.find(c => c.phone === newCustomerPhone);
      setSelectedCustomer(newCust);
      
      setNewCustomerName('');
      setNewCustomerPhone('');
      setCustomerModalVisible(false);
      Alert.alert('Success', 'Customer registered and selected!');
    } catch (error) {
      Alert.alert('Registration Failed', 'Could not create customer.');
    } finally {
      setAddCustomerLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (items.length === 0) {
      Alert.alert('Empty Cart', 'Add some items to build a bill.');
      return;
    }

    if (invoiceType === 'Open Invoice' && !selectedCustomer) {
      Alert.alert('Customer Required', 'An open invoice must be linked to a customer for tracking outstanding credit.');
      return;
    }

    try {
      setCheckoutLoading(true);

      const invoiceNum = `INV-${Date.now().toString().slice(-6)}`;

      // 1. Save to Local Database
      await addInvoiceLocal(
        selectedCustomer ? selectedCustomer.name : 'Walk-in Customer',
        grandTotal,
        discountAmount,
        items.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        }))
      );

      // 2. Update stock levels in local DB
      const db = getDb();
      await db.withTransactionAsync(async () => {
        for (const item of items) {
          await db.runAsync(
            'UPDATE products SET stock = stock - ? WHERE id = ?',
            [item.quantity, item.id]
          );
        }
      });

      // 3. Print Thermal Receipt
      try {
        await PrinterService.printReceipt(items, subTotal, taxAmount, grandTotal);
      } catch (printError) {
        console.log('Printing error:', printError);
        Alert.alert('Print Alert', 'Invoice saved locally, but thermal printer did not reply.');
      }

      Alert.alert('Success', `${invoiceType} finalized successfully!`);
      
      // Clear Cart and reset variables
      dispatch(clearCart());
      setSelectedCustomer(null);
      setDiscountInput('');
      fetchData(); // Refresh product inventory stock counts
    } catch (error) {
      console.log('Checkout failed:', error);
      Alert.alert('Checkout Failed', 'Could not complete transaction.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCartQuantity = (productId) => {
    const cartItem = items.find(i => i.id === productId);
    return cartItem ? cartItem.quantity : 0;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Upper Terminal Control Panel */}
      <View style={styles.terminalHeader}>
        {/* Toggle Invoice Type */}
        <View style={styles.typeSwitcher}>
          <TouchableOpacity
            style={[styles.switchTab, invoiceType === 'Cash Bill' && styles.switchTabActive]}
            onPress={() => setInvoiceType('Cash Bill')}
          >
            <Text style={[styles.switchText, invoiceType === 'Cash Bill' && styles.switchTextActive]}>
              💵 Cash Bill
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.switchTab, invoiceType === 'Open Invoice' && styles.switchTabActive]}
            onPress={() => setInvoiceType('Open Invoice')}
          >
            <Text style={[styles.switchText, invoiceType === 'Open Invoice' && styles.switchTextActive]}>
              📝 Open Invoice
            </Text>
          </TouchableOpacity>
        </View>

        {/* Customer Selector Trigger */}
        <TouchableOpacity
          style={styles.customerSelector}
          onPress={() => setCustomerModalVisible(true)}
        >
          <Text style={styles.customerSelectorLabel}>Customer:</Text>
          <Text style={styles.customerSelectorValue} numberOfLines={1}>
            {selectedCustomer ? `👤 ${selectedCustomer.name}` : '🌐 Walk-in Customer (Select)'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Terminal Area */}
      <View style={[styles.mainArea, isTablet && styles.mainAreaTablet]}>
        {/* Left Side: Product Grid */}
        <View style={styles.catalogSection}>
          <View style={styles.searchBarContainer}>
            <TextInput
              style={styles.searchBar}
              placeholder="🔍 Search items by name..."
              placeholderTextColor={COLORS.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {loading ? (
            <View style={styles.centeredLoading}>
              <ActivityIndicator color={COLORS.primary} size="large" />
              <Text style={styles.loadingText}>Syncing stock catalogue...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredProducts}
              keyExtractor={(item) => item.id.toString()}
              numColumns={isTablet ? 3 : 2}
              renderItem={({ item }) => {
                const qtyInCart = getCartQuantity(item.id);
                return (
                  <View style={[styles.productCard, qtyInCart > 0 && styles.activeProductCard]}>
                    <Text style={styles.prodName} numberOfLines={2}>{item.name}</Text>
                    <Text style={styles.prodPrice}>{settings.currency}{item.price.toFixed(2)}</Text>
                    <Text style={styles.prodStock}>Stock: {item.stock}</Text>
                    
                    {qtyInCart > 0 ? (
                      <View style={styles.counterRow}>
                        <TouchableOpacity
                          style={styles.counterBtn}
                          onPress={() => dispatch(updateQuantity({ id: item.id, quantity: qtyInCart - 1 }))}
                        >
                          <Text style={styles.counterBtnText}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.counterValue}>{qtyInCart}</Text>
                        <TouchableOpacity
                          style={styles.counterBtn}
                          onPress={() => dispatch(addToCart({ ...item, id: item.id }))}
                        >
                          <Text style={styles.counterBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.addBtn}
                        onPress={() => dispatch(addToCart({ ...item, id: item.id }))}
                      >
                        <Text style={styles.addBtnText}>ADD TO BILL</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No catalog items found.</Text>
                  <Text style={styles.emptySubText}>Add products in the Item Management tab.</Text>
                </View>
              }
              contentContainerStyle={{ paddingBottom: 100 }}
            />
          )}
        </View>

        {/* Right Side: Cart Summary */}
        <View style={styles.cartSection}>
          <Text style={styles.cartSectionTitle}>Invoice Cart Items</Text>
          
          <FlatList
            data={items}
            keyExtractor={(item) => item.id.toString()}
            style={styles.cartList}
            contentContainerStyle={{ paddingBottom: 20 }}
            renderItem={({ item }) => (
              <View style={styles.cartItemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cartItemName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.cartItemPrice}>
                    {item.quantity} x {settings.currency}{item.price.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.cartRowRight}>
                  <Text style={styles.cartItemTotal}>
                    {settings.currency}{(item.price * item.quantity).toFixed(2)}
                  </Text>
                  <TouchableOpacity
                    style={styles.cartRemoveBtn}
                    onPress={() => dispatch(removeFromCart(item.id))}
                  >
                    <Text style={styles.cartRemoveText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyCartContainer}>
                <Text style={styles.emptyCartText}>Cart is currently empty.</Text>
                <Text style={styles.emptyCartSub}>Tap items on the left to add them here.</Text>
              </View>
            }
          />

          {/* Discount and Financial Summary */}
          <View style={styles.billCalculationArea}>
            {/* Discount Panel */}
            <View style={styles.discountRow}>
              <TextInput
                style={styles.discountInput}
                placeholder="Discount amount"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
                value={discountInput}
                onChangeText={setDiscountInput}
              />
              <TouchableOpacity style={styles.discountApplyBtn} onPress={handleApplyDiscount}>
                <Text style={styles.discountApplyText}>Apply</Text>
              </TouchableOpacity>
            </View>

            {/* Calculations Breakdown */}
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Subtotal</Text>
              <Text style={styles.calcValue}>{settings.currency}{subTotal.toFixed(2)}</Text>
            </View>
            {discountAmount > 0 && (
              <View style={styles.calcRow}>
                <Text style={[styles.calcLabel, { color: COLORS.danger }]}>Discount</Text>
                <Text style={[styles.calcValue, { color: COLORS.danger }]}>-{settings.currency}{discountAmount.toFixed(2)}</Text>
              </View>
            )}
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>
                {settings.taxType} ({settings.taxRate}%) {taxInclusive ? 'Incl.' : ''}
              </Text>
              <Text style={styles.calcValue}>{settings.currency}{taxAmount.toFixed(2)}</Text>
            </View>
            <View style={[styles.calcRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>Grand Total</Text>
              <Text style={styles.grandTotalValue}>{settings.currency}{grandTotal.toFixed(2)}</Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.checkoutActionRow}>
              <TouchableOpacity
                style={[styles.checkoutBtn, checkoutLoading && styles.disabledCheckout]}
                onPress={handleCheckout}
                disabled={checkoutLoading}
              >
                {checkoutLoading ? (
                  <ActivityIndicator color={COLORS.textWhite} />
                ) : (
                  <Text style={styles.checkoutBtnText}>
                    {invoiceType === 'Open Invoice' ? '⚡ ISSUE OPEN INVOICE' : '💳 PAY & PRINT RECEIPT'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Customer Selection Modal */}
      <Modal
        visible={customerModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCustomerModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Customer</Text>
              <TouchableOpacity onPress={() => setCustomerModalVisible(false)}>
                <Text style={styles.modalCloseIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* List existing customers */}
            <Text style={styles.modalSubheading}>Existing Customers</Text>
            <ScrollView style={styles.customerListScroll}>
              <TouchableOpacity
                style={[styles.customerItem, !selectedCustomer && styles.activeCustomerItem]}
                onPress={() => {
                  setSelectedCustomer(null);
                  setCustomerModalVisible(false);
                }}
              >
                <Text style={styles.customerItemName}>🌐 Walk-in Customer (General)</Text>
                <Text style={styles.customerItemPhone}>No ledger tracking</Text>
              </TouchableOpacity>

              {customers.map((c) => (
                <TouchableOpacity
                  key={c.id.toString()}
                  style={[styles.customerItem, selectedCustomer?.id === c.id && styles.activeCustomerItem]}
                  onPress={() => {
                    setSelectedCustomer(c);
                    setCustomerModalVisible(false);
                  }}
                >
                  <Text style={styles.customerItemName}>👤 {c.name}</Text>
                  <Text style={styles.customerItemPhone}>
                    📞 {c.phone}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Quick Create Customer */}
            <View style={styles.quickAddCustomerBox}>
              <Text style={styles.modalSubheading}>⚡ Register New Customer</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Full Name"
                placeholderTextColor={COLORS.textMuted}
                value={newCustomerName}
                onChangeText={setNewCustomerName}
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Phone Number"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="phone-pad"
                value={newCustomerPhone}
                onChangeText={setNewCustomerPhone}
              />
              <TouchableOpacity
                style={[styles.modalAddBtn, addCustomerLoading && styles.disabledCheckout]}
                onPress={handleQuickAddCustomer}
                disabled={addCustomerLoading}
              >
                {addCustomerLoading ? (
                  <ActivityIndicator color={COLORS.textWhite} size="small" />
                ) : (
                  <Text style={styles.modalAddBtnText}>Save & Select Customer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightBg,
  },
  centeredLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textMuted,
  },
  terminalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.darkBg,
    borderBottomWidth: 1,
    borderColor: COLORS.borderDark,
  },
  typeSwitcher: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    padding: 3,
  },
  switchTab: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  switchTabActive: {
    backgroundColor: COLORS.primary,
  },
  switchText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  switchTextActive: {
    color: COLORS.textWhite,
  },
  customerSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    maxWidth: width * 0.45,
  },
  customerSelectorLabel: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
    marginRight: 6,
  },
  customerSelectorValue: {
    color: COLORS.textWhite,
    fontSize: 13,
    fontWeight: '600',
  },
  mainArea: {
    flex: 1,
    flexDirection: 'column',
  },
  mainAreaTablet: {
    flexDirection: 'row',
  },
  catalogSection: {
    flex: 0.65,
    padding: 12,
  },
  searchBarContainer: {
    marginBottom: 12,
  },
  searchBar: {
    backgroundColor: COLORS.lightCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: 15,
    color: COLORS.textDark,
  },
  productCard: {
    flex: 1,
    backgroundColor: COLORS.lightCard,
    borderRadius: 16,
    padding: 14,
    margin: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    minHeight: 155,
    ...SHADOWS.small,
  },
  activeProductCard: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    backgroundColor: '#F0F9FF',
  },
  prodName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
    textAlign: 'center',
    marginBottom: 6,
    height: 38,
  },
  prodPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primaryDark,
    marginBottom: 2,
  },
  prodStock: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 10,
  },
  addBtn: {
    backgroundColor: COLORS.darkBg,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  addBtnText: {
    color: COLORS.textWhite,
    fontSize: 11,
    fontWeight: '800',
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: '#E0F2FE',
    borderRadius: 8,
    padding: 2,
  },
  counterBtn: {
    backgroundColor: COLORS.primary,
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterBtnText: {
    color: COLORS.textWhite,
    fontWeight: '900',
    fontSize: 16,
  },
  counterValue: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
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

  // Cart summary styling
  cartSection: {
    flex: 0.35,
    backgroundColor: COLORS.lightCard,
    borderLeftWidth: 1,
    borderColor: COLORS.borderLight,
    padding: 16,
    justifyContent: 'space-between',
  },
  cartSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 12,
    borderBottomWidth: 1.5,
    borderColor: COLORS.borderLight,
    paddingBottom: 8,
  },
  cartList: {
    flex: 1,
    marginBottom: 12,
  },
  cartItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  cartItemPrice: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  cartRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartItemTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
    marginRight: 10,
  },
  cartRemoveBtn: {
    backgroundColor: '#FEE2E2',
    width: 22,
    height: 22,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartRemoveText: {
    color: COLORS.danger,
    fontSize: 10,
    fontWeight: '900',
  },
  emptyCartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyCartText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  emptyCartSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  billCalculationArea: {
    borderTopWidth: 1.5,
    borderColor: COLORS.borderLight,
    paddingTop: 12,
  },
  discountRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  discountInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 13,
    color: COLORS.textDark,
  },
  discountApplyBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    paddingHorizontal: 14,
    justifyContent: 'center',
    marginLeft: 8,
  },
  discountApplyText: {
    color: COLORS.textWhite,
    fontWeight: '700',
    fontSize: 13,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  calcLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  calcValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  grandTotalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  grandTotalValue: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.success,
  },
  checkoutBtn: {
    backgroundColor: COLORS.success,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
    ...SHADOWS.medium,
  },
  disabledCheckout: {
    backgroundColor: '#A7F3D0',
  },
  checkoutBtnText: {
    color: COLORS.textWhite,
    fontSize: 14,
    fontWeight: '800',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.lightCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: height * 0.85,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: COLORS.borderLight,
    paddingBottom: 12,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  modalCloseIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textMuted,
  },
  modalSubheading: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 10,
  },
  customerListScroll: {
    maxHeight: 180,
    marginBottom: 16,
  },
  customerItem: {
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: 10,
    marginBottom: 8,
  },
  activeCustomerItem: {
    borderColor: COLORS.primary,
    backgroundColor: '#F0F9FF',
  },
  customerItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  customerItemPhone: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  quickAddCustomerBox: {
    borderTopWidth: 1,
    borderColor: COLORS.borderLight,
    paddingTop: 16,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 14,
    color: COLORS.textDark,
    marginBottom: 10,
  },
  modalAddBtn: {
    backgroundColor: COLORS.darkBg,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  modalAddBtnText: {
    color: COLORS.textWhite,
    fontWeight: '700',
    fontSize: 14,
  },
});

export default PosBillingScreen;
